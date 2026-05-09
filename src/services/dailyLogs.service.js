/**
 * MCMS Service - Daily Logs
 * CRUD operations for field supervisor daily reports
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const handlers = require('../realtime/handlers');
const { checkGeofence } = require('../utils/geofence');
const notifService = require('./notification.service');
const auditService = require('./audit.service');

async function getAll({ page = 1, limit = 20, projectId, startDate, endDate }) {
  const skip = (page - 1) * limit;
  const where = {};
  if (projectId) where.projectId = projectId;
  if (startDate || endDate) {
    where.logDate = {};
    if (startDate) where.logDate.gte = new Date(startDate);
    if (endDate) where.logDate.lte = new Date(endDate);
  }
  
  const [logs, total] = await Promise.all([
    prisma.dailyLog.findMany({
      skip, take: limit, where,
      orderBy: { logDate: 'desc' },
      include: {
        project: { select: { id: true, code: true, name: true } },
        submitter: { select: { id: true, name: true } },
      },
    }),
    prisma.dailyLog.count({ where }),
  ]);
  
  return { logs, total, page, limit };
}

async function getById(id) {
  const log = await prisma.dailyLog.findUnique({
    where: { id },
    include: {
      project: true,
      submitter: { select: { id: true, name: true, email: true } },
    },
  });
  if (!log) throw new AppError('Daily log not found', 404);
  return log;
}

async function create(data, userId) {
  // Extract progress increment if provided in the payload
  const { progressIncrement, progressCompletion, task_id, submissionLat, submissionLng, expenseItems, assetUsages, materialsConsumed, phaseId, ...logData } = data;

  // Validate geofence
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    select: { id: true, lat: true, lng: true, radius: true, managerId: true, code: true, name: true, budgetTotal: true, budgetSpent: true, currentPhase: true }
  });

  if (!project) throw new AppError('Project not found', 404);

  let locationVerified = false;
  if (submissionLat && submissionLng) {
    const geofenceResult = checkGeofence(
      Number(submissionLat), Number(submissionLng),
      Number(project.lat || 0), Number(project.lng || 0),
      project.radius || 500
    );

    if (!geofenceResult.isWithin) {
      // ENTERPRISE LOGIC: Use Effective Distance (Distance - Accuracy)
      const accuracy = Number(data.submissionAccuracy || 0);
      const effectiveDistance = geofenceResult.distanceMeters - accuracy;
      
      // Desktop Leniency: Apply 250m hardware buffer for non-mobile devices
      const isDesktop = data.deviceType === 'desktop';
      const hardwareBuffer = isDesktop ? 250 : 0;
      const allowedRadius = (project.radius || 500) + hardwareBuffer;

      if (effectiveDistance > allowedRadius) {
        throw new AppError(`Submission rejected: You are outside the project geofence (approx. ${Math.round(effectiveDistance)}m away).`, 400);
      }
      
      logger.info('Geofence boundary pass via Adaptive Buffer', { 
        distance: geofenceResult.distanceMeters, 
        accuracy, 
        effectiveDistance,
        isDesktop
      });
    }

    // --- ANTI-SPOOFING: Temporal Validation ---
    if (data.locationCapturedAt) {
      const capturedAt = new Date(data.locationCapturedAt).getTime();
      const now = Date.now();
      if (now - capturedAt > 120000) { // 2 minutes
        throw new AppError('Submission rejected: Location data is stale (> 2 mins). Please re-sync location.', 400);
      }
    }

    locationVerified = true;
  } else {
    throw new AppError('Location coordinates are required to submit a daily log.', 400);
  }

  // --- HARDENING: Validate Photo Geotags ---
  if (logData.photos && Array.isArray(logData.photos)) {
    // Require at least 3 photos as per FS policy
    if (logData.photos.length < 3) {
      throw new AppError('Evidence required: Please capture at least 3 photos of site progress.', 400);
    }

    for (const photo of logData.photos) {
      if (photo.location && photo.location.lat && photo.location.lng) {
        const photoGeofence = checkGeofence(
          Number(photo.location.lat), Number(photo.location.lng),
          Number(project.lat || 0), Number(project.lng || 0),
          project.radius || 500
        );
        
        if (!photoGeofence.isWithin) {
          throw new AppError(`Evidence rejected: Photo "${photo.name || 'Site Image'}" was captured outside the project site (${Math.round(photoGeofence.distanceMeters)}m away).`, 400);
        }
        
        // Temporal validation (30-min window)
        const photoTime = photo.timestamp;
        const now = Date.now();
        if (photoTime && (now - photoTime > 1800000)) { // 30 minutes
          throw new AppError(`Evidence rejected: Photo "${photo.name || 'Site Image'}" is too old (> 30 mins). Please capture fresh evidence.`, 400);
        }
      } else {
        throw new AppError(`Evidence rejected: Photo "${photo.name || 'Site Image'}" is missing GPS metadata.`, 400);
      }
    }
  } else {
    throw new AppError('Evidence required: Please capture at least 3 photos of site progress.', 400);
  }

  // --- AUTO-DEDUCT MATERIALS FROM SITE INVENTORY ---
  if (materialsConsumed && Array.isArray(materialsConsumed) && materialsConsumed.length > 0) {
    const inventoryService = require('./inventory.service');
    // Find the project's primary sector for inventory deduction
    const projectSectors = await prisma.sector.findMany({ where: { projectId: data.projectId }, take: 1 });
    const primarySectorId = projectSectors[0]?.id;
    
    if (primarySectorId) {
      for (const mat of materialsConsumed) {
        try {
          await inventoryService.consume({
            sectorId: primarySectorId,
            materialName: mat.materialName,
            quantity: Number(mat.quantity),
            reference: `Daily Log - ${phaseId || 'Site Work'}`,
            notes: `[DAILY LOG] Consumed during ${phaseId || 'site work'}. Narrative: ${(logData.narrative || '').substring(0, 80)}`
          }, { id: userId });
          logger.info('Material consumed via daily log', { materialName: mat.materialName, qty: mat.quantity, projectId: data.projectId });
        } catch (matErr) {
          logger.error('Failed to deduct material from inventory', { error: matErr.message, materialName: mat.materialName });
        }
      }
    } else {
      logger.warn('No sectors found for project, skipping material deduction', { projectId: data.projectId });
    }
  }

  const log = await prisma.dailyLog.create({
    data: {
      ...logData,
      task_id: task_id,
      workProgress: progressCompletion || progressIncrement,
      activePhase: phaseId || null,
      submittedBy: userId,
      logDate: new Date(data.logDate),
      submissionLat,
      submissionLng,
      submissionAccuracy: data.submissionAccuracy,
      locationSource: data.locationSource,
      deviceType: data.deviceType,
      locationCapturedAt: data.locationCapturedAt ? new Date(data.locationCapturedAt) : null,
      locationFlagged: data.locationFlagged || false,
      locationVerified,
      ...(expenseItems && expenseItems.length > 0 && {
        expenses: {
          create: expenseItems
        }
      }),
      ...(assetUsages && assetUsages.length > 0 && {
        assetUsages: {
          create: assetUsages.map(u => ({
            assetId: Number(u.assetId),
            operatorName: u.operatorName || 'Site Operator',
            hoursOperated: parseFloat(u.hoursOperated || 0),
            fuelConsumed: 0,
            roleInPhase: u.roleInPhase || phaseId
          }))
        }
      })
    },
    include: {
      project: { select: { id: true, code: true, name: true } },
      submitter: { select: { id: true, name: true } },
    },
  });
  
  logger.info('Daily log created', { logId: log.id, projectId: data.projectId });

  // Notification to all Project Managers (Ensuring PM A and B both receive it)
  await notifService.notifyRole('Project_Manager', {
    type: 'info', 
    icon: 'fa-clipboard-check',
    title: 'New Daily Log Submitted',
    message: `${log.submitter.name} submitted a log for ${log.project.code} on ${new Date(log.logDate).toLocaleDateString()}.`,
    link: `/dashboard.html?page=daily_logs&projectId=${log.projectId}&logId=${log.id}`
  });

  // Audit Log
  const user = await prisma.user.findUnique({ where: { id: userId } });
  await auditService.log({
    userId, userName: user?.name, userRole: user?.role,
    action: 'CREATE_DAILY_LOG', targetType: 'DailyLog', targetId: log.id, targetCode: log.project.code,
    details: { logDate: log.logDate, isSos: log.isSos }
  });
  
  // ALGORITHMIC FIX: Sync Daily Log Work to Gantt Task
  if (task_id && progressIncrement) {
    try {
      const task = await prisma.task.findUnique({ where: { id: parseInt(task_id, 10) }});
      if (task) {
        // Calculate accrued progress mathematically
        const currentProgress = Number(task.progress || 0);
        let updatedProgress = currentProgress + Number(progressIncrement);
        if (updatedProgress > 100) updatedProgress = 100;

        await prisma.task.update({
          where: { id: task.id },
          data: { progress: updatedProgress }
        });
        logger.info('Task progress synced from Daily Log', { taskId: task.id, newProgress: updatedProgress });
      }
    } catch (e) {
      logger.error('Failed to sync progress from Daily Log to Task', { error: e.message });
    }
  }

  // Emit SOS alert if flagged
  if (log.isSos) {
    handlers.emitSosAlert(log);
    logger.warn('SOS alert triggered', { logId: log.id, projectId: log.projectId });
  }
  
  return log;
}

async function approve(id, approverId) {
  const log = await prisma.dailyLog.update({
    where: { id },
    data: {
      pmApproved: true,
      pmApprovedAt: new Date(),
      status: 'approved',
    },
  });
  logger.info('Daily log approved', { logId: id, approverId });
  
  // Notification to Submitter
  const user = await prisma.user.findUnique({ where: { id: approverId } });
  await notifService.create({
    userId: log.submittedBy,
    type: 'success', icon: 'fa-check-double',
    title: 'Daily Log Approved',
    message: `Your log for ${log.logDate.toLocaleDateString()} has been approved by ${user?.name || 'PM'}.`
  });

  // Audit Log
  await auditService.log({
    userId: approverId, userName: user?.name, userRole: user?.role,
    action: 'APPROVE_DAILY_LOG', targetType: 'DailyLog', targetId: id,
    details: { projectId: log.projectId }
  });

  // --- PHASE COMPLETION LOGIC ---
  // If the daily log reported 100% for its phase, advance the project
  if (log.workProgress >= 100 && log.activePhase) {
    try {
      const tasksConfig = require('../config/tasks_config.json');
      const phases = tasksConfig.phases || [];
      const currentIndex = phases.findIndex(p => p.id === log.activePhase);
      
      if (currentIndex !== -1) {
        const completedPhases = currentIndex + 1;
        const totalPhases = phases.length;
        const overallProgress = Math.round((completedPhases / totalPhases) * 100);
        const nextPhase = phases[currentIndex + 1];
        
        await prisma.project.update({
          where: { id: log.projectId },
          data: {
            progress: overallProgress,
            currentPhase: nextPhase ? currentIndex + 2 : currentIndex + 1, // Int: 1-based phase number
            ...(overallProgress >= 100 && { status: 'completed' })
          }
        });

        // Audit log for phase completion
        await auditService.log({
          userId: approverId, userName: user?.name, userRole: user?.role,
          action: 'PHASE_COMPLETED', targetType: 'Project', targetId: log.projectId,
          details: {
            completedPhase: phases[currentIndex].name,
            nextPhase: nextPhase?.name || 'PROJECT COMPLETE',
            overallProgress
          }
        });

        // Notify FS of phase advancement
        await notifService.create({
          userId: log.submittedBy,
          type: 'success', icon: 'fa-flag-checkered',
          title: `Phase Complete: ${phases[currentIndex].name}`,
          message: nextPhase ? `Advancing to ${nextPhase.name}. Overall progress: ${overallProgress}%` : `All phases complete! Project at 100%.`
        });

        logger.info('Phase completed and project advanced', {
          projectId: log.projectId,
          completedPhase: log.phaseId,
          nextPhase: nextPhase?.id,
          overallProgress
        });
      }
    } catch (phaseErr) {
      logger.error('Failed to advance project phase', { error: phaseErr.message });
    }
  }

  return log;
}

async function reject(id, approverId, reason) {
  const log = await prisma.dailyLog.update({
    where: { id },
    data: {
      status: 'rejected',
      rejectionReason: reason,
    },
  });
  logger.info('Daily log rejected', { logId: id, approverId, reason });

  // Notification to Submitter
  const user = await prisma.user.findUnique({ where: { id: approverId } });
  await notifService.create({
    userId: log.submittedBy,
    type: 'error', icon: 'fa-times-circle',
    title: 'Daily Log Rejected',
    message: `Your log for ${log.logDate.toLocaleDateString()} was rejected by ${user?.name || 'PM'}. Reason: ${reason}`
  });

  // Audit trail
  await auditService.log({
    userId: approverId, userName: user?.name, userRole: user?.role,
    action: 'REJECT_DAILY_LOG', targetType: 'DailyLog', targetId: id,
    details: { reason }
  });

  return log;
}

async function getByProjectDate(projectId, date) {
  return prisma.dailyLog.findFirst({
    where: {
      projectId,
      logDate: new Date(date),
    },
    include: {
      submitter: { select: { id: true, name: true } },
    },
  });
}

async function getSosAlerts() {
  return prisma.dailyLog.findMany({
    where: { isSos: true, pmApproved: false },
    include: {
      project: { select: { id: true, code: true, name: true } },
      submitter: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = { getAll, getById, create, approve, reject, getByProjectDate, getSosAlerts };

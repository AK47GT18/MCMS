/**
 * MCMS Service - Daily Logs
 * CRUD operations for field supervisor daily reports
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const handlers = require('../realtime/handlers');

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
  const { progressIncrement, task_id, ...logData } = data;

  const log = await prisma.dailyLog.create({
    data: {
      ...logData,
      task_id: task_id,
      submittedBy: userId,
      logDate: new Date(data.logDate),
    },
    include: {
      project: { select: { id: true, code: true } },
      submitter: { select: { id: true, name: true } },
    },
  });
  
  logger.info('Daily log created', { logId: log.id, projectId: data.projectId });
  
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

  // Audit trail
  if (approverId) {
    const auditService = require('./audit.service');
    await auditService.log(approverId, 'APPROVE_DAILY_LOG', 'DailyLog', id, { projectId: log.projectId }).catch(e => logger.error('Audit log failed', e));
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

  // Audit trail
  if (approverId) {
    const auditService = require('./audit.service');
    await auditService.log(approverId, 'REJECT_DAILY_LOG', 'DailyLog', id, { reason }).catch(e => logger.error('Audit log failed', e));
  }

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

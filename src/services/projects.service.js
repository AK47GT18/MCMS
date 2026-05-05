/**
 * MCMS Service - Projects
 * CRUD operations for project management
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const emailService = require('../emails/email.service');

/**
 * Get all projects with pagination
 * @param {Object} options - Pagination and filter options
 * @returns {Promise<Object>} Paginated projects list
 */
const ALLOWED_SORT_FIELDS = [
  'id', 'code', 'name', 'status', 'contractValue', 
  'budgetTotal', 'budgetSpent', 'startDate', 'endDate', 'createdAt'
];

async function getAll({ page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status, fieldSupervisorId, managerId }) {
  try {
    const skip = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;
    if (fieldSupervisorId) where.fieldSupervisorId = Number(fieldSupervisorId);
    if (managerId) where.managerId = Number(managerId);
    
    // Defensive check for sortBy
    const validSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    
    logger.debug('Fetching all projects', { page, limit, sortBy: validSortBy, sortOrder, status });

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        skip,
        take: limit,
        where,
        orderBy: { [validSortBy]: sortOrder },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          roadSpecification: true,
          _count: {
            select: {
              tasks: true,
              contracts: true,
              issues: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);
    
    const projectsWithUtilization = projects.map(project => {
      const budgetTotal = Number(project.budgetTotal) || 0;
      const budgetSpent = Number(project.budgetSpent) || 0;
      const budgetUtilization = budgetTotal > 0 
        ? parseFloat(((budgetSpent / budgetTotal) * 100).toFixed(2))
        : 0;
      
      return {
        ...project,
        budgetUtilization
      };
    });

    return { projects: projectsWithUtilization, total, page, limit };
  } catch (error) {
    logger.error('Error in projectsService.getAll:', error);
    throw error;
  }
}

/**
 * Get project by ID with full details
 * @param {number} id - Project ID
 * @returns {Promise<Object>} Project with relations
 */
async function getById(id) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      tasks: {
        orderBy: { startDate: 'asc' },
      },
      roadSpecification: {
        include: {
          layers: { orderBy: { phaseNumber: 'asc' } },
          accessories: { orderBy: { category: 'asc' } }
        }
      },
      contracts: true,
      _count: {
        select: {
          dailyLogs: true,
          requisitions: true,
          issues: true,
        },
      },
    },
  });
  
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Calculate aggregate procurement variance from all vendor contracts
  let totalVariance = 0;
  if (project.contracts && project.contracts.length > 0) {
    project.contracts.forEach(contract => {
      try {
        if (contract.materialsList) {
          const items = JSON.parse(contract.materialsList);
          if (Array.isArray(items)) {
            items.forEach(item => {
              totalVariance += (Number(item.variance) || 0);
            });
          }
        }
      } catch (e) {
        // Silently skip malformed JSON
      }
    });
  }
  project.procurementVariance = totalVariance;
  
  return project;
}

/**
 * Get project by code
 * @param {string} code - Project code
 * @returns {Promise<Object>} Project
 */
async function getByCode(code) {
  const project = await prisma.project.findUnique({
    where: { code },
    include: {
      manager: {
        select: { id: true, name: true },
      },
    },
  });
  
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  
  return project;
}

/**
 * Create a new project
 * @param {Object} data - Project data
 * @returns {Promise<Object>} Created project
 */
async function create(data, user) {
  // Validate dates
  const start = new Date(data.startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(data.endDate);
  end.setHours(0, 0, 0, 0);

  if (end <= start) {
    throw new AppError('End date must be after start date', 400);
  }

  // Check if code is unique (Prisma will throw but we can be explicit)
  const existing = await prisma.project.findUnique({ where: { code: data.code } });
  if (existing) {
    throw new AppError(`Project code ${data.code} already exists`, 400);
  }

  const project = await prisma.project.create({
    data: {
      ...data,
      status: 'active',
      budgetSpent: 0,
    },
    include: {
      manager: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Log to Audit Trail
  const auditService = require('./audit.service');
  await auditService.log({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: 'CREATE_PROJECT',
    targetType: 'Project',
    targetId: project.id,
    targetCode: project.code,
    details: { 
        name: project.name, 
        budget: project.budgetTotal, 
        startDate: project.startDate,
        endDate: project.endDate,
        fieldSupervisorId: data.fieldSupervisorId 
    }
  });
  
  logger.info('Project created', { projectId: project.id, code: project.code });

  // ============================================
  // AUTO-GENERATE GANTT TASKS (Road-type-aware)
  // ============================================
  if (data.startDate && data.endDate) {
    try {
      const tasksService = require('./tasks.service');
      // Determine road type: use projectType mapping or default to RT-4
      const roadTypeMap = {
        'road_works': 'RT-4',
        'civil_works': 'RT-2',
        'bridge_construction': 'RT-4',
        'building_works': 'RT-4',
      };
      const roadType = roadTypeMap[data.projectType] || 'RT-4';
      
      const generatedTasks = await tasksService.generateDefaultTasks(
        project.id,
        data.startDate,
        data.endDate,
        roadType
      );
      logger.info('Auto-generated Gantt tasks for new project', {
        projectId: project.id,
        code: project.code,
        roadType,
        tasksCreated: generatedTasks.length,
      });
    } catch (taskError) {
      // Non-blocking: log but don't fail project creation
      logger.error('Failed to auto-generate tasks for project', {
        projectId: project.id,
        error: taskError.message,
      });
    }
  }
  
  // Send notifications to key roles + explicitly to the assigned manager
  try {
    const rolesToNotify = [
      'Finance_Director',
      'Contract_Administrator',
      'Equipment_Coordinator'
    ];
    
    // Fetch users with the specified roles
    const usersToNotify = await prisma.user.findMany({
      where: {
        role: { in: rolesToNotify }
      },
      select: { id: true, name: true, email: true }
    });

    // If a manager is allocated, ensure they are also in the notification list
    if (project.manager && project.manager.email) {
      // Check if they are already in the list to avoid duplicates
      const exists = usersToNotify.some(u => u.id === project.manager.id);
      if (!exists) {
        usersToNotify.push({
          id: project.manager.id,
          name: project.manager.name,
          email: project.manager.email
        });
      }
    }

    // If a field supervisor is allocated, ensure they are also in the notification list
    if (data.fieldSupervisorId) {
      const fs = await prisma.user.findUnique({
        where: { id: data.fieldSupervisorId },
        select: { id: true, name: true, email: true }
      });
      if (fs) {
        const exists = usersToNotify.some(u => u.id === fs.id);
        if (!exists) {
          usersToNotify.push(fs);
        }
      }
    }
    
    if (usersToNotify.length > 0) {
      const title = 'New Project Assigned';
      const message = `A new project "${project.name}" (${project.code}) has been created and assigned. Please review the project details and any associated contracts or requirements.`;
      
      const notificationPromises = usersToNotify.map(user => 
        emailService.sendNotification(user, title, message).catch(err => 
          logger.error('Failed to send project creation email to user', { userId: user.id, error: err.message })
        )
      );
      
      await Promise.all(notificationPromises);
      logger.info('Project creation notifications sent', { projectCode: project.code, recipientCount: usersToNotify.length });
    }
  } catch (error) {
    logger.error('Error sending project creation notifications', { projectCode: project.code, error: error.message });
  }
  
  return project;
}

/**
 * Update project by ID
 * @param {number} id - Project ID
 * @param {Object} data - Update data
 * @param {Object} user - Authenticated user
 * @returns {Promise<Object>} Updated project
 */
async function update(id, data, user) {
  const existingProject = await getById(id);

  // Helper to convert date strings to ISO-8601 DateTime format
  const convertToDateTime = (dateString) => {
    if (!dateString) return undefined;
    if (dateString instanceof Date) return dateString;
    if (typeof dateString === 'string' && dateString.includes('T')) return new Date(dateString);
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return new Date(`${dateString}T00:00:00.000Z`);
    }
    return new Date(dateString);
  };

  const processedData = {
    ...data,
    ...(data.startDate && { startDate: convertToDateTime(data.startDate) }),
    ...(data.endDate && { endDate: convertToDateTime(data.endDate) }),
  };
  
  // Helper to fetch involved parties for notifications
  const getInvolvedParties = async (managerEmail, managerName) => {
    const rolesToNotify = ['Finance_Director', 'Contract_Administrator', 'Equipment_Coordinator'];
    const usersToNotify = await prisma.user.findMany({
      where: { role: { in: rolesToNotify } },
      select: { email: true, name: true }
    });
    
    // Add manager if they have an email and aren't already in the list
    if (managerEmail) {
      if (!usersToNotify.some(u => u.email === managerEmail)) {
        usersToNotify.push({ email: managerEmail, name: managerName });
      }
    }
    return usersToNotify;
  };

  // Handle Suspension Logic
  if (data.status === 'suspended' && existingProject.status !== 'suspended') {
    const parties = await getInvolvedParties(existingProject.manager?.email, existingProject.manager?.name);
    
    const suspendPromises = parties.map(party => 
      emailService.send({
        to: party.email,
        subject: `Project Suspended: ${existingProject.name}`,
        html: `
          <h1>Project Suspended</h1>
          <p>The project <strong>${existingProject.name}</strong> (${existingProject.code}) has been suspended.</p>
          <p><strong>Reason:</strong> ${data.suspensionReason || 'No reason provided'}</p>
          <p><strong>Actioned By:</strong> ${user?.name || 'System'}</p>
        `
      }).catch(err => logger.error('Failed suspension email', { email: party.email, error: err.message }))
    );
    await Promise.all(suspendPromises);

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.name,
        userRole: user?.role,
        action: 'SUSPEND_PROJECT',
        targetType: 'Project',
        targetId: id,
        targetCode: existingProject.code,
        details: { reason: data.suspensionReason, previousStatus: existingProject.status },
      }
    });
  }

  // Handle Completion Logic
  if (data.status === 'completed' && existingProject.status !== 'completed') {
    const parties = await getInvolvedParties(existingProject.manager?.email, existingProject.manager?.name);
    
    const completePromises = parties.map(party => 
      emailService.send({
        to: party.email,
        subject: `Project Completed: ${existingProject.name}`,
        html: `
          <h1>Project Completed</h1>
          <p>The project <strong>${existingProject.name}</strong> (${existingProject.code}) has been marked as completed.</p>
          <p>Please ensure all final logs, equipment returns, and financial reconciliations are processed.</p>
          <p><strong>Actioned By:</strong> ${user?.name || 'System'}</p>
        `
      }).catch(err => logger.error('Failed completion email', { email: party.email, error: err.message }))
    );
    await Promise.all(completePromises);

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.name,
        userRole: user?.role,
        action: 'COMPLETE_PROJECT',
        targetType: 'Project',
        targetId: id,
        targetCode: existingProject.code,
        details: { previousStatus: existingProject.status },
      }
    });
  }

  const project = await prisma.project.update({
    where: { id },
    data: processedData,
    include: {
      manager: {
        select: { id: true, name: true },
      },
    },
  });
  
  logger.info('Project updated', { projectId: id, userId: user?.id });
  
  return project;
}

/**
 * Delete project by ID
 * @param {number} id - Project ID
 * @param {Object} user - Authenticated user
 * @param {string} reason - Reason for deletion
 */
async function remove(id, user, reason) {
  const project = await getById(id);
  
  // Helper to fetch involved parties for notifications
  const rolesToNotify = ['Finance_Director', 'Contract_Administrator', 'Equipment_Coordinator'];
  const parties = await prisma.user.findMany({
    where: { role: { in: rolesToNotify } },
    select: { email: true, name: true }
  });
  
  if (project.manager?.email && !parties.some(p => p.email === project.manager.email)) {
    parties.push({ email: project.manager.email, name: project.manager.name });
  }
  
  const deletePromises = parties.map(party => 
    emailService.send({
      to: party.email,
      subject: `Project Deleted: ${project.name}`,
      html: `
        <h1>Project Deleted</h1>
        <p>The project <strong>${project.name}</strong> (${project.code}) has been permanently deleted from the system.</p>
        <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
        <p><strong>Actioned By:</strong> ${user?.name || 'System'}</p>
      `
    }).catch(err => logger.error('Failed deletion email', { email: party.email, error: err.message }))
  );
  await Promise.all(deletePromises);

  // Audit Log
  await prisma.auditLog.create({
    data: {
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action: 'DELETE_PROJECT',
      targetType: 'Project',
      targetId: id,
      targetCode: project.code,
      details: { reason },
    }
  });
  
  await prisma.project.delete({ where: { id } });
  
  logger.info('Project deleted', { projectId: id, userId: user?.id });
}

/**
 * Get project budget summary
 * @param {number} id - Project ID
 * @returns {Promise<Object>} Budget summary
 */
async function getBudgetSummary(id) {
  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      budgetTotal: true,
      budgetSpent: true,
      contractValue: true,
    },
  });
  
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  
  const remaining = (project.budgetTotal || 0) - (project.budgetSpent || 0);
  const percentUsed = project.budgetTotal 
    ? ((project.budgetSpent || 0) / project.budgetTotal * 100).toFixed(2)
    : 0;
  
  return {
    total: project.budgetTotal,
    spent: project.budgetSpent,
    remaining,
    percentUsed: parseFloat(percentUsed),
    contractValue: project.contractValue,
  };
}

/**
 * Update project budget spent
 * @param {number} id - Project ID
 * @param {number} amount - Amount to add to spent
 */
async function addToSpent(id, amount) {
  await prisma.project.update({
    where: { id },
    data: {
      budgetSpent: {
        increment: amount,
      },
    },
  });
}

/**
 * Get projects by manager
 * @param {number} managerId - Manager user ID
 * @returns {Promise<Array>} Projects managed by user
 */
async function getByManager(managerId) {
  return prisma.project.findMany({
    where: { managerId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all materials (layers + accessories) for a project's road specification 
 * Used by Finance Director when creating contracts to see what materials are needed
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Materials list from road spec
 */
async function getMaterials(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      code: true,
      name: true,
      budgetTotal: true,
      roadSpecification: {
        include: {
          layers: { orderBy: { phaseNumber: 'asc' } },
          accessories: true
        }
      }
    }
  });

  if (!project) throw new AppError('Project not found', 404);
  
  // 1. Get all materials from the road spec
  const materials = [];
  if (project.roadSpecification) {
    const spec = project.roadSpecification;
    for (const layer of spec.layers) {
      materials.push({
        id: layer.id,
        type: 'layer',
        name: layer.materialType,
        phase: layer.phaseNumber,
        quantity: Number(layer.totalQuantity),
        unit: layer.unit,
        unitCostHigh: Number(layer.unitCostHigh),
        totalCostHigh: Number(layer.totalCostHigh),
      });
    }
    for (const acc of spec.accessories) {
      materials.push({
        id: acc.id,
        type: 'accessory',
        name: acc.itemName,
        phase: null,
        quantity: Number(acc.totalQuantity),
        unit: acc.unit,
        unitCostHigh: Number(acc.unitCostHigh),
        totalCostHigh: Number(acc.totalCostHigh),
      });
    }
  }

  // 2. Fetch existing contracts for this project to calculate contracted quantities
  const existingContracts = await prisma.contract.findMany({
    where: { 
      projectId,
      status: { not: 'cancelled' }
    },
    select: { materialsList: true }
  });

  const contractedMap = {};
  for (const contract of existingContracts) {
    if (contract.materialsList) {
      try {
        const items = JSON.parse(contract.materialsList);
        for (const item of items) {
          contractedMap[item.name] = (contractedMap[item.name] || 0) + Number(item.quantity);
        }
      } catch (e) {
        logger.error('Failed to parse materialsList from contract', e);
      }
    }
  }

  // 3. Attach contracted and remaining info
  const materialsWithBalance = materials.map(m => {
    const contracted = contractedMap[m.name] || 0;
    return {
      ...m,
      contractedQuantity: contracted,
      remainingQuantity: Math.max(0, m.quantity - contracted)
    };
  });

    const budgetSummary = await getBudgetSummary(projectId);
  
    return {
      project: { id: project.id, code: project.code, name: project.name },
      budgetSummary,
      materials: materialsWithBalance
    };
}

/**
 * Extend a project's end date and cascade to all affected tasks, contracts, and notifications
 * @param {number} projectId
 * @param {string} newEndDate - ISO date string
 * @param {string} reason - Reason for extension
 * @param {Object} approver - The PM user who approves this extension
 */
async function extendProject(projectId, newEndDate, reason, approver) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      fieldSupervisor: { select: { id: true, name: true, email: true } },
      contracts: { select: { id: true, endDate: true } },
    },
  });

  if (!project) throw new AppError('Project not found', 404);

  const oldEndDate = project.endDate;
  const newEnd = new Date(newEndDate);

  if (!oldEndDate) throw new AppError('Project has no existing end date to extend', 400);
  if (newEnd <= new Date(oldEndDate)) throw new AppError('New end date must be after current end date', 400);

  const shiftMs = newEnd.getTime() - new Date(oldEndDate).getTime();
  const shiftDays = Math.round(shiftMs / (1000 * 60 * 60 * 24));

  // 1. Update project end date
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: { endDate: newEnd },
  });

  // 2. Cascade extension to tasks
  const tasksService = require('./tasks.service');
  const cascadeResult = await tasksService.cascadeExtension(projectId, shiftMs, new Date(oldEndDate));

  // 3. Extend associated contract end dates
  let contractsUpdated = 0;
  for (const contract of project.contracts) {
    if (contract.endDate) {
      await prisma.contract.update({
        where: { id: contract.id },
        data: { endDate: new Date(new Date(contract.endDate).getTime() + shiftMs) },
      });
      contractsUpdated++;
    }
  }

  // 4. Audit trail
  await prisma.auditLog.create({
    data: {
      userId: approver.id,
      userName: approver.name,
      userRole: approver.role,
      action: 'EXTEND_PROJECT',
      targetType: 'Project',
      targetId: projectId,
      targetCode: project.code,
      details: { 
        oldEndDate, 
        newEndDate: newEnd.toISOString(), 
        shiftDays, 
        reason, 
        tasksShifted: cascadeResult.shifted, 
        contractsUpdated,
        requestedByName: approver.name 
      },
    }
  });

  // 5. Notify all project stakeholders
  const notificationTargets = [];

  // Get all role-holders for this project
  if (project.manager) notificationTargets.push(project.manager);
  if (project.fieldSupervisor) notificationTargets.push(project.fieldSupervisor);

  // Get finance, contract admin, equipment coordinator, ops manager roles
  const stakeholders = await prisma.user.findMany({
    where: {
      role: { in: ['Finance_Director', 'Contract_Administrator', 'Equipment_Coordinator', 'Operations_Manager', 'Managing_Director'] },
      isActive: true,
      isLocked: false,
    },
    select: { id: true, name: true, email: true, role: true },
  });
  notificationTargets.push(...stakeholders);

  // Send notifications (non-blocking)
  const message = `Project ${project.code} ("${project.name}") has been extended by ${shiftDays} days. New end date: ${newEnd.toLocaleDateString()}. Reason: ${reason}. ${cascadeResult.shifted} tasks and ${contractsUpdated} contracts were automatically adjusted.`;

  for (const target of notificationTargets) {
    emailService.sendNotification(target, `Project Extended: ${project.code}`, message)
      .catch(e => logger.error('Extension notification failed', { to: target.email, error: e.message }));

    // In-app notification
    prisma.notification.create({
      data: {
        userId: target.id,
        type: 'PROJECT_EXTENDED',
        title: `Project Extended: ${project.code}`,
        message,
        projectId,
      },
    }).catch(e => logger.error('In-app notification failed', e));
  }

  logger.info('Project extended successfully', { projectId, shiftDays, tasksShifted: cascadeResult.shifted });

  return {
    project: updatedProject,
    extension: { oldEndDate, newEndDate: newEnd, shiftDays, reason },
    cascade: cascadeResult,
    contractsUpdated,
    notified: notificationTargets.length,
  };
}

/**
 * Calculate aggregate progress from all tasks
 */
async function calculateProgress(projectId) {
  const tasksService = require('./tasks.service');
  return tasksService.calculateProjectProgress(projectId);
}

module.exports = {
  getAll,
  getById,
  getByCode,
  create,
  update,
  remove,
  getBudgetSummary,
  addToSpent,
  getByManager,
  getMaterials,
  extendProject,
  calculateProgress,
};

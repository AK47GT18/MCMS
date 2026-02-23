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

async function getAll({ page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status }) {
  try {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    
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
async function create(data) {
  // Validate dates
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const start = new Date(data.startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(data.endDate);
  end.setHours(0, 0, 0, 0);

  if (start < now) {
    throw new AppError('Start date cannot be in the past', 400);
  }

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
      budgetSpent: 0,
    },
    include: {
      manager: {
        select: { id: true, name: true, email: true },
      },
    },
  });
  
  logger.info('Project created', { projectId: project.id, code: project.code });
  
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
    data,
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
};

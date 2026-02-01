/**
 * MCMS Service - Projects
 * CRUD operations for project management
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

/**
 * Get all projects with pagination
 * @param {Object} options - Pagination and filter options
 * @returns {Promise<Object>} Paginated projects list
 */
async function getAll({ page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status }) {
  try {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    
    // Defensive check for sortBy
    const validSortBy = sortBy || 'createdAt';
    
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
    
    return { projects, total, page, limit };
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
      contracts: {
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
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
        select: { id: true, name: true },
      },
    },
  });
  
  logger.info('Project created', { projectId: project.id, code: project.code });
  
  return project;
}

/**
 * Update project by ID
 * @param {number} id - Project ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated project
 */
async function update(id, data) {
  await getById(id);
  
  const project = await prisma.project.update({
    where: { id },
    data,
    include: {
      manager: {
        select: { id: true, name: true },
      },
    },
  });
  
  logger.info('Project updated', { projectId: id });
  
  return project;
}

/**
 * Delete project by ID
 * @param {number} id - Project ID
 */
async function remove(id) {
  await getById(id);
  
  await prisma.project.delete({ where: { id } });
  
  logger.info('Project deleted', { projectId: id });
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

/**
 * MCMS Service - Users
 * CRUD operations for user management
 */

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

/**
 * Get all users with pagination
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Paginated users list
 */
async function getAll({ page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' }) {
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isLocked: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count(),
  ]);
  
  return { users, total, page, limit };
}

/**
 * Get user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object>} User object
 */
async function getById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      permissions: true,
      avatarUrl: true,
      isLocked: true,
      lastLoginIp: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          managedProjects: true,
          dailyLogs: true,
        },
      },
    },
  });
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  return user;
}

/**
 * Create a new user
 * @param {Object} data - User data
 * @returns {Promise<Object>} Created user
 */
async function create(data) {
  const { password, ...userData } = data;
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      ...userData,
      passwordHash,
      avatarUrl: data.avatarUrl || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      permissions: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
  
  logger.info('User created', { userId: user.id, email: user.email });
  
  return user;
}

/**
 * Update user by ID
 * @param {number} id - User ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated user
 */
async function update(id, data) {
  // Ensure user exists
  await getById(id);
  
  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      permissions: true,
      avatarUrl: true,
      isLocked: true,
      updatedAt: true,
    },
  });
  
  logger.info('User updated', { userId: id });
  
  return user;
}

/**
 * Delete user by ID
 * @param {number} id - User ID
 */
async function remove(id) {
  // Ensure user exists
  await getById(id);
  
  await prisma.user.delete({ where: { id } });
  
  logger.info('User deleted', { userId: id });
}

/**
 * Lock/unlock user account
 * @param {number} id - User ID
 * @param {boolean} locked - Lock status
 */
async function setLockStatus(id, locked) {
  await prisma.user.update({
    where: { id },
    data: { isLocked: locked },
  });
  
  logger.info(`User ${locked ? 'locked' : 'unlocked'}`, { userId: id });
}

/**
 * Get users by role
 * @param {string} role - Role to filter by
 * @returns {Promise<Array>} Users with the role
 */
async function getByRole(role) {
  return prisma.user.findMany({
    where: { role },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  });
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  setLockStatus,
  getByRole,
};

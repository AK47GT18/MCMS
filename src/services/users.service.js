/**
 * MCMS Service - Users
 * CRUD operations for user management
 */

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const emailService = require('../emails/email.service');

/**
 * Get all users with pagination
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Paginated users list
 */
async function getAll({ page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', role, isLocked, search }) {
  const skip = (page - 1) * limit;
  
  const where = {};
  if (role) where.role = role;
  if (isLocked !== undefined) where.isLocked = isLocked;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
    prisma.user.count({ where }),
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
      mustChangePassword: true,
      mustChangeEmail: true,
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
      mustChangePassword: true,
      mustChangeEmail: true,
      createdAt: true,
    },
  });
  
  logger.info('User created', { userId: user.id, email: user.email });
  
  // Send welcome email
  emailService.sendWelcome(user).catch(err => logger.error('Failed to send welcome email', err));
  
  return user;
}

/**
 * Update user by ID
 * @param {number} id - User ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated user
 */
async function update(id, data) {
  // Get old user data for comparison
  const oldUser = await getById(id);
  
  const updateData = { ...data };
  
  // Hash password if provided
  if (updateData.password) {
    updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
    delete updateData.password;
    updateData.mustChangePassword = true; // Force change on next login if admin reset it
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
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
  
  // Determine what changed
  const changes = [];
  if (data.name && data.name !== oldUser.name) changes.push(`Name changed from "${oldUser.name}" to "${data.name}"`);
  if (data.email && data.email !== oldUser.email) changes.push(`Email changed from "${oldUser.email}" to "${data.email}"`);
  if (data.role && data.role !== oldUser.role) changes.push(`Role changed from "${oldUser.role.replace(/_/g, ' ')}" to "${data.role.replace(/_/g, ' ')}"`);
  if (data.phone && data.phone !== oldUser.phone) changes.push(`Phone changed from "${oldUser.phone || 'None'}" to "${data.phone}"`);

  const changeText = changes.length > 0 
    ? `The following changes were made to your account:\n- ${changes.join('\n- ')}`
    : 'Your account details have been updated.';

  // Send update notification
  emailService.sendNotification(user, 'Account Updated', `${changeText}\n\nIf you did not authorize this, please contact support.`)
    .catch(err => logger.error('Failed to send update email', err));
  
  return user;
}

/**
 * Delete user by ID
 * @param {number} id - User ID
 */
async function remove(id, reason = 'No reason provided') {
  // Ensure user exists
  const user = await getById(id);
  
  // Send deletion email BEFORE deleting
  await emailService.sendNotification(user, 'Account Deleted', `Your MCMS account has been deleted by an administrator. Reason: ${reason}`)
    .catch(err => logger.error('Failed to send deletion email', err));
  
  await prisma.user.delete({ where: { id } });
  
  logger.info('User deleted', { userId: id, reason });
}

/**
 * Lock/unlock user account
 * @param {number} id - User ID
 * @param {boolean} locked - Lock status
 */
async function setLockStatus(id, locked, reason = 'No reason provided') {
  const user = await prisma.user.update({
    where: { id },
    data: { 
      isLocked: locked,
      statusReason: reason
    },
    select: { id: true, name: true, email: true }
  });
  
  const status = locked ? 'deactivated' : 'reactivated';
  
  logger.info(`User ${status}`, { userId: id, reason });
  
  // Send notification
  emailService.sendNotification(user, `Account ${status.charAt(0).toUpperCase() + status.slice(1)}`, 
    `Your MCMS account has been ${status} by an administrator. Reason: ${reason}`)
    .catch(err => logger.error(`Failed to send ${status} email`, err));
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

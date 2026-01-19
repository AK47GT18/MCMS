/**
 * MCMS Service - Authentication
 * Handles user authentication and password management
 */

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

/**
 * Authenticate user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data with token
 */
async function login(email, password) {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
      passwordHash: true,
      isLocked: true,
      avatarUrl: true,
    },
  });
  
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }
  
  if (user.isLocked) {
    throw new AppError('Account is locked. Contact administrator.', 403);
  }
  
  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash || '');
  
  if (!isValid) {
    logger.warn('Failed login attempt', { email });
    throw new AppError('Invalid email or password', 401);
  }
  
  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  });
  
  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { updatedAt: new Date() },
  });
  
  logger.info('User logged in', { userId: user.id, email: user.email });
  
  // Return user without password
  const { passwordHash, ...userData } = user;
  
  return {
    user: userData,
    token,
  };
}

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Created user with token
 */
async function register(userData) {
  const { name, email, password, phone, role, permissions } = userData;
  
  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 400);
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      phone,
      role,
      permissions: permissions || [],
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
  
  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  });
  
  logger.info('User registered', { userId: user.id, email: user.email });
  
  return { user, token };
}

/**
 * Change user password
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 */
async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash || '');
  if (!isValid) {
    throw new AppError('Current password is incorrect', 400);
  }
  
  // Hash and save new password
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
  
  logger.info('Password changed', { userId });
}

/**
 * Get user profile by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User profile
 */
async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      permissions: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  return user;
}

module.exports = {
  login,
  register,
  changePassword,
  getProfile,
};

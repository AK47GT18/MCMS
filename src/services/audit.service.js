/**
 * MCMS Service - Audit Logging
 * Immutable audit trail for all system actions
 */

const { prisma } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 */
async function log({ userId, userName, userRole, action, targetType, targetId, targetCode, ipAddress, details }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        userName,
        userRole,
        action,
        targetType,
        targetId,
        targetCode,
        ipAddress,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    logger.error('Audit log creation failed', error);
  }
}

/**
 * Create audit log from request context
 */
async function logFromRequest(req, action, targetType, targetId, targetCode, details) {
  const user = req.user;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
  
  await log({
    userId: user?.id,
    userName: user?.name || 'Unknown',
    userRole: user?.role,
    action,
    targetType,
    targetId,
    targetCode,
    ipAddress,
    details,
  });
}

/**
 * Get audit logs with pagination
 */
async function getAll({ page = 1, limit = 50, userId, action, targetType, startDate, endDate }) {
  const skip = (page - 1) * limit;
  const where = {};
  
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (targetType) where.targetType = targetType;
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip, take: limit, where,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);
  
  return { logs, total, page, limit };
}

/**
 * Get recent activity for dashboard
 */
async function getRecentActivity(limit = 20) {
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: { timestamp: 'desc' },
    select: {
      id: true,
      userName: true,
      userRole: true,
      action: true,
      targetType: true,
      targetCode: true,
      timestamp: true,
    },
  });
}

module.exports = { log, logFromRequest, getAll, getRecentActivity };

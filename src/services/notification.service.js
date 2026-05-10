/**
 * MCMS Service - Notifications
 * Persistent notification management with real-time delivery
 */

const { prisma } = require('../config/database');
const websocket = require('../realtime/websocket');
const pushService = require('./push.service');
const emailService = require('../emails/email.service');
const logger = require('../utils/logger');
const auditService = require('./audit.service');

/**
 * Create a notification for a specific user
 * @param {Object} data - { userId, type, icon, title, message, link }
 * @returns {Object} created notification
 */
async function create(data) {
  const { userId, targetRole, type = 'info', icon = 'fa-bell', title, message, link } = data;

  if (data.broadcast) {
    return broadcast({ type, icon, title, message, link });
  }

  if (targetRole && !userId) {
    return notifyRole(targetRole, { type, icon, title, message, link });
  }

  if (!userId || !title || !message) {
    throw new Error('userId or targetRole, and title/message are required');
  }

  const notification = await prisma.notification.create({
    data: { userId, type, icon, title, message, link }
  });

  // Push to user in real-time via WebSocket
  websocket.notifyUser(userId, 'NOTIFICATION', {
    id: notification.id,
    type: notification.type,
    icon: notification.icon,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    createdAt: notification.createdAt,
    isRead: false
  });

  // Trigger Native Push Notification
  pushService.sendNotification(userId, {
    title: notification.title,
    body: notification.message,
    icon: '/icon-192.png',
    data: {
      url: notification.link || '/dashboard.html'
    }
  }).catch(err => logger.error('Error triggering push notification:', err));

  // Trigger Email Notification
  prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
    .then(user => {
      if (user && user.email) {
        emailService.sendNotification(user, title, message, link)
          .catch(err => logger.error('Error sending email notification:', err));
      }
    });


  
  // Add to Audit Logs
  auditService.log({
    userId,
    action: 'NOTIFICATION_SENT',
    targetType: 'NOTIFICATION',
    targetId: notification.id,
    details: { title, message }
  }).catch(err => logger.error('Error logging notification to audit:', err));
  
  logger.info(`Notification created for user ${userId}: ${title}`);
  return notification;
}

/**
 * Create notifications for all users with a specific role
 * @param {string} role - RoleEnum value e.g. 'Finance_Director'
 * @param {Object} data - { type, icon, title, message, link }
 */
async function notifyRole(role, data) {
  const users = await prisma.user.findMany({
    where: { role, isActive: true, deletedAt: null },
    select: { id: true }
  });

  const notifications = [];
  for (const user of users) {
    const n = await create({ ...data, userId: user.id });
    notifications.push(n);
  }

  return notifications;
}

/**
 * Create notifications for ALL active users in the system (Broadcast)
 * @param {Object} data - { type, icon, title, message, link }
 */
async function broadcast(data) {
  const users = await prisma.user.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true }
  });

  const notifications = [];
  for (const user of users) {
    try {
      // Use direct prisma creation if we don't want to trigger separate audit/logger for each?
      // No, calling create() ensures email and push are triggered for everyone.
      const n = await create({ ...data, userId: user.id, broadcast: false });
      notifications.push(n);
    } catch (err) {
      logger.error(`Error creating broadcast notification for user ${user.id}:`, err);
    }
  }

  return notifications;
}

/**
 * Get notifications for a user
 * @param {number} userId
 * @param {Object} options - { limit, unreadOnly }
 */
async function getByUser(userId, options = {}) {
  const { limit = 20, unreadOnly = false } = options;

  const where = { userId };
  if (unreadOnly) where.isRead = false;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    }),
    prisma.notification.count({
      where: { userId, isRead: false }
    })
  ]);

  return { notifications, unreadCount };
}

/**
 * Mark a notification as read
 */
async function markRead(id, userId) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true }
  });
}

/**
 * Mark all notifications as read for a user
 */
async function markAllRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });
}

/**
 * Get unread count for a user
 */
async function getUnreadCount(userId) {
  return prisma.notification.count({
    where: { userId, isRead: false }
  });
}

/**
 * Notify all users associated with a project (manager, supervisor, and key roles)
 * @param {number} projectId - Project ID
 * @param {Object} data - { type, icon, title, message, link }
 */
async function notifyProjectUsers(projectId, data) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { managerId: true, fieldSupervisorId: true }
  });

  if (!project) return [];

  // Collect unique user IDs: PM + FS + key oversight roles
  const userIds = new Set();
  if (project.managerId) userIds.add(project.managerId);
  if (project.fieldSupervisorId) userIds.add(project.fieldSupervisorId);

  // Also notify Finance Director, Equipment Coordinator, Operations Manager
  const oversightUsers = await prisma.user.findMany({
    where: {
      role: { in: ['Finance_Director', 'Equipment_Coordinator', 'Operations_Manager', 'Managing_Director'] },
      isActive: true,
      deletedAt: null
    },
    select: { id: true }
  });
  oversightUsers.forEach(u => userIds.add(u.id));

  const notifications = [];
  for (const userId of userIds) {
    try {
      const n = await create({ ...data, userId, broadcast: false });
      notifications.push(n);
    } catch (err) {
      logger.error(`Error notifying project user ${userId}:`, err);
    }
  }

  return notifications;
}

module.exports = {
  create,
  notifyRole,
  notifyProjectUsers,
  getByUser,
  markRead,
  markAllRead,
  getUnreadCount,
  broadcast
};

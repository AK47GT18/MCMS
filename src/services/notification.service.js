/**
 * MCMS Service - Notifications
 * Persistent notification management with real-time delivery
 */

const { prisma } = require('../config/database');
const websocket = require('../realtime/websocket');
const pushService = require('./push.service');
const emailService = require('../emails/email.service');
const logger = require('../utils/logger');

/**
 * Create a notification for a specific user
 * @param {Object} data - { userId, type, icon, title, message, link }
 * @returns {Object} created notification
 */
async function create(data) {
  const { userId, targetRole, type = 'info', icon = 'fa-bell', title, message, link } = data;

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

module.exports = {
  create,
  notifyRole,
  getByUser,
  markRead,
  markAllRead,
  getUnreadCount
};

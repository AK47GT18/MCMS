/**
 * MCMS Service - Push Notifications
 * Handles Web Push protocol integration
 */

const webpush = require('web-push');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

// Initialize Web Push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@mkaka.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  logger.info('Web Push initialized with VAPID keys');
} else {
  logger.warn('Web Push keys missing from environment. Push notifications will be disabled.');
}

/**
 * Send a push notification to a specific user
 * @param {number} userId 
 * @param {Object} payload - { title, body, icon, data: { url } }
 */
async function sendNotification(userId, payload) {
  try {
    // Get all subscriptions for this user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    if (subscriptions.length === 0) {
      return { success: true, message: 'No push subscriptions found for user' };
    }

    const notificationPayload = JSON.stringify(payload);
    
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        try {
          await webpush.sendNotification(pushSubscription, notificationPayload);
          return { endpoint: sub.endpoint, success: true };
        } catch (error) {
          // If 404 (Not Found) or 410 (Gone), the subscription has expired or is invalid
          if (error.statusCode === 404 || error.statusCode === 410) {
            logger.info(`Push subscription expired for endpoint: ${sub.endpoint}. Removing...`);
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          } else {
            logger.error(`Error sending push notification to ${sub.endpoint}:`, error);
          }
          throw error;
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    logger.info(`Push notification sent to user ${userId}: ${successCount}/${subscriptions.length} devices successful`);
    
    return { 
      success: true, 
      total: subscriptions.length, 
      sent: successCount 
    };
  } catch (error) {
    logger.error(`Failed to process push notifications for user ${userId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Save a new push subscription
 */
async function subscribe(userId, subscription) {
  const { endpoint, keys } = subscription;
  
  // Update or Create
  return prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId,
      p256dh: keys.p256dh,
      auth: keys.auth
    },
    create: {
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth
    }
  });
}

/**
 * Remove a push subscription
 */
async function unsubscribe(endpoint) {
  return prisma.pushSubscription.deleteMany({
    where: { endpoint }
  });
}

module.exports = {
  sendNotification,
  subscribe,
  unsubscribe
};

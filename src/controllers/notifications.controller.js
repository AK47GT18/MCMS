/**
 * MCMS Controller - Notifications API
 */

const notificationService = require('../services/notification.service');
const { asyncHandler } = require('../middlewares/error.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { parseBody, parseQuery } = require('../middlewares/validate.middleware');
const response = require('../utils/response');

/**
 * GET /notifications - Get current user's notifications
 */
const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const query = parseQuery(req.url);
  const result = await notificationService.getByUser(user.id, {
    limit: parseInt(query.limit) || 20,
    unreadOnly: query.unreadOnly === 'true'
  });

  response.success(res, result);
});

/**
 * GET /notifications/count - Get unread count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const count = await notificationService.getUnreadCount(user.id);
  response.success(res, { unreadCount: count });
});

/**
 * PUT /notifications/:id/read - Mark single notification as read
 */
const markRead = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;

  if (!id) return response.badRequest(res, 'Notification ID required');

  await notificationService.markRead(parseInt(id), user.id);
  response.success(res, { message: 'Notification marked as read' });
});

/**
 * PUT /notifications/read-all - Mark all notifications as read
 */
const markAllRead = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;

  await notificationService.markAllRead(user.id);
  response.success(res, { message: 'All notifications marked as read' });
});

/**
 * POST /notifications - Create a notification (admin/system use)
 */
const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const body = await parseBody(req);
  const result = await notificationService.create(body);
  response.created(res, result);
});

module.exports = { getAll, getUnreadCount, markRead, markAllRead, create };

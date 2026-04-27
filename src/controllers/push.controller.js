/**
 * MCMS Controller - Push Notifications API
 */

const pushService = require('../services/push.service');
const { asyncHandler } = require('../middlewares/error.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { parseBody } = require('../middlewares/validate.middleware');
const response = require('../utils/response');

/**
 * GET /push/key - Get public VAPID key
 */
const getPublicKey = asyncHandler(async (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return response.error(res, 'Push notifications not configured', 503);
  }
  response.success(res, { publicKey });
});

/**
 * POST /push/subscribe - Register a new subscription
 */
const subscribe = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const subscription = await parseBody(req);
  if (!subscription || !subscription.endpoint) {
    return response.badRequest(res, 'Invalid subscription object');
  }

  await pushService.subscribe(user.id, subscription);
  response.success(res, { message: 'Subscribed to push notifications' });
});

/**
 * POST /push/unsubscribe - Remove a subscription
 */
const unsubscribe = asyncHandler(async (req, res) => {
  const body = await parseBody(req);
  if (!body || !body.endpoint) {
    return response.badRequest(res, 'Endpoint required');
  }

  await pushService.unsubscribe(body.endpoint);
  response.success(res, { message: 'Unsubscribed' });
});

module.exports = {
  getPublicKey,
  subscribe,
  unsubscribe
};

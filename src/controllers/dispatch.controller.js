const dispatchService = require('../services/dispatch.service');
const { authenticate } = require('../middlewares/auth.middleware');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');
const websocket = require('../realtime/websocket');

const { parseBody } = require('../middlewares/validate.middleware');

const dispatch = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;

  req.body = await parseBody(req);
  const { requisitionId, estimatedArrival } = req.body;
  
  if (!requisitionId || !estimatedArrival) {
    return response.error(res, 'Missing requisitionId or estimatedArrival', 400);
  }

  const result = await dispatchService.dispatch({
    requisitionId,
    estimatedArrival,
    partial: req.body.partial,
    dispatchedItems: req.body.dispatchedItems,
    shortfalls: req.body.shortfalls,
    userId: user.id,
    userName: user.name,
    userRole: user.role
  });

  // Broadcast update
  websocket.broadcastToChannel('requisitions', 'REQUISITION_DISPATCHED', {
    requisitionId: result.id,
    estimatedArrival: result.estimatedArrival
  });

  response.success(res, result);
});

const confirmArrival = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const result = await dispatchService.confirmArrival(id, user.id, user.name, user.role);

  // Broadcast update
  websocket.broadcastToChannel('requisitions', 'REQUISITION_ARRIVED', {
    requisitionId: result.id
  });

  response.success(res, result);
});

module.exports = { dispatch, confirmArrival };

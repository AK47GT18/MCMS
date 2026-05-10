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
  const { requisitionId, estimatedArrival, dispatchDate } = req.body;
  
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
    userRole: user.role,
    userPhone: req.body.userPhone || user.phone,
    transporterName: req.body.transporterName || user.name,
    dispatchedAt: dispatchDate || new Date()
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

  const body = await parseBody(req);
  const { notes, reference, receivedBy } = body;

  const result = await dispatchService.confirmArrival({
    requisitionId: id,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    notes,
    reference,
    receivedBy
  });

  // Broadcast update
  websocket.broadcastToChannel('requisitions', 'REQUISITION_ARRIVED', {
    requisitionId: result.id
  });

  response.success(res, result);
});

const confirmArrivalVariance = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;

  req.body = await parseBody(req);
  const { receivedItems, receivedBy, dispatchedBy, notes, reference } = req.body;

  const result = await dispatchService.confirmArrivalVariance({
    requisitionId: id,
    receivedItems,
    receivedBy,
    dispatchedBy,
    notes,
    reference,
    userId: user.id,
    userName: user.name,
    userRole: user.role
  });

  // Broadcast update
  websocket.broadcastToChannel('requisitions', 'REQUISITION_ARRIVED_VARIANCE', {
    requisitionId: id,
    discrepancies: result.discrepancies
  });

  response.success(res, result);
});

module.exports = { dispatch, confirmArrival, confirmArrivalVariance };

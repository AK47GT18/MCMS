/**
 * MCMS Controller - Requisitions
 */

const requisitionsService = require('../services/requisitions.service');
const websocket = require('../realtime/websocket');
const notifService = require('../services/notification.service');
const auditService = require('../services/audit.service');
const { validateBody, validateId, parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { hasMinimumRole } = require('../middlewares/rbac.middleware');
const { createRequisitionSchema, paginationSchema, rejectRequisitionSchema, fulfillRequisitionSchema } = require('../utils/validators');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const query = parseQuery(req.url);
  const options = validateBody(query, paginationSchema, res);
  if (!options) return;
  
  const result = await requisitionsService.getAll({ ...options, status: query.status, projectId: query.projectId ? parseInt(query.projectId) : undefined });
  response.paginated(res, result.requisitions, result.page, result.limit, result.total);
});

const getById = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const reqId = validateId(id, res);
  if (!reqId) return;
  
  const result = await requisitionsService.getById(reqId);
  response.success(res, result);
});

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, createRequisitionSchema, res);
  if (!data) return;
  
  const result = await requisitionsService.create(data, user.id);

  // Broadcast new requisition to Finance and EC
  websocket.broadcastToChannel('requisitions', 'REQUISITION_CREATED', {
    requisition: result,
    submittedBy: user.id
  });

  // Create persistent notifications for Finance Director and EC
  try {
    await notifService.notifyRole('Finance_Director', {
      type: 'info', icon: 'fa-file-invoice',
      title: 'New Requisition Submitted',
      message: `${user.name || 'A user'} submitted requisition ${result.reqCode || '#' + result.id} for approval.`
    });
    await notifService.notifyRole('Equipment_Coordinator', {
      type: 'info', icon: 'fa-clipboard-list',
      title: 'New Field Requisition',
      message: `Requisition ${result.reqCode || '#' + result.id} received from field. Review and dispatch.`
    });
  } catch (e) { console.error('Notif create failed:', e.message); }

  // Permanent Audit Log
  await auditService.logFromRequest(req, 'CREATED', 'Requisition', result.id, result.reqCode, {
    totalAmount: result.totalAmount,
    items: result.items ? result.items.length : 0
  });

  response.created(res, result);
});

const approve = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Finance_Director')) return;
  
  const reqId = validateId(id, res);
  if (!reqId) return;
  
  const result = await requisitionsService.approve(reqId, user.id);

  websocket.broadcastToChannel('requisitions', 'REQUISITION_APPROVED', {
    requisitionId: reqId,
    approvedBy: user.id
  });

  // Notify the submitter
  try {
    if (result.submittedById) {
      await notifService.create({
        userId: result.submittedById,
        type: 'success', icon: 'fa-check-circle',
        title: 'Requisition Approved',
        message: `Your requisition ${result.reqCode || '#' + reqId} has been approved by Finance.`
      });
    }
  } catch (e) { console.error('Notif create failed:', e.message); }

  // Permanent Audit Log
  await auditService.logFromRequest(req, 'APPROVED', 'Requisition', result.id, result.reqCode, {
    approvalNotes: 'Cleared for payment by Finance'
  });

  response.success(res, result);
});

const reject = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Finance_Director')) return;
  
  const reqId = validateId(id, res);
  if (!reqId) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, rejectRequisitionSchema, res);
  if (!data) return;

  const result = await requisitionsService.reject(reqId, user.id, data.reason);

  websocket.broadcastToChannel('requisitions', 'REQUISITION_REJECTED', {
    requisitionId: reqId,
    rejectedBy: user.id,
    reason: body.reason
  });

  // Notify the submitter
  try {
    if (result.submittedById) {
      await notifService.create({
        userId: result.submittedById,
        type: 'error', icon: 'fa-times-circle',
        title: 'Requisition Rejected',
        message: `Your requisition ${result.reqCode || '#' + reqId} was rejected. Reason: ${data.reason || 'Not specified'}`
      });
    }
  } catch (e) { console.error('Notif create failed:', e.message); }

  // Permanent Audit Log
  await auditService.logFromRequest(req, 'REJECTED', 'Requisition', result.id, result.reqCode, {
    reason: data.reason || 'Not specified'
  });

  response.success(res, result);
});

const flagFraud = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Finance_Director')) return;
  
  const reqId = validateId(id, res);
  if (!reqId) return;
  
  const result = await requisitionsService.flagFraud(reqId, user.id);

  // Permanent Audit Log
  await auditService.logFromRequest(req, 'FLAGGED_FRAUD', 'Requisition', result.id, result.reqCode, {
    alertLevel: 'CRITICAL',
    action: 'Frozen pending investigation'
  });

  // Notify MD and OM about suspected fraud
  await notifService.notifyRole('Managing_Director', {
    type: 'error', icon: 'fa-shield-exclamation',
    title: 'SUSPECTED FRAUD DETECTED',
    message: `Requisition ${result.reqCode} has been flagged for fraud by ${user.name}. Investigation required.`
  });

  response.success(res, result);
});

const getPending = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const result = await requisitionsService.getPending();
  response.success(res, result);
});

const fulfill = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  // typically Equipment Coordinator handles fulfillment
  if (!hasMinimumRole(req, res, 'Equipment_Coordinator')) return;
  
  const reqId = validateId(id, res);
  if (!reqId) return;

  const body = await parseBody(req);
  const data = validateBody(body, fulfillRequisitionSchema, res);
  if (!data) return;

  const sectorId = data.sectorId || 1; // Default to sector 1 if not specified
  
  const result = await requisitionsService.fulfill(reqId, user.id, sectorId);

  // Broadcast fulfillment status
  websocket.broadcastToChannel('requisitions', 'REQUISITION_FULFILLED', {
    requisitionId: reqId,
    fulfilledBy: user.id
  });

  // Notify the submitter
  try {
    if (result.submittedById) {
      await notifService.create({
        userId: result.submittedById,
        type: 'success', icon: 'fa-box-check',
        title: 'Requisition Fulfilled',
        message: `Your requisition ${result.reqCode || '#' + reqId} has been fulfilled and materials are in inventory.`
      });
    }
  } catch (e) { console.error('Notif create failed:', e.message); }

  // Permanent Audit Log
  await auditService.logFromRequest(req, 'FULFILLED (GRN Intake)', 'Requisition', result.id, result.reqCode, {
    action: 'Materials ingested into inventory',
    sectorId: sectorId
  });

  response.success(res, result);
});

module.exports = { getAll, getById, create, approve, reject, flagFraud, getPending, fulfill };

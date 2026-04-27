/**
 * MCMS Controller - Procurement
 */

const procurementService = require('../services/procurement.service');
const { validateBody, validateId, parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { hasRole } = require('../middlewares/rbac.middleware');
const auditService = require('../services/audit.service');
const notifService = require('../services/notification.service');
const { createProcurementSchema, paginationSchema } = require('../utils/validators');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const query = parseQuery(req.url);
  const options = validateBody(query, paginationSchema, res);
  if (!options) return;
  
  const result = await procurementService.getAll({ ...options, status: query.status });
  response.paginated(res, result.requests, result.page, result.limit, result.total);
});

const getById = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const reqId = validateId(id, res);
  if (!reqId) return;
  
  const result = await procurementService.getById(reqId);
  response.success(res, result);
});

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, createProcurementSchema, res);
  if (!data) return;
  
  const result = await procurementService.create(data, user.id);

  // Notify PMs
  await notifService.notifyRole('Project_Manager', {
    type: 'info', icon: 'fa-shopping-cart',
    title: 'New Procurement Request',
    message: `${user.name} requested ${data.vehicleName || data.reqCode}. Review required.`
  });

  // Audit Log
  await auditService.logFromRequest(req, 'CREATED', 'ProcurementRequest', result.id, result.reqCode, data);

  response.created(res, result);
});

const pmApprove = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasRole(req, res, ['Project_Manager', 'Operations_Manager', 'Managing_Director'])) return;
  
  const reqId = validateId(id, res);
  if (!reqId) return;
  
  const body = await parseBody(req);
  const result = await procurementService.pmApprove(reqId, body.comments);

  // Notify Finance
  await notifService.notifyRole('Finance_Director', {
    type: 'info', icon: 'fa-check-double',
    title: 'Procurement PM Approved',
    message: `Request ${result.reqCode} approved by PM. Finance review needed.`
  });

  // Audit Log
  await auditService.logFromRequest(req, 'PM_APPROVED', 'ProcurementRequest', result.id, result.reqCode, { comments: body.comments });

  response.success(res, result);
});

const pmReject = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasRole(req, res, ['Project_Manager', 'Operations_Manager', 'Managing_Director'])) return;
  
  const reqId = validateId(id, res);
  if (!reqId) return;
  
  const body = await parseBody(req);
  const result = await procurementService.pmReject(reqId, body.comments);

  // Notify Requester
  await notifService.create({
    userId: result.requestedBy,
    type: 'error', icon: 'fa-times-circle',
    title: 'Procurement Rejected by PM',
    message: `Your request ${result.reqCode} was rejected. Reason: ${body.comments}`
  });

  // Audit Log
  await auditService.logFromRequest(req, 'PM_REJECTED', 'ProcurementRequest', result.id, result.reqCode, { reason: body.comments });

  response.success(res, result);
});

const financeApprove = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasRole(req, res, ['Finance_Director', 'Managing_Director'])) return;
  
  const reqId = validateId(id, res);
  if (!reqId) return;
  
  const body = await parseBody(req);
  const result = await procurementService.financeApprove(reqId, body.comments);

  // Notify Requester
  await notifService.create({
    userId: result.requestedBy,
    type: 'success', icon: 'fa-check-circle',
    title: 'Procurement Approved by Finance',
    message: `Your request ${result.reqCode} has been approved for purchase.`
  });

  // Audit Log
  await auditService.logFromRequest(req, 'FINANCE_APPROVED', 'ProcurementRequest', result.id, result.reqCode, { comments: body.comments });

  response.success(res, result);
});

const financeReject = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasRole(req, res, ['Finance_Director', 'Managing_Director'])) return;
  
  const reqId = validateId(id, res);
  if (!reqId) return;
  
  const body = await parseBody(req);
  const result = await procurementService.financeReject(reqId, body.comments);

  // Notify Requester
  await notifService.create({
    userId: result.requestedBy,
    type: 'error', icon: 'fa-times-circle',
    title: 'Procurement Rejected by Finance',
    message: `Your request ${result.reqCode} was rejected by Finance. Reason: ${body.comments}`
  });

  // Audit Log
  await auditService.logFromRequest(req, 'FINANCE_REJECTED', 'ProcurementRequest', result.id, result.reqCode, { reason: body.comments });

  response.success(res, result);
});

const markPurchased = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const reqId = validateId(id, res);
  if (!reqId) return;
  
  const result = await procurementService.markPurchased(reqId);

  // Audit Log
  await auditService.logFromRequest(req, 'MARKED_PURCHASED', 'ProcurementRequest', result.id, result.reqCode);

  response.success(res, result);
});

const getProjectStatus = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const projectId = validateId(id, res);
  if (!projectId) return;
  
  const result = await procurementService.getProjectStatus(projectId);
  response.success(res, result);
});

module.exports = { getAll, getById, create, pmApprove, pmReject, financeApprove, financeReject, markPurchased, getProjectStatus };

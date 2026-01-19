/**
 * MCMS Controller - Procurement
 */

const procurementService = require('../services/procurement.service');
const { validateBody, validateId, parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { hasRole } = require('../middlewares/rbac.middleware');
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
  response.success(res, result);
});

const markPurchased = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const reqId = validateId(id, res);
  if (!reqId) return;
  
  const result = await procurementService.markPurchased(reqId);
  response.success(res, result);
});

module.exports = { getAll, getById, create, pmApprove, pmReject, financeApprove, financeReject, markPurchased };

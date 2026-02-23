/**
 * MCMS Controller - Requisitions
 */

const requisitionsService = require('../services/requisitions.service');
const { validateBody, validateId, parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { hasMinimumRole } = require('../middlewares/rbac.middleware');
const { createRequisitionSchema, paginationSchema } = require('../utils/validators');
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
  response.created(res, result);
});

const approve = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Finance_Director')) return;
  
  const reqId = validateId(id, res);
  if (!reqId) return;
  
  const result = await requisitionsService.approve(reqId, user.id);
  response.success(res, result);
});

const reject = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Finance_Director')) return;
  
  const reqId = validateId(id, res);
  if (!reqId) return;
  
  const body = await parseBody(req);
  const result = await requisitionsService.reject(reqId, user.id, body.reason);
  response.success(res, result);
});

const flagFraud = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Finance_Director')) return;
  
  const reqId = validateId(id, res);
  if (!reqId) return;
  
  const result = await requisitionsService.flagFraud(reqId, user.id);
  response.success(res, result);
});

const getPending = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const result = await requisitionsService.getPending();
  response.success(res, result);
});

module.exports = { getAll, getById, create, approve, reject, flagFraud, getPending };

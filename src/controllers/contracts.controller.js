/**
 * MCMS Controller - Contracts
 */

const contractsService = require('../services/contracts.service');
const { validateBody, validateId, parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { createContractSchema, updateContractSchema, paginationSchema } = require('../utils/validators');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const query = parseQuery(req.url);
  const options = validateBody(query, paginationSchema, res);
  if (!options) return;
  
  const result = await contractsService.getAll({ ...options, status: query.status });
  response.paginated(res, result.contracts, result.page, result.limit, result.total);
});

const getById = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;
  
  const result = await contractsService.getById(contractId);
  response.success(res, result);
});

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, createContractSchema, res);
  if (!data) return;
  
  const result = await contractsService.create(data);
  response.created(res, result);
});

const update = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, updateContractSchema, res);
  if (!data) return;
  
  const result = await contractsService.update(contractId, data);
  response.success(res, result);
});

const remove = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;
  
  await contractsService.remove(contractId);
  response.noContent(res);
});

module.exports = { getAll, getById, create, update, remove };

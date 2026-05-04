/**
 * MCMS Controller - Contracts
 */

const contractsService = require('../services/contracts.service');
const { validateBody, validateId, parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { hasMinimumRole } = require('../middlewares/rbac.middleware');
const { createContractSchema, updateContractSchema, paginationSchema } = require('../utils/validators');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Field_Supervisor')) return;
  
  const query = parseQuery(req.url);
  const options = validateBody(query, paginationSchema, res);
  if (!options) return;
  
  const result = await contractsService.getAll({ ...options, status: query.status });
  response.paginated(res, result.contracts, result.page, result.limit, result.total);
});

const getById = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Field_Supervisor')) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;
  
  const result = await contractsService.getById(contractId);
  response.success(res, result);
});

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Project_Manager')) return;
  // const user = { id: 1 }; // Mock user
  
  const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
  const body = isMultipart ? req.body : await parseBody(req);
  
  const data = validateBody(body, createContractSchema, res);
  if (!data) return;
  
  if (req.file) {
    data.documentUrl = `/uploads/documents/${req.file.filename}`;
    data.fileName = req.file.originalname;
  }
  
  const result = await contractsService.create(data, user.id);
  response.created(res, result);
});

const update = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Contract_Administrator')) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, updateContractSchema, res);
  if (!data) return;
  
  const result = await contractsService.update(contractId, data, user.id);
  response.success(res, result);
});

const remove = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Contract_Administrator')) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;
  
  await contractsService.remove(contractId, user.id);
  response.noContent(res);
});

const approve = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Project_Manager')) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;
  
  const result = await contractsService.approve(contractId, user.id);
  response.success(res, result);
});

const rateVendor = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Finance_Director')) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;
  
  const body = await parseBody(req);
  if (!body.rating) {
    return response.badRequest(res, 'Rating is required (1-5)');
  }

  const result = await contractsService.rateVendor(contractId, body, user.id);
  response.success(res, result);
});

const terminateContract = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Finance_Director')) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;
  
  const body = await parseBody(req);
  if (!body.reason) {
    return response.badRequest(res, 'Termination reason is required');
  }

  const result = await contractsService.terminate(contractId, body, user);
  response.success(res, result);
});

module.exports = { getAll, getById, create, update, remove, approve, rateVendor, terminateContract };

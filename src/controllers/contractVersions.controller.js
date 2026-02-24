const contractVersionsService = require('../services/contractVersions.service');
const { validateBody, validateId, parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { hasMinimumRole } = require('../middlewares/rbac.middleware');
const { createContractVersionSchema } = require('../utils/validators');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const getByContract = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Field_Supervisor')) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;
  
  const result = await contractVersionsService.getByContract(contractId);
  response.success(res, result);
});

const create = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Contract_Administrator')) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, createContractVersionSchema, res);
  if (!data) return;
  
  const result = await contractVersionsService.create(contractId, data, user.id);
  response.created(res, result);
});

module.exports = { getByContract, create };

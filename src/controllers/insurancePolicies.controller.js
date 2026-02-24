const insurancePoliciesService = require('../services/insurancePolicies.service');
const { validateBody, validateId, parseBody } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { hasMinimumRole } = require('../middlewares/rbac.middleware');
const { createInsurancePolicySchema, updateInsurancePolicySchema } = require('../utils/validators');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Field_Supervisor')) return;
  
  const result = await insurancePoliciesService.getAll();
  response.success(res, result);
});

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Contract_Administrator')) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, createInsurancePolicySchema, res);
  if (!data) return;
  
  const result = await insurancePoliciesService.create(data, user.id);
  response.created(res, result);
});

const update = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Contract_Administrator')) return;
  
  const policyId = validateId(id, res);
  if (!policyId) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, updateInsurancePolicySchema, res);
  if (!data) return;
  
  const result = await insurancePoliciesService.update(policyId, data, user.id);
  response.success(res, result);
});

const remove = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Contract_Administrator')) return;
  
  const policyId = validateId(id, res);
  if (!policyId) return;
  
  await insurancePoliciesService.remove(policyId, user.id);
  response.noContent(res);
});

module.exports = { getAll, create, update, remove };

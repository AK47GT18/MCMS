/**
 * MCMS Controller - Replenishment API
 */

const replenishmentService = require('../services/replenishment.service');
const { asyncHandler } = require('../middlewares/error.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { hasRole } = require('../middlewares/rbac.middleware');
const { parseBody } = require('../middlewares/validate.middleware');
const response = require('../utils/response');

const getByProject = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  if (!id) return response.badRequest(res, 'Project ID is required');

  const requests = await replenishmentService.getByProject(parseInt(id, 10));
  response.success(res, requests);
});

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const result = await replenishmentService.createRequest(body, user);
  response.created(res, result);
});

const financeAction = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  if (!hasRole(req, res, ['Finance_Director', 'System_Technician', 'Managing_Director'])) return;

  const body = await parseBody(req);
  const result = await replenishmentService.financeAction(parseInt(id, 10), body, user);
  response.success(res, result);
});

const pmAction = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  if (!hasRole(req, res, ['Project_Manager', 'System_Technician', 'Managing_Director'])) return;

  const body = await parseBody(req);
  const result = await replenishmentService.pmAction(parseInt(id, 10), body, user);
  response.success(res, result);
});

const complete = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const result = await replenishmentService.completeRequest(parseInt(id, 10), user);
  response.success(res, result);
});

module.exports = {
  getByProject,
  create,
  financeAction,
  pmAction,
  complete
};

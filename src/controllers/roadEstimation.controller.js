/**
 * MCMS Controller - Road Estimation
 * Handles road project estimation, linking, and budget adjustments
 */

const estimationService = require('../services/roadEstimation.service');
const { validateBody, validateId, parseBody } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { roadEstimationInputSchema } = require('../utils/validators');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const calculate = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, roadEstimationInputSchema, res);
  if (!data) return;
  
  const result = estimationService.calculateEstimate(data);
  response.success(res, result);
});

const getForProject = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const projectId = validateId(id, res);
  if (!projectId) return;
  
  const result = await estimationService.getEstimateByProject(projectId);
  response.success(res, result);
});

const save = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const projectId = validateId(body.projectId, res);
  if (!projectId) return;

  const data = validateBody(body, roadEstimationInputSchema, res);
  if (!data) return;

  // The client passes the agreed approved budget (which could be the high-end or midpoint)
  const approvedTotal = req.body.approvedTotal;
  if (!approvedTotal) {
    return response.error(res, 'approvedTotal is required', 400);
  }

  // Recalculate cleanly from server-side constants, but allow manual overrides if provided
  let estimateData = estimationService.calculateEstimate(data);
  
  if (body.layers && Array.isArray(body.layers)) {
    estimateData.layers = body.layers;
  }
  
  // Only override accessories if they are full objects (not just category keys)
  if (body.accessories && Array.isArray(body.accessories) && body.accessories.length > 0 && typeof body.accessories[0] === 'object') {
    estimateData.accessories = body.accessories;
  }
  
  const result = await estimationService.saveEstimate(projectId, estimateData, approvedTotal);
  response.success(res, result);
});

const toggleItem = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const projectId = validateId(id, res);
  if (!projectId) return;

  const body = await parseBody(req);
  const { itemType, itemId } = body;
  if (!itemType || !itemId) {
    return response.error(res, 'itemType (layer | accessory) and itemId are required', 400);
  }

  const result = await estimationService.toggleItem(projectId, itemType, itemId);
  response.success(res, result);
});

module.exports = { calculate, save, getForProject, toggleItem };

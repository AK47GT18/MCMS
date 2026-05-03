/**
 * MCMS Controller - PM
 * Handles PM-specific configuration and VOs
 */

const pmService = require('../services/pm.service');
const { parseBody, parseId, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const getMaterialPrices = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const query = parseQuery(req.url);
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 15;
  const search = query.search || '';
  const category = query.category || '';
  
  const result = await pmService.getMaterialPrices(page, limit, search, category);
  response.success(res, result);
});

const upsertMaterialPrice = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const result = await pmService.upsertMaterialPrice(body, user.id);
  response.success(res, result);
});

const deleteMaterialPrice = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  await pmService.deleteMaterialPrice(id);
  response.success(res, { message: 'Price configuration deleted' });
});

const createVariationOrder = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const result = await pmService.createVariationOrder(body, user.id);
  response.success(res, result);
});

const getVariationOrders = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const { projectId, contractId } = req.query || {};
  const result = await pmService.getVariationOrders(projectId, contractId);
  response.success(res, result);
});

module.exports = {
  getMaterialPrices,
  upsertMaterialPrice,
  deleteMaterialPrice,
  createVariationOrder,
  getVariationOrders
};

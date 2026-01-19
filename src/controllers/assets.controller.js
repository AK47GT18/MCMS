/**
 * MCMS Controller - Assets
 */

const assetsService = require('../services/assets.service');
const { validateBody, validateId, parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { createAssetSchema, updateAssetSchema, paginationSchema } = require('../utils/validators');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const query = parseQuery(req.url);
  const options = validateBody(query, paginationSchema, res);
  if (!options) return;
  
  const result = await assetsService.getAll({ ...options, status: query.status, category: query.category });
  response.paginated(res, result.assets, result.page, result.limit, result.total);
});

const getById = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const assetId = validateId(id, res);
  if (!assetId) return;
  
  const result = await assetsService.getById(assetId);
  response.success(res, result);
});

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, createAssetSchema, res);
  if (!data) return;
  
  const result = await assetsService.create(data);
  response.created(res, result);
});

const update = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const assetId = validateId(id, res);
  if (!assetId) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, updateAssetSchema, res);
  if (!data) return;
  
  const result = await assetsService.update(assetId, data);
  response.success(res, result);
});

const remove = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const assetId = validateId(id, res);
  if (!assetId) return;
  
  await assetsService.remove(assetId);
  response.noContent(res);
});

const checkOut = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const assetId = validateId(id, res);
  if (!assetId) return;
  
  const body = await parseBody(req);
  const result = await assetsService.checkOut(assetId, user.id, body.projectId);
  response.success(res, result);
});

const checkIn = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const assetId = validateId(id, res);
  if (!assetId) return;
  
  const body = await parseBody(req);
  const result = await assetsService.checkIn(assetId, user.id, body.fuelLevel);
  response.success(res, result);
});

const getAvailable = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const result = await assetsService.getAvailable();
  response.success(res, result);
});

module.exports = { getAll, getById, create, update, remove, checkOut, checkIn, getAvailable };

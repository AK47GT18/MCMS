/**
 * MCMS Controller - Vendors
 */

const vendorsService = require('../services/vendors.service');
const { validateBody, validateId, parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { createVendorSchema, updateVendorSchema, paginationSchema } = require('../utils/validators');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const query = parseQuery(req.url);
  const options = validateBody(query, paginationSchema, res);
  if (!options) return;
  
  const result = await vendorsService.getAll({ ...options, status: query.status });
  response.paginated(res, result.vendors, result.page, result.limit, result.total);
});

const getById = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const vendorId = validateId(id, res);
  if (!vendorId) return;
  
  const result = await vendorsService.getById(vendorId);
  response.success(res, result);
});

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, createVendorSchema, res);
  if (!data) return;
  
  const result = await vendorsService.create(data);
  response.created(res, result);
});

const update = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const vendorId = validateId(id, res);
  if (!vendorId) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, updateVendorSchema, res);
  if (!data) return;
  
  const result = await vendorsService.update(vendorId, data);
  response.success(res, result);
});

const remove = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const vendorId = validateId(id, res);
  if (!vendorId) return;
  
  await vendorsService.remove(vendorId);
  response.noContent(res);
});

const getApproved = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const result = await vendorsService.getApproved();
  response.success(res, result);
});

module.exports = { getAll, getById, create, update, remove, getApproved };

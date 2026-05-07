/**
 * MCMS Controller - Vehicle Rental & Equipment Contracts
 */

const rentalService = require('../services/vehicleRental.service');
const { validateBody, validateId, parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { hasRole, hasMinimumRole } = require('../middlewares/rbac.middleware');
const auditService = require('../services/audit.service');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const query = parseQuery(req.url);
  const result = await rentalService.getAll(query);
  response.paginated(res, result.contracts, result.page, result.limit, result.total);
});

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  // Using flexible validation since we handle multiple types
  if (!body.projectId || !body.machineType || !body.vendorName || !body.startDate || !body.endDate) {
    return response.badRequest(res, 'Missing required fields: projectId, machineType, vendorName, startDate, endDate');
  }

  const result = await rentalService.create(body, user.id);

  await auditService.logFromRequest(req, 'CREATED', 'VehicleContract', result.id, result.refCode, body);
  response.created(res, result);
});

const approve = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasRole(req, res, ['Finance_Director', 'Managing_Director'])) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;
  
  const result = await rentalService.approve(contractId, user.id);

  await auditService.logFromRequest(req, 'APPROVED', 'VehicleContract', result.id, result.refCode);
  response.success(res, result);
});

const reject = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasRole(req, res, ['Finance_Director', 'Managing_Director'])) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;

  const body = await parseBody(req);
  const result = await rentalService.reject(contractId, user.id, body.reason);

  await auditService.logFromRequest(req, 'REJECTED', 'VehicleContract', result.id, result.refCode, body);
  response.success(res, result);
});

const renew = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;
  
  const body = await parseBody(req);
  const result = await rentalService.renew(contractId, body, user.id);

  await auditService.logFromRequest(req, 'RENEWED', 'VehicleContract', result.id, result.refCode, body);
  response.success(res, result);
});

const shift = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;
  
  const body = await parseBody(req);
  const result = await rentalService.shift(contractId, body, user.id);

  await auditService.logFromRequest(req, 'SHIFTED', 'VehicleContract', result.id, result.refCode, body);
  response.success(res, result);
});

const markReturned = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const contractId = validateId(id, res);
  if (!contractId) return;
  
  const body = await parseBody(req);
  const result = await rentalService.markReturned(contractId, body.returnDate || new Date(), user.id);

  await auditService.logFromRequest(req, 'RETURNED', 'VehicleContract', result.id, result.refCode, body);
  response.success(res, result);
});

const getPriceConfigs = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const result = await rentalService.getPriceConfigs();
  response.success(res, result);
});

const updatePriceConfig = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Finance_Director')) return;
  
  const body = await parseBody(req);
  if (!body.machineType || !body.dailyRate) {
    return response.badRequest(res, 'machineType and dailyRate are required');
  }

  const result = await rentalService.updatePriceConfig(body.machineType, body, user.id);
  response.success(res, result);
});

module.exports = {
  getAll,
  create,
  approve,
  reject,
  renew,
  shift,
  markReturned,
  getPriceConfigs,
  updatePriceConfig
};

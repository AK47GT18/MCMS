/**
 * MCMS Controller - Inventory API
 */

const inventoryService = require('../services/inventory.service');
const { asyncHandler } = require('../middlewares/error.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { hasRole } = require('../middlewares/rbac.middleware');
const { parseBody } = require('../middlewares/validate.middleware');
const response = require('../utils/response');

/**
 * Get inventory for a specific sector
 */
const getBySector = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  if (!id) return response.badRequest(res, 'Sector ID is required');

  const inventory = await inventoryService.getBySector(parseInt(id, 10));
  response.success(res, inventory);
});

/**
 * Distribute materials (Stock IN)
 */
const distribute = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  if (!hasRole(req, res, ['Equipment_Coordinator', 'Project_Manager', 'Finance_Director', 'System_Technician', 'Managing_Director'])) return;
  
  const body = await parseBody(req);
  const result = await inventoryService.distribute(body, user);
  response.created(res, result);
});

/**
 * Consume materials (Stock OUT)
 */
const consume = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;

  if (!hasRole(req, res, ['Field_Supervisor', 'Project_Manager', 'System_Technician', 'Managing_Director'])) return;

  const body = await parseBody(req);
  const result = await inventoryService.consume(body, user);
  response.success(res, result);
});

module.exports = {
  getBySector,
  distribute,
  consume
};

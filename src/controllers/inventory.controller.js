/**
 * MCMS Controller - Inventory API
 */

const inventoryService = require('../services/inventory.service');
const websocket = require('../realtime/websocket');
const notifService = require('../services/notification.service');
const auditService = require('../services/audit.service');
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

  // Broadcast to all logistics subscribers
  websocket.broadcastToChannel('logistics', 'INVENTORY_UPDATED', {
    action: 'distribute',
    materialName: body.materialName,
    quantity: body.quantity,
    sectorId: body.sectorId,
    inventory: result.inventory,
    userId: user.id
  });

  // Notify relevant roles
  try {
    await notifService.notifyRole('Project_Manager', {
      type: 'success', icon: 'fa-truck-ramp-box',
      title: 'Materials Distributed',
      message: `${body.quantity} ${result.inventory.unit || 'units'} of ${body.materialName} distributed to site.`
    });
  } catch (e) { console.error('Notif:', e.message); }

  // Permanent Audit Log
  await auditService.logFromRequest(req, 'DISTRIBUTED (Stock IN)', 'Inventory', body.sectorId, body.materialName, {
    quantity: body.quantity,
    unit: result.inventory.unit,
    sectorId: body.sectorId
  });

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

  // Broadcast consumption event
  websocket.broadcastToChannel('logistics', 'INVENTORY_CONSUMED', {
    action: 'consume',
    materialName: body.materialName,
    quantity: body.quantity,
    sectorId: body.sectorId,
    inventory: result.inventory,
    userId: user.id
  });

  // Low-stock alert notification
  try {
    const inv = result.inventory;
    if (Number(inv.quantityOnHand) <= Number(inv.lowThreshold) && Number(inv.lowThreshold) > 0) {
      await notifService.notifyRole('Equipment_Coordinator', {
        type: 'warning', icon: 'fa-exclamation-triangle',
        title: 'Low Stock Alert',
        message: `${body.materialName} is at ${inv.quantityOnHand} ${inv.unit} — below threshold of ${inv.lowThreshold}.`
      });
      await notifService.notifyRole('Project_Manager', {
        type: 'warning', icon: 'fa-box-open',
        title: 'Material Buffer Alert',
        message: `${body.materialName} stock is critically low (${inv.quantityOnHand} ${inv.unit}). Request replenishment.`
      });
    }
  } catch (e) { console.error('Notif:', e.message); }

  // Permanent Audit Log
  await auditService.logFromRequest(req, 'CONSUMED (Stock OUT)', 'Inventory', body.sectorId, body.materialName, {
    quantity: body.quantity,
    unit: result.inventory.unit,
    sectorId: body.sectorId,
    reference: body.reference
  });

  response.success(res, result);
});

/**
 * Get inventory for a specific project (across all sectors)
 */
const getByProject = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  if (!id) return response.badRequest(res, 'Project ID is required');

  const inventory = await inventoryService.getByProject(parseInt(id, 10));
  response.success(res, inventory);
});

module.exports = {
  getBySector,
  getByProject,
  distribute,
  consume
};

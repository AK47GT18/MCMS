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
const { parseBody, validateBody } = require('../middlewares/validate.middleware');
const { inventoryDistributeSchema, inventoryConsumeSchema } = require('../utils/validators');
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
  const data = validateBody(body, inventoryDistributeSchema, res);
  if (!data) return;

  const result = await inventoryService.distribute(data, user);

  // Broadcast to all logistics subscribers
  websocket.broadcastToChannel('logistics', 'INVENTORY_UPDATED', {
    action: 'distribute',
    materialName: data.materialName,
    quantity: data.quantity,
    sectorId: data.sectorId,
    inventory: result.inventory,
    userId: user.id
  });

  // Notify relevant roles
  try {
    await notifService.notifyRole('Project_Manager', {
      type: 'success', icon: 'fa-truck-ramp-box',
      title: 'Materials Distributed',
      message: `${data.quantity} ${result.inventory.unit || 'units'} of ${data.materialName} distributed to site.`
    });
  } catch (e) { console.error('Notif:', e.message); }

  // Permanent Audit Log
  await auditService.logFromRequest(req, 'DISTRIBUTED (Stock IN)', 'Inventory', data.sectorId, data.materialName, {
    quantity: data.quantity,
    unit: result.inventory.unit,
    sectorId: data.sectorId,
    reference: data.reference,
    notes: data.notes
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
  const data = validateBody(body, inventoryConsumeSchema, res);
  if (!data) return;

  const result = await inventoryService.consume(data, user);

  // Broadcast consumption event
  websocket.broadcastToChannel('logistics', 'INVENTORY_CONSUMED', {
    action: 'consume',
    materialName: data.materialName,
    quantity: data.quantity,
    sectorId: data.sectorId,
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
        message: `${data.materialName} is at ${inv.quantityOnHand} ${inv.unit} — below threshold of ${inv.lowThreshold}.`
      });
      await notifService.notifyRole('Project_Manager', {
        type: 'warning', icon: 'fa-box-open',
        title: 'Material Buffer Alert',
        message: `${data.materialName} stock is critically low (${inv.quantityOnHand} ${inv.unit}). Request replenishment.`
      });
    }
  } catch (e) { console.error('Notif:', e.message); }

  // Permanent Audit Log
  await auditService.logFromRequest(req, 'CONSUMED (Stock OUT)', 'Inventory', data.sectorId, data.materialName, {
    quantity: data.quantity,
    unit: result.inventory.unit,
    sectorId: data.sectorId,
    reference: data.reference
  });

  response.success(res, result);
});

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasRole(req, res, ['Equipment_Coordinator', 'Finance_Director', 'Project_Manager', 'Managing_Director', 'Field_Supervisor'])) return;

  const result = await inventoryService.getAll();
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

const getIncomingShipments = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasRole(req, res, ['Equipment_Coordinator', 'Finance_Director', 'Project_Manager', 'Managing_Director'])) return;

  const shipments = await inventoryService.getIncomingShipments();
  response.success(res, shipments);
});

const receiveShipment = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasRole(req, res, ['Equipment_Coordinator', 'Finance_Director', 'Managing_Director'])) return;

  const body = await parseBody(req);
  const { contractItemId, receivedQty } = body;
  if (!contractItemId || !receivedQty || receivedQty <= 0) {
    return response.badRequest(res, 'Valid contractItemId and receivedQty are required');
  }

  const result = await inventoryService.receiveShipment(contractItemId, receivedQty, user.id);

  // Broadcast
  websocket.broadcastToChannel('logistics', 'INVENTORY_UPDATED', {
    action: 'receive_shipment',
    materialName: result.materialName,
    quantity: receivedQty,
    userId: user.id
  });

  await auditService.logFromRequest(req, 'RECEIVED_PROCUREMENT', 'Inventory', null, result.materialName, {
    quantity: receivedQty,
    contractItemId
  });

  response.success(res, result);
});

/**
 * Initiate a return (Reverse Dispatch)
 */
const initiateReturn = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  if (!hasRole(req, res, ['Equipment_Coordinator', 'Field_Supervisor', 'Project_Manager', 'Managing_Director'])) return;

  const body = await parseBody(req);
  const result = await returnsService.initiateReturn(body, user);

  // Broadcast
  websocket.broadcastToChannel('logistics', 'INVENTORY_RETURNED', {
    action: 'return',
    materialName: body.materialName,
    quantity: body.quantity,
    fromSectorId: body.fromSectorId,
    toSectorId: body.toSectorId,
    userId: user.id
  });

  await auditService.logFromRequest(req, 'REVERSE_DISPATCH (Return)', 'Inventory', body.fromSectorId, body.materialName, {
    quantity: body.quantity,
    toSectorId: body.toSectorId,
    reference: body.reference
  });

  response.success(res, result, 'Reverse dispatch completed successfully');
});

const getAllLogs = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasRole(req, res, ['Equipment_Coordinator', 'Finance_Director', 'Project_Manager', 'Managing_Director', 'Field_Supervisor'])) return;

  const logs = await inventoryService.getAllLogs();
  response.success(res, logs);
});

module.exports = {
  getBySector,
  getByProject,
  getAll,
  getAllLogs,
  distribute,
  consume,
  getIncomingShipments,
  receiveShipment,
  initiateReturn
};

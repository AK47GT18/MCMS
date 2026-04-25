/**
 * MCMS Controller - Assets
 */

const assetsService = require('../services/assets.service');
const websocket = require('../realtime/websocket');
const notifService = require('../services/notification.service');
const auditService = require('../services/audit.service');
const { validateBody, validateId, parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { createAssetSchema, updateAssetSchema, paginationSchema, assetCheckOutSchema, assetCheckInSchema, assetFlagIssueSchema, assetResolveIssueSchema } = require('../utils/validators');
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
  const data = validateBody(body, assetCheckOutSchema, res);
  if (!data) return;

  const result = await assetsService.checkOut(assetId, user.id, data.projectId);

  // Broadcast asset dispatched
  websocket.broadcastToChannel('assets', 'ASSET_DISPATCHED', {
    assetId,
    projectId: data.projectId,
    userId: user.id,
    asset: result
  });

  // Create persistent notification for the PM and FS of the project
  try {
    const project = await require('../config/database').prisma.project.findUnique({
      where: { id: parseInt(body.projectId) }
    });
    if (project) {
       await notifService.create({
          userId: project.managerId,
          type: 'info', icon: 'fa-truck-monster',
          title: 'Asset Dispatched',
          message: `${result.name} (${result.assetCode || 'ID:' + result.id}) has been dispatched to your project.`
       });
       if (project.fieldSupervisorId) {
           await notifService.create({
               userId: project.fieldSupervisorId,
               type: 'info', icon: 'fa-truck-monster',
               title: 'Equipment Arriving',
               message: `${result.name} (${result.assetCode || 'ID:' + result.id}) is en-route to your site.`
           });
       }
    }
  } catch (e) {
    console.error('Notif create failed:', e.message);
  }

  // Permanent Audit Log
  await auditService.logFromRequest(req, 'DISPATCHED', 'Asset', result.id, result.assetCode, {
    destinationProjectId: data.projectId,
    assetName: result.name
  });

  response.success(res, result);
});

const checkIn = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const assetId = validateId(id, res);
  if (!assetId) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, assetCheckInSchema, res);
  if (!data) return;

  const result = await assetsService.checkIn(assetId, user.id, data.fuelLevel);

  // Broadcast asset returned
  websocket.broadcastToChannel('assets', 'ASSET_RETURNED', {
    assetId,
    userId: user.id,
    asset: result
  });

  // Create persistent notification for EC
  try {
    await notifService.notifyRole('Equipment_Coordinator', {
      type: 'success', icon: 'fa-warehouse',
      title: 'Equipment Returned',
      message: `${result.name} (${result.assetCode || 'ID:' + result.id}) has been checked in from the field.`
    });
  } catch(e) {
    console.error('Notif create failed:', e.message);
  }

  // Permanent Audit Log
  await auditService.logFromRequest(req, 'RETURNED (Check-in)', 'Asset', result.id, result.assetCode, {
    assetName: result.name,
    fuelLevel: data.fuelLevel
  });

  response.success(res, result);
});

const getAvailable = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const result = await assetsService.getAvailable();
  response.success(res, result);
});

const flagIssue = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const assetId = validateId(id, res);
  if (!assetId) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, assetFlagIssueSchema, res);
  if (!data) return;

  const result = await assetsService.flagIssue(assetId, user.id, data.description);

  // Notify EC
  try {
    const notifService = require('../services/notification.service');
    await notifService.notifyRole('Equipment_Coordinator', {
      type: 'error', icon: 'fa-triangle-exclamation',
      title: 'Equipment Breakdown Reported',
      message: `${result.name} (${result.assetCode}) was flagged for maintenance by ${user.name}.`
    });
  } catch(e) {}

  await auditService.logFromRequest(req, 'FLAGGED_DEFECTIVE', 'Asset', result.id, result.assetCode, {
    description: data.description
  });

  response.success(res, result);
});

const resolveIssue = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const assetId = validateId(id, res);
  if (!assetId) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, assetResolveIssueSchema, res);
  if (!data) return;

  const result = await assetsService.resolveIssue(assetId, user.id, data.resolutionNotes);

  await auditService.logFromRequest(req, 'ISSUE_RESOLVED', 'Asset', result.id, result.assetCode, {
    resolutionNotes: data.resolutionNotes
  });

  response.success(res, result);
});

module.exports = { getAll, getById, create, update, remove, checkOut, checkIn, getAvailable, flagIssue, resolveIssue };

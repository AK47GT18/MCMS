/**
 * MCMS Controller - Audit Logs
 * Handles audit log retrieval
 */

const auditService = require('../services/audit.service');
const { authenticate } = require('../middlewares/auth.middleware');
const { parseQuery } = require('../middlewares/validate.middleware');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * GET /api/v1/audit-logs
 * Get all audit logs with pagination
 */
const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  // Normalize role to handle db format variants
  const userRole = user.role.replace(' ', '_');
  
  // Only allow PM, FD, MD, ST, and EC to view audit logs
  const allowedRoles = ['Project_Manager', 'Finance_Director', 'Managing_Director', 'System_Technician', 'Equipment_Coordinator'];
  if (!allowedRoles.includes(userRole)) {
    return response.forbidden(res, 'Access denied');
  }
  
  const query = parseQuery(req.url);
  const result = await auditService.getAll({
    page: parseInt(query.page) || 1,
    limit: parseInt(query.limit) || 50,
    userId: query.userId ? parseInt(query.userId) : undefined,
    action: query.action,
    targetType: query.targetType,
    severity: query.severity,
    search: query.search,
    startDate: query.startDate,
    endDate: query.endDate,
  });
  
  response.success(res, result);
});

/**
 * GET /api/v1/audit-logs/actions
 * Get unique action types
 */
const getUniqueActions = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const actions = await auditService.getUniqueActions();
  response.success(res, actions);
});

/**
 * GET /api/v1/audit-logs/recent
 * Get recent activity for dashboard
 */
const getRecent = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const query = parseQuery(req.url);
  const limit = parseInt(query.limit) || 20;
  
  const logs = await auditService.getRecentActivity(limit);
  response.success(res, logs);
});

/**
 * POST /api/v1/audit-logs
 * Create an audit log entry (client-side triggers)
 */
const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const { parseBody } = require('../middlewares/validate.middleware');
  const body = await parseBody(req);
  
  await auditService.log({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: body.action,
    targetType: body.targetType,
    targetId: body.targetId ? parseInt(body.targetId) : null,
    targetCode: body.targetCode,
    details: body.details,
    severity: body.severity || 'info',
    ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress
  });

  response.success(res, { message: 'Audit log created' });
});

module.exports = { getAll, getRecent, getUniqueActions, create };

/**
 * MCMS Middleware - Role-Based Access Control (RBAC)
 * Controls access to endpoints based on user roles and permissions
 */

const response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Role hierarchy - higher roles inherit lower role permissions
 */
const ROLE_HIERARCHY = {
  'Managing_Director': 100,
  'Operations_Manager': 90,
  'Finance_Director': 80,
  'Project_Manager': 70,
  'Contract_Administrator': 60,
  'Equipment_Coordinator': 50,
  'Field_Supervisor': 40,
  'System_Technician': 30,
};

/**
 * Check if user has required role
 * @param {http.IncomingMessage} req - Request with user attached
 * @param {http.ServerResponse} res - Response object
 * @param {string[]} allowedRoles - Array of allowed role names
 * @returns {boolean} True if authorized, false if not
 */
function hasRole(req, res, allowedRoles) {
  if (!req.user) {
    response.unauthorized(res, 'Authentication required');
    return false;
  }
  
  // Convert Prisma role format to match our enum
  const userRole = req.user.role.replace(' ', '_');
  
  if (!allowedRoles.includes(userRole)) {
    logger.warn('Access denied - insufficient role', {
      userId: req.user.id,
      userRole,
      requiredRoles: allowedRoles,
    });
    response.forbidden(res, 'Insufficient role for this action');
    return false;
  }
  
  return true;
}

/**
 * Check if user has required permission
 * @param {http.IncomingMessage} req - Request with user attached
 * @param {http.ServerResponse} res - Response object
 * @param {string} permission - Required permission
 * @returns {boolean} True if authorized
 */
function hasPermission(req, res, permission) {
  if (!req.user) {
    response.unauthorized(res, 'Authentication required');
    return false;
  }
  
  const userPermissions = req.user.permissions || [];
  
  // Check for exact permission or wildcard
  if (!userPermissions.includes(permission) && !userPermissions.includes('*')) {
    logger.warn('Access denied - missing permission', {
      userId: req.user.id,
      permission,
      userPermissions,
    });
    response.forbidden(res, `Permission '${permission}' required`);
    return false;
  }
  
  return true;
}

/**
 * Check if user has minimum role level
 * @param {http.IncomingMessage} req - Request with user attached
 * @param {http.ServerResponse} res - Response object
 * @param {string} minimumRole - Minimum required role
 * @returns {boolean} True if authorized
 */
function hasMinimumRole(req, res, minimumRole) {
  if (!req.user) {
    response.unauthorized(res, 'Authentication required');
    return false;
  }
  
  const userRole = req.user.role.replace(' ', '_');
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;
  
  if (userLevel < requiredLevel) {
    response.forbidden(res, 'Insufficient role level');
    return false;
  }
  
  return true;
}

/**
 * Check if user owns the resource or has admin access
 * @param {http.IncomingMessage} req - Request with user attached
 * @param {http.ServerResponse} res - Response object
 * @param {number} resourceOwnerId - Owner ID of the resource
 * @returns {boolean} True if authorized
 */
function isOwnerOrAdmin(req, res, resourceOwnerId) {
  if (!req.user) {
    response.unauthorized(res, 'Authentication required');
    return false;
  }
  
  const isOwner = req.user.id === resourceOwnerId;
  const isAdmin = hasMinimumRole(req, { writeHead: () => {}, end: () => {} }, 'Operations_Manager');
  
  if (!isOwner && !isAdmin) {
    response.forbidden(res, 'Access denied - not owner or admin');
    return false;
  }
  
  return true;
}

module.exports = {
  hasRole,
  hasPermission,
  hasMinimumRole,
  isOwnerOrAdmin,
  ROLE_HIERARCHY,
};

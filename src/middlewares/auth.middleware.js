/**
 * MCMS Middleware - Authentication
 * Validates JWT tokens and attaches user to request
 */

const { verifyToken, extractToken } = require('../utils/jwt');
const response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 * @param {http.IncomingMessage} req - Request object
 * @param {http.ServerResponse} res - Response object
 * @returns {Object|null} User object or null if unauthorized
 */
async function authenticate(req, res) {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);
  
  if (!token) {
    response.unauthorized(res, 'No authentication token provided');
    return null;
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    response.unauthorized(res, 'Invalid or expired token');
    return null;
  }
  
  // Attach user to request
  req.user = decoded;
  logger.debug('User authenticated', { userId: decoded.id, role: decoded.role });
  
  return decoded;
}

/**
 * Optional authentication - doesn't fail if no token
 * @param {http.IncomingMessage} req - Request object
 * @returns {Object|null} User object or null
 */
function optionalAuth(req) {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);
  
  if (!token) {
    return null;
  }
  
  const decoded = verifyToken(token);
  if (decoded) {
    req.user = decoded;
  }
  
  return decoded;
}

module.exports = {
  authenticate,
  optionalAuth,
};

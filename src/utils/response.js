/**
 * MCMS Utilities - Standardized API Response Helpers
 * Provides consistent JSON response formatting across all endpoints
 */

/**
 * Send a successful JSON response
 * @param {http.ServerResponse} res - Response object
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {Object} meta - Optional metadata (pagination, etc.)
 */
function success(res, data, statusCode = 200, meta = null) {
  const response = {
    success: true,
    data,
    ...(meta && { meta }),
    timestamp: new Date().toISOString(),
  };
  
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response));
}

/**
 * Send an error JSON response
 * @param {http.ServerResponse} res - Response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {*} errors - Optional detailed errors (validation, etc.)
 */
function error(res, message, statusCode = 500, errors = null) {
  const response = {
    success: false,
    error: {
      message,
      code: statusCode,
      ...(errors && { details: errors }),
    },
    timestamp: new Date().toISOString(),
  };
  
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response));
}

/**
 * Send a paginated response
 * @param {http.ServerResponse} res - Response object
 * @param {Array} data - Array of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items count
 */
function paginated(res, data, page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  
  success(res, data, 200, {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}

/**
 * Send a created response (201)
 * @param {http.ServerResponse} res - Response object
 * @param {*} data - Created resource data
 */
function created(res, data) {
  success(res, data, 201);
}

/**
 * Send a no content response (204)
 * @param {http.ServerResponse} res - Response object
 */
function noContent(res) {
  res.writeHead(204);
  res.end();
}

/**
 * Send not found error (404)
 * @param {http.ServerResponse} res - Response object
 * @param {string} resource - Resource name
 */
function notFound(res, resource = 'Resource') {
  error(res, `${resource} not found`, 404);
}

/**
 * Send unauthorized error (401)
 * @param {http.ServerResponse} res - Response object
 * @param {string} message - Error message
 */
function unauthorized(res, message = 'Unauthorized') {
  error(res, message, 401);
}

/**
 * Send forbidden error (403)
 * @param {http.ServerResponse} res - Response object
 * @param {string} message - Error message
 */
function forbidden(res, message = 'Forbidden') {
  error(res, message, 403);
}

/**
 * Send bad request error (400)
 * @param {http.ServerResponse} res - Response object
 * @param {string} message - Error message
 * @param {*} errors - Validation errors
 */
function badRequest(res, message = 'Bad request', errors = null) {
  error(res, message, 400, errors);
}

module.exports = {
  success,
  error,
  paginated,
  created,
  noContent,
  notFound,
  unauthorized,
  forbidden,
  badRequest,
};

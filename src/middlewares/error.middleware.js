/**
 * MCMS Middleware - Error Handling
 * Global error handler and error utilities
 */

const response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Custom application error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle errors in async controller functions
 * @param {Function} fn - Async controller function
 * @returns {Function} Wrapped function with error handling
 */
function asyncHandler(fn) {
  return async (req, res, ...args) => {
    try {
      await fn(req, res, ...args);
    } catch (error) {
      handleError(error, res);
    }
  };
}

/**
 * Handle and respond to errors
 * @param {Error} error - Error object
 * @param {http.ServerResponse} res - Response object
 */
function handleError(error, res) {
  logger.error('Request error', error);
  
  // Prisma errors
  if (error.code) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        response.badRequest(res, 'A record with this value already exists', {
          field: error.meta?.target?.[0],
        });
        return;
      case 'P2025': // Record not found
        response.notFound(res, 'Record');
        return;
      case 'P2003': // Foreign key constraint
        response.badRequest(res, 'Referenced record does not exist');
        return;
    }
  }
  
  // Custom AppError
  if (error instanceof AppError) {
    response.error(res, error.message, error.statusCode, error.errors);
    return;
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    response.unauthorized(res, 'Invalid token');
    return;
  }
  
  if (error.name === 'TokenExpiredError') {
    response.unauthorized(res, 'Token expired');
    return;
  }
  
  // Default server error
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
    
  response.error(res, message, 500);
}

/**
 * Not found handler for unmatched routes
 * @param {http.IncomingMessage} req - Request object
 * @param {http.ServerResponse} res - Response object
 */
function notFoundHandler(req, res) {
  response.notFound(res, `Route ${req.method} ${req.url}`);
}

/**
 * Method not allowed handler
 * @param {http.ServerResponse} res - Response object
 * @param {string[]} allowedMethods - Array of allowed methods
 */
function methodNotAllowed(res, allowedMethods) {
  res.setHeader('Allow', allowedMethods.join(', '));
  response.error(res, `Method not allowed. Use: ${allowedMethods.join(', ')}`, 405);
}

module.exports = {
  AppError,
  asyncHandler,
  handleError,
  notFoundHandler,
  methodNotAllowed,
};

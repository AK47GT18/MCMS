/**
 * MCMS Middleware - Request Validation
 * Validates request body against Zod schemas
 */

const response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Validate request body against a Zod schema
 * @param {Object} body - Request body to validate
 * @param {Object} schema - Zod schema to validate against
 * @param {http.ServerResponse} res - Response object
 * @returns {Object|null} Validated data or null if invalid
 */
function validateBody(body, schema, res) {
  try {
    const result = schema.safeParse(body);
    
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      logger.debug('Validation failed', { errors });
      response.badRequest(res, 'Validation failed', errors);
      return null;
    }
    
    return result.data;
  } catch (error) {
    logger.error('Validation error', error);
    response.badRequest(res, 'Invalid request format');
    return null;
  }
}

/**
 * Validate query parameters against a Zod schema
 * @param {Object} query - Query parameters to validate
 * @param {Object} schema - Zod schema to validate against
 * @param {http.ServerResponse} res - Response object
 * @returns {Object|null} Validated data or null if invalid
 */
function validateQuery(query, schema, res) {
  return validateBody(query, schema, res);
}

/**
 * Validate path parameters
 * @param {string} id - ID parameter
 * @param {http.ServerResponse} res - Response object
 * @returns {number|null} Parsed ID or null if invalid
 */
function validateId(id, res) {
  const parsed = parseInt(id, 10);
  
  if (isNaN(parsed) || parsed <= 0) {
    response.badRequest(res, 'Invalid ID parameter');
    return null;
  }
  
  return parsed;
}

/**
 * Parse JSON body from request
 * @param {http.IncomingMessage} req - Request object
 * @returns {Promise<Object>} Parsed JSON body
 */
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
      
      // Prevent large payloads (1MB limit)
      if (body.length > 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
    
    req.on('error', reject);
  });
}

/**
 * Parse query string from URL
 * @param {string} url - Request URL
 * @returns {Object} Parsed query parameters
 */
function parseQuery(url) {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) {
    return {};
  }
  
  const queryString = url.slice(queryIndex + 1);
  const params = new URLSearchParams(queryString);
  const query = {};
  
  for (const [key, value] of params.entries()) {
    query[key] = value;
  }
  
  return query;
}

module.exports = {
  validateBody,
  validateQuery,
  validateId,
  parseBody,
  parseQuery,
};

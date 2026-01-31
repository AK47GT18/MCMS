/**
 * API Error Classes
 * Custom error types for different API failure scenarios
 */

/**
 * Base API Error
 */
export class APIError extends Error {
  constructor(message, statusCode = 500, data = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      data: this.data,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Network Error (no response received)
 */
export class NetworkError extends APIError {
  constructor(message = 'Network request failed') {
    super(message, 0);
    this.name = 'NetworkError';
  }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends APIError {
  constructor(message = 'Authentication required', data = null) {
    super(message, 401, data);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends APIError {
  constructor(message = 'Access forbidden', data = null) {
    super(message, 403, data);
    this.name = 'AuthorizationError';
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends APIError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, errors);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends APIError {
  constructor(resource = 'Resource', data = null) {
    super(`${resource} not found`, 404, data);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends APIError {
  constructor(message = 'Resource conflict', data = null) {
    super(message, 409, data);
    this.name = 'ConflictError';
  }
}

/**
 * Server Error (500+)
 */
export class ServerError extends APIError {
  constructor(message = 'Internal server error', statusCode = 500, data = null) {
    super(message, statusCode, data);
    this.name = 'ServerError';
  }
}

/**
 * Timeout Error
 */
export class TimeoutError extends APIError {
  constructor(message = 'Request timeout') {
    super(message, 408);
    this.name = 'TimeoutError';
  }
}

/**
 * Create appropriate error based on status code
 */
export function createErrorFromResponse(status, message, data) {
  switch (status) {
    case 400:
      return new ValidationError(message, data);
    case 401:
      return new AuthenticationError(message, data);
    case 403:
      return new AuthorizationError(message, data);
    case 404:
      return new NotFoundError(message, data);
    case 409:
      return new ConflictError(message, data);
    case 408:
      return new TimeoutError(message);
    default:
      if (status >= 500) {
        return new ServerError(message, status, data);
      }
      return new APIError(message, status, data);
  }
}

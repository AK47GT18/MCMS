/**
 * MCMS Utilities - Logger
 * Simple logging utility with levels and timestamps
 */

const env = require('../config/env');

// Log levels
const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Current log level based on environment
const currentLevel = env.NODE_ENV === 'production' ? LEVELS.INFO : LEVELS.DEBUG;

/**
 * Format log message with timestamp
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {*} data - Optional data to log
 * @returns {string} Formatted log message
 */
function formatMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level}] ${message}${dataStr}`;
}

/**
 * Debug level logging (development only)
 * @param {string} message - Log message
 * @param {*} data - Optional data
 */
function debug(message, data) {
  if (currentLevel <= LEVELS.DEBUG) {
    console.log(formatMessage('DEBUG', message, data));
  }
}

/**
 * Info level logging
 * @param {string} message - Log message
 * @param {*} data - Optional data
 */
function info(message, data) {
  if (currentLevel <= LEVELS.INFO) {
    console.log(formatMessage('INFO', message, data));
  }
}

/**
 * Warning level logging
 * @param {string} message - Log message
 * @param {*} data - Optional data
 */
function warn(message, data) {
  if (currentLevel <= LEVELS.WARN) {
    console.warn(formatMessage('WARN', message, data));
  }
}

/**
 * Error level logging
 * @param {string} message - Log message
 * @param {*} error - Error object or data
 */
function error(message, err) {
  if (currentLevel <= LEVELS.ERROR) {
    const errorData = err instanceof Error 
      ? { message: err.message, stack: err.stack }
      : err;
    console.error(formatMessage('ERROR', message, errorData));
  }
}

/**
 * Log HTTP request
 * @param {http.IncomingMessage} req - Request object
 * @param {number} statusCode - Response status code
 * @param {number} duration - Request duration in ms
 */
function request(req, statusCode, duration) {
  const message = `${req.method} ${req.url} ${statusCode} ${duration}ms`;
  if (statusCode >= 500) {
    error(message);
  } else if (statusCode >= 400) {
    warn(message);
  } else {
    info(message);
  }
}

module.exports = {
  debug,
  info,
  warn,
  error,
  request,
  LEVELS,
};

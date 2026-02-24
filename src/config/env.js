/**
 * MCMS Configuration - Environment Variables
 * Loads and validates environment variables from .env file
 */

require('dotenv').config();

// Environment configuration object
const env = {
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  
  // JWT Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'mcms-super-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // SMTP Email Configuration
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_USERNAME: process.env.SMTP_USERNAME,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  
  // Frontend URL (for emails and CORS)
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8080',
};

console.log('[DEBUG ENV] JWT_SECRET loaded:', env.JWT_SECRET.substring(0, 5) + '...');

// Validate required environment variables
const required = ['DATABASE_URL'];
const missing = required.filter(key => !env[key]);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

module.exports = env;

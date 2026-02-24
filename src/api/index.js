/**
 * API Client - Main Export
 * Centralized export for all API modules
 */

// Core
export { default as client } from './client.js';
export { default as API_CONFIG } from './config.js';
export { default as responseCache } from './cache.js';
export { default as loadingState } from './loadingState.js';
export { default as interceptorManager } from './interceptors.js';

// Errors
export * from './errors.js';

// Domain API Modules
export { default as auth } from './auth.api.js';
export { default as users } from './users.api.js';
export { default as projects } from './projects.api.js';
export { default as contracts } from './contracts.api.js';
export { default as assets } from './assets.api.js';
export { default as requisitions } from './requisitions.api.js';
export { default as dailyLogs } from './dailyLogs.api.js';
export { default as issues } from './issues.api.js';
export { default as procurement } from './procurement.api.js';
export { default as audit } from './audit.api.js';
export { default as tasks } from './tasks.api.js';
export { default as contractVersions } from './contractVersions.api.js';
export { default as insurancePolicies } from './insurancePolicies.api.js';

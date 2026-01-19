/**
 * MCMS Real-time - Event Definitions
 * Defines all WebSocket event types for the application
 */

// ============================================
// EVENT TYPES
// ============================================

const EVENTS = {
  // System events
  CONNECTED: 'connected',
  AUTHENTICATED: 'authenticated',
  ERROR: 'error',
  
  // Notification events
  NOTIFICATION: 'notification',
  ALERT: 'alert',
  
  // Project events
  PROJECT_CREATED: 'project:created',
  PROJECT_UPDATED: 'project:updated',
  PROJECT_STATUS_CHANGED: 'project:status_changed',
  
  // Task events
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_PROGRESS: 'task:progress',
  
  // Requisition events
  REQUISITION_SUBMITTED: 'requisition:submitted',
  REQUISITION_APPROVED: 'requisition:approved',
  REQUISITION_REJECTED: 'requisition:rejected',
  REQUISITION_FRAUD_FLAG: 'requisition:fraud_flag',
  
  // Issue events
  ISSUE_CREATED: 'issue:created',
  ISSUE_ASSIGNED: 'issue:assigned',
  ISSUE_RESOLVED: 'issue:resolved',
  ISSUE_ESCALATED: 'issue:escalated',
  
  // Asset events
  ASSET_CHECKED_OUT: 'asset:checked_out',
  ASSET_CHECKED_IN: 'asset:checked_in',
  ASSET_MAINTENANCE: 'asset:maintenance',
  
  // Daily log events
  DAILY_LOG_SUBMITTED: 'daily_log:submitted',
  DAILY_LOG_SOS: 'daily_log:sos',
  DAILY_LOG_APPROVED: 'daily_log:approved',
  
  // Procurement events
  PROCUREMENT_SUBMITTED: 'procurement:submitted',
  PROCUREMENT_PM_APPROVED: 'procurement:pm_approved',
  PROCUREMENT_FINANCE_APPROVED: 'procurement:finance_approved',
  PROCUREMENT_REJECTED: 'procurement:rejected',
  
  // User events
  USER_LOGIN: 'user:login',
  USER_LOCKED: 'user:locked',
};

// ============================================
// CHANNELS
// ============================================

const CHANNELS = {
  // Role-based channels
  ALL: 'all',
  MANAGEMENT: 'management', // MD, Ops Manager
  FINANCE: 'finance', // Finance Director
  PROJECTS: 'projects', // Project managers
  FIELD: 'field', // Field supervisors
  
  // Entity-specific channels (dynamic)
  project: (id) => `project:${id}`,
  user: (id) => `user:${id}`,
};

// ============================================
// NOTIFICATION PRIORITIES
// ============================================

const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

module.exports = {
  EVENTS,
  CHANNELS,
  PRIORITY,
};

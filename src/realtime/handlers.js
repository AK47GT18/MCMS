/**
 * MCMS Real-time - Event Handlers
 * Business logic handlers for WebSocket events
 */

const websocket = require('./websocket');
const { EVENTS, PRIORITY } = require('./events');
const logger = require('../utils/logger');

/**
 * Emit a project update event
 */
function emitProjectUpdate(project, action = 'updated') {
  websocket.broadcastToChannel(`project:${project.id}`, EVENTS.PROJECT_UPDATED, {
    action,
    project: {
      id: project.id,
      code: project.code,
      name: project.name,
      status: project.status,
    },
  });
}

/**
 * Emit a requisition status change
 */
function emitRequisitionStatus(requisition, status, reviewerId) {
  const eventMap = {
    approved: EVENTS.REQUISITION_APPROVED,
    rejected: EVENTS.REQUISITION_REJECTED,
    fraud_flag: EVENTS.REQUISITION_FRAUD_FLAG,
  };
  
  const event = eventMap[status] || EVENTS.REQUISITION_SUBMITTED;
  
  // Notify submitter
  if (requisition.submittedBy) {
    websocket.notifyUser(requisition.submittedBy, 'notification', {
      type: event,
      title: `Requisition ${status.replace('_', ' ')}`,
      message: `Your requisition ${requisition.reqCode} has been ${status.replace('_', ' ')}`,
      priority: status === 'fraud_flag' ? PRIORITY.CRITICAL : PRIORITY.MEDIUM,
      data: { requisitionId: requisition.id, reqCode: requisition.reqCode },
    });
  }
  
  // Broadcast to finance channel
  websocket.broadcastToChannel('finance', event, {
    requisition: {
      id: requisition.id,
      reqCode: requisition.reqCode,
      status,
    },
  });
  
  logger.info('Requisition status event emitted', { reqCode: requisition.reqCode, status });
}

/**
 * Emit an SOS alert from daily log
 */
function emitSosAlert(log) {
  // Broadcast to management and project manager
  websocket.notifyRoles(['Project_Manager', 'Operations_Manager', 'Managing_Director'], 'alert', {
    type: EVENTS.DAILY_LOG_SOS,
    priority: PRIORITY.CRITICAL,
    title: 'SOS Alert',
    message: `SOS received from project ${log.project?.code || 'Unknown'}`,
    data: {
      logId: log.id,
      projectId: log.projectId,
      projectCode: log.project?.code,
      submittedBy: log.submitter?.name,
    },
  });
  
  logger.warn('SOS alert emitted', { logId: log.id, projectId: log.projectId });
}

/**
 * Emit an issue alert
 */
function emitIssueAlert(issue, action = 'created') {
  const payload = {
    type: action === 'created' ? EVENTS.ISSUE_CREATED : EVENTS.ISSUE_ESCALATED,
    priority: issue.priority === 'Critical' ? PRIORITY.CRITICAL : PRIORITY.HIGH,
    title: `Issue ${action}`,
    message: `${issue.category || 'Issue'}: ${issue.description?.substring(0, 100)}`,
    data: {
      issueId: issue.id,
      issueCode: issue.issueCode,
      priority: issue.priority,
      projectId: issue.projectId,
    },
  };
  
  // Notify assigned user
  if (issue.assignedTo) {
    websocket.notifyUser(issue.assignedTo, 'notification', payload);
  }
  
  // Broadcast to project channel if applicable
  if (issue.projectId) {
    websocket.broadcastToChannel(`project:${issue.projectId}`, EVENTS.ISSUE_CREATED, payload);
  }
}

/**
 * Emit asset check-out/check-in event
 */
function emitAssetEvent(asset, action) {
  const event = action === 'check_out' ? EVENTS.ASSET_CHECKED_OUT : EVENTS.ASSET_CHECKED_IN;
  
  websocket.broadcast(event, {
    asset: {
      id: asset.id,
      assetCode: asset.assetCode,
      name: asset.name,
      status: asset.status,
      projectId: asset.currentProjectId,
    },
  });
}

/**
 * Emit a general notification to a user
 */
function sendNotification(userId, title, message, priority = PRIORITY.MEDIUM, data = {}) {
  return websocket.notifyUser(userId, 'notification', {
    type: EVENTS.NOTIFICATION,
    title,
    message,
    priority,
    data,
    timestamp: Date.now(),
  });
}

/**
 * Emit a general alert to roles
 */
function sendAlert(roles, title, message, priority = PRIORITY.HIGH, data = {}) {
  return websocket.notifyRoles(roles, 'alert', {
    type: EVENTS.ALERT,
    title,
    message,
    priority,
    data,
    timestamp: Date.now(),
  });
}

module.exports = {
  emitProjectUpdate,
  emitRequisitionStatus,
  emitSosAlert,
  emitIssueAlert,
  emitAssetEvent,
  sendNotification,
  sendAlert,
};

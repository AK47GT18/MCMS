/**
 * MCMS Real-time - WebSocket Server
 * Handles WebSocket connections and real-time event broadcasting
 */

const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const { verifyToken, extractToken } = require('../utils/jwt');
const logger = require('../utils/logger');

// Store active connections
const clients = new Map();

// Store user-to-connection mapping for targeted notifications
const userConnections = new Map();

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server to attach to
 */
function init(server) {
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws, req) => {
    const connectionId = uuidv4();
    let userId = null;
    
    logger.info('WebSocket client connected', { connectionId });
    
    // Store connection
    clients.set(connectionId, {
      ws,
      userId: null,
      subscriptions: new Set(),
      connectedAt: new Date(),
    });
    
    // Send welcome message
    sendToClient(ws, {
      type: 'connected',
      connectionId,
      message: 'Connected to MCMS real-time server',
    });
    
    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(connectionId, message);
      } catch (error) {
        logger.error('WebSocket message parse error', error);
        sendToClient(ws, { type: 'error', message: 'Invalid message format' });
      }
    });
    
    // Handle disconnect
    ws.on('close', () => {
      const client = clients.get(connectionId);
      if (client && client.userId) {
        userConnections.delete(client.userId);
      }
      clients.delete(connectionId);
      logger.info('WebSocket client disconnected', { connectionId });
    });
    
    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error', { connectionId, error: error.message });
    });
  });
  
  logger.info('WebSocket server initialized');
  
  return wss;
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(connectionId, message) {
  const client = clients.get(connectionId);
  if (!client) return;
  
  const { type, payload } = message;
  
  switch (type) {
    case 'authenticate':
      authenticateClient(connectionId, payload.token);
      break;
      
    case 'subscribe':
      subscribeToChannel(connectionId, payload.channel);
      break;
      
    case 'unsubscribe':
      unsubscribeFromChannel(connectionId, payload.channel);
      break;
      
    case 'ping':
      sendToClient(client.ws, { type: 'pong', timestamp: Date.now() });
      break;
      
    default:
      logger.debug('Unknown WebSocket message type', { type });
  }
}

/**
 * Authenticate WebSocket connection with JWT
 */
function authenticateClient(connectionId, token) {
  const client = clients.get(connectionId);
  if (!client) return;
  
  const decoded = verifyToken(token);
  
  if (decoded) {
    client.userId = decoded.id;
    client.role = decoded.role;
    userConnections.set(decoded.id, connectionId);
    
    sendToClient(client.ws, {
      type: 'authenticated',
      user: { id: decoded.id, role: decoded.role },
    });
    
    logger.info('WebSocket client authenticated', { connectionId, userId: decoded.id });
  } else {
    sendToClient(client.ws, {
      type: 'auth_error',
      message: 'Invalid or expired token',
    });
  }
}

/**
 * Subscribe client to a channel
 */
function subscribeToChannel(connectionId, channel) {
  const client = clients.get(connectionId);
  if (!client) return;
  
  client.subscriptions.add(channel);
  sendToClient(client.ws, {
    type: 'subscribed',
    channel,
  });
  
  logger.debug('Client subscribed to channel', { connectionId, channel });
}

/**
 * Unsubscribe client from a channel
 */
function unsubscribeFromChannel(connectionId, channel) {
  const client = clients.get(connectionId);
  if (!client) return;
  
  client.subscriptions.delete(channel);
  sendToClient(client.ws, {
    type: 'unsubscribed',
    channel,
  });
}

/**
 * Send message to a specific WebSocket client
 */
function sendToClient(ws, data) {
  if (ws.readyState === 1) { // OPEN
    ws.send(JSON.stringify(data));
  }
}

/**
 * Broadcast to all connected clients
 */
function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload, timestamp: Date.now() });
  
  clients.forEach((client, connectionId) => {
    if (client.ws.readyState === 1) {
      client.ws.send(message);
    }
  });
  
  logger.debug('Broadcast sent', { type, clientCount: clients.size });
}

/**
 * Broadcast to specific channel subscribers
 */
function broadcastToChannel(channel, type, payload) {
  const message = JSON.stringify({ type, channel, payload, timestamp: Date.now() });
  
  let count = 0;
  clients.forEach((client) => {
    if (client.subscriptions.has(channel) && client.ws.readyState === 1) {
      client.ws.send(message);
      count++;
    }
  });
  
  logger.debug('Channel broadcast sent', { channel, type, clientCount: count });
}

/**
 * Send notification to specific user
 */
function notifyUser(userId, type, payload) {
  const connectionId = userConnections.get(userId);
  if (!connectionId) return false;
  
  const client = clients.get(connectionId);
  if (!client || client.ws.readyState !== 1) return false;
  
  sendToClient(client.ws, { type, payload, timestamp: Date.now() });
  logger.debug('User notification sent', { userId, type });
  return true;
}

/**
 * Send notification to users with specific roles
 */
function notifyRoles(roles, type, payload) {
  const message = JSON.stringify({ type, payload, timestamp: Date.now() });
  
  let count = 0;
  clients.forEach((client) => {
    if (client.role && roles.includes(client.role) && client.ws.readyState === 1) {
      client.ws.send(message);
      count++;
    }
  });
  
  logger.debug('Role notification sent', { roles, type, clientCount: count });
  return count;
}

/**
 * Get connection statistics
 */
function getStats() {
  const authenticatedCount = Array.from(clients.values()).filter(c => c.userId).length;
  
  return {
    totalConnections: clients.size,
    authenticatedConnections: authenticatedCount,
    anonymousConnections: clients.size - authenticatedCount,
  };
}

module.exports = {
  init,
  broadcast,
  broadcastToChannel,
  notifyUser,
  notifyRoles,
  getStats,
};

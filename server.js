/**
 * MCMS Server
 * Main entry point for the vanilla Node.js backend
 * 
 * Run with: node server.js
 * 
 * Features:
 * - RESTful API endpoints (/api/v1/*)
 * - WebSocket real-time notifications (ws://localhost:3000)
 * - JWT authentication
 * - Prisma ORM for PostgreSQL
 * - Email notifications via Nodemailer
 * - PWA support endpoints
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

// Load environment first
require('dotenv').config();

// Import modules
const env = require('./src/config/env');
const database = require('./src/config/database');
const { applyCors } = require('./src/config/cors');
const { router } = require('./src/routes/index');
const websocket = require('./src/realtime/websocket');
const emailService = require('./src/emails/email.service');
const { getManifest, getAppConfig } = require('./src/pwa/manifest');
const pwaSync = require('./src/pwa/sync');
const response = require('./src/utils/response');
const logger = require('./src/utils/logger');
const { handleError, notFoundHandler } = require('./src/middlewares/error.middleware');
const { parseBody, parseQuery } = require('./src/middlewares/validate.middleware');
const { applySecurityHeaders, bodySizeLimit } = require('./src/middlewares/security.middleware');

// Request body size limiter (10MB default)
const checkBodySize = bodySizeLimit(10 * 1024 * 1024);

/**
 * Create the HTTP server
 */
const server = http.createServer(async (req, res) => {
  const startTime = Date.now();
  
  // Apply CORS headers
  applyCors(res, req.headers.origin);
  
  // Apply security headers
  applySecurityHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Check request body size for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const allowed = await checkBodySize(req, res);
    if (!allowed) return;
  }
  
  try {
    const url = req.url.split('?')[0];
    
    // ============================================
    // STATIC / PWA ROUTES
    // ============================================
    
    // Health check
    if (url === '/api/v1/health' && req.method === 'GET') {
      response.success(res, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        websocket: websocket.getStats(),
        email: emailService.getStatus(),
      });
      return;
    }
    
    // PWA Manifest
    if (url === '/manifest.json' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/manifest+json' });
      res.end(JSON.stringify(getManifest()));
      return;
    }
    
    // App config for frontend
    if (url === '/api/v1/config' && req.method === 'GET') {
      response.success(res, getAppConfig());
      return;
    }
    
    // ============================================
    // PWA SYNC ROUTES
    // ============================================
    
    if (url === '/api/v1/sync/initial' && req.method === 'GET') {
      await pwaSync.getInitialSync(req, res);
      return;
    }
    
    if (url === '/api/v1/sync/delta' && req.method === 'GET') {
      req.query = parseQuery(req.url);
      await pwaSync.getDeltaSync(req, res);
      return;
    }
    
    if (url === '/api/v1/sync/projects' && req.method === 'GET') {
      await pwaSync.getMyProjects(req, res);
      return;
    }
    
    if (url === '/api/v1/sync/push' && req.method === 'POST') {
      req.body = await parseBody(req);
      await pwaSync.pushChanges(req, res);
      return;
    }
    
    // ============================================
    // EMAIL TEST ROUTE
    // ============================================
    
    if (url === '/api/v1/test/email' && req.method === 'POST') {
      const body = await parseBody(req);
      const result = await emailService.send({
        to: body.to,
        subject: 'MCMS Test Email',
        html: '<h1>Test Email</h1><p>This is a test from MCMS backend.</p>',
        text: 'Test Email - This is a test from MCMS backend.',
      });
      response.success(res, result);
      return;
    }
    
    // ============================================
    // API ROUTES
    // ============================================
    
    if (url.startsWith('/api/v1/')) {
      await router(req, res);
      logger.request(req, res.statusCode, Date.now() - startTime);
      return;
    }
    
    // ============================================
    // STATIC FILES (for frontend if served from same origin)
    // ============================================
    
    // Serve static files from project root
    const staticPath = path.join(__dirname, url);
    if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
      const ext = path.extname(url);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
      };
      
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      const content = fs.readFileSync(staticPath);
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      return;
    }
    
    // Default: serve index.html for SPA routing
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    }
    
    // 404 for everything else
    notFoundHandler(req, res);
    
  } catch (error) {
    handleError(error, res);
  }
  
  logger.request(req, res.statusCode, Date.now() - startTime);
});

/**
 * Start the server
 */
async function start() {
  try {
    // Connect to database
    await database.connect();
    
    // Initialize email service
    emailService.init();
    
    // Initialize WebSocket
    websocket.init(server);
    
    // Initialize Scheduled Jobs (Cron)
    const cronJobs = require('./src/jobs/projectCron');
    cronJobs.initProjectJobs();
    
    // Start listening
    server.listen(env.PORT, () => {
      const baseUrl = `http://localhost:${env.PORT}`;
      console.log('');
      console.log('╔══════════════════════════════════════════════════════╗');
      console.log('║                                                      ║');
      console.log('║   🚀 MCMS Full-Stack Server                          ║');
      console.log('║                                                      ║');
      console.log(`║   Frontend:  ${baseUrl.padEnd(28)} ║`);
      console.log(`║   API/Docs:  ${(baseUrl + '/api/v1/health').padEnd(28)} ║`);
      console.log(`║   WebSocket: ws://localhost:${env.PORT.toString().padEnd(22)} ║`);
      console.log('║                                                      ║');
      console.log('║   Press Ctrl+C to stop                               ║');
      console.log('║                                                      ║');
      console.log('╚══════════════════════════════════════════════════════╝');
      console.log('');
      
      // Open browser automatically in development if requested
      if (process.env.OPEN_BROWSER === 'true') {
        const { exec } = require('child_process');
        const command = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
        exec(`${command} ${baseUrl}`);
      }
    });
    
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\\nShutting down...');
  await database.disconnect();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await database.disconnect();
  server.close();
  process.exit(0);
});

// Start the server
start();

module.exports = { server };

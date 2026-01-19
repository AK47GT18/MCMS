/**
 * MCMS Routes - Index
 * Main router that aggregates all API routes
 */

const authController = require('../controllers/auth.controller');
const usersController = require('../controllers/users.controller');
const projectsController = require('../controllers/projects.controller');
const vendorsController = require('../controllers/vendors.controller');
const contractsController = require('../controllers/contracts.controller');
const tasksController = require('../controllers/tasks.controller');
const assetsController = require('../controllers/assets.controller');
const requisitionsController = require('../controllers/requisitions.controller');
const dailyLogsController = require('../controllers/dailyLogs.controller');
const issuesController = require('../controllers/issues.controller');
const procurementController = require('../controllers/procurement.controller');
const response = require('../utils/response');
const { methodNotAllowed } = require('../middlewares/error.middleware');

/**
 * Parse URL path and extract ID if present
 * @param {string} url - Request URL
 * @returns {Object} { basePath, id, action }
 */
function parseUrl(url) {
  // Remove query string
  const pathOnly = url.split('?')[0];
  // Remove /api/v1/ prefix
  const path = pathOnly.replace(/^\/api\/v1/, '');
  const parts = path.split('/').filter(Boolean);
  
  return {
    resource: parts[0] || '',
    id: parts[1] || null,
    action: parts[2] || null,
  };
}

/**
 * Main router function
 * Routes requests to appropriate controllers
 */
async function router(req, res) {
  const { method } = req;
  const { resource, id, action } = parseUrl(req.url);
  
  // ============================================
  // AUTH ROUTES
  // ============================================
  if (resource === 'auth') {
    if (method === 'POST' && id === 'login') {
      return authController.login(req, res);
    }
    if (method === 'POST' && id === 'register') {
      return authController.register(req, res);
    }
    if (method === 'GET' && id === 'me') {
      return authController.getProfile(req, res);
    }
    if (method === 'POST' && id === 'change-password') {
      return authController.changePassword(req, res);
    }
    return response.notFound(res, 'Auth endpoint');
  }
  
  // ============================================
  // USERS ROUTES
  // ============================================
  if (resource === 'users') {
    if (!id) {
      if (method === 'GET') return usersController.getAll(req, res);
      if (method === 'POST') return usersController.create(req, res);
      return methodNotAllowed(res, ['GET', 'POST']);
    }
    if (action === 'lock' && method === 'POST') {
      return usersController.lock(req, res, id);
    }
    if (action === 'unlock' && method === 'POST') {
      return usersController.unlock(req, res, id);
    }
    if (method === 'GET') return usersController.getById(req, res, id);
    if (method === 'PUT' || method === 'PATCH') return usersController.update(req, res, id);
    if (method === 'DELETE') return usersController.remove(req, res, id);
    return methodNotAllowed(res, ['GET', 'PUT', 'PATCH', 'DELETE']);
  }
  
  // ============================================
  // PROJECTS ROUTES
  // ============================================
  if (resource === 'projects') {
    if (!id) {
      if (method === 'GET') return projectsController.getAll(req, res);
      if (method === 'POST') return projectsController.create(req, res);
      return methodNotAllowed(res, ['GET', 'POST']);
    }
    if (action === 'budget' && method === 'GET') {
      return projectsController.getBudget(req, res, id);
    }
    if (action === 'tasks') {
      if (method === 'GET') return tasksController.getByProject(req, res, id);
      return methodNotAllowed(res, ['GET']);
    }
    if (method === 'GET') return projectsController.getById(req, res, id);
    if (method === 'PUT' || method === 'PATCH') return projectsController.update(req, res, id);
    if (method === 'DELETE') return projectsController.remove(req, res, id);
    return methodNotAllowed(res, ['GET', 'PUT', 'PATCH', 'DELETE']);
  }
  
  // ============================================
  // VENDORS ROUTES
  // ============================================
  if (resource === 'vendors') {
    if (id === 'approved' && method === 'GET') {
      return vendorsController.getApproved(req, res);
    }
    if (!id) {
      if (method === 'GET') return vendorsController.getAll(req, res);
      if (method === 'POST') return vendorsController.create(req, res);
      return methodNotAllowed(res, ['GET', 'POST']);
    }
    if (method === 'GET') return vendorsController.getById(req, res, id);
    if (method === 'PUT' || method === 'PATCH') return vendorsController.update(req, res, id);
    if (method === 'DELETE') return vendorsController.remove(req, res, id);
    return methodNotAllowed(res, ['GET', 'PUT', 'PATCH', 'DELETE']);
  }
  
  // ============================================
  // CONTRACTS ROUTES
  // ============================================
  if (resource === 'contracts') {
    if (!id) {
      if (method === 'GET') return contractsController.getAll(req, res);
      if (method === 'POST') return contractsController.create(req, res);
      return methodNotAllowed(res, ['GET', 'POST']);
    }
    if (method === 'GET') return contractsController.getById(req, res, id);
    if (method === 'PUT' || method === 'PATCH') return contractsController.update(req, res, id);
    if (method === 'DELETE') return contractsController.remove(req, res, id);
    return methodNotAllowed(res, ['GET', 'PUT', 'PATCH', 'DELETE']);
  }
  
  // ============================================
  // TASKS ROUTES
  // ============================================
  if (resource === 'tasks') {
    if (!id) {
      if (method === 'POST') return tasksController.create(req, res);
      return methodNotAllowed(res, ['POST']);
    }
    if (action === 'progress' && method === 'PATCH') {
      return tasksController.updateProgress(req, res, id);
    }
    if (method === 'GET') return tasksController.getById(req, res, id);
    if (method === 'PUT' || method === 'PATCH') return tasksController.update(req, res, id);
    if (method === 'DELETE') return tasksController.remove(req, res, id);
    return methodNotAllowed(res, ['GET', 'PUT', 'PATCH', 'DELETE']);
  }
  
  // ============================================
  // ASSETS ROUTES
  // ============================================
  if (resource === 'assets') {
    if (id === 'available' && method === 'GET') {
      return assetsController.getAvailable(req, res);
    }
    if (!id) {
      if (method === 'GET') return assetsController.getAll(req, res);
      if (method === 'POST') return assetsController.create(req, res);
      return methodNotAllowed(res, ['GET', 'POST']);
    }
    if (action === 'checkout' && method === 'POST') {
      return assetsController.checkOut(req, res, id);
    }
    if (action === 'checkin' && method === 'POST') {
      return assetsController.checkIn(req, res, id);
    }
    if (method === 'GET') return assetsController.getById(req, res, id);
    if (method === 'PUT' || method === 'PATCH') return assetsController.update(req, res, id);
    if (method === 'DELETE') return assetsController.remove(req, res, id);
    return methodNotAllowed(res, ['GET', 'PUT', 'PATCH', 'DELETE']);
  }
  
  // ============================================
  // REQUISITIONS ROUTES
  // ============================================
  if (resource === 'requisitions') {
    if (id === 'pending' && method === 'GET') {
      return requisitionsController.getPending(req, res);
    }
    if (!id) {
      if (method === 'GET') return requisitionsController.getAll(req, res);
      if (method === 'POST') return requisitionsController.create(req, res);
      return methodNotAllowed(res, ['GET', 'POST']);
    }
    if (action === 'approve' && method === 'POST') {
      return requisitionsController.approve(req, res, id);
    }
    if (action === 'reject' && method === 'POST') {
      return requisitionsController.reject(req, res, id);
    }
    if (action === 'flag-fraud' && method === 'POST') {
      return requisitionsController.flagFraud(req, res, id);
    }
    if (method === 'GET') return requisitionsController.getById(req, res, id);
    return methodNotAllowed(res, ['GET']);
  }
  
  // ============================================
  // DAILY LOGS ROUTES
  // ============================================
  if (resource === 'daily-logs') {
    if (id === 'sos' && method === 'GET') {
      return dailyLogsController.getSosAlerts(req, res);
    }
    if (!id) {
      if (method === 'GET') return dailyLogsController.getAll(req, res);
      if (method === 'POST') return dailyLogsController.create(req, res);
      return methodNotAllowed(res, ['GET', 'POST']);
    }
    if (action === 'approve' && method === 'POST') {
      return dailyLogsController.approve(req, res, id);
    }
    if (method === 'GET') return dailyLogsController.getById(req, res, id);
    return methodNotAllowed(res, ['GET']);
  }
  
  // ============================================
  // ISSUES ROUTES
  // ============================================
  if (resource === 'issues') {
    if (id === 'open' && method === 'GET') {
      return issuesController.getOpen(req, res);
    }
    if (!id) {
      if (method === 'GET') return issuesController.getAll(req, res);
      if (method === 'POST') return issuesController.create(req, res);
      return methodNotAllowed(res, ['GET', 'POST']);
    }
    if (action === 'resolve' && method === 'POST') {
      return issuesController.resolve(req, res, id);
    }
    if (action === 'assign' && method === 'POST') {
      return issuesController.assign(req, res, id);
    }
    if (method === 'GET') return issuesController.getById(req, res, id);
    if (method === 'PUT' || method === 'PATCH') return issuesController.update(req, res, id);
    return methodNotAllowed(res, ['GET', 'PUT', 'PATCH']);
  }
  
  // ============================================
  // PROCUREMENT ROUTES
  // ============================================
  if (resource === 'procurement') {
    if (!id) {
      if (method === 'GET') return procurementController.getAll(req, res);
      if (method === 'POST') return procurementController.create(req, res);
      return methodNotAllowed(res, ['GET', 'POST']);
    }
    if (action === 'pm-approve' && method === 'POST') {
      return procurementController.pmApprove(req, res, id);
    }
    if (action === 'pm-reject' && method === 'POST') {
      return procurementController.pmReject(req, res, id);
    }
    if (action === 'finance-approve' && method === 'POST') {
      return procurementController.financeApprove(req, res, id);
    }
    if (action === 'finance-reject' && method === 'POST') {
      return procurementController.financeReject(req, res, id);
    }
    if (action === 'purchased' && method === 'POST') {
      return procurementController.markPurchased(req, res, id);
    }
    if (method === 'GET') return procurementController.getById(req, res, id);
    return methodNotAllowed(res, ['GET']);
  }
  
  // Not found
  return response.notFound(res, 'Endpoint');
}

module.exports = { router, parseUrl };

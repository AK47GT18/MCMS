/**
 * MCMS Routes - Index
 * Main router that aggregates all API routes
 */

const authController = require('../controllers/auth.controller');
const usersController = require('../controllers/users.controller');
const projectsController = require('../controllers/projects.controller');
const contractsController = require('../controllers/contracts.controller');
const contractVersionsController = require('../controllers/contractVersions.controller');
const insurancePoliciesController = require('../controllers/insurancePolicies.controller');
const tasksController = require('../controllers/tasks.controller');
const assetsController = require('../controllers/assets.controller');
const requisitionsController = require('../controllers/requisitions.controller');
const dailyLogsController = require('../controllers/dailyLogs.controller');
const issuesController = require('../controllers/issues.controller');
const procurementController = require('../controllers/procurement.controller');
const auditController = require('../controllers/audit.controller');
const roadEstimationController = require('../controllers/roadEstimation.controller');
const inventoryController = require('../controllers/inventory.controller');
const replenishmentController = require('../controllers/replenishment.controller');
const reconciliationController = require('../controllers/reconciliation.controller');
const notificationsController = require('../controllers/notifications.controller');
const safetyIncidentsController = require('../controllers/safetyIncidents.controller');
const whistleblowerController = require('../controllers/whistleblower.controller');
const budgetChangesController = require('../controllers/budgetChanges.controller');
const timelineExtensionController = require('../controllers/timelineExtension.controller');
const { documentRoutes } = require('../api/documents.api');
const reportsController = require('../controllers/reports.controller');
const assetSchedulerController = require('../controllers/assetScheduler.controller');
const pushController = require('../controllers/push.controller');
const dispatchController = require('../controllers/dispatch.controller');
const pmController = require('../controllers/pm.controller');
const response = require('../utils/response');
const { methodNotAllowed } = require('../middlewares/error.middleware');
const { loginLimiter, registerLimiter, passwordResetLimiter } = require('../middlewares/rateLimit.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists for documents
const uploadDir = path.join(__dirname, '../../public/uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

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
    subAction: parts[3] || null,
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
  // AUTH ROUTES (with rate limiting)
  // ============================================
  if (resource === 'auth') {
    // Login - rate limited (5 attempts per 15 minutes)
    if (method === 'POST' && id === 'login') {
      const allowed = await loginLimiter(req, res);
      if (!allowed) return;
      return authController.login(req, res);
    }
    // Register - rate limited (10 attempts per hour)
    if (method === 'POST' && id === 'register') {
      const allowed = await registerLimiter(req, res);
      if (!allowed) return;
      return authController.register(req, res);
    }
    if (method === 'GET' && id === 'me') {
      return authController.getProfile(req, res);
    }
    if (method === 'POST' && id === 'change-password') {
      return authController.changePassword(req, res);
    }
    if (method === 'POST' && id === 'change-email') {
      return authController.changeEmail(req, res);
    }
    // Forgot password - rate limited (3 attempts per hour)
    if (method === 'POST' && id === 'forgot-password') {
      const allowed = await passwordResetLimiter(req, res);
      if (!allowed) return;
      return authController.forgotPassword(req, res);
    }
    // Reset password - rate limited
    if (method === 'POST' && id === 'reset-password') {
      const allowed = await passwordResetLimiter(req, res);
      if (!allowed) return;
      return authController.resetPassword(req, res);
    }
    return response.notFound(res, 'Auth endpoint');
  }
  
  // ============================================
  // USERS ROUTES
  // ============================================
  if (resource === 'users') {
    // Check for role filter query param
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roleParam = url.searchParams.get('role');
    
    if (roleParam && method === 'GET') {
      return usersController.getByRole(req, res);
    }
    
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
  // PM & CONFIGURATION ROUTES
  // ============================================
  if (resource === 'pm') {
    if (id === 'material-prices') {
      if (method === 'GET') return pmController.getMaterialPrices(req, res);
      if (method === 'POST') return pmController.upsertMaterialPrice(req, res);
      if (method === 'DELETE' && action) return pmController.deleteMaterialPrice(req, res, action);
      return methodNotAllowed(res, ['GET', 'POST', 'DELETE']);
    }
    if (id === 'variation-orders') {
      if (method === 'POST') return pmController.createVariationOrder(req, res);
      if (method === 'GET') return pmController.getVariationOrders(req, res);
      return methodNotAllowed(res, ['GET', 'POST']);
    }
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
    if (action === 'materials' && method === 'GET') {
      return projectsController.getMaterials(req, res, id);
    }
    if (action === 'extend' && method === 'POST') {
      return projectsController.extendProject(req, res, id);
    }
    if (action === 'progress' && method === 'GET') {
      return projectsController.getProgress(req, res, id);
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
  
  // Vendor Routes Removed  
  // ============================================
  // CONTRACTS ROUTES
  // ============================================
  if (resource === 'contracts') {
    if (action === 'versions') {
      if (method === 'GET') return contractVersionsController.getByContract(req, res, id);
      if (method === 'POST') {
        return upload.single('document')(req, res, (err) => {
          if (err) return response.error(res, err ? err.message : 'Upload failed', 400);
          return contractVersionsController.create(req, res, id);
        });
      }
      return methodNotAllowed(res, ['GET', 'POST']);
    }
    if (!id) {
      if (method === 'GET') return contractsController.getAll(req, res);
      if (method === 'POST') return contractsController.create(req, res);
      return methodNotAllowed(res, ['GET', 'POST']);
    }
    if (action === 'approve' && method === 'POST') {
      return contractsController.approve(req, res, id);
    }
    if (method === 'GET') return contractsController.getById(req, res, id);
    if (method === 'PUT' || method === 'PATCH') return contractsController.update(req, res, id);
    if (method === 'DELETE') return contractsController.remove(req, res, id);
    return methodNotAllowed(res, ['GET', 'PUT', 'PATCH', 'DELETE', 'POST']);
  }
  
  // ============================================
  // INSURANCE POLICIES ROUTES
  // ============================================
  if (resource === 'insurance-policies') {
    if (!id) {
      if (method === 'GET') return insurancePoliciesController.getAll(req, res);
      if (method === 'POST') return insurancePoliciesController.create(req, res);
      return methodNotAllowed(res, ['GET', 'POST']);
    }
    if (method === 'PUT' || method === 'PATCH') return insurancePoliciesController.update(req, res, id);
    if (method === 'DELETE') return insurancePoliciesController.remove(req, res, id);
    return methodNotAllowed(res, ['GET', 'PUT', 'PATCH', 'DELETE']);
  }
  
  // ============================================
  // TASKS ROUTES
  // ============================================
  if (resource === 'tasks') {
    if (!id) {
      if (method === 'GET') {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const projectId = url.searchParams.get('projectId');
        const status = url.searchParams.get('status');
        
        if (projectId) {
          return tasksController.getByProject(req, res, projectId);
        }
        if (status) {
          return tasksController.getByStatus(req, res, status);
        }
        return tasksController.getAll(req, res);
      }
      if (method === 'POST') return tasksController.create(req, res);
      return methodNotAllowed(res, ['GET', 'POST']);
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
    if (action === 'issue' && method === 'PUT') {
      return assetsController.flagIssue(req, res, id);
    }
    if (action === 'resolve' && method === 'PUT') {
      return assetsController.resolveIssue(req, res, id);
    }
    if (method === 'GET') return assetsController.getById(req, res, id);
    if (method === 'PUT' || method === 'PATCH') return assetsController.update(req, res, id);
    if (method === 'DELETE') return assetsController.remove(req, res, id);
    return methodNotAllowed(res, ['GET', 'PUT', 'PATCH', 'DELETE']);
  }
  
  // ============================================
  // ASSET SCHEDULER ROUTES
  // ============================================
  if (resource === 'assets-scheduler') {
    if (id === 'conflicts' && method === 'GET') {
      return assetSchedulerController.getConflicts(req, res);
    }
    if (id === 'recommendations' && action && method === 'GET') {
      return assetSchedulerController.getRecommendations(req, res, action);
    }
    return methodNotAllowed(res, ['GET']);
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
    if (action === 'fulfill' && method === 'POST') {
      return requisitionsController.fulfill(req, res, id);
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
    if (id === 'project-status' && action && method === 'GET') {
      return procurementController.getProjectStatus(req, res, action);
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
  
  // ============================================
  // AUDIT LOGS ROUTES
  // ============================================
  if (resource === 'audit-logs') {
    if (id === 'recent' && method === 'GET') {
      return auditController.getRecent(req, res);
    }
    if (!id && method === 'GET') {
      return auditController.getAll(req, res);
    }
    return methodNotAllowed(res, ['GET']);
  }
  
  // ============================================
  // ROAD ESTIMATION ROUTES
  // ============================================
  if (resource === 'road-estimation') {
    if (id === 'calculate' && method === 'POST') {
      return roadEstimationController.calculate(req, res);
    }
    if (id === 'save' && method === 'POST') {
      return roadEstimationController.save(req, res);
    }
    if (action === 'toggle-item' && method === 'PATCH') {
      return roadEstimationController.toggleItem(req, res, id);
    }
    if (method === 'GET' && id && !action) {
      return roadEstimationController.getForProject(req, res, id);
    }
    return methodNotAllowed(res, ['GET', 'POST', 'PATCH']);
  }

  // ============================================
  // INVENTORY ROUTES
  // ============================================
  if (resource === 'inventory') {
    if (id === 'distribute' && method === 'POST') {
      return inventoryController.distribute(req, res);
    }
    if (id === 'consume' && method === 'POST') {
      return inventoryController.consume(req, res);
    }
    if (id === 'incoming-shipments' && method === 'GET') {
      return inventoryController.getIncomingShipments(req, res);
    }
    if (id === 'receive-shipment' && method === 'POST') {
      return inventoryController.receiveShipment(req, res);
    }
    if (id === 'sector' && action && method === 'GET') {
      // url pattern: /inventory/sector/:sectorId => resource='inventory', id='sector', action=':sectorId'
      return inventoryController.getBySector(req, res, action);
    }
    if (id === 'project' && action && method === 'GET') {
      return inventoryController.getByProject(req, res, action);
    }
    return methodNotAllowed(res, ['GET', 'POST']);
  }

  // ============================================
  // REPLENISHMENT ROUTES
  // ============================================
  if (resource === 'replenishment') {
    if (id === 'project' && action && method === 'GET') {
      return replenishmentController.getByProject(req, res, action);
    }
    if (id === 'pending' && method === 'GET') {
      return replenishmentController.getPending(req, res);
    }
    if (id === 'request' && method === 'POST') {
      return replenishmentController.create(req, res);
    }
    if (action === 'finance-action' && method === 'POST') {
      return replenishmentController.financeAction(req, res, id);
    }
    if (action === 'pm-action' && method === 'POST') {
      return replenishmentController.pmAction(req, res, id);
    }
    if (action === 'complete' && method === 'POST') {
      return replenishmentController.complete(req, res, id);
    }
    return methodNotAllowed(res, ['GET', 'POST']);
  }

  // ============================================
  // RECONCILIATION ROUTES
  // ============================================
  if (resource === 'reconciliation') {
    if (id && method === 'GET') {
      return reconciliationController.getReport(req, res, id);
    }
    if (id && action === 'lock' && method === 'POST') {
      return reconciliationController.lock(req, res, id);
    }
    return methodNotAllowed(res, ['GET', 'POST']);
  }

  // ============================================
  // SAFETY INCIDENTS ROUTES
  // ============================================
  if (resource === 'safety-incidents') {
    if (!id && method === 'GET') {
      return safetyIncidentsController.getAll(req, res);
    }
    if (!id && method === 'POST') {
      return safetyIncidentsController.create(req, res);
    }
    if (id && action === 'status' && (method === 'PUT' || method === 'PATCH')) {
      return safetyIncidentsController.updateStatus(req, res, id);
    }
    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'PATCH']);
  }

  // ============================================
  // WHISTLEBLOWER ROUTES
  // ============================================
  if (resource === 'whistleblower') {
    if (!id && method === 'GET') {
      return whistleblowerController.getAll(req, res);
    }
    if (!id && method === 'POST') {
      return whistleblowerController.create(req, res);
    }
    if (id && action === 'status' && (method === 'PUT' || method === 'PATCH')) {
      return whistleblowerController.updateStatus(req, res, id);
    }
    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'PATCH']);
  }

  // ============================================
  // BUDGET CHANGE ROUTES
  // ============================================
  if (resource === 'budget-changes') {
    if (!id && method === 'GET') {
      return budgetChangesController.getAll(req, res);
    }
    if (!id && method === 'POST') {
      return budgetChangesController.create(req, res);
    }
    if (id && action === 'approve' && method === 'POST') {
      return budgetChangesController.approve(req, res, id);
    }
    if (id && action === 'reject' && method === 'POST') {
      return budgetChangesController.reject(req, res, id);
    }
    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'PATCH']);
  }

  // ============================================
  // TIMELINE EXTENSION ROUTES
  // ============================================
  if (resource === 'timeline-extensions') {
    if (!id && method === 'GET') {
      return timelineExtensionController.getAll(req, res);
    }
    if (!id && method === 'POST') {
      return timelineExtensionController.create(req, res);
    }
    if (id && action === 'approve' && method === 'POST') {
      return timelineExtensionController.approve(req, res, id);
    }
    if (id && action === 'reject' && method === 'POST') {
      return timelineExtensionController.reject(req, res, id);
    }
    return methodNotAllowed(res, ['GET', 'POST']);
  }

  // ============================================
  // DOCUMENT ROUTES
  // ============================================
  if (resource === 'documents') {
    const handled = await documentRoutes(req, res);
    if (handled !== false) return;
  }
  
  // ============================================
  // NOTIFICATION ROUTES
  // ============================================
  if (resource === 'notifications') {
    if (id === 'count' && method === 'GET') {
      return notificationsController.getUnreadCount(req, res);
    }
    if (id === 'read-all' && method === 'PUT') {
      return notificationsController.markAllRead(req, res);
    }
    if (action === 'read' && method === 'PUT') {
      return notificationsController.markRead(req, res, id);
    }
    if (!id && method === 'GET') {
      return notificationsController.getAll(req, res);
    }
    if (!id && method === 'POST') {
      return notificationsController.create(req, res);
    }
    return methodNotAllowed(res, ['GET', 'POST', 'PUT']);
  }

  // ============================================
  // PUSH NOTIFICATION ROUTES
  // ============================================
  if (resource === 'push') {
    if (id === 'key' && method === 'GET') {
      return pushController.getPublicKey(req, res);
    }
    if (id === 'subscribe' && method === 'POST') {
      return pushController.subscribe(req, res);
    }
    if (id === 'unsubscribe' && method === 'POST') {
      return pushController.unsubscribe(req, res);
    }
    return methodNotAllowed(res, ['GET', 'POST']);
  }

  // ============================================
  // REPORTS ROUTES
  // ============================================
  if (resource === 'reports') {
    if (method !== 'GET') return methodNotAllowed(res, ['GET']);
    const { id: role, action: reportName, subAction } = parseUrl(req.url);

    // PM Reports
    if (role === 'pm') {
      if (reportName === 'portfolio') return reportsController.pmPortfolio(req, res);
      if (reportName === 'project-health' && subAction) return reportsController.pmProjectHealth(req, res, subAction);
      if (reportName === 'timeline') return reportsController.pmTimeline(req, res);
    }
    // Finance Reports
    if (role === 'finance') {
      if (reportName === 'budget') return reportsController.financeBudget(req, res);
      if (reportName === 'requisitions') return reportsController.financeRequisitions(req, res);
      if (reportName === 'top-vendors') return reportsController.financeTopVendors(req, res);
      if (reportName === 'spend-categories') return reportsController.financeSpendCategories(req, res);
    }
    // Field Reports
    if (role === 'field') {
      if (reportName === 'daily-logs' && subAction) return reportsController.fieldDailyLogs(req, res, subAction);
      if (reportName === 'top-materials' && subAction) return reportsController.fieldTopMaterials(req, res, subAction);
      if (reportName === 'burn-rate' && subAction) return reportsController.fieldBurnRate(req, res, subAction);
      if (reportName === 'headcount' && subAction) return reportsController.fieldHeadcount(req, res, subAction);
      if (reportName === 'task-progress' && subAction) return reportsController.fieldDailyLogs(req, res, subAction);
    }
    // Contract Reports
    if (role === 'contracts') {
      if (reportName === 'status') return reportsController.contractsStatus(req, res);
      if (reportName === 'milestones') return reportsController.contractsMilestones(req, res);
    }
    // Equipment Reports
    if (role === 'equipment') {
      if (reportName === 'utilization') return reportsController.equipmentUtilization(req, res);
      if (reportName === 'top-deployed') return reportsController.equipmentTopDeployed(req, res);
      if (reportName === 'maintenance-costs') return reportsController.equipmentMaintenanceCosts(req, res);
    }
    // Ops Reports
    if (role === 'ops') {
      if (reportName === 'dashboard') return reportsController.opsDashboard(req, res);
      if (reportName === 'issues') return reportsController.opsIssues(req, res);
      if (reportName === 'top-issues') return reportsController.opsTopIssues(req, res);
      if (reportName === 'safety') return reportsController.opsSafety(req, res);
    }
    // Executive Reports
    if (role === 'executive') {
      if (reportName === 'summary') return reportsController.execSummary(req, res);
      if (reportName === 'risks') return reportsController.execRisks(req, res);
      if (reportName === 'project-rankings') return reportsController.execProjectRankings(req, res);
    }
    // System Reports
    if (role === 'system') {
      if (reportName === 'health') return reportsController.sysHealth(req, res);
      if (reportName === 'audit') return reportsController.sysAudit(req, res);
      if (reportName === 'top-actions') return reportsController.sysTopActions(req, res);
      if (reportName === 'integrity') return reportsController.sysIntegrity(req, res);
    }
  }

  // ============================================
  // DISPATCH ROUTES
  // ============================================
  if (resource === 'dispatch') {
    if (method === 'POST' && !id) {
      return dispatchController.dispatch(req, res);
    }
    if (method === 'POST' && id && action === 'confirm') {
      return dispatchController.confirmArrival(req, res, id);
    }
    return methodNotAllowed(res, ['POST']);
  }

  // Not found
  return response.notFound(res, 'Endpoint');
}

module.exports = { router, parseUrl };

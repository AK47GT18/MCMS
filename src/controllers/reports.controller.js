/**
 * MCMS Controller - Reports
 * Standardized report builder controller
 */

const reports = require('../services/reports.service');
const { authenticate } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');
const { parseBody } = require('../middlewares/validate.middleware');
const { sendReport, parseReportQuery } = require('../utils/exportUtils');
const auditService = require('../services/audit.service');
const response = require('../utils/response');
const { prisma } = require('../config/database');

/**
 * Log report access to audit trail
 */
async function auditReport(user, reportCode, filters) {
  if (user?.id) {
    await auditService.log({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'RUN_REPORT',
      targetType: 'Report',
      details: { reportCode, filters }
    }).catch(() => {});
  }
}

/**
 * GET /api/v1/reports/catalog
 * Returns the list of available reports based on user role
 */
const getCatalog = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;

  // Filter catalog by user role
  // Roles in catalog are short (PM, FD, EC, FS, CA)
  // Mapping from DB role to short role
  const roleMap = {
    'Project_Manager': 'PM',
    'Finance_Director': 'FD',
    'Equipment_Coordinator': 'EC',
    'Field_Supervisor': 'FS',
    'Contract_Administrator': 'CA'
  };
  const shortRole = roleMap[user.role] || user.role;

  const catalog = reports.REPORT_CATALOG.filter(r => 
    r.roles.includes(shortRole) || user.role === 'Project_Manager' // PM sees all
  );

  return response.success(res, catalog);
});

/**
 * GET /api/v1/reports/config
 * Returns dynamic filter options (projects, statuses, etc.)
 */
const getConfig = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const projects = await prisma.project.findMany({
    select: { id: true, code: true, name: true }
  });

  const config = {
    projects,
    statuses: ['active', 'pending', 'completed', 'on_hold', 'rejected', 'approved'],
    categories: [...new Set(reports.REPORT_CATALOG.map(r => r.category))]
  };

  return response.success(res, config);
});

/**
 * POST /api/v1/reports/run
 * Executes a report with given filters
 */
const runReport = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const body = await parseBody(req);
  const { reportCode, filters = {} } = body;

  if (!reportCode) {
    return response.error(res, 'Report code is required', 400);
  }

  // Security check: Verify user has access to this report
  const reportDef = reports.REPORT_CATALOG.find(r => r.code === reportCode);
  if (!reportDef) {
    return response.error(res, 'Report not found', 404);
  }

  const roleMap = {
    'Project_Manager': 'PM',
    'Finance_Director': 'FD',
    'Equipment_Coordinator': 'EC',
    'Field_Supervisor': 'FS',
    'Contract_Administrator': 'CA'
  };
  const shortRole = roleMap[user.role] || user.role;

  if (!reportDef.roles.includes(shortRole) && user.role !== 'Project_Manager') {
    return response.error(res, 'Unauthorized access to this report', 403);
  }

  try {
    const data = await reports.runReport(reportCode, filters);
    await auditReport(user, reportCode, filters);

    // If export format is requested in query params, use export logic
    const query = parseReportQuery(req.url);
    if (query.format && query.format !== 'json') {
        return sendReport(req, res, data.rows, `report_${reportCode}`, {
            title: reportDef.name,
            summary: data.summary,
            columns: reportDef.fields
        });
    }

    return response.success(res, data);
  } catch (err) {
    console.error(`Report Error [${reportCode}]:`, err);
    return response.error(res, `Failed to generate report: ${err.message}`, 500);
  }
});

const getFinanceBudget = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const projects = await prisma.project.findMany({
    where: { status: { in: ['active', 'in_progress', 'planning'] } },
    select: { budgetTotal: true, budgetSpent: true }
  });

  const summary = projects.reduce((acc, p) => {
    acc.totalBudget += Number(p.budgetTotal) || 0;
    acc.totalSpent += Number(p.budgetSpent) || 0;
    return acc;
  }, { totalBudget: 0, totalSpent: 0 });

  return response.success(res, summary);
});

module.exports = {
  getCatalog,
  getConfig,
  runReport,
  getFinanceBudget
};

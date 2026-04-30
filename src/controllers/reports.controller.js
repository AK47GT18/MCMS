/**
 * MCMS Controller - Reports
 * Handles all report endpoints with JSON/CSV/PDF export
 */

const reports = require('../services/reports.service');
const { authenticate } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');
const { parseBody } = require('../middlewares/validate.middleware');
const { parseReportQuery, sendReport } = require('../utils/exportUtils');
const auditService = require('../services/audit.service');

// Helper: log report access to audit trail
async function auditReport(user, reportName, query) {
  if (user?.id) {
    await auditService.log({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'VIEW_REPORT',
      targetType: 'Report',
      details: { report: reportName, filters: query }
    }).catch(() => {});
  }
}

// ============================================
// PM REPORTS
// ============================================

const pmPortfolio = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.pmPortfolio();
  await auditReport(user, 'pm_portfolio', {});
  sendReport(req, res, data, 'pm_portfolio', { title: 'Project Portfolio Report' });
});

const pmProjectHealth = asyncHandler(async (req, res, projectId) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.pmProjectHealth(projectId);
  await auditReport(user, `pm_project_health_${projectId}`, { projectId });
  sendReport(req, res, data, `pm_project_health_${projectId}`, { title: 'Project Health Analysis' });
});

const pmTimeline = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.pmTimeline();
  await auditReport(user, 'pm_timeline', {});
  sendReport(req, res, data, 'pm_timeline', { title: 'Project Timeline Performance' });
});

// ============================================
// FINANCE REPORTS
// ============================================

const financeBudget = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.financeBudget();
  await auditReport(user, 'finance_budget', {});
  sendReport(req, res, data, 'finance_budget_utilization', { title: 'Global Budget Utilization' });
});

const financeRequisitions = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.financeRequisitions();
  await auditReport(user, 'finance_requisitions', {});
  sendReport(req, res, data, 'finance_requisitions_summary', { title: 'Procurement Requisition Summary' });
});

const financeTopVendors = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.financeTopVendors();
  await auditReport(user, 'finance_top_vendors', {});
  sendReport(req, res, data.rows, 'finance_top_vendors', { 
    title: 'Top Vendors by Expenditure',
    columns: ['name', 'count', 'totalSpend'] 
  });
});

const financeSpendCategories = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.financeSpendCategories();
  await auditReport(user, 'finance_spend_categories', {});
  sendReport(req, res, data, 'finance_spend_by_category', { title: 'Expenditure by Category' });
});

// ============================================
// FIELD REPORTS
// ============================================

const fieldDailyLogs = asyncHandler(async (req, res, projectId) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.fieldDailyLogs(projectId);
  await auditReport(user, `field_daily_logs_${projectId}`, { projectId });
  sendReport(req, res, data, `field_daily_logs_${projectId}`, { title: 'Field Activity Daily Logs' });
});

const fieldTopMaterials = asyncHandler(async (req, res, projectId) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.fieldTopMaterials(projectId);
  await auditReport(user, `field_top_materials_${projectId}`, { projectId });
  sendReport(req, res, data.rows, `field_top_materials_${projectId}`, { 
    title: 'Top Consumed Materials',
    columns: ['name', 'count', 'totalQuantity']
  });
});

const fieldBurnRate = asyncHandler(async (req, res, projectId) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.fieldBurnRate(projectId);
  await auditReport(user, `field_burn_rate_${projectId}`, { projectId });
  sendReport(req, res, data, `field_burn_rate_${projectId}`, { title: 'Material Burn Rate Analysis' });
});

const fieldHeadcount = asyncHandler(async (req, res, projectId) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.fieldHeadcount(projectId);
  await auditReport(user, `field_headcount_${projectId}`, { projectId });
  sendReport(req, res, data, `field_headcount_${projectId}`, { title: 'Site Labor Headcount Report' });
});

// ============================================
// CONTRACT REPORTS
// ============================================

const contractsStatus = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.contractsStatus();
  await auditReport(user, 'contracts_status', {});
  sendReport(req, res, data, 'contracts_status_summary', { title: 'Contractual Status Overview' });
});

const contractsMilestones = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.contractsMilestones();
  await auditReport(user, 'contracts_milestones', {});
  sendReport(req, res, data, 'contracts_milestones_health', { title: 'Contract Milestone Compliance' });
});

// ============================================
// EQUIPMENT REPORTS
// ============================================

const equipmentUtilization = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.equipmentUtilization();
  await auditReport(user, 'equipment_utilization', {});
  sendReport(req, res, data, 'equipment_utilization_rate', { title: 'Asset Utilization Metrics' });
});

const equipmentTopDeployed = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.equipmentTopDeployed();
  await auditReport(user, 'equipment_top_deployed', {});
  sendReport(req, res, data.rows, 'equipment_top_deployed', { 
    title: 'Most Deployed Equipment',
    columns: ['name', 'count']
  });
});

const equipmentMaintenanceCosts = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.equipmentMaintenanceCosts();
  await auditReport(user, 'equipment_maintenance', {});
  sendReport(req, res, data, 'equipment_maintenance_costs', { title: 'Asset Maintenance Expenditure' });
});

// ============================================
// OPS REPORTS
// ============================================

const opsDashboard = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.opsDashboard();
  await auditReport(user, 'ops_dashboard', {});
  sendReport(req, res, data, 'operations_efficiency_kpis', { title: 'Operations Efficiency KPIs' });
});

const opsIssues = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.opsIssues();
  await auditReport(user, 'ops_issues', {});
  sendReport(req, res, data, 'site_issues_summary', { title: 'Site Issues and Blockers' });
});

const opsTopIssues = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.opsTopIssues();
  await auditReport(user, 'ops_top_issues', {});
  sendReport(req, res, data.rows, 'ops_top_recurring_issues', { 
    title: 'Top Recurring Site Issues',
    columns: ['name', 'count']
  });
});

const opsSafety = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.opsSafety();
  await auditReport(user, 'ops_safety', {});
  sendReport(req, res, data, 'safety_compliance_report', { title: 'Safety and Incident Compliance' });
});

// ============================================
// EXECUTIVE REPORTS
// ============================================

const execSummary = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.execSummary();
  await auditReport(user, 'exec_summary', {});
  sendReport(req, res, data, 'executive_portfolio_summary', { title: 'Executive Portfolio Summary' });
});

const execRisks = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.execRisks();
  await auditReport(user, 'exec_risks', {});
  sendReport(req, res, data, 'enterprise_risk_exposure', { title: 'Enterprise Risk Exposure' });
});

const execProjectRankings = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.execProjectRankings();
  await auditReport(user, 'exec_project_rankings', {});
  sendReport(req, res, data, 'project_performance_rankings', { title: 'Project Performance Rankings' });
});

// ============================================
// SYSTEM REPORTS
// ============================================

const sysHealth = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.systemHealth();
  await auditReport(user, 'sys_health', {});
  sendReport(req, res, data, 'system_health_performance', { title: 'System Health and Performance' });
});

const sysAudit = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.systemAudit(query);
  await auditReport(user, 'sys_audit', query);
  sendReport(req, res, data, 'system_audit_logs', { title: 'Detailed System Audit Trail' });
});

const sysTopActions = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.systemTopActions(query);
  await auditReport(user, 'system_top_actions', query);
  sendReport(req, res, data.rows, 'system_top_actions', { 
    title: 'Top Actions Report',
    columns: ['name', 'count'],
  });
});

const sysIntegrity = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.systemIntegrity();
  await auditReport(user, 'system_integrity', {});
  sendReport(req, res, data, 'system_data_integrity', {
    title: 'Data Integrity Report',
    summary: { 'Score': `${data.score}%`, 'Passed': `${data.passed}/${data.totalChecks}` },
  });
});

const dynamicReport = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  
  // Combine body and query params
  const query = parseReportQuery(req.url);
  const body = req.method === 'POST' ? await parseBody(req) : (req.body || {});
  const params = { ...query, ...body };

  if (!params.model) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Parameter "model" is required for dynamic reports.' }));
      return;
  }

  const data = await reports.dynamicReport(params);
  await auditReport(user, `dynamic_${params.model}`, params);
  
  sendReport(req, res, data, `dynamic_${params.model}`, {
    title: `Dynamic Analytics: ${params.model.toUpperCase()}`,
    summary: { 
      'Model': params.model, 
      'Metric': params.metric || 'list',
      'Field': params.field || 'N/A'
    }
  });
});

module.exports = {
  pmPortfolio, pmProjectHealth, pmTimeline,
  financeBudget, financeRequisitions, financeTopVendors, financeSpendCategories,
  fieldDailyLogs, fieldTopMaterials, fieldBurnRate, fieldHeadcount,
  contractsStatus, contractsMilestones,
  equipmentUtilization, equipmentTopDeployed, equipmentMaintenanceCosts,
  opsDashboard, opsIssues, opsTopIssues, opsSafety,
  execSummary, execRisks, execProjectRankings,
  sysHealth, sysAudit, sysTopActions, sysIntegrity,
  dynamicReport,
};

/**
 * MCMS Controller - Reports
 * Handles all report endpoints with JSON/CSV/PDF export
 */

const reports = require('../services/reports.service');
const { authenticate } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');
const { parseReportQuery, sendReport } = require('../utils/exportUtils');
const auditService = require('../services/audit.service');

// Helper: log report access to audit trail
async function auditReport(user, reportName, query) {
  if (user?.id) {
    await auditService.log(user.id, 'VIEW_REPORT', 'Report', null, { report: reportName, filters: query }).catch(() => {});
  }
}

// ============================================
// PM REPORTS
// ============================================
const pmPortfolio = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.pmPortfolio(query);
  await auditReport(user, 'pm_portfolio', query);
  sendReport(req, res, data.rows, 'pm_portfolio_summary', {
    title: 'Portfolio Summary Report',
    summary: { 'Total Projects': data.totalProjects },
    columns: ['code', 'name', 'status', 'avgProgress', 'budgetUtilization', 'openIssues', 'overdueTasks'],
  });
});

const pmProjectHealth = asyncHandler(async (req, res, projectId) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.pmProjectHealth(Number(projectId), query);
  if (!data) { res.writeHead(404); res.end(JSON.stringify({ error: 'Project not found' })); return; }
  await auditReport(user, 'pm_project_health', { projectId, ...query });
  sendReport(req, res, data, 'pm_project_health', {
    title: `Project Health: ${data.project.name}`,
    summary: { 'Progress': `${data.schedule.avgProgress}%`, 'Budget Used': `${data.budget.utilization}%`, 'Open Issues': data.issues.open },
  });
});

const pmTimeline = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.pmTimeline(query);
  await auditReport(user, 'pm_timeline', query);
  sendReport(req, res, data.rows, 'pm_timeline_compliance', {
    title: 'Timeline Compliance Report',
    summary: { 'Total Tasks': data.totalTasks, 'Overdue': data.overdueCount, 'On Time': data.onTimeCount },
    columns: ['projectCode', 'taskName', 'progress', 'endDate', 'isOverdue', 'daysOverdue'],
  });
});

// ============================================
// FINANCE REPORTS
// ============================================
const financeBudget = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.financeBudget(query);
  await auditReport(user, 'finance_budget', query);
  sendReport(req, res, data.rows, 'finance_budget_overview', {
    title: 'Budget Overview Report',
    summary: { 'Total Budget': data.totalBudget.toLocaleString(), 'Total Spent': data.totalSpent.toLocaleString(), 'Projects': data.projectCount },
    columns: ['code', 'name', 'budgetTotal', 'budgetSpent', 'utilization', 'burnRatePerDay', 'overBudgetRisk'],
  });
});

const financeRequisitions = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.financeRequisitions(query);
  await auditReport(user, 'finance_requisitions', query);
  sendReport(req, res, data.rows, 'finance_requisition_analysis', {
    title: 'Requisition Analysis Report',
    summary: { 'Total': data.total, 'Total Value': data.totalValue.toLocaleString() },
    columns: ['reqCode', 'projectCode', 'submittedBy', 'totalAmount', 'status', 'fraudFlag', 'createdAt'],
  });
});

const financeTopVendors = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.financeTopVendors(query);
  await auditReport(user, 'finance_top_vendors', query);
  sendReport(req, res, data.rows, 'finance_top_vendors', {
    title: 'Top Vendors Report',
    summary: { 'Total Vendors': data.totalVendors },
    columns: ['vendorName', 'totalValue', 'contractCount', 'activeContracts'],
  });
});

const financeSpendCategories = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.financeSpendCategories(query);
  await auditReport(user, 'finance_spend_categories', query);
  sendReport(req, res, data.rows, 'finance_spend_by_category', {
    title: 'Spend by Category Report',
    summary: { 'Categories': data.totalCategories, 'Total Spend': data.totalSpend.toLocaleString() },
    columns: ['name', 'totalSpend', 'itemCount', 'requisitionCount'],
  });
});

// ============================================
// FIELD SUPERVISOR REPORTS
// ============================================
const fieldDailyLogs = asyncHandler(async (req, res, projectId) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.fieldDailyLogs(projectId, query);
  await auditReport(user, 'field_daily_logs', { projectId, ...query });
  sendReport(req, res, data.rows, 'field_daily_log_summary', {
    title: 'Daily Log Summary Report',
    summary: { 'Total Logs': data.totalLogs, 'Avg Headcount': data.avgHeadcount },
    columns: ['logDate', 'submittedBy', 'headcount', 'weather', 'status', 'isSos', 'expenseAmount'],
  });
});

const fieldTopMaterials = asyncHandler(async (req, res, projectId) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.fieldTopMaterials(projectId, query);
  await auditReport(user, 'field_top_materials', { projectId, ...query });
  sendReport(req, res, data.rows, 'field_most_used_materials', {
    title: 'Most Used Materials Report',
    summary: { 'Materials Tracked': data.totalMaterials },
    columns: ['materialName', 'unit', 'totalConsumed', 'consumptionCount', 'onHand'],
  });
});

const fieldBurnRate = asyncHandler(async (req, res, projectId) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.fieldBurnRate(projectId, query);
  await auditReport(user, 'field_burn_rate', { projectId, ...query });
  sendReport(req, res, data.rows, 'field_material_burn_rate', {
    title: 'Material Burn Rate & Depletion Forecast',
    summary: { 'Materials': data.totalMaterials, 'Critical': data.criticalCount },
    columns: ['materialName', 'onHand', 'dailyBurnRate', 'daysUntilDepletion', 'projectedNeed', 'critical'],
  });
});

const fieldHeadcount = asyncHandler(async (req, res, projectId) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.fieldHeadcount(projectId, query);
  await auditReport(user, 'field_headcount', { projectId, ...query });
  sendReport(req, res, data.rows, 'field_headcount_trends', {
    title: 'Headcount Trends Report',
    columns: ['period', 'avgHeadcount', 'logCount', 'totalHeadcount'],
  });
});

// ============================================
// CONTRACT ADMIN REPORTS
// ============================================
const contractsStatus = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.contractsStatus(query);
  await auditReport(user, 'contracts_status', query);
  sendReport(req, res, data.rows, 'contract_status_summary', {
    title: 'Contract Status Summary',
    summary: { 'Total Contracts': data.totalContracts, 'Total Value': data.totalValue.toLocaleString() },
    columns: ['refCode', 'title', 'vendorName', 'value', 'status', 'endDate', 'milestoneCount'],
  });
});

const contractsMilestones = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.contractsMilestones(query);
  await auditReport(user, 'contracts_milestones', query);
  sendReport(req, res, data.rows, 'contract_milestone_tracker', {
    title: 'Milestone Tracker Report',
    summary: { 'Total': data.total, 'Overdue': data.overdueCount },
    columns: ['contractRef', 'description', 'dueDate', 'value', 'status', 'isOverdue'],
  });
});

// ============================================
// EQUIPMENT COORDINATOR REPORTS
// ============================================
const equipmentUtilization = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.equipmentUtilization(query);
  await auditReport(user, 'equipment_utilization', query);
  sendReport(req, res, data.rows, 'equipment_fleet_utilization', {
    title: 'Fleet Utilization Report',
    summary: { 'Total Assets': data.totalAssets, 'Total Value': data.totalValue.toLocaleString() },
    columns: ['assetCode', 'name', 'category', 'status', 'condition', 'projectCode', 'lastMaintenance'],
  });
});

const equipmentTopDeployed = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.equipmentTopDeployed(query);
  await auditReport(user, 'equipment_top_deployed', query);
  sendReport(req, res, data.rows, 'equipment_most_deployed', {
    title: 'Most Deployed Assets Report',
    columns: ['assetCode', 'name', 'category', 'checkoutCount'],
  });
});

const equipmentMaintenanceCosts = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.equipmentMaintenanceCosts(query);
  await auditReport(user, 'equipment_maintenance_costs', query);
  sendReport(req, res, data.rows, 'equipment_maintenance_costs', {
    title: 'Maintenance Cost Analysis',
    summary: { 'Total Cost': data.totalCost.toLocaleString() },
    columns: ['name', 'totalCost', 'recordCount'],
  });
});

// ============================================
// OPERATIONS MANAGER REPORTS
// ============================================
const opsDashboard = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.opsDashboard(query);
  await auditReport(user, 'ops_dashboard', query);
  sendReport(req, res, data, 'ops_dashboard', { title: 'Operations Dashboard Report' });
});

const opsIssues = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.opsIssues(query);
  await auditReport(user, 'ops_issues', query);
  sendReport(req, res, data.rows, 'ops_issue_analytics', {
    title: 'Issue Analytics Report',
    summary: { 'Total Issues': data.total, 'Avg Age (days)': data.avgAgeDays },
    columns: ['issueCode', 'category', 'priority', 'status', 'projectCode', 'ageDays', 'assignedTo'],
  });
});

const opsTopIssues = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.opsTopIssues(query);
  await auditReport(user, 'ops_top_issues', query);
  sendReport(req, res, data.rows, 'ops_top_issue_categories', {
    title: 'Top Issue Categories Report',
    columns: ['name', 'count', 'openCount'],
  });
});

const opsSafety = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.opsSafety(query);
  await auditReport(user, 'ops_safety', query);
  sendReport(req, res, data.rows, 'ops_safety_summary', {
    title: 'Safety Summary Report',
    summary: { 'Total Incidents': data.total, 'Open': data.openCount },
    columns: ['incidentType', 'siteArea', 'status', 'projectCode', 'reportedBy', 'createdAt'],
  });
});

// ============================================
// MANAGING DIRECTOR REPORTS
// ============================================
const execSummary = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.execSummary(query);
  await auditReport(user, 'exec_summary', query);
  sendReport(req, res, data, 'executive_summary', { title: 'Executive Summary Report' });
});

const execRisks = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.execRisks(query);
  await auditReport(user, 'exec_risks', query);
  sendReport(req, res, data.rows, 'executive_risk_dashboard', {
    title: 'Risk Assessment Dashboard',
    summary: { 'Projects Assessed': data.totalProjects, 'High Risk': data.highRisk },
    columns: ['code', 'name', 'budgetRisk', 'scheduleRisk', 'overdueTasks', 'criticalIssues', 'overallRisk'],
  });
});

const execProjectRankings = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.execProjectRankings(query);
  await auditReport(user, 'exec_rankings', query);
  sendReport(req, res, data.rows, 'executive_project_rankings', {
    title: 'Project Rankings Report',
    columns: ['code', 'name', 'avgProgress', 'budgetUtilization', 'openIssues', 'overdueTasks'],
  });
});

// ============================================
// SYSTEM TECHNICIAN REPORTS
// ============================================
const sysHealth = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const data = await reports.systemHealth();
  await auditReport(user, 'system_health', {});
  sendReport(req, res, data, 'system_health', { title: 'System Health Report' });
});

const sysAudit = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res); if (!user) return;
  const query = parseReportQuery(req.url);
  const data = await reports.systemAudit(query);
  await auditReport(user, 'system_audit', query);
  sendReport(req, res, data.rows, 'system_audit_analysis', {
    title: 'Audit Trail Analysis',
    summary: { 'Total Records': data.total },
    columns: ['timestamp', 'userName', 'userRole', 'action', 'targetType', 'targetCode', 'ipAddress'],
  });
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

module.exports = {
  pmPortfolio, pmProjectHealth, pmTimeline,
  financeBudget, financeRequisitions, financeTopVendors, financeSpendCategories,
  fieldDailyLogs, fieldTopMaterials, fieldBurnRate, fieldHeadcount,
  contractsStatus, contractsMilestones,
  equipmentUtilization, equipmentTopDeployed, equipmentMaintenanceCosts,
  opsDashboard, opsIssues, opsTopIssues, opsSafety,
  execSummary, execRisks, execProjectRankings,
  sysHealth, sysAudit, sysTopActions, sysIntegrity,
};

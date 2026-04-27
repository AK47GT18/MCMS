/**
 * MCMS Service - Reports Engine
 * Comprehensive reporting for all 8 roles with specific query filters
 */

const { prisma } = require('../config/database');
const logger = require('../utils/logger');

// ============================================
// HELPER: Date range filter builder
// ============================================
function dateFilter(field, dateFrom, dateTo) {
  const filter = {};
  if (dateFrom) filter.gte = new Date(dateFrom);
  if (dateTo) filter.lte = new Date(dateTo);
  return Object.keys(filter).length ? { [field]: filter } : {};
}

// ============================================
// 1. PROJECT MANAGER REPORTS
// ============================================

async function pmPortfolio(query) {
  const { status, sortBy, dateFrom, dateTo } = query;
  const where = {};
  if (status) where.status = status;
  if (dateFrom || dateTo) Object.assign(where, dateFilter('createdAt', dateFrom, dateTo));

  const projects = await prisma.project.findMany({
    where,
    include: {
      manager: { select: { id: true, name: true } },
      tasks: { select: { id: true, progress: true, startDate: true, endDate: true } },
      issues: { where: { status: 'open' }, select: { id: true } },
      _count: { select: { dailyLogs: true, requisitions: true, contracts: true } },
    },
  });

  const rows = projects.map(p => {
    const taskCount = p.tasks.length;
    const avgProgress = taskCount > 0 ? Math.round(p.tasks.reduce((s, t) => s + (t.progress || 0), 0) / taskCount) : 0;
    const overdueTasks = p.tasks.filter(t => t.endDate && new Date(t.endDate) < new Date() && (t.progress || 0) < 100).length;
    const budgetTotal = Number(p.budgetTotal) || 0;
    const budgetSpent = Number(p.budgetSpent) || 0;
    const budgetUtil = budgetTotal > 0 ? Math.round((budgetSpent / budgetTotal) * 100) : 0;

    return {
      projectId: p.id, code: p.code, name: p.name, status: p.status,
      manager: p.manager?.name || 'Unassigned',
      taskCount, avgProgress, overdueTasks,
      openIssues: p.issues.length,
      budgetTotal, budgetSpent, budgetUtilization: budgetUtil,
      dailyLogs: p._count.dailyLogs, contracts: p._count.contracts,
      startDate: p.startDate, endDate: p.endDate,
    };
  });

  if (sortBy === 'budgetUtilization') rows.sort((a, b) => b.budgetUtilization - a.budgetUtilization);
  else if (sortBy === 'progress') rows.sort((a, b) => b.avgProgress - a.avgProgress);
  else if (sortBy === 'issues') rows.sort((a, b) => b.openIssues - a.openIssues);

  return { totalProjects: rows.length, rows };
}

async function pmProjectHealth(projectId, query) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      manager: { select: { name: true } },
      fieldSupervisor: { select: { name: true } },
      tasks: true,
      issues: true,
      dailyLogs: { orderBy: { logDate: 'desc' }, take: 30 },
      requisitions: true,
    },
  });
  if (!project) return null;

  const tasks = project.tasks;
  const now = new Date();
  const avgProgress = tasks.length > 0 ? Math.round(tasks.reduce((s, t) => s + (t.progress || 0), 0) / tasks.length) : 0;
  const overdue = tasks.filter(t => t.endDate && new Date(t.endDate) < now && (t.progress || 0) < 100);
  const completed = tasks.filter(t => (t.progress || 0) >= 100);

  const projectDuration = project.startDate && project.endDate
    ? (new Date(project.endDate) - new Date(project.startDate)) / (1000 * 60 * 60 * 24) : 0;
  const elapsed = project.startDate ? (now - new Date(project.startDate)) / (1000 * 60 * 60 * 24) : 0;
  const scheduleProgress = projectDuration > 0 ? Math.round((elapsed / projectDuration) * 100) : 0;
  const scheduleVariance = avgProgress - scheduleProgress;

  const budgetTotal = Number(project.budgetTotal) || 0;
  const budgetSpent = Number(project.budgetSpent) || 0;
  const burnRate = elapsed > 0 ? Math.round(budgetSpent / elapsed) : 0;

  const approvedLogs = project.dailyLogs.filter(l => l.status === 'approved' || l.pmApproved).length;
  const logCompliance = project.dailyLogs.length > 0 ? Math.round((approvedLogs / project.dailyLogs.length) * 100) : 0;

  return {
    project: { id: project.id, code: project.code, name: project.name, status: project.status },
    manager: project.manager?.name, fieldSupervisor: project.fieldSupervisor?.name,
    schedule: { avgProgress, scheduleProgress, scheduleVariance, overdueTasks: overdue.length, completedTasks: completed.length, totalTasks: tasks.length },
    budget: { total: budgetTotal, spent: budgetSpent, remaining: budgetTotal - budgetSpent, burnRatePerDay: burnRate, utilization: budgetTotal > 0 ? Math.round((budgetSpent / budgetTotal) * 100) : 0 },
    issues: { open: project.issues.filter(i => i.status === 'open').length, total: project.issues.length },
    logCompliance,
    taskBreakdown: query.includeTaskBreakdown ? tasks.map(t => ({ id: t.id, name: t.name, progress: t.progress, startDate: t.startDate, endDate: t.endDate, overdue: t.endDate && new Date(t.endDate) < now && (t.progress || 0) < 100 })) : undefined,
  };
}

async function pmTimeline(query) {
  const { projectId, overdueOnly, dateFrom, dateTo } = query;
  const where = {};
  if (projectId) where.projectId = Number(projectId);
  if (dateFrom || dateTo) Object.assign(where, dateFilter('endDate', dateFrom, dateTo));

  const tasks = await prisma.task.findMany({
    where,
    include: { project: { select: { id: true, code: true, name: true } } },
    orderBy: { endDate: 'asc' },
  });

  const now = new Date();
  let rows = tasks.map(t => ({
    taskId: t.id, taskName: t.name, progress: t.progress || 0,
    projectCode: t.project.code, projectName: t.project.name,
    startDate: t.startDate, endDate: t.endDate,
    isOverdue: t.endDate && new Date(t.endDate) < now && (t.progress || 0) < 100,
    daysOverdue: t.endDate && new Date(t.endDate) < now ? Math.floor((now - new Date(t.endDate)) / (1000 * 60 * 60 * 24)) : 0,
  }));

  if (overdueOnly) rows = rows.filter(r => r.isOverdue);

  return { totalTasks: rows.length, overdueCount: rows.filter(r => r.isOverdue).length, onTimeCount: rows.filter(r => !r.isOverdue).length, rows };
}

// ============================================
// 2. FINANCE DIRECTOR REPORTS
// ============================================

async function financeBudget(query) {
  const { projectId, overBudgetOnly, sortBy } = query;
  const where = {};
  if (projectId) where.id = Number(projectId);

  const projects = await prisma.project.findMany({
    where,
    select: { id: true, code: true, name: true, status: true, budgetTotal: true, budgetSpent: true, contractValue: true, startDate: true, endDate: true },
  });

  let rows = projects.map(p => {
    const total = Number(p.budgetTotal) || 0;
    const spent = Number(p.budgetSpent) || 0;
    const remaining = total - spent;
    const utilization = total > 0 ? Math.round((spent / total) * 100) : 0;
    const now = new Date();
    const elapsed = p.startDate ? (now - new Date(p.startDate)) / (1000 * 60 * 60 * 24) : 1;
    const totalDays = p.startDate && p.endDate ? (new Date(p.endDate) - new Date(p.startDate)) / (1000 * 60 * 60 * 24) : 1;
    const projectedSpend = totalDays > 0 ? Math.round((spent / Math.max(elapsed, 1)) * totalDays) : spent;

    return {
      projectId: p.id, code: p.code, name: p.name, status: p.status,
      budgetTotal: total, budgetSpent: spent, remaining, utilization,
      contractValue: Number(p.contractValue) || 0,
      burnRatePerDay: Math.round(spent / Math.max(elapsed, 1)),
      projectedTotalSpend: projectedSpend,
      overBudgetRisk: projectedSpend > total,
    };
  });

  if (overBudgetOnly) rows = rows.filter(r => r.overBudgetRisk);
  if (sortBy === 'burnRate') rows.sort((a, b) => b.burnRatePerDay - a.burnRatePerDay);
  else if (sortBy === 'utilization') rows.sort((a, b) => b.utilization - a.utilization);

  const totalBudget = rows.reduce((s, r) => s + r.budgetTotal, 0);
  const totalSpent = rows.reduce((s, r) => s + r.budgetSpent, 0);

  return { totalBudget, totalSpent, totalRemaining: totalBudget - totalSpent, projectCount: rows.length, rows };
}

async function financeRequisitions(query) {
  const { status, projectId, vendorName, dateFrom, dateTo, minAmount, maxAmount } = query;
  const where = {};
  if (status) where.status = status;
  if (projectId) where.projectId = Number(projectId);
  if (vendorName) where.vendorName = { contains: vendorName, mode: 'insensitive' };
  if (dateFrom || dateTo) Object.assign(where, dateFilter('createdAt', dateFrom, dateTo));
  if (minAmount || maxAmount) {
    where.totalAmount = {};
    if (minAmount) where.totalAmount.gte = Number(minAmount);
    if (maxAmount) where.totalAmount.lte = Number(maxAmount);
  }

  const reqs = await prisma.requisition.findMany({
    where,
    include: {
      project: { select: { code: true, name: true } },
      submitter: { select: { name: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = reqs.map(r => ({
    id: r.id, reqCode: r.reqCode, status: r.status,
    projectCode: r.project?.code, projectName: r.project?.name,
    submittedBy: r.submitter?.name, vendorName: r.vendorName,
    totalAmount: Number(r.totalAmount), itemCount: r.items.length,
    fraudFlag: r.fraudCheck, createdAt: r.createdAt,
  }));

  const byStatus = {};
  rows.forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });

  return { total: rows.length, totalValue: rows.reduce((s, r) => s + r.totalAmount, 0), byStatus, rows };
}

async function financeTopVendors(query) {
  const { limit = 10, sortBy = 'totalValue', dateFrom, dateTo } = query;
  const where = {};
  if (dateFrom || dateTo) Object.assign(where, dateFilter('createdAt', dateFrom, dateTo));

  const contracts = await prisma.contract.findMany({
    where,
    select: { vendorName: true, value: true, status: true, projectId: true },
  });

  const vendorMap = {};
  contracts.forEach(c => {
    const name = c.vendorName || 'Unknown';
    if (!vendorMap[name]) vendorMap[name] = { vendorName: name, totalValue: 0, contractCount: 0, activeContracts: 0 };
    vendorMap[name].totalValue += Number(c.value) || 0;
    vendorMap[name].contractCount++;
    if (c.status === 'active') vendorMap[name].activeContracts++;
  });

  let rows = Object.values(vendorMap);
  if (sortBy === 'contractCount') rows.sort((a, b) => b.contractCount - a.contractCount);
  else rows.sort((a, b) => b.totalValue - a.totalValue);

  return { totalVendors: rows.length, rows: rows.slice(0, Number(limit)) };
}

async function financeSpendCategories(query) {
  const { projectId, groupBy = 'category' } = query;
  const where = {};
  if (projectId) where.projectId = Number(projectId);

  const reqs = await prisma.requisition.findMany({
    where: { ...where, status: 'approved' },
    include: { items: true, project: { select: { code: true, name: true } } },
  });

  const groups = {};
  reqs.forEach(r => {
    r.items.forEach(item => {
      let key;
      if (groupBy === 'vendor') key = r.vendorName || 'Unknown';
      else if (groupBy === 'project') key = r.project?.code || 'Unknown';
      else key = item.itemName || 'Uncategorized';

      if (!groups[key]) groups[key] = { name: key, totalSpend: 0, itemCount: 0, requisitionCount: 0 };
      groups[key].totalSpend += Number(item.unitPrice) * item.quantity;
      groups[key].itemCount += item.quantity;
      groups[key].requisitionCount++;
    });
  });

  const rows = Object.values(groups).sort((a, b) => b.totalSpend - a.totalSpend);
  return { totalCategories: rows.length, totalSpend: rows.reduce((s, r) => s + r.totalSpend, 0), rows };
}

// ============================================
// 3. FIELD SUPERVISOR REPORTS
// ============================================

async function fieldDailyLogs(projectId, query) {
  const { dateFrom, dateTo, status, weather } = query;
  const where = { projectId: Number(projectId) };
  if (status) where.status = status;
  if (weather) where.weather = { contains: weather, mode: 'insensitive' };
  if (dateFrom || dateTo) Object.assign(where, dateFilter('logDate', dateFrom, dateTo));

  const logs = await prisma.dailyLog.findMany({
    where,
    include: { submitter: { select: { name: true } }, tasks: { select: { name: true } } },
    orderBy: { logDate: 'desc' },
  });

  const rows = logs.map(l => ({
    id: l.id, logDate: l.logDate, status: l.status,
    submittedBy: l.submitter?.name, headcount: l.headcount, weather: l.weather,
    narrative: l.narrative, expenseAmount: Number(l.expenseAmount) || 0,
    taskName: l.tasks?.name || '-', isSos: l.isSos, pmApproved: l.pmApproved,
  }));

  const byStatus = {};
  rows.forEach(r => { byStatus[r.status || 'pending'] = (byStatus[r.status || 'pending'] || 0) + 1; });

  return { totalLogs: rows.length, byStatus, avgHeadcount: rows.length > 0 ? Math.round(rows.reduce((s, r) => s + (r.headcount || 0), 0) / rows.length) : 0, rows };
}

async function fieldTopMaterials(projectId, query) {
  const { limit = 10, sortBy = 'consumed', sectorId, dateFrom, dateTo } = query;

  const sectors = await prisma.sector.findMany({
    where: { projectId: Number(projectId) },
    include: {
      inventories: {
        where: sectorId ? { sectorId: Number(sectorId) } : {},
        include: {
          logs: {
            where: {
              type: 'OUT',
              ...(dateFrom || dateTo ? dateFilter('timestamp', dateFrom, dateTo) : {}),
            },
          },
        },
      },
    },
  });

  const materialMap = {};
  sectors.forEach(s => {
    s.inventories.forEach(inv => {
      const key = inv.materialName;
      if (!materialMap[key]) materialMap[key] = { materialName: key, unit: inv.unit, totalConsumed: 0, consumptionCount: 0, onHand: 0 };
      materialMap[key].onHand += Number(inv.quantityOnHand);
      inv.logs.forEach(log => {
        materialMap[key].totalConsumed += Number(log.quantity);
        materialMap[key].consumptionCount++;
      });
    });
  });

  let rows = Object.values(materialMap);
  if (sortBy === 'frequency') rows.sort((a, b) => b.consumptionCount - a.consumptionCount);
  else rows.sort((a, b) => b.totalConsumed - a.totalConsumed);

  return { totalMaterials: rows.length, rows: rows.slice(0, Number(limit)) };
}

async function fieldBurnRate(projectId, query) {
  const { materialName, projectedDays = 30 } = query;
  const where = { projectId: Number(projectId) };

  const sectors = await prisma.sector.findMany({
    where,
    include: {
      inventories: {
        where: materialName ? { materialName: { contains: materialName, mode: 'insensitive' } } : {},
        include: { logs: { where: { type: 'OUT' }, orderBy: { timestamp: 'desc' } } },
      },
    },
  });

  const rows = [];
  sectors.forEach(s => {
    s.inventories.forEach(inv => {
      const totalConsumed = inv.logs.reduce((sum, l) => sum + Number(l.quantity), 0);
      const firstLog = inv.logs[inv.logs.length - 1];
      const lastLog = inv.logs[0];
      const daySpan = firstLog && lastLog ? Math.max(1, (new Date(lastLog.timestamp) - new Date(firstLog.timestamp)) / (1000 * 60 * 60 * 24)) : 1;
      const dailyRate = totalConsumed / daySpan;
      const onHand = Number(inv.quantityOnHand);
      const daysUntilDepletion = dailyRate > 0 ? Math.round(onHand / dailyRate) : 999;

      rows.push({
        materialName: inv.materialName, unit: inv.unit, sectorName: s.name,
        onHand, totalConsumed: Math.round(totalConsumed * 100) / 100,
        dailyBurnRate: Math.round(dailyRate * 100) / 100,
        daysUntilDepletion,
        projectedNeed: Math.round(dailyRate * Number(projectedDays) * 100) / 100,
        critical: daysUntilDepletion < 7,
      });
    });
  });

  rows.sort((a, b) => a.daysUntilDepletion - b.daysUntilDepletion);
  return { totalMaterials: rows.length, criticalCount: rows.filter(r => r.critical).length, rows };
}

async function fieldHeadcount(projectId, query) {
  const { dateFrom, dateTo, groupBy = 'day' } = query;
  const where = { projectId: Number(projectId) };
  if (dateFrom || dateTo) Object.assign(where, dateFilter('logDate', dateFrom, dateTo));

  const logs = await prisma.dailyLog.findMany({
    where,
    select: { logDate: true, headcount: true },
    orderBy: { logDate: 'asc' },
  });

  const groups = {};
  logs.forEach(l => {
    if (!l.headcount) return;
    let key;
    const d = new Date(l.logDate);
    if (groupBy === 'week') {
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (groupBy === 'month') {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } else {
      key = d.toISOString().split('T')[0];
    }
    if (!groups[key]) groups[key] = { period: key, totalHeadcount: 0, logCount: 0 };
    groups[key].totalHeadcount += l.headcount;
    groups[key].logCount++;
  });

  const rows = Object.values(groups).map(g => ({ ...g, avgHeadcount: Math.round(g.totalHeadcount / g.logCount) }));
  return { totalPeriods: rows.length, rows };
}

// ============================================
// 4. CONTRACT ADMINISTRATOR REPORTS
// ============================================

async function contractsStatus(query) {
  const { status, projectId, expiringWithinDays } = query;
  const where = {};
  if (status) where.status = status;
  if (projectId) where.projectId = Number(projectId);
  if (expiringWithinDays) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Number(expiringWithinDays));
    where.endDate = { lte: futureDate, gte: new Date() };
  }

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      project: { select: { code: true, name: true } },
      _count: { select: { milestones: true, versions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = contracts.map(c => ({
    id: c.id, refCode: c.refCode, title: c.title, status: c.status,
    vendorName: c.vendorName, contractType: c.contractType,
    value: Number(c.value) || 0,
    projectCode: c.project?.code, projectName: c.project?.name,
    startDate: c.startDate, endDate: c.endDate,
    milestoneCount: c._count.milestones, versionCount: c._count.versions,
  }));

  const byStatus = {};
  rows.forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });

  return { totalContracts: rows.length, totalValue: rows.reduce((s, r) => s + r.value, 0), byStatus, rows };
}

async function contractsMilestones(query) {
  const { status, overdueOnly } = query;
  const where = {};
  if (status) where.status = status;

  const milestones = await prisma.milestone.findMany({
    where,
    include: { contract: { select: { refCode: true, title: true, project: { select: { code: true, name: true } } } } },
    orderBy: { dueDate: 'asc' },
  });

  const now = new Date();
  let rows = milestones.map(m => ({
    id: m.id, refCode: m.refCode, description: m.description, status: m.status,
    dueDate: m.dueDate, value: Number(m.value) || 0,
    contractRef: m.contract.refCode, contractTitle: m.contract.title,
    projectCode: m.contract.project?.code,
    isOverdue: m.dueDate && new Date(m.dueDate) < now && m.status !== 'paid' && m.status !== 'certified',
  }));

  if (overdueOnly) rows = rows.filter(r => r.isOverdue);
  return { total: rows.length, overdueCount: rows.filter(r => r.isOverdue).length, rows };
}

// ============================================
// 5. EQUIPMENT COORDINATOR REPORTS
// ============================================

async function equipmentUtilization(query) {
  const { status, category, projectId, condition } = query;
  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (condition) where.condition = condition;
  if (projectId) where.currentProjectId = Number(projectId);

  const assets = await prisma.asset.findMany({
    where,
    include: {
      currentProject: { select: { code: true, name: true } },
      _count: { select: { assetLogs: true, maintenanceRecords: true } },
    },
  });

  const rows = assets.map(a => ({
    id: a.id, assetCode: a.assetCode, name: a.name, category: a.category,
    status: a.status, condition: a.condition,
    projectCode: a.currentProject?.code, projectName: a.currentProject?.name,
    hoursOrKm: a.hoursOrKm, fuelLevel: a.fuelLevel,
    estimatedValue: Number(a.estimatedValue) || 0,
    logCount: a._count.assetLogs, maintenanceCount: a._count.maintenanceRecords,
    lastMaintenance: a.lastMaintenanceAt,
  }));

  const byStatus = {};
  rows.forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });

  return { totalAssets: rows.length, byStatus, totalValue: rows.reduce((s, r) => s + r.estimatedValue, 0), rows };
}

async function equipmentTopDeployed(query) {
  const { limit = 10, dateFrom, dateTo } = query;
  const logWhere = { action: 'checkout' };
  if (dateFrom || dateTo) Object.assign(logWhere, dateFilter('timestamp', dateFrom, dateTo));

  const logs = await prisma.assetLog.findMany({
    where: logWhere,
    include: { asset: { select: { assetCode: true, name: true, category: true } } },
  });

  const assetMap = {};
  logs.forEach(l => {
    const key = l.assetId;
    if (!assetMap[key]) assetMap[key] = { assetId: key, assetCode: l.asset.assetCode, name: l.asset.name, category: l.asset.category, checkoutCount: 0 };
    assetMap[key].checkoutCount++;
  });

  const rows = Object.values(assetMap).sort((a, b) => b.checkoutCount - a.checkoutCount).slice(0, Number(limit));
  return { totalTracked: rows.length, rows };
}

async function equipmentMaintenanceCosts(query) {
  const { assetId, groupBy = 'asset', dateFrom, dateTo } = query;
  const where = {};
  if (assetId) where.assetId = Number(assetId);
  if (dateFrom || dateTo) Object.assign(where, dateFilter('serviceDate', dateFrom, dateTo));

  const records = await prisma.maintenanceRecord.findMany({
    where,
    include: { asset: { select: { assetCode: true, name: true } } },
  });

  const groups = {};
  records.forEach(r => {
    let key;
    if (groupBy === 'type') key = r.type;
    else if (groupBy === 'month') key = new Date(r.serviceDate).toISOString().substring(0, 7);
    else key = r.asset.assetCode;

    if (!groups[key]) groups[key] = { name: key, totalCost: 0, recordCount: 0 };
    groups[key].totalCost += Number(r.cost) || 0;
    groups[key].recordCount++;
  });

  const rows = Object.values(groups).sort((a, b) => b.totalCost - a.totalCost);
  return { totalCost: rows.reduce((s, r) => s + r.totalCost, 0), rows };
}

// ============================================
// 6. OPERATIONS MANAGER REPORTS
// ============================================

async function opsDashboard(query) {
  const { dateFrom, dateTo } = query;

  const [projectCounts, openIssues, sosAlerts, activeAssets] = await Promise.all([
    prisma.project.groupBy({ by: ['status'], _count: true }),
    prisma.issue.count({ where: { status: 'open' } }),
    prisma.dailyLog.count({ where: { isSos: true, pmApproved: false } }),
    prisma.asset.count({ where: { status: 'checked_out' } }),
  ]);

  const statusMap = {};
  projectCounts.forEach(p => { statusMap[p.status] = p._count; });

  return {
    projects: statusMap,
    totalProjects: Object.values(statusMap).reduce((s, v) => s + v, 0),
    openIssues, activeSosAlerts: sosAlerts, activeAssets,
  };
}

async function opsIssues(query) {
  const { projectId, priority, status, category, sortBy = 'age' } = query;
  const where = {};
  if (projectId) where.projectId = Number(projectId);
  if (priority) where.priority = priority;
  if (status) where.status = status;
  if (category) where.category = category;

  const issues = await prisma.issue.findMany({
    where,
    include: {
      project: { select: { code: true, name: true } },
      reporter: { select: { name: true } },
      assignee: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const now = new Date();
  const rows = issues.map(i => ({
    id: i.id, issueCode: i.issueCode, category: i.category, priority: i.priority,
    status: i.status, description: i.description,
    projectCode: i.project?.code, projectName: i.project?.name,
    reportedBy: i.reporter?.name, assignedTo: i.assignee?.name,
    createdAt: i.createdAt, resolvedAt: i.resolvedAt,
    ageDays: Math.floor((now - new Date(i.createdAt)) / (1000 * 60 * 60 * 24)),
    resolutionDays: i.resolvedAt ? Math.floor((new Date(i.resolvedAt) - new Date(i.createdAt)) / (1000 * 60 * 60 * 24)) : null,
  }));

  if (sortBy === 'priority') {
    const pOrder = { Critical: 0, High: 1, high: 1, Medium: 2, medium: 2, Low: 3, low: 3 };
    rows.sort((a, b) => (pOrder[a.priority] || 5) - (pOrder[b.priority] || 5));
  }

  return { total: rows.length, avgAgeDays: rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.ageDays, 0) / rows.length) : 0, rows };
}

async function opsTopIssues(query) {
  const { limit = 10, groupBy = 'category', dateFrom, dateTo } = query;
  const where = {};
  if (dateFrom || dateTo) Object.assign(where, dateFilter('createdAt', dateFrom, dateTo));

  const issues = await prisma.issue.findMany({
    where,
    include: { project: { select: { code: true } } },
  });

  const groups = {};
  issues.forEach(i => {
    let key;
    if (groupBy === 'project') key = i.project?.code || 'Unknown';
    else if (groupBy === 'priority') key = i.priority || 'Unknown';
    else key = i.category || 'Uncategorized';

    if (!groups[key]) groups[key] = { name: key, count: 0, openCount: 0 };
    groups[key].count++;
    if (i.status === 'open') groups[key].openCount++;
  });

  const rows = Object.values(groups).sort((a, b) => b.count - a.count).slice(0, Number(limit));
  return { totalCategories: rows.length, rows };
}

async function opsSafety(query) {
  const { projectId, incidentType, status, dateFrom, dateTo } = query;
  const where = {};
  if (projectId) where.projectId = Number(projectId);
  if (incidentType) where.incidentType = incidentType;
  if (status) where.status = status;
  if (dateFrom || dateTo) Object.assign(where, dateFilter('createdAt', dateFrom, dateTo));

  const incidents = await prisma.safetyIncident.findMany({
    where,
    include: {
      project: { select: { code: true, name: true } },
      reporter: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = incidents.map(i => ({
    id: i.id, incidentType: i.incidentType, siteArea: i.siteArea,
    description: i.description, status: i.status,
    projectCode: i.project?.code, reportedBy: i.reporter?.name,
    createdAt: i.createdAt, resolvedAt: i.resolvedAt,
  }));

  return { total: rows.length, openCount: rows.filter(r => r.status === 'open').length, rows };
}

// ============================================
// 7. MANAGING DIRECTOR REPORTS
// ============================================

async function execSummary(query) {
  const [projects, totalBudget, totalSpent, contractValue, openIssues, userCount] = await Promise.all([
    prisma.project.groupBy({ by: ['status'], _count: true }),
    prisma.project.aggregate({ _sum: { budgetTotal: true } }),
    prisma.project.aggregate({ _sum: { budgetSpent: true } }),
    prisma.contract.aggregate({ _sum: { value: true }, where: { status: 'active' } }),
    prisma.issue.count({ where: { status: 'open' } }),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  const statusMap = {};
  projects.forEach(p => { statusMap[p.status] = p._count; });

  return {
    portfolio: statusMap,
    totalProjects: Object.values(statusMap).reduce((s, v) => s + v, 0),
    financials: {
      totalBudget: Number(totalBudget._sum.budgetTotal) || 0,
      totalSpent: Number(totalSpent._sum.budgetSpent) || 0,
      activeContractValue: Number(contractValue._sum.value) || 0,
    },
    openIssues, activeUsers: userCount,
  };
}

async function execRisks(query) {
  const { riskLevel } = query;

  const projects = await prisma.project.findMany({
    where: { status: { in: ['active', 'planning'] } },
    include: {
      tasks: { select: { progress: true, endDate: true } },
      issues: { where: { status: 'open' }, select: { priority: true } },
      requisitions: { where: { fraudCheck: true }, select: { id: true } },
    },
  });

  const now = new Date();
  const rows = projects.map(p => {
    const budgetTotal = Number(p.budgetTotal) || 1;
    const budgetSpent = Number(p.budgetSpent) || 0;
    const budgetRisk = budgetSpent / budgetTotal > 0.9 ? 'high' : budgetSpent / budgetTotal > 0.7 ? 'medium' : 'low';
    const overdueTasks = p.tasks.filter(t => t.endDate && new Date(t.endDate) < now && (t.progress || 0) < 100).length;
    const scheduleRisk = overdueTasks > 3 ? 'high' : overdueTasks > 0 ? 'medium' : 'low';
    const criticalIssues = p.issues.filter(i => i.priority === 'Critical' || i.priority === 'High').length;
    const fraudFlags = p.requisitions.length;
    const riskMap = { high: 3, medium: 2, low: 1 };
    const overallScore = riskMap[budgetRisk] + riskMap[scheduleRisk] + (criticalIssues > 0 ? 2 : 0) + (fraudFlags > 0 ? 3 : 0);
    const overallRisk = overallScore >= 6 ? 'high' : overallScore >= 3 ? 'medium' : 'low';

    return {
      projectId: p.id, code: p.code, name: p.name,
      budgetRisk, scheduleRisk, overdueTasks, criticalIssues, fraudFlags, overallRisk, riskScore: overallScore,
    };
  });

  let filtered = rows;
  if (riskLevel) filtered = rows.filter(r => r.overallRisk === riskLevel);
  filtered.sort((a, b) => b.riskScore - a.riskScore);

  return { totalProjects: filtered.length, highRisk: filtered.filter(r => r.overallRisk === 'high').length, rows: filtered };
}

async function execProjectRankings(query) {
  const { rankBy = 'health' } = query;
  const result = await pmPortfolio({});
  let rows = result.rows;

  if (rankBy === 'progress') rows.sort((a, b) => b.avgProgress - a.avgProgress);
  else if (rankBy === 'budgetEfficiency') rows.sort((a, b) => a.budgetUtilization - b.budgetUtilization);
  else if (rankBy === 'issueCount') rows.sort((a, b) => b.openIssues - a.openIssues);
  else {
    rows.forEach(r => { r.healthScore = r.avgProgress - r.overdueTasks * 10 - (r.budgetUtilization > 90 ? 20 : 0); });
    rows.sort((a, b) => b.healthScore - a.healthScore);
  }

  return { totalProjects: rows.length, rows };
}

// ============================================
// 8. SYSTEM TECHNICIAN REPORTS
// ============================================

async function systemHealth() {
  const [usersByRole, lockedUsers, totalAudit, recentAudit] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.user.count({ where: { isLocked: true } }),
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);

  const roleMap = {};
  usersByRole.forEach(u => { roleMap[u.role] = u._count; });

  return {
    users: { byRole: roleMap, totalUsers: Object.values(roleMap).reduce((s, v) => s + v, 0), lockedUsers },
    auditLogs: { total: totalAudit, last24h: recentAudit },
  };
}

async function systemAudit(query) {
  const { userId, action, targetType, dateFrom, dateTo, ipAddress } = query;
  const where = {};
  if (userId) where.userId = Number(userId);
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (targetType) where.targetType = targetType;
  if (ipAddress) where.ipAddress = ipAddress;
  if (dateFrom || dateTo) Object.assign(where, dateFilter('timestamp', dateFrom, dateTo));

  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { name: true, role: true } } },
    orderBy: { timestamp: 'desc' },
    take: 500,
  });

  const rows = logs.map(l => ({
    id: l.id, action: l.action, targetType: l.targetType, targetId: l.targetId,
    targetCode: l.targetCode, userName: l.userName || l.user?.name,
    userRole: l.userRole || l.user?.role, ipAddress: l.ipAddress,
    timestamp: l.timestamp, details: l.details,
  }));

  return { total: rows.length, rows };
}

async function systemTopActions(query) {
  const { limit = 20, groupBy = 'action', dateFrom, dateTo } = query;
  const where = {};
  if (dateFrom || dateTo) Object.assign(where, dateFilter('timestamp', dateFrom, dateTo));

  const logs = await prisma.auditLog.findMany({ where, select: { action: true, userName: true, targetType: true } });

  const groups = {};
  logs.forEach(l => {
    let key;
    if (groupBy === 'user') key = l.userName || 'System';
    else if (groupBy === 'targetType') key = l.targetType || 'Unknown';
    else key = l.action;

    if (!groups[key]) groups[key] = { name: key, count: 0 };
    groups[key].count++;
  });

  const rows = Object.values(groups).sort((a, b) => b.count - a.count).slice(0, Number(limit));
  return { totalGroups: rows.length, rows };
}

async function systemIntegrity() {
  const [orphanedTasks, orphanedLogs, orphanedReqs, projectsNoManager, projectsNoTasks] = await Promise.all([
    prisma.task.count({ where: { project: null } }),
    prisma.dailyLog.count({ where: { submittedBy: null } }),
    prisma.requisition.count({ where: { submittedBy: null } }),
    prisma.project.count({ where: { managerId: null } }),
    prisma.project.count({ where: { tasks: { none: {} } } }),
  ]);

  const checks = [
    { check: 'Orphaned Tasks (no project)', count: orphanedTasks, status: orphanedTasks === 0 ? 'pass' : 'fail' },
    { check: 'Daily Logs without submitter', count: orphanedLogs, status: orphanedLogs === 0 ? 'pass' : 'warn' },
    { check: 'Requisitions without submitter', count: orphanedReqs, status: orphanedReqs === 0 ? 'pass' : 'warn' },
    { check: 'Projects without Manager', count: projectsNoManager, status: projectsNoManager === 0 ? 'pass' : 'warn' },
    { check: 'Projects without Tasks', count: projectsNoTasks, status: projectsNoTasks === 0 ? 'pass' : 'info' },
  ];

  const passCount = checks.filter(c => c.status === 'pass').length;
  return { score: Math.round((passCount / checks.length) * 100), totalChecks: checks.length, passed: passCount, checks };
}

// ============================================
// 9. DYNAMIC REPORT ENGINE (NEW)
// ============================================

async function dynamicReport(params) {
  const { model, metric, field, groupBy, dateField, startDate, endDate, filters = {} } = params;
  
  const ALLOWED_MODELS = [
    'user', 'project', 'task', 'contract', 'asset', 'requisition', 
    'dailyLog', 'inventory', 'safetyIncident', 'materialUsage', 
    'variationOrder', 'transaction', 'auditLog', 'vendor',
    'roadLayer', 'roadSpecification', 'projectExtensionRequest',
    'replenishmentRequest', 'issue', 'whistleblowerReport', 'budgetChange'
  ];
  
  if (!ALLOWED_MODELS.includes(model)) {
    throw new Error(`Report on model '${model}' is not permitted.`);
  }

  const where = { ...filters };
  if (startDate && endDate && dateField) {
    where[dateField] = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  // Dynamic grouping logic
  if (groupBy) {
    const aggregations = {};
    if (metric === 'count') aggregations._count = true;
    if (metric === 'sum') aggregations._sum = { [field]: true };
    if (metric === 'avg') aggregations._avg = { [field]: true };
    if (metric === 'min') aggregations._min = { [field]: true };
    if (metric === 'max') aggregations._max = { [field]: true };

    const result = await prisma[model].groupBy({
      by: [groupBy],
      where,
      ...aggregations
    });
    
    return result.map(item => {
      const row = { [groupBy]: item[groupBy] };
      if (item._count) row.count = typeof item._count === 'object' ? item._count[field] || item._count._all || item._count.id : item._count;
      if (item._sum) row.sum = item._sum[field];
      if (item._avg) row.avg = item._avg[field];
      if (item._min) row.min = item._min[field];
      if (item._max) row.max = item._max[field];
      return row;
    });
  }

  // Simple aggregations
  if (metric === 'count') {
    const count = await prisma[model].count({ where });
    return { count };
  }

  if (['sum', 'avg', 'min', 'max'].includes(metric)) {
    const result = await prisma[model].aggregate({
      [`_${metric}`]: { [field]: true },
      where
    });
    return { [metric]: result[`_${metric}`][field] };
  }

  return await prisma[model].findMany({
    where,
    take: 100,
    orderBy: { [dateField || 'createdAt']: 'desc' }
  });
}

module.exports = {
  // PM
  pmPortfolio, pmProjectHealth, pmTimeline,
  // Finance
  financeBudget, financeRequisitions, financeTopVendors, financeSpendCategories,
  // Field
  fieldDailyLogs, fieldTopMaterials, fieldBurnRate, fieldHeadcount,
  // Contracts
  contractsStatus, contractsMilestones,
  // Equipment
  equipmentUtilization, equipmentTopDeployed, equipmentMaintenanceCosts,
  // Ops
  opsDashboard, opsIssues, opsTopIssues, opsSafety,
  // Executive
  execSummary, execRisks, execProjectRankings,
  // System
  systemHealth, systemAudit, systemTopActions, systemIntegrity,
  // Dynamic
  dynamicReport,
};

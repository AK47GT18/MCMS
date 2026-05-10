/**
 * MCMS Service - Reports Engine
 * Comprehensive reporting for RCMS roles
 */

const { prisma } = require('../config/database');
const logger = require('../utils/logger');

// ============================================
// REPORT CATALOG DEFINITION
// ============================================

const REPORT_CATALOG = [
  // SECTION 1: FINANCIAL REPORTS
  {
    code: '1.01',
    category: 'Financial',
    name: 'Budget Overview by Project',
    roles: ['PM', 'FD'],
    model: 'Project',
    fields: ['Code', 'Name', 'Contract Value', 'Budget Total', 'Budget Spent', 'Remaining', '% Utilised', 'Status'],
    numericFields: ['Contract Value', 'Budget Total', 'Budget Spent', 'Remaining', '% Utilised']
  },
  {
    code: '1.02',
    category: 'Financial',
    name: 'Transaction Ledger',
    roles: ['PM', 'FD'],
    model: 'Transaction',
    fields: ['Entry Code', 'Project', 'Description', 'Debit', 'Credit', 'Net', 'Account Code', 'Created By', 'Created At'],
    numericFields: ['Debit', 'Credit', 'Net']
  },
  {
    code: '1.03',
    category: 'Financial',
    name: 'Requisition Spend Summary',
    roles: ['PM', 'FD'],
    model: 'Requisition',
    fields: ['Req Code', 'Project', 'Submitted By', 'Total Amount', 'Status', 'Vendor Name', 'Fraud Check'],
    numericFields: ['Total Amount']
  },
  {
    code: '1.04',
    category: 'Financial',
    name: 'Requisition Items Detail',
    roles: ['PM', 'FD'],
    model: 'RequisitionItem',
    fields: ['Req Code', 'Project', 'Item Name', 'Quantity', 'Unit Price', 'Line Total', 'Status'],
    numericFields: ['Quantity', 'Unit Price', 'Line Total']
  },
  {
    code: '1.05',
    category: 'Financial',
    name: 'Budget Change Requests (BCR) Log',
    roles: ['PM', 'FD'],
    model: 'BudgetChangeRequest',
    fields: ['BCR Code', 'Project', 'Category', 'Current Amount', 'Proposed Amount', 'Difference', 'Status'],
    numericFields: ['Current Amount', 'Proposed Amount', 'Difference']
  },
  {
    code: '1.06',
    category: 'Financial',
    name: 'Budget Control Allocation vs Spent',
    roles: ['PM', 'FD'],
    model: 'BudgetControl',
    fields: ['Project', 'Phase', 'Category', 'Allocated Limit', 'Spent Amount', 'Remaining', '% Used', 'Status'],
    numericFields: ['Allocated Limit', 'Spent Amount', 'Remaining', '% Used']
  },
  {
    code: '1.07',
    category: 'Financial',
    name: 'Daily Log Expenses Summary',
    roles: ['PM', 'FD', 'FS'],
    model: 'DailyLogExpense',
    fields: ['Log Date', 'Project', 'Category', 'Quantity', 'Unit Price', 'Total Cost', 'Submitted By'],
    numericFields: ['Quantity', 'Unit Price', 'Total Cost']
  },
  {
    code: '1.08',
    category: 'Financial',
    name: 'Contract Financial Summary',
    roles: ['PM', 'FD', 'CA'],
    model: 'Contract',
    fields: ['Ref Code', 'Project', 'Title', 'Vendor', 'Contract Value', 'VAT', 'WHT', 'Retention', 'Status'],
    numericFields: ['Contract Value', 'VAT', 'WHT', 'Retention']
  },
  {
    code: '1.09',
    category: 'Financial',
    name: 'Milestone Payment Schedule',
    roles: ['PM', 'FD', 'CA'],
    model: 'Milestone',
    fields: ['Milestone Ref', 'Contract Ref', 'Project', 'Description', 'Due Date', 'Value', 'Status'],
    numericFields: ['Value']
  },
  {
    code: '1.10',
    category: 'Financial',
    name: 'Variation Orders Financial Impact',
    roles: ['PM', 'FD', 'CA'],
    model: 'VariationOrder',
    fields: ['VO Code', 'Project', 'Title', 'Net Value', 'Status', 'Requested By'],
    numericFields: ['Net Value']
  },
  {
    code: '1.11',
    category: 'Financial',
    name: 'Replenishment Request Cost Tracking',
    roles: ['PM', 'FD'],
    model: 'ReplenishmentRequest',
    fields: ['Req Code', 'Project', 'Material', 'Quantity', 'Estimated Cost', 'Status', 'Requested By'],
    numericFields: ['Quantity', 'Estimated Cost']
  },
  {
    code: '1.12',
    category: 'Financial',
    name: 'Vendor Spend Analysis',
    roles: ['PM', 'FD', 'CA'],
    model: 'Vendor',
    fields: ['Vendor Name', 'Category', 'Risk Level', 'Total Contract Value', 'Active Contracts'],
    numericFields: ['Total Contract Value', 'Active Contracts']
  },
  {
    code: '1.13',
    category: 'Financial',
    name: 'Insurance Policy Expiry Report',
    roles: ['PM', 'FD'],
    model: 'InsurancePolicy',
    fields: ['Entity Name', 'Policy Number', 'Expiry Date', 'Days to Expiry', 'Status'],
    numericFields: ['Days to Expiry']
  },
  {
    code: '1.14',
    category: 'Financial',
    name: 'Procurement Request Budget Report',
    roles: ['PM', 'FD'],
    model: 'ProcurementRequest',
    fields: ['Req Code', 'Vehicle Name', 'Estimated Cost', 'Priority', 'Status', 'Requested By'],
    numericFields: ['Estimated Cost']
  },

  // SECTION 2: EQUIPMENT & ASSET REPORTS
  {
    code: '2.01',
    category: 'Equipment & Asset',
    name: 'Asset Register (Full Inventory)',
    roles: ['PM', 'EC'],
    model: 'Asset',
    fields: ['Asset Code', 'Name', 'Category', 'Condition', 'Status', 'Hours/KM', 'Estimated Value'],
    numericFields: ['Hours/KM', 'Estimated Value']
  },
  {
    code: '2.02',
    category: 'Equipment & Asset',
    name: 'Asset Utilisation Report',
    roles: ['PM', 'EC'],
    model: 'AssetUsage',
    fields: ['Asset Code', 'Asset Name', 'Project', 'Operator', 'Usage Date', 'Hours Operated', 'Fuel Consumed'],
    numericFields: ['Hours Operated', 'Fuel Consumed']
  },
  {
    code: '2.03',
    category: 'Equipment & Asset',
    name: 'Asset Movement Log',
    roles: ['PM', 'EC'],
    model: 'AssetLog',
    fields: ['Asset Code', 'Asset Name', 'Action', 'Project', 'User', 'Fuel Level', 'Timestamp'],
    numericFields: ['Fuel Level']
  },
  {
    code: '2.04',
    category: 'Equipment & Asset',
    name: 'Maintenance Records Report',
    roles: ['PM', 'EC'],
    model: 'MaintenanceRecord',
    fields: ['Asset Code', 'Asset Name', 'Service Date', 'Type', 'Provider', 'Cost', 'Next Service'],
    numericFields: ['Cost']
  },
  {
    code: '2.05',
    category: 'Equipment & Asset',
    name: 'Asset Availability Dashboard',
    roles: ['PM', 'EC'],
    model: 'Asset',
    fields: ['Asset Code', 'Name', 'Category', 'Status', 'Current Project', 'Condition', 'Fuel Level'],
    numericFields: ['Fuel Level']
  },
  {
    code: '2.06',
    category: 'Equipment & Asset',
    name: 'Vehicle Rental Contract Report',
    roles: ['PM', 'EC', 'FD'],
    model: 'VehicleRentalContract',
    fields: ['Ref Code', 'Project', 'Machine Type', 'Vendor', 'Total Value', 'Start Date', 'End Date', 'Status'],
    numericFields: ['Total Value']
  },
  {
    code: '2.07',
    category: 'Equipment & Asset',
    name: 'Vehicle Rental Shifts Log',
    roles: ['PM', 'EC'],
    model: 'VehicleRentalShift',
    fields: ['Rental Ref', 'Machine Type', 'Shift Date', 'From Project', 'To Project', 'Reason'],
    numericFields: []
  },
  {
    code: '2.08',
    category: 'Equipment & Asset',
    name: 'Equipment Price Configuration Report',
    roles: ['PM', 'EC', 'FD'],
    model: 'EquipmentPriceConfig',
    fields: ['Machine Type', 'Label', 'Daily Rate', 'Updated At', 'Updated By'],
    numericFields: ['Daily Rate']
  },
  {
    code: '2.09',
    category: 'Equipment & Asset',
    name: 'Fuel Consumption Trend',
    roles: ['PM', 'EC'],
    model: 'AssetUsage',
    fields: ['Asset', 'Project', 'Usage Date', 'Fuel Consumed', 'Hours Operated', 'Efficiency'],
    numericFields: ['Fuel Consumed', 'Hours Operated', 'Efficiency']
  },
  {
    code: '2.10',
    category: 'Equipment & Asset',
    name: 'Assets Requiring Maintenance Soon',
    roles: ['PM', 'EC'],
    model: 'Asset',
    fields: ['Asset Code', 'Name', 'Category', 'Last Maintenance', 'Hours/KM', 'Condition', 'Status'],
    numericFields: ['Hours/KM']
  },

  // SECTION 3: FIELD OPERATIONS REPORTS
  {
    code: '3.01',
    category: 'Field Operations',
    name: 'Daily Log Summary',
    roles: ['PM', 'FS'],
    model: 'DailyLog',
    fields: ['Log Date', 'Project', 'Submitted By', 'Headcount', 'Weather', 'Progress %', 'Status'],
    numericFields: ['Headcount', 'Progress %']
  },
  {
    code: '3.02',
    category: 'Field Operations',
    name: 'SOS / Emergency Logs',
    roles: ['PM', 'FS'],
    model: 'DailyLog',
    fields: ['Log Date', 'Project', 'Submitted By', 'Narrative', 'Status', 'Location Verified'],
    numericFields: []
  },
  {
    code: '3.03',
    category: 'Field Operations',
    name: 'Location Verification Report',
    roles: ['PM', 'FS'],
    model: 'DailyLog',
    fields: ['Log Date', 'Project', 'Submitted By', 'Accuracy', 'Verified', 'Flagged', 'Device'],
    numericFields: ['Accuracy']
  },
  {
    code: '3.04',
    category: 'Field Operations',
    name: 'Work Progress by Phase',
    roles: ['PM', 'FS'],
    model: 'DailyLog',
    fields: ['Log Date', 'Project', 'Phase', 'Task', 'Progress %', 'Submitted By'],
    numericFields: ['Progress %']
  },
  {
    code: '3.05',
    category: 'Field Operations',
    name: 'Task Progress Report',
    roles: ['PM', 'FS'],
    model: 'Task',
    fields: ['Task Name', 'Project', 'Phase', 'Start Date', 'End Date', 'Progress %', 'Status'],
    numericFields: ['Progress %']
  },
  {
    code: '3.06',
    category: 'Field Operations',
    name: 'Safety Incident Report',
    roles: ['PM', 'FS'],
    model: 'SafetyIncident',
    fields: ['Project', 'Reported By', 'Severity', 'Type', 'Status', 'Created At'],
    numericFields: []
  },
  {
    code: '3.07',
    category: 'Field Operations',
    name: 'Safety Incident Response Log',
    roles: ['PM', 'FS'],
    model: 'SafetyIncidentReply',
    fields: ['Incident ID', 'Project', 'Replied By', 'Message', 'Created At'],
    numericFields: []
  },
  {
    code: '3.08',
    category: 'Field Operations',
    name: 'Material usage log',
    roles: ['PM', 'FS', 'EC'],
    model: 'MaterialUsage',
    fields: ['Project', 'Sector', 'Material', 'Quantity', 'Unit', 'Log Date', 'Reported By'],
    numericFields: ['Quantity']
  },
  {
    code: '3.09',
    category: 'Field Operations',
    name: 'Inventory stock levels',
    roles: ['PM', 'FS', 'EC'],
    model: 'Inventory',
    fields: ['Sector', 'Material', 'Unit', 'Quantity On Hand', 'Low Threshold', 'Min Threshold'],
    numericFields: ['Quantity On Hand', 'Low Threshold', 'Min Threshold']
  },
  {
    code: '3.10',
    category: 'Field Operations',
    name: 'Inventory movement log',
    roles: ['PM', 'FS'],
    model: 'InventoryLog',
    fields: ['Sector', 'Material', 'Type', 'Quantity', 'Reference', 'Timestamp'],
    numericFields: ['Quantity']
  },
  {
    code: '3.11',
    category: 'Field Operations',
    name: 'Sector activity report',
    roles: ['PM', 'FS'],
    model: 'Sector',
    fields: ['Sector Name', 'Project', 'Start Date', 'End Date', 'Status'],
    numericFields: []
  },
  {
    code: '3.12',
    category: 'Field Operations',
    name: 'Issue tracker',
    roles: ['PM', 'FS'],
    model: 'Issue',
    fields: ['Issue Code', 'Project', 'Priority', 'Description', 'Reported By', 'Status', 'Created At'],
    numericFields: []
  },

  // SECTION 4: CONTRACTS & PROCUREMENT
  {
    code: '4.01',
    category: 'Contracts & Procurement',
    name: 'Contract register',
    roles: ['PM', 'CA', 'FD'],
    model: 'Contract',
    fields: ['Ref Code', 'Project', 'Title', 'Vendor', 'Value', 'Status', 'Start Date', 'End Date'],
    numericFields: ['Value']
  },
  {
    code: '4.02',
    category: 'Contracts & Procurement',
    name: 'Contract version history',
    roles: ['PM', 'CA'],
    model: 'ContractVersion',
    fields: ['Contract Ref', 'Version', 'Title', 'Value', 'Status', 'Created By', 'Created At'],
    numericFields: ['Value']
  },
  {
    code: '4.03',
    category: 'Contracts & Procurement',
    name: 'Contract items (BOQ)',
    roles: ['PM', 'CA', 'FD'],
    model: 'ContractItem',
    fields: ['Contract Ref', 'Material', 'Quantity', 'Unit', 'Unit Price', 'Total Cost', 'Received Qty'],
    numericFields: ['Quantity', 'Unit Price', 'Total Cost', 'Received Qty']
  },
  {
    code: '4.04',
    category: 'Contracts & Procurement',
    name: 'Vendor performance',
    roles: ['PM', 'CA', 'FD'],
    model: 'Vendor',
    fields: ['Vendor Name', 'Category', 'Risk Level', 'Rating', 'Total Value', 'Active Contracts'],
    numericFields: ['Rating', 'Total Value', 'Active Contracts']
  },
  {
    code: '4.05',
    category: 'Contracts & Procurement',
    name: 'Procurement status',
    roles: ['PM', 'FD'],
    model: 'ProcurementRequest',
    fields: ['Req Code', 'Vehicle Name', 'Estimated Cost', 'Priority', 'Status', 'Created At'],
    numericFields: ['Estimated Cost']
  },
  {
    code: '4.06',
    category: 'Contracts & Procurement',
    name: 'Replenishment pipeline',
    roles: ['PM', 'FD', 'FS'],
    model: 'ReplenishmentRequest',
    fields: ['Req Code', 'Project', 'Material', 'Quantity', 'Estimated Cost', 'Status', 'Created At'],
    numericFields: ['Quantity', 'Estimated Cost']
  },

  // SECTION 5: HR / USERS
  {
    code: '5.01',
    category: 'HR / Users',
    name: 'User directory',
    roles: ['PM'],
    model: 'User',
    fields: ['Name', 'Email', 'Role', 'Status', 'Created At'],
    numericFields: []
  },
  {
    code: '5.02',
    category: 'HR / Users',
    name: 'Audit log',
    roles: ['PM'],
    model: 'AuditLog',
    fields: ['Timestamp', 'User', 'Role', 'Action', 'Target', 'Severity'],
    numericFields: []
  },
  {
    code: '5.03',
    category: 'HR / Users',
    name: 'Supervisor assignments',
    roles: ['PM'],
    model: 'Project',
    fields: ['Project Code', 'Project Name', 'Supervisor', 'Status'],
    numericFields: []
  },
  {
    code: '5.04',
    category: 'HR / Users',
    name: 'PM portfolio',
    roles: ['PM'],
    model: 'Project',
    fields: ['Manager', 'Total Projects', 'Budget Total', 'Budget Spent', '% Utilisation'],
    numericFields: ['Total Projects', 'Budget Total', 'Budget Spent', '% Utilisation']
  },
  {
    code: '5.05',
    category: 'HR / Users',
    name: 'Notification activity',
    roles: ['PM'],
    model: 'Notification',
    fields: ['User', 'Type', 'Title', 'Is Read', 'Created At'],
    numericFields: []
  },
  {
    code: '5.06',
    category: 'HR / Users',
    name: 'Daily log compliance',
    roles: ['PM', 'FS'],
    model: 'DailyLog',
    fields: ['User', 'Project', 'Logs Submitted', 'Approved', 'Compliance %'],
    numericFields: ['Logs Submitted', 'Approved', 'Compliance %']
  },

  // SECTION 6: PROJECT OVERVIEW
  {
    code: '6.01',
    category: 'Project Overview',
    name: 'Project status dashboard',
    roles: ['PM', 'FD'],
    model: 'Project',
    fields: ['Code', 'Name', 'Status', 'Manager', 'Budget Total', 'Budget Spent', '% Used'],
    numericFields: ['Budget Total', 'Budget Spent', '% Used']
  },
  {
    code: '6.02',
    category: 'Project Overview',
    name: 'Timeline / Gantt data',
    roles: ['PM', 'FS'],
    model: 'Task',
    fields: ['Project', 'Task Name', 'Start Date', 'End Date', 'Progress %', 'Status'],
    numericFields: ['Progress %']
  },
  {
    code: '6.03',
    category: 'Project Overview',
    name: 'Phase sign-off evidence',
    roles: ['PM', 'FS'],
    model: 'DailyLog',
    fields: ['Log Date', 'Project', 'Phase', 'Photos Count', 'PM Approved', 'Progress %'],
    numericFields: ['Photos Count', 'Progress %']
  },
  {
    code: '6.04',
    category: 'Project Overview',
    name: 'Extension requests',
    roles: ['PM'],
    model: 'ProjectExtensionRequest',
    fields: ['Project', 'Requested By', 'Requested End Date', 'Extension Days', 'Status'],
    numericFields: ['Extension Days']
  },
  {
    code: '6.05',
    category: 'Project Overview',
    name: 'Road specification budget',
    roles: ['PM', 'FD'],
    model: 'RoadSpecification',
    fields: ['Project', 'Road Type', 'Length (km)', 'Approved Total', 'Cost per Meter'],
    numericFields: ['Length (km)', 'Approved Total', 'Cost per Meter']
  },
  {
    code: '6.06',
    category: 'Project Overview',
    name: 'Road layer costs',
    roles: ['PM', 'FD'],
    model: 'RoadLayer',
    fields: ['Project', 'Phase', 'Material', 'Total Quantity', 'Total Cost (Low)', 'Total Cost (High)'],
    numericFields: ['Total Quantity', 'Total Cost (Low)', 'Total Cost (High)']
  },
  {
    code: '6.07',
    category: 'Project Overview',
    name: 'Road accessory costs',
    roles: ['PM', 'FD'],
    model: 'RoadAccessory',
    fields: ['Project', 'Category', 'Item', 'Total Quantity', 'Total Cost (Low)', 'Total Cost (High)'],
    numericFields: ['Total Quantity', 'Total Cost (Low)', 'Total Cost (High)']
  },
  {
    code: '6.08',
    category: 'Project Overview',
    name: 'Material price config',
    roles: ['PM', 'FD'],
    model: 'MaterialPriceConfig',
    fields: ['Material', 'Category', 'Phase', 'Base Price', 'Is Active'],
    numericFields: ['Base Price']
  },
  {
    code: '6.09',
    category: 'Project Overview',
    name: 'Whistleblower summary',
    roles: ['PM'],
    model: 'WhistleblowerReport',
    fields: ['ID', 'Category', 'Project', 'Status', 'Created At'],
    numericFields: []
  },
  {
    code: '6.10',
    category: 'Project Overview',
    name: 'Document management',
    roles: ['PM', 'CA'],
    model: 'Document',
    fields: ['Title', 'Project', 'Type', 'Status', 'Version Count', 'Created At'],
    numericFields: ['Version Count']
  },

  // SECTION 7: COMPOSITE
  {
    code: '7.01',
    category: 'Composite',
    name: 'Financial health scorecard',
    roles: ['PM', 'FD'],
    model: 'Project',
    fields: ['Project', 'Budget Total', 'Budget Spent', 'Open Reqs', 'Remaining'],
    numericFields: ['Budget Total', 'Budget Spent', 'Open Reqs', 'Remaining']
  },
  {
    code: '7.02',
    category: 'Composite',
    name: 'Equipment + cost combined',
    roles: ['PM', 'EC', 'FD'],
    model: 'Asset',
    fields: ['Asset', 'Project', 'Rental Cost', 'Maintenance Cost', 'Total Cost'],
    numericFields: ['Rental Cost', 'Maintenance Cost', 'Total Cost']
  },
  {
    code: '7.03',
    category: 'Composite',
    name: 'Material supply chain audit',
    roles: ['PM', 'FD', 'FS'],
    model: 'ContractItem',
    fields: ['Material', 'Contracted Qty', 'Received Qty', 'Consumed Qty', 'Variance'],
    numericFields: ['Contracted Qty', 'Received Qty', 'Consumed Qty', 'Variance']
  },
  {
    code: '7.04',
    category: 'Composite',
    name: 'Safety + issues combined',
    roles: ['PM', 'FS'],
    model: 'SafetyIncident',
    fields: ['Type', 'Project', 'Severity/Priority', 'Status', 'Created At'],
    numericFields: []
  },
  {
    code: '7.05',
    category: 'Composite',
    name: 'Full audit trail',
    roles: ['PM'],
    model: 'AuditLog',
    fields: ['Timestamp', 'User', 'Role', 'Action', 'Target', 'Details'],
    numericFields: []
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function dateFilter(field, dateFrom, dateTo) {
  const filter = {};
  if (dateFrom) filter.gte = new Date(dateFrom);
  if (dateTo) filter.lte = new Date(dateTo);
  return Object.keys(filter).length ? { [field]: filter } : {};
}

// ============================================
// CORE EXECUTION ENGINE
// ============================================

async function runReport(reportCode, filters = {}) {
  const reportDef = REPORT_CATALOG.find(r => r.code === reportCode);
  if (!reportDef) throw new Error(`Report ${reportCode} not found in catalog.`);

  const { projectId, dateFrom, dateTo, status } = filters;
  const result = {
    columns: reportDef.fields,
    rows: [],
    summary: {},
    chartData: { labels: [], values: [] }
  };

  // Execute report-specific logic
  const data = await REPORT_HANDLERS[reportCode](filters);
  result.rows = data.rows;
  result.summary = data.summary || {};
  
  // Prepare chart data (using first text column as labels and chartField as values)
  if (filters.chartField && result.rows.length > 0) {
    const labelField = reportDef.fields.find(f => !reportDef.numericFields.includes(f));
    result.chartData.labels = result.rows.map(r => r[labelField] || 'N/A');
    result.chartData.values = result.rows.map(r => Number(r[filters.chartField]) || 0);
  }

  return result;
}

const REPORT_HANDLERS = {
  // 1.01 Budget Overview by Project
  '1.01': async (f) => {
    const where = {};
    if (f.projectId) where.id = Number(f.projectId);
    if (f.status) where.status = f.status;

    const projects = await prisma.project.findMany({
      where,
      select: { code: true, name: true, contractValue: true, budgetTotal: true, budgetSpent: true, status: true }
    });

    const rows = projects.map(p => {
      const total = Number(p.budgetTotal) || 0;
      const spent = Number(p.budgetSpent) || 0;
      return {
        'Code': p.code,
        'Name': p.name,
        'Contract Value': Number(p.contractValue) || 0,
        'Budget Total': total,
        'Budget Spent': spent,
        'Remaining': total - spent,
        '% Utilised': total > 0 ? Math.round((spent / total) * 100) : 0,
        'Status': p.status
      };
    });

    return { 
      rows, 
      summary: { 
        'Total Projects': rows.length, 
        'Total Budget': rows.reduce((s, r) => s + r['Budget Total'], 0),
        'Total Spent': rows.reduce((s, r) => s + r['Budget Spent'], 0)
      } 
    };
  },

  // 1.02 Transaction Ledger
  '1.02': async (f) => {
    const where = { ...dateFilter('createdAt', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);

    const txs = await prisma.transaction.findMany({
      where,
      include: { project: { select: { code: true } }, creator: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const rows = txs.map(t => ({
      'Entry Code': t.entryCode,
      'Project': t.project?.code || 'N/A',
      'Description': t.description,
      'Debit': Number(t.debit) || 0,
      'Credit': Number(t.credit) || 0,
      'Net': (Number(t.debit) || 0) - (Number(t.credit) || 0),
      'Account Code': t.accountCode,
      'Created By': t.creator?.name || 'System',
      'Created At': t.createdAt.toISOString().split('T')[0]
    }));

    return { rows, summary: { 'Total Tx': rows.length, 'Sum Debit': rows.reduce((s, r) => s + r['Debit'], 0) } };
  },

  // 1.03 Requisition Spend Summary
  '1.03': async (f) => {
    const where = { ...dateFilter('createdAt', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);
    if (f.status) where.status = f.status;

    const reqs = await prisma.requisition.findMany({
      where,
      include: { project: { select: { code: true } }, submitter: { select: { name: true } } }
    });

    const rows = reqs.map(r => ({
      'Req Code': r.reqCode,
      'Project': r.project?.code,
      'Submitted By': r.submitter?.name,
      'Total Amount': Number(r.totalAmount),
      'Status': r.status,
      'Vendor Name': r.vendorName,
      'Fraud Check': r.fraudCheck ? 'YES' : 'NO'
    }));

    return { rows, summary: { 'Count': rows.length, 'Total Value': rows.reduce((s, r) => s + r['Total Amount'], 0) } };
  },

  // 1.04 Requisition Items Detail
  '1.04': async (f) => {
    const where = { requisition: { ...dateFilter('createdAt', f.dateFrom, f.dateTo) } };
    if (f.projectId) where.requisition.projectId = Number(f.projectId);
    
    const items = await prisma.requisitionItem.findMany({
      where,
      include: { requisition: { include: { project: { select: { code: true } } } } }
    });

    const rows = items.map(i => ({
      'Req Code': i.requisition.reqCode,
      'Project': i.requisition.project?.code,
      'Item Name': i.itemName,
      'Quantity': i.quantity,
      'Unit Price': Number(i.unitPrice),
      'Line Total': i.quantity * Number(i.unitPrice),
      'Status': i.requisition.status
    }));

    return { rows, summary: { 'Items': rows.length, 'Grand Total': rows.reduce((s, r) => s + r['Line Total'], 0) } };
  },

  // 1.05 Budget Change Requests
  '1.05': async (f) => {
    const where = { ...dateFilter('createdAt', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);
    if (f.status) where.status = f.status;

    const bcrs = await prisma.budgetChangeRequest.findMany({
      where,
      include: { project: { select: { code: true } } }
    });

    const rows = bcrs.map(b => {
      const diff = (Number(b.proposedAmount) || 0) - (Number(b.currentAmount) || 0);
      return {
        'BCR Code': b.bcrCode,
        'Project': b.project.code,
        'Category': b.budgetCategory,
        'Current Amount': Number(b.currentAmount) || 0,
        'Proposed Amount': Number(b.proposedAmount) || 0,
        'Difference': diff,
        'Status': b.status
      };
    });

    return { rows, summary: { 'Total BCR': rows.length, 'Net Change': rows.reduce((s, r) => s + r['Difference'], 0) } };
  },

  // 1.06 Budget Control Allocation vs Spent
  '1.06': async (f) => {
    const where = {};
    if (f.projectId) where.projectId = Number(f.projectId);
    if (f.status) where.status = f.status;

    const controls = await prisma.budgetControl.findMany({
      where,
      include: { project: { select: { code: true } } }
    });

    const rows = controls.map(c => {
      const limit = Number(c.allocatedLimit) || 0;
      const spent = Number(c.spentAmount) || 0;
      return {
        'Project': c.project.code,
        'Phase': c.phase,
        'Category': c.category,
        'Allocated Limit': limit,
        'Spent Amount': spent,
        'Remaining': limit - spent,
        '% Used': limit > 0 ? Math.round((spent / limit) * 100) : 0,
        'Status': c.status
      };
    });

    return { rows };
  },

  // 1.07 Daily Log Expenses Summary
  '1.07': async (f) => {
    const where = { dailyLog: { ...dateFilter('logDate', f.dateFrom, f.dateTo) } };
    if (f.projectId) where.dailyLog.projectId = Number(f.projectId);

    const expenses = await prisma.dailyLogExpense.findMany({
      where,
      include: { dailyLog: { include: { project: { select: { code: true } }, submitter: { select: { name: true } } } } }
    });

    const rows = expenses.map(e => ({
      'Log Date': e.dailyLog.logDate.toISOString().split('T')[0],
      'Project': e.dailyLog.project.code,
      'Category': e.category,
      'Quantity': Number(e.quantity),
      'Unit Price': Number(e.unitPrice),
      'Total Cost': Number(e.totalCost),
      'Submitted By': e.dailyLog.submitter?.name || 'N/A'
    }));

    return { rows, summary: { 'Expenses': rows.length, 'Sum Total': rows.reduce((s, r) => s + r['Total Cost'], 0) } };
  },

  // 1.08 Contract Financial Summary
  '1.08': async (f) => {
    const where = { ...dateFilter('createdAt', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);
    if (f.status) where.status = f.status;

    const contracts = await prisma.contract.findMany({
      where,
      include: { project: { select: { code: true } } }
    });

    const rows = contracts.map(c => ({
      'Ref Code': c.refCode,
      'Project': c.project?.code || 'N/A',
      'Title': c.title,
      'Vendor': c.vendorName,
      'Contract Value': Number(c.value) || 0,
      'VAT': Number(c.vatAmount) || 0,
      'WHT': Number(c.whtAmount) || 0,
      'Retention': Number(c.retentionAmount) || 0,
      'Status': c.status
    }));

    return { rows, summary: { 'Active Contracts': rows.length, 'Total Value': rows.reduce((s, r) => s + r['Contract Value'], 0) } };
  },

  // 1.09 Milestone Payment Schedule
  '1.09': async (f) => {
    const where = { ...dateFilter('dueDate', f.dateFrom, f.dateTo) };
    if (f.status) where.status = f.status;

    const milestones = await prisma.milestone.findMany({
      where,
      include: { contract: { include: { project: { select: { code: true } } } } }
    });

    const rows = milestones.map(m => ({
      'Milestone Ref': m.refCode,
      'Contract Ref': m.contract.refCode,
      'Project': m.contract.project?.code,
      'Description': m.description,
      'Due Date': m.dueDate?.toISOString().split('T')[0],
      'Value': Number(m.value) || 0,
      'Status': m.status
    }));

    return { rows, summary: { 'Milestones': rows.length, 'Total Due': rows.reduce((s, r) => s + r['Value'], 0) } };
  },

  // 1.10 Variation Orders Financial Impact
  '1.10': async (f) => {
    const where = { ...dateFilter('createdAt', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);
    if (f.status) where.status = f.status;

    const vos = await prisma.variationOrder.findMany({
      where,
      include: { project: { select: { code: true } }, requestor: { select: { name: true } } }
    });

    const rows = vos.map(v => ({
      'VO Code': v.voCode,
      'Project': v.project.code,
      'Title': v.title,
      'Net Value': Number(v.netValue) || 0,
      'Status': v.status,
      'Requested By': v.requestor?.name
    }));

    return { rows, summary: { 'Total VO': rows.length, 'Sum Value': rows.reduce((s, r) => s + r['Net Value'], 0) } };
  },

  // 1.11 Replenishment Request Cost Tracking
  '1.11': async (f) => {
    const where = { ...dateFilter('createdAt', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);
    if (f.status) where.status = f.status;

    const reqs = await prisma.replenishmentRequest.findMany({
      where,
      include: { project: { select: { code: true } }, requester: { select: { name: true } } }
    });

    const rows = reqs.map(r => ({
      'Req Code': r.reqCode,
      'Project': r.project.code,
      'Material': r.materialName,
      'Quantity': Number(r.quantityNeeded),
      'Estimated Cost': Number(r.estimatedCost) || 0,
      'Status': r.status,
      'Requested By': r.requester?.name
    }));

    return { rows, summary: { 'Count': rows.length, 'Total Est Cost': rows.reduce((s, r) => s + r['Estimated Cost'], 0) } };
  },

  // 1.12 Vendor Spend Analysis
  '1.12': async (f) => {
    const vendors = await prisma.vendor.findMany({
      include: { contracts: true }
    });

    const rows = vendors.map(v => {
      const totalValue = v.contracts.reduce((s, c) => s + (Number(c.value) || 0), 0);
      const activeCount = v.contracts.filter(c => c.status === 'active').length;
      return {
        'Vendor Name': v.name,
        'Category': v.category,
        'Risk Level': v.riskLevel,
        'Total Contract Value': totalValue,
        'Active Contracts': activeCount
      };
    });

    return { rows, summary: { 'Vendors': rows.length, 'Grand Total Spend': rows.reduce((s, r) => s + r['Total Contract Value'], 0) } };
  },

  // 1.13 Insurance Policy Expiry Report
  '1.13': async (f) => {
    const now = new Date();
    const policies = await prisma.insurancePolicy.findMany();

    const rows = policies.map(p => {
      const expiry = new Date(p.expiryDate);
      const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return {
        'Entity Name': p.entityName,
        'Policy Number': p.policyNumber,
        'Expiry Date': p.expiryDate.toISOString().split('T')[0],
        'Days to Expiry': days,
        'Status': p.status
      };
    });

    return { rows, summary: { 'Policies': rows.length, 'Expiring Soon (<30d)': rows.filter(r => r['Days to Expiry'] < 30).length } };
  },

  // 1.14 ... (kept for context)
  '1.14': async (f) => {
    // ... logic ...
  },

  // 2.01 Asset Register (Full Inventory)
  '2.01': async (f) => {
    const where = {};
    if (f.projectId) where.currentProjectId = Number(f.projectId);
    if (f.status) where.status = f.status;
    if (f.category) where.category = f.category;

    const assets = await prisma.asset.findMany({ where });
    const rows = assets.map(a => ({
      'Asset Code': a.assetCode,
      'Name': a.name,
      'Category': a.category,
      'Condition': a.condition,
      'Status': a.status,
      'Hours/KM': a.hoursOrKm || 0,
      'Estimated Value': Number(a.estimatedValue) || 0
    }));

    return { rows, summary: { 'Total Assets': rows.length, 'Total Value': rows.reduce((s, r) => s + r['Estimated Value'], 0) } };
  },

  // 2.02 Asset Utilisation Report
  '2.02': async (f) => {
    const where = { ...dateFilter('usageDate', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);

    const usage = await prisma.assetUsage.findMany({
      where,
      include: { asset: { select: { assetCode: true, name: true } }, project: { select: { code: true } }, operator: { select: { name: true } } }
    });

    const rows = usage.map(u => ({
      'Asset Code': u.asset.assetCode,
      'Asset Name': u.asset.name,
      'Project': u.project?.code || 'N/A',
      'Operator': u.operator?.name || u.operatorName || 'N/A',
      'Usage Date': u.usageDate.toISOString().split('T')[0],
      'Hours Operated': Number(u.hoursOperated) || 0,
      'Fuel Consumed': Number(u.fuelConsumed) || 0
    }));

    return { rows, summary: { 'Log Entries': rows.length, 'Total Hours': rows.reduce((s, r) => s + r['Hours Operated'], 0) } };
  },

  // 2.03 Asset Movement Log
  '2.03': async (f) => {
    const where = { ...dateFilter('timestamp', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);

    const logs = await prisma.assetLog.findMany({
      where,
      include: { asset: { select: { assetCode: true, name: true } }, project: { select: { code: true } }, user: { select: { name: true } } }
    });

    const rows = logs.map(l => ({
      'Asset Code': l.asset.assetCode,
      'Asset Name': l.asset.name,
      'Action': l.action,
      'Project': l.project?.code || 'N/A',
      'User': l.user?.name || l.dispatchedBy || 'System',
      'Fuel Level': l.fuelLevelAtAction || 0,
      'Timestamp': l.timestamp.toISOString()
    }));

    return { rows };
  },

  // 2.04 Maintenance Records Report
  '2.04': async (f) => {
    const where = { ...dateFilter('serviceDate', f.dateFrom, f.dateTo) };
    
    const records = await prisma.maintenanceRecord.findMany({
      where,
      include: { asset: { select: { assetCode: true, name: true } } }
    });

    const rows = records.map(r => ({
      'Asset Code': r.asset.assetCode,
      'Asset Name': r.asset.name,
      'Service Date': r.serviceDate.toISOString().split('T')[0],
      'Type': r.type,
      'Provider': r.provider,
      'Cost': Number(r.cost) || 0,
      'Next Service': r.nextServiceDate?.toISOString().split('T')[0] || 'N/A'
    }));

    return { rows, summary: { 'Records': rows.length, 'Total Maint Cost': rows.reduce((s, r) => s + r['Cost'], 0) } };
  },

  // 2.05 Asset Availability Dashboard
  '2.05': async (f) => {
    const where = {};
    if (f.projectId) where.currentProjectId = Number(f.projectId);
    if (f.status) where.status = f.status;

    const assets = await prisma.asset.findMany({
      where,
      include: { currentProject: { select: { code: true } } }
    });

    const rows = assets.map(a => ({
      'Asset Code': a.assetCode,
      'Name': a.name,
      'Category': a.category,
      'Status': a.status,
      'Current Project': a.currentProject?.code || 'UNASSIGNED',
      'Condition': a.condition,
      'Fuel Level': a.fuelLevel || 0
    }));

    return { rows };
  },

  // 2.06 Vehicle Rental Contract Report
  '2.06': async (f) => {
    const where = { ...dateFilter('startDate', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);
    if (f.status) where.status = f.status;

    const rentals = await prisma.vehicleRentalContract.findMany({
      where,
      include: { project: { select: { code: true } } }
    });

    const rows = rentals.map(r => ({
      'Ref Code': r.refCode,
      'Project': r.project?.code || 'N/A',
      'Machine Type': r.machineType,
      'Vendor': r.vendorName,
      'Total Value': Number(r.totalValue) || 0,
      'Start Date': r.startDate?.toISOString().split('T')[0],
      'End Date': r.endDate?.toISOString().split('T')[0],
      'Status': r.status
    }));

    return { rows, summary: { 'Rentals': rows.length, 'Sum Value': rows.reduce((s, r) => s + r['Total Value'], 0) } };
  },

  // 2.07 Vehicle Rental Shifts Log
  '2.07': async (f) => {
    const shifts = await prisma.vehicleRentalShift.findMany({
      where: { ...dateFilter('shiftDate', f.dateFrom, f.dateTo) },
      include: { 
        rentalContract: { select: { refCode: true, machineType: true } }
      }
    });

    // Fetch projects separately to avoid needing new relations in Prisma client
    const projectIds = [...new Set([...shifts.map(s => s.fromProjectId), ...shifts.map(s => s.toProjectId)].filter(Boolean))];
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, code: true }
    });
    const projectMap = projects.reduce((acc, p) => ({ ...acc, [p.id]: p.code }), {});

    const rows = shifts.map(s => ({
      'Rental Ref': s.rentalContract.refCode,
      'Machine Type': s.rentalContract.machineType,
      'Shift Date': s.shiftDate.toISOString().split('T')[0],
      'From Project': projectMap[s.fromProjectId] || 'N/A',
      'To Project': projectMap[s.toProjectId] || 'N/A',
      'Reason': s.reason
    }));

    return { rows };
  },

  // 2.08 Equipment Price Configuration Report
  '2.08': async (f) => {
    const configs = await prisma.equipmentPriceConfig.findMany({
      where: { isDeleted: false }
    });

    const rows = configs.map(c => ({
      'Machine Type': c.machineType,
      'Label': c.label,
      'Daily Rate': Number(c.dailyRate),
      'Updated At': c.updatedAt.toISOString().split('T')[0],
      'Updated By': c.updatedBy
    }));

    return { rows };
  },

  // 2.09 Fuel Consumption Trend
  '2.09': async (f) => {
    const where = { ...dateFilter('usageDate', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);

    const usage = await prisma.assetUsage.findMany({
      where: { ...where, fuelConsumed: { gt: 0 } },
      include: { asset: { select: { name: true } }, project: { select: { code: true } } }
    });

    const rows = usage.map(u => {
      const fuel = Number(u.fuelConsumed) || 0;
      const hours = Number(u.hoursOperated) || 1;
      return {
        'Asset': u.asset.name,
        'Project': u.project?.code || 'N/A',
        'Usage Date': u.usageDate.toISOString().split('T')[0],
        'Fuel Consumed': fuel,
        'Hours Operated': hours,
        'Efficiency': Math.round((fuel / hours) * 100) / 100 // Liters per hour
      };
    });

    return { rows };
  },

  // 2.10 Assets Requiring Maintenance Soon
  '2.10': async (f) => {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + 14); // 2 weeks

    const where = {
        OR: [
          { condition: { in: ['Fair', 'Poor'] } },
          { lastMaintenanceAt: { lte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } // Over 90 days
        ]
    };
    if (f.projectId) where.currentProjectId = Number(f.projectId);
    if (f.status) where.status = f.status;

    const assets = await prisma.asset.findMany({
      where
    });

    const rows = assets.map(a => ({
      'Asset Code': a.assetCode,
      'Name': a.name,
      'Category': a.category,
      'Last Maintenance': a.lastMaintenanceAt?.toISOString().split('T')[0] || 'NEVER',
      'Hours/KM': a.hoursOrKm || 0,
      'Condition': a.condition,
      'Status': a.status
    }));

    return { rows };
  },

  // 3.01 Daily Log Summary
  '3.01': async (f) => {
    const where = { ...dateFilter('logDate', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);
    if (f.status) where.status = f.status;

    const logs = await prisma.dailyLog.findMany({
      where,
      include: { project: { select: { code: true } }, submitter: { select: { name: true } } }
    });

    const rows = logs.map(l => ({
      'Log Date': l.logDate.toISOString().split('T')[0],
      'Project': l.project.code,
      'Submitted By': l.submitter?.name || 'N/A',
      'Headcount': l.headcount || 0,
      'Weather': l.weather,
      'Progress %': l.workProgress || 0,
      'Status': l.status
    }));

    return { rows, summary: { 'Total Logs': rows.length, 'Avg Headcount': Math.round(rows.reduce((s, r) => s + r['Headcount'], 0) / (rows.length || 1)) } };
  },

  // 3.02 SOS / Emergency Logs
  '3.02': async (f) => {
    const where = { isSos: true, ...dateFilter('logDate', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);

    const logs = await prisma.dailyLog.findMany({
      where,
      include: { project: { select: { code: true } }, submitter: { select: { name: true } } }
    });

    const rows = logs.map(l => ({
      'Log Date': l.logDate.toISOString().split('T')[0],
      'Project': l.project.code,
      'Submitted By': l.submitter?.name,
      'Narrative': l.narrative,
      'Status': l.status,
      'Location Verified': l.locationVerified ? 'YES' : 'NO'
    }));

    return { rows };
  },

  // 3.03 Location Verification Report
  '3.03': async (f) => {
    const where = { ...dateFilter('logDate', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);

    const logs = await prisma.dailyLog.findMany({
      where,
      include: { project: { select: { code: true } }, submitter: { select: { name: true } } }
    });

    const rows = logs.map(l => ({
      'Log Date': l.logDate.toISOString().split('T')[0],
      'Project': l.project.code,
      'Submitted By': l.submitter?.name,
      'Accuracy': l.submissionAccuracy || 0,
      'Verified': l.locationVerified ? 'YES' : 'NO',
      'Flagged': l.locationFlagged ? 'YES' : 'NO',
      'Device': l.deviceType || 'Unknown'
    }));

    return { rows, summary: { 'Total Submissions': rows.length, 'Flagged Count': rows.filter(r => r['Flagged'] === 'YES').length } };
  },

  // 3.04 Work Progress by Phase
  '3.04': async (f) => {
    const where = { ...dateFilter('logDate', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);

    const logs = await prisma.dailyLog.findMany({
      where,
      include: { project: { select: { code: true } }, submitter: { select: { name: true } } }
    });

    const rows = logs.map(l => ({
      'Log Date': l.logDate.toISOString().split('T')[0],
      'Project': l.project.code,
      'Phase': l.activePhase,
      'Task': l.activeTask,
      'Progress %': l.workProgress || 0,
      'Submitted By': l.submitter?.name
    }));

    return { rows };
  },

  // 3.05 Task Progress Report
  '3.05': async (f) => {
    const where = {};
    if (f.projectId) where.projectId = Number(f.projectId);
    if (f.status) where.statusClass = f.status;

    const tasks = await prisma.task.findMany({
      where,
      include: { project: { select: { code: true } } }
    });

    const rows = tasks.map(t => ({
      'Task Name': t.name,
      'Project': t.project.code,
      'Phase': t.phaseNumber || 0,
      'Start Date': t.startDate.toISOString().split('T')[0],
      'End Date': t.endDate.toISOString().split('T')[0],
      'Progress %': t.progress || 0,
      'Status': t.statusClass || 'In Progress'
    }));

    return { rows, summary: { 'Total Tasks': rows.length, 'Avg Progress': Math.round(rows.reduce((s, r) => s + r['Progress %'], 0) / (rows.length || 1)) } };
  },

  // 3.06 Safety Incident Report
  '3.06': async (f) => {
    const where = { ...dateFilter('createdAt', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);

    const incidents = await prisma.safetyIncident.findMany({
      where,
      include: { project: { select: { code: true } }, reporter: { select: { name: true } } }
    });

    const rows = incidents.map(i => ({
      'Project': i.project?.code || 'N/A',
      'Reported By': i.reporter?.name || 'Anonymous',
      'Severity': i.severity,
      'Type': i.type,
      'Status': i.status,
      'Created At': i.createdAt.toISOString()
    }));

    return { rows, summary: { 'Total Incidents': rows.length, 'Open': rows.filter(r => r.Status === 'open').length } };
  },

  // 3.07 Safety Incident Response Log
  '3.07': async (f) => {
    const replies = await prisma.safetyIncidentReply.findMany({
      include: { incident: { include: { project: { select: { code: true } } } }, user: { select: { name: true } } }
    });

    const rows = replies.map(r => ({
      'Incident ID': r.incidentId,
      'Project': r.incident.project?.code || 'N/A',
      'Replied By': r.user.name,
      'Message': r.message.substring(0, 50) + '...',
      'Created At': r.createdAt.toISOString()
    }));

    return { rows };
  },

  // 3.08 Material usage log
  '3.08': async (f) => {
    const where = { ...dateFilter('logDate', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);

    const usage = await prisma.materialUsage.findMany({
      where,
      include: { project: { select: { code: true } }, sector: { select: { name: true } }, reportedBy: { select: { name: true } } }
    });

    const rows = usage.map(u => ({
      'Project': u.project.code,
      'Sector': u.sector.name,
      'Material': u.materialName,
      'Quantity': Number(u.quantity),
      'Unit': u.unit,
      'Log Date': u.logDate.toISOString().split('T')[0],
      'Reported By': u.reportedBy?.name || 'N/A'
    }));

    return { rows };
  },

  // 3.09 Inventory stock levels
  '3.09': async (f) => {
    const where = {};
    if (f.projectId) where.sector = { projectId: Number(f.projectId) };

    const invs = await prisma.inventory.findMany({
      where,
      include: { sector: { select: { name: true } } }
    });

    const rows = invs.map(i => ({
      'Sector': i.sector.name,
      'Material': i.materialName,
      'Unit': i.unit,
      'Quantity On Hand': Number(i.quantityOnHand),
      'Low Threshold': Number(i.lowThreshold),
      'Min Threshold': Number(i.minThreshold)
    }));

    return { rows, summary: { 'Items': rows.length, 'Below Low': rows.filter(r => r['Quantity On Hand'] < r['Low Threshold']).length } };
  },

  // 3.10 Inventory movement log
  '3.10': async (f) => {
    const where = { ...dateFilter('timestamp', f.dateFrom, f.dateTo) };
    
    const logs = await prisma.inventoryLog.findMany({
      where,
      include: { inventory: { include: { sector: { select: { name: true } } } } }
    });

    const rows = logs.map(l => ({
      'Sector': l.inventory.sector.name,
      'Material': l.inventory.materialName,
      'Type': l.type,
      'Quantity': Number(l.quantity),
      'Reference': l.reference,
      'Timestamp': l.timestamp.toISOString()
    }));

    return { rows };
  },

  // 3.11 Sector activity report
  '3.11': async (f) => {
    const where = {};
    if (f.projectId) where.projectId = Number(f.projectId);

    const sectors = await prisma.sector.findMany({
      where,
      include: { project: { select: { code: true } } }
    });

    const rows = sectors.map(s => ({
      'Sector Name': s.name,
      'Project': s.project.code,
      'Start Date': s.startDate?.toISOString().split('T')[0] || 'N/A',
      'End Date': s.endDate?.toISOString().split('T')[0] || 'N/A',
      'Status': s.status
    }));

    return { rows };
  },

  // 3.12 ... (kept for context)
  '3.12': async (f) => {
    // ... logic ...
  },

  // 4.01 Contract register
  '4.01': async (f) => {
    const where = { ...dateFilter('createdAt', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);
    if (f.status) where.status = f.status;

    const contracts = await prisma.contract.findMany({
      where,
      include: { project: { select: { code: true } } }
    });

    const rows = contracts.map(c => ({
      'Ref Code': c.refCode,
      'Project': c.project?.code || 'N/A',
      'Title': c.title,
      'Vendor': c.vendorName,
      'Value': Number(c.value) || 0,
      'Status': c.status,
      'Start Date': c.startDate?.toISOString().split('T')[0],
      'End Date': c.endDate?.toISOString().split('T')[0]
    }));

    return { rows, summary: { 'Total Contracts': rows.length, 'Total Value': rows.reduce((s, r) => s + r['Value'], 0) } };
  },

  // 4.02 Contract version history
  '4.02': async (f) => {
    const where = { ...dateFilter('createdAt', f.dateFrom, f.dateTo) };
    if (f.status) where.status = f.status;

    const versions = await prisma.contractVersion.findMany({
      where,
      include: { contract: { select: { refCode: true } }, creator: { select: { name: true } } }
    });

    const rows = versions.map(v => ({
      'Contract Ref': v.contract.refCode,
      'Version': v.version,
      'Title': v.title,
      'Value': Number(v.value) || 0,
      'Status': v.status,
      'Created By': v.creator?.name || 'System',
      'Created At': v.createdAt.toISOString()
    }));

    return { rows };
  },

  // 4.03 Contract items (BOQ)
  '4.03': async (f) => {
    const items = await prisma.contractItem.findMany({
      include: { contract: { select: { refCode: true } } }
    });

    const rows = items.map(i => ({
      'Contract Ref': i.contract.refCode,
      'Material': i.materialName,
      'Quantity': Number(i.quantity),
      'Unit': i.unit,
      'Unit Price': Number(i.unitPrice),
      'Total Cost': Number(i.totalCost),
      'Received Qty': Number(i.receivedQuantity) || 0
    }));

    return { rows, summary: { 'Line Items': rows.length, 'Grand Total': rows.reduce((s, r) => s + r['Total Cost'], 0) } };
  },

  // 4.04 Vendor performance
  '4.04': async (f) => {
    const vendors = await prisma.vendor.findMany({
      include: { contracts: true }
    });

    const rows = vendors.map(v => {
      const total = v.contracts.reduce((s, c) => s + (Number(c.value) || 0), 0);
      return {
        'Vendor Name': v.name,
        'Category': v.category,
        'Risk Level': v.riskLevel,
        'Rating': v.performanceRating || 0,
        'Total Value': total,
        'Active Contracts': v.contracts.filter(c => c.status === 'active').length
      };
    });

    return { rows };
  },

  // 4.05 Procurement status
  '4.05': async (f) => {
    const where = { ...dateFilter('createdAt', f.dateFrom, f.dateTo) };
    if (f.status) where.status = f.status;

    const reqs = await prisma.procurementRequest.findMany({ where });

    const rows = reqs.map(r => ({
      'Req Code': r.reqCode,
      'Vehicle Name': r.vehicleName,
      'Estimated Cost': Number(r.estimatedCost) || 0,
      'Priority': r.priority,
      'Status': r.status,
      'Created At': r.createdAt.toISOString().split('T')[0]
    }));

    return { rows };
  },

  // 4.06 Replenishment pipeline
  '4.06': async (f) => {
    const where = { ...dateFilter('createdAt', f.dateFrom, f.dateTo) };
    if (f.projectId) where.projectId = Number(f.projectId);
    if (f.status) where.status = f.status;

    const reqs = await prisma.replenishmentRequest.findMany({
      where,
      include: { project: { select: { code: true } } }
    });

    const rows = reqs.map(r => ({
      'Req Code': r.reqCode,
      'Project': r.project.code,
      'Material': r.materialName,
      'Quantity': Number(r.quantityNeeded),
      'Estimated Cost': Number(r.estimatedCost) || 0,
      'Status': r.status,
      'Created At': r.createdAt.toISOString().split('T')[0]
    }));

    return { rows };
  },

  // 5.01 User directory
  '5.01': async (f) => {
    const where = {};
    if (f.role) where.role = f.role;
    if (f.status) where.status = f.status;

    const users = await prisma.user.findMany({ where });

    const rows = users.map(u => ({
      'Name': u.name,
      'Email': u.email,
      'Role': u.role,
      'Status': u.status || 'Active',
      'Created At': u.createdAt.toISOString().split('T')[0]
    }));

    return { rows, summary: { 'Total Users': rows.length } };
  },

  // 5.02 Audit log
  '5.02': async (f) => {
    const where = { ...dateFilter('createdAt', f.dateFrom, f.dateTo) };
    if (f.userId) where.userId = Number(f.userId);

    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500
    });

    const rows = logs.map(l => ({
      'Timestamp': l.createdAt.toISOString(),
      'User': l.userName || l.user?.name || 'System',
      'Role': l.userRole || l.user?.role || 'N/A',
      'Action': l.action,
      'Target': l.targetType,
      'Severity': l.severity || 'INFO'
    }));

    return { rows };
  },

  // 5.03 Supervisor assignments
  '5.03': async (f) => {
    const projects = await prisma.project.findMany({
      include: { supervisor: { select: { name: true } } }
    });

    const rows = projects.map(p => ({
      'Project Code': p.code,
      'Project Name': p.name,
      'Supervisor': p.supervisor?.name || 'UNASSIGNED',
      'Status': p.status
    }));

    return { rows };
  },

  // 5.04 PM portfolio
  '5.04': async (f) => {
    const pms = await prisma.user.findMany({
      where: { role: 'Project_Manager' },
      include: { projects: true }
    });

    const rows = pms.map(u => {
      const totalBudget = u.projects.reduce((s, p) => s + (Number(p.budgetTotal) || 0), 0);
      const totalSpent = u.projects.reduce((s, p) => s + (Number(p.budgetSpent) || 0), 0);
      return {
        'Manager': u.name,
        'Total Projects': u.projects.length,
        'Budget Total': totalBudget,
        'Budget Spent': totalSpent,
        '% Utilisation': totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
      };
    });

    return { rows };
  },

  // 5.05 Notification activity
  '5.05': async (f) => {
    const where = { ...dateFilter('createdAt', f.dateFrom, f.dateTo) };
    
    const notifications = await prisma.notification.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    const rows = notifications.map(n => ({
      'User': n.user.name,
      'Type': n.type,
      'Title': n.title,
      'Is Read': n.isRead ? 'YES' : 'NO',
      'Created At': n.createdAt.toISOString()
    }));

    return { rows };
  },

  // 5.06 ... (kept for context)
  '5.06': async (f) => {
    // ... logic ...
  },

  // 6.01 Project status dashboard
  '6.01': async (f) => {
    const where = {};
    if (f.status) where.status = f.status;

    const projects = await prisma.project.findMany({
      where,
      include: { manager: { select: { name: true } } }
    });

    const rows = projects.map(p => {
      const total = Number(p.budgetTotal) || 0;
      const spent = Number(p.budgetSpent) || 0;
      return {
        'Code': p.code,
        'Name': p.name,
        'Status': p.status,
        'Manager': p.manager?.name || 'N/A',
        'Budget Total': total,
        'Budget Spent': spent,
        '% Used': total > 0 ? Math.round((spent / total) * 100) : 0
      };
    });

    return { rows };
  },

  // 6.02 Timeline / Gantt data
  '6.02': async (f) => {
    const where = {};
    if (f.projectId) where.projectId = Number(f.projectId);

    const tasks = await prisma.task.findMany({
      where,
      include: { project: { select: { code: true } } }
    });

    const rows = tasks.map(t => ({
      'Project': t.project.code,
      'Task Name': t.name,
      'Start Date': t.startDate.toISOString().split('T')[0],
      'End Date': t.endDate.toISOString().split('T')[0],
      'Progress %': t.progress || 0,
      'Status': t.statusClass || 'In Progress'
    }));

    return { rows };
  },

  // 6.03 Phase sign-off evidence
  '6.03': async (f) => {
    const where = { workProgress: { gt: 0 } };
    if (f.projectId) where.projectId = Number(f.projectId);

    const logs = await prisma.dailyLog.findMany({
      where,
      include: { project: { select: { code: true } } }
    });

    const rows = logs.map(l => ({
      'Log Date': l.logDate.toISOString().split('T')[0],
      'Project': l.project.code,
      'Phase': l.activePhase,
      'Photos Count': (l.sitePhotos || []).length,
      'PM Approved': l.status === 'approved' ? 'YES' : 'NO',
      'Progress %': l.workProgress
    }));

    return { rows };
  },

  // 6.04 Extension requests
  '6.04': async (f) => {
    const requests = await prisma.projectExtensionRequest.findMany({
      include: { project: { select: { code: true } }, requester: { select: { name: true } } }
    });

    const rows = requests.map(r => ({
      'Project': r.project.code,
      'Requested By': r.requester.name,
      'Requested End Date': r.requestedEndDate.toISOString().split('T')[0],
      'Extension Days': r.extensionDays,
      'Status': r.status
    }));

    return { rows };
  },

  // 6.05 Road specification budget
  '6.05': async (f) => {
    const specs = await prisma.roadSpecification.findMany({
      include: { project: { select: { code: true } } }
    });

    const rows = specs.map(s => ({
      'Project': s.project.code,
      'Road Type': s.roadType,
      'Length (km)': Number(s.lengthKm),
      'Approved Total': Number(s.approvedTotal),
      'Cost per Meter': Number(s.costPerMeter)
    }));

    return { rows };
  },

  // 6.06 Road layer costs
  '6.06': async (f) => {
    const layers = await prisma.roadLayer.findMany({
      include: { specification: { include: { project: { select: { code: true } } } } }
    });

    const rows = layers.map(l => ({
      'Project': l.specification.project.code,
      'Phase': `Phase ${l.specificationId}`,
      'Material': l.materialName,
      'Total Quantity': Number(l.totalQuantity),
      'Total Cost (Low)': Number(l.totalCostLow),
      'Total Cost (High)': Number(l.totalCostHigh)
    }));

    return { rows };
  },

  // 6.07 Road accessory costs
  '6.07': async (f) => {
    const accessories = await prisma.roadAccessory.findMany({
      include: { specification: { include: { project: { select: { code: true } } } } }
    });

    const rows = accessories.map(a => ({
      'Project': a.specification.project.code,
      'Category': a.category,
      'Item': a.itemName,
      'Total Quantity': Number(a.totalQuantity),
      'Total Cost (Low)': Number(a.totalCostLow),
      'Total Cost (High)': Number(a.totalCostHigh)
    }));

    return { rows };
  },

  // 6.08 Material price config
  '6.08': async (f) => {
    const configs = await prisma.materialPriceConfig.findMany();

    const rows = configs.map(c => ({
      'Material': c.materialName,
      'Category': c.category,
      'Phase': c.phase,
      'Base Price': Number(c.basePrice),
      'Is Active': c.isActive ? 'YES' : 'NO'
    }));

    return { rows };
  },

  // 6.09 Whistleblower summary
  '6.09': async (f) => {
    const reports = await prisma.whistleblowerReport.findMany({
      include: { project: { select: { code: true } } }
    });

    const rows = reports.map(r => ({
      'ID': r.id,
      'Category': r.category,
      'Project': r.project?.code || 'N/A',
      'Status': r.status,
      'Created At': r.createdAt.toISOString()
    }));

    return { rows };
  },

  // 6.10 Document management
  '6.10': async (f) => {
    const docs = await prisma.document.findMany({
      include: { project: { select: { code: true } }, _count: { select: { versions: true } } }
    });

    const rows = docs.map(d => ({
      'Title': d.title,
      'Project': d.project?.code || 'N/A',
      'Type': d.type,
      'Status': d.status,
      'Version Count': d._count.versions,
      'Created At': d.createdAt.toISOString()
    }));

    return { rows };
  },

  // 7.01 Financial health scorecard
  '7.01': async (f) => {
    const projects = await prisma.project.findMany({
      include: { requisitions: { where: { status: 'pending' } } }
    });

    const rows = projects.map(p => {
      const total = Number(p.budgetTotal) || 0;
      const spent = Number(p.budgetSpent) || 0;
      return {
        'Project': p.code,
        'Budget Total': total,
        'Budget Spent': spent,
        'Open Reqs': p.requisitions.length,
        'Remaining': total - spent
      };
    });

    return { rows };
  },

  // 7.02 Equipment + cost combined
  '7.02': async (f) => {
    const whereAsset = {};
    if (f.projectId) whereAsset.currentProjectId = Number(f.projectId);
    if (f.status) whereAsset.status = f.status;

    const assets = await prisma.asset.findMany({
      where: whereAsset,
      include: { 
        maintenanceRecords: { where: { ...dateFilter('serviceDate', f.dateFrom, f.dateTo) } },
        currentProject: { select: { code: true } }
      }
    });

    const whereRental = { ...dateFilter('startDate', f.dateFrom, f.dateTo) };
    if (f.projectId) whereRental.projectId = Number(f.projectId);
    if (f.status) whereRental.status = f.status;

    const rentals = await prisma.vehicleRentalContract.findMany({
      where: whereRental,
      include: { project: { select: { code: true } } }
    });

    const rows = [
      ...assets.map(a => {
        const maint = a.maintenanceRecords.reduce((s, r) => s + (Number(r.cost) || 0), 0);
        return {
          'Asset': a.name,
          'Type': 'OWNED',
          'Project': a.currentProject?.code || 'N/A',
          'Rental Cost': 0,
          'Maintenance Cost': maint,
          'Total Cost': maint
        };
      }),
      ...rentals.map(r => ({
        'Asset': r.machineType + ' (' + r.vendorName + ')',
        'Type': 'RENTED',
        'Project': r.project?.code || 'N/A',
        'Rental Cost': Number(r.totalValue) || 0,
        'Maintenance Cost': 0,
        'Total Cost': Number(r.totalValue) || 0
      }))
    ];

    return { rows };
  },

  // 7.03 Material supply chain audit
  '7.03': async (f) => {
    const items = await prisma.contractItem.findMany({
      include: { 
        contract: { include: { project: { select: { code: true } } } }
      }
    });

    // This is a simplified audit
    const rows = items.map(i => {
      const contracted = Number(i.quantity);
      const received = Number(i.receivedQuantity) || 0;
      return {
        'Material': i.materialName,
        'Contracted Qty': contracted,
        'Received Qty': received,
        'Consumed Qty': 'TBD', // Would need aggregation from MaterialUsage
        'Variance': contracted - received
      };
    });

    return { rows };
  },

  // 7.04 Safety + issues combined
  '7.04': async (f) => {
    const whereIncident = { ...dateFilter('createdAt', f.dateFrom, f.dateTo) };
    if (f.projectId) whereIncident.projectId = Number(f.projectId);
    if (f.status) whereIncident.status = f.status;

    const whereIssue = { ...dateFilter('createdAt', f.dateFrom, f.dateTo) };
    if (f.projectId) whereIssue.projectId = Number(f.projectId);
    if (f.status) whereIssue.status = f.status;

    const incidents = await prisma.safetyIncident.findMany({ 
      where: whereIncident,
      include: { project: { select: { code: true } } } 
    });
    const issues = await prisma.issue.findMany({ 
      where: whereIssue,
      include: { project: { select: { code: true } } } 
    });

    const rows = [
      ...incidents.map(i => ({ 'Type': 'SAFETY', 'Project': i.project?.code, 'Severity/Priority': i.severity, 'Status': i.status, 'Created At': i.createdAt.toISOString() })),
      ...issues.map(i => ({ 'Type': 'ISSUE', 'Project': i.project?.code, 'Severity/Priority': i.priority, 'Status': i.status, 'Created At': i.createdAt.toISOString() }))
    ];

    return { rows };
  },

  // 7.05 Full audit trail
  '7.05': async (f) => {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 1000
    });

    const rows = logs.map(l => ({
      'Timestamp': l.createdAt.toISOString(),
      'User': l.userName || l.user?.name || 'System',
      'Role': l.userRole || l.user?.role || 'N/A',
      'Action': l.action,
      'Target': l.targetType,
      'Details': JSON.stringify(l.details || {})
    }));

    return { rows };
  },
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  REPORT_CATALOG,
  dateFilter,
  runReport
};

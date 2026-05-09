const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const auditService = require('./audit.service');

async function create(data) {
  const isAnon = data.isAnonymous !== false;
  
  const reportData = {
    category: data.category,
    projectArea: data.projectArea,
    narrative: data.narrative,
    isAnonymous: isAnon,
    reporterId: isAnon ? null : data.reporterId,
  };

  const report = await prisma.whistleblowerReport.create({ data: reportData });
  
  // Note: We only log audit to the user if they were not anonymous
  if (!isAnon && data.reporterId) {
    await auditService.log({
      userId: data.reporterId,
      action: 'CREATE_WHISTLEBLOWER_REPORT',
      targetType: 'WhistleblowerReport',
      targetId: report.id,
      details: { category: data.category }
    });
  }

  return report;
}

async function getAll(options = {}) {
  const { status, category } = options;
  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;

  return prisma.whistleblowerReport.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

async function updateStatus(id, status, approverId) {
  const report = await prisma.whistleblowerReport.update({
    where: { id: Number(id) },
    data: { status },
  });
  
  if (approverId) {
    await auditService.log({
      userId: approverId,
      action: 'UPDATE_WHISTLEBLOWER_STATUS',
      targetType: 'WhistleblowerReport',
      targetId: report.id,
      details: { newStatus: status }
    });
  }
  
  return report;
}

module.exports = {
  create,
  getAll,
  updateStatus,
};

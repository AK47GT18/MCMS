const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const auditService = require('./audit.service');

async function create(data) {
  const incident = await prisma.safetyIncident.create({ data });
  await auditService.log(data.reporterId, 'CREATE_SAFETY_INCIDENT', 'SafetyIncident', incident.id, { type: incident.type });
  return incident;
}

async function getAll(options = {}) {
  const { projectId, status } = options;
  const where = {};
  if (projectId) where.projectId = Number(projectId);
  if (status) where.status = status;

  return prisma.safetyIncident.findMany({
    where,
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function updateStatus(id, status, approverId) {
  const incident = await prisma.safetyIncident.update({
    where: { id: Number(id) },
    data: { status },
  });
  
  if (approverId) {
    await auditService.log(approverId, 'UPDATE_SAFETY_STATUS', 'SafetyIncident', incident.id, { newStatus: status });
  }
  
  return incident;
}

module.exports = {
  create,
  getAll,
  updateStatus,
};

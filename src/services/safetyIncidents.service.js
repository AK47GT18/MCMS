const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const auditService = require('./audit.service');

async function create(data) {
  const incident = await prisma.safetyIncident.create({ data });
  await auditService.log({
    userId: data.reporterId,
    action: 'CREATE_SAFETY_INCIDENT',
    targetType: 'SafetyIncident',
    targetId: incident.id,
    details: { type: incident.type }
  });
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
      replies: {
        include: {
          user: { select: { id: true, name: true, role: true } }
        },
        orderBy: { createdAt: 'asc' }
      }
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
    await auditService.log({
      userId: approverId,
      action: 'UPDATE_SAFETY_STATUS',
      targetType: 'SafetyIncident',
      targetId: incident.id,
      details: { newStatus: status }
    });
  }
  
  return incident;
}

async function addReply(incidentId, userId, content, media = []) {
  return prisma.safetyIncidentReply.create({
    data: {
      incidentId: Number(incidentId),
      userId: Number(userId),
      content,
      media: media || [],
    },
    include: {
      user: { select: { id: true, name: true, role: true } }
    }
  });
}

module.exports = {
  create,
  getAll,
  updateStatus,
  addReply,
};

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const auditService = require('./audit.service');

async function create(data) {
  const req = await prisma.budgetChangeRequest.create({ data });
  await auditService.log(data.requesterId, 'CREATE_BUDGET_UPLIFT', 'BudgetChangeRequest', req.id, { projectId: data.projectId, amount: Number(data.amount) });
  
  // Notice PM and System
  const notificationService = require('./notification.service');
  notificationService.notifyRole('Managing_Director', {
    type: 'warning',
    title: 'Budget Uplift Requested',
    message: `A budget change request of MWK ${Number(data.amount).toLocaleString()} has been submitted for Project #${data.projectId}.`,
  }).catch(e => console.error('Notification failed', e));

  return req;
}

async function getAll(options = {}) {
  const { projectId, status } = options;
  const where = {};
  if (projectId) where.projectId = Number(projectId);
  if (status) where.status = status;

  return prisma.budgetChangeRequest.findMany({
    where,
    include: {
      requester: { select: { id: true, name: true, email: true } },
      approver: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true, budgetTotal: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function approve(id, approverId) {
  const req = await prisma.budgetChangeRequest.findUnique({ where: { id: Number(id) }});
  if (!req) throw new AppError('Request not found', 404);
  if (req.status !== 'Pending') throw new AppError('Request is not pending', 400);

  // Use a transaction to approve request and increment project budget
  const result = await prisma.$transaction(async (tx) => {
    const updatedReq = await tx.budgetChangeRequest.update({
      where: { id: Number(id) },
      data: { status: 'Approved', approvedById: approverId },
    });

    const project = await tx.project.findUnique({ where: { id: req.projectId }});
    await tx.project.update({
      where: { id: req.projectId },
      data: { budgetTotal: project.budgetTotal + req.amount },
    });

    return updatedReq;
  });

  await auditService.log(approverId, 'APPROVE_BUDGET_UPLIFT', 'BudgetChangeRequest', id, { amount: Number(req.amount) });
  return result;
}

async function reject(id, approverId) {
  const req = await prisma.budgetChangeRequest.update({
    where: { id: Number(id) },
    data: { status: 'Rejected', approvedById: approverId },
  });
  
  await auditService.log(approverId, 'REJECT_BUDGET_UPLIFT', 'BudgetChangeRequest', id);
  return req;
}

module.exports = {
  create,
  getAll,
  approve,
  reject,
};

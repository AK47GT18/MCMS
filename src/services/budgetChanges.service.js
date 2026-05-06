const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const auditService = require('./audit.service');
const notifService = require('./notification.service');

async function create(data) {
  const req = await prisma.budgetChangeRequest.create({ 
    data,
    include: { requester: true }
  });
  
  // Audit Log
  await auditService.log({
    userId: data.requesterId, userName: req.requester?.name, userRole: req.requester?.role,
    action: 'CREATE_BUDGET_UPLIFT', targetType: 'BudgetChangeRequest', targetId: req.id,
    details: { projectId: data.projectId, amount: Number(data.amount) }
  });
  
  // Notice PM and System
  await notifService.notifyRole('Managing_Director', {
    type: 'warning', icon: 'fa-money-bill-wave',
    title: 'Budget Uplift Requested',
    message: `A budget change request of MWK ${Number(data.amount).toLocaleString()} has been submitted for Project #${data.projectId}.`,
  });

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
      project: { select: { id: true, name: true, budgetTotal: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function approve(id, approverId) {
  const req = await prisma.budgetChangeRequest.findUnique({ 
    where: { id: Number(id) },
    include: { requester: true, project: true }
  });
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

    // If this uplift was triggered by a specific contract, activate it
    if (req.targetContractId) {
      const contract = await tx.contract.findUnique({ where: { id: req.targetContractId } });
      if (contract) {
        await tx.contract.update({
          where: { id: req.targetContractId },
          data: { status: 'active' }
        });
        
        // Now deduct the contract value from the newly increased budget
        await tx.project.update({
          where: { id: req.projectId },
          data: { budgetSpent: { increment: contract.value } }
        });
      }
    }

    return updatedReq;
  });

  // Notify Requester
  await notifService.create({
    userId: req.requesterId,
    type: 'success', icon: 'fa-check-circle',
    title: 'Budget Uplift Approved',
    message: `Your budget uplift request for ${req.project?.name || '#' + req.projectId} has been approved.`
  });

  // Audit Log
  const user = await prisma.user.findUnique({ where: { id: approverId } });
  await auditService.log({
    userId: approverId, userName: user?.name, userRole: user?.role,
    action: 'APPROVE_BUDGET_UPLIFT', targetType: 'BudgetChangeRequest', targetId: id,
    details: { amount: Number(req.amount) }
  });

  return result;
}

async function reject(id, approverId) {
  const req = await prisma.budgetChangeRequest.update({
    where: { id: Number(id) },
    data: { status: 'Rejected', approvedById: approverId },
    include: { requester: true, project: true }
  });
  
  // Notify Requester
  await notifService.create({
    userId: req.requesterId,
    type: 'error', icon: 'fa-times-circle',
    title: 'Budget Uplift Rejected',
    message: `Your budget uplift request for ${req.project?.name || '#' + req.projectId} was rejected.`
  });

  // Audit Log
  const user = await prisma.user.findUnique({ where: { id: approverId } });
  await auditService.log({
    userId: approverId, userName: user?.name, userRole: user?.role,
    action: 'REJECT_BUDGET_UPLIFT', targetType: 'BudgetChangeRequest', targetId: id
  });

  return req;
}

module.exports = {
  create,
  getAll,
  approve,
  reject,
};

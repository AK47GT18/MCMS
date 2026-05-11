const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const auditService = require('./audit.service');
const notifService = require('./notification.service');
const logger = require('../utils/logger');

async function create(data) {
  // Generate BCR code if missing (Schema requires it)
  if (!data.bcrCode) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    data.bcrCode = `BCR-${date}-${random}`;
  }

  const req = await prisma.budgetChangeRequest.create({ 
    data,
    include: { requester: true, project: true }
  });
  
  // Audit Log
  await auditService.log({
    userId: data.requestedBy, userName: req.requester?.name, userRole: req.requester?.role,
    action: 'CREATE_BUDGET_UPLIFT', targetType: 'BudgetChangeRequest', targetId: req.id,
    details: { projectId: data.projectId, projectName: req.project?.name, amount: Number(data.amount) }
  });
  
  // Notify Managing Director (approver)
  await notifService.notifyRole('Managing_Director', {
    type: 'warning', icon: 'fa-money-bill-wave',
    title: 'Budget Uplift Requested',
    message: `A budget change request of MWK ${Number(data.amount).toLocaleString()} has been submitted for ${req.project?.name || 'Project #' + data.projectId}.`,
    link: `/dashboard.html?page=reviews&tab=uplifts`
  });

  // Also notify the specific Project Manager
  if (req.project?.managerId) {
    await notifService.create({
        userId: req.project.managerId,
        type: 'warning', icon: 'fa-money-bill-wave',
        title: 'Budget Uplift Triggered',
        message: `Your project ${req.project.name} has triggered an auto-uplift request of MWK ${Number(data.amount).toLocaleString()} due to site shortages.`,
        link: `/dashboard.html?page=reviews&tab=uplifts`
    });
  }

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

  const oldBudget = Number(req.project?.budgetTotal || 0);
  const upliftAmount = Number(req.amount || 0);
  const newBudget = oldBudget + upliftAmount;

  // Use a transaction to approve request and increment project budget
  const result = await prisma.$transaction(async (tx) => {
    const updatedReq = await tx.budgetChangeRequest.update({
      where: { id: Number(id) },
      data: { 
        status: 'Approved', 
        pmApproved: true, 
        pmApprovedAt: new Date() 
      },
    });

    await tx.project.update({
      where: { id: req.projectId },
      data: { budgetTotal: { increment: upliftAmount } },
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

  // --- NOTIFICATIONS: Notify all project stakeholders ---
  const approver = await prisma.user.findUnique({ where: { id: approverId }, select: { id: true, name: true, role: true } });
  const formatter = new Intl.NumberFormat('en-MW', { style: 'decimal', minimumFractionDigits: 0 });
  const notifPayload = {
    type: 'success', icon: 'fa-check-circle',
    title: 'Budget Uplift Approved',
    message: `Budget uplift of MWK ${formatter.format(upliftAmount)} approved for ${req.project?.name || 'Project'}. New budget: MWK ${formatter.format(newBudget)}.`,
    link: `/dashboard.html?page=budget`
  };

  // 1. Notify the original requester (FD)
  if (req.requestedBy) {
    await notifService.create({ ...notifPayload, userId: req.requestedBy });
  }

  // 2. Notify project PM (if different from approver)
  if (req.project?.managerId && req.project.managerId !== approverId && req.project.managerId !== req.requestedBy) {
    await notifService.create({ ...notifPayload, userId: req.project.managerId });
  }

  // 3. Notify project FS
  const fullProject = await prisma.project.findUnique({ where: { id: req.projectId }, select: { managerId: true, fieldSupervisorId: true } });
  if (fullProject?.fieldSupervisorId && fullProject.fieldSupervisorId !== req.requestedBy) {
    await notifService.create({ ...notifPayload, userId: fullProject.fieldSupervisorId });
  }

  // 4. Notify all Finance Directors
  await notifService.notifyRole('Finance_Director', notifPayload);

  // --- AUDIT LOG ---
  await auditService.log({
    userId: approverId, userName: approver?.name, userRole: approver?.role,
    action: 'APPROVE_BUDGET_UPLIFT', targetType: 'BudgetChangeRequest', targetId: id,
    details: { 
      projectId: req.projectId, 
      projectName: req.project?.name,
      oldBudget,
      upliftAmount,
      newBudget,
      requesterName: req.requester?.name,
      targetContractId: req.targetContractId || null
    }
  });

  logger.info('Budget uplift approved', { id, approverId, upliftAmount, newBudget });

  return result;
}

async function reject(id, approverId, reason) {
  const req = await prisma.budgetChangeRequest.update({
    where: { id: Number(id) },
    data: { 
      status: 'Rejected', 
      pmApproved: false, 
      pmApprovedAt: new Date() 
    },
    include: { requester: true, project: true }
  });
  
  const approver = await prisma.user.findUnique({ where: { id: approverId }, select: { id: true, name: true, role: true } });

  // Notify Requester
  await notifService.create({
    userId: req.requestedBy,
    type: 'error', icon: 'fa-times-circle',
    title: 'Budget Uplift Rejected',
    message: `Your budget uplift request for ${req.project?.name || '#' + req.projectId} was rejected.${reason ? ' Reason: ' + reason : ''}`
  });

  // Audit Log
  await auditService.log({
    userId: approverId, userName: approver?.name, userRole: approver?.role,
    action: 'REJECT_BUDGET_UPLIFT', targetType: 'BudgetChangeRequest', targetId: id,
    details: { 
      projectId: req.projectId,
      projectName: req.project?.name,
      amount: Number(req.amount),
      reason: reason || 'No reason provided'
    }
  });

  logger.info('Budget uplift rejected', { id, approverId, reason });

  return req;
}

module.exports = {
  create,
  getAll,
  approve,
  reject,
};

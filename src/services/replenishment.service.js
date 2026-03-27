/**
 * MCMS Service - Replenishment & Escalation Flow
 * Handles material replenishment requests and Finance -> PM escalation.
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const emailService = require('../emails/email.service');
const inventoryService = require('./inventory.service');


/**
 * Get all requests for a project
 */
async function getByProject(projectId) {
  return prisma.replenishmentRequest.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: {
      requester: { select: { id: true, name: true, role: true } },
      project: { select: { name: true, code: true, managerId: true } }
    }
  });
}

/**
 * Create a new replenishment request (Initiated by Field Supervisor or Equipment Coordinator)
 */
async function createRequest(data, user) {
  const { projectId, sectorId, materialName, quantityNeeded, notes } = data;
  
  if (!projectId || !materialName || !quantityNeeded) {
    throw new AppError('Missing required fields for replenishment request', 400);
  }

  const reqCode = `REP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  const request = await prisma.replenishmentRequest.create({
    data: {
      reqCode,
      projectId,
      sectorId,
      materialName,
      quantityNeeded,
      requestedBy: user.id,
      notes,
      status: 'pending_finance'
    },
    include: {
      project: true,
      requester: { select: { name: true } }
    }
  });

  logger.info(`Replenishment request ${reqCode} created by ${user.name}`);

  // Notify Finance manually or in batch
  try {
    const fms = await prisma.user.findMany({ where: { role: 'Finance_Director', isActive: true } });
    if (fms.length > 0) {
      const promises = fms.map(fm => 
        emailService.sendNotification(
          fm,
          `New Replenishment Request: ${reqCode}`,
          `A new replenishment request for ${quantityNeeded} of ${materialName} has been submitted for project ${request.project.name} by ${request.requester.name}. Please review and cost it.`
        )
      );
      await Promise.all(promises);
    }
  } catch (error) {
    logger.error('Failed to send replenishment notifications:', error.message);
  }

  return request;
}

/**
 * Finance action: Costing and Approval/Escalation
 */
async function financeAction(requestId, data, user) {
  const { estimatedCost, action, financeComments } = data;
  
  const request = await prisma.replenishmentRequest.findUnique({
    where: { id: requestId },
    include: { project: true }
  });

  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'pending_finance') throw new AppError(`Cannot action request in ${request.status} status`, 400);

  const updateData = {
    estimatedCost: estimatedCost || request.estimatedCost,
    financeComments
  };

  // If action is escalate, status -> pending_pm
  if (action === 'escalate') {
    updateData.status = 'pending_pm';
  } else if (action === 'approve') {
    // If within finance limits (assumed for now handled externally based on budget control limits)
    updateData.status = 'approved';
  } else if (action === 'reject') {
    updateData.status = 'rejected';
  } else {
    throw new AppError('Invalid action', 400);
  }

  const updatedRequest = await prisma.replenishmentRequest.update({
    where: { id: requestId },
    data: updateData,
    include: { project: { include: { manager: true } } }
  });

  // Notifications
  if (updatedRequest.status === 'pending_pm') {
    // Escalate to PM
    const pm = updatedRequest.project.manager;
    if (pm) {
      await emailService.sendNotification(
        pm,
        `Replenishment Escalation: ${updatedRequest.reqCode}`,
        `Finance has escalated a replenishment request for ${updatedRequest.quantityNeeded} of ${updatedRequest.materialName} (Est Cost: ${updatedRequest.estimatedCost}). Please review and approve.`
      ).catch(e => logger.error('escalation email failed', e));
    }
  }

  return updatedRequest;
}

/**
 * PM action: Approve or Reject escalated request
 */
async function pmAction(requestId, data, user) {
  const { action, pmComments } = data;
  
  const request = await prisma.replenishmentRequest.findUnique({
    where: { id: requestId },
    include: { project: true }
  });

  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'pending_pm') throw new AppError(`Cannot PM-action request in ${request.status} status`, 400);

  const updateData = {
    pmComments,
    status: action === 'approve' ? 'approved' : 'rejected'
  };

  const updatedRequest = await prisma.replenishmentRequest.update({
    where: { id: requestId },
    data: updateData
  });

  // Notify Finance that PM has made a decision
  const fms = await prisma.user.findMany({ where: { role: 'Finance_Director', isActive: true } });
  fms.forEach(fm => {
    emailService.sendNotification(
      fm,
      `PM Decision on ${updatedRequest.reqCode}: ${updatedRequest.status}`,
      `The PM has ${updatedRequest.status} the escalated request for ${updatedRequest.materialName}.`
    ).catch(e => logger.error('pm decision email failed', e));
  });

  return updatedRequest;
}

/**
 * Mark request as delivered/completed and inject into inventory
 */
async function completeRequest(requestId, user) {
  const request = await prisma.replenishmentRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'approved' && request.status !== 'delivering') {
    throw new AppError('Can only complete approved or delivering requests', 400);
  }

  // Update status
  const updatedRequest = await prisma.replenishmentRequest.update({
    where: { id: requestId },
    data: { status: 'completed' }
  });

  // Call inventoryService logic if sector is defined
  if (request.sectorId) {
    try {
      await inventoryService.distribute({
        sectorId: request.sectorId,
        materialName: request.materialName,
        category: 'Replenished',
        unit: 'units', // Defaults or can be fetched
        quantity: request.quantityNeeded,
        reference: request.reqCode,
        notes: 'Automated fulfillment'
      }, user);
    } catch (err) {
      logger.error('Failed to auto-distribute inventory on completion', err);
      // Not throwing to avoid rolling back the completion state
    }
  }

  return updatedRequest;
}

module.exports = {
  getByProject,
  createRequest,
  financeAction,
  pmAction,
  completeRequest
};

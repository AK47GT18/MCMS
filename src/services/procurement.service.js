/**
 * MCMS Service - Procurement
 * CRUD operations for procurement requests
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const auditService = require('./audit.service');

async function getAll({ page = 1, limit = 20, status }) {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};
  
  const [requests, total] = await Promise.all([
    prisma.procurementRequest.findMany({
      skip, take: limit, where,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { select: { id: true, name: true } },
      },
    }),
    prisma.procurementRequest.count({ where }),
  ]);
  
  return { requests, total, page, limit };
}

async function getById(id) {
  const request = await prisma.procurementRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  if (!request) throw new AppError('Procurement request not found', 404);
  return request;
}

async function create(data, userId) {
  const request = await prisma.procurementRequest.create({
    data: {
      ...data,
      requestedBy: userId,
    },
  });
  logger.info('Procurement request created', { reqId: request.id, reqCode: request.reqCode });
  
  await auditService.log({
    userId,
    action: 'CREATE_PROCUREMENT_REQUEST',
    targetType: 'ProcurementRequest',
    targetId: request.id,
    targetCode: request.reqCode,
    details: { ...data }
  });

  return request;
}

async function pmApprove(id, comments) {
  const request = await prisma.procurementRequest.update({
    where: { id },
    data: {
      status: 'pending_finance',
      pmComments: comments,
      pmReviewedAt: new Date(),
    },
  });
  logger.info('Procurement PM approved', { reqId: id });

  await auditService.log({
    userId: request.pmReviewedBy || null,
    action: 'PM_APPROVE_PROCUREMENT',
    targetType: 'ProcurementRequest',
    targetId: id,
    targetCode: request.reqCode,
    details: { comments }
  });

  return request;
}

async function pmReject(id, comments) {
  const request = await prisma.procurementRequest.update({
    where: { id },
    data: {
      status: 'rejected',
      pmComments: comments,
      pmReviewedAt: new Date(),
    },
  });
  logger.info('Procurement PM rejected', { reqId: id });

  await auditService.log({
    userId: request.pmReviewedBy || null,
    action: 'PM_REJECT_PROCUREMENT',
    targetType: 'ProcurementRequest',
    targetId: id,
    targetCode: request.reqCode,
    details: { comments }
  });

  return request;
}

async function financeApprove(id, comments) {
  const request = await prisma.procurementRequest.update({
    where: { id },
    data: {
      status: 'approved',
      financeComments: comments,
      financeReviewedAt: new Date(),
    },
  });
  logger.info('Procurement finance approved', { reqId: id });

  await auditService.log({
    userId: request.financeReviewedBy || null,
    action: 'FD_APPROVE_PROCUREMENT',
    targetType: 'ProcurementRequest',
    targetId: id,
    targetCode: request.reqCode,
    details: { comments }
  });

  return request;
}

async function financeReject(id, comments) {
  const request = await prisma.procurementRequest.update({
    where: { id },
    data: {
      status: 'rejected',
      financeComments: comments,
      financeReviewedAt: new Date(),
    },
  });
  logger.info('Procurement finance rejected', { reqId: id });

  await auditService.log({
    userId: request.financeReviewedBy || null,
    action: 'FD_REJECT_PROCUREMENT',
    targetType: 'ProcurementRequest',
    targetId: id,
    targetCode: request.reqCode,
    details: { comments }
  });

  return request;
}

async function markPurchased(id) {
  const request = await prisma.procurementRequest.update({
    where: { id },
    data: { status: 'purchased' },
  });
  logger.info('Procurement marked purchased', { reqId: id });
  return request;
}

async function getProjectStatus(projectId) {
  // Fetch Road Specification to get Required Materials
  const roadSpec = await prisma.roadSpecification.findFirst({
    where: { projectId: parseInt(projectId) },
    include: {
      layers: true,
      accessories: true
    }
  });

  if (!roadSpec) {
    return {
      projectId: parseInt(projectId),
      missingSpec: true,
      materials: [],
      totalContracts: 0
    };
  }

  // Aggregate required items
  const requiredMaterials = new Map();
  
  if (roadSpec.layers) {
    roadSpec.layers.forEach(layer => {
      const current = requiredMaterials.get(layer.materialType) || { quantity: 0, unit: layer.unit || 'm3' };
      requiredMaterials.set(layer.materialType, { 
        quantity: current.quantity + parseFloat(layer.totalQuantity || 0), 
        unit: current.unit 
      });
    });
  }

  // Fetch all Contracts and their Items for this project
  const contracts = await prisma.contract.findMany({
    where: { 
      projectId: parseInt(projectId),
      status: { in: ['active', 'draft'] } // Count both active and draft procurements
    },
    include: { items: true }
  });

  // Aggregate procured and received items
  const procuredMaterials = new Map();
  const receivedMaterials = new Map();
  
  contracts.forEach(contract => {
    contract.items.forEach(item => {
      const currentProcured = procuredMaterials.get(item.materialName) || 0;
      procuredMaterials.set(item.materialName, currentProcured + parseFloat(item.quantity));
      
      const currentReceived = receivedMaterials.get(item.materialName) || 0;
      receivedMaterials.set(item.materialName, currentReceived + parseFloat(item.receivedQty || 0));
    });
  });

  // Build the final dashboard data
  const statusList = [];
  for (const [materialName, requiredData] of requiredMaterials.entries()) {
    const procuredQty = procuredMaterials.get(materialName) || 0;
    const receivedQty = receivedMaterials.get(materialName) || 0;
    
    statusList.push({
      materialName,
      requiredQuantity: requiredData.quantity,
      procuredQuantity: procuredQty,
      receivedQuantity: receivedQty,
      remainingQuantity: Math.max(0, requiredData.quantity - procuredQty),
      unit: requiredData.unit,
      percentComplete: requiredData.quantity > 0 ? ((procuredQty / requiredData.quantity) * 100).toFixed(1) : 100
    });
  }

  return {
    projectId: parseInt(projectId),
    specId: roadSpec.id,
    materials: statusList,
    totalContracts: contracts.length
  };
}

module.exports = { getAll, getById, create, pmApprove, pmReject, financeApprove, financeReject, markPurchased, getProjectStatus };

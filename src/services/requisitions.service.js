/**
 * MCMS Service - Requisitions
 * CRUD operations for material requisitions
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const handlers = require('../realtime/handlers');
const emailService = require('../emails/email.service');

// Material price catalog (MWK per unit) - used to auto-calculate requisition values
const MATERIAL_PRICES = {
  'Cement OPC': 18500,
  'Bitumen G-Grade': 125000,
  'Diesel Fuel': 2850,
  'Crushed Stone': 45000,
  'River Sand': 25000,
  'Steel Rebar': 85000,
  'Concrete Blocks': 1200,
  'PVC Pipes': 15000,
  'Timber Planks': 8500,
  'Roofing Sheets': 32000,
  'Paint (Exterior)': 28000,
  'Gravel': 18000,
  'Bricks': 850,
  'Nails (Box)': 12000,
  'Binding Wire': 9500,
  'Waterproof Membrane': 45000,
  'Aggregate Base': 35000,
  'Emulsion Primer': 95000,
  'Kerb Stones': 5500,
  'Geotextile Fabric': 22000,
  // Machinery daily hire rates
  'Excavator': 450000,
  'Bulldozer': 520000,
  'Crane': 680000,
  'Motor Grader': 480000,
  'Roller': 320000,
  'Water Bowser': 180000,
  'Tipper': 150000,
  'Backhoe': 380000,
  'Paver': 550000,
  'Concrete Mixer': 120000,
  'Dump Truck': 200000,
  'Forklift': 280000,
  'Generator': 95000,
  'Compactor': 250000,
  'Concrete Pump': 420000,
  'Scaffolding Set': 85000,
  'Welding Machine': 45000,
  'Pile Driver': 750000,
  'Boom Lift': 350000,
  'Road Sweeper': 280000,
};

async function getAll({ page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status, projectId }) {
  const skip = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;
  if (projectId) where.projectId = projectId;
  
  const [requisitions, total] = await Promise.all([
    prisma.requisition.findMany({
      skip, take: limit, where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        project: { select: { id: true, code: true, name: true, budgetTotal: true, budgetSpent: true } },
        submitter: { select: { id: true, name: true } },
        items: true,
      },
    }),
    prisma.requisition.count({ where }),
  ]);
  
  return { requisitions, total, page, limit };
}

async function getById(id) {
  const requisition = await prisma.requisition.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, code: true, name: true } },
      submitter: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true } },
      items: true,
    },
  });
  if (!requisition) throw new AppError('Requisition not found', 404);
  return requisition;
}

async function create(data, userId) {
  const { items, ...reqData } = data;
  
  // Auto-generate reqCode if missing
  if (!reqData.reqCode) {
    const count = await prisma.requisition.count();
    reqData.reqCode = `REQ-${Date.now().toString().slice(-6)}-${(count + 1).toString().padStart(3, '0')}`;
  }

  // Auto-calculate unit prices and totalAmount from material catalog
  let calculatedItems = items;
  if (items && items.length > 0) {
    calculatedItems = items.map(item => {
      const catalogPrice = MATERIAL_PRICES[item.itemName] || 0;
      const unitPrice = item.unitPrice > 0 ? item.unitPrice : catalogPrice;
      return { ...item, unitPrice };
    });

    // Auto-calculate totalAmount if not set or is 0
    if (!reqData.totalAmount || reqData.totalAmount === 0) {
      reqData.totalAmount = calculatedItems.reduce((sum, item) => {
        return sum + (item.unitPrice * (item.quantity || 1));
      }, 0);
    }
  }
  
  const requisition = await prisma.requisition.create({
    data: {
      ...reqData,
      submittedBy: userId,
      items: calculatedItems ? { create: calculatedItems } : undefined,
    },
    include: { items: true, project: { select: { id: true, code: true, name: true } } },
  });
  
  logger.info('Requisition created', { reqId: requisition.id, reqCode: requisition.reqCode, totalAmount: reqData.totalAmount });

  // Email notification to Equipment Coordinator
  try {
    const ecUsers = await prisma.user.findMany({ where: { role: 'Equipment_Coordinator' }, select: { name: true, email: true } });
    for (const ec of ecUsers) {
      emailService.sendNotification(
        ec,
        'New Resource Request',
        `A new requisition ${requisition.reqCode} has been submitted for ${requisition.project?.name || 'a project'}. Items: ${calculatedItems?.map(i => `${i.quantity}x ${i.itemName}`).join(', ')}. Total Value: MWK ${Number(reqData.totalAmount).toLocaleString()}.`,
      ).catch(err => logger.error('EC email notification failed', { error: err.message }));
    }
  } catch (emailErr) {
    logger.error('Failed to notify EC', { error: emailErr.message });
  }

  return requisition;
}

async function approve(id, reviewerId) {
  const requisition = await prisma.requisition.findUnique({
    where: { id },
    include: { project: true }
  });

  if (!requisition) throw new AppError('Requisition not found', 404);
  
  if (requisition.status !== 'pending') {
     throw new AppError(`Cannot approve a requisition that is currently ${requisition.status}`, 400);
  }

  // GAP 3: Strict Budget Enforcement
  if (requisition.project && requisition.project.budgetTotal) {
    const totalBudget = Number(requisition.project.budgetTotal);
    const spentSoFar = Number(requisition.project.budgetSpent || 0);
    const reqAmount = Number(requisition.totalAmount);

    if (spentSoFar + reqAmount > totalBudget) {
      const excess = (spentSoFar + reqAmount) - totalBudget;
      throw new AppError(`Budget Exceeded: This requisition pushes the project K${excess.toLocaleString()} over budget. Approval blocked.`, 400);
    }
  }

  const updatedRequisition = await prisma.requisition.update({
    where: { id },
    data: {
      status: 'approved',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    },
    include: {
      submitter: { select: { id: true, name: true, email: true } },
      project: true,
    },
  });

  // Link to Project Budget Spent
  const projectsService = require('./projects.service');
  await projectsService.addToSpent(requisition.projectId, Number(requisition.totalAmount));
  
  logger.info('Requisition approved', { reqId: id, reviewerId });
  
  // Emit realtime event
  handlers.emitRequisitionStatus(updatedRequisition, 'approved', reviewerId);
  
  // Email notification to submitter
  if (updatedRequisition.submitter) {
    emailService.sendNotification(
      updatedRequisition.submitter,
      'Requisition Approved',
      `Your requisition ${updatedRequisition.reqCode} has been approved.`,
    ).catch(err => logger.error('Email notification failed', { error: err.message }));
  }
  
  return updatedRequisition;
}

async function reject(id, reviewerId, reason) {
  if (!reason) throw new AppError('Rejection reason is required', 400);

  const requisition = await prisma.requisition.update({
    where: { id },
    data: {
      status: 'rejected',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      rejectionReason: reason,
    },
    include: {
      submitter: { select: { id: true, name: true, email: true } },
    },
  });
  
  logger.info('Requisition rejected', { reqId: id, reviewerId, reason });
  
  // Emit realtime event
  handlers.emitRequisitionStatus(requisition, 'rejected', reviewerId);
  
  // Email notification to submitter
  if (requisition.submitter) {
    emailService.sendNotification(
      requisition.submitter,
      'Requisition Rejected',
      `Your requisition ${requisition.reqCode} has been rejected. Reason: ${reason}`,
    ).catch(err => logger.error('Email notification failed', { error: err.message }));
  }
  
  return requisition;
}

async function flagFraud(id, reviewerId) {
  const requisition = await prisma.requisition.update({
    where: { id },
    data: {
      status: 'fraud_flag',
      fraudCheck: true,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    },
    include: {
      submitter: { select: { id: true, name: true, email: true } },
    },
  });
  
  logger.info('Requisition flagged for fraud', { reqId: id, reviewerId });
  
  // Emit realtime event (critical)
  handlers.emitRequisitionStatus(requisition, 'fraud_flag', reviewerId);
  
  return requisition;
}

async function getPending() {
  return prisma.requisition.findMany({
    where: { status: 'pending' },
    include: {
      project: { select: { id: true, code: true } },
      submitter: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

async function fulfill(id, fulfillerId, sectorId = 1) {
  // Find requisition and items
  const requisition = await prisma.requisition.findUnique({
    where: { id },
    include: { items: true, project: true }
  });

  if (!requisition) throw new AppError('Requisition not found', 404);
  if (requisition.status !== 'approved') {
    throw new AppError(`Cannot fulfill a requisition with status: ${requisition.status}. Must be 'approved'.`, 400);
  }

  const inventoryService = require('./inventory.service');

  // Fulfill each item
  if (requisition.items && requisition.items.length > 0) {
    for (const item of requisition.items) {
      await inventoryService.distribute({
        sectorId: sectorId,
        materialName: item.itemName,
        unit: 'Units', // Generic unit if unavailable from reqItem
        quantity: item.quantity,
        reference: requisition.reqCode || `REQ-${id}`,
        notes: `Fulfilled requisition GRN`
      }, { id: fulfillerId });
    }
  }

  // Complete the flow
  const updatedRequisition = await prisma.requisition.update({
    where: { id },
    data: { status: 'fulfilled' }
  });

  logger.info('Requisition fulfilled (GRN Processed)', { reqId: id, fulfillerId });
  return updatedRequisition;
}

module.exports = { getAll, getById, create, approve, reject, flagFraud, getPending, fulfill };

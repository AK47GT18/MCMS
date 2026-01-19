/**
 * MCMS Service - Requisitions
 * CRUD operations for material requisitions
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

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
        project: { select: { id: true, code: true, name: true } },
        vendor: { select: { id: true, name: true } },
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
      vendor: true,
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
  
  const requisition = await prisma.requisition.create({
    data: {
      ...reqData,
      submittedBy: userId,
      items: items ? { create: items } : undefined,
    },
    include: { items: true },
  });
  
  logger.info('Requisition created', { reqId: requisition.id, reqCode: requisition.reqCode });
  return requisition;
}

async function approve(id, reviewerId) {
  const requisition = await prisma.requisition.update({
    where: { id },
    data: {
      status: 'approved',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    },
  });
  logger.info('Requisition approved', { reqId: id, reviewerId });
  return requisition;
}

async function reject(id, reviewerId) {
  const requisition = await prisma.requisition.update({
    where: { id },
    data: {
      status: 'rejected',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    },
  });
  logger.info('Requisition rejected', { reqId: id, reviewerId });
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
  });
  logger.info('Requisition flagged for fraud', { reqId: id, reviewerId });
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

module.exports = { getAll, getById, create, approve, reject, flagFraud, getPending };

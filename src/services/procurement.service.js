/**
 * MCMS Service - Procurement
 * CRUD operations for procurement requests
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

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

module.exports = { getAll, getById, create, pmApprove, pmReject, financeApprove, financeReject, markPurchased };

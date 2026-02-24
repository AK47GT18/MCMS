/**
 * MCMS Service - Contracts
 * CRUD operations for contract management
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const auditService = require('./audit.service');
const emailService = require('../emails/email.service');
const logger = require('../utils/logger');

async function getAll({ page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status }) {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};
  
  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      skip, take: limit, where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        project: { select: { id: true, code: true, name: true } },
        _count: { select: { milestones: true } },
      },
    }),
    prisma.contract.count({ where }),
  ]);
  
  return { contracts, total, page, limit };
}

async function getById(id) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, code: true, name: true } },
      milestones: { orderBy: { dueDate: 'asc' } },
    },
  });
  if (!contract) throw new AppError('Contract not found', 404);
  return contract;
}

async function create(data, userId) {
  const contract = await prisma.contract.create({
    data,
    include: { project: { select: { id: true, name: true, manager: { select: { email: true } } } } },
  });
  logger.info('Contract created', { contractId: contract.id, refCode: contract.refCode });
  
  if (userId) {
    await auditService.log(
      userId, 'CREATE_CONTRACT', 'Contract', contract.id,
      { refCode: contract.refCode }
    );
  }
  
  if (contract.project && contract.project.manager && contract.project.manager.email) {
    await emailService.sendNotification(
      contract.project.manager.email,
      'New Contract Created',
      `Contract ${contract.refCode} for project ${contract.project.name} has been created.`
    ).catch(e => logger.error('PM Email failed', e));
  }
  
  return contract;
}

async function update(id, data, userId) {
  const existing = await prisma.contract.findUnique({
    where: { id },
    include: { project: { select: { id: true, name: true, manager: { select: { email: true } } } } }
  });
  if (!existing) throw new AppError('Contract not found', 404);

  const contract = await prisma.contract.update({ where: { id }, data });
  logger.info('Contract updated', { contractId: id });
  
  if (userId) {
    await auditService.log(userId, 'UPDATE_CONTRACT', 'Contract', id, data);
  }
  
  if (existing.project && existing.project.manager && existing.project.manager.email) {
    await emailService.sendNotification(
      existing.project.manager.email,
      'Contract Updated',
      `Contract ${contract.refCode} for project ${existing.project.name} has been updated.`
    ).catch(e => logger.error('PM Email failed', e));
  }
  
  return contract;
}

async function remove(id, userId) {
  await getById(id);
  await prisma.contract.delete({ where: { id } });
  logger.info('Contract deleted', { contractId: id });
  
  if (userId) {
    await auditService.log(userId, 'DELETE_CONTRACT', 'Contract', id, {});
  }
}

async function approve(id, userId) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { project: { select: { id: true, name: true, manager: { select: { id: true, email: true } } } } }
  });

  if (!contract) throw new AppError('Contract not found', 404);

  // If contract is already active, don't re-approve
  if (contract.status === 'active') return contract;

  const updated = await prisma.contract.update({
    where: { id },
    data: { status: 'active' }
  });

  logger.info('Contract approved', { contractId: id, approvedBy: userId });

  if (userId) {
    await auditService.log(userId, 'APPROVE_CONTRACT', 'Contract', id, { previousStatus: contract.status });
  }

  // Notify CA or other stakeholders if needed
  // ... (email logic if required)

  return updated;
}

async function getByProject(projectId) {
  return prisma.contract.findMany({
    where: { projectId },
  });
}

module.exports = { getAll, getById, create, update, remove, approve, getByProject };

/**
 * MCMS Service - Contracts
 * CRUD operations for contract management
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
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
        vendor: { select: { id: true, name: true } },
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
      vendor: true,
      milestones: { orderBy: { dueDate: 'asc' } },
    },
  });
  if (!contract) throw new AppError('Contract not found', 404);
  return contract;
}

async function create(data) {
  const contract = await prisma.contract.create({
    data,
    include: { project: { select: { id: true, name: true } }, vendor: { select: { id: true, name: true } } },
  });
  logger.info('Contract created', { contractId: contract.id, refCode: contract.refCode });
  return contract;
}

async function update(id, data) {
  await getById(id);
  const contract = await prisma.contract.update({ where: { id }, data });
  logger.info('Contract updated', { contractId: id });
  return contract;
}

async function remove(id) {
  await getById(id);
  await prisma.contract.delete({ where: { id } });
  logger.info('Contract deleted', { contractId: id });
}

async function getByProject(projectId) {
  return prisma.contract.findMany({
    where: { projectId },
    include: { vendor: { select: { id: true, name: true } } },
  });
}

module.exports = { getAll, getById, create, update, remove, getByProject };

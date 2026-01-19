/**
 * MCMS Service - Assets
 * CRUD operations for fleet/equipment management
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

async function getAll({ page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc', status, category }) {
  const skip = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  
  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      skip, take: limit, where,
      orderBy: { [sortBy]: sortOrder },
      include: { currentProject: { select: { id: true, code: true, name: true } } },
    }),
    prisma.asset.count({ where }),
  ]);
  
  return { assets, total, page, limit };
}

async function getById(id) {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      currentProject: { select: { id: true, code: true, name: true } },
      assetLogs: {
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!asset) throw new AppError('Asset not found', 404);
  return asset;
}

async function create(data) {
  const asset = await prisma.asset.create({ data });
  logger.info('Asset created', { assetId: asset.id, assetCode: asset.assetCode });
  return asset;
}

async function update(id, data) {
  await getById(id);
  const asset = await prisma.asset.update({ where: { id }, data });
  logger.info('Asset updated', { assetId: id });
  return asset;
}

async function remove(id) {
  await getById(id);
  await prisma.asset.delete({ where: { id } });
  logger.info('Asset deleted', { assetId: id });
}

async function checkOut(id, userId, projectId) {
  const asset = await prisma.asset.update({
    where: { id },
    data: {
      status: 'checked_out',
      currentProjectId: projectId,
      assetLogs: {
        create: {
          userId,
          projectId,
          action: 'check_out',
        },
      },
    },
  });
  logger.info('Asset checked out', { assetId: id, userId, projectId });
  return asset;
}

async function checkIn(id, userId, fuelLevel) {
  const asset = await prisma.asset.update({
    where: { id },
    data: {
      status: 'available',
      currentProjectId: null,
      fuelLevel,
      assetLogs: {
        create: {
          userId,
          action: 'check_in',
          fuelLevelAtAction: fuelLevel,
        },
      },
    },
  });
  logger.info('Asset checked in', { assetId: id, userId });
  return asset;
}

async function getAvailable() {
  return prisma.asset.findMany({
    where: { status: 'available' },
    select: { id: true, assetCode: true, name: true, category: true },
  });
}

module.exports = { getAll, getById, create, update, remove, checkOut, checkIn, getAvailable };

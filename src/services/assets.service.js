/**
 * MCMS Service - Assets
 * CRUD operations for fleet/equipment management
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const handlers = require('../realtime/handlers');

async function getAll({ page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc', status, category, projectId }) {
  const skip = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (projectId) where.currentProjectId = Number(projectId);
  
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

async function checkOut(id, userId, projectId, dispatchedBy) {
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
          dispatchedBy
        },
      },
    },
  });
  
  logger.info('Asset checked out', { assetId: id, userId, projectId });
  
  // Emit realtime event (gracefully handle WS failures)
  try {
    handlers.emitAssetEvent(asset, 'check_out');
  } catch (wsError) {
    logger.warn('Failed to emit asset WebSocket event', { error: wsError.message });
  }
  
  return asset;
}

async function checkIn(id, userId, fuelLevel, dispatchedBy) {
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
          dispatchedBy
        },
      },
    },
  });
  
  logger.info('Asset checked in', { assetId: id, userId });
  
  // Emit realtime event
  handlers.emitAssetEvent(asset, 'check_in');
  
  return asset;
}

async function getAvailable() {
  return prisma.asset.findMany({
    where: { status: 'available' },
    select: { id: true, assetCode: true, name: true, category: true },
  });
}

async function flagIssue(id, reporterId, description) {
  const asset = await prisma.asset.update({
    where: { id },
    data: {
      status: 'maintenance',
      condition: 'Poor',
      assetLogs: {
        create: {
          userId: reporterId,
          action: 'flagged_issue',
          fuelLevelAtAction: -1
        }
      },
      maintenanceRecords: {
        create: {
          serviceDate: new Date(),
          type: 'corrective',
          description: description || 'Field Supervisor reported a breakdown.'
        }
      }
    }
  });

  logger.info('Asset flagged for issue/maintenance', { assetId: id, reporterId });
  
  // Realtime notification
  handlers.emitAssetEvent(asset, 'maintenance');

  return asset;
}

async function resolveIssue(id, resolverId, resolutionNotes) {
  const asset = await getById(id);
  if (asset.status !== 'maintenance') {
    throw new AppError('Asset is not currently in maintenance status', 400);
  }

  const updatedAsset = await prisma.asset.update({
    where: { id },
    data: {
      status: 'available',
      condition: 'Good',
      lastMaintenanceAt: new Date(),
      assetLogs: {
        create: {
          userId: resolverId,
          action: 'issue_resolved',
          fuelLevelAtAction: -1
        }
      }
    }
  });

  logger.info('Asset issue resolved', { assetId: id, resolverId });
  
  // Realtime notification
  handlers.emitAssetEvent(updatedAsset, 'available');

  return updatedAsset;
}

module.exports = { getAll, getById, create, update, remove, checkOut, checkIn, getAvailable, flagIssue, resolveIssue };

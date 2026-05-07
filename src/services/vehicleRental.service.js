/**
 * MCMS Service - Vehicle Rental & Equipment Contracts
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const { MACHINE_TYPES } = require('./equipmentRequirements');

/**
 * Generate a unique reference code for a vehicle contract
 */
async function generateRefCode(type = 'rental') {
  const prefix = type === 'purchase' ? 'VPC' : 'VRC'; // VPC = Purchase, VRC = Rental
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  
  const count = await prisma.vehicleRentalContract.count({
    where: { refCode: { startsWith: `${prefix}-${dateStr}` } }
  });
  
  return `${prefix}-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
}

/**
 * Create a new vehicle contract (Rental or Purchase)
 */
async function create(data, userId) {
  const { 
    projectId, 
    machineType, 
    contractType = 'rental', 
    vendorName, 
    dailyRate, 
    purchasePrice,
    startDate, 
    endDate,
    notes,
    documentUrl,
    fileName,
    phaseNumber
  } = data;

  // Validate machine type
  if (!MACHINE_TYPES[machineType]) {
    throw new AppError(`Invalid machine type: ${machineType}`, 400);
  }

  const refCode = await generateRefCode(contractType);

  // Calculate total value for rentals if not provided
  let totalValue = data.totalValue;
  if (contractType === 'rental' && !totalValue && dailyRate && startDate && endDate) {
    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
    totalValue = Number(dailyRate) * days;
  }

  const contract = await prisma.vehicleRentalContract.create({
    data: {
      refCode,
      projectId: parseInt(projectId),
      machineType,
      contractType,
      vendorName,
      dailyRate: dailyRate ? parseFloat(dailyRate) : null,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
      totalValue: totalValue ? parseFloat(totalValue) : (purchasePrice ? parseFloat(purchasePrice) : null),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      notes,
      documentUrl,
      fileName,
      phaseNumber: phaseNumber ? parseInt(phaseNumber) : null,
      createdById: userId,
      status: 'pending_approval' // FD must approve
    }
  });

  logger.info(`Vehicle contract ${refCode} created by user ${userId}`);
  return contract;
}

/**
 * Approve a vehicle contract (FD action)
 */
async function approve(id, userId) {
  const contract = await prisma.vehicleRentalContract.findUnique({ where: { id: parseInt(id) } });
  if (!contract) throw new AppError('Contract not found', 404);

  const updated = await prisma.vehicleRentalContract.update({
    where: { id: parseInt(id) },
    data: {
      status: 'active',
      approvedById: userId,
      approvedAt: new Date()
    }
  });

  // If it's a purchase, we might want to automatically add it to the Asset registry
  if (contract.contractType === 'purchase') {
    try {
      await prisma.asset.create({
        data: {
          assetCode: `AST-${contract.refCode.split('-').pop()}`,
          name: `${contract.machineType} (${contract.vendorName})`,
          category: contract.machineType,
          status: 'available',
          estimatedValue: contract.purchasePrice,
          condition: 'Good'
        }
      });
    } catch (e) {
      logger.error('Failed to auto-create asset from purchase contract', { error: e.message });
    }
  }

  return updated;
}

/**
 * Reject a vehicle contract (FD action)
 */
async function reject(id, userId, reason) {
  const contract = await prisma.vehicleRentalContract.findUnique({ where: { id: parseInt(id) } });
  if (!contract) throw new AppError('Contract not found', 404);

  return await prisma.vehicleRentalContract.update({
    where: { id: parseInt(id) },
    data: {
      status: 'rejected',
      notes: reason ? `${contract.notes || ''} [Rejected: ${reason}]` : contract.notes
    }
  });
}

/**
 * Renew/Extend a rental contract
 */
async function renew(id, data, userId) {
  const { newEndDate, dailyRate, notes } = data;
  const contract = await prisma.vehicleRentalContract.findUnique({ where: { id: parseInt(id) } });
  
  if (!contract) throw new AppError('Contract not found', 404);
  if (contract.contractType !== 'rental') throw new AppError('Only rental contracts can be renewed', 400);

  const oldEndDate = new Date(contract.endDate);
  const extensionDays = Math.ceil((new Date(newEndDate) - oldEndDate) / (1000 * 60 * 60 * 24));
  
  if (extensionDays <= 0) throw new AppError('New end date must be after current end date', 400);

  const rate = dailyRate ? parseFloat(dailyRate) : Number(contract.dailyRate);
  const additionalValue = rate * extensionDays;

  return await prisma.vehicleRentalContract.update({
    where: { id: parseInt(id) },
    data: {
      endDate: new Date(newEndDate),
      dailyRate: rate,
      totalValue: Number(contract.totalValue) + additionalValue,
      renewalCount: { increment: 1 },
      notes: notes || contract.notes,
      status: 'renewed'
    }
  });
}

/**
 * Shift a vehicle to another project
 */
async function shift(id, data, userId) {
  const { toProjectId, shiftDate, reason } = data;
  const contract = await prisma.vehicleRentalContract.findUnique({ where: { id: parseInt(id) } });
  
  if (!contract) throw new AppError('Contract not found', 404);

  return await prisma.$transaction(async (tx) => {
    // 1. Create shift log
    await tx.vehicleRentalShift.create({
      data: {
        rentalContractId: contract.id,
        fromProjectId: contract.projectId,
        toProjectId: parseInt(toProjectId),
        shiftDate: new Date(shiftDate),
        reason,
        shiftedById: userId
      }
    });

    // 2. Update contract's current project
    return await tx.vehicleRentalContract.update({
      where: { id: contract.id },
      data: {
        projectId: parseInt(toProjectId),
        status: 'shifted'
      }
    });
  });
}

/**
 * Mark a rental vehicle as returned
 */
async function markReturned(id, returnDate, userId) {
  return await prisma.vehicleRentalContract.update({
    where: { id: parseInt(id) },
    data: {
      returnDate: new Date(returnDate),
      status: 'returned'
    }
  });
}

/**
 * Get all vehicle contracts with filters
 */
async function getAll(params = {}) {
  const { projectId, status, contractType, page = 1, limit = 10 } = params;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (projectId) where.projectId = parseInt(projectId);
  if (status) where.status = status;
  if (contractType) where.contractType = contractType;

  const [contracts, total] = await Promise.all([
    prisma.vehicleRentalContract.findMany({
      where,
      include: {
        project: { select: { name: true, code: true } },
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
        _count: { select: { shifts: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    }),
    prisma.vehicleRentalContract.count({ where })
  ]);

  return { contracts, total, page: parseInt(page), limit: parseInt(limit) };
}

/**
 * Get equipment price configurations
 */
async function getPriceConfigs() {
  return await prisma.equipmentPriceConfig.findMany({
    where: { isDeleted: false },
    orderBy: { machineType: 'asc' }
  });
}

/**
 * Update equipment price configuration
 */
async function updatePriceConfig(machineType, data, userId) {
  const { dailyRate, label } = data;
  
  return await prisma.equipmentPriceConfig.upsert({
    where: { machineType },
    update: {
      dailyRate: parseFloat(dailyRate),
      label,
      updatedById: userId
    },
    create: {
      machineType,
      label,
      dailyRate: parseFloat(dailyRate),
      updatedById: userId
    }
  });
}

module.exports = {
  create,
  approve,
  reject,
  renew,
  shift,
  markReturned,
  getAll,
  getPriceConfigs,
  updatePriceConfig
};

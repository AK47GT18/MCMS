/**
 * MCMS Service - Inventory & Stock Management
 * Sector-level tracking of material distribution and consumption
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const emailService = require('../emails/email.service');

/**
 * Get all inventory records for a sector
 * @param {number} sectorId 
 */
async function getBySector(sectorId) {
  return prisma.inventory.findMany({
    where: { sectorId },
    include: {
      logs: {
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          user: { select: { id: true, name: true, role: true } }
        }
      }
    }
  });
}

/**
 * Record a distribution of materials to a sector (Stock IN)
 * @param {Object} data 
 * @param {Object} user 
 */
async function distribute(data, user) {
  const { sectorId, materialName, category, unit, quantity, reference, notes, lowThreshold } = data;
  
  if (!sectorId || !materialName || !unit || !quantity || quantity <= 0) {
    throw new AppError('Invalid distribution data', 400);
  }

  // Find or create inventory record
  const inventory = await prisma.inventory.upsert({
    where: {
      sectorId_materialName: {
        sectorId,
        materialName
      }
    },
    update: {
      quantityOnHand: {
        increment: quantity
      },
      lastRestockedAt: new Date(),
      // Update metadata if provided
      category: category || undefined,
      lowThreshold: lowThreshold !== undefined ? lowThreshold : undefined
    },
    create: {
      sectorId,
      materialName,
      category,
      unit,
      quantityOnHand: quantity,
      lowThreshold: lowThreshold || 0,
      lastRestockedAt: new Date(),
    }
  });

  // Log the IN transaction
  const log = await prisma.inventoryLog.create({
    data: {
      inventoryId: inventory.id,
      userId: user?.id,
      type: 'IN',
      quantity,
      reference,
      notes
    }
  });

  logger.info(`Stock distributed: ${quantity} ${unit} of ${materialName} to sector ${sectorId}`);

  // Send dispersion email
  try {
    const sector = await prisma.sector.findUnique({
      where: { id: sectorId },
      include: { project: { include: { manager: true } } }
    });
    if (sector?.project?.manager) {
      await emailService.sendNotification(
        sector.project.manager,
        `Materials Dispersed: ${materialName}`,
        `A quantity of ${quantity} ${unit} of ${materialName} has been dispersed/distributed to sector ${sector.name} for project ${sector.project.name}. Reference: ${reference || 'N/A'}`
      );
    }
  } catch (error) {
    logger.error('Failed to send material dispersion email:', error.message);
  }

  return { inventory, log };
}

/**
 * Record consumption of materials at a sector (Stock OUT)
 * @param {Object} data 
 * @param {Object} user 
 */
async function consume(data, user) {
  const { sectorId, materialName, quantity, reference, notes } = data;
  
  if (!sectorId || !materialName || !quantity || quantity <= 0) {
    throw new AppError('Invalid consumption data', 400);
  }

  const inventory = await prisma.inventory.findUnique({
    where: {
      sectorId_materialName: {
        sectorId,
        materialName
      }
    },
    include: { sector: { include: { project: true } } }
  });

  if (!inventory) {
    throw new AppError(`Material ${materialName} not found in sector inventory`, 404);
  }

  // Prevent negative inventory or allow and just warn? For MCMS, typically strict.
  if (Number(inventory.quantityOnHand) < Number(quantity)) {
    throw new AppError(`Insufficient stock. Only ${inventory.quantityOnHand} ${inventory.unit} available.`, 400);
  }

  const updatedInventory = await prisma.inventory.update({
    where: { id: inventory.id },
    data: {
      quantityOnHand: {
        decrement: quantity
      }
    }
  });

  // Log the OUT transaction
  const log = await prisma.inventoryLog.create({
    data: {
      inventoryId: inventory.id,
      userId: user?.id,
      type: 'OUT',
      quantity,
      reference,
      notes
    }
  });

  // Record Material Usage for Progress Tracking
  await prisma.materialUsage.create({
    data: {
      projectId: inventory.sector.projectId,
      sectorId: sectorId,
      roadLayerId: data.roadLayerId ? parseInt(data.roadLayerId) : undefined,
      materialName: materialName,
      quantityConsumed: quantity,
      unit: inventory.unit,
      recordedById: user?.id,
      progressPercent: data.progressPercent ? parseFloat(data.progressPercent) : undefined,
      notes: notes
    }
  });

  logger.info(`Stock consumed: ${quantity} ${inventory.unit} of ${materialName} from sector ${sectorId}`);

  // Threshold Depletion Check
  const currentQty = Number(updatedInventory.quantityOnHand);
  const lowThreshold = Number(updatedInventory.lowThreshold);
  
  // 1. Check explicit lowThreshold
  if (lowThreshold > 0 && currentQty <= lowThreshold) {
    await triggerDepletionAlert(updatedInventory, inventory.sector, 'THRESHOLD_REACHED');
  } 
  // 2. Check 20% Rule (if no notification sent recently)
  else if (inventory.totalQtyAllocated && currentQty <= (Number(inventory.totalQtyAllocated) * 0.2)) {
    // Only alert if we haven't alerted in the last 24 hours to avoid spam
    const lastAlert = updatedInventory.lastNotificationAt ? new Date(updatedInventory.lastNotificationAt) : null;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    if (!lastAlert || lastAlert < oneDayAgo) {
      await triggerDepletionAlert(updatedInventory, inventory.sector, 'LOW_STOCK_20');
    }
  }

  return { inventory: updatedInventory, log };
}

/**
 * Internal method to handle Depletion Alerts
 */
async function triggerDepletionAlert(inventory, sector, alertType) {
  logger.warn(`Depletion Alert [${alertType}]: ${inventory.materialName} in sector ${sector.id} is low (${inventory.quantityOnHand} ${inventory.unit})`);
  
  try {
    const pm = await prisma.user.findFirst({
      where: { id: sector.project.managerId }
    });

    const ec = await prisma.user.findFirst({
      where: { role: 'Equipment_Coordinator' }
    });

    const subject = alertType === 'LOW_STOCK_20' 
      ? `CRITICAL LOW STOCK (20%): ${inventory.materialName} in ${sector.name}`
      : `Low Stock Alert: ${inventory.materialName} in ${sector.name}`;

    const message = alertType === 'LOW_STOCK_20'
      ? `CRITICAL: The inventory level for ${inventory.materialName} in Sector ${sector.name} (${sector.project.name}) has dropped to 20% of allocated volume (${inventory.quantityOnHand} ${inventory.unit} remaining). Immediate replenishment required.`
      : `The inventory level for ${inventory.materialName} in Sector ${sector.name} (${sector.project.name}) has dropped to ${inventory.quantityOnHand} ${inventory.unit}, which is at or below the threshold of ${inventory.lowThreshold} ${inventory.unit}.`;

    const recipients = [pm, ec].filter(u => u && u.email);

    for (const user of recipients) {
      await emailService.sendNotification(user, subject, message);
    }

    // Update last notification timestamp
    await prisma.inventory.update({
      where: { id: inventory.id },
      data: { lastNotificationAt: new Date() }
    });

  } catch (error) {
    logger.error('Failed to send depletion alert email:', error.message);
  }
}

/**
 * Get all inventory records for a project (across all its sectors)
 * @param {number} projectId
 */
async function getByProject(projectId) {
  const sectors = await prisma.sector.findMany({
    where: { projectId },
    include: {
      inventories: {
        include: {
          logs: {
            orderBy: { timestamp: 'desc' },
            take: 5,
            include: {
              user: { select: { id: true, name: true, role: true } }
            }
          }
        }
      }
    }
  });

  // Flatten into a unified list with sector context
  const inventory = [];
  for (const sector of sectors) {
    for (const inv of sector.inventories) {
      inventory.push({
        ...inv,
        sectorName: sector.name,
        sectorId: sector.id
      });
    }
  }

  return inventory;
}

/**
 * Get aggregate inventory totals across all sectors
 * Used by EC for the system-wide overview
 */
async function getAll() {
  const items = await prisma.inventory.findMany({
    include: {
      sector: {
        include: { project: true }
      }
    }
  });

  // Group by material name to get system totals
  const totals = {};
  items.forEach(item => {
    if (!totals[item.materialName]) {
      totals[item.materialName] = {
        materialName: item.materialName,
        totalQuantity: 0,
        unit: item.unit,
        allocations: []
      };
    }
    const qty = parseFloat(item.quantityOnHand || 0);
    totals[item.materialName].totalQuantity += qty;
    totals[item.materialName].allocations.push({
      sectorId: item.sectorId,
      sectorName: item.sector.name,
      projectId: item.sector.projectId,
      projectName: item.sector.project?.name,
      quantity: qty
    });
  });

  return Object.values(totals);
}

async function getIncomingShipments() {
  const contracts = await prisma.contract.findMany({
    where: { status: { in: ['active', 'draft', 'expired'] } },
    include: {
      project: { select: { id: true, name: true, code: true } },
      vendor: { select: { id: true, name: true } },
      items: {
        where: {
          // Prisma doesn't support comparing two columns directly in where without raw query, so we'll filter in memory or get all items and filter out completed ones
        }
      }
    }
  });

  const shipments = [];
  contracts.forEach(contract => {
    contract.items.forEach(item => {
      const remaining = Number(item.quantity) - Number(item.receivedQty || 0);
      if (remaining > 0) {
        shipments.push({
          id: item.id, // the ContractItem ID
          contractId: contract.id,
          contractRef: contract.refCode,
          projectName: contract.project?.name,
          projectId: contract.project?.id,
          vendorName: contract.vendor?.name || contract.vendorName,
          materialName: item.materialName,
          totalQty: item.quantity,
          receivedQty: item.receivedQty || 0,
          pendingQty: remaining,
          unit: item.unit
        });
      }
    });
  });

  return shipments;
}

async function receiveShipment(contractItemId, receivedQty, userId) {
  const item = await prisma.contractItem.findUnique({
    where: { id: parseInt(contractItemId) },
    include: { contract: { include: { project: { include: { sectors: true } } } } }
  });

  if (!item) throw new AppError('Shipment item not found', 404);
  
  const remaining = Number(item.quantity) - Number(item.receivedQty || 0);
  if (receivedQty > remaining) {
    throw new AppError(`Cannot receive more than pending quantity. Pending: ${remaining}`, 400);
  }

  // Update ContractItem receivedQty
  const updatedItem = await prisma.contractItem.update({
    where: { id: parseInt(contractItemId) },
    data: { receivedQty: { increment: receivedQty } }
  });

  // Automatically add to the first sector of the project as Central Silo
  let sector = item.contract.project.sectors[0];
  
  if (!sector) {
    // Fallback: Create a default sector if none exists
    logger.info('Project has no sectors. Creating default Main Site Silo.', { projectId: item.contract.projectId });
    sector = await prisma.sector.create({
      data: {
        projectId: item.contract.projectId,
        name: 'Main Site Silo',
        description: 'Auto-generated during procurement receipt'
      }
    });
  }

  if (sector) {
    await distribute({
      sectorId: sector.id,
      materialName: item.materialName,
      unit: item.unit,
      quantity: receivedQty,
      reference: `Receipt from Contract ${item.contract.refCode}`,
      notes: 'Received by Equipment Coordinator'
    }, { id: userId });
  }

  // Check for Total Contract Fulfillment
  try {
    const fullContract = await prisma.contract.findUnique({
      where: { id: item.contractId },
      include: { items: true }
    });

    const isFullyDelivered = fullContract.items.every(i => Number(i.receivedQty) >= Number(i.quantity));

    if (isFullyDelivered) {
      const notificationService = require('./notification.service');
      
      await notificationService.notifyRole('Finance_Director', {
        title: 'Contract Fully Delivered',
        message: `Contract ${fullContract.refCode} for ${fullContract.title} is now 100% delivered. Ready for formal closure.`,
        type: 'contract',
        icon: 'fa-check-double',
        link: `/contracts/${fullContract.id}`
      });
      logger.info('Contract fulfillment notification sent to FD', { contractId: fullContract.id });
    }
  } catch (err) {
    logger.error('Fulfillment check failed', err);
  }

  return updatedItem;
}

module.exports = {
  getBySector,
  getByProject,
  getAll,
  distribute,
  consume,
  getIncomingShipments,
  receiveShipment
};

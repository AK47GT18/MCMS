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

  logger.info(`Stock consumed: ${quantity} ${inventory.unit} of ${materialName} from sector ${sectorId}`);

  // Threshold Depletion Check
  if (Number(updatedInventory.quantityOnHand) <= Number(updatedInventory.lowThreshold) && Number(updatedInventory.lowThreshold) > 0) {
    triggerDepletionAlert(updatedInventory, inventory.sector);
  }

  return { inventory: updatedInventory, log };
}

/**
 * Internal method to handle Depletion Alerts
 */
async function triggerDepletionAlert(inventory, sector) {
  logger.warn(`Depletion Alert: ${inventory.materialName} in sector ${sector.id} is at or below threshold (${inventory.quantityOnHand} <= ${inventory.lowThreshold})`);
  
  try {
    const pm = await prisma.user.findFirst({
      where: { id: sector.project.managerId }
    });

    if (pm) {
      await emailService.sendNotification(
        pm,
        `Low Stock Alert: ${inventory.materialName} in ${sector.name}`,
        `The inventory level for ${inventory.materialName} in Sector ${sector.name} (${sector.project.name}) has dropped to ${inventory.quantityOnHand} ${inventory.unit}, which is at or below the threshold of ${inventory.lowThreshold} ${inventory.unit}. Please action a replenishment request if necessary.`
      );
    }
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

module.exports = {
  getBySector,
  getByProject,
  distribute,
  consume
};

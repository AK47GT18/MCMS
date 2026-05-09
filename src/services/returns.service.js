/**
 * MCMS Service - Resource Recovery & Returns
 */
const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const inventoryService = require('./inventory.service');

/**
 * Record a return of materials from a site to the main silo (Reverse Dispatch)
 * This is effectively a Stock OUT from site and Stock IN to main yard.
 */
async function initiateReturn(data, user) {
    const { fromSectorId, toSectorId, materialName, quantity, reference, notes } = data;

    if (!fromSectorId || !toSectorId || !materialName || !quantity || quantity <= 0) {
        throw new AppError('Invalid return data: fromSectorId, toSectorId, materialName, and quantity are required.', 400);
    }

    // 1. Deduct from site (Stock OUT)
    const outResult = await inventoryService.consume({
        sectorId: parseInt(fromSectorId),
        materialName,
        quantity: parseFloat(quantity),
        reference: reference || `Return from Site: ${fromSectorId}`,
        notes: `Reverse Dispatch: ${notes || 'Returned to yard'}`
    }, user);

    // 2. Add back to main silo (Stock IN)
    // We get the metadata from the outResult to maintain consistency
    const inResult = await inventoryService.distribute({
        sectorId: parseInt(toSectorId),
        materialName,
        category: outResult.inventory.category,
        unit: outResult.inventory.unit,
        quantity: parseFloat(quantity),
        reference: reference || `Return from Site: ${fromSectorId}`,
        notes: `Reverse Dispatch Recovery: ${notes || 'Returned to yard'}`
    }, user);

    logger.info(`Reverse Dispatch completed: ${quantity} ${outResult.inventory.unit} of ${materialName} returned from sector ${fromSectorId} to ${toSectorId}`);

    // Audit Log
    const auditService = require('./audit.service');
    await auditService.log({
        userId: user?.id,
        action: 'MATERIAL_RETURN',
        targetType: 'Inventory',
        targetId: inResult.inventory.id,
        targetCode: materialName,
        details: {
            fromSector: fromSectorId,
            toSector: toSectorId,
            quantity,
            reference
        }
    });

    return { outResult, inResult };
}

module.exports = {
    initiateReturn
};

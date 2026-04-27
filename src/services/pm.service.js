/**
 * MCMS Service - Project Management (PM)
 * Handles price configuration and Variation Orders
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PMService {
  /**
   * Material Price Configuration
   */
  async getMaterialPrices() {
    return await prisma.materialPriceConfig.findMany({
      orderBy: { materialName: 'asc' }
    });
  }

  async upsertMaterialPrice(data, userId) {
    return await prisma.materialPriceConfig.upsert({
      where: { materialName: data.materialName },
      update: {
        unit: data.unit,
        basePrice: data.basePrice,
        updatedById: userId
      },
      create: {
        materialName: data.materialName,
        unit: data.unit,
        basePrice: data.basePrice,
        updatedById: userId
      }
    });
  }

  async deleteMaterialPrice(id) {
    return await prisma.materialPriceConfig.delete({
      where: { id: parseInt(id) }
    });
  }

  /**
   * Variation Orders (VO)
   */
  async createVariationOrder(data, userId) {
    return await prisma.variationOrder.create({
      data: {
        ...data,
        requestedById: userId
      }
    });
  }

  async getVariationOrders(projectId, contractId) {
    const where = {};
    if (projectId) where.projectId = parseInt(projectId);
    if (contractId) where.contractId = parseInt(contractId);
    
    return await prisma.variationOrder.findMany({
      where,
      include: {
        requestedBy: { select: { name: true } },
        approvedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

module.exports = new PMService();

/**
 * MCMS Service - Project Management (PM)
 * Handles price configuration and Variation Orders
 */

const { prisma } = require('../config/database');

class PMService {
  /**
   * Material Price Configuration
   */
  async getMaterialPrices(page = 1, limit = 15, search = '', category = '') {
    const skip = (page - 1) * limit;
    const where = { isDeleted: false };
    
    if (search) {
      where.OR = [
        { materialName: { contains: search, mode: 'insensitive' } },
        { phase: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (category) {
      where.category = category;
    }

    const [configs, total] = await Promise.all([
      prisma.materialPriceConfig.findMany({
        where,
        skip,
        take: limit,
        orderBy: { materialName: 'asc' }
      }),
      prisma.materialPriceConfig.count({ where })
    ]);
    return { configs, total, page, limit };
  }

  async upsertMaterialPrice(data, userId) {
    const updateData = {
      unit: data.unit,
      basePrice: data.basePrice,
      phase: data.phase,
      category: data.category,
      updatedById: userId,
      isDeleted: false // Re-activate if it was deleted
    };

    return await prisma.materialPriceConfig.upsert({
      where: { materialName: data.materialName },
      update: updateData,
      create: {
        ...updateData,
        materialName: data.materialName
      }
    });
  }

  async deleteMaterialPrice(id) {
    // Perform soft delete
    return await prisma.materialPriceConfig.update({
      where: { id: parseInt(id) },
      data: { isDeleted: true }
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

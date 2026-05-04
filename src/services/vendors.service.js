/**
 * MCMS Service - Vendors
 * CRUD operations with normalized matching, auto-create, and performance scoring
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const auditService = require('./audit.service');

/**
 * Get all vendors with contract counts and average ratings
 */
async function getAll({ page = 1, limit = 20, search = '', category = '' }) {
  const skip = (page - 1) * limit;
  
  const where = {
    AND: [
      search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      } : {},
      category ? { category } : {}
    ]
  };

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      skip,
      take: limit,
      where,
      orderBy: { name: 'asc' },
      include: {
        contracts: {
          select: {
            id: true,
            refCode: true,
            title: true,
            value: true,
            status: true,
            startDate: true,
            endDate: true,
            vendorRating: true,
            ratingComment: true,
            ratedAt: true,
            project: { select: { id: true, name: true, code: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { contracts: true }
        }
      }
    }),
    prisma.vendor.count({ where })
  ]);

  // Compute avgRating for each vendor from their rated contracts
  const vendorsWithScores = vendors.map(v => {
    const ratedContracts = v.contracts.filter(c => c.vendorRating != null);
    const avgRating = ratedContracts.length > 0
      ? ratedContracts.reduce((sum, c) => sum + c.vendorRating, 0) / ratedContracts.length
      : null;
    return {
      ...v,
      contractCount: v._count.contracts,
      avgRating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
      ratedCount: ratedContracts.length
    };
  });

  return { vendors: vendorsWithScores, total, page, limit };
}

/**
 * Search vendors for autocomplete (lightweight, top 5 results)
 */
async function search(query) {
  if (!query || query.trim().length < 2) return [];

  const normalized = query.trim().toLowerCase();

  const vendors = await prisma.vendor.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 5,
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { contracts: true } },
      contracts: {
        where: { vendorRating: { not: null } },
        select: { vendorRating: true }
      }
    }
  });

  return vendors.map(v => {
    const ratings = v.contracts.map(c => c.vendorRating).filter(Boolean);
    const avgRating = ratings.length > 0
      ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
      : null;
    return {
      id: v.id,
      name: v.name,
      phone: v.phone,
      category: v.category,
      contractCount: v._count.contracts,
      avgRating
    };
  });
}

/**
 * Find vendor by normalized name, or create a new one
 * Used during contract creation for auto-linking
 */
async function findOrCreate(name, phone = null, category = null) {
  if (!name || name.trim().length < 2) {
    throw new AppError('Vendor name must be at least 2 characters', 400);
  }

  const normalizedName = name.trim().toLowerCase();

  // Try to find by normalized name first
  let vendor = await prisma.vendor.findFirst({
    where: {
      OR: [
        { normalizedName: normalizedName },
        { name: { equals: name.trim(), mode: 'insensitive' } }
      ]
    }
  });

  if (vendor) {
    // Update phone if provided and not already set
    if (phone && !vendor.phone) {
      vendor = await prisma.vendor.update({
        where: { id: vendor.id },
        data: { phone }
      });
    }
    return { vendor, created: false };
  }

  // Create new vendor
  vendor = await prisma.vendor.create({
    data: {
      name: name.trim(),
      normalizedName,
      phone: phone || null,
      category: category || null,
      riskLevel: 'medium',
      isActive: true
    }
  });

  return { vendor, created: true };
}

async function getById(id) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: parseInt(id) },
    include: {
      contracts: {
        include: {
          project: { select: { id: true, name: true, code: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  
  if (!vendor) throw new AppError('Vendor not found', 404);

  // Compute avg rating
  const ratedContracts = vendor.contracts.filter(c => c.vendorRating != null);
  const avgRating = ratedContracts.length > 0
    ? parseFloat((ratedContracts.reduce((sum, c) => sum + c.vendorRating, 0) / ratedContracts.length).toFixed(1))
    : null;

  return { ...vendor, avgRating, ratedCount: ratedContracts.length, contractCount: vendor.contracts.length };
}

async function create(data, userId) {
  const normalizedName = data.name.trim().toLowerCase();

  const vendor = await prisma.vendor.create({
    data: {
      name: data.name,
      normalizedName,
      phone: data.phone || null,
      category: data.category,
      riskLevel: data.riskLevel || 'low',
      isActive: true
    }
  });

  if (userId) {
    await auditService.log(userId, 'CREATE_VENDOR', 'Vendor', vendor.id, { name: vendor.name });
  }

  return vendor;
}

async function update(id, data, userId) {
  const updateData = { ...data };
  if (data.name) {
    updateData.normalizedName = data.name.trim().toLowerCase();
  }

  const vendor = await prisma.vendor.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  if (userId) {
    await auditService.log(userId, 'UPDATE_VENDOR', 'Vendor', vendor.id, data);
  }

  return vendor;
}

async function remove(id, userId) {
  // Check for active contracts
  const activeContracts = await prisma.contract.count({
    where: { vendorId: parseInt(id), status: 'active' }
  });

  if (activeContracts > 0) {
    throw new AppError('Cannot delete vendor with active contracts', 400);
  }

  await prisma.vendor.delete({
    where: { id: parseInt(id) }
  });

  if (userId) {
    await auditService.log(userId, 'DELETE_VENDOR', 'Vendor', parseInt(id));
  }

  return true;
}

module.exports = {
  getAll,
  search,
  findOrCreate,
  getById,
  create,
  update,
  remove
};

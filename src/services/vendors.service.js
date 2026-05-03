/**
 * MCMS Service - Vendors
 * CRUD operations for vendor management
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const auditService = require('./audit.service');

async function getAll({ page = 1, limit = 20, search = '', category = '' }) {
  const skip = (page - 1) * limit;
  
  const where = {
    AND: [
      search ? { name: { contains: search, mode: 'insensitive' } } : {},
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
        _count: {
          select: { contracts: true }
        }
      }
    }),
    prisma.vendor.count({ where })
  ]);

  return { vendors, total, page, limit };
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
  return vendor;
}

async function create(data, userId) {
  const vendor = await prisma.vendor.create({
    data: {
      name: data.name,
      category: data.category,
      riskLevel: data.riskLevel || 'low',
      rating: data.rating || 5.0,
      isActive: true
    }
  });

  if (userId) {
    await auditService.log(userId, 'CREATE_VENDOR', 'Vendor', vendor.id, { name: vendor.name });
  }

  return vendor;
}

async function update(id, data, userId) {
  const vendor = await prisma.vendor.update({
    where: { id: parseInt(id) },
    data
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
  getById,
  create,
  update,
  remove
};

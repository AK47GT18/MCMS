/**
 * MCMS Service - Vendors
 * CRUD operations for vendor management
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

/**
 * Get all vendors with pagination
 */
async function getAll({ page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc', status }) {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};
  
  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.vendor.count({ where }),
  ]);
  
  return { vendors, total, page, limit };
}

/**
 * Get vendor by ID
 */
async function getById(id) {
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      contracts: {
        select: { id: true, refCode: true, title: true, status: true },
      },
      _count: { select: { requisitions: true } },
    },
  });
  
  if (!vendor) throw new AppError('Vendor not found', 404);
  return vendor;
}

/**
 * Create a new vendor
 */
async function create(data) {
  const vendor = await prisma.vendor.create({ data });
  logger.info('Vendor created', { vendorId: vendor.id });
  return vendor;
}

/**
 * Update vendor
 */
async function update(id, data) {
  await getById(id);
  const vendor = await prisma.vendor.update({ where: { id }, data });
  logger.info('Vendor updated', { vendorId: id });
  return vendor;
}

/**
 * Delete vendor
 */
async function remove(id) {
  await getById(id);
  await prisma.vendor.delete({ where: { id } });
  logger.info('Vendor deleted', { vendorId: id });
}

/**
 * Get approved vendors for selection
 */
async function getApproved() {
  return prisma.vendor.findMany({
    where: { status: 'approved' },
    select: { id: true, name: true, category: true },
    orderBy: { name: 'asc' },
  });
}

module.exports = { getAll, getById, create, update, remove, getApproved };

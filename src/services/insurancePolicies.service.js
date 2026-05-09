const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const auditService = require('./audit.service');

async function getAll() {
  return prisma.insurancePolicy.findMany({
    orderBy: { expiryDate: 'asc' }
  });
}

async function create(data, userId) {
  const policy = await prisma.insurancePolicy.create({ data });

  // Audit log
  await auditService.log({
    userId: userId,
    action: 'CREATE_INSURANCE_POLICY',
    targetType: 'InsurancePolicy',
    targetId: policy.id,
    targetCode: data.entityName,
    details: { entityName: data.entityName, type: data.documentType }
  });

  return policy;
}

async function update(id, data, userId) {
  const policy = await prisma.insurancePolicy.update({
    where: { id },
    data
  });

  // Audit log
  await auditService.log({
    userId: userId,
    action: 'UPDATE_INSURANCE_POLICY',
    targetType: 'InsurancePolicy',
    targetId: policy.id,
    targetCode: policy.entityName,
    details: data
  });

  return policy;
}

async function remove(id, userId) {
  await prisma.insurancePolicy.delete({ where: { id } });
  
  // Audit log
  await auditService.log({
    userId: userId,
    action: 'DELETE_INSURANCE_POLICY',
    targetType: 'InsurancePolicy',
    targetId: id
  });
}

module.exports = { getAll, create, update, remove };

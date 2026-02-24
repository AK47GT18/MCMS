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
  await auditService.log(
    userId, 'CREATE_INSURANCE_POLICY', 'InsurancePolicy', policy.id,
    { entityName: data.entityName, type: data.documentType }
  );

  return policy;
}

async function update(id, data, userId) {
  const policy = await prisma.insurancePolicy.update({
    where: { id },
    data
  });

  // Audit log
  await auditService.log(
    userId, 'UPDATE_INSURANCE_POLICY', 'InsurancePolicy', policy.id,
    data
  );

  return policy;
}

async function remove(id, userId) {
  await prisma.insurancePolicy.delete({ where: { id } });
  
  // Audit log
  await auditService.log(
    userId, 'DELETE_INSURANCE_POLICY', 'InsurancePolicy', id,
    {}
  );
}

module.exports = { getAll, create, update, remove };

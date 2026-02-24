const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const auditService = require('./audit.service');
const emailService = require('../emails/email.service');
const contractsService = require('./contracts.service');

async function getByContract(contractId) {
  return prisma.contractVersion.findMany({
    where: { contractId },
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { id: true, name: true, email: true } } }
  });
}

async function create(contractId, data, userId) {
  const contract = await contractsService.getById(contractId);
  if (!contract) throw new AppError('Contract not found', 404);

  // Get current max version
  const lastVersion = await prisma.contractVersion.findFirst({
    where: { contractId },
    orderBy: { versionNumber: 'desc' }
  });
  const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

  const version = await prisma.contractVersion.create({
    data: {
      contractId,
      versionNumber,
      refCode: data.refCode || `${contract.refCode}-V${versionNumber}`,
      title: data.title,
      value: data.value,
      status: data.status,
      changeNotes: data.changeNotes,
      createdById: userId
    }
  });

  // Audit log
  await auditService.log(
    userId, 'CREATE_CONTRACT_VERSION', 'ContractVersion', version.id,
    { contractId, versionNumber }
  );

  // Notify PM
  if (contract.project && contract.project.manager) {
    await emailService.sendNotification(
      contract.project.manager.email,
      'New Contract Version Uploaded',
      `A new version (V${versionNumber}) for contract ${contract.refCode} has been uploaded by user ID ${userId}. \nChange Notes: ${data.changeNotes || 'None'}`
    ).catch(e => console.error('Failed to notify PM', e));
  }

  return version;
}

module.exports = { getByContract, create };

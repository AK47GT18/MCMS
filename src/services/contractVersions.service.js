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

async function create(contractId, data, userId, file) {
  const contract = await contractsService.getById(contractId);
  if (!contract) throw new AppError('Contract not found', 404);

  // Get current max version
  const lastVersion = await prisma.contractVersion.findFirst({
    where: { contractId },
    orderBy: { versionNumber: 'desc' }
  });
  const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

  // If file is provided, use its info, otherwise stick to current contract info
  const documentUrl = file ? `/uploads/documents/${file.filename}` : contract.documentUrl;
  const fileName = file ? file.originalname : contract.fileName;

  const version = await prisma.contractVersion.create({
    data: {
      contractId,
      versionNumber,
      refCode: data.refCode || `${contract.refCode}-V${versionNumber}`,
      title: data.title || contract.title,
      value: data.value || contract.value,
      status: data.status || contract.status,
      documentUrl,
      fileName,
      changeNotes: data.changeNotes,
      createdById: userId
    }
  });

  // Sync main contract with latest version data (Value, Status, Dates, Document)
  const syncData = {
    value: data.value ? Number(data.value) : contract.value,
    status: data.status || contract.status,
    startDate: data.startDate ? new Date(data.startDate) : contract.startDate,
    endDate: data.endDate ? new Date(data.endDate) : contract.endDate,
    documentUrl,
    fileName
  };

  await prisma.contract.update({
    where: { id: contractId },
    data: syncData
  });

  // Audit log
  await auditService.log(
    userId, 'CREATE_CONTRACT_VERSION', 'ContractVersion', version.id,
    { contractId, versionNumber, fileName }
  );

  // Role-based Notifications (PM <-> FD)
  const creator = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, name: true } });
  
  if (creator?.role === 'Project_Manager') {
    // Notify all Finance Directors
    const fds = await prisma.user.findMany({ where: { role: 'Finance_Director' }, select: { email: true } });
    for (const fd of fds) {
      await emailService.sendNotification(
        fd.email,
        'New Contract Version by Project Manager',
        `A new version (V${versionNumber}) for contract ${contract.refCode} has been uploaded by PM ${creator.name}. \nChange Notes: ${data.changeNotes || 'None'}`
      ).catch(e => console.error('FD Version Notification failed', e));
    }
  } else if (creator?.role === 'Finance_Director') {
    // Notify the Project Manager
    if (contract.project && contract.project.manager && contract.project.manager.email) {
      await emailService.sendNotification(
        contract.project.manager.email,
        'New Contract Version by Finance Director',
        `A new version (V${versionNumber}) for contract ${contract.refCode} has been uploaded by FD ${creator.name}. \nChange Notes: ${data.changeNotes || 'None'}`
      ).catch(e => console.error('PM Version Notification failed', e));
    }
  }

  return version;
}

module.exports = { getByContract, create };

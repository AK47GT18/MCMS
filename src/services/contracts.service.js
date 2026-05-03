/**
 * MCMS Service - Contracts
 * CRUD operations for contract management
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const auditService = require('./audit.service');
const emailService = require('../emails/email.service');
const logger = require('../utils/logger');

async function getAll({ page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status }) {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};
  
  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      skip, take: limit, where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        project: { select: { id: true, code: true, name: true } },
        vendor: { select: { id: true, name: true } },
        versions: {
          include: { createdBy: { select: { name: true } } },
          orderBy: { versionNumber: 'desc' }
        },
        items: { select: { receivedQty: true } },
        _count: { select: { milestones: true } },
      },
    }),
    prisma.contract.count({ where }),
  ]);
  
  return { contracts, total, page, limit };
}

async function getById(id) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      project: { 
        include: { 
          manager: { select: { name: true, email: true } },
          roadSpecification: {
            include: {
              layers: true,
              accessories: true
            }
          }
        } 
      },
      milestones: { orderBy: { dueDate: 'asc' } },
      items: true,
      versions: { 
        include: { createdBy: { select: { name: true } } },
        orderBy: { versionNumber: 'asc' }
      }
    },
  });
  if (!contract) throw new AppError('Contract not found', 404);
  
  // If it's a project master agreement, we might want to map project materials to items
  if (contract.contractType === 'project' && contract.project?.roadSpecification) {
    const spec = contract.project.roadSpecification;
    const projectItems = [];
    
    spec.layers?.forEach(l => {
      projectItems.push({
        materialName: `${l.phaseName}: ${l.materialType}`,
        quantity: l.totalQuantity,
        unit: l.unit,
        unitPrice: l.unitCostHigh,
        totalCost: l.totalCostHigh || 0,
        isBaseline: true
      });
    });
    
    spec.accessories?.forEach(a => {
      projectItems.push({
        materialName: a.type,
        quantity: a.quantity,
        unit: a.unit || 'units',
        unitPrice: a.estimatedUnitCost,
        totalCost: a.totalValue || 0,
        isBaseline: true
      });
    });
    
    if (contract.items.length === 0) {
      contract.items = projectItems;
    }
  }

  return contract;
}

async function create(data, userId) {
  let materials = [];
  if (data.materialsList) {
    try {
      materials = JSON.parse(data.materialsList);
    } catch (e) {
      logger.error('Failed to parse materialsList', e);
    }
  }

  // Find or Create Vendor
  let vendorId = null;
  if (data.vendorName) {
    let vendor = await prisma.vendor.findUnique({ where: { name: data.vendorName } });
    if (!vendor) {
      vendor = await prisma.vendor.create({
        data: { name: data.vendorName, category: 'General', riskLevel: 'low', isActive: true }
      });
    }
    vendorId = vendor.id;
  }

  const contractData = {
    refCode: data.refCode,
    title: data.title || 'Untitled Contract',
    value: data.value ? Number(data.value) : null,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    contractType: data.contractType,
    vendorName: data.vendorName,
    projectId: data.projectId ? Number(data.projectId) : null,
    documentUrl: data.documentUrl,
    fileName: data.fileName,
    vendorId,
    items: materials.length > 0 ? {
      create: materials.map(m => ({
        materialName: m.name,
        quantity: m.quantity || 0,
        unit: m.unit || 'units',
        unitPrice: m.unitPrice || 0,
        totalCost: (m.quantity || 0) * (m.unitPrice || 0)
      }))
    } : undefined
  };
  
  const contract = await prisma.contract.create({
    data: contractData,
    include: { project: { select: { id: true, name: true, manager: { select: { email: true } } } }, items: true },
  });

  // Create Audit Log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CONTRACT_CREATED',
      targetType: 'Contract',
      targetId: contract.id,
      targetCode: contract.refCode,
      details: {
        title: contract.title,
        value: Number(contract.value),
        vendor: contract.vendorName,
        projectId: contract.projectId,
        itemCount: materials.length
      }
    }
  });
  
  // Create Initial Version
  const nextVersionNum = 1;
  await prisma.contractVersion.create({
    data: {
      contractId: contract.id,
      versionNumber: nextVersionNum,
      refCode: contract.refCode,
      title: contract.title,
      value: contract.value,
      status: contract.status,
      documentUrl: contract.documentUrl,
      fileName: contract.fileName,
      changeNotes: data.justification || 'Initial contract creation',
      createdById: userId
    }
  });

  logger.info('Contract created and version 1 stored', { contractId: contract.id, refCode: contract.refCode });
  
  if (userId) {
    await auditService.log(
      userId, 'CREATE_CONTRACT', 'Contract', contract.id,
      { refCode: contract.refCode }
    );
  }
  
  // Role-based Notifications (PM <-> FD)
  const creator = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, name: true } });
  
  if (creator?.role === 'Project_Manager') {
    // Notify all Finance Directors
    const fds = await prisma.user.findMany({ where: { role: 'Finance_Director' }, select: { email: true } });
    for (const fd of fds) {
      await emailService.sendNotification(
        fd.email,
        'Contract Created by Project Manager',
        `A new project contract ${contract.refCode} has been archived by PM ${creator.name}. \nJustification: ${data.justification || 'N/A'}`
      ).catch(e => logger.error('FD Notification failed', e));
    }
  } else if (creator?.role === 'Finance_Director') {
    // Notify the Project Manager
    if (contract.project && contract.project.manager && contract.project.manager.email) {
      await emailService.sendNotification(
        contract.project.manager.email,
        'Contract Created by Finance Director',
        `A new vendor contract ${contract.refCode} has been established by FD ${creator.name}. \nProject: ${contract.project.name}`
      ).catch(e => logger.error('PM Notification failed', e));
    }
  }
  
  return contract;
}

async function update(id, data, userId) {
  const existing = await prisma.contract.findUnique({
    where: { id },
    include: { 
      project: { select: { id: true, name: true, manager: { select: { email: true } } } },
      items: true
    }
  });
  if (!existing) throw new AppError('Contract not found', 404);

  // Financial Integrity: Check if contract is locked
  const isLocked = existing.items.some(item => Number(item.receivedQty) > 0);
  if (isLocked && !data.changeNotes?.startsWith('[VARIATION]')) {
    throw new AppError('Contract is locked due to active receipts. Updates must be submitted as a [VARIATION].', 403);
  }

  const contract = await prisma.contract.update({ where: { id }, data });
  
  // Create New Version
  const latestVersion = await prisma.contractVersion.findFirst({
    where: { contractId: id },
    orderBy: { versionNumber: 'desc' }
  });

  const nextVersionNum = (latestVersion?.versionNumber || 0) + 1;
  await prisma.contractVersion.create({
    data: {
      contractId: contract.id,
      versionNumber: nextVersionNum,
      refCode: contract.refCode,
      title: contract.title,
      value: contract.value,
      status: contract.status,
      changeNotes: data.changeNotes || `Contract details updated (v${nextVersionNum})`,
      createdById: userId
    }
  });

  logger.info('Contract updated and version record created', { contractId: id, version: nextVersionNum, isLocked });
  
  if (userId) {
    await auditService.log(userId, 'UPDATE_CONTRACT', 'Contract', id, { ...data, isLocked });
  }
  
  // Role-based Notifications (PM <-> FD)
  const creator = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, name: true } });
  
  if (creator?.role === 'Project_Manager') {
    // Notify all Finance Directors
    const fds = await prisma.user.findMany({ where: { role: 'Finance_Director' }, select: { email: true } });
    for (const fd of fds) {
      await emailService.sendNotification(
        fd.email,
        'Contract Updated by Project Manager',
        `Contract ${contract.refCode} has been modified by PM ${creator.name}. \nChange Version: V${nextVersionNum}`
      ).catch(e => logger.error('FD Update Notification failed', e));
    }
  } else if (creator?.role === 'Finance_Director') {
    // Notify the Project Manager
    if (existing.project && existing.project.manager && existing.project.manager.email) {
      await emailService.sendNotification(
        existing.project.manager.email,
        'Contract Updated by Finance Director',
        `Contract ${contract.refCode} has been updated by FD ${creator.name}. \nPlease review the latest version (V${nextVersionNum}).`
      ).catch(e => logger.error('PM Update Notification failed', e));
    }
  }
  
  return contract;
}

async function remove(id, userId) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { items: true }
  });
  
  if (!contract) throw new AppError('Contract not found', 404);

  // Financial Integrity Check
  const hasReceipts = contract.items.some(item => Number(item.receivedQty) > 0);
  if (hasReceipts) {
    throw new AppError('CRITICAL: Cannot delete contract with active material receipts. Financial trail must be preserved.', 403);
  }

  await prisma.contract.delete({ where: { id } });
  logger.info('Contract deleted', { contractId: id });
  
  if (userId) {
    await auditService.log(userId, 'DELETE_CONTRACT', 'Contract', id, {});
  }
}

async function approve(id, userId) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { project: { select: { id: true, name: true, manager: { select: { id: true, email: true } } } } }
  });

  if (!contract) throw new AppError('Contract not found', 404);

  // If contract is already active, don't re-approve
  if (contract.status === 'active') return contract;

  const updated = await prisma.contract.update({
    where: { id },
    data: { status: 'active' }
  });

  logger.info('Contract approved', { contractId: id, approvedBy: userId });

  if (userId) {
    await auditService.log(userId, 'APPROVE_CONTRACT', 'Contract', id, { previousStatus: contract.status });
  }

  // Notify CA or other stakeholders if needed
  // ... (email logic if required)

  return updated;
}

async function getByProject(projectId) {
  return prisma.contract.findMany({
    where: { projectId },
  });
}

/**
 * Check if a contract is locked based on receipts
 */
async function isContractLocked(id) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { items: true }
  });
  if (!contract) return false;
  return contract.items.some(item => Number(item.receivedQty) > 0);
}

module.exports = { 
  getAll, 
  getById, 
  create, 
  update, 
  remove, 
  approve, 
  getByProject,
  isContractLocked
};

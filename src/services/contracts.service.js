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
  
  // Map project road specification materials to contract items (for ANY contract linked to a project)
  if (contract.project?.roadSpecification) {
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
        materialName: a.itemName || a.type || 'Accessory',
        quantity: a.totalQuantity || a.quantity || 0,
        unit: a.unit || 'units',
        unitPrice: a.unitCostHigh || a.estimatedUnitCost || 0,
        totalCost: a.totalCostHigh || a.totalValue || 0,
        isBaseline: true
      });
    });
    
    if (contract.items.length === 0) {
      contract.items = projectItems;
    } else {
      // Retroactive fix: patch any items that were saved with 0 unitPrice
      contract.items = contract.items.map(dbItem => {
        const price = Number(dbItem.unitPrice || 0);
        if (price === 0) {
          // Try exact match first, then fuzzy match
          const baseline = projectItems.find(p => 
            p.materialName.trim().toLowerCase() === dbItem.materialName.trim().toLowerCase()
          ) || projectItems.find(p =>
            dbItem.materialName.toLowerCase().includes(p.materialName.split(':').pop().trim().toLowerCase()) ||
            p.materialName.toLowerCase().includes(dbItem.materialName.trim().toLowerCase())
          );
          if (baseline) {
            return { ...dbItem, unitPrice: baseline.unitPrice, totalCost: Number(baseline.unitPrice) * Number(dbItem.quantity || 0) };
          }
        }
        return dbItem;
      });
    }

    // Calculate actual market value from the project baseline for the specific items in this contract
    const marketValue = contract.items.reduce((sum, item) => {
      const baseline = projectItems.find(p => 
        p.materialName.trim().toLowerCase() === item.materialName.trim().toLowerCase()
      ) || projectItems.find(p =>
        item.materialName.toLowerCase().includes(p.materialName.split(':').pop().trim().toLowerCase()) ||
        p.materialName.toLowerCase().includes(item.materialName.trim().toLowerCase())
      );
      if (baseline) {
        return sum + (Number(baseline.unitPrice || 0) * Number(item.quantity || 0));
      }
      return sum + (Number(item.unitPrice || 0) * Number(item.quantity || 0));
    }, 0);
    
    contract.marketValue = marketValue > 0 ? marketValue : (spec.approvedTotal || spec.estimatedTotalHigh || 0);
  }

  // Surface justification from version history (V1 changeNotes) since it's not on the Contract model
  if (contract.versions && contract.versions.length > 0) {
    const v1 = contract.versions.find(v => v.versionNumber === 1);
    const notes = v1?.changeNotes;
    if (notes && notes !== 'Initial contract creation') {
      contract.justification = notes;
    }
  }

  // Fallback marketValue from project budget
  if (!contract.marketValue && contract.project) {
    contract.marketValue = Number(contract.project.budgetTotal || 0);
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

  // Find or Create Vendor (normalized matching)
  let vendorId = data.vendorId || null;
  if (!vendorId && data.vendorName) {
    const vendorService = require('./vendors.service');
    const { vendor } = await vendorService.findOrCreate(
      data.vendorName,
      data.vendorPhone || null,
      data.vendorCategory || 'General'
    );
    vendorId = vendor.id;
  } else if (vendorId && data.vendorPhone) {
    // If ID exists but phone was updated/provided in the form, update it
    const vendorService = require('./vendors.service');
    await vendorService.update(vendorId, { phone: data.vendorPhone });
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
        materialName: m.materialName || m.name, // Support both formats
        quantity: m.quantity || 0,
        unit: m.unit || 'units',
        unitPrice: m.unitPrice || 0,
        totalCost: (m.quantity || 0) * (m.unitPrice || 0)
      }))
    } : undefined,
    materialsList: materials.length > 0 ? JSON.stringify(materials) : '[]',
    status: 'active'
  };
  
  // Budget Check for Vendor Contracts
  let isOverBudget = false;
  let budgetUpliftReq = null;
  const isVendorContract = data.contractType !== 'project';
  
  if (isVendorContract && data.projectId && data.value) {
    const projectService = require('./projects.service');
    const project = await projectService.getById(Number(data.projectId));
    const available = Number(project.budgetTotal || 0) - Number(project.budgetSpent || 0);
    const contractValue = Number(data.value);
    
    if (contractValue > available) {
      isOverBudget = true;
      contractData.status = 'pending_approval';
    }
  }

  const contract = await prisma.contract.create({
    data: contractData,
    include: { project: { select: { id: true, name: true, managerId: true, manager: { select: { email: true } } } }, items: true },
  });

  // Handle Over-Budget Workflow
  if (isOverBudget) {
    const bcrService = require('./budgetChanges.service');
    const project = await prisma.project.findUnique({ where: { id: Number(data.projectId) } });
    const shortfall = Number(data.value) - (Number(project.budgetTotal) - Number(project.budgetSpent));
    
    budgetUpliftReq = await bcrService.create({
      bcrCode: `BCR-CTR-${contract.id}-${Date.now().toString().slice(-4)}`,
      projectId: Number(data.projectId),
      budgetCategory: 'Contract Fulfillment',
      currentAmount: project.budgetTotal,
      proposedAmount: Number(project.budgetTotal) + shortfall,
      amount: shortfall,
      justification: `Automated uplift request triggered by Vendor Contract "${contract.title}" which exceeds available budget by MWK ${shortfall.toLocaleString()}.`,
      requestedBy: userId,
      requesterRole: 'Finance Director',
      targetContractId: contract.id,
      status: 'Pending'
    });

    // Notify Operations Manager, Managing Director, and the assigned Project Manager
    const notifService = require('./notification.service');
    const alertData = {
      type: 'warning', icon: 'fa-money-bill-wave',
      title: 'Action Required: Budget Uplift',
      message: `Project "${project.name}" requires an uplift of MWK ${shortfall.toLocaleString()} to accommodate a new contract: ${contract.title}.`,
      projectId: project.id
    };

    await notifService.notifyRole('Operations_Manager', alertData);
    await notifService.notifyRole('Managing_Director', alertData);
    
    if (contract.project?.managerId) {
      await notifService.create({
        userId: contract.project.managerId,
        ...alertData
      });
    }
  } else if (isVendorContract && data.projectId && data.value) {
    // Deduct immediately if not over budget
    const projectService = require('./projects.service');
    await projectService.addToSpent(Number(data.projectId), Number(data.value));
  }

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

  // Note: Contract values are recorded as commitments, not immediate expenditures.
  // We do not deduct from budgetSpent here. Actual spending is tracked via requisitions and site logistics.
  
  // General Contract Creation Notifications
  const notifService = require('./notification.service');
  if (contract.project?.managerId && contract.project.managerId !== userId) {
    await notifService.create({
      userId: contract.project.managerId,
      type: 'info', icon: 'fa-file-contract',
      title: 'New Contract Created',
      message: `A new contract "${contract.title}" has been created for your project "${contract.project.name}".`
    });
  }

  // Notify Finance Director if they didn't create it
  const creator = await prisma.user.findUnique({ where: { id: userId } });
  if (creator && creator.role !== 'Finance_Director') {
    await notifService.notifyRole('Finance_Director', {
      type: 'info', icon: 'fa-file-contract',
      title: 'New Contract Registered',
      message: `Contract "${contract.title}" was registered by ${creator.name} (${creator.role}).`
    });
  }

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
  
  // 5. Enhanced Audit Logging & Cross-Module Notifications
  if (userId) {
    try {
      const creator = await prisma.user.findUnique({ 
        where: { id: userId },
        select: { id: true, name: true, role: true }
      });

      // Audit Trail
      await auditService.log(
        userId, 
        'CONTRACT_CREATED', 
        'Contract', 
        contract.id,
        { 
          refCode: contract.refCode,
          title: contract.title,
          value: Number(contract.value || 0),
          justification: data.justification,
          creatorRole: creator?.role
        }
      );

      // Email Notifications
      if (creator) {
        const dashboardUrl = `${env.FRONTEND_URL}/contracts`;
        
        if (creator.role === 'Project_Manager') {
          // Notify Finance Directors
          const fds = await prisma.user.findMany({ 
            where: { role: 'Finance_Director', isActive: true },
            select: { id: true, name: true, email: true }
          });
          
          for (const fd of fds) {
            await emailService.sendNotification(
              fd,
              'New Project Master Contract Archived',
              `Project Manager ${creator.name} has archived a new master agreement: "${contract.title}" for project "${contract.project?.name || 'N/A'}".`,
              dashboardUrl
            );
          }
        } else if (creator.role === 'Finance_Director') {
          // Notify Project Manager
          if (contract.project?.manager) {
            await emailService.sendNotification(
              contract.project.manager,
              'Contract Registered for Your Project',
              `Finance Director ${creator.name} has registered a new contract: "${contract.title}" for your project "${contract.project.name}".`,
              dashboardUrl
            );
          }
        }
      }
    } catch (notifyErr) {
      logger.error('Contract post-creation tasks failed', notifyErr);
    }
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

/**
 * Rate a vendor's performance on a specific contract
 * Only allowed when the contract is expired or cancelled
 */
async function rateVendor(contractId, { rating, comment }, userId) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { vendor: { select: { id: true, name: true } } }
  });

  if (!contract) throw new AppError('Contract not found', 404);
  if (!contract.vendorId) throw new AppError('This contract has no linked vendor', 400);
  const isEnded = contract.endDate && new Date(contract.endDate) <= new Date();
  const canRate = ['expired', 'cancelled', 'terminated'].includes(contract.status) || isEnded;

  if (!canRate) {
    throw new AppError('Vendor can only be rated after the contract has ended or been cancelled', 400);
  }

  if (contract.vendorRating) {
    throw new AppError('This contract has already been rated', 400);
  }
  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      vendorRating: parseInt(rating),
      ratingComment: comment || null,
      ratedAt: new Date(),
      status: contract.status === 'active' ? 'expired' : contract.status // Auto-close if it was active
    }
  });

  if (userId) {
    await auditService.log(userId, 'RATE_VENDOR', 'Contract', contractId, {
      vendorId: contract.vendorId,
      vendorName: contract.vendor?.name,
      rating,
      comment
    });
  }

  logger.info('Vendor rated on contract', { contractId, vendorId: contract.vendorId, rating });
  return updated;
}

/**
 * Terminate a contract, releasing undelivered materials and budget back to the project.
 */
async function terminate(contractId, { reason, receivedItems }, user) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { items: true, project: { select: { id: true, code: true, name: true } } }
  });

  if (!contract) throw new AppError('Contract not found', 404);
  if (['cancelled', 'expired'].includes(contract.status)) {
    throw new AppError(`Contract is already ${contract.status}`, 400);
  }

  let newTotalValue = 0;
  const txOps = [];
  const receivedMap = {};
  
  if (receivedItems && Array.isArray(receivedItems)) {
    for (const r of receivedItems) {
      receivedMap[r.id] = Number(r.receivedQty);
    }
  }

  const updatedItemsList = [];
  
  if (contract.items.length > 0) {
    for (const item of contract.items) {
      const received = receivedMap[item.id] || 0;
      if (received > Number(item.quantity)) {
        throw new AppError(`Received quantity for ${item.materialName} cannot exceed contracted quantity.`, 400);
      }
      
      const newCost = Number(item.unitPrice) * received;
      newTotalValue += newCost;

      txOps.push(prisma.contractItem.update({
        where: { id: item.id },
        data: { quantity: received, totalCost: newCost, receivedQty: received }
      }));
      
      updatedItemsList.push({
        name: item.materialName,
        quantity: received,
        unit: item.unit,
        unitPrice: Number(item.unitPrice)
      });
    }
  } else {
      // For general contracts without items, calculate a proportional value or assume 0
      newTotalValue = contract.value ? Number(contract.value) : 0;
  }

  const finalValue = contract.items.length > 0 ? newTotalValue : 0; // If there are items, we strictly use item total. Else, 0.
  const isCancelled = finalValue === 0;
  const newStatus = isCancelled ? 'cancelled' : 'terminated';

  txOps.push(prisma.contract.update({
    where: { id: contractId },
    data: {
      status: newStatus,
      value: finalValue,
      endDate: new Date(), 
      materialsList: updatedItemsList.length > 0 ? JSON.stringify(updatedItemsList) : '[]'
    }
  }));

  // Note: Since we no longer deduct contract value on creation, we don't return budget here.

  const nextVersionNum = (await prisma.contractVersion.count({ where: { contractId } })) + 1;
  txOps.push(prisma.contractVersion.create({
    data: {
      contractId: contract.id,
      versionNumber: nextVersionNum,
      refCode: contract.refCode,
      title: contract.title,
      value: finalValue,
      status: newStatus,
      changeNotes: `[TERMINATION] ${reason}`,
      createdById: user?.id
    }
  }));

  await prisma.$transaction(txOps);

  if (user?.id) {
    await auditService.log(user.id, 'TERMINATE_CONTRACT', 'Contract', contractId, {
      refCode: contract.refCode,
      reason,
      oldValue: Number(contract.value),
      newValue: finalValue,
      newStatus
    });
  }

  return { success: true, newStatus, finalValue };
}

module.exports = { 
  getAll, 
  getById, 
  create, 
  update, 
  remove, 
  approve, 
  getByProject,
  isContractLocked,
  rateVendor,
  terminate
};


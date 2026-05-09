/**
 * MCMS Service - Material Reconciliation (Stage 9)
 * Compares Budgeted vs Dispersed vs Consumed materials.
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');

/**
 * Generate a reconciliation report for a project
 * @param {number} projectId 
 */
async function getProjectReconciliation(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      roadSpecification: {
        include: {
          layers: true,
          accessories: true
        }
      },
      sectors: {
        include: {
          inventories: {
            include: {
              logs: true
            }
          }
        }
      }
    }
  });

  if (!project) throw new AppError('Project not found', 404);

  // 1. Map Budgeted Materials
  const budgeted = {};
  if (project.roadSpecification) {
    project.roadSpecification.layers.forEach(layer => {
      const key = layer.materialType.toLowerCase();
      if (!budgeted[key]) budgeted[key] = { name: layer.materialType, unit: layer.unit, quantity: 0 };
      budgeted[key].quantity += Number(layer.totalQuantity);
    });
    project.roadSpecification.accessories.forEach(acc => {
      const key = acc.itemName.toLowerCase();
      if (!budgeted[key]) budgeted[key] = { name: acc.itemName, unit: acc.unit, quantity: 0 };
      budgeted[key].quantity += Number(acc.totalQuantity);
    });
  }

  // 2. Map Dispersed and Consumed Materials from Sector Inventory
  const actuals = {};
  project.sectors.forEach(sector => {
    sector.inventories.forEach(inv => {
      const key = inv.materialName.toLowerCase();
      if (!actuals[key]) {
        actuals[key] = {
          name: inv.materialName,
          unit: inv.unit,
          dispersed: 0,
          consumed: 0,
          onHand: Number(inv.quantityOnHand)
        };
      }

      inv.logs.forEach(log => {
        if (log.type === 'IN') {
          actuals[key].dispersed += Number(log.quantity);
        } else if (log.type === 'OUT') {
          actuals[key].consumed += Number(log.quantity);
        }
      });
    });
  });

  // 3. Reconcile
  const reconciliation = [];
  const allMaterialKeys = new Set([...Object.keys(budgeted), ...Object.keys(actuals)]);

  allMaterialKeys.forEach(key => {
    const b = budgeted[key] || { name: key, unit: 'N/A', quantity: 0 };
    const a = actuals[key] || { name: key, unit: b.unit, dispersed: 0, consumed: 0, onHand: 0 };

    const variance = a.consumed - b.quantity;
    const wastage = a.dispersed > 0 ? (a.dispersed - a.consumed - a.onHand) : 0; // Dispersed - Consumed should be OnHand. Any loss is wastage.

    reconciliation.push({
      material: b.name || a.name,
      unit: b.unit || a.unit,
      budgeted: b.quantity,
      dispersed: a.dispersed,
      consumed: a.consumed,
      onHand: a.onHand,
      variance: variance,
      wastage: Math.max(0, wastage), // Potential theft or missing logs
      status: variance > 0 ? 'over_budget' : (variance < -0.1 * b.quantity ? 'under_utilized' : 'on_track')
    });
  });

  return {
    projectId: project.id,
    projectName: project.name,
    reconciliation
  };
}

/**
 * Approve and lock a reconciliation period
 * @param {number} projectId
 * @param {Object} approver - User object
 */
async function lockReconciliation(projectId, approver) {
  const auditService = require('./audit.service');
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) throw new AppError('Project not found', 404);

  // Generate the snapshot for auditing
  const report = await getProjectReconciliation(projectId);

  await auditService.log(
    approver.id,
    'LOCK_RECONCILIATION',
    'Project',
    projectId,
    { snapshot: report.reconciliation }
  );

  return { message: 'Reconciliation locked and audited successfully', projectId };
}

/**
 * Calculate financial impact of an asset incident based on estimated value and loss ratio.
 * @param {Object} asset - The asset involved
 * @param {Object} incidentData - { type, qtySent, qtyReceived, description }
 * @returns {Object} { financialHit, lossRatio, lossDescription }
 */
function calculateIncidentCost(asset, incidentData) {
  const estimatedValue = Number(asset.estimatedValue || 0);
  const { type, qtySent, qtyReceived } = incidentData;
  let lossRatio = 0;
  let lossDescription = '';

  switch (type) {
    case 'partial_damage':
    case 'damage': {
      const sent = Number(qtySent || 1);
      const received = Number(qtyReceived || 0);
      lossRatio = sent > 0 ? Math.max(0, (sent - received) / sent) : 0;
      lossDescription = `${sent - received} out of ${sent} units damaged/lost in transit`;
      break;
    }
    case 'theft': {
      lossRatio = 1.0;
      lossDescription = 'Asset reported as stolen — 100% loss';
      break;
    }
    case 'accident': {
      const sentAcc = Number(qtySent || 1);
      const receivedAcc = Number(qtyReceived || 0);
      lossRatio = sentAcc > 0 ? Math.max(0, (sentAcc - receivedAcc) / sentAcc) : 0.5;
      lossDescription = `Accident reported: ${receivedAcc} of ${sentAcc} units salvageable`;
      break;
    }
    case 'non_arrival': {
      lossRatio = 1.0;
      lossDescription = 'Asset/material never arrived at destination — full provisional loss';
      break;
    }
    default: {
      lossRatio = 0.5;
      lossDescription = `Unknown incident type: ${type}`;
    }
  }

  return { financialHit: Math.round(estimatedValue * lossRatio), lossRatio, lossDescription };
}

/**
 * Process a full incident reconciliation:
 * 1. Calculate financial hit from asset value and loss ratio
 * 2. Deduct from project budget
 * 3. Update asset status
 * 4. Create audit trail
 * 5. Notify PM, FD, EC
 * 6. Generate replenishment requisition for FD
 */
async function processIncident(assetId, reporterId, incidentData) {
  const logger = require('../utils/logger');
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: {
      currentProject: { select: { id: true, name: true, code: true, managerId: true, fieldSupervisorId: true } }
    }
  });

  if (!asset) throw new AppError('Asset not found', 404);

  const project = asset.currentProject;
  const { financialHit, lossRatio, lossDescription } = calculateIncidentCost(asset, incidentData);

  const reporter = await prisma.user.findUnique({
    where: { id: reporterId },
    select: { id: true, name: true, role: true }
  });

  // 1. Apply budget deduction if project exists and there's a financial impact
  if (project && financialHit > 0) {
    const projectService = require('./projects.service');
    await projectService.addToSpent(project.id, financialHit);
    logger.info('Incident financial hit applied to project budget', {
      assetId, projectId: project.id, financialHit, lossRatio
    });
  }

  // 2. Update asset status based on incident type
  let newAssetStatus = asset.status;
  if (incidentData.type === 'theft' || incidentData.type === 'non_arrival') {
    newAssetStatus = 'decommissioned';
  } else if (incidentData.type === 'accident' || incidentData.type === 'damage') {
    newAssetStatus = 'maintenance';
  }

  await prisma.asset.update({
    where: { id: assetId },
    data: {
      status: newAssetStatus,
      condition: lossRatio >= 0.5 ? 'Poor' : 'Fair',
      assetLogs: {
        create: {
          userId: reporterId,
          action: `incident_${incidentData.type}`,
          fuelLevelAtAction: -1
        }
      },
      maintenanceRecords: {
        create: {
          serviceDate: new Date(),
          type: 'incident',
          description: `[INCIDENT: ${incidentData.type.toUpperCase()}] ${incidentData.description || lossDescription}. Financial impact: MWK ${financialHit.toLocaleString()}. Dispatched by: ${incidentData.dispatchedBy || 'Unknown'}`
        }
      }
    }
  });

  // 3. Create audit trail
  await prisma.auditLog.create({
    data: {
      userId: reporterId,
      userName: reporter?.name,
      userRole: reporter?.role,
      action: 'ASSET_INCIDENT_REPORTED',
      targetType: 'Asset',
      targetId: assetId,
      targetCode: asset.assetCode,
      details: {
        incidentType: incidentData.type,
        assetName: asset.name,
        qtySent: incidentData.qtySent,
        qtyReceived: incidentData.qtyReceived,
        lossRatio, financialHit, lossDescription,
        projectId: project?.id,
        projectName: project?.name,
        dispatchedBy: incidentData.dispatchedBy,
        description: incidentData.description
      }
    }
  });

  // 4. Send notifications
  const notifService = require('./notification.service');
  const alertData = {
    type: 'error',
    icon: 'fa-exclamation-triangle',
    title: `Asset Incident: ${incidentData.type.replace(/_/g, ' ').toUpperCase()}`,
    message: `${asset.name} (${asset.assetCode}) — ${lossDescription}. Budget impact: MWK ${financialHit.toLocaleString()}. ${project ? `Project: ${project.name}` : ''}`
  };

  await notifService.notifyRole('Equipment_Coordinator', alertData);
  await notifService.notifyRole('Finance_Director', alertData);
  if (project?.managerId) await notifService.create({ userId: project.managerId, ...alertData });
  if (project?.fieldSupervisorId && project.fieldSupervisorId !== reporterId) {
    await notifService.create({ userId: project.fieldSupervisorId, ...alertData });
  }

  // 5. Generate replenishment requisition if significant loss
  let replenishmentReq = null;
  if (financialHit > 0 && project) {
    try {
      replenishmentReq = await prisma.requisition.create({
        data: {
          reqCode: `RPL-INC-${assetId}-${Date.now().toString().slice(-4)}`,
          projectId: project.id,
          notes: `[AUTO] Replenishment for incident on ${asset.name}: ${lossDescription}`,
          totalAmount: financialHit,
          status: 'pending',
          submittedBy: reporterId,
          items: {
            create: [{
              itemName: `Replacement: ${asset.name} (${asset.category || 'Equipment'})`,
              quantity: Math.max(1, Number(incidentData.qtySent || 1) - Number(incidentData.qtyReceived || 0)),
              unitPrice: Number(asset.estimatedValue || financialHit)
            }]
          }
        }
      });
      logger.info('Auto-generated replenishment requisition for incident', {
        requisitionId: replenishmentReq.id, assetId, projectId: project.id
      });
    } catch (reqErr) {
      logger.error('Failed to create replenishment requisition', reqErr);
    }
  }

  return {
    assetId, assetCode: asset.assetCode, assetName: asset.name,
    incidentType: incidentData.type, financialHit, lossRatio, lossDescription,
    newStatus: newAssetStatus, projectId: project?.id,
    replenishmentReqId: replenishmentReq?.id || null,
    replenishmentReqCode: replenishmentReq?.reqCode || null
  };
}

module.exports = {
  getProjectReconciliation,
  lockReconciliation,
  calculateIncidentCost,
  processIncident
};

const { PrismaClient } = require('@prisma/client');
const auditService = require('./audit.service');
const notifService = require('./notification.service');
const emailService = require('../emails/email.service');

const prisma = new PrismaClient();

const dispatchService = {
  /**
   * Dispatch resources (Materials or Assets) to a site
   * @param {Object} data { requisitionId, estimatedArrival, userId, userName, userRole }
   */
  async dispatch(data) {
    const { requisitionId, estimatedArrival, userId, userName, userRole } = data;

    const requisition = await prisma.requisition.findUnique({
      where: { id: parseInt(requisitionId) },
      include: { 
        items: true,
        project: {
          include: { fieldSupervisor: true }
        },
        submitter: { select: { id: true, name: true, email: true } }
      }
    });

    if (!requisition) throw new Error('Requisition not found');

    const updatedReq = await prisma.requisition.update({
      where: { id: parseInt(requisitionId) },
      data: {
        dispatchStatus: 'in_transit',
        estimatedArrival: new Date(estimatedArrival),
        status: 'approved',
        dispatchedBy: data.transporterName || userName,
        dispatchedPhone: data.userPhone || null,
        dispatchedAt: data.dispatchedAt ? new Date(data.dispatchedAt) : new Date()
      }
    });

    // Deduct materials from inventory upon dispatch
    try {
      const inventoryService = require('./inventory.service');
      for (const item of requisition.items) {
        // Try to deduct from the Central Yard (Project 1) first
        try {
          await inventoryService.consume({
            projectId: 1, 
            materialName: item.itemName,
            quantity: item.quantity,
            reference: updatedReq.reqCode || `DISPATCH-${requisitionId}`,
            notes: `Dispatched to ${requisition.project?.name || 'Site'}`
          }, { id: userId });
        } catch (yardErr) {
          // If not in Yard, find ANY sector that has this material and deduct from there
          const invRecord = await prisma.inventory.findFirst({
            where: {
              materialName: item.itemName,
              quantityOnHand: { gte: item.quantity }
            },
            orderBy: { quantityOnHand: 'desc' }
          });

          if (invRecord) {
            await prisma.inventory.update({
              where: { id: invRecord.id },
              data: { quantityOnHand: { decrement: item.quantity } }
            });
            await prisma.inventoryLog.create({
              data: {
                inventoryId: invRecord.id,
                userId: userId,
                type: 'OUT',
                quantity: item.quantity,
                reference: updatedReq.reqCode || `DISPATCH-${requisitionId}`,
                notes: `Auto-deducted from ${invRecord.sectorId} due to Yard shortage.`
              }
            });
          }
        }
      }
    } catch (invErr) {
      console.error('Inventory deduction on dispatch failed:', invErr.message);
    }

    // Audit log
    await auditService.log({
      userId,
      userName,
      userRole,
      action: data.partial ? 'PARTIAL_DISPATCH_ESCALATION' : 'DISPATCH_RESOURCES',
      targetType: 'REQUISITION',
      targetId: updatedReq.id,
      targetCode: updatedReq.reqCode,
      details: {
        estimatedArrival,
        isPartial: !!data.partial,
        dispatchedItems: data.dispatchedItems || requisition.items.map(i => `${i.quantity} x ${i.itemName}`),
        shortfalls: data.partial ? (data.shortfalls || 'Material shortage reported and escalated to FM') : null,
        escalation: data.partial ? 'Urgent Restock Request sent to Financial Manager (FM)' : null
      }
    });

    // In-app notification to Field Supervisor
    if (requisition.project?.fieldSupervisor) {
      await notifService.create({
        userId: requisition.project.fieldSupervisor.id,
        type: 'LOGISTICS',
        icon: 'fa-truck',
        title: 'Resources Dispatched',
        message: `Resources for ${requisition.project.name} are in transit. ETA: ${new Date(estimatedArrival).toLocaleString()}`,
      });

      // Email notification to Field Supervisor
      emailService.sendNotification(
        requisition.project.fieldSupervisor,
        'Resources Dispatched - In Transit',
        `Resources for ${requisition.project.name} have been dispatched and are in transit.\n\nRequisition: ${updatedReq.reqCode}\nItems: ${requisition.items.map(i => `${i.quantity} x ${i.itemName}`).join(', ')}\nEstimated Arrival: ${new Date(estimatedArrival).toLocaleString()}\n\nPlease confirm arrival when resources reach the site.`,
      ).catch(err => console.error('Dispatch email to FS failed:', err.message));
    }

    // Email notification to submitter (if different from FS)
    if (requisition.submitter && requisition.submitter.id !== requisition.project?.fieldSupervisor?.id) {
      emailService.sendNotification(
        requisition.submitter,
        'Your Resource Request is In Transit',
        `Your requisition ${updatedReq.reqCode} has been dispatched.\n\nItems: ${requisition.items.map(i => `${i.quantity} x ${i.itemName}`).join(', ')}\nETA: ${new Date(estimatedArrival).toLocaleString()}`,
      ).catch(err => console.error('Dispatch email to submitter failed:', err.message));
    }

    return updatedReq;
  },

  /**
   * Confirm arrival of resources at site
   */
  async confirmArrival(data) {
    const { requisitionId, userId, userName, userRole, notes, reference, receivedBy } = data;
    
    if (String(requisitionId).startsWith('RENT-')) {
      const contractId = parseInt(requisitionId.replace('RENT-', ''));
      const inventoryService = require('./inventory.service');
      
      const contract = await prisma.vehicleRentalContract.findUnique({
        where: { id: contractId },
        include: { project: true }
      });
      
      if (!contract) throw new Error('Rental contract not found');
      
      // Update status to on_site
      const updated = await prisma.vehicleRentalContract.update({
        where: { id: contractId },
        data: { status: 'on_site' }
      });

      // Also add to inventory for tracking/logs
      await inventoryService.distribute({
        sectorId: 1, 
        materialName: contract.machineType,
        unit: 'Day',
        quantity: 1,
        reference: contract.refCode,
        notes: `Rental machine ${contract.machineType} arrived and confirmed on site by ${userName}.`
      }, { id: userId });

      // Audit log
      await auditService.log({
        userId, userName, userRole,
        action: 'CONFIRM_ARRIVAL',
        targetType: 'VEHICLE_RENTAL',
        targetId: contractId,
        targetCode: contract.refCode,
        details: { machine: contract.machineType, project: contract.project.name }
      });

      return updated;
    }

    if (String(requisitionId).startsWith('SHIP-')) {
      const contractItemId = parseInt(requisitionId.replace('SHIP-', ''));
      const inventoryService = require('./inventory.service');
      
      // For contract items, we treat the arrival as a full fulfillment of the contract line item
      const contractItem = await prisma.contractItem.findUnique({
        where: { id: contractItemId },
        include: { contract: { include: { project: { include: { sectors: true } } } } }
      });
      
      if (!contractItem) throw new Error('Contract item not found');
      
      // Update the contract item received quantity
      await prisma.contractItem.update({
        where: { id: contractItemId },
        data: { receivedQty: contractItem.quantity } // Fully received
      });

      // Distribute to site inventory (Find project's first sector or fallback)
      const targetSector = contractItem.contract.project.sectors?.[0]?.id || 1;
      
      await inventoryService.distribute({
        sectorId: targetSector, 
        materialName: contractItem.itemName,
        unit: contractItem.unit,
        quantity: contractItem.quantity,
        reference: `CONT-${contractItem.contractId}`,
        notes: `Arrival confirmed by ${userName} (Contract Item Fulfillment).`
      }, { id: userId });

      // Audit log
      await auditService.log({
        userId, userName, userRole,
        action: 'CONFIRM_ARRIVAL',
        targetType: 'CONTRACT_ITEM',
        targetId: contractItemId,
        details: { material: contractItem.itemName, quantity: contractItem.quantity }
      });

      return { id: contractItemId, status: 'fulfilled' };
    }

    const requisition = await prisma.requisition.findUnique({
      where: { id: parseInt(requisitionId) },
      include: { 
        items: true,
        project: { include: { sectors: true } }
      }
    });

    if (!requisition) throw new Error('Requisition not found');

    const updatedReq = await prisma.requisition.update({
      where: { id: parseInt(requisitionId) },
      data: {
        dispatchStatus: 'arrived',
        status: 'fulfilled',
        notes: notes ? (requisition.notes ? `${requisition.notes}\nIntake Notes: ${notes} (Ref: ${reference || 'N/A'})` : notes) : requisition.notes
      }
    });

    // Distribute materials into site inventory on arrival
    try {
      const inventoryService = require('./inventory.service');
      for (const item of requisition.items) {
        await inventoryService.distribute({
          projectId: requisition.projectId,
          materialName: item.itemName,
          unit: item.unit || 'Units',
          quantity: item.quantity,
          reference: updatedReq.reqCode || `REQ-${requisitionId}`,
          notes: `Arrival confirmed by ${userName}. Added to site inventory.`,
          reqId: requisitionId
        }, { id: userId });
        console.log(`[CONFIRM] Added ${item.quantity} of ${item.itemName} to Project ${requisition.projectId}`);
      }
    } catch (invErr) {
      console.error('Inventory distribution on arrival failed:', invErr.message);
    }

    // Audit log
    await auditService.log({
      userId,
      userName,
      userRole,
      action: 'CONFIRM_ARRIVAL',
      targetType: 'REQUISITION',
      targetId: updatedReq.id,
      targetCode: updatedReq.reqCode,
      details: {
        items: requisition.items.map(i => `${i.quantity} x ${i.itemName}`),
        receivedBy: receivedBy || userName,
        deliveryNote: reference || 'N/A'
      }
    });

    // Notify EC that resources arrived
    await notifService.notifyRole('Equipment_Coordinator', {
      type: 'success',
      icon: 'fa-check-circle',
      title: 'Resources Arrived',
      message: `Supervisor ${userName} confirmed arrival of ${updatedReq.reqCode} at ${requisition.project.name}`
    });

    // Email notification to EC users
    try {
      const ecUsers = await prisma.user.findMany({ where: { role: 'Equipment_Coordinator' }, select: { name: true, email: true } });
      for (const ec of ecUsers) {
        emailService.sendNotification(
          ec,
          'Arrival Confirmed - Resources Received at Site',
          `Field Supervisor ${userName} has confirmed arrival of resources at ${requisition.project?.name}.\n\nRequisition: ${updatedReq.reqCode}\nItems: ${requisition.items.map(i => `${i.quantity} x ${i.itemName}`).join(', ')}\n\nInventory has been automatically updated.`,
        ).catch(err => console.error('Arrival email to EC failed:', err.message));
      }
    } catch (emailErr) {
      console.error('Failed to email EC on arrival:', emailErr.message);
    }

    return updatedReq;
  },

  /**
   * Confirm arrival with potential variance (shortages/damage)
   */
  async confirmArrivalVariance(data) {
    let { requisitionId, receivedItems, receivedBy, dispatchedBy, notes, reference, userId, userName, userRole } = data;
    
    if (String(requisitionId).startsWith('SHIP-')) {
      const contractItemId = parseInt(requisitionId.replace('SHIP-', ''));
      const inventoryService = require('./inventory.service');
      const reconciliationService = require('./reconciliation.service');
      
      const contractItem = await prisma.contractItem.findUnique({
        where: { id: contractItemId },
        include: { contract: { include: { project: true } } }
      });
      
      if (!contractItem) throw new Error('Contract item not found');
      
      const discrepancies = [];
      const qtySent = Number(contractItem.quantity);
      // Normalized items might only have one item in receivedItems
      const receivedItem = receivedItems[0]; 
      const qtyReceived = Number(receivedItem.receivedQty || 0);
      const variance = qtySent - qtyReceived;

      // Update contract item
      await prisma.contractItem.update({
        where: { id: contractItemId },
        data: { receivedQty: qtyReceived }
      });

      // Distribute what was received
      if (qtyReceived > 0) {
        await inventoryService.distribute({
          sectorId: 1,
          materialName: contractItem.itemName,
          unit: contractItem.unit,
          quantity: qtyReceived,
          reference: `CONT-${contractItem.contractId}`,
          notes: `Arrival confirmed by ${receivedBy} (with variance). Dispatched by ${dispatchedBy}.`
        }, { id: userId });
      }

      if (variance > 0) {
        discrepancies.push({
          itemName: contractItem.itemName,
          qtySent,
          qtyReceived,
          variance
        });

        await reconciliationService.processIncident({
          projectId: contractItem.contract.projectId,
          materialName: contractItem.itemName,
          type: 'damage',
          qtySent,
          qtyReceived,
          description: `Contract Intake Shortage: ${variance} units of ${contractItem.itemName}. Ref: CONT-${contractItem.contractId}`,
          dispatchedBy: dispatchedBy,
          reportedBy: userName,
          reporterId: userId
        });
      }

      return { id: contractItemId, discrepancies };
    }

    const requisition = await prisma.requisition.findUnique({
      where: { id: parseInt(requisitionId) },
      include: { 
        items: true,
        project: { include: { sectors: true } }
      }
    });

    if (!requisition) throw new Error('Requisition not found');

    const updatedReq = await prisma.requisition.update({
      where: { id: parseInt(requisitionId) },
      data: {
        dispatchStatus: 'arrived',
        status: 'fulfilled',
        notes: notes ? (requisition.notes ? `${requisition.notes}\nIntake Notes (Variance): ${notes} (Ref: ${reference || 'N/A'})` : notes) : requisition.notes
      }
    });

    const inventoryService = require('./inventory.service');
    const reconciliationService = require('./reconciliation.service');

    const discrepancies = [];
    
    for (const receivedItem of receivedItems) {
      const originalItem = requisition.items.find(i => String(i.id) === String(receivedItem.id));
      const qtySent = Number(originalItem?.quantity || 0);
      const qtyReceived = Number(receivedItem.qtyReceived || 0);
      const variance = qtySent - qtyReceived;

      // Add to site inventory (only what was actually received)
      if (qtyReceived > 0) {
        await inventoryService.distribute({
          projectId: requisition.projectId,
          materialName: receivedItem.itemName,
          unit: receivedItem.unit || originalItem?.unit || 'Units',
          quantity: qtyReceived,
          reference: updatedReq.reqCode || `REQ-${requisitionId}`,
          notes: `Intake confirmed by ${receivedBy}. Dispatched by ${dispatchedBy}.`,
          dispatchedBy: dispatchedBy
        }, { id: userId });
        console.log(`[VARIANCE] Added ${qtyReceived} of ${receivedItem.itemName} to Project ${requisition.projectId}`);
      }

      // Handle variance
      if (variance > 0) {
        discrepancies.push({
          itemName: receivedItem.itemName,
          qtySent,
          qtyReceived,
          variance,
          unitPrice: Number(receivedItem.unitPrice || 0)
        });

        // Trigger financial reconciliation for the shortfall
        await reconciliationService.processIncident({
          projectId: requisition.projectId,
          assetId: null, // Material incident
          materialName: receivedItem.itemName,
          type: 'damage', // Categorize as damage/loss
          qtySent,
          qtyReceived,
          estimatedValue: Number(receivedItem.unitPrice || 0) * qtySent,
          description: `Intake Shortage: ${variance} units of ${receivedItem.itemName} missing from ${updatedReq.reqCode}. Dispatched by ${dispatchedBy}. Received by ${receivedBy}.`,
          dispatchedBy: dispatchedBy,
          reportedBy: userName,
          reporterId: userId
        });
      }
    }

    // Audit log
    await auditService.log({
      userId,
      userName,
      userRole,
      action: 'CONFIRM_ARRIVAL_VARIANCE',
      targetType: 'REQUISITION',
      targetId: updatedReq.id,
      targetCode: updatedReq.reqCode,
      details: {
        receivedBy,
        dispatchedBy,
        deliveryNote: reference || 'N/A',
        items: receivedItems.map(i => `${i.qtyReceived}/${i.qtySent} x ${i.itemName}`),
        hasDiscrepancies: discrepancies.length > 0,
        discrepancies
      }
    });

    // Notify EC that resources arrived with variance
    await notifService.notifyRole('Equipment_Coordinator', {
      type: discrepancies.length > 0 ? 'warning' : 'success',
      icon: discrepancies.length > 0 ? 'fa-exclamation-triangle' : 'fa-check-circle',
      title: discrepancies.length > 0 ? 'Arrival with Variance' : 'Resources Arrived',
      message: `Supervisor ${userName} confirmed arrival of ${updatedReq.reqCode} with ${discrepancies.length} discrepancies at ${requisition.project.name}`
    });

    // Email notification to EC users
    try {
      const ecUsers = await prisma.user.findMany({ where: { role: 'Equipment_Coordinator' }, select: { name: true, email: true } });
      for (const ec of ecUsers) {
        emailService.sendNotification(
          ec,
          discrepancies.length > 0 ? 'Variance Reported - Resources Received at Site' : 'Arrival Confirmed - Resources Received at Site',
          `Field Supervisor ${userName} has confirmed arrival of resources at ${requisition.project?.name} with ${discrepancies.length > 0 ? 'VARIANCE' : 'full delivery'}.\n\nRequisition: ${updatedReq.reqCode}\nDiscrepancies: ${discrepancies.length > 0 ? discrepancies.map(d => `${d.itemName}: Received ${d.qtyReceived} (Expected ${d.qtySent})`).join(', ') : 'None'}\nNotes: ${notes || 'No notes provided.'}\n\nInventory has been updated based on actual received quantities.`,
        ).catch(err => console.error('Arrival variance email to EC failed:', err.message));
      }
    } catch (emailErr) {
      console.error('Failed to email EC on arrival variance:', emailErr.message);
    }

    return { requisition: updatedReq, discrepancies };
  }
};

module.exports = dispatchService;

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
        dispatchedBy: userName,
        dispatchedPhone: data.userPhone || null
      }
    });

    // Deduct materials from Yard inventory (Sector 1) upon dispatch
    try {
      const inventoryService = require('./inventory.service');
      for (const item of requisition.items) {
        await inventoryService.distribute({
          sectorId: 1, // Dispatching FROM the Yard
          materialName: item.itemName,
          unit: 'Units',
          quantity: -item.quantity, // Negative quantity to DEDUCT
          reference: updatedReq.reqCode || `DISPATCH-${requisitionId}`,
          notes: `Dispatched to ${requisition.project?.name || 'Site'}`
        }, { id: userId });
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
  async confirmArrival(requisitionId, userId, userName, userRole) {
    const requisition = await prisma.requisition.findUnique({
      where: { id: parseInt(requisitionId) },
      include: { 
        items: true,
        project: true
      }
    });

    if (!requisition) throw new Error('Requisition not found');

    const updatedReq = await prisma.requisition.update({
      where: { id: parseInt(requisitionId) },
      data: {
        dispatchStatus: 'arrived',
        status: 'fulfilled'
      }
    });

    // Distribute materials into site inventory on arrival
    try {
      const inventoryService = require('./inventory.service');
      for (const item of requisition.items) {
        await inventoryService.distribute({
          sectorId: 1,
          materialName: item.itemName,
          unit: 'Units',
          quantity: item.quantity,
          reference: updatedReq.reqCode || `REQ-${requisitionId}`,
          notes: `Arrival confirmed by ${userName}. Added to site inventory.`
        }, { id: userId });
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
        items: requisition.items.map(i => `${i.quantity} x ${i.itemName}`)
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
    const { requisitionId, receivedItems, receivedBy, dispatchedBy, notes, userId, userName, userRole } = data;

    const requisition = await prisma.requisition.findUnique({
      where: { id: parseInt(requisitionId) },
      include: { 
        items: true,
        project: true
      }
    });

    if (!requisition) throw new Error('Requisition not found');

    const updatedReq = await prisma.requisition.update({
      where: { id: parseInt(requisitionId) },
      data: {
        dispatchStatus: 'arrived',
        status: 'fulfilled',
        notes: notes ? (requisition.notes ? `${requisition.notes}\nIntake Notes: ${notes}` : notes) : requisition.notes
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
          sectorId: 1, // Defaulting to site sector 1 for simplicity in this flow
          materialName: receivedItem.itemName,
          unit: 'Units',
          quantity: qtyReceived,
          reference: updatedReq.reqCode || `REQ-${requisitionId}`,
          notes: `Intake confirmed by ${receivedBy}. Dispatched by ${dispatchedBy}.`,
          dispatchedBy: dispatchedBy
        }, { id: userId });
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

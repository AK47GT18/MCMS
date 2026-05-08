const cron = require('node-cron');
const { prisma } = require('../config/database');
const emailService = require('../emails/email.service');
const logger = require('../utils/logger');
const vehicleRentalService = require('../services/vehicleRental.service');
const contractExpiryCron = require('../cron/contractExpiry.cron');

/**
 * Initialize all project-related cron jobs
 */
function initProjectJobs() {
  logger.info('Initializing project cron jobs...');
  
  // Initialize vehicle rental expiry cron
  contractExpiryCron.init();

  // Run every day at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running daily check for project due dates (10-day reminder)...');
    
    try {
      // Calculate the target date (10 days from now)
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 10);
      
      // Set to start and end of that specific day to catch all times if time is used
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Find active projects ending in exactly 10 days
      const projectsDue = await prisma.project.findMany({
        where: {
          status: { in: ['active', 'in_progress'] },
          endDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          manager: {
            select: { name: true, email: true }
          }
        }
      });

      if (projectsDue.length === 0) {
        logger.info('No projects due in exactly 10 days.');
        return;
      }

      // Fetch the other involved roles
      const rolesToNotify = ['Finance_Director', 'Contract_Administrator', 'Equipment_Coordinator'];
      const usersToNotify = await prisma.user.findMany({
        where: { role: { in: rolesToNotify } },
        select: { email: true, name: true }
      });

      for (const project of projectsDue) {
        const parties = [...usersToNotify];
        
        // Include project manager explicitly if not already in the list
        if (project.manager?.email && !parties.some(p => p.email === project.manager.email)) {
          parties.push({ email: project.manager.email, name: project.manager.name });
        }

        const reminderPromises = parties.map(party => 
          emailService.send({
            to: party.email,
            subject: `Action Required: Project "${project.name}" due in 10 Days`,
            html: `
              <h1>Project Deadline Approaching</h1>
              <p>The project <strong>${project.name}</strong> (${project.code}) is scheduled to be completed on <strong>${project.endDate.toLocaleDateString()}</strong>, which is in exactly 10 days.</p>
              <p>Please ensure all final tasks, equipment returns, logs, and financial reconciliations are being prepared.</p>
            `
          }).catch(err => logger.error('Failed due date reminder email', { email: party.email, error: err.message }))
        );
        
        await Promise.all(reminderPromises);
        logger.info(`Sent 10-day reminders for project ${project.code}`);
      }
    } catch (error) {
      logger.error('Error running 10-day due date cron job:', error);
    }
  });
  
  // Inventory Threshold Check - Run every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    logger.info('Running inventory threshold scan...');
    try {

      const allInventory = await prisma.inventory.findMany({
        include: { sector: { include: { project: { include: { manager: true } } } } }
      });

      const lowStock = allInventory.filter(inv => {
        const qty = Number(inv.quantityOnHand);
        const threshold = Number(inv.lowThreshold);
        const total = Number(inv.totalQtyAllocated || 0);
        
        return (threshold > 0 && qty <= threshold) || (total > 0 && qty <= (total * 0.2));
      });

      if (lowStock.length > 0) {
        logger.warn(`Found ${lowStock.length} low stock items during scan.`);
        // Notify respective managers
        for (const inv of lowStock) {
          const pm = inv.sector?.project?.manager;
          if (pm && pm.email) {
            await emailService.sendNotification(
              pm,
              `INVENTORY ALERT: ${inv.materialName} is low`,
              `Automated scan detected low stock for ${inv.materialName} in Sector ${inv.sector.name} of ${inv.sector.project.name}. Current quantity: ${inv.quantityOnHand} ${inv.unit}.`
            );
          }
        }
      }
    } catch (error) {
      logger.error('Error running inventory cron job:', error);
    }
  });

  // Contract End Reminders - Run every day at 08:30 AM (1 day before)
  cron.schedule('30 8 * * *', async () => {
    logger.info('Running daily check for contract end dates (1-day reminder)...');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const startOfDay = new Date(tomorrow);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(tomorrow);
      endOfDay.setHours(23, 59, 59, 999);

      const contractsEnding = await prisma.contract.findMany({
        where: {
          status: { in: ['active', 'draft'] },
          endDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          project: {
            include: {
              manager: true,
              fieldSupervisor: true
            }
          }
        }
      });

      if (contractsEnding.length === 0) {
        logger.info('No contracts ending in exactly 1 day.');
        return;
      }

      const rolesToNotify = ['Finance_Director', 'Contract_Administrator', 'Equipment_Coordinator'];
      const globalUsers = await prisma.user.findMany({
        where: { role: { in: rolesToNotify } },
        select: { email: true, name: true }
      });

      for (const contract of contractsEnding) {
        const recipients = [...globalUsers];
        
        // Add PM if assigned
        if (contract.project?.manager?.email) {
          recipients.push({ email: contract.project.manager.email, name: contract.project.manager.name });
        }
        // Add FS if assigned
        if (contract.project?.fieldSupervisor?.email) {
          recipients.push({ email: contract.project.fieldSupervisor.email, name: contract.project.fieldSupervisor.name });
        }

        // De-duplicate recipients
        const uniqueRecipients = Array.from(new Set(recipients.map(r => r.email)))
          .map(email => recipients.find(r => r.email === email));

        const emailPromises = uniqueRecipients.map(recipient => 
          emailService.send({
            to: recipient.email,
            subject: `URGENT: Contract "${contract.title}" Ends Tomorrow`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background: #f97316; padding: 20px; color: white;">
                  <h2 style="margin: 0;">Contract Ending Tomorrow</h2>
                </div>
                <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
                  <p>Hello <strong>${recipient.name}</strong>,</p>
                  <p>This is an automated reminder that the following contract is scheduled to end on <strong>${contract.endDate.toLocaleDateString()}</strong> (Tomorrow):</p>
                  
                  <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
                    <div style="font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Contract Reference</div>
                    <div style="font-size: 18px; font-weight: 800; margin-bottom: 12px;">${contract.refCode || 'CTR-' + contract.id}</div>
                    
                    <div style="font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Title</div>
                    <div style="font-weight: 700;">${contract.title}</div>
                    
                    <div style="margin-top: 12px; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Vendor</div>
                    <div style="font-weight: 700;">${contract.vendorName || 'N/A'}</div>
                  </div>

                  <p><strong>Action Required:</strong></p>
                  <ul>
                    <li>Perform a final performance rating for the vendor.</li>
                    <li>Verify all material deliveries are completed.</li>
                    <li>Ensure all retention amounts are correctly calculated.</li>
                    <li>Initiate renewal or extension if work is ongoing.</li>
                  </ul>
                  
                  <p>Please log in to the MCMS Contract Registry to take action.</p>
                </div>
              </div>
            `
          }).catch(err => logger.error('Failed contract end reminder email', { email: recipient.email, error: err.message }))
        );
        
        await Promise.all(emailPromises);
        logger.info(`Sent 1-day reminders for contract ${contract.refCode || contract.id}`);
      }
    } catch (error) {
      logger.error('Error running contract 1-day reminder cron job:', error);
    }
  });
}

module.exports = {
  initProjectJobs
};

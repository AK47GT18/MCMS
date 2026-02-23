const cron = require('node-cron');
const { prisma } = require('../config/database');
const emailService = require('../emails/email.service');
const logger = require('../utils/logger');

/**
 * Initialize all project-related cron jobs
 */
function initProjectJobs() {
  logger.info('Initializing project cron jobs...');

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
}

module.exports = {
  initProjectJobs
};

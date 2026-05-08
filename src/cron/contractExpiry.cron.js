/**
 * MCMS - Contract Expiry Cron Job
 * Checks daily for expiring vehicle rental contracts and notifies key personnel.
 */

const cron = require('node-cron');
const vehicleRentalService = require('../services/vehicleRental.service');
const emailService = require('../emails/email.service');
const logger = require('../utils/logger');
const { prisma } = require('../config/database');

/**
 * Initialize and schedule the cron jobs
 */
function init() {
  // Run daily at 6:00 AM
  cron.schedule('0 6 * * *', async () => {
    logger.info('[CRON] Running Vehicle Rental Expiry checks...');
    await runChecks();
  });

  logger.info('[CRON] Vehicle Rental Expiry checks scheduled for 06:00 daily.');
}

/**
 * Perform all expiry checks
 */
async function runChecks() {
  try {
    // 1. Warning: expires in 7 days
    await checkExpiringSoon(7);

    // 2. Warning: expires tomorrow
    await checkExpiringSoon(1);

    // 3. Auto-expire and notify for today
    await checkExpiredToday();

    // 4. Overdue escalation (3 days past)
    await checkOverdue(3);
    
  } catch (error) {
    logger.error('[CRON] Error during vehicle rental expiry checks:', error);
  }
}

/**
 * Notify about contracts expiring in N days
 */
async function checkExpiringSoon(days) {
  const contracts = await vehicleRentalService.getExpiringContracts(days);
  if (contracts.length === 0) return;

  for (const contract of contracts) {
    logger.info(`[CRON] Notifying expiry in ${days} days for ${contract.refCode}`);
    
    // Fetch ECs and FDs
    const recipients = await prisma.user.findMany({
      where: { role: { in: ['Finance_Director', 'Equipment_Coordinator'] }, isActive: true },
      select: { email: true, name: true }
    });

    const subject = `EXPIRY WARNING: Vehicle Contract ${contract.refCode}`;
    const message = `
      <h1>Vehicle Contract Expiry Warning</h1>
      <p>The contract for <strong>${contract.machineType}</strong> (${contract.refCode}) for project <strong>${contract.project.name}</strong> is set to expire on ${new Date(contract.endDate).toDateString()}.</p>
      <p>Please coordinate with the Field Supervisor to either renew the contract or arrange for machine return.</p>
    `;

    for (const recipient of recipients) {
      await emailService.send({ to: recipient.email, subject, html: message });
    }
  }
}

/**
 * Auto-expire contracts whose endDate has passed and notify return
 */
async function checkExpiredToday() {
  const expiredCount = await vehicleRentalService.autoExpireContracts();
  if (expiredCount === 0) return;

  logger.info(`[CRON] ${expiredCount} contracts auto-expired today.`);

  // Find contracts that just expired (status 'expired' but updatedAt is today)
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const justExpired = await prisma.vehicleRentalContract.findMany({
    where: { status: 'expired', updatedAt: { gte: today } },
    include: { 
      project: { include: { fieldSupervisor: true } } 
    }
  });

  for (const contract of justExpired) {
    const fs = contract.project.fieldSupervisor;
    
    // Notify FS to Return
    if (fs && fs.email) {
      await emailService.send({
        to: fs.email,
        subject: `ACTION REQUIRED: Return Vehicle ${contract.refCode}`,
        html: `
          <h1>Contract Expired - Please Return Vehicle</h1>
          <p>The rental contract for <strong>${contract.machineType}</strong> (${contract.refCode}) has expired today.</p>
          <p>Please ensure the machine is available at the project site for collection by the Equipment Coordinator.</p>
        `
      });
    }

    // Notify EC to Collect
    const ecs = await prisma.user.findMany({
      where: { role: 'Equipment_Coordinator', isActive: true },
      select: { email: true, name: true }
    });

    for (const ec of ecs) {
      await emailService.send({
        to: ec.email,
        subject: `COLLECTION REQUIRED: Vehicle ${contract.refCode}`,
        html: `
          <h1>Contract Expired - Collect Vehicle</h1>
          <p>The contract for <strong>${contract.machineType}</strong> (${contract.refCode}) at project <strong>${contract.project.name}</strong> has expired.</p>
          <p>Please coordinate collection from site and return to the vendor: <strong>${contract.vendorName}</strong>.</p>
        `
      });
    }
  }
}

/**
 * Escalate overdue contracts
 */
async function checkOverdue(daysPast) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysPast);
  targetDate.setHours(23, 59, 59, 999);

  const overdue = await prisma.vehicleRentalContract.findMany({
    where: {
      status: 'expired',
      endDate: { lte: targetDate }
    },
    include: { project: true }
  });

  for (const contract of overdue) {
    logger.warn(`[CRON] Contract ${contract.refCode} is OVERDUE for return.`);
    
    const fds = await prisma.user.findMany({
      where: { role: 'Finance_Director', isActive: true },
      select: { email: true, name: true }
    });

    for (const fd of fds) {
      await emailService.send({
        to: fd.email,
        subject: `OVERDUE ESCALATION: Vehicle ${contract.refCode}`,
        html: `
          <h1 style="color: red;">OVERDUE: Vehicle Not Returned</h1>
          <p>The vehicle <strong>${contract.machineType}</strong> (${contract.refCode}) from vendor <strong>${contract.vendorName}</strong> is still marked as expired/not-returned <strong>${daysPast} days</strong> past the deadline.</p>
          <p>Project: ${contract.project.name}</p>
          <p>Please investigate to avoid additional vendor charges.</p>
        `
      });
    }
  }
}

module.exports = { init };

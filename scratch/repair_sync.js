const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const dailyLogsService = require('../src/services/dailyLogs.service');

async function main() {
  // Find the log for M4 road that was approved
  const log = await prisma.dailyLog.findFirst({
    where: { id: 2 }
  });

  if (!log) {
    console.log('No matching log found to repair');
    return;
  }

  console.log('Repairing log ID:', log.id);

  // Set activePhase to PHASE_1 (since it's the first log of the project usually)
  await prisma.dailyLog.update({
    where: { id: log.id },
    data: { activePhase: 'PHASE_1' }
  });

  console.log('Log repaired. Re-triggering approval logic to sync Gantt...');
  
  // We need to trigger the logic inside approve(). 
  // Since it's already approved, I'll just manually call the phase completion logic part or call approve again.
  // Actually, I'll just call the service's approve method. It will re-approve it which is fine.
  await dailyLogsService.approve(log.id, log.submittedBy); // Use submitter as approver for script purposes

  console.log('Success! Project and Tasks should now be updated.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

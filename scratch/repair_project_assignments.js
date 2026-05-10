const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function repair() {
  try {
    console.log('--- REPAIRING PROJECT ASSIGNMENTS ---');
    
    // 1. Get Sarah and Chisomo
    const sarah = await prisma.user.findFirst({ where: { name: 'Sarah Jenkins' } });
    const chisomo = await prisma.user.findFirst({ where: { name: 'Chisomo Mwale' } });
    
    if (!sarah || !chisomo) {
      console.error('Sarah or Chisomo not found!');
      return;
    }
    
    console.log(`Sarah ID: ${sarah.id}, Chisomo ID: ${chisomo.id}`);
    
    // 2. Update Project 31 (M4 road)
    // Currently managerId is 103 (Chisomo), it should be 1 (Sarah)
    // fieldSupervisorId is null, it should be 103 (Chisomo)
    const updated = await prisma.project.update({
      where: { id: 31 },
      data: {
        managerId: sarah.id,
        fieldSupervisorId: chisomo.id
      }
    });
    
    console.log(`Project 31 ("${updated.name}") updated:`);
    console.log(`- Manager: Sarah Jenkins (ID ${sarah.id})`);
    console.log(`- Field Supervisor: Chisomo Mwale (ID ${chisomo.id})`);
    
    console.log('--- SYNCING ISSUE ---');
    // Ensure the issue reported by Chisomo is now visible to Sarah
    const issue = await prisma.issue.findUnique({ where: { id: 26 } });
    if (issue) {
      console.log(`Issue #26 context: Project ${issue.projectId}, Reporter ${issue.reportedBy}`);
      console.log('Sarah should now see this issue in her Governance Alerts.');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

repair();

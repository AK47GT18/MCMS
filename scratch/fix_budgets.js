const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- RECALCULATING PROJECT BUDGETS (REQUISITIONS + VENDOR CONTRACTS) ---');
  const projects = await prisma.project.findMany();
  
  for (const project of projects) {
    // 1. Requisitions (Approved/Fulfilled)
    const requisitions = await prisma.requisition.findMany({
      where: {
        projectId: project.id,
        status: { in: ['approved', 'fulfilled'] }
      }
    });
    const reqSpent = requisitions.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);

    // 2. Vendor Contracts (Active/Expired/Terminated)
    // Exclude 'project' type contracts as they represent the budget source
    const vendorContracts = await prisma.contract.findMany({
      where: {
        projectId: project.id,
        contractType: { not: 'project' },
        status: { in: ['active', 'expired', 'terminated'] }
      }
    });
    const contractSpent = vendorContracts.reduce((sum, c) => sum + Number(c.value || 0), 0);
    
    const totalCorrectSpent = reqSpent + contractSpent;
    
    if (project.budgetSpent !== totalCorrectSpent) {
      console.log(`Updating Project ${project.code}:`);
      console.log(`  - Name: ${project.name}`);
      console.log(`  - Requisitions: ${reqSpent.toLocaleString()}`);
      console.log(`  - Vendor Contracts: ${contractSpent.toLocaleString()}`);
      console.log(`  - Old Total Spent: ${project.budgetSpent.toLocaleString()}`);
      console.log(`  - New Total Spent: ${totalCorrectSpent.toLocaleString()}`);
      
      await prisma.project.update({
        where: { id: project.id },
        data: { budgetSpent: totalCorrectSpent }
      });
    } else {
      console.log(`Project ${project.code} budget already consistent.`);
    }
  }
  console.log('--- SYNC COMPLETE ---');
}

main()
  .catch(err => {
    console.error('Error syncing budgets:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

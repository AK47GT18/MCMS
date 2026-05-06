const { prisma } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function syncProjectBudgets() {
  logger.info('Starting full budget reconciliation...');
  
  try {
    const projects = await prisma.project.findMany();
    
    for (const project of projects) {
      // 1. Calculate sum of all active/ended vendor contracts
      const contracts = await prisma.contract.findMany({
        where: {
          projectId: project.id,
          status: { in: ['active', 'expired', 'terminated'] }
        },
        select: { value: true, contractType: true }
      });
      
      const vendorContracts = contracts.filter(c => c.contractType !== 'project' && c.contractType !== 'client');
      const totalContractValue = vendorContracts.reduce((sum, c) => sum + Number(c.value || 0), 0);
      
      // 2. Calculate sum of all approved/fulfilled requisitions 
      // (Assuming these are for expenses NOT covered by contracts, 
      // or we just want a total snapshot of expenditures)
      const requisitions = await prisma.requisition.findMany({
        where: {
          projectId: project.id,
          status: { in: ['approved', 'fulfilled'] }
        },
        select: { totalAmount: true }
      });
      
      const totalReqAmount = requisitions.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);
      
      // 3. New budgetSpent = Max(Contracts, Requisitions) or sum?
      // In this system, it seems both should contribute to spent.
      // However, to avoid double counting, we might need a more complex logic.
      // But for now, let's just make sure all active contracts are at least accounted for.
      
      // If we assume requisitions are 'actuals' and contracts are 'commitments',
      // 'budgetSpent' should be the total of all commitments.
      
      const newSpent = totalContractValue + totalReqAmount;
      
      await prisma.project.update({
        where: { id: project.id },
        data: { budgetSpent: newSpent }
      });
      
      logger.info(`Project ${project.code}: Updated budgetSpent to ${newSpent} (Contracts: ${totalContractValue}, Reqs: ${totalReqAmount})`);
    }
    
    logger.info('Budget reconciliation complete.');
  } catch (error) {
    logger.error('Budget reconciliation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncProjectBudgets();

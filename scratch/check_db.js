const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany();
  console.log('Projects count:', projects.length);
  projects.forEach(p => {
    console.log(`- ${p.code}: Total=${p.budgetTotal}, Spent=${p.budgetSpent}`);
  });
  
  const contracts = await prisma.contract.findMany();
  console.log('Contracts count:', contracts.length);
  
  const reqs = await prisma.requisition.findMany();
  console.log('Requisitions count:', reqs.length);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

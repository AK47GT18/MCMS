const { prisma } = require('../src/config/database');
async function check() {
  const p = await prisma.project.findMany({ select: { id: true, code: true, budgetTotal: true, budgetSpent: true } });
  console.log(JSON.stringify(p, null, 2));
  const c = await prisma.contract.findMany({ select: { id: true, refCode: true, projectId: true, contractType: true, status: true, value: true } });
  console.log(JSON.stringify(c, null, 2));
  await prisma.$disconnect();
}
check();

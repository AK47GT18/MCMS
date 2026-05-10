const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const reqs = await prisma.auditLog.findMany({ where: { action: { contains: 'APPROVE', mode: 'insensitive' } }, orderBy: { timestamp: 'desc' }, take: 20 });
  console.log(JSON.stringify(reqs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());

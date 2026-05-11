const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const statuses = await prisma.project.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  console.log(JSON.stringify(statuses, null, 2));
}

main().finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.project.update({
    where: { id: 25 },
    data: { managerId: 3 }
  });
  console.log('Project 25 manager reverted to Mike Banda (ID 3)');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

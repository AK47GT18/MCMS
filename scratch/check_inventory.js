const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const inventory = await prisma.inventory.findMany({
    where: {
      materialName: 'Diesel Fuel',
      sector: {
        projectId: 31
      }
    },
    include: {
      sector: true
    }
  });
  console.log(JSON.stringify(inventory, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

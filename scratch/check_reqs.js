const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const requisitions = await prisma.requisition.findMany({
    include: {
      submitter: true,
      project: true
    }
  });
  console.log(JSON.stringify(requisitions, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

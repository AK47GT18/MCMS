const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const records = await prisma.budgetChangeRequest.findMany({
      include: {
        requester: true,
        project: true
      }
    });
    console.log(`Found ${records.length} records`);
    if (records.length > 0) {
      console.log('First record sample:', JSON.stringify(records[0], null, 2));
    }
  } catch (error) {
    console.error('Prisma Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

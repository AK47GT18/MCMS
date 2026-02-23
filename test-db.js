const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('SUCCESS');
    process.exit(0);
  } catch (e) {
    console.error('CONNECTION_FAILED', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

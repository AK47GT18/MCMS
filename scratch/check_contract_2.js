const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const contract = await prisma.contract.findFirst({
    where: { refCode: { contains: 'CON-MOSLGNR9' } },
    include: { items: true }
  });
  console.log('Contract:', JSON.stringify(contract, null, 2));
  process.exit(0);
}

check();

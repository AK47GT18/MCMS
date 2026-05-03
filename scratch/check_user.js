const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 's.mwale@mkaka.mw' }
  });
  console.log('User in DB:', JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

checkUser();

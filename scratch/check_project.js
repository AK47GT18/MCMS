const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const p = await prisma.project.findUnique({ where: { id: 9 } });
    console.log('Project 9:', JSON.stringify(p, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();

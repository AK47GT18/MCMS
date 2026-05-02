const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  const projects = await prisma.project.findMany({
    include: {
      roadSpecification: true
    }
  });
  console.log(JSON.stringify(projects, null, 2));
  await prisma.$disconnect();
}

checkData();

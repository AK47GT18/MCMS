const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const mike = await prisma.user.findFirst({ where: { name: { contains: 'Mike' } } });
    console.log('Mike Banda ID:', mike.id);
    
    const projects = await prisma.project.findMany({
      where: { fieldSupervisorId: mike.id },
      select: { id: true, name: true }
    });
    console.log('Projects assigned to Mike:', projects);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();

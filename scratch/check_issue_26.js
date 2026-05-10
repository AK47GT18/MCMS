const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const i = await prisma.issue.findUnique({ 
      where: { id: 26 }, 
      include: { 
        project: { include: { manager: true } }, 
        reporter: true 
      } 
    });
    console.log(JSON.stringify(i, null, 2));
    
    // Also check current user "Sarah Jenkins" projects
    const sarah = await prisma.user.findFirst({ where: { name: 'Sarah Jenkins' } });
    if (sarah) {
        const sarahProjects = await prisma.project.findMany({ where: { managerId: sarah.id } });
        console.log('Sarah Projects:', sarahProjects.map(p => p.id));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();

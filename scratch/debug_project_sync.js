const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({
    where: { name: { contains: 'M4 road' } },
    include: {
      dailyLogs: {
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      tasks: {
        orderBy: { phaseNumber: 'asc' }
      }
    }
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  console.log('Project:', { id: project.id, name: project.name, currentPhase: project.currentPhase, progress: project.progress, phaseProgress: project.phaseProgress });
  
  console.log('\nDaily Logs:');
  project.dailyLogs.forEach(log => {
    console.log({
      id: log.id,
      logDate: log.logDate,
      activePhase: log.activePhase,
      workProgress: log.workProgress,
      pmApproved: log.pmApproved,
      status: log.status
    });
  });

  console.log('\nTasks:');
  project.tasks.forEach(task => {
    console.log({
      id: task.id,
      name: task.name,
      phaseNumber: task.phaseNumber,
      progress: task.progress
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

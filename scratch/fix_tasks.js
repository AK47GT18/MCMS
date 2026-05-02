const { PrismaClient } = require('@prisma/client');
const tasksService = require('../src/services/tasks.service');
const prisma = new PrismaClient();

async function fix() {
  try {
    const projectId = 9;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    
    if (!project) {
      console.log('Project 9 not found');
      return;
    }
    
    console.log('Project found:', project.name);
    
    const taskCount = await prisma.task.count({ where: { projectId } });
    if (taskCount === 0) {
      console.log('No tasks found. Generating default tasks...');
      const roadType = project.projectType === 'road_works' ? 'RT-4' : 'RT-2';
      const tasks = await tasksService.generateDefaultTasks(
        project.id,
        project.startDate,
        project.endDate,
        roadType
      );
      console.log('Generated tasks:', tasks.length);
    } else {
      console.log('Project already has tasks:', taskCount);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

fix();

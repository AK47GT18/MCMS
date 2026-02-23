/**
 * MCMS Service - Tasks
 * CRUD operations for project tasks (Gantt chart items)
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

async function getAll() {
  return prisma.task.findMany({
    orderBy: { startDate: 'asc' },
    include: {
      dependency: { select: { id: true, name: true } },
    },
  });
}

async function getByProject(projectId) {
  return prisma.task.findMany({
    where: { projectId },
    orderBy: { startDate: 'asc' },
    include: {
      dependency: { select: { id: true, name: true } },
    },
  });
}

async function getByStatus(status) {
  return prisma.task.findMany({
    where: { status },
    orderBy: { startDate: 'asc' },
    include: {
      dependency: { select: { id: true, name: true } },
    },
  });
}

async function getById(id) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, code: true, name: true } },
      dependency: true,
      dependents: true,
    },
  });
  if (!task) throw new AppError('Task not found', 404);
  return task;
}

async function create(data) {
  const task = await prisma.task.create({
    data,
    include: { project: { select: { id: true, name: true } } },
  });
  logger.info('Task created', { taskId: task.id, projectId: data.projectId });
  return task;
}

async function update(id, data) {
  await getById(id);
  const task = await prisma.task.update({ where: { id }, data });
  logger.info('Task updated', { taskId: id });
  return task;
}

async function remove(id) {
  await getById(id);
  await prisma.task.delete({ where: { id } });
  logger.info('Task deleted', { taskId: id });
}

async function updateProgress(id, progress) {
  const task = await prisma.task.update({
    where: { id },
    data: { progress },
  });
  logger.info('Task progress updated', { taskId: id, progress });
  return task;
}

module.exports = { getAll, getByProject, getByStatus, getById, create, update, remove, updateProgress };

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
  // Convert date strings to ISO-8601 DateTime format
  const convertToDateTime = (dateString) => {
    if (!dateString) return null;
    // If already a Date or ISO string, return as-is
    if (dateString instanceof Date) return dateString;
    if (dateString.includes('T')) return new Date(dateString);
    // Convert YYYY-MM-DD to ISO-8601 DateTime (midnight UTC)
    return new Date(`${dateString}T00:00:00.000Z`);
  };

  const processedData = {
    ...data,
    startDate: convertToDateTime(data.startDate),
    endDate: convertToDateTime(data.endDate),
  };

  const task = await prisma.task.create({
    data: processedData,
    include: { project: { select: { id: true, name: true } } },
  });
  logger.info('Task created', { taskId: task.id, projectId: data.projectId });
  return task;
}

async function update(id, data) {
  await getById(id);
  
  // Convert date strings to ISO-8601 DateTime format if present
  const convertToDateTime = (dateString) => {
    if (!dateString) return undefined;
    // If already a Date or ISO string, return as-is
    if (dateString instanceof Date) return dateString;
    if (typeof dateString === 'string' && dateString.includes('T')) return new Date(dateString);
    // Convert YYYY-MM-DD to ISO-8601 DateTime (midnight UTC)
    if (typeof dateString === 'string') return new Date(`${dateString}T00:00:00.000Z`);
    return dateString;
  };

  const processedData = {
    ...data,
    ...(data.startDate && { startDate: convertToDateTime(data.startDate) }),
    ...(data.endDate && { endDate: convertToDateTime(data.endDate) }),
  };

  const task = await prisma.task.update({ where: { id }, data: processedData });
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

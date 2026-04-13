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
    where: { statusClass: status },
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

async function cascadeShift(taskId, shiftMs) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { dependents: true }
  });
  if (!task || task.dependents.length === 0) return;

  for (const dependent of task.dependents) {
    const newStartDate = new Date(dependent.startDate.getTime() + shiftMs);
    const newEndDate = new Date(dependent.endDate.getTime() + shiftMs);
    
    await prisma.task.update({
      where: { id: dependent.id },
      data: { startDate: newStartDate, endDate: newEndDate }
    });
    
    // Recursive call for domino effect
    await cascadeShift(dependent.id, shiftMs);
  }
}

async function update(id, data) {
  const originalTask = await getById(id);
  
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

  // GANTT CASCADE ALGORITHM
  // If endDate shifted, cascade the shift to all downstream dependents
  if (processedData.endDate && originalTask.endDate) {
    const oldTime = originalTask.endDate.getTime();
    const newTime = processedData.endDate.getTime();
    const shiftMs = newTime - oldTime;
    
    if (shiftMs !== 0) {
      logger.info('Cascading Gantt shift downstream', { taskId: id, shiftDays: shiftMs / (1000 * 60 * 60 * 24) });
      await cascadeShift(id, shiftMs);
    }
  }

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

/**
 * Cascade extension: shifts all tail-end tasks when project end date extends
 * @param {number} projectId
 * @param {number} shiftMs - milliseconds to shift
 * @param {Date} oldEndDate - the previous project end date
 */
async function cascadeExtension(projectId, shiftMs, oldEndDate) {
  // Find tasks that are near the project's old end date (within last 30% of project)
  const allTasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { endDate: 'asc' },
    include: { dependents: true },
  });

  if (allTasks.length === 0) return { shifted: 0 };

  const shifted = [];
  
  // Shift all tasks proportionally
  for (const task of allTasks) {
    const taskEnd = new Date(task.endDate);
    // Only shift tasks whose end date is at or beyond 70% of the old project timeline
    if (oldEndDate && taskEnd >= new Date(oldEndDate.getTime() - Math.abs(shiftMs))) {
      const newStartDate = new Date(task.startDate.getTime() + shiftMs);
      const newEndDate = new Date(task.endDate.getTime() + shiftMs);

      await prisma.task.update({
        where: { id: task.id },
        data: { startDate: newStartDate, endDate: newEndDate },
      });

      shifted.push({ taskId: task.id, name: task.name, oldEnd: task.endDate, newEnd: newEndDate });
    }
  }

  logger.info('Cascade extension completed', { projectId, tasksShifted: shifted.length, shiftDays: shiftMs / (1000 * 60 * 60 * 24) });
  return { shifted: shifted.length, tasks: shifted };
}

/**
 * Calculate aggregate project progress from all tasks
 * @param {number} projectId
 * @returns {number} 0-100
 */
async function calculateProjectProgress(projectId) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: { progress: true },
  });

  if (tasks.length === 0) return 0;
  const avg = Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length);
  return avg;
}

/**
 * Auto-generate default construction phase tasks for a new road works project.
 * Tasks are proportionally spaced across the project timeline with dependency chains.
 * 
 * @param {number} projectId - The newly created project ID
 * @param {Date|string} projectStart - Project start date
 * @param {Date|string} projectEnd - Project end date
 * @returns {Promise<Array>} Created tasks
 */
async function generateDefaultTasks(projectId, projectStart, projectEnd) {
  const start = new Date(projectStart);
  const end = new Date(projectEnd);
  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

  // Road Works construction phases with percentage of total timeline
  // Phases are ordered sequentially; each depends on the previous one
  const ROAD_PHASES = [
    { name: 'Site Clearance & Survey',          pct: 0.08, status: 'planned' },
    { name: 'Earthworks & Grading',             pct: 0.15, status: 'planned' },
    { name: 'Sub-base Layer Construction',       pct: 0.12, status: 'planned' },
    { name: 'Base Course Construction',          pct: 0.12, status: 'planned' },
    { name: 'Drainage & Culvert Installation',   pct: 0.10, status: 'planned' },
    { name: 'Surface / Binder Course',           pct: 0.15, status: 'planned' },
    { name: 'Wearing Course & Surfacing',        pct: 0.12, status: 'planned' },
    { name: 'Road Furniture & Markings',         pct: 0.08, status: 'planned' },
    { name: 'Defects Liability & Handover',      pct: 0.08, status: 'planned' },
  ];

  const createdTasks = [];
  let cursor = new Date(start);

  for (let i = 0; i < ROAD_PHASES.length; i++) {
    const phase = ROAD_PHASES[i];
    const durationDays = Math.max(1, Math.round(totalDays * phase.pct));

    const taskStart = new Date(cursor);
    const taskEnd = new Date(cursor);
    taskEnd.setDate(taskEnd.getDate() + durationDays);

    // Ensure last task doesn't exceed project end date
    if (taskEnd > end) taskEnd.setTime(end.getTime());

    const taskData = {
      projectId,
      name: phase.name,
      startDate: taskStart,
      endDate: taskEnd,
      progress: 0,
      statusClass: phase.status,
      // Link to previous task as dependency (sequential chain)
      dependencyId: createdTasks.length > 0 ? createdTasks[createdTasks.length - 1].id : null,
    };

    const task = await prisma.task.create({ data: taskData });
    createdTasks.push(task);

    // Move cursor to the end of this task for the next phase
    cursor = new Date(taskEnd);
  }

  logger.info('Default road tasks generated', {
    projectId,
    taskCount: createdTasks.length,
    totalDays,
    firstTask: createdTasks[0]?.name,
    lastTask: createdTasks[createdTasks.length - 1]?.name,
  });

  return createdTasks;
}

module.exports = { getAll, getByProject, getByStatus, getById, create, update, remove, updateProgress, cascadeShift, cascadeExtension, calculateProjectProgress, generateDefaultTasks };

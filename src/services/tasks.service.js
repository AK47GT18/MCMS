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
 * Phase definitions for each road type (RT-1 → RT-5)
 * Maps phase keys to human-readable names with timeline percentage weights
 */
const ROAD_PHASE_TEMPLATES = {
  'RT-1': [ // Earth Road — 2 phases
    { phaseKey: 1, name: 'Clearing & Grubbing', pct: 0.40 },
    { phaseKey: 2, name: 'Earthworks / Subgrade', pct: 0.60 },
  ],
  'RT-2': [ // Gravel Road — 4 phases
    { phaseKey: 1, name: 'Clearing & Grubbing', pct: 0.15 },
    { phaseKey: 2, name: 'Earthworks / Subgrade', pct: 0.25 },
    { phaseKey: 3, name: 'Sub-base (Gravel Layer)', pct: 0.35 },
    { phaseKey: 6, name: 'Drainage', pct: 0.25 },
  ],
  'RT-3': [ // Surface Dressed — 7 phases
    { phaseKey: 1, name: 'Clearing & Grubbing', pct: 0.08 },
    { phaseKey: 2, name: 'Earthworks / Subgrade', pct: 0.15 },
    { phaseKey: 3, name: 'Sub-base Construction', pct: 0.12 },
    { phaseKey: 4, name: 'Base Course Construction', pct: 0.15 },
    { phaseKey: 5, name: 'Surface Dressing (Chip Seal)', pct: 0.18 },
    { phaseKey: 6, name: 'Drainage', pct: 0.15 },
    { phaseKey: 7, name: 'Road Furniture & Accessories', pct: 0.17 },
  ],
  'RT-4': [ // Asphalt — 7 phases
    { phaseKey: 1, name: 'Clearing & Grubbing', pct: 0.06 },
    { phaseKey: 2, name: 'Earthworks / Subgrade', pct: 0.14 },
    { phaseKey: 3, name: 'Sub-base Construction', pct: 0.12 },
    { phaseKey: 4, name: 'Base Course Construction', pct: 0.14 },
    { phaseKey: 5, name: 'Asphalt Surfacing', pct: 0.20 },
    { phaseKey: 6, name: 'Drainage', pct: 0.14 },
    { phaseKey: 7, name: 'Road Furniture & Accessories', pct: 0.20 },
  ],
  'RT-5': [ // Concrete — 7 phases
    { phaseKey: 1, name: 'Clearing & Grubbing', pct: 0.06 },
    { phaseKey: 2, name: 'Earthworks / Subgrade', pct: 0.12 },
    { phaseKey: 3, name: 'Sub-base Construction', pct: 0.12 },
    { phaseKey: 4, name: 'Base Course Construction', pct: 0.12 },
    { phaseKey: 5, name: 'Concrete Surfacing', pct: 0.24 },
    { phaseKey: 6, name: 'Drainage', pct: 0.14 },
    { phaseKey: 7, name: 'Road Furniture & Accessories', pct: 0.20 },
  ],
};

// Default fallback if no road type specified (same as RT-4)
const DEFAULT_PHASES = ROAD_PHASE_TEMPLATES['RT-4'];

/**
 * Auto-generate construction phase tasks for a new project.
 * Tasks are proportionally spaced across the project timeline with dependency chains.
 * Now road-type-aware: different road types get different phases.
 * 
 * @param {number} projectId - The newly created project ID
 * @param {Date|string} projectStart - Project start date
 * @param {Date|string} projectEnd - Project end date
 * @param {string} roadType - Road type (RT-1 to RT-5), defaults to RT-4
 * @returns {Promise<Array>} Created tasks
 */
async function generateDefaultTasks(projectId, projectStart, projectEnd, roadType) {
  const start = new Date(projectStart);
  const end = new Date(projectEnd);
  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

  // Select phase template based on road type
  const phases = ROAD_PHASE_TEMPLATES[roadType] || DEFAULT_PHASES;

  const createdTasks = [];
  let cursor = new Date(start);

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
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
      statusClass: 'planned',
      phaseNumber: phase.phaseKey,
      // Link to previous task as dependency (sequential chain)
      dependencyId: createdTasks.length > 0 ? createdTasks[createdTasks.length - 1].id : null,
    };

    const task = await prisma.task.create({ data: taskData });
    createdTasks.push(task);

    // Move cursor to the end of this task for the next phase
    cursor = new Date(taskEnd);
  }

  logger.info('Road tasks generated', {
    projectId,
    roadType: roadType || 'RT-4 (default)',
    taskCount: createdTasks.length,
    totalDays,
    phases: phases.map(p => p.name),
  });

  return createdTasks;
}

/**
 * Regenerate Gantt tasks from a saved Road Specification.
 * Deletes existing auto-generated tasks and creates new ones matching the spec's active phases.
 * Called after saveEstimate() to keep Gantt in sync with Road Spec.
 * 
 * @param {number} projectId
 * @param {Date} projectStart
 * @param {Date} projectEnd
 * @param {number[]} activePhaseKeys - Active phase keys from the Road Spec (e.g., [1, 2, 3, 4, 5.2, 6, 7])
 */
async function regenerateFromRoadSpec(projectId, projectStart, projectEnd, activePhaseKeys) {
  // Delete existing tasks for this project (they'll be regenerated)
  await prisma.task.deleteMany({ where: { projectId } });

  // Determine road type from active phases
  let roadType = 'RT-4'; // default
  for (const [rt, def] of Object.entries(ROAD_PHASE_TEMPLATES)) {
    const templateKeys = def.map(p => p.phaseKey);
    // Check if the active phase count matches a known template
    if (templateKeys.length === activePhaseKeys.map(k => Math.floor(k)).filter((v, i, a) => a.indexOf(v) === i).length) {
      roadType = rt;
      break;
    }
  }

  return generateDefaultTasks(projectId, projectStart, projectEnd, roadType);
}

module.exports = { getAll, getByProject, getByStatus, getById, create, update, remove, updateProgress, cascadeShift, cascadeExtension, calculateProjectProgress, generateDefaultTasks, regenerateFromRoadSpec };

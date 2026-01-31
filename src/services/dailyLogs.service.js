/**
 * MCMS Service - Daily Logs
 * CRUD operations for field supervisor daily reports
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const handlers = require('../realtime/handlers');

async function getAll({ page = 1, limit = 20, projectId, startDate, endDate }) {
  const skip = (page - 1) * limit;
  const where = {};
  if (projectId) where.projectId = projectId;
  if (startDate || endDate) {
    where.logDate = {};
    if (startDate) where.logDate.gte = new Date(startDate);
    if (endDate) where.logDate.lte = new Date(endDate);
  }
  
  const [logs, total] = await Promise.all([
    prisma.dailyLog.findMany({
      skip, take: limit, where,
      orderBy: { logDate: 'desc' },
      include: {
        project: { select: { id: true, code: true, name: true } },
        submitter: { select: { id: true, name: true } },
      },
    }),
    prisma.dailyLog.count({ where }),
  ]);
  
  return { logs, total, page, limit };
}

async function getById(id) {
  const log = await prisma.dailyLog.findUnique({
    where: { id },
    include: {
      project: true,
      submitter: { select: { id: true, name: true, email: true } },
    },
  });
  if (!log) throw new AppError('Daily log not found', 404);
  return log;
}

async function create(data, userId) {
  const log = await prisma.dailyLog.create({
    data: {
      ...data,
      submittedBy: userId,
      logDate: new Date(data.logDate),
    },
    include: {
      project: { select: { id: true, code: true } },
      submitter: { select: { id: true, name: true } },
    },
  });
  
  logger.info('Daily log created', { logId: log.id, projectId: data.projectId });
  
  // Emit SOS alert if flagged
  if (log.isSos) {
    handlers.emitSosAlert(log);
    logger.warn('SOS alert triggered', { logId: log.id, projectId: log.projectId });
  }
  
  return log;
}

async function approve(id, approverId) {
  const log = await prisma.dailyLog.update({
    where: { id },
    data: {
      pmApproved: true,
      pmApprovedAt: new Date(),
    },
  });
  logger.info('Daily log approved', { logId: id, approverId });
  return log;
}

async function getByProjectDate(projectId, date) {
  return prisma.dailyLog.findFirst({
    where: {
      projectId,
      logDate: new Date(date),
    },
    include: {
      submitter: { select: { id: true, name: true } },
    },
  });
}

async function getSosAlerts() {
  return prisma.dailyLog.findMany({
    where: { isSos: true, pmApproved: false },
    include: {
      project: { select: { id: true, code: true, name: true } },
      submitter: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = { getAll, getById, create, approve, getByProjectDate, getSosAlerts };

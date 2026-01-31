/**
 * MCMS Service - Issues
 * CRUD operations for issue/complaint tracking
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const handlers = require('../realtime/handlers');
const emailService = require('../emails/email.service');

async function getAll({ page = 1, limit = 20, status, priority, projectId }) {
  const skip = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (projectId) where.projectId = projectId;
  
  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      skip, take: limit, where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, code: true, name: true } },
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
    prisma.issue.count({ where }),
  ]);
  
  return { issues, total, page, limit };
}

async function getById(id) {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      project: true,
      reporter: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });
  if (!issue) throw new AppError('Issue not found', 404);
  return issue;
}

async function create(data, userId) {
  const issue = await prisma.issue.create({
    data: {
      ...data,
      reportedBy: userId,
    },
    include: {
      project: { select: { id: true, code: true } },
    },
  });
  
  logger.info('Issue created', { issueId: issue.id, issueCode: issue.issueCode });
  
  // Emit realtime alert
  handlers.emitIssueAlert(issue, 'created');
  
  return issue;
}

async function update(id, data) {
  await getById(id);
  const issue = await prisma.issue.update({ where: { id }, data });
  logger.info('Issue updated', { issueId: id });
  return issue;
}

async function resolve(id, resolutionNotes) {
  const issue = await prisma.issue.update({
    where: { id },
    data: {
      status: 'resolved',
      resolutionNotes,
      resolvedAt: new Date(),
    },
  });
  logger.info('Issue resolved', { issueId: id });
  return issue;
}

async function assign(id, assigneeId) {
  const issue = await prisma.issue.update({
    where: { id },
    data: {
      assignedTo: assigneeId,
      status: 'investigating',
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  });
  
  logger.info('Issue assigned', { issueId: id, assigneeId });
  
  // Send notification to assignee
  if (issue.assignee) {
    emailService.sendNotification(
      issue.assignee,
      'Issue Assigned to You',
      `Issue ${issue.issueCode} has been assigned to you. Priority: ${issue.priority}`,
    ).catch(err => logger.error('Email notification failed', { error: err.message }));
    
    // Realtime notification
    handlers.sendNotification(assigneeId, 'Issue Assigned', `Issue ${issue.issueCode} assigned to you`);
  }
  
  return issue;
}

async function getOpen() {
  return prisma.issue.findMany({
    where: { status: { in: ['open', 'investigating'] } },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    include: {
      project: { select: { id: true, code: true } },
      assignee: { select: { id: true, name: true } },
    },
  });
}

module.exports = { getAll, getById, create, update, resolve, assign, getOpen };

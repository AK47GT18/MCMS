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
  // Generate unique issue code if not provided
  if (!data.issueCode) {
    // Format: ISS-YYYYMMDD-XXXXXX (e.g., ISS-20260224-001234)
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    data.issueCode = `ISS-${timestamp}-${random}`;
  }
  
  // Normalize priority to Title Case for database
  if (data.priority) {
    const priorityMap = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Critical'
    };
    data.priority = priorityMap[data.priority.toLowerCase()] || data.priority;
  }
  
  // Ensure projectId is provided and valid
  if (!data.projectId || typeof data.projectId !== 'number') {
    throw new AppError('Project ID is required and must be a valid number', 400);
  }

  console.log('[Issue Service] Creating issue with:', {
    issueCode: data.issueCode,
    projectId: data.projectId,
    category: data.category,
    priority: data.priority,
    reportedBy: userId
  });

  const issue = await prisma.issue.create({
    data: {
      ...data,
      reportedBy: userId,
    },
    include: {
      project: { 
        select: { 
          id: true, 
          code: true, 
          name: true,
          manager: { select: { id: true, name: true, email: true } }
        } 
      },
      reporter: { select: { id: true, name: true, email: true } }
    },
  });
  
  logger.info('Issue created', { issueId: issue.id, issueCode: issue.issueCode });
  
  // Send email notification to Project Manager (async, don't wait)
  (async () => {
    try {
      if (!issue.project?.manager?.email) {
        logger.warn('Cannot send PM notification - Project manager email not found', { 
          projectId: issue.projectId,
          hasProject: !!issue.project,
          hasManager: !!issue.project?.manager
        });
        return;
      }
      
      const pmName = issue.project.manager.name || 'Project Manager';
      const reporterName = issue.reporter?.name || 'Team Member';
      const projectName = issue.project.name || issue.project.code;
      const pmEmail = issue.project.manager.email;
      
      logger.info('Sending PM notification', {
        issueId: issue.id,
        projectId: issue.projectId,
        pmEmail: pmEmail
      });
      
      const result = await emailService.send({
        to: pmEmail,
        subject: `🚨 New Issue Reported: ${issue.issueCode} - ${projectName}`,
        html: `
          <h2 style="color:#111827;">New Issue Reported</h2>
          <p>Hello <strong>${pmName}</strong>,</p>
          <p>A new issue has been reported on project <strong>${projectName}</strong>:</p>
          
          <div style="background:#f8fafc; border-left:4px solid #f97316; padding:16px; margin:16px 0; border-radius:4px;">
            <p><strong>Issue Code:</strong> ${issue.issueCode}</p>
            <p><strong>Category:</strong> ${issue.category || 'General'}</p>
            <p><strong>Priority:</strong> <span style="color:#dc2626; font-weight:bold;">${issue.priority || 'Medium'}</span></p>
            <p><strong>Reported By:</strong> ${reporterName}</p>
            <p><strong>Description:</strong></p>
            <p style="color:#475569; font-style:italic;">${issue.description || 'No description provided'}</p>
          </div>
          
          <p>Please review and take action as needed.</p>
          <hr style="border:none; border-top:1px solid #e2e8f0; margin:20px 0;">
          <p style="color:#64748b; font-size:12px;">This is an automated notification from MCMS. Please do not reply to this email.</p>
        `,
      });
      
      if (result.success) {
        logger.info('PM notification sent successfully', { 
          issueId: issue.id, 
          messageId: result.messageId,
          pmEmail: pmEmail
        });
      } else {
        logger.error('PM notification failed', { 
          issueId: issue.id, 
          error: result.error,
          pmEmail: pmEmail
        });
      }
    } catch (err) {
      logger.error('Error sending PM notification', { 
        issueId: issue.id, 
        error: err.message,
        stack: err.stack
      });
    }
  })();
  
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

/**
 * MCMS Service - Issues
 * CRUD operations for issue/complaint tracking
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const handlers = require('../realtime/handlers');
const emailService = require('../emails/email.service');
const notifService = require('./notification.service');
const auditService = require('./audit.service');

async function getAll({ page = 1, limit = 20, status, priority, projectId, user }) {
  const skip = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (projectId) where.projectId = projectId;
  
  // Role-based filtering
  if (user && !['Operations Manager', 'Managing_Director', 'System_Technician', 'Operations_Manager', 'Managing Director', 'Finance_Director', 'Finance Director'].includes(user.role)) {
    where.OR = [
      { reportedBy: user.id },
      { assignedTo: user.id },
      { project: { managerId: user.id } },
      { project: { fieldSupervisorId: user.id } },
      // Show internal issues (no project) to all managers/supervisors for company-wide visibility
      { projectId: null }
    ];
  }
  
  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      skip, take: limit, where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, code: true, name: true } },
        reporter: { select: { id: true, name: true, role: true } },
        assignee: { select: { id: true, name: true, role: true } },
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
  
  // Optional: Ensure projectId is valid if provided
  if (data.projectId && typeof data.projectId !== 'number') {
    throw new AppError('Project ID must be a valid number', 400);
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
      let pmEmail, pmName, projectName;
      const reporterName = issue.reporter?.name || 'Team Member';

      if (issue.project) {
          pmEmail = issue.project.manager?.email;
          pmName = issue.project.manager?.name || 'Project Manager';
          projectName = issue.project.name || issue.project.code;
      } else {
          // Internal Issue - Notify Operations Manager
          const opsManager = await prisma.user.findFirst({ where: { role: 'Operations Manager' } });
          pmEmail = opsManager?.email;
          pmName = opsManager?.name || 'Operations Manager';
          projectName = 'Internal / HQ Operations';
      }

      if (!pmEmail) {
        logger.warn('Cannot send issue notification - target email not found', { 
          issueId: issue.id,
          hasProject: !!issue.project
        });
        return;
      }
      
      logger.info('Sending issue notification', {
        issueId: issue.id,
        targetEmail: pmEmail
      });
      
      const result = await emailService.send({
        to: pmEmail,
        subject: `🚨 New Issue Reported: ${issue.issueCode} - ${projectName}`,
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
            <div style="background: #f8fafc; padding: 24px; border-radius: 8px; border-bottom: 4px solid #f97316;">
              <h2 style="color: #0f172a; margin: 0; font-size: 20px;">🚨 Issue Alert</h2>
              <p style="color: #64748b; margin: 4px 0 0; font-size: 14px;">MCMS Governance Pipeline</p>
            </div>
            
            <div style="padding: 24px 0;">
              <p style="font-size: 16px; line-height: 24px;">Hello <strong>${pmName}</strong>,</p>
              <p style="font-size: 16px; line-height: 24px;">A new issue has been flagged for <strong>${projectName}</strong> by <strong>${reporterName}</strong>.</p>
              
              <div style="background: #fff; border: 1px solid #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
                <div style="margin-bottom: 12px;">
                  <span style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Issue Reference</span>
                  <div style="color: #0f172a; font-weight: 600;">${issue.issueCode}</div>
                </div>
                <div style="margin-bottom: 12px;">
                  <span style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Priority Level</span>
                  <div style="color: ${issue.priority === 'High' || issue.priority === 'Critical' ? '#dc2626' : '#f97316'}; font-weight: 700;">${issue.priority || 'Medium'}</div>
                </div>
                <div>
                  <span style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700;">Narrative / Description</span>
                  <div style="color: #334155; line-height: 1.6; margin-top: 4px;">${issue.description || 'No description provided'}</div>
                </div>
              </div>
              
              <a href="https://mcms.mkaka.mw/dashboard.html?view=issues&id=${issue.id}" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">View in Resolution Center</a>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; color: #94a3b8; font-size: 12px; text-align: center;">
              <p>This is an automated governance notification from MKAKA MCMS. Please do not reply directly.</p>
            </div>
          </div>
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

  // Audit Log
  const user = await prisma.user.findUnique({ where: { id: userId } });
  await auditService.log({
    userId, userName: user?.name, userRole: user?.role,
    action: 'REPORT_ISSUE', targetType: 'Issue', targetId: issue.id, targetCode: issue.issueCode,
    details: { priority: issue.priority, category: issue.category }
  });

  // Real-time notification via unified service (auto-emails)
  if (issue.project?.managerId) {
    await notifService.create({
      userId: issue.project.managerId,
      type: 'error', icon: 'fa-exclamation-triangle',
      title: 'New Issue Reported',
      message: `Issue ${issue.issueCode} reported on ${issue.project.name} by ${user?.name}.`
    });
  }
  
  // Emit realtime alert
  handlers.emitIssueAlert(issue, 'created');
  
  return issue;
}

async function update(id, data) {
  await getById(id);
  const issue = await prisma.issue.update({ 
    where: { id }, 
    data,
    include: {
      project: { select: { id: true, code: true, name: true } }
    }
  });
  logger.info('Issue updated', { issueId: id });
  handlers.emitIssueAlert(issue, 'updated');
  return issue;
}

async function resolve(id, data, user = null) {
  const { status = 'resolved', resolutionNotes } = data;
  
  const existingIssue = await prisma.issue.findUnique({ where: { id } });
  let combinedNotes = existingIssue.resolutionNotes || '';
  
  if (resolutionNotes) {
    const timestamp = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const userName = user?.name || 'Management';
    const newNoteEntry = `[${timestamp}] ${userName}: ${resolutionNotes}`;
    combinedNotes = combinedNotes ? `${combinedNotes}\n\n${newNoteEntry}` : newNoteEntry;
  }
  
  const issue = await prisma.issue.update({
    where: { id },
    data: {
      status,
      resolutionNotes: combinedNotes,
      resolvedAt: status === 'resolved' ? new Date() : undefined,
    },
    include: {
      project: { select: { id: true, code: true, name: true } }
    }
  });
  logger.info('Issue resolved', { issueId: id });
  handlers.emitIssueAlert(issue, 'resolved');

  // Notify Reporter
  if (issue.reportedBy) {
    await notifService.create({
      userId: issue.reportedBy,
      type: 'success', icon: 'fa-check-circle',
      title: 'Issue Resolved',
      message: `Your reported issue ${issue.issueCode} has been resolved.`
    });
  }

  // Audit Log
  await auditService.log({
    userId: user?.id, userName: user?.name, userRole: user?.role,
    action: 'RESOLVE_ISSUE', targetType: 'Issue', targetId: id, targetCode: issue.issueCode,
    details: { status, resolutionNotes }
  });

  return issue;
}

async function assign(id, assigneeId, user = null) {
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
  
  // Send notification to assignee (auto-emails)
  if (issue.assignee) {
    await notifService.create({
      userId: assigneeId,
      type: 'info', icon: 'fa-user-tag',
      title: 'Issue Assigned to You',
      message: `Issue ${issue.issueCode} has been assigned to you. Priority: ${issue.priority}`
    });
  }

  // Audit Log
  await auditService.log({
    userId: user?.id, userName: user?.name, userRole: user?.role,
    action: 'ASSIGN_ISSUE', targetType: 'Issue', targetId: id, targetCode: issue.issueCode,
    details: { assigneeId }
  });
  
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

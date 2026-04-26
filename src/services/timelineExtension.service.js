/**
 * MCMS Service - Project Extension Requests
 * Allows any user role to request a project timeline extension.
 * Only the assigned Project Manager can approve or reject.
 */

const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const emailService = require('../emails/email.service');
const notificationService = require('./notification.service');

// ============================================================
// HELPERS
// ============================================================

/**
 * Build branded email wrapper (matches existing system style)
 */
function emailWrapper(content) {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,sans-serif;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
  <tr><td align="center" style="padding:40px 20px;">
    <table role="presentation" style="width:100%;max-width:650px;border-collapse:separate;border-spacing:0;background-color:#ffffff;border-radius:12px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);overflow:hidden;border:1px solid #e2e8f0;">
      <tr>
        <td style="background:#ffffff;padding:40px 0;text-align:center;border-bottom:4px solid #f97415;">
          <div style="font-size:48px;line-height:1;margin-bottom:12px;">📅</div>
          <h1 style="color:#0f1729;margin:0;font-size:22px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">Mkaka <span style="color:#f97415;">Construction</span></h1>
          <p style="color:#64748b;font-size:12px;margin:6px 0 0;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Project Timeline System</p>
        </td>
      </tr>
      <tr>
        <td style="padding:48px;color:#334155;font-size:15px;line-height:1.6;">
          ${content}
          <table role="presentation" style="width:100%;margin:40px 0 0;">
            <tr><td align="center">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/login" style="background:#f97415;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block;text-transform:uppercase;letter-spacing:0.5px;">View in MCMS Dashboard</a>
            </td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="background-color:#f8fafc;padding:24px 48px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#64748b;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} Mkaka Construction Management System</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
}

function daysDiff(a, b) {
  return Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
}

// ============================================================
// CREATE REQUEST
// ============================================================

async function create(data, requestingUser) {
  const { projectId, requestedEndDate, justification } = data;

  // Fetch project with its PM
  const project = await prisma.project.findUnique({
    where: { id: Number(projectId) },
    include: {
      manager: { select: { id: true, name: true, email: true } },
    },
  });
  if (!project) throw new AppError('Project not found', 404);
  if (!project.endDate) throw new AppError('Project has no end date set', 400);

  const newEnd = new Date(requestedEndDate);
  const currentEnd = new Date(project.endDate);
  if (newEnd <= currentEnd) {
    throw new AppError('Requested end date must be after the current end date', 400);
  }

  // Block duplicates: only one pending per project
  const existing = await prisma.projectExtensionRequest.findFirst({
    where: { projectId: Number(projectId), status: 'pending' },
  });
  if (existing) {
    throw new AppError('A pending extension request already exists for this project', 409);
  }

  const extReq = await prisma.projectExtensionRequest.create({
    data: {
      projectId: Number(projectId),
      requestedById: requestingUser.id,
      currentEndDate: currentEnd,
      requestedEndDate: newEnd,
      justification,
      status: 'pending',
    },
    include: {
      project: { select: { id: true, code: true, name: true } },
      requestedBy: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  const extensionDays = daysDiff(currentEnd, newEnd);

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: requestingUser.id,
      userName: requestingUser.name,
      userRole: requestingUser.role,
      action: 'REQUEST_TIMELINE_EXTENSION',
      targetType: 'Project',
      targetId: project.id,
      targetCode: project.code,
      details: { requestedEndDate, justification, extensionDays },
    },
  });

  // In-app notification to PM
  if (project.managerId) {
    await notificationService.create({
      userId: project.managerId,
      type: 'warning',
      icon: 'fa-calendar-plus',
      title: 'Timeline Extension Requested',
      message: `${requestingUser.name} (${requestingUser.role.replace(/_/g, ' ')}) requested a ${extensionDays}-day extension for ${project.code}.`,
      link: '/timeline-extensions',
    });
  }

  // Email to PM
  if (project.manager?.email) {
    const html = emailWrapper(`
      <h2 style="color:#0f1729;margin-top:0;font-size:20px;">Timeline Extension Request</h2>
      <p>Hello <strong>${project.manager.name}</strong>,</p>
      <p><strong>${requestingUser.name}</strong> (${requestingUser.role.replace(/_/g, ' ')}) has submitted a timeline extension request for project <strong style="color:#f97415;">${project.name}</strong> (${project.code}).</p>

      <div style="background:#f8fafc;border-left:4px solid #f97415;padding:20px 24px;border-radius:0 8px 8px 0;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 0;color:#64748b;width:50%;">Current End Date</td><td style="font-weight:700;color:#0f1729;">${formatDate(currentEnd)}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">Requested New End Date</td><td style="font-weight:700;color:#f97415;">${formatDate(newEnd)}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">Extension Duration</td><td style="font-weight:700;color:#0f1729;">+${extensionDays} days</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">Submitted By</td><td style="font-weight:700;">${requestingUser.name}</td></tr>
        </table>
      </div>

      <div style="background:#fffbf5;border:1px solid #fed7aa;border-radius:8px;padding:20px 24px;margin:24px 0;">
        <h3 style="margin:0 0 10px;font-size:14px;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">Justification</h3>
        <p style="margin:0;color:#475569;font-style:italic;">"${justification}"</p>
      </div>

      <p>Please log in to the MCMS portal to review and <strong>approve or reject</strong> this request.</p>
    `);

    emailService.send({
      to: project.manager.email,
      subject: `[Action Required] Timeline Extension: ${project.code}`,
      html,
    }).catch(e => logger.error('Extension request email failed', { error: e.message }));
  }

  logger.info('Extension request created', { id: extReq.id, projectId, requestedById: requestingUser.id });
  return extReq;
}

// ============================================================
// GET ALL (for PM dashboard - their projects only)
// ============================================================

async function getAll({ projectId, status, managerId } = {}) {
  const where = {};
  if (projectId) where.projectId = Number(projectId);
  if (status) where.status = status;
  if (managerId) where.project = { managerId: Number(managerId) };

  return prisma.projectExtensionRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      project: { select: { id: true, code: true, name: true, endDate: true, managerId: true } },
      requestedBy: { select: { id: true, name: true, email: true, role: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });
}

// ============================================================
// APPROVE (PM only)
// ============================================================

async function approve(id, pmUser, pmComment) {
  // Ensure pmUser has a name (might be missing from token)
  if (!pmUser.name) {
    const dbUser = await prisma.user.findUnique({ where: { id: pmUser.id }, select: { name: true } });
    if (dbUser) pmUser.name = dbUser.name;
  }

  const req = await prisma.projectExtensionRequest.findUnique({
    where: { id: Number(id) },
    include: {
      project: {
        include: {
          manager: { select: { id: true, name: true, email: true } },
          fieldSupervisor: { select: { id: true, name: true, email: true } },
        },
      },
      requestedBy: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!req) throw new AppError('Extension request not found', 404);
  if (req.status !== 'pending') throw new AppError('This request has already been reviewed', 400);
  if (req.project.managerId !== pmUser.id) throw new AppError('Only the assigned Project Manager can approve this request', 403);

  // Update request
  await prisma.projectExtensionRequest.update({
    where: { id: Number(id) },
    data: { status: 'approved', reviewedById: pmUser.id, pmComment: pmComment || null },
  });

  // Execute the extension (reuse existing extendProject logic)
  const projectsService = require('./projects.service');
  const result = await projectsService.extendProject(
    req.projectId,
    req.requestedEndDate.toISOString(),
    `Extension approved: ${req.justification}`,
    pmUser
  );

  // Notify the requester in-app
  await notificationService.create({
    userId: req.requestedById,
    type: 'success',
    icon: 'fa-calendar-check',
    title: 'Timeline Extension Approved',
    message: `Your extension request for ${req.project.code} has been approved by ${pmUser.name}. New end date: ${formatDate(req.requestedEndDate)}.`,
  });

  // Email to all users except PM
  const extensionDays = daysDiff(req.currentEndDate, req.requestedEndDate);
  const html = emailWrapper(`
    <h2 style="color:#0f1729;margin-top:0;font-size:20px;">✅ Timeline Extension Approved</h2>
    <p>Hello,</p>
    <p>A timeline extension request for project <strong style="color:#f97415;">${req.project.name}</strong> (${req.project.code}) has been <strong style="color:#16a34a;">approved</strong> by Project Manager <strong>${pmUser.name}</strong>.</p>

    <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:20px 24px;border-radius:0 8px 8px 0;margin:24px 0;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#64748b;width:50%;">Previous End Date</td><td style="font-weight:700;color:#0f1729;">${formatDate(req.currentEndDate)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">New End Date</td><td style="font-weight:700;color:#16a34a;">${formatDate(req.requestedEndDate)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Extension Granted</td><td style="font-weight:700;">+${extensionDays} days</td></tr>
      </table>
    </div>

    <div style="background:#fffbf5;border:1px solid #fed7aa;border-radius:8px;padding:20px 24px;margin:24px 0;">
      <h3 style="margin:0 0 10px;font-size:14px;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">Requested Justification</h3>
      <p style="margin:0;color:#475569;font-style:italic;">"${req.justification}"</p>
    </div>

    ${pmComment ? `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin:16px 0;">
      <h3 style="margin:0 0 10px;font-size:14px;color:#334155;text-transform:uppercase;letter-spacing:0.5px;">PM Approval Reason</h3>
      <p style="margin:0;color:#475569;font-style:italic;">"${pmComment}"</p>
    </div>
    ` : ''}

    <p>The Gantt chart schedule has been automatically updated. All downstream tasks have been cascaded accordingly.</p>
  `);

  try {
    const usersToNotify = await prisma.user.findMany({
      where: { isActive: true, deletedAt: null, id: { not: pmUser.id } },
      select: { email: true }
    });
    
    usersToNotify.forEach(u => {
      if (u.email) {
        emailService.send({
          to: u.email,
          subject: `✅ Timeline Extension Approved: ${req.project.code}`,
          html,
        }).catch(e => logger.error('Approval broadcast email failed', { error: e.message, email: u.email }));
      }
    });
  } catch (e) {
    logger.error('Failed to fetch users for broadcast', { error: e.message });
  }

  await prisma.auditLog.create({
    data: {
      userId: pmUser.id,
      userName: pmUser.name,
      userRole: pmUser.role,
      action: 'APPROVE_TIMELINE_EXTENSION',
      targetType: 'ProjectExtensionRequest',
      targetId: req.id,
      targetCode: req.project.code,
      details: { newEndDate: req.requestedEndDate, extensionDays },
    },
  });

  logger.info('Extension request approved', { id, pmUserId: pmUser.id });
  return result;
}

// ============================================================
// REJECT (PM only)
// ============================================================

async function reject(id, pmUser, pmComment) {
  const req = await prisma.projectExtensionRequest.findUnique({
    where: { id: Number(id) },
    include: {
      project: { select: { id: true, code: true, name: true, managerId: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!req) throw new AppError('Extension request not found', 404);
  if (req.status !== 'pending') throw new AppError('This request has already been reviewed', 400);
  if (req.project.managerId !== pmUser.id) throw new AppError('Only the assigned Project Manager can reject this request', 403);

  await prisma.projectExtensionRequest.update({
    where: { id: Number(id) },
    data: { status: 'rejected', reviewedById: pmUser.id, pmComment: pmComment || null },
  });

  // In-app notification
  await notificationService.create({
    userId: req.requestedById,
    type: 'error',
    icon: 'fa-calendar-xmark',
    title: 'Timeline Extension Rejected',
    message: `Your extension request for ${req.project.code} was not approved by ${pmUser.name}.`,
  });

  // Email to requester
  const html = emailWrapper(`
    <h2 style="color:#0f1729;margin-top:0;font-size:20px;">❌ Timeline Extension Not Approved</h2>
    <p>Hello <strong>${req.requestedBy.name}</strong>,</p>
    <p>Your timeline extension request for project <strong style="color:#f97415;">${req.project.name}</strong> (${req.project.code}) has been <strong style="color:#dc2626;">rejected</strong> by Project Manager <strong>${pmUser.name}</strong>.</p>

    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:20px 24px;border-radius:0 8px 8px 0;margin:24px 0;">
      <p style="margin:0;font-size:14px;color:#991b1b;">The current project end date of <strong>${formatDate(req.currentEndDate)}</strong> remains unchanged.</p>
    </div>

    ${pmComment ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:16px 0;"><p style="margin:0;color:#475569;font-style:italic;"><strong>PM's Reason:</strong> "${pmComment}"</p></div>` : ''}

    <p>If you believe an extension is still necessary, please discuss this with your Project Manager before submitting a new request.</p>
  `);

  emailService.send({
    to: req.requestedBy.email,
    subject: `❌ Timeline Extension Rejected: ${req.project.code}`,
    html,
  }).catch(e => logger.error('Rejection email failed', { error: e.message }));

  await prisma.auditLog.create({
    data: {
      userId: pmUser.id,
      userName: pmUser.name,
      userRole: pmUser.role,
      action: 'REJECT_TIMELINE_EXTENSION',
      targetType: 'ProjectExtensionRequest',
      targetId: req.id,
      targetCode: req.project.code,
      details: { pmComment },
    },
  });

  logger.info('Extension request rejected', { id, pmUserId: pmUser.id });
  return { success: true };
}

module.exports = { create, getAll, approve, reject };

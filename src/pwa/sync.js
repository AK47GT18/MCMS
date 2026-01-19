/**
 * MCMS PWA - Offline Sync Endpoints
 * Provides data endpoints optimized for PWA offline sync
 */

const { prisma } = require('../config/database');
const { authenticate } = require('../middlewares/auth.middleware');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Get initial sync data for offline use
 * Returns essential data for the user to work offline
 */
const getInitialSync = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  // Fetch essential data in parallel
  const [projects, vendors, users] = await Promise.all([
    prisma.project.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        managerId: true,
        budgetTotal: true,
        budgetSpent: true,
      },
    }),
    prisma.vendor.findMany({
      where: { status: 'approved' },
      select: {
        id: true,
        name: true,
        category: true,
      },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
      },
    }),
  ]);
  
  response.success(res, {
    syncedAt: new Date().toISOString(),
    projects,
    vendors,
    users,
  });
});

/**
 * Get delta sync - changes since last sync
 */
const getDeltaSync = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const { since } = req.query || {};
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Get recent changes
  const [projects, requisitions, issues] = await Promise.all([
    prisma.project.findMany({
      where: { updatedAt: { gte: sinceDate } },
      select: { id: true, code: true, name: true, status: true, updatedAt: true },
    }),
    prisma.requisition.findMany({
      where: { updatedAt: { gte: sinceDate } },
      select: { id: true, reqCode: true, status: true, updatedAt: true },
    }),
    prisma.issue.findMany({
      where: { updatedAt: { gte: sinceDate } },
      select: { id: true, issueCode: true, status: true, priority: true, updatedAt: true },
    }),
  ]);
  
  response.success(res, {
    syncedAt: new Date().toISOString(),
    since: sinceDate.toISOString(),
    changes: {
      projects,
      requisitions,
      issues,
    },
  });
});

/**
 * Get user's assigned projects with tasks for offline
 */
const getMyProjects = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { managerId: user.id },
        { status: 'active' },
      ],
    },
    include: {
      tasks: {
        orderBy: { startDate: 'asc' },
        select: { id: true, name: true, startDate: true, endDate: true, progress: true },
      },
      manager: {
        select: { id: true, name: true },
      },
    },
  });
  
  response.success(res, {
    syncedAt: new Date().toISOString(),
    projects,
  });
});

/**
 * Push offline changes to server
 */
const pushChanges = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const { changes } = req.body || {};
  
  if (!changes || !Array.isArray(changes)) {
    return response.badRequest(res, 'Invalid changes format');
  }
  
  const results = {
    success: [],
    failed: [],
  };
  
  for (const change of changes) {
    try {
      // Process each change based on type
      const { type, entity, id, data, action } = change;
      
      // For now, just log - implement actual sync logic as needed
      results.success.push({ id, type, action });
    } catch (error) {
      results.failed.push({ id: change.id, error: error.message });
    }
  }
  
  response.success(res, {
    syncedAt: new Date().toISOString(),
    results,
  });
});

module.exports = {
  getInitialSync,
  getDeltaSync,
  getMyProjects,
  pushChanges,
};

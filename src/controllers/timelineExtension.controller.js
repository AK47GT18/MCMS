/**
 * MCMS Controller - Project Extension Requests
 */

const timelineExtService = require('../services/timelineExtension.service');
const { authenticate } = require('../middlewares/auth.middleware');
const { parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');
const response = require('../utils/response');

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const query = parseQuery(req.url);
  const filters = {};
  if (query.projectId) filters.projectId = query.projectId;
  if (query.status) filters.status = query.status;
  
  const userRole = user.role.replace(/ /g, '_');
  // PMs only see their own projects' requests
  // if (userRole === 'Project_Manager') filters.managerId = user.id;

  const requests = await timelineExtService.getAll(filters);
  response.success(res, requests);
});

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const body = await parseBody(req);
  if (!body.projectId || !body.requestedEndDate || !body.justification) {
    return response.badRequest(res, 'projectId, requestedEndDate, and justification are required');
  }
  if (body.justification.trim().length < 20) {
    return response.badRequest(res, 'Justification must be at least 20 characters');
  }

  const result = await timelineExtService.create(body, user);
  response.created(res, result);
});

const approve = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const userRole = user.role.replace(/ /g, '_');
  if (userRole !== 'Project_Manager') {
    return response.error(res, 'Only a Project Manager can approve extension requests', 403);
  }

  const body = await parseBody(req);
  const result = await timelineExtService.approve(id, user, body.pmComment);
  response.success(res, result);
});

const reject = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const userRole = user.role.replace(/ /g, '_');
  if (userRole !== 'Project_Manager') {
    return response.error(res, 'Only a Project Manager can reject extension requests', 403);
  }

  const body = await parseBody(req);
  if (!body.pmComment || body.pmComment.trim().length < 5) {
    return response.badRequest(res, 'A reason (pmComment) is required when rejecting');
  }

  const result = await timelineExtService.reject(id, user, body.pmComment);
  response.success(res, result);
});

module.exports = { getAll, create, approve, reject };

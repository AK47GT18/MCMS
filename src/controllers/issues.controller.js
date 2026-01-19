/**
 * MCMS Controller - Issues
 */

const issuesService = require('../services/issues.service');
const { validateBody, validateId, parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { createIssueSchema, updateIssueSchema, paginationSchema } = require('../utils/validators');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const query = parseQuery(req.url);
  const options = validateBody(query, paginationSchema, res);
  if (!options) return;
  
  const result = await issuesService.getAll({
    ...options,
    status: query.status,
    priority: query.priority,
    projectId: query.projectId ? parseInt(query.projectId) : undefined,
  });
  response.paginated(res, result.issues, result.page, result.limit, result.total);
});

const getById = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const issueId = validateId(id, res);
  if (!issueId) return;
  
  const result = await issuesService.getById(issueId);
  response.success(res, result);
});

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, createIssueSchema, res);
  if (!data) return;
  
  const result = await issuesService.create(data, user.id);
  response.created(res, result);
});

const update = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const issueId = validateId(id, res);
  if (!issueId) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, updateIssueSchema, res);
  if (!data) return;
  
  const result = await issuesService.update(issueId, data);
  response.success(res, result);
});

const resolve = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const issueId = validateId(id, res);
  if (!issueId) return;
  
  const body = await parseBody(req);
  const result = await issuesService.resolve(issueId, body.resolutionNotes);
  response.success(res, result);
});

const assign = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const issueId = validateId(id, res);
  if (!issueId) return;
  
  const body = await parseBody(req);
  const result = await issuesService.assign(issueId, body.assigneeId);
  response.success(res, result);
});

const getOpen = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const result = await issuesService.getOpen();
  response.success(res, result);
});

module.exports = { getAll, getById, create, update, resolve, assign, getOpen };

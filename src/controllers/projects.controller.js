/**
 * MCMS Controller - Projects
 * Handles project CRUD endpoints
 */

const projectsService = require('../services/projects.service');
const { validateBody, validateId, parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { createProjectSchema, updateProjectSchema, paginationSchema } = require('../utils/validators');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const query = parseQuery(req.url);
  const options = validateBody(query, paginationSchema, res);
  if (!options) return;
  
  const result = await projectsService.getAll({ ...options, status: query.status });
  response.paginated(res, result.projects, result.page, result.limit, result.total);
});

const getById = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const projectId = validateId(id, res);
  if (!projectId) return;
  
  const result = await projectsService.getById(projectId);
  response.success(res, result);
});

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, createProjectSchema, res);
  if (!data) return;
  
  const result = await projectsService.create(data);
  response.created(res, result);
});

const update = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const projectId = validateId(id, res);
  if (!projectId) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, updateProjectSchema, res);
  if (!data) return;
  
  const result = await projectsService.update(projectId, data);
  response.success(res, result);
});

const remove = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const projectId = validateId(id, res);
  if (!projectId) return;
  
  await projectsService.remove(projectId);
  response.noContent(res);
});

const getBudget = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const projectId = validateId(id, res);
  if (!projectId) return;
  
  const result = await projectsService.getBudgetSummary(projectId);
  response.success(res, result);
});

module.exports = { getAll, getById, create, update, remove, getBudget };

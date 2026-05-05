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
  
  // Filter by supervisor/manager if user has limited scope
  const filters = { ...options, status: query.status };
  const userRole = user.role.replace(/ /g, '_');
  
  if (userRole === 'Field_Supervisor') {
    filters.fieldSupervisorId = user.id;
  } else if (userRole === 'Project_Manager' && !user.permissions?.includes('read_all')) {
    filters.managerId = user.id;
  } else if (query.fieldSupervisorId) {
    filters.fieldSupervisorId = query.fieldSupervisorId;
  }
  
  const result = await projectsService.getAll(filters);
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
  
  const result = await projectsService.create(data, user);
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
  
  const result = await projectsService.update(projectId, data, user);
  response.success(res, result);
});

const remove = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const projectId = validateId(id, res);
  if (!projectId) return;

  const query = parseQuery(req.url);
  
  await projectsService.remove(projectId, user, query.reason);
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

const getMaterials = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const projectId = validateId(id, res);
  if (!projectId) return;
  
  const result = await projectsService.getMaterials(projectId);
  response.success(res, result);
});

const extendProject = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const projectId = validateId(id, res);
  if (!projectId) return;

  const body = await parseBody(req);
  
  if (!body.newEndDate) {
    response.error(res, 'newEndDate is required', 400);
    return;
  }
  if (!body.reason) {
    response.error(res, 'Extension reason is required', 400);
    return;
  }

  const result = await projectsService.extendProject(projectId, body.newEndDate, body.reason, user);
  response.success(res, result);
});

const getProgress = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const projectId = validateId(id, res);
  if (!projectId) return;

  const progress = await projectsService.calculateProgress(projectId);
  response.success(res, { projectId, progress });
});

module.exports = { getAll, getById, create, update, remove, getBudget, getMaterials, extendProject, getProgress };

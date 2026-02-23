/**
 * MCMS Controller - Tasks
 */

const tasksService = require('../services/tasks.service');
const { validateBody, validateId, parseBody } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { createTaskSchema, updateTaskSchema } = require('../utils/validators');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const result = await tasksService.getAll();
  response.success(res, result);
});

const getByProject = asyncHandler(async (req, res, projectId) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const id = validateId(projectId, res);
  if (!id) return;
  
  const result = await tasksService.getByProject(id);
  response.success(res, result);
});

const getByStatus = asyncHandler(async (req, res, status) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  if (!status) {
    return response.badRequest(res, 'Status is required');
  }
  
  const result = await tasksService.getByStatus(status);
  response.success(res, result);
});

const getById = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const taskId = validateId(id, res);
  if (!taskId) return;
  
  const result = await tasksService.getById(taskId);
  response.success(res, result);
});

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, createTaskSchema, res);
  if (!data) return;
  
  const result = await tasksService.create(data);
  response.created(res, result);
});

const update = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const taskId = validateId(id, res);
  if (!taskId) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, updateTaskSchema, res);
  if (!data) return;
  
  const result = await tasksService.update(taskId, data);
  response.success(res, result);
});

const remove = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const taskId = validateId(id, res);
  if (!taskId) return;
  
  await tasksService.remove(taskId);
  response.noContent(res);
});

const updateProgress = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const taskId = validateId(id, res);
  if (!taskId) return;
  
  const body = await parseBody(req);
  if (typeof body.progress !== 'number') {
    return response.badRequest(res, 'Progress must be a number');
  }
  
  const result = await tasksService.updateProgress(taskId, body.progress);
  response.success(res, result);
});

module.exports = { getAll, getByProject, getByStatus, getById, create, update, remove, updateProgress };

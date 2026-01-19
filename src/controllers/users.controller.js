/**
 * MCMS Controller - Users
 * Handles user CRUD endpoints
 */

const usersService = require('../services/users.service');
const { validateBody, validateId, parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { hasRole, hasMinimumRole } = require('../middlewares/rbac.middleware');
const { createUserSchema, updateUserSchema, paginationSchema } = require('../utils/validators');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Operations_Manager')) return;
  
  const query = parseQuery(req.url);
  const options = validateBody(query, paginationSchema, res);
  if (!options) return;
  
  const result = await usersService.getAll(options);
  response.paginated(res, result.users, result.page, result.limit, result.total);
});

const getById = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const userId = validateId(id, res);
  if (!userId) return;
  
  const result = await usersService.getById(userId);
  response.success(res, result);
});

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasRole(req, res, ['System_Technician', 'Managing_Director'])) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, createUserSchema, res);
  if (!data) return;
  
  const result = await usersService.create(data);
  response.created(res, result);
});

const update = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasMinimumRole(req, res, 'Operations_Manager')) return;
  
  const userId = validateId(id, res);
  if (!userId) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, updateUserSchema, res);
  if (!data) return;
  
  const result = await usersService.update(userId, data);
  response.success(res, result);
});

const remove = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasRole(req, res, ['System_Technician', 'Managing_Director'])) return;
  
  const userId = validateId(id, res);
  if (!userId) return;
  
  await usersService.remove(userId);
  response.noContent(res);
});

const lock = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasRole(req, res, ['System_Technician', 'Managing_Director'])) return;
  
  const userId = validateId(id, res);
  if (!userId) return;
  
  await usersService.setLockStatus(userId, true);
  response.success(res, { message: 'User locked' });
});

const unlock = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  if (!hasRole(req, res, ['System_Technician', 'Managing_Director'])) return;
  
  const userId = validateId(id, res);
  if (!userId) return;
  
  await usersService.setLockStatus(userId, false);
  response.success(res, { message: 'User unlocked' });
});

module.exports = { getAll, getById, create, update, remove, lock, unlock };

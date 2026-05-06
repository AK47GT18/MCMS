const budgetChangesService = require('../services/budgetChanges.service');
const { asyncHandler } = require('../middlewares/error.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const response = require('../utils/response');

const { parseQuery } = require('../middlewares/validate.middleware');

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  const data = { ...req.body, requesterId: user.id };
  const bcr = await budgetChangesService.create(data);
  response.success(res, bcr, 201);
});

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  const query = parseQuery(req.url);
  const bcrs = await budgetChangesService.getAll(query);
  response.success(res, bcrs);
});

const approve = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  const result = await budgetChangesService.approve(id, user.id);
  response.success(res, result);
});

const reject = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  const bcr = await budgetChangesService.reject(id, user.id);
  response.success(res, bcr);
});

module.exports = { create, getAll, approve, reject };

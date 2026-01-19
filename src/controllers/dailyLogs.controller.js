/**
 * MCMS Controller - Daily Logs
 */

const dailyLogsService = require('../services/dailyLogs.service');
const { validateBody, validateId, parseBody, parseQuery } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { createDailyLogSchema, paginationSchema } = require('../utils/validators');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const query = parseQuery(req.url);
  const options = validateBody(query, paginationSchema, res);
  if (!options) return;
  
  const result = await dailyLogsService.getAll({
    ...options,
    projectId: query.projectId ? parseInt(query.projectId) : undefined,
    startDate: query.startDate,
    endDate: query.endDate,
  });
  response.paginated(res, result.logs, result.page, result.limit, result.total);
});

const getById = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const logId = validateId(id, res);
  if (!logId) return;
  
  const result = await dailyLogsService.getById(logId);
  response.success(res, result);
});

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, createDailyLogSchema, res);
  if (!data) return;
  
  const result = await dailyLogsService.create(data, user.id);
  response.created(res, result);
});

const approve = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const logId = validateId(id, res);
  if (!logId) return;
  
  const result = await dailyLogsService.approve(logId, user.id);
  response.success(res, result);
});

const getSosAlerts = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const result = await dailyLogsService.getSosAlerts();
  response.success(res, result);
});

module.exports = { getAll, getById, create, approve, getSosAlerts };

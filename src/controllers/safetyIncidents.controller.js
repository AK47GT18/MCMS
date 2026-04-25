const safetyIncidentsService = require('../services/safetyIncidents.service');
const { asyncHandler } = require('../middlewares/error.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { parseBody, validateBody } = require('../middlewares/validate.middleware');
const { createSafetyIncidentSchema } = require('../utils/validators');
const response = require('../utils/response');

const create = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  const body = await parseBody(req);
  const data = validateBody(body, createSafetyIncidentSchema, res);
  if (!data) return;

  const incident = await safetyIncidentsService.create({ ...data, reporterId: user.id });
  response.success(res, incident, 201);
});

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  const incidents = await safetyIncidentsService.getAll(req.query);
  response.success(res, incidents);
});

const updateStatus = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  const { status } = req.body;
  if (!status) return response.badRequest(res, 'Status is required');
  const incident = await safetyIncidentsService.updateStatus(id, status, user.id);
  response.success(res, incident);
});

module.exports = { create, getAll, updateStatus };

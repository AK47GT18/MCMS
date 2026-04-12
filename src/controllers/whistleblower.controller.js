const whistleblowerService = require('../services/whistleblower.service');
const { asyncHandler } = require('../middlewares/error.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const response = require('../utils/response');

const create = asyncHandler(async (req, res) => {
  // Authentication is optional for whistleblower if they are completely anonymous, 
  // but if the system requires login, we get the user.
  let reporterId = null;
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    const user = await authenticate(req, res);
    if (user) reporterId = user.id;
  }
  
  const data = { ...req.body, reporterId };
  const report = await whistleblowerService.create(data);
  response.success(res, report, 201);
});

const getAll = asyncHandler(async (req, res) => {
  const user = await authenticate(req, res);
  if (!user) return;
  const reports = await whistleblowerService.getAll(req.query);
  response.success(res, reports);
});

const updateStatus = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  const { status } = req.body;
  if (!status) return response.badRequest(res, 'Status is required');
  const report = await whistleblowerService.updateStatus(id, status, user.id);
  response.success(res, report);
});

module.exports = { create, getAll, updateStatus };

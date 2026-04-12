/**
 * MCMS Controller - Reconciliation API
 */

const reconciliationService = require('../services/reconciliation.service');
const { asyncHandler } = require('../middlewares/error.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const response = require('../utils/response');

const getReport = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  if (!id) return response.badRequest(res, 'Project ID is required');

  const report = await reconciliationService.getProjectReconciliation(parseInt(id, 10));
  response.success(res, report);
});

const lock = asyncHandler(async (req, res, id) => {
  const user = await authenticate(req, res);
  if (!user) return;
  
  if (!id) return response.badRequest(res, 'Project ID is required');

  const result = await reconciliationService.lockReconciliation(parseInt(id, 10), user);
  response.success(res, result);
});

module.exports = {
  getReport,
  lock
};

/**
 * MCMS Controller - Asset Scheduler
 */

const schedulerService = require('../services/assetScheduler.service');
const response = require('../utils/response');
const { asyncHandler } = require('../middlewares/error.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

const getConflicts = asyncHandler(async (req, res) => {
    const user = await authenticate(req, res);
    if (!user) return;

    const conflicts = await schedulerService.detectConflicts();
    response.success(res, conflicts);
});

const getRecommendations = asyncHandler(async (req, res, projectId) => {
    const user = await authenticate(req, res);
    if (!user) return;

    if (!projectId) return response.badRequest(res, 'Project ID is required');

    const recommendations = await schedulerService.getRecommendations(projectId);
    response.success(res, recommendations);
});

const createReplenishment = asyncHandler(async (req, res) => {
    const user = await authenticate(req, res);
    if (!user) return;

    const replenishment = await schedulerService.createReplenishmentRequest({
        ...req.body,
        requestedBy: user.id
    });
    response.success(res, replenishment, 'Replenishment request created');
});

const approveReplenishment = asyncHandler(async (req, res, id) => {
    const user = await authenticate(req, res);
    if (!user) return;

    if (!['Finance_Director', 'Project_Manager'].includes(user.role)) {
        return response.forbidden(res, 'Not authorized to approve replenishment');
    }

    const updated = await schedulerService.bridgeToProcurement(id);
    response.success(res, updated, 'Replenishment request approved');
});

module.exports = {
    getConflicts,
    getRecommendations,
    createReplenishment,
    approveReplenishment
};

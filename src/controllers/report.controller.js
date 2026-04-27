/**
 * MCMS Controller - Reports
 */
const reportService = require('../services/reports.service');
const { sendResponse, sendError } = require('../utils/response');

async function getDynamicReport(req, res) {
  try {
    const params = req.body || {};
    
    // Validate required params
    if (!params.model) {
        return sendError(res, 400, 'Parameter "model" is required.');
    }

    const data = await reportService.dynamicReport(params);
    sendResponse(res, 200, 'Report generated successfully', data);
  } catch (error) {
    console.error('[ReportController] Error:', error);
    sendError(res, 500, error.message);
  }
}

// Map existing reports as well
async function getPMPortfolio(req, res) {
    try {
        const data = await reportService.pmPortfolio(req.query);
        sendResponse(res, 200, 'Portfolio report generated', data);
    } catch (error) {
        sendError(res, 500, error.message);
    }
}

module.exports = {
  getDynamicReport,
  getPMPortfolio
};

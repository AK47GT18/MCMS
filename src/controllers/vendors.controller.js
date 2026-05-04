/**
 * MCMS Controller - Vendors
 */

const vendorService = require('../services/vendors.service');
const response = require('../utils/response');
const { parseBody } = require('../middlewares/validate.middleware');

async function getAll(req, res) {
  const { page, limit, search, category } = req.query || {};
  const result = await vendorService.getAll({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search,
    category
  });
  response.success(res, result);
}

async function search(req, res) {
  const { q } = req.query || {};
  const results = await vendorService.search(q || '');
  response.success(res, results);
}

async function getById(req, res, id) {
  const result = await vendorService.getById(id);
  response.success(res, result);
}

async function create(req, res) {
  const body = await parseBody(req);
  const result = await vendorService.create(body, req.user?.id);
  response.success(res, result, 201);
}

async function update(req, res, id) {
  const body = await parseBody(req);
  const result = await vendorService.update(id, body, req.user?.id);
  response.success(res, result);
}

async function remove(req, res, id) {
  await vendorService.remove(id, req.user?.id);
  response.success(res, null, 204);
}

module.exports = {
  getAll,
  search,
  getById,
  create,
  update,
  remove
};

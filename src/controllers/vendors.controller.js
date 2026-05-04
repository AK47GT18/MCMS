/**
 * MCMS Controller - Vendors
 */

const vendorService = require('../services/vendors.service');
const response = require('../utils/response');

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

async function getById(req, res) {
  const result = await vendorService.getById(req.params.id);
  response.success(res, result);
}

async function create(req, res) {
  const result = await vendorService.create(req.body, req.user?.id);
  response.success(res, result, 201);
}

async function update(req, res) {
  const result = await vendorService.update(req.params.id, req.body, req.user?.id);
  response.success(res, result);
}

async function remove(req, res) {
  await vendorService.remove(req.params.id, req.user?.id);
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

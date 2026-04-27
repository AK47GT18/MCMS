/**
 * MCMS Controller - File Uploads
 * Handles generic file uploads to local storage
 */

const response = require('../utils/response');
const path = require('path');

const uploadFile = (req, res) => {
  if (!req.file) {
    return response.badRequest(res, 'No file uploaded or file type not allowed.');
  }

  // Calculate the public URL
  // The server serves public/ as root or falls back to public/
  // Our multer saves to public/uploads/documents/
  const fileUrl = `/uploads/documents/${req.file.filename}`;

  response.success(res, {
    message: 'File uploaded successfully',
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    url: fileUrl
  });
};

module.exports = {
  uploadFile
};

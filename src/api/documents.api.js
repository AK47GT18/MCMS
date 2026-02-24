const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentsService = require('../services/documents.service');
const response = require('../utils/response');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

/**
 * Register document routes
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function documentRoutes(req, res) {
  const url = req.url.split('?')[0];
  const method = req.method;

  console.log(`[DEBUG DOCUMENTS] Request: ${method} ${url}`, {
    authHeader: req.headers.authorization ? 'Present' : 'Missing',
    userAgent: req.headers['user-agent']
  });

  // Middleware simulation for simplicity in vanilla router
  try {
    const user = await authenticate(req, res);
    if (!user) return; // auth handles response if unauthorized

    // GET /api/v1/documents
    if (url === '/api/v1/documents' && method === 'GET') {
      const docs = await documentsService.getAll();
      return response.success(res, docs);
    }

    // POST /api/v1/documents (New Upload)
    if (url === '/api/v1/documents' && method === 'POST') {
      await authorize('Contract_Administrator', 'Project_Manager')(req, res, async () => {
        upload.single('file')(req, res, async (err) => {
          if (err) return response.error(res, err.message, 400);
          try {
            // Re-parsing body because multer populates it
            const doc = await documentsService.uploadDocument(req.body, req.file, user.id);
            return response.success(res, doc, 201);
          } catch (error) {
            return response.error(res, error.message, error.statusCode || 500);
          }
        });
      });
      return;
    }

    // PUT /api/v1/documents/:id (Update Details)
    const docMatch = url.match(/\/api\/v1\/documents\/(\d+)$/);
    if (docMatch && method === 'PUT') {
      await authorize('Contract_Administrator', 'Project_Manager')(req, res, async () => {
        try {
          const body = await require('../middlewares/validate.middleware').parseBody(req);
          const doc = await documentsService.updateDetails(docMatch[1], body);
          return response.success(res, doc);
        } catch (error) {
          return response.error(res, error.message, error.statusCode || 500);
        }
      });
      return;
    }

    // POST /api/v1/documents/:id/versions
    const versionMatch = url.match(/\/api\/v1\/documents\/(\d+)\/versions/);
    if (versionMatch && method === 'POST') {
      const documentId = versionMatch[1];
      await authorize('Contract_Administrator', 'Project_Manager')(req, res, async () => {
        upload.single('file')(req, res, async (err) => {
          if (err) return response.error(res, err.message, 400);
          try {
            const doc = await documentsService.addVersion(documentId, req.body, req.file, user.id);
            return response.success(res, doc);
          } catch (error) {
            return response.error(res, error.message, error.statusCode || 500);
          }
        });
      });
      return;
    }

    // GET /api/v1/documents/project/:id
    const projectMatch = url.match(/\/api\/v1\/documents\/project\/(\d+)/);
    if (projectMatch && method === 'GET') {
      const projectId = projectMatch[1];
      const docs = await documentsService.getByProject(projectId);
      return response.success(res, docs);
    }

    // If no route matches
    return false; // Let common router handle 404
  } catch (error) {
    if (error.statusCode === 401 || error.statusCode === 403) return; // Handled
    console.error('Document API Error:', error);
    return response.error(res, 'Internal Server Error', 500);
  }
}

module.exports = { documentRoutes };

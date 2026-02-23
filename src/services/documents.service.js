const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const emailService = require('../emails/email.service');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * Service to handle document-related operations
 */
const documentsService = {
  /**
   * Upload a new document
   */
  async uploadDocument(data, file, userId) {
    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    const { title, description, projectId } = data;
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
      include: { manager: true }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const fileUrl = `/uploads/documents/${file.filename}`;

    const document = await prisma.document.create({
      data: {
        title,
        description,
        originalName: file.originalname,
        currentVersionUrl: fileUrl,
        projectId: parseInt(projectId),
        uploadedById: userId,
        versions: {
          create: {
            versionNumber: 1,
            fileUrl: fileUrl,
            uploadedById: userId,
            changeNotes: 'Initial upload'
          }
        }
      }
    });

    // Notify Project Manager
    if (project.manager && project.manager.email) {
      await emailService.send({
        to: project.manager.email,
        subject: `New Document Uploaded: ${title}`,
        html: `
          <h1>New Document for ${project.name}</h1>
          <p>A new document <strong>${title}</strong> has been uploaded to your project by the Contract Administrator.</p>
          <p><strong>Description:</strong> ${description || 'N/A'}</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}${fileUrl}">View Document</a>
        `
      }).catch(err => logger.error('Failed to notify PM of document upload', err));
    }

    return document;
  },

  /**
   * Add a new version to an existing document
   */
  async addVersion(documentId, data, file, userId) {
    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    const docId = parseInt(documentId);
    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: { 
        project: { include: { manager: true } },
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 }
      }
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    const nextVersion = (document.versions[0]?.versionNumber || 1) + 1;
    const fileUrl = `/uploads/documents/${file.filename}`;

    const updatedDoc = await prisma.document.update({
      where: { id: docId },
      data: {
        currentVersionUrl: fileUrl,
        versions: {
          create: {
            versionNumber: nextVersion,
            fileUrl: fileUrl,
            uploadedById: userId,
            changeNotes: data.changeNotes || `Version ${nextVersion}`
          }
        }
      }
    });

    // Notify Project Manager
    if (document.project.manager && document.project.manager.email) {
      await emailService.send({
        to: document.project.manager.email,
        subject: `Document Updated: ${document.title} (v${nextVersion})`,
        html: `
          <h1>Document Updated for ${document.project.name}</h1>
          <p>A new version (v${nextVersion}) of <strong>${document.title}</strong> has been uploaded.</p>
          <p><strong>Change Notes:</strong> ${data.changeNotes || 'N/A'}</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}${fileUrl}">View Latest Version</a>
        `
      }).catch(err => logger.error('Failed to notify PM of document update', err));
    }

    return updatedDoc;
  },

  /**
   * Get all documents for a project
   */
  async getByProject(projectId) {
    return prisma.document.findMany({
      where: { projectId: parseInt(projectId) },
      include: {
        uploadedBy: { select: { name: true } },
        versions: { orderBy: { versionNumber: 'desc' } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  },

  /**
   * Get all documents (Contract Admin view)
   */
  async getAll() {
    return prisma.document.findMany({
      include: {
        project: { select: { name: true, code: true } },
        uploadedBy: { select: { name: true } },
        versions: { orderBy: { versionNumber: 'desc' } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
};

module.exports = documentsService;

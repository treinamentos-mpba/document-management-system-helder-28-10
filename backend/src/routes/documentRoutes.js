const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const { storageDirectory } = require('../config/storage');
const { getMaxUploadSizeBytes } = require('../config/upload');

function createDocumentRouter(documentController) {
  const router = express.Router();
  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, storageDirectory),
    filename: (_req, _file, callback) => callback(null, crypto.randomUUID())
  });
  const upload = multer({
    storage,
    limits: { fileSize: getMaxUploadSizeBytes(), files: 1 }
  });

  router.post('/upload', documentController.requireOwner, upload.single('file'), documentController.uploadDocument);
  router.get('/documents', documentController.requireOwner, documentController.listDocuments);
  router.get('/documents/:id/download', documentController.requireOwner, documentController.downloadDocument);

  return router;
}

module.exports = { createDocumentRouter };
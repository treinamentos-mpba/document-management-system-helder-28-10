const fs = require('node:fs/promises');
const path = require('node:path');
const { storageDirectory } = require('../config/storage');

async function removeUploadedFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

function createDocumentService(documentRepository) {
  return {
    async createDocument(file, owner) {
      if (file.size === 0) {
        await removeUploadedFile(file.path);
        const error = new Error('O arquivo enviado está vazio.');
        error.code = 'FILE_EMPTY';
        throw error;
      }

      const originalName = path.basename(file.originalname.replace(/\\/g, '/')) || 'document';
      const document = {
        id: file.filename,
        originalName,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner,
        storageFilename: file.filename,
        mimeType: file.mimetype
      };

      try {
        return documentRepository.save(document);
      } catch (error) {
        await removeUploadedFile(file.path);
        throw error;
      }
    },

    listDocuments(owner) {
      return documentRepository.listByOwner(owner);
    },

    async getDocumentForDownload(id, owner) {
      const document = documentRepository.findById(id);

      if (!document || document.owner !== owner) {
        return null;
      }

      const filePath = path.join(storageDirectory, document.storageFilename);

      try {
        await fs.access(filePath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          return null;
        }

        throw error;
      }

      return { document, filePath };
    }
  };
}

module.exports = { createDocumentService };
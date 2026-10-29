const path = require('node:path');

function createDocumentService(documentRepository, fileRepository) {
  return {
    async createDocument(file, owner) {
      if (file.size === 0) {
        await fileRepository.remove(file.filename);
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
        await fileRepository.remove(file.filename);
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

      const filePath = await fileRepository.findPath(document.storageFilename);

      if (!filePath) {
        return null;
      }

      return { document, filePath };
    }
  };
}

module.exports = { createDocumentService };
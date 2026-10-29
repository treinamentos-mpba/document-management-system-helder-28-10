const fs = require('node:fs/promises');
const path = require('node:path');
const { storageDirectory } = require('../config/storage');

function resolveStoragePath(filename) {
  if (!filename || path.basename(filename) !== filename) {
    throw new Error('Nome de arquivo inválido para o storage.');
  }

  const filePath = path.resolve(storageDirectory, filename);

  if (!filePath.startsWith(`${storageDirectory}${path.sep}`)) {
    throw new Error('Arquivo fora do diretório de storage.');
  }

  return filePath;
}

function createFileRepository() {
  return {
    async remove(filename) {
      const filePath = resolveStoragePath(filename);

      try {
        await fs.unlink(filePath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    },

    async findPath(filename) {
      const filePath = resolveStoragePath(filename);

      try {
        const stats = await fs.stat(filePath);
        return stats.isFile() ? filePath : null;
      } catch (error) {
        if (error.code === 'ENOENT') {
          return null;
        }

        throw error;
      }
    }
  };
}

module.exports = { createFileRepository };
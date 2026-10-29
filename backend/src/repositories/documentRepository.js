function toPublicDocument(document) {
  const { storageFilename, mimeType, ...publicDocument } = document;
  return publicDocument;
}

function createDocumentRepository() {
  const documents = new Map();

  return {
    save(document) {
      documents.set(document.id, { ...document });
      return toPublicDocument(document);
    },

    listByOwner(owner) {
      return Array.from(documents.values())
        .filter((document) => document.owner === owner)
        .map(toPublicDocument);
    },

    findById(id) {
      const document = documents.get(id);
      return document ? { ...document } : null;
    }
  };
}

module.exports = { createDocumentRepository };
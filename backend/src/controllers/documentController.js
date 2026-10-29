function createDocumentController(documentService) {
  function requireOwner(req, res, next) {
    const owner = req.get('X-User-Id')?.trim();

    if (!owner) {
      res.status(400).json({
        error: {
          code: 'USER_ID_REQUIRED',
          message: 'Informe o identificador do usuário no header X-User-Id.'
        }
      });
      return;
    }

    req.owner = owner;
    next();
  }

  return {
    async uploadDocument(req, res, next) {
      if (!req.file) {
        res.status(400).json({
          error: {
            code: 'FILE_REQUIRED',
            message: 'Envie um arquivo no campo file para continuar.'
          }
        });
        return;
      }

      try {
        const document = await documentService.createDocument(req.file, req.owner);
        res.status(201).json(document);
      } catch (error) {
        next(error);
      }
    },

    listDocuments(req, res) {
      res.status(200).json(documentService.listDocuments(req.owner));
    },

    async downloadDocument(req, res, next) {
      try {
        const result = await documentService.getDocumentForDownload(req.params.id, req.owner);

        if (!result) {
          res.status(404).json({
            error: {
              code: 'DOCUMENT_NOT_FOUND',
              message: 'Documento não encontrado.'
            }
          });
          return;
        }

        res.download(
          result.filePath,
          result.document.originalName,
          {
            headers: {
              'Content-Type': result.document.mimeType || 'application/octet-stream'
            }
          },
          (error) => {
            if (error && !res.headersSent) {
              next(error);
            } else if (error) {
              res.destroy(error);
            }
          }
        );
      } catch (error) {
        next(error);
      }
    },

    requireOwner
  };
}

module.exports = { createDocumentController };
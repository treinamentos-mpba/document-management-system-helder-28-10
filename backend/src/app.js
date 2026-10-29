// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const { createDocumentRepository } = require('./repositories/documentRepository');
const { createFileRepository } = require('./repositories/fileRepository');
const { createDocumentService } = require('./services/documentService');
const { createDocumentController } = require('./controllers/documentController');
const { createDocumentRouter } = require('./routes/documentRoutes');
const { errorHandler } = require('./controllers/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;
const documentRepository = createDocumentRepository();
const fileRepository = createFileRepository();
const documentService = createDocumentService(documentRepository, fileRepository);
const documentController = createDocumentController(documentService);

app.use(express.json());

app.use(createDocumentRouter(documentController));

// Endpoint de verificação de saúde. As demais rotas (/upload, /documents,
// /documents/:id/download) usam o roteador do DMS.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;

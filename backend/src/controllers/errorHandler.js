const multer = require('multer');

function sendError(res, status, code, message) {
  res.status(status).json({ error: { code, message } });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 413, 'FILE_TOO_LARGE', 'O arquivo excede o tamanho máximo permitido.');
    }

    return sendError(res, 400, 'FILE_REQUIRED', 'Envie um único arquivo no campo file.');
  }

  if (error.code === 'FILE_EMPTY') {
    return sendError(res, 400, 'FILE_EMPTY', 'O arquivo enviado está vazio.');
  }

  if (req.path === '/upload') {
    return sendError(res, 500, 'UPLOAD_FAILED', 'Não foi possível salvar o documento.');
  }

  if (req.path.endsWith('/download')) {
    return sendError(res, 500, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.');
  }

  return sendError(res, 500, 'INTERNAL_ERROR', 'Ocorreu um erro interno.');
}

module.exports = { errorHandler };
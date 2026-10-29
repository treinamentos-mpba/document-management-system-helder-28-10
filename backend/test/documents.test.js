const { once } = require('node:events');
const fs = require('node:fs/promises');
const { test } = require('node:test');
const assert = require('node:assert/strict');

process.env.MAX_UPLOAD_SIZE_BYTES = '64';

const app = require('../src/app');
const { storageDirectory } = require('../src/config/storage');

test('API de documentos', async (suite) => {
  const server = app.listen(0);
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const uploadedIds = [];

  suite.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await Promise.all(uploadedIds.map((id) => fs.unlink(`${storageDirectory}/${id}`).catch(() => {})));
  });

  await suite.test('faz upload, lista por owner e baixa o documento', async () => {
    const form = new FormData();
    form.append('file', new Blob(['conteudo de teste'], { type: 'text/plain' }), 'amostra.txt');

    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-a' },
      body: form
    });

    assert.equal(uploadResponse.status, 201);
    const document = await uploadResponse.json();
    uploadedIds.push(document.id);
    assert.equal(document.originalName, 'amostra.txt');
    assert.equal(document.owner, 'usuario-a');
    assert.equal(document.size, 17);
    assert.equal(typeof document.uploadedAt, 'string');
    assert.equal(Object.hasOwn(document, 'storageFilename'), false);

    const listResponse = await fetch(`${baseUrl}/documents`, {
      headers: { 'X-User-Id': 'usuario-a' }
    });
    assert.equal(listResponse.status, 200);
    assert.deepEqual(await listResponse.json(), [document]);

    const otherOwnerResponse = await fetch(`${baseUrl}/documents`, {
      headers: { 'X-User-Id': 'usuario-b' }
    });
    assert.deepEqual(await otherOwnerResponse.json(), []);

    const forbiddenDownload = await fetch(`${baseUrl}/documents/${document.id}/download`, {
      headers: { 'X-User-Id': 'usuario-b' }
    });
    assert.equal(forbiddenDownload.status, 404);

    const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
      headers: { 'X-User-Id': 'usuario-a' }
    });
    assert.equal(downloadResponse.status, 200);
    assert.match(downloadResponse.headers.get('content-disposition'), /amostra\.txt/);
    assert.equal(await downloadResponse.text(), 'conteudo de teste');
  });

  await suite.test('rejeita upload sem usuário antes de gravar o arquivo', async () => {
    const form = new FormData();
    form.append('file', new Blob(['nao deve ser salvo']), 'arquivo.txt');

    const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'USER_ID_REQUIRED');
  });

  await suite.test('rejeita arquivo ausente, vazio e acima do limite', async () => {
    const missingFileResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-a' },
      body: new FormData()
    });
    assert.equal(missingFileResponse.status, 400);
    assert.equal((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');

    const emptyFileForm = new FormData();
    emptyFileForm.append('file', new Blob([]), 'vazio.txt');
    const emptyFileResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-a' },
      body: emptyFileForm
    });
    assert.equal(emptyFileResponse.status, 400);
    assert.equal((await emptyFileResponse.json()).error.code, 'FILE_EMPTY');

    const oversizedFileForm = new FormData();
    oversizedFileForm.append('file', new Blob(['x'.repeat(65)]), 'grande.txt');
    const oversizedFileResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-a' },
      body: oversizedFileForm
    });
    assert.equal(oversizedFileResponse.status, 413);
    assert.equal((await oversizedFileResponse.json()).error.code, 'FILE_TOO_LARGE');
  });
});
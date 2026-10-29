const API_PREFIX = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_PREFIX}${path}`, options);

  if (!response.ok) {
    let message = 'Não foi possível concluir a solicitação.';

    try {
      const payload = await response.json();
      message = payload.error?.message || message;
    } catch {
      // Mantém a mensagem genérica quando a resposta não contém JSON.
    }

    throw new Error(message);
  }

  return response;
}

function userHeaders(owner) {
  return { 'X-User-Id': owner.trim() };
}

export async function listDocuments(owner) {
  const response = await request('/documents', {
    headers: userHeaders(owner)
  });

  return response.json();
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    headers: userHeaders(owner),
    body: formData
  });

  return response.json();
}

export async function downloadDocument(id, owner) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`, {
    headers: userHeaders(owner)
  });

  return response.blob();
}
import { useState } from 'react';
import { downloadDocument } from '../services/documentApi.js';

export default function DownloadButton({ document, owner, onError }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);
    onError('');

    try {
      const fileBlob = await downloadDocument(document.id, owner);
      const objectUrl = URL.createObjectURL(fileBlob);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = document.originalName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button
      className="download-button"
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      aria-label={`Baixar ${document.originalName}`}
      title={`Baixar ${document.originalName}`}
    >
      <span aria-hidden="true">↓</span>
      {isDownloading ? 'Baixando…' : 'Baixar'}
    </button>
  );
}
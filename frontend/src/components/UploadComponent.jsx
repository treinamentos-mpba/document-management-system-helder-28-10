import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';
import { formatFileSize } from './formatFileSize.js';

export default function UploadComponent({ owner, onUploaded, onError }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file || isUploading) {
      return;
    }

    setIsUploading(true);
    setStatus('');
    onError('');

    try {
      const uploadedDocument = await uploadDocument(file, owner);
      onUploaded(uploadedDocument);
      setStatus(`${uploadedDocument.originalName} foi enviado.`);
      setFile(null);
      inputRef.current.value = '';
    } catch (error) {
      onError(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(event) {
    setFile(event.target.files?.[0] || null);
    setStatus('');
    onError('');
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className={`file-picker${file ? ' has-file' : ''}`} htmlFor="document-file">
        <span className="picker-symbol" aria-hidden="true">+</span>
        <span className="picker-copy">
          <strong>{file ? file.name : 'Escolher um arquivo'}</strong>
          <small>{file ? formatFileSize(file.size) : 'Qualquer formato · selecione para enviar'}</small>
        </span>
        <input
          ref={inputRef}
          id="document-file"
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>

      <button className="primary-button" type="submit" disabled={!file || isUploading}>
        {isUploading ? 'Enviando…' : 'Enviar documento'}
      </button>

      <p className="upload-footnote">Arquivos associados a <strong>{owner}</strong></p>
      {status && <p className="success-message" role="status">{status}</p>}
    </form>
  );
}
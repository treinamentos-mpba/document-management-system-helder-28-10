import DownloadButton from './DownloadButton.jsx';
import { formatFileSize } from './formatFileSize.js';

export default function DocumentList({ documents, isLoading, owner, onError }) {
  if (isLoading) {
    return <p className="list-message" role="status">Carregando documentos…</p>;
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <p>Nenhum documento nesta biblioteca.</p>
      </div>
    );
  }

  return (
    <ul className="document-list">
      {documents.map((document) => (
        <li className="document-row" key={document.id}>
          <span className="file-type" aria-hidden="true">DOC</span>
          <div className="document-details">
            <strong title={document.originalName}>{document.originalName}</strong>
            <span>{formatFileSize(document.size)} <span aria-hidden="true">·</span> {formatDate(document.uploadedAt)}</span>
          </div>
          <DownloadButton document={document} owner={owner} onError={onError} />
        </li>
      ))}
    </ul>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}
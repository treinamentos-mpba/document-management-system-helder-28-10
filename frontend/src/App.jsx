import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments } from './services/documentApi.js';
import './App.css';

const OWNER_STORAGE_KEY = 'dms.userId';

function getStoredOwner() {
  return window.localStorage.getItem(OWNER_STORAGE_KEY) || 'usuario-demo';
}

export default function App() {
  const [owner, setOwner] = useState(getStoredOwner);
  const [ownerInput, setOwnerInput] = useState(owner);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setError('');

    listDocuments(owner)
      .then((items) => {
        if (isCurrent) {
          setDocuments(items);
        }
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(requestError.message);
          setDocuments([]);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [owner, refreshKey]);

  function handleOwnerSubmit(event) {
    event.preventDefault();
    const nextOwner = ownerInput.trim();

    if (!nextOwner) {
      return;
    }

    window.localStorage.setItem(OWNER_STORAGE_KEY, nextOwner);
    setOwner(nextOwner);
    setOwnerInput(nextOwner);
  }

  function handleUpload(document) {
    setDocuments((currentDocuments) => [document, ...currentDocuments]);
    setError('');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-name">DMS<span> / ARQUIVO</span></span>
        </a>

        <form className="owner-form" onSubmit={handleOwnerSubmit}>
          <label htmlFor="owner-id">Usuário atual</label>
          <input
            id="owner-id"
            value={ownerInput}
            onChange={(event) => setOwnerInput(event.target.value)}
            autoComplete="off"
            required
          />
          <button type="submit" disabled={!ownerInput.trim() || ownerInput.trim() === owner}>
            Aplicar
          </button>
        </form>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">BIBLIOTECA PESSOAL</p>
            <h1>Seus documentos</h1>
          </div>
          <p className="identity-note">Identificação local, sem autenticação</p>
        </div>

        {error && <p className="global-error" role="alert">{error}</p>}

        <div className="workspace-grid">
          <section className="upload-panel" aria-labelledby="upload-heading">
            <div className="section-heading">
              <span className="section-index">01</span>
              <div>
                <h2 id="upload-heading">Adicionar arquivo</h2>
                <p>Envie um documento para sua biblioteca.</p>
              </div>
            </div>
            <UploadComponent
              key={owner}
              owner={owner}
              onUploaded={handleUpload}
              onError={setError}
            />
          </section>

          <section className="documents-panel" aria-labelledby="documents-heading">
            <div className="documents-heading">
              <div className="section-heading">
                <span className="section-index">02</span>
                <div>
                  <h2 id="documents-heading">Arquivos</h2>
                  <p>{isLoading ? 'Carregando biblioteca' : 'Documentos deste usuário'}</p>
                </div>
              </div>
              <span className="document-count" aria-label={`${documents.length} documentos`}>
                {String(documents.length).padStart(2, '0')}
              </span>
            </div>
            <DocumentList
              documents={documents}
              isLoading={isLoading}
              owner={owner}
              onError={setError}
            />
            <button
              className="refresh-button"
              type="button"
              onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
              disabled={isLoading}
            >
              Atualizar lista
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

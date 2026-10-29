# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de documentos não vazios, de qualquer tipo de arquivo.
- Listagem dos documentos associados ao usuário da requisição.
- Download de um documento pelo identificador, limitado ao usuário associado.
- Registro dos metadados do documento e do identificador do seu dono.
- Interface web React para consumir a API por meio do proxy `/api` do Vite.

### Fora do escopo

- Autenticação, autorização baseada em credenciais ou cadastro de usuários.
- Armazenamento externo, em nuvem ou em serviços de terceiros.
- Persistência durável dos metadados, banco de dados ou recuperação automática após reiniciar o processo.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Filtro por tipo, busca, paginação ou ordenação configurável.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | A API deve aceitar o envio de um arquivo não vazio por `multipart/form-data`, no campo `file`. |
| RF-02 | O upload deve exigir o header `X-User-Id` com um identificador não vazio e registrar esse valor como `owner`. |
| RF-03 | A API deve rejeitar arquivo ausente, arquivo vazio, identificador de usuário ausente/inválido e arquivo acima do limite configurado, retornando um erro compreensível. |
| RF-04 | A API deve gerar um identificador único para cada documento e um nome físico de armazenamento que não dependa do nome original do arquivo. |
| RF-05 | Após um upload bem-sucedido, a API deve retornar os metadados públicos do documento criado, sem expor o caminho ou nome físico do arquivo. |
| RF-06 | A listagem deve exigir `X-User-Id` e retornar somente os documentos cujo `owner` corresponda ao identificador recebido. Quando não houver documentos, deve retornar uma lista vazia. |
| RF-07 | O download deve exigir `X-User-Id` e retornar o conteúdo binário apenas quando o documento existir e pertencer ao usuário indicado. Documento inexistente e documento pertencente a outro usuário devem resultar na mesma resposta `404`. |
| RF-08 | O download deve ser enviado como anexo e usar o nome original do documento no header `Content-Disposition`. |
| RF-09 | Os erros da API devem usar um formato JSON consistente, com código estável e mensagem em português. |

**Identidade e limite de confiança:** nesta fase, `X-User-Id` é somente um identificador de contexto. Como não há autenticação, o cliente pode informar qualquer valor; o filtro por `owner` organiza os dados, mas não protege documentos contra acesso de clientes que possam escolher outro identificador. Não tratar esse mecanismo como controle de acesso seguro.

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados exclusivamente no filesystem local, em `backend/storage`, usando Multer com `diskStorage`. Não usar armazenamento externo. |
| RNF-02 | Os metadados devem permanecer em memória durante a execução do processo. Reiniciar o backend perde os metadados; os arquivos no disco permanecem e podem ficar órfãos. |
| RNF-03 | O limite máximo do arquivo deve ser definido por uma variável de ambiente numérica positiva, `MAX_UPLOAD_SIZE_BYTES`. Não há valor padrão especificado; a configuração do ambiente deve fornecê-lo. |
| RNF-04 | A porta do backend deve ser configurável por variável de ambiente (`PORT`), conforme o princípio 12-Factor. A localização dos arquivos permanece fixa em `backend/storage`, conforme a restrição de armazenamento. |
| RNF-05 | O nome físico do arquivo deve ser gerado pela aplicação, sem usar diretamente o nome original como caminho, para evitar colisões e escrita fora do diretório de storage. |
| RNF-06 | As respostas da API devem ser previsíveis: JSON para metadados/erros e conteúdo binário para downloads. |
| RNF-07 | O backend deve manter a separação de responsabilidades e o fluxo de dependências definidos na seção 7. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único do documento, gerado pelo backend. |
| `originalName` | string | Nome original informado no upload; usado como nome sugerido no download. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload em formato ISO 8601. |
| `owner` | string | Valor do header `X-User-Id` recebido no upload. |

### Dado interno de armazenamento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `storageFilename` | string | Nome gerado pelo backend para localizar o arquivo dentro de `backend/storage`; nunca deve ser retornado pela API. |

O repositório mantém os metadados em memória e associa cada `id` ao arquivo físico correspondente. O campo interno não faz parte das respostas de listagem ou upload.

## 6. Contratos de API

Os caminhos abaixo são rotas do backend. O frontend deve chamá-las com o prefixo `/api`; o proxy do Vite encaminha a requisição ao backend removendo esse prefixo. O backend não deve duplicar `/api` nos caminhos das rotas.

### Formato de erro

Todas as respostas de erro da API usam `application/json`:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Envie um arquivo para continuar."
  }
}
```

O campo `code` é estável para tratamento pelo cliente. A mensagem é destinada à apresentação em português e não deve conter stack trace, caminhos internos ou detalhes do filesystem.

### `POST /upload`

- Header obrigatório: `X-User-Id` com identificador não vazio.
- Entrada: `multipart/form-data`, com um arquivo no campo `file`.
- Política: aceitar qualquer tipo de arquivo, desde que não esteja vazio e não exceda `MAX_UPLOAD_SIZE_BYTES`.
- Sucesso: `201 Created`, `application/json`, com o objeto de metadados públicos criado.
- Erros:
  - `400 Bad Request`: header ausente/vazio (`USER_ID_REQUIRED`), arquivo ausente (`FILE_REQUIRED`) ou arquivo vazio (`FILE_EMPTY`).
  - `413 Payload Too Large`: arquivo acima do limite (`FILE_TOO_LARGE`).
  - `500 Internal Server Error`: falha ao gravar arquivo ou registrar metadados (`UPLOAD_FAILED`).
- Se o arquivo for gravado, mas o registro dos metadados falhar, a aplicação deve tentar remover o arquivo recém-gravado para não deixar um órfão decorrente de falha parcial.

Exemplo de sucesso:

```json
{
  "id": "uuid-gerado",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-10-29T12:00:00.000Z",
  "owner": "usuario-123"
}
```

### `GET /documents`

- Header obrigatório: `X-User-Id` com identificador não vazio.
- Saída de sucesso: `200 OK`, `application/json`, com uma lista de metadados públicos pertencentes ao usuário indicado. Lista vazia retorna `[]`.
- Erro: `400 Bad Request` com código `USER_ID_REQUIRED` quando o header estiver ausente ou vazio.
- A resposta não inclui `storageFilename` nem caminhos locais.

### `GET /documents/:id/download`

- Header obrigatório: `X-User-Id` com identificador não vazio.
- Sucesso: `200 OK`, corpo binário, `Content-Disposition: attachment` com o nome original e `Content-Type` do arquivo quando disponível; usar `application/octet-stream` como fallback.
- Erros:
  - `400 Bad Request` com código `USER_ID_REQUIRED` quando o header estiver ausente ou vazio.
  - `404 Not Found` com código `DOCUMENT_NOT_FOUND` se o documento não existir, não pertencer ao usuário indicado ou se o arquivo físico não estiver disponível. A resposta não deve revelar qual dessas condições ocorreu.
  - `500 Internal Server Error` com código `DOWNLOAD_FAILED` para outras falhas de leitura.

### Códigos e status de erro

| Status | Código | Condição |
| --- | --- | --- |
| `400` | `USER_ID_REQUIRED` | Header `X-User-Id` ausente ou vazio. |
| `400` | `FILE_REQUIRED` | Campo `file` ausente no upload. |
| `400` | `FILE_EMPTY` | Arquivo enviado sem conteúdo. |
| `413` | `FILE_TOO_LARGE` | Tamanho acima de `MAX_UPLOAD_SIZE_BYTES`. |
| `404` | `DOCUMENT_NOT_FOUND` | Documento inexistente, de outro usuário ou sem arquivo físico disponível. |
| `500` | `UPLOAD_FAILED` | Falha interna durante gravação ou registro do upload. |
| `500` | `DOWNLOAD_FAILED` | Falha interna durante leitura do arquivo. |

## 7. Decisões arquiteturais

- Backend em Node.js e Express, usando CommonJS e JavaScript.
- Aplicar Clean Architecture simples dentro de `backend/src`, com dependências no sentido `routes -> controllers -> services -> repositories`:
  - `routes/`: declarar caminhos, middlewares de upload e encaminhar requisições.
  - `controllers/`: validar a entrada HTTP, chamar serviços e formar status, headers e respostas.
  - `services/`: aplicar regras de negócio, incluindo owner, limite e coordenação do upload/download.
  - `repositories/`: manter metadados em memória e resolver o arquivo no storage local.
- Camadas internas não devem depender de Express nem de detalhes de transporte HTTP; os controllers adaptam HTTP para os casos de uso.
- Usar Multer com `diskStorage` para gravação local em `backend/storage`. Usar identificador/nome gerado para o arquivo físico; preservar separadamente o nome original nos metadados.
- Frontend em React com componentes funcionais e Hooks. Organizar a interface em componentes, páginas e serviços; centralizar chamadas `fetch` em serviços e usar o prefixo `/api` configurado no Vite.
- Mensagens apresentadas ao usuário e comentários devem ser em português; nomes de símbolos devem ser em inglês.
- O seed atual expõe somente `GET /health`; os endpoints desta especificação são requisitos futuros e ainda não estão implementados.

## 8. Plano de execução futuro

As etapas abaixo descrevem a implementação futura do produto. Esta especificação não executa nem altera arquivos de backend ou frontend.

1. Definir e validar configuração do backend, inclusive `PORT` e `MAX_UPLOAD_SIZE_BYTES`, e preparar o storage local.
2. Implementar repositório de metadados em memória e mapeamento seguro entre identificador e arquivo local.
3. Implementar serviços de upload, listagem por owner e download, incluindo tratamento de falha parcial.
4. Implementar controllers e rotas Express para os contratos desta especificação, integrando Multer `diskStorage` e os formatos de resposta/erro.
5. Criar testes backend com `node:test` para casos de sucesso, validação, isolamento por owner e falhas de filesystem.
6. Implementar a interface React para upload, listagem e download, usando serviços `fetch` sob `/api` e apresentando mensagens de erro em português.
7. Validar o fluxo integrado no ambiente local e revisar a documentação de execução e configuração.

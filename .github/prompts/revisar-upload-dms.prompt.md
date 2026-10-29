---
description: Revisa segurança e tratamento de erros no fluxo de upload, armazenamento local e download do DMS.
name: revisar-upload-dms
argument-hint: arquivos ou fluxo a revisar (opcional)
agent: code-reviewer
---

# Revisar fluxo de documentos do DMS

Revise `${input:escopo:arquivos ou fluxo a revisar}`. Se nenhum escopo for informado, examine as alterações atuais relacionadas a upload, listagem e download.

Leia `.github/copilot-instructions.md` e `docs/specs/dms-spec.md` antes de avaliar. Inspecione as rotas, controllers, services, repositories, configuração do Multer e testes envolvidos. Faça uma revisão somente leitura; não altere arquivos.

## Pontos de verificação

- Validar presença e formato esperado dos dados recebidos, incluindo arquivo, identificador e limite de tamanho.
- Seguir o caminho do arquivo enviado até o filesystem: configuração de `diskStorage`, diretório local fixo, nome gerado, colisões, limpeza em falhas e exposição de caminhos internos.
- Seguir o caminho de listagem e download: filtro por `owner`, existência do documento, correspondência com arquivo no disco, headers e tratamento de erros sem revelar detalhes internos.
- Conferir limites de confiança: `X-User-Id` é um identificador fornecido pelo cliente, não autenticação. Não considerar esse header uma barreira de segurança entre usuários.
- Verificar se os testes cobrem casos de sucesso, entradas inválidas, acesso por outro owner e falhas relevantes do filesystem.
- Relacionar cada possível problema a evidência concreta no código ou à ausência de um teste que deveria verificar o comportamento.

## Formato da resposta

Apresente primeiro os achados, em ordem de severidade. Para cada achado, informe arquivo e trecho relevante, cenário de impacto e correção recomendada. Separe riscos confirmados de hipóteses. Se não encontrar problemas, declare isso e liste brevemente os riscos ou lacunas de cobertura restantes. Não proponha mudanças fora do escopo solicitado.

## Referência de inspiração

A estrutura de revisão por superfícies e evidências foi adaptada para este projeto a partir da abordagem da skill `security-review` do repositório [github/awesome-copilot](https://github.com/github/awesome-copilot/tree/main/skills/security-review). O conteúdo deste prompt é específico ao DMS e às suas restrições locais.

# AI Log — Diário de Engenharia Assistida por IA

* **Projeto:** Cristal Master
* **Equipe:** Ithalo Willian Maximino da Silva, Alexandre Fabricio Guenther, Paulo Henrique Araujo da Silva e Silva
* **Repositório:** https://github.com/zIthalo/cristal-master

---

## 1. Ferramental Utilizado
* **Modelos / Plataformas:** Claude Sonnet 5
* **Assistentes de IDE:** Copilot, Cursor

---

## 2. Registro Semanal de Interações Técnicas

### Sprint / Semana 01 — Levantamento de requisitos, atores e casos de uso

#### 1. Contexto e Objetivo da Tarefa
* Definir os atores, casos de uso, requisitos funcionais e não funcionais.

#### 2. Principais Prompts e Contexto Fornecido
* **Prompt 1:** Foi enviado um "prompt mestre" definindo o papel da IA (arquiteto sênior, DBA, segurança, QA e consultor de Indústria 4.0), o contexto do projeto (PWA de almoxarifado com FIFO), o escopo mínimo do MVP, a stack e o formato de resposta. Em seguida, foi enviado o enunciado do desafio (descrição, benefícios esperados, detalhamento e restrições) pedindo a análise do problema e o passo a passo para a resolução.
* **Contexto adicional:** Enunciado completo do desafio "Descentralização do ERP e Otimização do Fluxo no Almoxarifado" e as três restrições (uso exclusivo de dispositivos móveis, zero investimento em estrutura física, interface limpa e rápida).

#### 3. Avaliação da Resposta Gerada
* **O que funcionou de primeira:** A IA separou o problema em duas causas-raiz (quebra do FIFO físico e atraso na baixa do ERP) e identificou os requisitos funcionais e não funcionais a partir do enunciado.
* **Falhas, alucinações ou código quebrado:**

#### 4. Intervenção Humana e Refatoração
* Na Semana 01, a equipe analisou se os requisitos, casos de uso e atores gerados com auxílio da IA estavam coerentes com o enunciado.

---

### Sprint / Semana 02 (Sprint 1) — Definição da arquitetura e do escopo do MVP

#### 1. Contexto e Objetivo da Tarefa
* Definir a arquitetura, o escopo do MVP (o que faz e o que não faz) e a stack técnica, considerando o limite de 42 horas do projeto. Preencher o README.md e criar o primeiro registro do AI_LOG.md.

#### 2. Principais Prompts e Contexto Fornecido
* **Prompt principal:** Considerando o prompt mestre (MVP com login, permissões, leitura de QR Code, consulta de materiais e lotes, validação FIFO, saída de material, histórico, dashboard e logs; stack React + TypeScript + Vite, Node + Express + TypeScript, MySQL, JWT + bcrypt, Jest + Supertest), a IA foi solicitada a "analisar o contexto do problema a ser resolvido e dar o passo a passo para a resolução", analisando previamente como arquiteto, especialista em MySQL, segurança, testes e Indústria 4.0.
* **Contexto adicional:** Enunciado do desafio e restrições. Depois, a IA foi solicitada a ajudar no preenchimento do README.md e do AI_LOG.md.

#### 3. Avaliação da Resposta Gerada

**O que a IA sugeriu de útil:**
* Separar o problema em duas frentes: (a) captura de dados em tempo real via PWA e (b) garantia do FIFO físico. Digitalizar as fichas sem tratar a posição dos lotes só registraria o problema, sem resolvê-lo.
* Modelar a **posição/endereço lógico** dos lotes no piso, com regra organizacional de um único lote por posição (custo zero, compatível com a restrição de não comprar porta-pallets).
* O app **indicar o lote/posição correto antes da leitura** e bloquear a saída se o QR lido for diferente do esperado, com exceção só aprovada por Supervisor e registrada em log.
* Perfis mínimos: Operador, Supervisor e Administrador.
* Registrar em log toda tentativa (correta ou incorreta) para rastreabilidade.
* Tratar a integração com o ERP como contrato de API simulado, já que o ERP real não está disponível.
* Cuidados de segurança: logout por inatividade em dispositivos compartilhados, rate limiting e idempotência no endpoint de confirmação de saída.

**O que a equipe descartou por ser complexo demais para 42 horas:** Ainda estamos em análise verificando o tempo disponível que temos para entender o que dará para entregar e o que não será possível entregar.
* Integração real com o ERP (sem acesso ao sistema e sem especificação de API).
* Modo offline completo (fila local em IndexedDB com sincronização em background).
* Leitura por RFID como evolução do QR Code.
* Dashboard preditivo de risco de obsolescência de lotes.
* Entidade de posição com layout gráfico do piso (mantida apenas como campo de endereço lógico).

**Falhas, alucinações ou pontos de atenção:**
* A IA declarou como suposição, e não como fato, que o PWA complementa o ERP em vez de substituí-lo, e que os perfis de usuário são inferidos do enunciado. Ambos precisam de validação.

#### 4. Intervenção Humana e Refatoração

**Decisão final tomada pelos integrantes:** `[Ainda não foi necessária intervenção humana, pois ainda não foram desenvolvidos códigos. O retorno que a IA nos trouxe, para o momento, foi essencial.]`
* Desenvolver o MVP com as 10 funcionalidades do escopo mínimo (login, permissões, leitura de QR Code, consulta de materiais e lotes, validação FIFO, saída de material, histórico, dashboard simples e logs).
* Adotar a stack: React + TypeScript + Vite (PWA), Node.js + Express + TypeScript, MySQL, JWT + Refresh Token + bcrypt, Jest + Supertest, Git/GitHub.
* Simular a integração com o ERP por uma API própria e deixar a integração real, o modo offline e o RFID como melhorias futuras.
* Manter a posição do lote como endereço lógico simples, com regra FIFO por menor data de entrada entre lotes disponíveis do material.

---

### Sprint / Semana 03 (Aula 03) — Modelagem de dados, simplificação do schema e mock de dados industriais

#### 1. Contexto e Objetivo da Tarefa
* Modelar as entidades do banco de dados e o Diagrama Entidade-Relacionamento (DER), gerar o script DDL do schema MySQL e criar um script gerador de dados mock (operação normal + anomalias), conforme orientação da disciplina para a Aula 03: banco enxuto, de 3 a 5 tabelas no máximo.

#### 2. Principais Prompts e Contexto Fornecido
* **Prompt 1:** "Monte para mim um diagrama DER de banco de dados e me entregue o código para modelar." — sem a restrição de 3-5 tabelas ainda explícita no prompt.
* **Prompt 2 (mesma aula, com o enunciado oficial da Aula 03):** pedido de modelagem enxuta (3-5 tabelas), com exemplo de referência (`produtos`, `lotes`, `movimentacoes`) e exigência de um script gerador de mock com casos normais (~90%) e anomalias (~10%).
* **Contexto adicional:** Todo o histórico da conversa (prompt mestre, escopo do MVP, stack e DER anterior), usado pela IA para manter coerência com o que já havia sido decidido.

#### 3. Avaliação da Resposta Gerada

**O que a IA sugeriu de útil:**
* No primeiro prompt, um modelo mais completo com 8 entidades (`perfis`, `usuarios`, `refresh_tokens`, `materiais`, `posicoes`, `lotes`, `ordens_producao`, `movimentacoes`), incluindo RBAC extensível e auditoria de exceções — tecnicamente correto, mas acima do escopo pedido pela disciplina para esta entrega.
* Ao receber o enunciado oficial da Aula 03, a IA simplificou corretamente para 3 tabelas (`produtos`, `lotes`, `movimentacoes`), incorporando o endereço lógico (`posicao`) como coluna de `lotes` em vez de tabela separada, mantendo a lógica FIFO sem inflar o modelo.
* Índice composto `idx_lotes_fifo (produto_id, status, data_fabricacao)` para a consulta mais frequente do sistema.
* Script `mock/simulator.js` em Node.js (consistente com a stack do backend), com os três tipos de anomalia pedidos: lote fora de ordem (`bloqueado_fifo`), lote vencido (`bloqueado_vencido`) e quantidade acima do saldo (`bloqueado_quantidade`), além de dois modos de execução (lote histórico e geração contínua).

**O que a equipe descartou por ser complexo demais para 42 horas:**
* O modelo de 8 entidades da primeira resposta — autenticação, RBAC completo e ordens de produção foram mantidos como visão de arquitetura futura no README, mas não implementados nesta entrega.
* Gravação direta em MySQL como padrão do mock: optou-se por arquivo (JSON/NDJSON) como saída principal, para não depender de um banco já rodando durante a demonstração. (A flag opcional `--mysql` foi removida na Semana 04; o carregamento passou a ser feito por `npm run seed` no backend.)

**Falhas, alucinações ou pontos de atenção:**
* A IA alertou que os `CHECK` de quantidade só são de fato aplicados a partir do MySQL 8.0.16; em versões anteriores a constraint é aceita na sintaxe mas ignorada silenciosamente. **Precisa ser validado contra a versão do MySQL do ambiente de entrega.** `[CONFIRMAR]`
* No script de mock, um caso de borda (lote com saldo muito baixo tentando gerar uma retirada "normal") foi tratado com um valor mínimo de segurança; a equipe deve rodar o script e observar os logs para confirmar que os números gerados fazem sentido antes da apresentação. `[CONFIRMAR]`
* **Atualização (Semana 04):** a IA entregou este mock sem executá-lo. Ao rodar, ele gerava ~390 registros quando pedíamos 3.000, entre outros problemas. Detalhes e correção na Semana 04.

#### 4. Intervenção Humana e Refatoração

**Decisão final tomada pelos integrantes:** `[CONFIRMAR / ajustar com a equipe]`
* Adotar o modelo enxuto de 3 tabelas (`produtos`, `lotes`, `movimentacoes`) como schema oficial da entrega da Aula 03, versionado em `database/schema_mvp.sql`.
* Manter o modelo de 8 tabelas apenas como documentação de arquitetura estendida no README, sem implementá-lo agora.
* Rodar `mock/simulator.js` no modo histórico antes da apresentação para validar visualmente as três anomalias geradas.

---

### Sprint / Semana 04 (consolidação do Sprint 1) — Setup do backend: estrutura em camadas, conexão com o banco e rotas base

#### 1. Contexto e Objetivo da Tarefa
* Criar o scaffold do backend em camadas, ler configuração de um `.env`, conectar ao banco da Aula 03 criando as tabelas automaticamente na inicialização, e implementar as rotas base `GET /health` (teste real do banco) e `GET /api/lotes` (consulta de dados do mock).

#### 2. Principais Prompts e Contexto Fornecido
* **Prompt 1:** "Atue como Engenheiro de Software Backend. Crie uma estrutura de pastas minimalista para uma API em [FastAPI (Python) / Express (Node.js)] utilizando [SQLite / PostgreSQL]. Inclua a configuração de conexão com o banco de dados e garanta que as variáveis venham de um arquivo .env. Mostre apenas o código dos arquivos essenciais sem complexidade excessiva." (enviado com os colchetes do template sem preencher; a IA escolheu Express + MySQL para manter a stack já definida no README).
* **Prompt 2:** enunciado da aula: scaffold em camadas (`controllers`, `models`, `routes`, `mock`), `.gitignore`, `.env.example`, conexão ao banco da Aula 03 com criação automática das tabelas, `GET /health` testando o banco, uma rota que consulte dados do mock e consolidação no AI_LOG.
* **Contexto adicional:** histórico da conversa (stack, escopo do MVP, modelo de 3 tabelas) e os arquivos do repositório no GitHub.

#### 3. Avaliação da Resposta Gerada

**O que a IA sugeriu de útil:**
* Estrutura em camadas (`config`, `database`, `models`, `controllers`, `routes`, `middlewares`), com `app.ts` separado de `server.ts` para permitir testes com Supertest.
* Configuração por `DATABASE_URL`, validada na inicialização: falta de variável ou URL malformada derruba a API com mensagem clara; o nome do banco é restrito a letras, números e `_` porque entra num `CREATE DATABASE`.
* DDL automático e idempotente (`CREATE DATABASE/TABLE IF NOT EXISTS`) a cada start. Os índices foram colocados dentro do `CREATE TABLE`, porque o MySQL não aceita `CREATE INDEX IF NOT EXISTS`.
* `GET /health` executa `SELECT 1` com timeout de 3 s a cada chamada e devolve `503` sem expor detalhes internos do erro.
* `GET /api/lotes` em ordem FIFO, com filtros validados e queries parametrizadas; `npm run seed` transacional e bloqueado quando `NODE_ENV=production`.
* **Testes executados de verdade** (MariaDB 10.11 local): banco inexistente criado sozinho; reinício sem perder dados; banco derrubado (`/health` → 503) e religado (volta a 200 sem reiniciar a API); parâmetros inválidos e tentativas de SQL injection recusados com `400`; `.env` inválido; seed sem arquivos do mock; build compilado em `dist/`.

**Erros, falhas e retrabalho causados pela IA:**
* **Mock da Aula 03 entregue sem ser executado.** Ao rodar com `--quantidade=3000`, gerou só 392 registros (o estoque acabava e a simulação encerrava), contra os 1.000 a 5.000 exigidos. Também: todos os eventos tinham o mesmo timestamp; pela leitura da lógica, o lote mais antigo podia estar vencido e sair como `sucesso`, contradizendo a anomalia `bloqueado_vencido`; posições do piso eram sorteadas sem respeitar "uma posição, um lote"; e o modo `--mysql` nunca atualizava `qtd_atual`, deixando o saldo inconsistente. **Correção:** reescrita com eventos de `entrada` (reposição), relógio simulado, lote vencido só como anomalia, posição livre preferencial e remoção do `--mysql`. Um script de replay independente passou a validar as regras (FIFO nas saídas com sucesso, saldo, ordem dos timestamps) com 1.000, 2.000 e 5.000 eventos.
* **A primeira versão da reposição acumulava estoque** (taxa de 8%), e o replay mostrou 37 posições compartilhadas por mais de um lote. Ajustada para 6% após calcular o ponto de equilíbrio entre entrada e consumo.
* **Bibliotecas desatualizadas.** A IA fixou versões de memória: `express ^4`, `dotenv ^16`, `typescript ^5`. Via `npm view`, as mais recentes são Express 5.2.1, dotenv 18.0.6 e TypeScript 7.0.2. O Express foi migrado para a 5 (todos os testes repetidos e aprovados); dotenv 16 e TypeScript 5 foram mantidos por não haver necessidade no MVP e para evitar risco de incompatibilidade. `[CONFIRMAR decisão]`
* **Erro de sintaxe de shell:** `mkdir -p src/{config,routes}` não expande chaves no `/bin/sh` do ambiente; 3 arquivos deixaram de ser criados e o `tsc` acusou "Cannot find module". Corrigido criando as pastas explicitamente.
* **`/health` da primeira versão** só tinha sido compilado, nunca executado contra um banco real, e não tinha timeout. Agora testado, com timeout.
* **Caminhos esperados sem conferir o repositório real:** a IA gerou o README apontando para `database/` e `mock/`, mas no GitHub os arquivos estão na raiz (e existe uma pasta `mnt/user-data/outputs/mock`). Os links estavam quebrados.
* **Falhas de ferramenta nos testes:** `/usr/bin/time` não existe no ambiente (um teste do `/health` com banco fora não rodou e foi refeito com `curl -w`); e `pkill -f` encerrou o próprio shell por casar com o texto do comando.

**O que a equipe descartou por ser complexo demais para 42 horas:** `[CONFIRMAR / ajustar com a equipe]`
* Camada `service`/`repository` separada: por ora só há uma rota de leitura, então o `model` acessa os dados. Entra junto com a regra FIFO de saída.
* ORM e migrações versionadas (Prisma/Knex): o DDL idempotente basta neste estágio.
* Autenticação JWT nesta etapa (próximo sprint) e testes automatizados com Jest/Supertest (o `app.ts` já está preparado, mas os testes ainda não foram escritos).

**Limitações do que foi testado:** a API foi validada em **MariaDB 10.11**, não em MySQL 8; ainda não há testes automatizados nem teste de carga.

#### 4. Intervenção Humana e Refatoração

**Decisão final tomada pelos integrantes:** `[CONFIRMAR / ajustar com a equipe]`
* Manter o modelo de 3 tabelas (`database/schema_mvp.sql`) como oficial, com o DDL espelhado em `backend/src/database/schema.ts`.
* Reorganizar o repositório para `backend/`, `database/` e `mock/`, e parar de versionar dados gerados (`mock/output/` agora no `.gitignore`).
* Usar `npm run seed` como único caminho para carregar o mock no banco.
* Validar a API em MySQL 8 antes da apresentação.

**Lição desta semana:** código "pronto" que a IA não executou não é confiável. Os defeitos do mock só apareceram ao rodar o script e escrever um replay independente das regras de negócio.

---

## 3. Síntese Crítica de Encerramento (Preenchida na Semana 13)

* **Onde a IA mais acelerou a entrega:** (Tarefas onde o ganho de tempo foi evidente).
* **Onde a IA mais atrapalhou ou gerou retrabalho:** (Problemas de contexto, bugs difíceis de achar, código redundante).
* **Lições aprendidas de engenharia de software:** (Como a abordagem técnica da equipe mudou ao longo das 42 horas).

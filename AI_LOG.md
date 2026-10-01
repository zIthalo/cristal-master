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

**Decisão final tomada pelos integrantes:** `[Ainda não foi necessária intervenção humana, pois ainda não foram desenvilvidos códigos. O Retorno que a IA nos trouxe, para o momento, foi essencial.]`
* Desenvolver o MVP com as 10 funcionalidades do escopo mínimo (login, permissões, leitura de QR Code, consulta de materiais e lotes, validação FIFO, saída de material, histórico, dashboard simples e logs).
* Adotar a stack: React + TypeScript + Vite (PWA), Node.js + Express + TypeScript, MySQL, JWT + Refresh Token + bcrypt, Jest + Supertest, Git/GitHub.
* Simular a integração com o ERP por uma API própria e deixar a integração real, o modo offline e o RFID como melhorias futuras.
* Manter a posição do lote como endereço lógico simples, com regra FIFO por menor data de entrada entre lotes disponíveis do material.

---

### Sprint / Semana 03 (Sprint 2) — Modelagem de dados e mock industrial

#### 1. Contexto e Objetivo da Tarefa
* Definir o esquema enxuto do banco (3 a 5 tabelas) para o módulo FIFO/Almoxarifado e criar um gerador de dados mock (script independente) para alimentar a aplicação com dados realistas antes do backend estar pronto.

#### 2. Principais Prompts e Contexto Fornecido
* **Prompt principal:** Com base no README.md e no AI_LOG.md já publicados no repositório (escopo do MVP e stack técnica), foi pedido para desenhar a modelagem enxuta de dados (DDL) e criar, em uma pasta `/mock`, um script gerador de dados industriais que simulasse operação normal (~90%) e anomalias (~10%), incluindo explicitamente os casos "máquina/lote fora de ordem no FIFO" e "lote vencido tentando passar no FIFO".
* **Contexto adicional:** Links do README.md e do AI_LOG.md já commitados no GitHub.

#### 3. Avaliação da Resposta Gerada

**O que a IA sugeriu de útil:**
* Schema com 4 tabelas (`usuarios`, `produtos`, `lotes`, `movimentacoes`), justificando a inclusão de `usuarios` além do exemplo-base do exercício (produtos/lotes/movimentacoes) porque o MVP já tem login e log de auditoria no escopo.
* Índice `(produto_id, status, data_fabricacao)` em `lotes`, pensado especificamente para a query que resolve a regra FIFO ("qual o lote mais antigo disponível?").
* Posição do lote (`posicao`) como coluna simples em `lotes`, em vez de tabela própria — coerente com a decisão já tomada no README de não modelar o layout físico do piso.
* Script `/mock/simulator.js` em Node puro (sem dependências), cobrindo os 4 cenários de anomalia: lote fora de ordem, lote vencido, saldo insuficiente e lote não encontrado, além de eventos de entrada (reposição) para sustentar grandes volumes sem esgotar o estoque simulado.
* Geração de `dataset.json` (consumo rápido no frontend) e `seed.sql` (para popular o MySQL real) a partir da mesma base de dados em memória.

**O que a equipe descartou por ser complexo demais para 42 horas:** `[CONFIRMAR / ajustar com a equipe]`
* Inserção direta no MySQL via `mysql2` a partir do script (ficou só gerando `.sql` para rodar manualmente).
* Persistir o mock em SQLite paralelo ao MySQL definitivo.
* Modelar fisicamente a fileira/bloco do piso como entidade própria (mantido como decisão já tomada na Semana 02).

**Falhas, alucinações ou pontos de atenção:**
* Na primeira versão do script, o gerador "perdia" eventos silenciosamente quando o estoque de um produto esgotava antes de atingir a quantidade pedida — rodar `--count=2000` gerava só 348 registros, sem avisar. Foi necessário revisar a lógica e adicionar eventos de `entrada` (reposição) para o gerador sustentar grandes volumes.
* Na mesma versão inicial, o cenário mais importante do negócio — **consumo fora de ordem (FIFO quebrado)** — quase não ocorria (8 em 5.000 eventos), porque o estoque raramente tinha dois lotes do mesmo produto disponíveis ao mesmo tempo. Foi necessário ajustar a regra de reposição para manter lote antigo e lote novo coexistindo com mais frequência, o que elevou a ocorrência desse cenário para um nível representativo (139 em 5.000). Esse foi o erro mais relevante encontrado: um mock "sem anomalia" teria passado despercebido se os números não tivessem sido checados.
* O caso "lote vencido" dependia só de sorteio aleatório (~18% por lote) e, em alguns testes, não aparecia nenhuma vez no dataset. Foi adicionada uma garantia explícita no script para sempre existir pelo menos um lote vencido, independentemente do sorteio.
* O DDL e os `INSERT`s gerados foram validados com um parser de sintaxe MySQL antes da entrega (não havia servidor MySQL disponível no ambiente de teste da IA para uma validação end-to-end real).

#### 4. Intervenção Humana e Refatoração

**Decisão final tomada pelos integrantes:** `[CONFIRMAR / ajustar]`
* Adotar o schema de 4 tabelas (`usuarios`, `produtos`, `lotes`, `movimentacoes`) em `/database/schema.sql`.
* Adotar o gerador `/mock/simulator.js`, rodado com um volume de ~3.000 movimentações para a entrega da Aula 03.
* Manter `motivo_bloqueio` como `VARCHAR` livre (não `ENUM` travado no banco), para não exigir migração de schema a cada novo tipo de anomalia identificado futuramente.
* Versionar `/database/schema.sql`, `/mock/simulator.js` e `/mock/README.md`; deixar `/mock/output/*` fora do Git (dados gerados, não código-fonte).

---

## 3. Síntese Crítica de Encerramento (Preenchida na Semana 13)

* **Onde a IA mais acelerou a entrega:** (Tarefas onde o ganho de tempo foi evidente).
* **Onde a IA mais atrapalhou ou gerou retrabalho:** (Problemas de contexto, bugs difíceis de achar, código redundante).
* **Lições aprendidas de engenharia de software:** (Como a abordagem técnica da equipe mudou ao longo das 42 horas).

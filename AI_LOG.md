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
* Gravação direta em MySQL como padrão do mock: optou-se por arquivo (JSON/NDJSON) como saída principal, deixando o MySQL como flag opcional, para não depender de um banco já rodando durante a demonstração.

**Falhas, alucinações ou pontos de atenção:**
* A IA alertou que os `CHECK` de quantidade só são de fato aplicados a partir do MySQL 8.0.16; em versões anteriores a constraint é aceita na sintaxe mas ignorada silenciosamente. **Precisa ser validado contra a versão do MySQL do ambiente de entrega.** `[CONFIRMAR]`
* No script de mock, um caso de borda (lote com saldo muito baixo tentando gerar uma retirada "normal") foi tratado com um valor mínimo de segurança; a equipe deve rodar o script e observar os logs para confirmar que os números gerados fazem sentido antes da apresentação. `[CONFIRMAR]`

#### 4. Intervenção Humana e Refatoração

**Decisão final tomada pelos integrantes:** `[CONFIRMAR / ajustar com a equipe]`
* Adotar o modelo enxuto de 3 tabelas (`produtos`, `lotes`, `movimentacoes`) como schema oficial da entrega da Aula 03, versionado em `database/schema_mvp.sql`.
* Manter o modelo de 8 tabelas apenas como documentação de arquitetura estendida no README, sem implementá-lo agora.
* Rodar `mock/simulator.js` no modo histórico antes da apresentação para validar visualmente as três anomalias geradas.

---

## 3. Síntese Crítica de Encerramento (Preenchida na Semana 13)

* **Onde a IA mais acelerou a entrega:** (Tarefas onde o ganho de tempo foi evidente).
* **Onde a IA mais atrapalhou ou gerou retrabalho:** (Problemas de contexto, bugs difíceis de achar, código redundante).
* **Lições aprendidas de engenharia de software:** (Como a abordagem técnica da equipe mudou ao longo das 42 horas).

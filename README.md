# Cristal Master: Controle de Estoque do Almoxarifado

Sistema de controle de estoque FIFO para o almoxarifado da Cristal Master, indústria que trabalha com resinas e aditivos. A visão final é um **PWA mobile**: o operador abre o app direto no celular, sem instalar nada de loja, e usa a câmera para ler os QR Codes dos lotes.

> **Situação atual:** backend (API REST em Spring Boot + MySQL) com cadastro de lotes, **saída de material validada pelo FIFO** (com bloqueio e registro de tentativas) e validação de payload com códigos HTTP corretos. O PWA e a leitura de QR Code pela câmera ainda serão desenvolvidos. Veja [O que o programa faz hoje](#o-que-o-programa-faz-hoje) e [Limitações conhecidas](#limitações-conhecidas).

## Problema do almoxarifado

1. **FIFO quebrado.** Pallets de resina (~1.000 kg) ficam em fileiras profundas no chão. Com pressa, o operador da empilhadeira pega o pallet mais fácil (o da frente, mais novo) e os antigos ficam no fundo até vencerem.
2. **Saldo do sistema diferente do real.** As movimentações são anotadas em fichas de papel e digitadas no ERP só no fim do turno, gerando os "furos de estoque".

## Solução proposta (visão final)

- O app indica **qual lote e qual posição do piso devem sair primeiro**, antes de o operador pegar o material.
- O operador lê o **QR Code do lote**. Se for o lote errado (fora de ordem, vencido ou com quantidade acima do saldo), o sistema **bloqueia e registra a tentativa**.
- Toda movimentação é **gravada na hora**, sem ficha de papel e sem digitação em lote.
- Cada fileira do piso recebe um código (ex.: `F01`) e **um único lote por vez**, sinalizado com fita ou tinta no chão, sem gasto com estrutura física (porta-pallets).

## O que o programa faz hoje

Resumo direto do que existe e funciona neste momento:

| Parte | O que faz | Problema que ataca |
|-------|-----------|--------------------|
| **Saída com FIFO pela API** (`POST /api/saidas`) | Recebe o QR do lote e a quantidade, calcula qual lote deveria sair (o mais antigo do mesmo produto, com saldo e dentro da validade) e **aprova ou bloqueia**. | **Saída fora de ordem** (problema 1). |
| **Bloqueio com registro** | Lote fora de ordem, vencido ou com quantidade acima do saldo gera erro 400 e grava uma `TENTATIVA_BLOQUEADA` com o motivo. | Rastrear tentativas erradas. |
| **Movimentação na hora** | A saída aprovada baixa o saldo e grava a movimentação no ato. | **Saldo diferente do real** (problema 2). |
| **Validação do payload** | Dados fora do esquema (campo vazio, negativo, texto no lugar de número, JSON quebrado) são barrados com **422** antes de chegar à regra de negócio. | API robusta contra dado malformado. |
| **Cadastro e consulta de lotes** (`/api/lotes`) | Cadastra lotes (código QR, produto, fileira, quantidade, entrada, validade) e lista em ordem FIFO. | Base de dados do estoque. |
| **Cadastro de produtos** (`/produtos`) | Grava e lista produtos no MySQL. | Base de dados. |
| **Demonstração em terminal** (`ControleDemo`, `FifoTeste`) | Executam a regra de comparação FIFO sem API e sem banco. | Mostrar a regra de forma simples. |

Ainda **não** existem: leitura de QR Code pela câmera (PWA) e usuários/perfis em uso.

## Como funciona

### Arquitetura em camadas

```
 Cliente (navegador / Postman / futuro PWA)
          │  HTTP + JSON
          ▼
 controllers/   recebem as requisições (rotas)         ← ProdutoController, HealthController, ExemploController
          │
          ▼
 repositories/  conversam com o banco (sem escrever SQL) ← ProdutoRepository (Spring Data JPA)
          │
          ▼
 models/        entidades = tabelas do MySQL             ← Produto, Lote, Movimentacao, Perfil

 services/      regras de negócio                        ← FifoService (ainda não chamado pelos controllers)
```

### Fluxo de uma requisição (exemplo: cadastrar um produto)

1. O cliente envia `POST /produtos` com um JSON, por exemplo `{"sku":"RES-01","nome":"Resina Cristal"}`.
2. O `ProdutoController` converte o JSON em um objeto `Produto`.
3. Ele chama `repository.save(produto)`, e o Spring Data/Hibernate executa o `INSERT` na tabela `produtos`.
4. O produto salvo (agora com `id`) volta como JSON na resposta.

`GET /produtos` segue o mesmo caminho com um `SELECT` e devolve a lista.

### Como a regra FIFO decide

`FifoService.validarSaida(loteEsperado, loteSelecionado)`:

| Entrada (esperado → selecionado) | Resultado |
|----------------------------------|-----------|
| `LOT001` → `LOT001` | `FIFO OK` |
| `LOT001` → `LOT005` | `FIFO VIOLADO` |
| `null` → `LOT001` | `Erro: lote inválido` |
| *(vazio)* → `LOT001` | `Erro: lote inválido` |

Para provocar o caso de erro no `ControleDemo`, basta apertar **Enter sem digitar nada** em um dos dois códigos (código vazio ou só com espaços também é tratado como inválido).

Na API, o `EstoqueService` calcula o "lote esperado" (o mais antigo do produto, com saldo e dentro da validade) e usa o `FifoService` para compará-lo com o lote selecionado, que virá do QR Code lido pelo operador.

## Rotas da API

| Método | Rota | Descrição | Respostas |
|--------|------|-----------|-----------|
| GET | `/health` | Responde `Sistema OK` (texto fixo, não testa o banco) | 200 |
| GET | `/api/exemplo` | Responde `API CristalMaster funcionando!` | 200 |
| GET | `/produtos` | Lista os produtos | 200 |
| POST | `/produtos` | Cadastra um produto | 200 |
| GET | `/api/lotes` | Lista os lotes em ordem FIFO | 200 |
| GET | `/api/lotes/{codigoQr}` | Consulta um lote | 200, 404 |
| POST | `/api/lotes` | Cadastra um lote | 201, 400, 422 |
| POST | `/api/saidas` | Registra a saída de material validando o FIFO | 200, 400, 404, 422 |

### Códigos HTTP usados

| Código | Quando |
|--------|--------|
| 200 | Consulta ou saída aprovada |
| 201 | Lote cadastrado |
| 400 | Regra de negócio violada (FIFO, validade, saldo, fileira ocupada, código repetido) |
| 404 | Lote não encontrado |
| 422 | Payload fora do esquema (campo ausente/vazio/negativo, tipo ou data errados, JSON quebrado) |

### Exemplo de payload

`POST /api/saidas`: `{"codigoQr":"LOT101","quantidade":200}`

A validação é feita por esquema (Bean Validation) nos DTOs `LoteRequest` e `SaidaRequest`. Roteiro completo de testes em [`docs/TESTES_API.md`](docs/TESTES_API.md).

## Banco de dados

O banco `cristalmaster` (MySQL) é **criado automaticamente** na primeira execução (parâmetro `createDatabaseIfNotExist=true` na URL de conexão), e as **tabelas** são criadas/ajustadas pelo Hibernate (`ddl-auto=update`). Não é preciso rodar `CREATE DATABASE` nem usar o MySQL Workbench; só é necessário que o servidor MySQL esteja ligado e que o usuário tenha permissão para criar bancos.

| Tabela | Entidade | Campos |
|--------|----------|--------|
| `produtos` | `Produto` | id, sku, nome |
| `lotes` | `Lote` | id, codigoQr, fileira, qtdInicial, qtdAtual, produto, dataEntrada, validade |
| `movimentacoes` | `Movimentacao` | id, tipo (`SAIDA` ou `TENTATIVA_BLOQUEADA`), quantidade, dataHora, codigoQr, motivo |
| `perfis` | `Perfil` | id, nome |

As tabelas ainda **não têm chaves estrangeiras** entre si (o lote guarda o produto como texto e a movimentação guarda o código do QR).

## Estrutura do projeto

```
cristal-master-main/
├── pom.xml, mvnw, mvnw.cmd          # Maven e wrapper
├── docs/AI_LOG.md                   # registro do uso de IA
├── docs/TESTES_API.md               # roteiro de testes de validação e códigos HTTP
├── mock/dados-mock.json             # dados simulados (7 lotes: normais, FIFO violado, vencido)
├── src/
│   ├── main/java/br/com/cristalmaster/
│   │   ├── CristalmasterApplication.java   # ponto de entrada (sobe a API)
│   │   ├── ControleDemo.java               # menu de demonstração no terminal
│   │   ├── controllers/                    # rotas REST
│   │   ├── dtos/                           # payloads (esquemas de validação)
│   │   ├── exceptions/                     # erros -> códigos HTTP (400, 404, 422)
│   │   ├── models/                         # entidades JPA (tabelas)
│   │   ├── repositories/                   # acesso ao banco
│   │   └── services/                       # FifoService, EstoqueService e teste manual
│   ├── main/resources/application.properties   # conexão com o MySQL
│   └── test/java/.../CristalmasterApplicationTests.java
└── backend/                         # resquício de um projeto Node.js (não faz parte da API Spring Boot)
```

## Como executar

**Pré-requisitos:** JDK 21 e um servidor MySQL em execução na porta 3306. Com o **XAMPP**, abra o painel de controle e clique em **Start** no módulo **MySQL** (o Apache não é necessário).

1. Inicie o MySQL (no XAMPP: botão **Start** do módulo MySQL). O banco `cristalmaster` será criado sozinho na primeira execução.
2. Confira usuário e senha em `src/main/resources/application.properties`. O arquivo está configurado para o banco da apresentação (usuário `root` com senha). O MySQL do XAMPP vem com o `root` **sem senha**; para testar nele, deixe `spring.datasource.password=` vazio.
3. Suba a API:
   - Windows: `mvnw.cmd spring-boot:run`
   - Linux/macOS: `./mvnw spring-boot:run`
4. Teste: abra `http://localhost:8080/health` no navegador.
5. Cadastre e liste produtos (Postman ou `curl`):
   ```
   curl -X POST http://localhost:8080/produtos -H "Content-Type: application/json" -d "{\"sku\":\"RES-01\",\"nome\":\"Resina Cristal\"}"
   curl http://localhost:8080/produtos
   ```

**Demonstração da regra FIFO (sem banco e sem API):**

- Menu interativo: execute a classe `ControleDemo` pela IDE (botão Run) ou, após `mvnw.cmd compile`, `java -cp target/classes br.com.cristalmaster.ControleDemo`.
- Três cenários automáticos: `java -cp target/classes br.com.cristalmaster.services.FifoTeste`.

O teste `CristalmasterApplicationTests` sobe o contexto completo e, por isso, exige o MySQL ligado.

Se a porta 8080 estiver ocupada (`8080 already in use`), há outra instância rodando: encerre-a antes de subir novamente.

## Status do projeto

**Sprint 1: Fundação técnica** ✅
- Ambiente Spring Boot, integração com MySQL, entidades e criação automática das tabelas
- Endpoints de health check e de exemplo; mock industrial

**Sprint 2: Regra de negócio** ✅
- Primeira versão da regra FIFO (`FifoService`) e demonstração em terminal

**Sprint 3: Validação e códigos HTTP** ✅
- Validação de payload por esquema (Bean Validation) com resposta 422
- Cadastro de lotes (201) e consulta (200/404)
- Saída de material com FIFO, validade e saldo, bloqueio 400 e registro da tentativa

## Limitações conhecidas

- O `/health` e o `/api/exemplo` devolvem texto fixo; o `/health` **não testa** a conexão com o banco.
- O `dados-mock.json` não é lido pela aplicação e está no formato antigo (campos `produto` e `situacao`, fileiras repetidas). Os lotes são cadastrados via `POST /api/lotes`.
- Produto e movimentação ainda não têm chaves estrangeiras; `Perfil` não é usado; não há registro do operador.
- Só há entrada de lote por cadastro; ainda não existe rota de entrada de saldo em lote existente nem de ajuste.
- O `ControleDemo` falha se for digitado texto no lugar de um número no menu.
- Não há autenticação.

## Próximos passos

1. Fazer o `/health` testar a conexão com o banco.
2. Ler o mock industrial pela aplicação (ajustando-o ao novo formato de lote).
3. Relacionar as entidades (lote → produto, movimentação → lote) e registrar o operador.
4. Endpoint que informe **qual lote e fileira devem sair primeiro** antes da saída.
5. Desenvolver a interface PWA.
6. Implementar a leitura de QR Code pela câmera.

## Registro de uso de IA

Os prompts enviados à IA durante o desenvolvimento ficam registrados em [`docs/AI_LOG.md`](docs/AI_LOG.md).

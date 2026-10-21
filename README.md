# Cristal Master: Controle de Estoque do Almoxarifado

Sistema de controle de estoque FIFO para o almoxarifado da Cristal Master, indústria que trabalha com resinas e aditivos. A visão final é um **PWA mobile** (Progressive Web App): o operador abre o app direto no celular, sem instalar nada de loja, e usa a câmera para ler os QR Codes dos lotes.

> **Situação atual:** backend (API REST em Spring Boot + MySQL) com a base de dados modelada e uma **primeira versão da regra FIFO**. O PWA, a leitura de QR Code e a integração da regra FIFO com a API/banco ainda serão desenvolvidos. Veja [O que o programa faz hoje](#o-que-o-programa-faz-hoje) e [Limitações conhecidas](#limitações-conhecidas).

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
| **Regra FIFO** (`FifoService`) | Compara o lote que o sistema esperava com o lote que o operador selecionou e responde `FIFO OK`, `FIFO VIOLADO` ou `Erro: lote inválido`. | **Detectar a saída fora de ordem**, que é o coração do problema 1 (FIFO quebrado). |
| **Cadastro de produtos** (`/produtos`) | Grava e lista produtos (resinas e aditivos) no MySQL. | Base de dados para o controle de estoque. |
| **Modelo de dados** (4 entidades) | O Hibernate cria no MySQL as tabelas `produtos`, `lotes`, `movimentacoes` e `perfis`. | Estrutura para gravar lotes e movimentações na hora (problema 2). |
| **Demonstração em terminal** (`ControleDemo`, `FifoTeste`) | Executam a regra FIFO sem precisar de API nem banco. | Mostrar e validar a regra de forma simples. |
| **Rotas de apoio** (`/health`, `/api/exemplo`) | Confirmam que o servidor está no ar. | Verificação rápida da aplicação. |

Ou seja: **hoje o sistema já consegue dizer se um lote escolhido respeita a ordem FIFO**, mas essa verificação ainda é manual (os dois códigos são informados à mão) e **não está ligada à API nem ao banco**. As demais partes da solução (sugerir o lote correto, QR Code, bloqueio com registro, movimentações em tempo real) estão nos próximos passos.

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

Na versão final, o "lote esperado" será calculado pelo sistema (o mais antigo com saldo e dentro da validade) e o "selecionado" virá do QR Code lido pelo operador.

## Rotas da API

| Método | Rota | Descrição | Acessa o banco? |
|--------|------|-----------|-----------------|
| GET | `/health` | Responde `Sistema OK` se o servidor estiver no ar | Não (texto fixo) |
| GET | `/api/exemplo` | Responde `API CristalMaster funcionando!` | Não (texto fixo) |
| GET | `/produtos` | Lista os produtos cadastrados | Sim |
| POST | `/produtos` | Cadastra um produto a partir de JSON | Sim |

## Banco de dados

O banco `cristalmaster` (MySQL) é **criado automaticamente** na primeira execução (parâmetro `createDatabaseIfNotExist=true` na URL de conexão), e as **tabelas** são criadas pelo Hibernate (`ddl-auto=update`). Não é preciso rodar `CREATE DATABASE` nem usar o MySQL Workbench; só é necessário que o servidor MySQL esteja ligado e que o usuário tenha permissão para criar bancos.

| Tabela | Entidade | Campos |
|--------|----------|--------|
| `produtos` | `Produto` | id, sku, nome |
| `lotes` | `Lote` | id, codigoQr, fileira, qtdInicial, qtdAtual |
| `movimentacoes` | `Movimentacao` | id, tipo, quantidade, dataHora |
| `perfis` | `Perfil` | id, nome |

As tabelas ainda **não têm relacionamentos** entre si (por exemplo, o lote não aponta para o produto).

## Estrutura do projeto

```
cristal-master-main/
├── pom.xml, mvnw, mvnw.cmd          # Maven e wrapper
├── docs/AI_LOG.md                   # registro do uso de IA
├── mock/dados-mock.json             # dados simulados (7 lotes: normais, FIFO violado, vencido)
├── src/
│   ├── main/java/br/com/cristalmaster/
│   │   ├── CristalmasterApplication.java   # ponto de entrada (sobe a API)
│   │   ├── ControleDemo.java               # menu de demonstração no terminal
│   │   ├── controllers/                    # rotas REST
│   │   ├── models/                         # entidades JPA (tabelas)
│   │   ├── repositories/                   # acesso ao banco
│   │   └── services/                       # regra FIFO e teste manual
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
- Ambiente Spring Boot e integração com MySQL
- Estrutura de pastas organizada
- Entidades do sistema e criação automática das tabelas
- Endpoints de health check e de exemplo
- Mock industrial para simulação de dados

**Sprint 2: Regra de negócio** ✅
- Primeira versão da regra FIFO (`FifoService`) com cenários normal, anomalia e erro
- Demonstração em terminal (`ControleDemo`, `FifoTeste`)

## Limitações conhecidas

- O `/health` e o `/api/exemplo` devolvem texto fixo; o `/health` **não testa** a conexão com o banco.
- A regra FIFO só compara dois códigos informados; não calcula o lote esperado, não verifica validade nem saldo e não registra tentativas bloqueadas. Também não está ligada a nenhuma rota.
- O `Lote` não tem produto, data de entrada nem validade, dados necessários para o FIFO real e para o bloqueio de lote vencido.
- O `dados-mock.json` não é lido pela aplicação e traz campos (`produto`, `situacao`) que a entidade `Lote` não possui. Além disso, algumas fileiras têm mais de um lote (F01 e F03), contrariando a regra de um lote por fileira.
- Só existe repository de `Produto`; `Lote`, `Movimentacao` e `Perfil` ainda não têm.
- O `ControleDemo` falha se for digitado texto no lugar de um número no menu.

## Próximos passos

1. Criar os repositories de `Lote`, `Movimentacao` e `Perfil`.
2. Relacionar as entidades (lote → produto, movimentação → lote) e acrescentar data de entrada e validade ao `Lote`.
3. Integrar a regra FIFO aos endpoints da API, calculando o lote esperado.
4. Ler o mock industrial diretamente pela aplicação.
5. Fazer o `/health` testar a conexão com o banco.
6. Desenvolver a interface PWA.
7. Implementar a leitura de QR Code pela câmera.

## Registro de uso de IA

Os prompts enviados à IA durante o desenvolvimento ficam registrados em [`docs/AI_LOG.md`](docs/AI_LOG.md).

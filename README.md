# Cristal Master: Controle de Estoque do Almoxarifado

Sistema de controle de estoque FIFO para o almoxarifado da Cristal Master, indústria que trabalha com resinas e aditivos. A visão final é um **PWA mobile**: o operador abre o app direto no celular, sem instalar nada de loja, e usa a câmera para ler os QR Codes dos lotes.

> **Situação atual:** backend (API REST em Spring Boot + MySQL) com cadastro de lotes, **saída de material validada pelo FIFO** (com bloqueio e registro de tentativas) e validação de payload com códigos HTTP corretos. A **tela operacional** (PWA em HTML/CSS/JS) consome a API e **se atualiza sozinha a cada 3 s**, com aviso de carregamento e de falha de comunicação; um **simulador** (`mock/simulador.ps1`) gera entradas, saídas e tentativas bloqueadas pela API real e a tela reage ao vivo (Aula 08). A leitura de QR pela câmera está implementada, mas ainda precisa ser testada em um celular real. Veja [O que o programa faz hoje](#o-que-o-programa-faz-hoje) e [Limitações conhecidas](#limitações-conhecidas).

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
| **Tela operacional (PWA)** (`/`) | Tela de celular: o operador informa o lote e a quantidade; cartão **verde** (baixa autorizada), **vermelho** (violação de FIFO ou lote vencido) ou **amarelo** (atenção). Mostra o próximo lote a sair de cada produto. | Indicar o lote certo antes da retirada e bloquear o errado. |
| **Movimentações ao vivo** (`GET /api/movimentacoes`) | A tela mostra as últimas saídas (verde) e tentativas bloqueadas (vermelho) com o motivo, e avisa quando chega lote novo ou bloqueio. | Rastrear tentativas erradas na hora. |
| **Simulador** (`mock/simulador.ps1`) | Faz o papel do operador pela API real: cadastra lotes, faz saídas certas e tenta saídas fora do FIFO, vencidas e acima do saldo. | Testar o fluxo completo sem equipamento. |
| **Health check real** (`GET /health`) | Testa a conexão com o MySQL: 200 se o banco responde, 503 com o motivo se não. | Saber se o problema é a API ou o banco. |
| **Demonstração em terminal** (`ControleDemo`, `FifoTeste`) | Executam a regra de comparação FIFO sem API e sem banco. | Mostrar a regra de forma simples. |

Ainda **não** existem: usuários/perfis em uso e autenticação.

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
| GET | `/` | Tela operacional do almoxarifado (arquivos estáticos) | 200 |
| GET | `/health` | Testa a conexão com o banco: `Sistema OK - banco de dados conectado` ou o motivo da falha | 200, 503 |
| GET | `/api/exemplo` | Responde `API CristalMaster funcionando!` | 200 |
| GET | `/produtos` | Lista os produtos | 200 |
| POST | `/produtos` | Cadastra um produto | 200 |
| GET | `/api/lotes` | Lista os lotes em ordem FIFO | 200 |
| GET | `/api/lotes/{codigoQr}` | Consulta um lote | 200, 404 |
| POST | `/api/lotes` | Cadastra um lote | 201, 400, 422 |
| GET | `/api/fifo/proximos` | Lote que deve sair primeiro de cada produto (mais antigo, com saldo e válido) | 200 |
| POST | `/api/saidas` | Registra a saída de material validando o FIFO | 200, 400, 404, 422 |
| GET | `/api/movimentacoes?limite=15` | Últimas movimentações (saídas e tentativas bloqueadas), mais recente primeiro | 200 |

### Códigos HTTP usados

| Código | Quando |
|--------|--------|
| 200 | Consulta ou saída aprovada |
| 201 | Lote cadastrado |
| 400 | Regra de negócio violada (FIFO, validade, saldo, fileira ocupada, código repetido) |
| 404 | Lote não encontrado |
| 422 | Payload fora do esquema (campo ausente/vazio/negativo, tipo ou data errados, JSON quebrado) |
| 503 | `/health`: a API está no ar, mas o banco de dados não responde |

### Exemplo de payload

`POST /api/saidas`: `{"codigoQr":"LOT101","quantidade":200}`

A validação é feita por esquema (Bean Validation) nos DTOs `LoteRequest` e `SaidaRequest`. Roteiro completo de testes em [`docs/TESTES_API.md`](docs/TESTES_API.md).

## Interface do operador (Aula 07)

Tela única, pensada para o operador no celular e para leitura a 2 metros: fonte grande, alto contraste e cartões de estado. Foi feita em **HTML + CSS + JavaScript puros**, sem bibliotecas (abordagem mais rápida e que funciona sem internet), e é servida pelo próprio Spring Boot.

**Como abrir:** com a API no ar, acesse `http://localhost:8080/`. Para ter lotes na tela, rode `docs/carregar-demo.ps1` (banco limpo).

**Como usar:** digite ou leia o código do lote, informe a quantidade e toque em **Confirmar saída**. Tocar em um lote da lista preenche o código.

| Cor | Significado |
|-----|-------------|
| Verde | Lote correto, baixa autorizada |
| Vermelho (pulsando) | Bloqueio: violação de FIFO (mostra o lote esperado e a fileira) ou lote vencido |
| Amarelo | Atenção: quantidade acima do saldo, lote não encontrado ou dados inválidos |

Em baixo da faixa de resultado, a tela lista o **próximo lote a sair de cada produto** (`GET /api/fifo/proximos`) e todo o estoque em ordem FIFO (`GET /api/lotes`), com a fileira desenhada como a fita amarela do piso. A decisão de aprovar ou bloquear é sempre da API.

**No celular:** com o celular na mesma rede Wi-Fi, abra `http://IP-DO-COMPUTADOR:8080/` (libere a porta 8080 no firewall). A **câmera e a instalação como app só funcionam em HTTPS ou em `localhost`**; pelo IP simples, digite o código. Com o celular Android conectado por USB e a depuração ativada, `adb reverse tcp:8080 tcp:8080` faz o `http://localhost:8080` do celular chegar ao computador e libera a câmera. A leitura do QR usa o `BarcodeDetector` (Chrome no Android).

## Integração ponta a ponta (Aula 08)

```
 mock/simulador.ps1 ──POST /api/lotes, /api/saidas──▶  API Spring Boot (8080)  ──▶ MySQL
                                                              ▲
 Tela (index.html + app.js) ──GET a cada 3 s─────────────────┘
   /api/fifo/proximos · /api/lotes · /api/movimentacoes
```

- **Consumo da API:** a tela não tem dados fixos; consulta a API a cada 3 s (pausa com a aba escondida) e após cada saída.
- **CORS:** `config/CorsConfig.java` libera `http://localhost:*` e `http://127.0.0.1:*`. Aberta em `http://localhost:8080/` a tela está na mesma origem; aberta pelo Live Server (5500), Vite (5173) ou React (3000), o `app.js` aponta sozinho para `http://localhost:8080`.
- **Carregando e erro:** "Carregando..." na primeira consulta e "Atualizando..." no rodapé; se a API não responde, faixa **vermelha** fixa no topo, "Servidor offline" e os dados antigos esmaecidos (não somem). Erro 500 avisa que o provável problema é o banco. Se o próprio `app.js` não carregar, o `index.html` mostra o motivo em vermelho.
- **Reação ao simulador:** lote novo e movimentação nova piscam em amarelo e geram um aviso rápido (azul = lote novo, verde = saída, vermelho = bloqueio).

Roteiro completo da demonstração em [`docs/AULA08_INTEGRACAO.md`](docs/AULA08_INTEGRACAO.md).

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
├── iniciar.bat, iniciar.ps1         # inicia a API em HTTPS para uso no celular (câmera/QR)
├── .env.example                     # modelo das variáveis locais (DB_USUARIO, DB_SENHA)
├── docs/carregar-demo.ps1           # carrega 5 lotes de demonstração
├── docs/AI_LOG.md                   # registro do uso de IA
├── docs/TESTES_API.md               # roteiro de testes de validação e códigos HTTP
├── docs/AULA08_INTEGRACAO.md         # roteiro da integração ponta a ponta (Aula 08)
├── mock/dados-mock.json             # dados simulados antigos (Sprint 1; não lidos pela aplicação)
├── mock/simulador.ps1               # simulador do almoxarifado: usa a API real em segundo plano (Aula 08)
├── src/
│   ├── main/java/br/com/cristalmaster/
│   │   ├── CristalmasterApplication.java   # ponto de entrada (sobe a API)
│   │   ├── ControleDemo.java               # menu de demonstração no terminal
│   │   ├── config/                         # CorsConfig (libera a tela em outra origem)
│   │   ├── controllers/                    # rotas REST
│   │   ├── dtos/                           # payloads (esquemas de validação)
│   │   ├── exceptions/                     # erros -> códigos HTTP (400, 404, 422)
│   │   ├── models/                         # entidades JPA (tabelas)
│   │   ├── repositories/                   # acesso ao banco
│   │   └── services/                       # FifoService, EstoqueService e teste manual
│   ├── main/resources/application.properties   # conexão com o MySQL (senha vem de DB_SENHA / .env)
│   ├── main/resources/application-xampp.properties   # perfil "xampp": root sem senha
│   ├── main/resources/static/                   # tela operacional (PWA): index.html, css/, js/, sw.js, manifest, icons/
│   └── test/java/.../CristalmasterApplicationTests.java
```

## Como executar

> Guia testado no Windows com PowerShell. No Linux/macOS troque `.\mvnw.cmd` por `./mvnw`.

### O que precisa estar instalado

- **JDK 21 ou mais novo.** Não é preciso instalar o Maven (o projeto traz o `mvnw.cmd`).
- **MySQL ligado na porta 3306.** No XAMPP, abra o painel e clique em **Start** no módulo **MySQL** (o Apache não é necessário).
- Não é preciso criar o banco nem rodar SQL: o banco e as tabelas são criados sozinhos (veja "Entendendo dois termos").

### Passo a passo

1. **Abra o PowerShell na pasta do projeto**, a que contém `pom.xml` e `mvnw.cmd` (no Explorer, clique na barra de endereço, digite `powershell` e Enter).
2. **Confira o Java que o Maven vai usar:**
   ```powershell
   .\mvnw.cmd -v
   ```
   A linha `Java version` precisa mostrar **21 ou mais**. Se mostrar menos, ou se o build parar com `release version 21 not supported`, o `JAVA_HOME` aponta para um Java antigo (comum nos computadores da faculdade), mesmo que `java -version` mostre outro. Corrija só nesta janela e confira de novo:
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-21"   # ajuste para a pasta do seu JDK
   .\mvnw.cmd -v
   ```
3. **Informe a senha do MySQL.** Ela não fica escrita em arquivo do projeto. Escolha uma opção:
   - **XAMPP com `root` sem senha:** não precisa fazer nada.
   - **Variável de ambiente** (vale só nesta janela): `$env:DB_SENHA = "sua_senha"`
   - **Arquivo `.env`** (fica na sua máquina, não vai para o Git): `Copy-Item .env.example .env` e preencha `DB_SENHA`.
   - O Spring Boot também aceita `$env:SPRING_DATASOURCE_PASSWORD = "sua_senha"`.
4. **Suba a API:**
   ```powershell
   .\mvnw.cmd spring-boot:run
   ```
   (No PowerShell o `.\` na frente é obrigatório.) Espere a linha `Started CristalmasterApplication` e **não feche a janela**: Ctrl + C desliga a API. Na primeira vez o Maven baixa dependências e pode levar alguns minutos.
5. **Confira no navegador:**
   - `http://localhost:8080/health` deve mostrar `Sistema OK - banco de dados conectado`.
   - `http://localhost:8080/` abre a tela do operador (vazia no início).
6. **Carregue dados de demonstração.** Em **outra** janela do PowerShell, na mesma pasta, use uma das opções:
   - Simulador (a tela reage ao vivo, com saídas e bloqueios FIFO): `powershell -ExecutionPolicy Bypass -File mock\simulador.ps1`
   - Só 5 lotes iniciais (banco limpo): `powershell -ExecutionPolicy Bypass -File docs\carregar-demo.ps1`
7. (Opcional) Cadastre e liste produtos com `curl`:
   ```
   curl -X POST http://localhost:8080/produtos -H "Content-Type: application/json" -d "{\"sku\":\"RES-01\",\"nome\":\"Resina Cristal\"}"
   curl http://localhost:8080/produtos
   ```

### Entendendo dois termos

- **"O banco será criado sozinho":** a URL de conexão tem `createDatabaseIfNotExist=true`, então o driver cria o banco `cristalmaster` na primeira conexão e o Hibernate cria as tabelas (`ddl-auto=update`).
- **Perfil:** é um arquivo `application-<nome>.properties` ativado com `-Dspring-boot.run.profiles=<nome>`. O perfil `xampp` só força a senha vazia. Exemplo: `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=xampp"`. Com a senha já tratada no passo 3, ele raramente é necessário.

### Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `release version 21 not supported` | `JAVA_HOME` com Java antigo | Passo 2 |
| `Unable to determine Dialect without JDBC metadata` | A API não conectou no MySQL (a causa real está mais acima no log, na linha do `HikariPool`) | Confirme que o MySQL está ligado e refaça o passo 3 |
| `Access denied for user 'root'` | Senha errada | Refaça o passo 3 |
| `8080 already in use` | Outra instância da API rodando | Encerre-a (Ctrl + C na outra janela) |
| Tela vazia | Banco sem dados | Passo 6 |
| `mvnw.cmd não é reconhecido` | Terminal fora da pasta do projeto ou sem `.\` | Passos 1 e 4 |

### Uso no celular, com leitura de QR Code (executável)

A câmera do celular só lê QR Code em **HTTPS** (ou em `localhost`). Por isso existe o perfil `https` e um iniciador que faz tudo sozinho:

1. Com o MySQL ligado, dê **duplo clique em `iniciar.bat`** (ou rode `powershell -ExecutionPolicy Bypass -File iniciar.ps1`). Na primeira vez ele confere o Java 21+, gera um certificado local em `certs\` (fora do Git), compila o programa (`target\cristalmaster-0.0.1-SNAPSHOT.jar`) e sobe a API em HTTPS.
2. O terminal mostra o endereço para o celular, no formato `https://IP-DO-COMPUTADOR:8443/`. O celular precisa estar **na mesma rede Wi-Fi**. Se não abrir, libere a porta 8443 no firewall (o comando aparece no terminal; rode-o como Administrador).
3. No celular, o navegador avisa que o certificado não é confiável (é autoassinado): toque em **Avançado** e continue. Depois permita o uso da câmera ao tocar em **Ler QR**.
4. Para instalar como app: menu do navegador > **Adicionar à tela inicial**.

Observações:

- **Chrome no Android** lê o QR sem nada extra (`BarcodeDetector`). **iPhone/Safari e Firefox** não têm esse recurso: baixe a biblioteca [jsQR](https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js) e salve-a como `src/main/resources/static/js/jsQR.js` (não vem no projeto porque o simulador/ambiente de entrega pode estar sem internet). Se o arquivo existir, o botão **Ler QR** aparece automaticamente; se não, o operador digita o código do lote.
- Se o IP do computador mudar, apague a pasta `certs\` e rode `iniciar.bat` de novo.
- O certificado autoassinado serve para teste e apresentação. Em produção use um certificado real (ou um servidor com HTTPS na frente da API).
- Um instalador `.exe` ou um `.apk` não fazem parte do projeto: o sistema roda como programa Java (`.jar`) e o celular o usa como PWA pelo navegador.

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

**Sprint 4: Interface do operador** ✅
- Tela mobile (PWA) com campo de lote, cartões verde/vermelho/amarelo e lista FIFO
- Rota `GET /api/fifo/proximos` para indicar o lote certo antes da retirada

**Aula 08: Integração ponta a ponta (Checkpoint 2)** ✅
- Tela atualizando sozinha (polling), CORS, estados de carregamento e de erro de comunicação
- Rota `GET /api/movimentacoes` e seção "Movimentações ao vivo"
- Simulador em PowerShell rodando em segundo plano pela API real
- `/health` testando o banco de verdade (200/503) e perfil `xampp`

## Limitações conhecidas

- O `/api/exemplo` devolve texto fixo.
- O `dados-mock.json` não é lido pela aplicação e está no formato antigo (campos `produto` e `situacao`, fileiras repetidas). Os lotes são cadastrados via `POST /api/lotes` (`docs/carregar-demo.ps1` e `mock/simulador.ps1`).
- A tela consulta a API a cada 3 s (polling). Com `spring.jpa.show-sql=true`, o console mostra muito SQL durante a demonstração.
- O simulador cria lotes novos a cada execução; para começar do zero, apague o banco `cristalmaster` (ele é recriado sozinho).
- Produto e movimentação ainda não têm chaves estrangeiras; `Perfil` não é usado; não há registro do operador.
- Só há entrada de lote por cadastro; ainda não existe rota de entrada de saldo em lote existente nem de ajuste.
- O `ControleDemo` falha se for digitado texto no lugar de um número no menu.
- Não há autenticação.
- A tela foi testada com a API simulada (17 verificações automáticas na Aula 07 e 4 cenários de integração na Aula 08), mas ainda precisa da validação em navegador/celular reais; a câmera exige HTTPS ou `localhost` e só funciona onde há `BarcodeDetector` (Chrome/Android).
- A tela identifica o tipo de bloqueio pelo texto da mensagem da API; se as mensagens do `EstoqueService` mudarem, ajustar o `app.js`.

## Próximos passos

1. Relacionar as entidades (lote → produto, movimentação → lote) e registrar o operador.
2. A API devolver um código de erro (ex.: `FIFO_VIOLADO`) além do texto, para a tela não depender da frase.
3. Testar a câmera em um celular real (HTTPS) e ajustar a usabilidade.
4. Histórico completo das movimentações com filtro (hoje a tela mostra as 15 últimas).
5. Trocar o polling por atualização em tempo real (SSE/WebSocket), se necessário.

## Registro de uso de IA

Os prompts enviados à IA durante o desenvolvimento ficam registrados em [`docs/AI_LOG.md`](docs/AI_LOG.md).

# Cristal Master: Controle de Estoque do Almoxarifado

Sistema de controle de estoque FIFO para o almoxarifado da Cristal Master, indústria que trabalha com resinas e aditivos. A visão final é um **PWA mobile**: o operador abre o app direto no celular, sem instalar nada de loja, e usa a câmera para ler os QR Codes dos lotes.

> **Situação atual:** backend (API REST em Spring Boot + H2 embutido ou MySQL) com cadastro de lotes, **saída de material validada pelo FIFO** (com bloqueio e registro de tentativas) e validação de payload com códigos HTTP corretos. A **tela operacional** (PWA em HTML/CSS/JS) consome a API e **se atualiza sozinha a cada 3 s**, com aviso de carregamento e de falha de comunicação; um **simulador** (`mock/simulador.ps1`) gera entradas, saídas e tentativas bloqueadas pela API real e a tela reage ao vivo (Aula 08). A leitura de QR pela câmera está implementada, mas ainda precisa ser testada em um celular real. Veja [O que o programa faz hoje](#o-que-o-programa-faz-hoje) e [Limitações conhecidas](#limitações-conhecidas).

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
| **Cadastro de produtos** (`/produtos`) | Grava e lista produtos no banco. | Base de dados. |
| **Tela operacional (PWA)** (`/`) | Tela de celular: o operador informa o lote e a quantidade; cartão **verde** (baixa autorizada), **vermelho** (violação de FIFO ou lote vencido) ou **amarelo** (atenção). Mostra o próximo lote a sair de cada produto. | Indicar o lote certo antes da retirada e bloquear o errado. |
| **Movimentações ao vivo** (`GET /api/movimentacoes`) | A tela mostra as últimas saídas (verde) e tentativas bloqueadas (vermelho) com o motivo, e avisa quando chega lote novo ou bloqueio. | Rastrear tentativas erradas na hora. |
| **Simulador** (`mock/simulador.ps1`) | Faz o papel do operador pela API real: cadastra lotes, faz saídas certas e tenta saídas fora do FIFO, vencidas e acima do saldo. | Testar o fluxo completo sem equipamento. |
| **Health check real** (`GET /health`) | Testa a conexão com o banco: 200 se o banco responde, 503 com o motivo se não. | Saber se o problema é a API ou o banco. |
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
 models/        entidades = tabelas do banco             ← Produto, Lote, Movimentacao, Perfil

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
 mock/simulador.ps1 ──POST /api/lotes, /api/saidas──▶  API Spring Boot (8080)  ──▶ banco
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

Por padrão o sistema usa o **H2**, um banco embutido que grava tudo no arquivo `dados/cristalmaster.mv.db`, criado sozinho na primeira execução (não há nada para instalar). Opcionalmente usa o **MySQL** (perfil `mysql` ou `xampp`), cujo banco `cristalmaster` também é criado automaticamente (`createDatabaseIfNotExist=true`), desde que o servidor esteja ligado. Nos dois casos as **tabelas** são criadas/ajustadas pelo Hibernate (`ddl-auto=update`): não é preciso rodar `CREATE DATABASE` nem usar o Workbench.

O H2 serve bem para uso individual, demonstração e testes. Para vários usuários ao mesmo tempo em produção, prefira o MySQL (o arquivo do H2 só pode ser aberto por um programa por vez).

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
├── docs/qrcodes-demo.html           # 6 QR Codes de demonstração (imagens em docs/qrcodes/)
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
│   ├── main/resources/application.properties   # banco padrão H2 (arquivo em dados/); perfis mysql e xampp
│   ├── main/resources/application-xampp.properties   # perfil "xampp": root sem senha
│   ├── main/resources/static/                   # tela operacional (PWA): index.html, css/, js/, sw.js, manifest, icons/
│   └── test/java/.../CristalmasterApplicationTests.java
```

## Como executar

> Guia testado no Windows com PowerShell. No Linux/macOS troque `.\mvnw.cmd` por `./mvnw`.

### O que precisa estar instalado

- **JDK 17 ou mais novo (17, 21, 25...).** Não é preciso instalar o Maven (o projeto traz o `mvnw.cmd`).
- **Nenhum banco de dados para instalar.** Por padrão o sistema usa o **H2**, um banco embutido no programa que guarda tudo em um arquivo na pasta `dados\` (criada sozinha). Não é preciso criar banco nem rodar SQL.
- **MySQL é opcional** (perfil `mysql` ou `xampp`, veja o passo 3). Só instale/ligue o MySQL se quiser usá-lo; no XAMPP, clique em **Start** no módulo **MySQL** (o Apache não é necessário).

### Passo a passo

1. **Abra o PowerShell na pasta do projeto**, a que contém `pom.xml` e `mvnw.cmd` (no Explorer, clique na barra de endereço, digite `powershell` e Enter).
2. **Confira o Java que o Maven vai usar:**
   ```powershell
   .\mvnw.cmd -v
   ```
   A linha `Java version` precisa mostrar **17 ou mais**. Se mostrar menos, ou se o build parar com `release version 17 not supported`, o `JAVA_HOME` aponta para um Java antigo (comum nos computadores da faculdade), mesmo que `java -version` mostre outro. Corrija só nesta janela e confira de novo:
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"   # ajuste para a pasta do seu JDK
   .\mvnw.cmd -v
   ```
3. **(Só se for usar MySQL) Escolha o banco.** Com o H2 padrão, **pule este passo**. Para usar o MySQL (ligado na porta 3306), suba a API no passo 4 com o perfil `mysql` (ou `xampp`, para o root sem senha do XAMPP) e informe a senha, que não fica escrita em arquivo do projeto:
   - **XAMPP com `root` sem senha:** use o perfil `xampp` e não precisa de mais nada.
   - **Variável de ambiente** (vale só nesta janela): `$env:DB_SENHA = "sua_senha"`
   - **Arquivo `.env`** (fica na sua máquina, não vai para o Git): `Copy-Item .env.example .env` e preencha `DB_SENHA`.
   - O Spring Boot também aceita `$env:SPRING_DATASOURCE_PASSWORD = "sua_senha"`.
4. **Suba a API:**
   ```powershell
   .\mvnw.cmd spring-boot:run
   ```
   Com MySQL: `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=mysql"` (ou `=xampp`).
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

- **"O banco será criado sozinho":** no H2 padrão, o arquivo `dados\cristalmaster.mv.db` é criado na primeira execução. No MySQL, a URL tem `createDatabaseIfNotExist=true`, então o driver cria o banco `cristalmaster` na primeira conexão. Nos dois casos o Hibernate cria as tabelas (`ddl-auto=update`).
- **Perfil:** é um arquivo `application-<nome>.properties` ativado com `-Dspring-boot.run.profiles=<nome>`. Perfis do projeto: nenhum (H2 embutido, padrão), `mysql` (MySQL com a senha de `DB_SENHA`/`.env`) e `xampp` (MySQL do XAMPP, root sem senha). Exemplo: `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=xampp"`.

### Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `release version 17 not supported` | `JAVA_HOME` com Java antigo | Passo 2 |
| `Unable to determine Dialect without JDBC metadata` | A API não conectou no banco (a causa real está mais acima no log, na linha do `HikariPool`). Só acontece com MySQL | Confirme que o MySQL está ligado e refaça o passo 3 |
| `Database may be already in use` / `The file is locked` (H2) | Outro programa está segurando o arquivo `dados\cristalmaster.mv.db`: outra janela com a API, a IDE (VS Code/Eclipse) ou o OneDrive sincronizando a pasta | O `iniciar.bat` avisa e oferece encerrar o outro programa; projetos dentro do OneDrive passam a guardar o banco em `%LOCALAPPDATA%\CristalMaster`. Manualmente: encerre o outro `java` ou defina `$env:DB_ARQUIVO = "C:/CristalMaster/cristalmaster"` antes de subir |
| `Access denied for user 'root'` | Senha errada | Refaça o passo 3 |
| `8080 already in use` | Outra instância da API rodando | Encerre-a (Ctrl + C na outra janela) |
| Tela vazia | Banco sem dados | Passo 6 |
| `mvnw.cmd não é reconhecido` | Terminal fora da pasta do projeto ou sem `.\` | Passos 1 e 4 |

### Uso no celular, com leitura de QR Code (executável)

A câmera do celular só lê QR Code em **HTTPS** (ou em `localhost`). Por isso existe o perfil `https` e um iniciador que faz tudo sozinho:

1. Dê **duplo clique em `iniciar.bat`** (usa o H2 embutido; para MySQL, rode `iniciar.bat -Banco mysql` com o MySQL ligado) (ou rode `powershell -ExecutionPolicy Bypass -File iniciar.ps1`). Na primeira vez ele confere o Java 17+, gera um certificado local em `certs\` (fora do Git), compila o programa (`target\cristalmaster-0.0.1-SNAPSHOT.jar`) e sobe a API em HTTPS.
2. O terminal mostra o endereço para o celular, no formato `https://IP-DO-COMPUTADOR:8443/`. O celular precisa estar **na mesma rede Wi-Fi**. Se não abrir, libere a porta 8443 no firewall (o comando aparece no terminal; rode-o como Administrador).
3. No celular, o navegador avisa que o certificado não é confiável (é autoassinado): toque em **Avançado** e continue. Depois permita o uso da câmera ao tocar em **Ler QR**.
4. Para instalar como app: menu do navegador > **Adicionar à tela inicial**.

Observações:

- **Chrome no Android** lê o QR sem nada extra (`BarcodeDetector`). **iPhone/Safari e Firefox** não têm esse recurso: baixe a biblioteca [jsQR](https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js) e salve-a como `src/main/resources/static/js/jsQR.js` (não vem no projeto porque o simulador/ambiente de entrega pode estar sem internet). Se o arquivo existir, o botão **Ler QR** aparece automaticamente; se não, o operador digita o código do lote.
- Se o IP do computador mudar, apague a pasta `certs\` e rode `iniciar.bat` de novo.
- O certificado autoassinado serve para teste e apresentação. Em produção use um certificado real (ou um servidor com HTTPS na frente da API).
- Um instalador `.exe` ou um `.apk` não fazem parte do projeto: o sistema roda como programa Java (`.jar`) e o celular o usa como PWA pelo navegador.

## Simulando o uso real (computador + celular)

Este roteiro reproduz o dia a dia do almoxarifado: o **celular** faz o papel do operador (lê o QR Code do lote e retira o material) e o **computador** faz o papel do painel que acompanha as movimentações ao vivo.

### O que é necessário

| Item | Detalhe |
|---|---|
| Computador (Windows) | JDK 17+ e o projeto, como em "Como executar". **Não precisa de MySQL** (usa o H2 embutido) |
| Celular | Android com **Chrome** (lê QR sem nada extra) ou iPhone/Safari (precisa do arquivo `js/jsQR.js`, veja acima) |
| Rede | Computador e celular no **mesmo Wi-Fi**. Redes de visitantes ou da faculdade costumam isolar os aparelhos: se o celular não abrir a página, ligue o **roteador/hotspot do celular** e conecte o computador nele |
| Firewall | Porta **8443** liberada no Windows (comando mostrado pelo `iniciar.bat`, rodado como Administrador) |
| QR Codes | `docs/qrcodes-demo.html` (6 QR Codes prontos, com o resultado esperado de cada um). Abra no computador e aponte a câmera do celular para a tela, ou imprima (Ctrl + P) |
| Banco limpo | O `carregar-demo.ps1` precisa que as fileiras F01 a F05 estejam livres (veja "Zerar o banco" no fim desta seção) |

### Preparação (uma vez)

1. **Banco:** nada a fazer com o H2 padrão. (Com MySQL: ligue-o e use `iniciar.bat -Banco mysql`, definindo `DB_SENHA` se o root tiver senha.)
2. **Suba a API em HTTPS:** duplo clique em `iniciar.bat`. Anote o endereço `https://IP-DO-COMPUTADOR:8443/` que aparece no terminal. Deixe essa janela aberta.
3. **Libere a porta 8443** (PowerShell como Administrador), se ainda não liberou:
   ```powershell
   New-NetFirewallRule -DisplayName "Cristal Master" -Direction Inbound -Protocol TCP -LocalPort 8443 -Action Allow
   ```
4. **Abra o painel no computador:** `https://localhost:8443/` (aceite o aviso de certificado: Avançado > continuar). Esta tela fica à vista durante todo o teste.
5. **Carregue os 5 lotes de demonstração**, em outra janela do PowerShell, na pasta do projeto:
   ```powershell
   powershell -ExecutionPolicy Bypass -File docs\carregar-demo.ps1 -Api https://localhost:8443
   ```
   Deve aparecer `Criado: LOT201` até `LOT205`. Atualize o painel: a seção **Próximo a sair de cada produto** passa a mostrar **LOT201** (Resina Cristal, fileira F01), **LOT204** (Aditivo Azul, F04) e **LOT205** (Aditivo Vermelho, F05). O LOT203 não aparece porque já está vencido.
6. **Abra os QR Codes:** dê duplo clique em `docs\qrcodes-demo.html` (abre no navegador do computador, em outra janela ou outro monitor).
7. **No celular:** conectado ao mesmo Wi-Fi, abra `https://IP-DO-COMPUTADOR:8443/`. No aviso de certificado, toque em **Avançado** e continue. Toque em **Ler QR** e **permita a câmera**. (Opcional: menu do navegador > **Adicionar à tela inicial**.)

### Roteiro de teste

Siga na ordem, com o banco recém-carregado. Em cada passo, o resultado aparece na tela do celular **e**, em poucos segundos, em **Movimentações ao vivo** no computador.

| # | No celular (QR / quantidade) | Resultado esperado |
|---|---|---|
| 1 | Ler **LOT201**, quantidade **200** | Saída autorizada (verde), saldo **800**, `FIFO OK` |
| 2 | Ler **LOT202**, quantidade **100** | Bloqueio: `FIFO violado: o lote esperado é LOT201 (fileira F01)` |
| 3 | Ler **LOT203**, quantidade **50** | Bloqueio: `Lote vencido em 2026-09-30` |
| 4 | Ler **LOT201**, quantidade **5000** | Bloqueio: `Quantidade acima do saldo do lote (saldo atual: 800)` |
| 5 | Ler **LOT999**, quantidade **10** | Erro: `Lote não encontrado: LOT999` |
| 6 | Ler **LOT204**, quantidade **100** | Saída autorizada (é o próximo do Aditivo Azul, pois o LOT203 venceu) |
| 7 | Ler **LOT205**, quantidade **300** | Saída autorizada, saldo **0**. No painel, o Aditivo Vermelho some de "Próximo a sair" |
| 8 | Ler **LOT201**, quantidade **800** | Saída autorizada, saldo **0**. No painel, o próximo da Resina Cristal passa a ser **LOT202** |
| 9 | Ler **LOT202**, quantidade **100** | Agora a saída é autorizada (o FIFO já liberou o LOT202) |
| 10 | Digitar `LOT202` no campo (sem usar a câmera), quantidade **50** | Funciona igual: a digitação é o plano B se o QR não ler |

Os bloqueios (passos 2 a 5) aparecem como **tentativa bloqueada** em Movimentações ao vivo: é o registro de auditoria da regra FIFO. Você também pode conferir os dados brutos no navegador: `/api/lotes`, `/api/fifo/proximos` e `/api/movimentacoes`.

### Teste de carga contínua (opcional)

Com o roteiro acima concluído, abra uma terceira janela do PowerShell e rode o simulador, que cadastra lotes e tenta saídas certas e erradas sozinho a cada 4 segundos, enquanto você continua usando o celular:

```powershell
powershell -ExecutionPolicy Bypass -File mock\simulador.ps1 -Api https://localhost:8443
```

O simulador cria lotes com código `SIM...` e pode consumir saldo dos lotes de demonstração. Para parar, `Ctrl + C`.

### Teste de queda da API

1. Com o painel aberto no computador e a página aberta no celular, pare a API (`Ctrl + C` na janela do `iniciar.bat`).
2. Em poucos segundos, deve aparecer a **faixa vermelha** de erro de conexão nas duas telas.
3. Suba a API de novo com o `iniciar.bat`: as telas voltam sozinhas. Os dados continuam, porque estão gravados no banco (arquivo `dados\` no H2, ou `%LOCALAPPDATA%\CristalMaster` se o projeto estiver no OneDrive; ou MySQL).

### Só no computador (sem celular)

Rode normalmente (`.\mvnw.cmd spring-boot:run`) e abra `http://localhost:8080/`. Em `localhost` a câmera funciona sem HTTPS: com uma webcam, o botão **Ler QR** lê os QR Codes mostrados na tela de um celular ou impressos. Sem webcam, digite o código do lote. Os comandos de carga ficam sem o `-Api` (padrão `http://localhost:8080`).

### Zerar o banco para repetir o teste

Com a API parada, **apague a pasta `dados\`** (H2 padrão; se o projeto está no OneDrive, apague `%LOCALAPPDATA%\CristalMaster`). Ao subir a API de novo, o banco e as tabelas são recriados vazios. No MySQL: apague o banco no phpMyAdmin do XAMPP (`http://localhost/phpmyadmin`, banco `cristalmaster`, aba **Operações > Remover o banco de dados**) ou rode `DROP DATABASE cristalmaster;`.

### Problemas comuns no celular

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| A página não abre no celular | Rede isolando aparelhos, IP errado ou firewall | Confira se os dois estão no mesmo Wi-Fi e se o IP é o do terminal; libere a porta 8443; teste com o hotspot do celular |
| Aviso "conexão não é particular" | Certificado autoassinado | Esperado: Avançado > continuar |
| A câmera não abre | Página em `http://` (não HTTPS) ou permissão negada | Use `https://...:8443`; nas configurações do site, permita a câmera |
| O botão **Ler QR** não aparece | Navegador sem `BarcodeDetector` (iPhone, Firefox) e sem `js/jsQR.js` | Coloque o `jsQR.js` (veja "Uso no celular") ou digite o código |
| O QR lê, mas o código vem estranho | O QR tem outro conteúdo (por exemplo, um link) | O sistema usa o texto exato do QR: ele deve conter só o código, como `LOT201` |
| `Falha ao conectar` ao rodar os scripts em HTTPS | Faltou o `-Api https://localhost:8443` | Repita o comando com `-Api` |
| `A fileira F01 já está ocupada` | O banco já tem os lotes da demonstração | Zere o banco (seção acima) |

**Demonstração da regra FIFO (sem banco e sem API):**

- Menu interativo: execute a classe `ControleDemo` pela IDE (botão Run) ou, após `mvnw.cmd compile`, `java -cp target/classes br.com.cristalmaster.ControleDemo`.
- Três cenários automáticos: `java -cp target/classes br.com.cristalmaster.services.FifoTeste`.

O teste `CristalmasterApplicationTests` sobe o contexto completo e usa o H2 embutido, então não exige MySQL.

Se a porta 8080 estiver ocupada (`8080 already in use`), há outra instância rodando: encerre-a antes de subir novamente.

## Testes (conferir antes de entregar)

Há três níveis de teste, do mais rápido ao mais próximo do uso real:

| Teste | Como rodar | O que confere |
|---|---|---|
| **Automático (JUnit)** | `.\mvnw.cmd test` | Sobe o sistema com um banco H2 **em memória** (não usa a pasta `dados\` nem MySQL) e reproduz o roteiro da seção "Simulando o uso real": saída correta, FIFO violado, lote vencido, saldo, lote inexistente, esgotar lote, registro de bloqueios, lote repetido, fileira ocupada e payload inválido (`src/test/java/.../RoteiroApiTest.java` e `FifoServiceTest.java`). Esperado: `BUILD SUCCESS` e `Failures: 0, Errors: 0` |
| **Fumaça (API no ar)** | Com a API rodando: `powershell -ExecutionPolicy Bypass -File docs\teste-fumaca.ps1` (com HTTPS: `-Api https://localhost:8443`) | Os mesmos cenários pela API real, uma linha `OK`/`FALHOU` por verificação e o total no fim. Pode ser repetido sem zerar o banco (cria lotes com código único) |
| **Manual (celular)** | Roteiro de 10 passos da seção "Simulando o uso real" | A câmera, o HTTPS, a leitura do QR Code e a tela no celular, que os testes automáticos não cobrem |

### Checklist antes de entregar

1. **Clone limpo:** clone o repositório em outra pasta (sem `target\`, `dados\` ou `.env`) e siga **só** o README. Anote o tempo (a auditoria mediu ~40 minutos antes das correções).
2. `.\mvnw.cmd test` termina com `BUILD SUCCESS`.
3. `.\mvnw.cmd spring-boot:run` sobe **sem MySQL ligado** e `http://localhost:8080/health` mostra `Sistema OK - banco de dados conectado`.
4. `docs\teste-fumaca.ps1` termina com `TUDO CERTO`.
5. Com `docs\carregar-demo.ps1`, o painel mostra LOT201, LOT204 e LOT205 em "Próximo a sair".
6. `iniciar.bat` abre a página em HTTPS no computador e no celular, o botão **Ler QR** aparece e o QR do `docs\qrcodes-demo.html` preenche o código.
7. Os 10 passos do roteiro dão o resultado esperado, no celular e no painel.
8. **Opcional (MySQL):** repita os itens 3 e 4 com o perfil `mysql`/`xampp`.
9. Nenhum arquivo secreto no Git: `git ls-files .env dados target` não deve listar nada.

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

# AI_LOG: Registro de uso de IA

Este arquivo reúne dois registros, sem exclusões: **Parte 1**, o registro da equipe por aula (Aulas 02 a 05), e **Parte 2**, o registro dos prompts enviados ao Claude durante o desenvolvimento. Novas entradas são sempre adicionadas ao final.

---

# Parte 1: Registro da equipe (Aulas 02 a 05)

## Registro de uso de IA

Os prompts enviados à IA durante o desenvolvimento ficam registrados em [`AI_LOG.md`](AI_LOG.md).
Aula 02 - Escopo e Setup
Data

16/10/2026

Prompt enviado à IA

Qual arquitetura utilizar para um MVP de controle descentralizado de estoque FIFO para uma indústria de transformação de plásticos?

Resposta resumida da IA

Foi sugerida uma arquitetura baseada em:

Spring Boot
Maven
MySQL
API REST
PWA para acesso por dispositivos móveis
Controle de lotes por QR Code
Implementação de regras FIFO

Também foi recomendado limitar o escopo do MVP para garantir a entrega dentro do tempo disponível da disciplina.

Decisão da equipe

Foi decidido utilizar:

Java 21
Spring Boot
Maven
MySQL
Hibernate/JPA

O escopo foi reduzido para focar apenas nas funcionalidades essenciais de controle FIFO, evitando implementar autenticação avançada, recuperação de senha e integrações externas nesta fase.

Atividades realizadas
Criação do repositório Git.
Criação do README.md.
Estrutura inicial do projeto Spring Boot.
Configuração do banco de dados MySQL.
Criação do banco cristalmaster.
Configuração do Hibernate para criação automática das tabelas.
Aula 03 - Modelagem de Dados e Mock Industrial
Data

16/10/2026

Prompt enviado à IA

Como modelar um banco de dados simples para um MVP de controle FIFO sem criar uma estrutura excessivamente complexa?

Resposta resumida da IA

Foi sugerida uma modelagem enxuta composta por poucas entidades focadas no processo principal:

Produto
Lote
Movimentação

A recomendação foi manter entre 3 e 5 tabelas para atender ao escopo do MVP.

Decisão da equipe

A equipe decidiu adotar uma modelagem simplificada para acelerar o desenvolvimento do backend e permitir a futura integração com o frontend.

Entidades criadas
Produto

Representa os materiais armazenados no estoque.

Campos:

id
sku
nome
Lote

Representa os lotes físicos controlados pelo FIFO.

Campos:

id
codigoQr
fileira
qtdInicial
qtdAtual
Movimentacao

Representa entradas e saídas de estoque.

Campos:

id
tipo
quantidade
dataHora
Atividades realizadas
Criação das entidades JPA.
Configuração das anotações @Entity.
Criação automática das tabelas pelo Hibernate.
Validação da conexão com o MySQL.
Teste de inicialização do Spring Boot.
Resultado obtido

Tabelas criadas automaticamente:

Plain Text
perfis
produtos
lotes
movimentacoes
Dificuldades e correções

Durante a validação da aplicação houve conflito na porta:

Plain Text
8080 already in use

Entretanto, verificou-se que o Hibernate conseguiu criar as tabelas normalmente antes da interrupção da aplicação.

Próximos Passos
Construção do mock industrial.
Geração de dados simulados para lotes.
Criação de cenários normais e cenários com violação de FIFO.
Desenvolvimento dos repositories e services.
Aula 03 - Mock Industrial
Prompt enviado à IA
"Como criar um mock industrial simples para um sistema de controle FIFO utilizando a estrutura atual do projeto?"

Resposta resumida da IA
Foi sugerida a criação de um arquivo JSON contendo registros simulados de lotes, contemplando situações normais e situações de anomalia para validação da lógica de negócio.

Decisão da equipe
Optou-se por utilizar um arquivo JSON dentro da pasta mock para representar os dados simulados do sistema, evitando aumentar a complexidade do MVP com scripts de geração automática neste momento.

Implementação realizada
Arquivo criado:

mock/dados-mock.json

O arquivo contém:

Lotes em situação normal.
Simulação de saída regular de estoque.
Caso de violação FIFO.
Caso de lote vencido.
Resultado
O mock permite validar cenários industriais sem necessidade de integração com equipamentos reais ou ambiente produtivo.
Aula 05 - Regra de Negócio FIFO
Prompt enviado à IA
"Como implementar uma primeira versão da regra FIFO para validar se o lote selecionado corresponde ao lote esperado?"

Resposta resumida da IA
Foi sugerida a criação de um serviço responsável por validar a saída dos lotes, aplicando a lógica FIFO e tratando cenários de erro.

Decisão da equipe
Foi criada a classe FifoService contendo a função validarSaida(), responsável por verificar se o lote selecionado corresponde ao lote esperado.

Casos testados
Caso normal:

LOT001 → LOT001

Resultado:

FIFO OK

Caso anômalo:

LOT001 → LOT005

Resultado:

FIFO VIOLADO

Caso de erro:

null → LOT001

Resultado:

Erro: lote inválido

Resultado
A lógica central de validação FIFO foi implementada e executada com sucesso através de testes em terminal.
Evidência dos Testes
Saída obtida no terminal:

=== CASO NORMAL === FIFO OK

=== CASO ANOMALIA === FIFO VIOLADO

=== CASO ERRO === Erro: lote inválido

---

# Parte 2: Registro dos prompts enviados ao Claude

# AI_LOG: Registro de prompts

Registro cronológico dos prompts enviados à IA (Claude) durante o desenvolvimento.
Novas entradas são **adicionadas ao final**; nenhuma entrada anterior é removida.

---

## Prompt 1 (12/10/2026)

**Prompt enviado:**

> Estamos desenvolvendo um sistema de controle de estoque para o almoxarifado da Cristal Master, uma indústria que trabalha com resinas e aditivos. Ele é um PWA mobile, ou seja, um aplicativo web que o operador abre direto no celular, sem instalar nada de loja, e que usa a câmera para ler QR Codes dos lotes.
>
> **O problema que ele resolve**
> O almoxarifado tem dois problemas ligados:
> 1. O FIFO (primeiro a entrar, primeiro a sair) é quebrado. Os pallets de resina, de cerca de 1.000 kg, ficam em fileiras profundas no chão. Com pressa, o operador de empilhadeira pega o pallet mais fácil de alcançar (o da frente, mais novo) e deixa os antigos no fundo, até vencerem.
> 2. O saldo do sistema não bate com a realidade. As movimentações são anotadas em fichas de papel e só são digitadas no ERP, em computadores fixos, no fim do turno. Nesse intervalo, o estoque registrado e o estoque real ficam diferentes (os "furos de estoque").
>
> **Como o sistema ataca isso**
> * O app indica qual lote e qual posição do piso devem sair primeiro, antes mesmo de o operador pegar o material.
> * O operador lê o QR Code do lote. Se for o lote errado (fora de ordem, vencido ou com quantidade acima do saldo), o sistema bloqueia e registra a tentativa.
> * Toda movimentação é gravada na hora, sem ficha de papel e sem digitação em lote.
> * Cada fileira do piso recebe um código (ex.: `F01`) e um único lote por vez, sinalizado com fita ou tinta no chão. Isso cumpre a restrição do desafio de não gastar com estrutura física, como porta-pallets.
>
> Quero desenvolver este software. Estou com uma estrutura de pastas e quero uma ajuda.
>
> No arquivo AI.log quero que você insira os novos prompts enviados à você sem excluir os demais, analise a estrutura de cada arquivo e documento e siga conforme. Preciso que vá atualizando o arquivo readme também.
>
> Verifique se nestes arquivos encaminhados já possuimos o SpringBoot. Preciso criar um banco de dados e fazer a conexão. Quero também fazer um teste manualmente, então preciso que me ensine a fazer pois vou apresentar.

**Análise da estrutura enviada:**

- `pom.xml`: Spring Boot **4.1.1**, Java 21, dependências `starter-data-jpa`, `starter-webmvc`, `mysql-connector-j` (runtime), `lombok` e starters de teste. **O Spring Boot já está presente.**
- `application.properties`: continha apenas `spring.application.name`. **Faltava a configuração do datasource.**
- `CristalmasterApplication.java` e `CristalmasterApplicationTests.java`: classes geradas pelo Initializr (o teste `contextLoads` exige banco ativo).
- `AI_LOG.md` e `dados-mock.json`: vazios.
- `README.md`: texto padrão do VS Code, sem informação do projeto.
- `.class`, `HELP.md`, `NEWLY_CREATED_BY_SPRING_INITIALIZR`: artefatos gerados (os `.class` ficam em `target/`, ignorado pelo Git; o arquivo marcador pode ser apagado).
- `_gitignore` / `_gitattributes`: precisam ser renomeados para `.gitignore` / `.gitattributes`.
- `maven-wrapper.properties`: deve ficar em `.mvn/wrapper/`.

**Ações realizadas:**

- `src/main/resources/application.properties`: configurada conexão MySQL via variáveis de ambiente (com padrões de desenvolvimento), JPA `ddl-auto=update`.
- `src/main/java/br/com/cristalmaster/controller/HealthController.java`: endpoint `GET /api/health` que valida a conexão com o banco.
- `docs/banco.sql`: script de criação do banco `cristalmaster` e do usuário `cristal`.
- `docs/GUIA_TESTE_MANUAL.md`: roteiro de teste manual e teste negativo para a apresentação.
- `README.md`: reescrito com contexto do problema, solução, stack, estrutura, execução e roadmap.
- `AI_LOG.md`: este registro.

**Observação:** o arquivo foi tratado como `AI_LOG.md` (nome presente na estrutura), embora o prompt cite "AI.log". O código não foi compilado nem executado no ambiente da IA (sem acesso ao repositório Maven); a validação deve ser feita seguindo o guia.

---

## Prompt 2 (12/10/2026)

**Prompt enviado:**

> Verifique e me informe se estes arquivos enviados contemplam o que se pede abaixo:
>
> 1. Implementação de Rotas Base:
>    * `GET /health`: Deve testar ativamente a conexão com o banco e retornar o status real do sistema.
>    * `POST /api/dados` ou `GET /api/exemplo`: Uma primeira rota que grave ou consulte um dado do mock criado na aula anterior.
> 2. Consolidação do Sprint 1 no `AI_LOG.md`:
>    * Registre os prompts de setup, como a IA ajudou a configurar a conexão e eventuais erros de sintaxe ou bibliotecas obsoletas geradas pelo modelo.

**Resultado da verificação:** os arquivos **não** contemplavam o pedido por completo.

- `/health`: o teste de conexão era ativo, mas a rota estava em `/api/health`.
- Rota de dados: inexistente. Não havia entidade, repository nem controller, e o `dados-mock.json` enviado estava vazio (0 bytes).
- `AI_LOG.md`: só continha o prompt 1, sem consolidação do Sprint 1.
- ~~Defeito no `pom.xml` (tag `<n>`)~~ **Afirmação da IA retirada:** na Prompt 6 foi verificado que o `pom.xml` enviado sempre teve `<name>cristalmaster</name>`. O defeito apontado não existia (erro de leitura da IA).

---

## Prompt 3 (12/10/2026)

**Prompt enviado:**

> faça o que se pede.

**Ações realizadas:**

- ~~`pom.xml`: corrigida a tag `<n>` para `<name>`.~~ Nenhuma correção era necessária (ver retratação no Prompt 6).
- `HealthController`: passou a responder em `GET /health` (mantido o alias `/api/health`) e inclui o campo `status`.
- Como o mock enviado estava vazio, foi **definido um modelo de Lote** e preenchido o `dados-mock.json` com 5 lotes de exemplo (um deles com validade já vencida, para demonstrar bloqueio futuro). O arquivo foi copiado para `src/main/resources/`.
- Criados: `model/Lote`, `repository/LoteRepository`, `controller/LoteController` e `config/MockDataLoader` (carrega o mock na tabela se ela estiver vazia).
- Rotas: `GET /api/exemplo` (lista em ordem FIFO), `GET /api/exemplo/{codigo}` e `POST /api/dados` (grava lote; retorna 400 para campos inválidos e 409 para código duplicado ou fileira ocupada).

---

# Consolidação do Sprint 1

## Objetivo
Subir o backend Spring Boot, conectar ao banco MySQL, expor um health check real e uma primeira rota de dados baseada em mock.

## Prompts de setup (resumo)

| # | Pedido | Resultado |
|---|--------|-----------|
| 1 | Contexto do projeto; verificar se o Spring Boot existe; criar banco, conexão e roteiro de teste manual | Confirmado Spring Boot 4.1.1 / Java 21 no `pom.xml`; configurada a conexão MySQL; criados `banco.sql`, health check e guia de teste |
| 2 | Auditar se o entregue atendia ao Sprint 1 | Identificadas lacunas (rota `/health`, rota de dados, mock vazio, log incompleto) |
| 3 | Corrigir as lacunas | Rotas, entidade, mock e correção do `pom.xml` |

## Como a IA ajudou a configurar a conexão

- Diagnóstico: o `application.properties` só tinha `spring.application.name`; faltava o datasource.
- Configuração da URL JDBC do MySQL com parâmetros `useSSL=false`, `allowPublicKeyRetrieval=true` e `serverTimezone=America/Sao_Paulo`.
- Credenciais lidas de variáveis de ambiente (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) com padrões de desenvolvimento, para não versionar senha.
- `spring.jpa.hibernate.ddl-auto=update` para criar a tabela `lote` a partir da entidade.
- Script `docs/banco.sql` com banco `utf8mb4` e usuário dedicado (`cristal`), sem usar o root na aplicação.

## Erros de sintaxe, bibliotecas obsoletas e falhas da IA

Registro honesto: **a IA não executou o projeto** (sem Maven/MySQL no ambiente dela), então abaixo estão falhas encontradas por revisão, não erros de execução.

| Item | Tipo | Descrição | Correção |
|------|------|-----------|----------|
| `<n>` no `pom.xml` | **Falso positivo da IA** | A IA afirmou que a tag era inválida, mas o arquivo sempre teve `<name>` | Nenhuma; afirmação retirada |
| Rota `/api/health` | Divergência do requisito | O Sprint pede `/health` | Rota passou a responder em `/health` (e `/api/health`) |
| Mock vazio | Dependência ausente | `dados-mock.json` com 0 bytes | Mock definido e preenchido com 5 lotes |
| `com.fasterxml.jackson` | Biblioteca obsoleta (risco) | O Spring Boot 4 usa Jackson 3 (`tools.jackson`). Modelos costumam sugerir o pacote antigo `com.fasterxml` por causa do treinamento | `MockDataLoader` usa `tools.jackson.databind.json.JsonMapper` |
| Starters do Boot 4 | Nomenclatura (risco) | Boot 4 usa `spring-boot-starter-webmvc` (antes `-web`) e `-webmvc-test`; código antigo da internet pode apontar nomes antigos | Mantidos os nomes do `pom.xml` gerado pelo Initializr |
| Teste `contextLoads` | Comportamento | Falha se o MySQL estiver desligado | Documentado no guia de teste |
| Erro de shell da IA | Falha de ferramenta | Expansão de chaves `{a,b}` no `mkdir` não funcionou no `/bin/sh` e três arquivos não foram criados | Detectado na saída do comando e arquivos recriados |

> **Pendente de validação:** compilação e execução reais. Se houver erro ao rodar `./mvnw spring-boot:run` (versão do driver, imports do Boot 4, dialect do Hibernate), registrar aqui o log, a causa e a correção.

## Entregas do Sprint 1

- [x] Conexão com MySQL configurada
- [x] `GET /health` com teste ativo do banco
- [x] `GET /api/exemplo`, `GET /api/exemplo/{codigo}` e `POST /api/dados`
- [x] Mock carregado automaticamente na tabela `lote`
- [x] README e guia de teste atualizados
- [ ] Validação em execução real (pendente do usuário)

---

## Prompt 4 (15/10/2026)

**Prompt enviado:**

> tentei rodar o código e este erro apareceu: *(log da execução pelo VS Code com JDK 23; trecho principal abaixo)*
>
> `java.lang.ClassFormatError: Invalid method Code length 0 in class file br/com/cristalmaster/models/Lote`
> (ocorrido em "Bootstrapping Spring Data JPA repositories", antes de qualquer conexão com o banco)

**Primeiro erro real de execução do Sprint 1.**

- **Sintoma:** a aplicação inicia o Spring Boot 4.1.1 e falha ao carregar a classe `Lote`, um `.class` inválido (método com corpo vazio).
- **O que o log mostra:** a classe está no pacote `br.com.cristalmaster.models` (plural), enquanto o código entregue pela IA usa `br.com.cristalmaster.model` (singular). Ou seja, o projeto do usuário tem uma versão própria da classe.
- **Contexto:** execução pelo VS Code (classpath `target/classes`, via argfile) e com **JDK 23**, enquanto o `pom.xml` declara Java 21.
- **Causa provável (não confirmada):** `.class` corrompido/incompleto em `target/classes`, gerado pelo compilador incremental da IDE. Pode envolver o Lombok não processado e/ou o JDK 23, que desativa o processamento de anotações por padrão. Pacotes `model` e `models` coexistindo também podem deixar classes antigas em `target/`.
- **Conclusão parcial:** o erro não é de banco. O contexto do Spring sobe até o JPA, então a configuração do `application.properties` ainda não foi testada.
- **Correção sugerida:** apagar `target/` (`mvnw.cmd clean`), rodar pelo Maven (`mvnw.cmd spring-boot:run`) em vez do botão Run da IDE, limpar o workspace do Java Language Server, e padronizar um único nome de pacote (`model` ou `models`) em todos os imports. Se persistir, usar JDK 21.
- **Status:** aguardando o resultado do usuário.

---

## Prompt 5 (15/10/2026)

**Prompt enviado:**

> Vou te enviar os arquivos do novo programa feito.
>
> Preciso que me auxilie em como apresentar o programa em uma sala de aula. Não vou conseguir te enviar todos os arquivos de uma vez só então enviarei aos poucos.
>
> No primeiro momento observe os arquivos e entenda tudo sobre eles.

**Ações realizadas:**

- Nenhum arquivo novo havia sido anexado a esta mensagem; o pedido foi registrado e a IA aguarda o envio dos arquivos em partes.
- Combinado: a IA analisa cada lote de arquivos conforme chegam, mantém um mapa do projeto e só monta o roteiro de apresentação em sala quando o usuário indicar que enviou tudo.

---

## Prompt 6 (21/10/2026)

**Prompt enviado:**

> Segue a primeira leva de arquivos
>
> *(anexos: `pom_1.xml`, `mvnw_1`, `mvnw_1.cmd`, `_env.example`, `_gitignore_1`, `_gitattributes_1`, `README_1.md`)*

**Análise da 1ª leva:**

- `pom_1.xml`: idêntico ao `pom.xml` original. Já inclui `maven-compiler-plugin` com `annotationProcessorPaths` para o Lombok (relevante para o erro de `ClassFormatError` com JDK 23).
- `mvnw_1` idêntico ao original; `mvnw_1.cmd` difere só por fim de linha CRLF (esperado pelo `.gitattributes`).
- `_gitignore_1` / `_gitattributes_1`: iguais ao padrão do Initializr; **`.env` não está no `.gitignore`**.
- `_env.example`: **vazio (0 bytes)**.
- `README_1.md`: o README gerado pela IA com texto do usuário colado ao final (Sprint 1 e 2, FIFO). Ver pendências na resposta.
- Pelo README, o projeto novo usa pacotes `controllers/models/repositories/routes/services`, tabelas `produtos`, `lotes`, `movimentacoes`, `perfis` e `FifoService`/`FifoTeste`. **Esse código ainda não foi enviado.**

**Retratação:** a IA havia afirmado que o `pom.xml` tinha a tag inválida `<n>`. Verificado: nunca existiu. Entradas anteriores do log foram corrigidas.

---

## Prompt 7 (21/10/2026)

**Prompt enviado:**

> Segue a segunda leva.
>
> *(anexos: `application_1.properties`, `_env`, `_env_1`, `env.ts`, `maven-wrapper_1.properties`, `ControleDemo`, `ExemploController`, `HealthController`, `ProdutoController`, `CristalmasterApplication_1`, `Lote`, `Movimentacao`, `Perfil`, `Produto`, `ProdutoRepository`, `FifoService`, `FifoTeste`, `CristalmasterApplicationTests_1`, `dados-mock_1.json`, `AI_LOG_1.md`)*

**Análise da 2ª leva (projeto do usuário, pacotes `controllers/models/repositories/services`):**

- Entidades `Produto`, `Lote`, `Movimentacao`, `Perfil` com getters/setters manuais (sem Lombok) e tabelas `produtos`, `lotes`, `movimentacoes`, `perfis`. Sem relacionamentos entre elas; `Lote` não tem produto, data de entrada nem validade.
- Apenas `ProdutoRepository` existe (não há repositories de `Lote`, `Movimentacao` e `Perfil`).
- `HealthController` (`GET /health`) retorna o texto fixo "Sistema OK" sem consultar o banco. `ExemploController` (`GET /api/exemplo`) retorna texto fixo. `ProdutoController` tem `GET/POST /produtos` e é a única rota que lê/grava no banco.
- `FifoService` (classe simples, sem `@Service`) compara dois códigos de lote informados; não calcula o lote esperado, não verifica validade nem saldo, não registra tentativas. `FifoTeste` e `ControleDemo` são classes com `main` para demonstração em terminal.
- `dados-mock_1.json`: 7 lotes com campo `produto` (texto) e `situacao`, ambos inexistentes na entidade `Lote`. Há várias fileiras com mais de um lote (F01: LOT001, LOT002, LOT006; F03: LOT004, LOT007), contrariando a regra de um lote por fileira. O mock não é lido pela aplicação.
- `application_1.properties`: MySQL local com `root` e senha vazia, sem variáveis de ambiente.
- `env.ts` e `_env_1`: configuração de um projeto **Node.js/TypeScript** (dotenv, `DATABASE_URL`, porta 3000, banco `cristal_master`), incompatível com o projeto Spring Boot (banco `cristalmaster`, porta 8080). Aparenta ser sobra de outra implementação. `_env` está vazio.
- `AI_LOG_1.md`: log próprio do usuário por aula (02, 03, 05), com um trecho de README colado no topo e sem Aula 04.
- Duplicatas idênticas aos originais: `CristalmasterApplication_1`, `CristalmasterApplicationTests_1`, `maven-wrapper_1.properties`.

---

## Prompt 8 (21/10/2026)

**Prompt enviado:**

> Vou te encaminhar as imagens da estrutura de pastas, toda atualização que eu te solicitar você deve me entregar um arquivo .zip com os arquivos seguindo esta estrutura.
>
> *(anexos: 3 imagens da árvore de pastas do projeto `cristal-master-main`)*

**Estrutura identificada (raiz `cristal-master-main`):**

- Raiz (projeto Spring Boot): `pom.xml`, `mvnw`, `mvnw.cmd`, `.gitignore`, `.gitattributes`, `.env.example`, `README.md`, `.mvn/wrapper/`, `src/`, `target/`.
- `src/main/java/br/com/cristalmaster/`: `controllers/`, `models/`, `repositories/`, `services/`, `ControleDemo.java`, `CristalmasterApplication.java`. Não há `config/` nem `routes/` (citados no README).
- `src/main/resources/application.properties` e `src/test/java/br/com/cristalmaster/CristalmasterApplicationTests.java`.
- `docs/AI_LOG.md` e `mock/dados-mock.json` (o mock fica **fora** do classpath do Spring).
- `backend/` com `.env`, `backend/` e `src/`: aparenta ser o resquício do projeto Node/TypeScript (`env.ts`), separado do Spring Boot.

**Regra combinada:** toda atualização pedida pelo usuário será entregue em um `.zip` com os caminhos relativos à raiz do projeto, seguindo esta estrutura. Nenhum arquivo foi alterado neste prompt.

---

## Prompt 9 (21/10/2026)

**Prompt enviado:**

> Agora quero saber como funciona exatamente este programa e qual problema ele está resolvendo no momento. Gostaria também que colocasse comentários nos códigos com uma descrição do que eles fazem e inserir a informação no readme também.

**Ações realizadas:**

- Explicação do funcionamento e do problema atacado: hoje o programa detecta se o lote escolhido respeita a ordem FIFO (comparação manual de dois códigos) e tem a base de dados e a API de produtos; a regra ainda não está integrada à API/banco.
- Comentários (Javadoc e comentários de linha, em português) inseridos em 13 arquivos Java e no `application.properties`. **Nenhuma linha de código foi alterada**: verificado removendo os comentários e comparando com os originais (14 arquivos idênticos). `dados-mock.json`, `pom.xml` e `.env` não foram comentados (JSON não aceita comentários).
- Executado o `FifoTeste` no ambiente da IA: resultados `FIFO OK`, `FIFO VIOLADO` e `Erro: lote inválido`, conforme o esperado. A aplicação Spring não foi executada (sem MySQL/Maven no ambiente da IA).
- `README.md` reescrito para refletir o projeto real (pacotes `controllers/models/repositories/services`, rotas reais, tabelas, fluxo, como executar, limitações e próximos passos), substituindo a mistura anterior entre a estrutura da IA e a do usuário.
- Entrega em `.zip` seguindo a estrutura de pastas do projeto: `cristalmaster-atualizacao-comentarios.zip`.

---

## Prompt 10 (21/10/2026)

**Prompt enviado:**

> Como o usuário pode colocar o código para rodar e velo funcionando?

**Ações realizadas:**

- Explicado o passo a passo (Windows/PowerShell) para: ligar o MySQL e criar o banco `cristalmaster`, subir a API com `mvnw.cmd spring-boot:run`, ver as rotas no navegador, cadastrar produto via `Invoke-RestMethod`, conferir no MySQL e rodar a demonstração FIFO no terminal (`FifoTeste` e `ControleDemo`).
- Registrados os problemas comuns (porta 8080 ocupada, acesso negado, banco inexistente, `ClassFormatError`).
- Observação: o `curl` do README funciona no `cmd`; no PowerShell, `curl` é um apelido de outro comando, então usar `curl.exe` ou `Invoke-RestMethod`.
- Nenhum arquivo do projeto foi alterado.

---

## Prompt 11 (21/10/2026)

**Prompt enviado:**

> Há a possibilidade do sistema já criar o banco automaticamente sem ter a necessidade de ter que ligar o xampp, ligar o mysqlworkbench e fazer as queries manuais?
>
> *(anexo: trecho da resposta anterior da IA: "O Hibernate cria as tabelas, mas não cria o banco.")*

**Resposta resumida:**

- **Criar o banco automaticamente: sim.** Basta acrescentar `?createDatabaseIfNotExist=true` à URL JDBC (`spring.datasource.url`) no `application.properties`. O usuário do MySQL precisa ter permissão de criar bancos (o `root` tem). Com isso e `ddl-auto=update`, tanto o banco quanto as tabelas são criados na primeira execução.
- **Dispensar o servidor MySQL: não** com MySQL. O servidor precisa estar em execução, mas o **MySQL Workbench não é necessário** (é só um cliente) e o XAMPP serve apenas para iniciar o servidor (basta o módulo MySQL).
- Alternativas para não depender de instalação: MySQL via Docker (`compose.yaml`) ou um perfil de demonstração com banco H2 embutido (deixa de ser MySQL).
- Não testado no ambiente da IA (sem MySQL disponível). Nenhum arquivo do projeto foi alterado; oferecida a entrega em `.zip` com a mudança.

---

## Prompt 12 (21/10/2026)

**Prompt enviado:**

> Aplique a mudança da URL para dar início no mysql através do xampp, depois farei um teste com o h2.
>
> O banco de dados onde vou apresentar possui senha e a senha é senai.

**Ações realizadas:**

- `application.properties`: URL passou a `jdbc:mysql://localhost:3306/cristalmaster?createDatabaseIfNotExist=true` e a senha do `root` foi definida conforme informado pelo usuário. Comentários atualizados.
- `README.md`: removido o passo manual `CREATE DATABASE`; incluídas instruções para iniciar o MySQL pelo XAMPP e nota sobre a senha.
- Alertas passados ao usuário: (1) o XAMPP vem com `root` sem senha, então a senha configurada só funcionará no banco da apresentação; (2) a senha em arquivo versionado fica visível em repositório público; (3) o XAMPP atual usa MariaDB em vez de MySQL, compatível com o driver, mas **não testado** no ambiente da IA.
- Entrega: `cristalmaster-atualizacao-banco-automatico.zip` (`README.md` e `src/main/resources/application.properties`). O teste com H2 fica para uma próxima etapa a pedido do usuário.

---

## Prompt 13 (21/10/2026)

**Prompt enviado:**

> crie uma apresentação simples para este projeto.

**Ações realizadas:**

- Criada uma apresentação de 7 slides (artefato de slides, 16:9, com opção de baixar em PowerPoint ou PDF): capa, problema do almoxarifado, solução proposta, o que já funciona hoje, como funciona (camadas), regra FIFO em ação e próximos passos.
- O conteúdo segue o estado real do código: deixa claro que a regra FIFO ainda é manual e não está ligada à API nem ao banco.
- A apresentação não foi revisada visualmente pela IA (sem renderização no ambiente); o usuário deve percorrer os slides antes de apresentar.
- Não há arquivos novos no projeto; o `.zip` não se aplica a este pedido.

---

## Prompt 14 (21/10/2026)

**Prompt enviado:**

> No arquivo ControleDemo.java não consegui provocar o caso erro.

**Diagnóstico:** o `ControleDemo` lê os códigos com `sc.nextLine()`, que devolve texto vazio (`""`) quando o usuário só aperta Enter, nunca `null`. O `FifoService` só tratava `null` como erro, então a entrada vazia caía em `FIFO VIOLADO` (ou `FIFO OK` se os dois fossem vazios). O caso de erro só era alcançável pelo `FifoTeste`, que passa `null` direto no código.

**Correção:** `FifoService.validarSaida` passou a tratar também código vazio ou só com espaços (`isBlank()`) como `Erro: lote inválido`. Executado no ambiente da IA antes e depois: vazio → `FIFO VIOLADO` (antes) e `Erro: lote inválido` (depois); `null`, `LOT001 x LOT001` e `LOT001 x LOT005` mantiveram o resultado. README atualizado (tabela de cenários e como provocar o erro).

**Entrega:** `cristalmaster-correcao-caso-erro.zip` (`FifoService.java` e `README.md`).

---

## Prompt 15 (21/10/2026)

**Prompt enviado:**

> em breve palavras como funcionam estes testes dentro do controledemo.java?

**Resposta resumida:** o `ControleDemo` é um menu de terminal; a opção 1 lê dois códigos digitados e chama `FifoService.validarSaida`, que responde `FIFO OK`, `FIFO VIOLADO` ou `Erro: lote inválido`. Não são testes automáticos: o resultado é conferido manualmente. Nenhum arquivo alterado.

---

## Prompt 16 (21/10/2026)

**Prompt enviado:**

> CristalmasterApplication.java
>
> para que serve este arquivo?

**Resposta resumida:** é a classe principal do projeto Spring Boot: o `main` chama `SpringApplication.run`, e a anotação `@SpringBootApplication` ativa a configuração automática, varre os pacotes abaixo de `br.com.cristalmaster`, conecta ao MySQL e sobe o servidor web na porta 8080. Nenhum arquivo alterado.

---

## Prompt 17 (22/10/2026)

**Prompt enviado:**

> *(texto da Aula 06 colado: por que a API industrial precisa de validação, conceito de payload, validação por esquemas, códigos HTTP 200/201/400/422/404/500, e requisitos do "Projeto 1 – Vibração")*
>
> Com base no programa que estamos desenvolvendo precisamos dar um próximo passo seguindo estes tópicos.

**Observação sobre o enunciado:** o texto colado detalha apenas o Projeto 1 (Vibração); os requisitos do projeto de FIFO não vieram. A IA aplicou as regras gerais da aula e o exemplo de FIFO que o próprio texto traz (400 para baixa de lote novo antes do antigo; 422 para payload fora do esquema).

**Ações realizadas:**

- Validação por esquema com Bean Validation (`spring-boot-starter-validation`, adicionada ao `pom.xml`) nos DTOs `LoteRequest` e `SaidaRequest`.
- `ApiExceptionHandler` (`@RestControllerAdvice`): 422 para payload inválido/JSON ilegível, 400 para regra de negócio, 404 para lote inexistente; dado malformado não gera 500.
- Novas rotas: `GET/POST /api/lotes`, `GET /api/lotes/{codigoQr}` e `POST /api/saidas`.
- `EstoqueService`: calcula o lote esperado (mais antigo do produto, com saldo e dentro da validade), reaproveita o `FifoService`, bloqueia lote vencido, quantidade acima do saldo e FIFO violado, registrando `TENTATIVA_BLOQUEADA` (com `noRollbackFor`), e baixa o saldo com movimentação `SAIDA` na hora.
- Entidades: `Lote` ganhou `produto`, `dataEntrada` e `validade`; `Movimentacao` ganhou `codigoQr` e `motivo`.
- `docs/TESTES_API.md` com roteiro em PowerShell cobrindo 200, 201, 400, 404 e 422; README atualizado.
- **Verificação:** checagem de sintaxe com o `javac` do ambiente da IA (sem erros de sintaxe; erros de dependências ausentes são esperados). **Não compilado com Maven nem executado com MySQL**; o nome `spring-boot-starter-validation` e o comportamento no Spring Boot 4 precisam ser confirmados ao rodar.
- Entrega: `cristalmaster-aula06-validacao-http.zip`.

---

## Prompt 18 (22/10/2026)

**Prompt enviado:**

> Seguem os próximos passos que precisamos dar: *(orientações da Aula 07 coladas: construir a interface do utilizador; tecnologia visual à escolha; desenho para leitura a 2 metros com verde para normal e vermelho/amarelo para anomalias; consumir a API/mock; registrar no AI_LOG os prompts usados e os ajustes de estilo/usabilidade corrigidos manualmente; exemplos de prompts para Andon, mobile de armazém/PWA e gráficos; e a seção "O que cada um dos 5 Projetos precisa construir visualmente", da qual só o Projeto 1 (Vibração) veio no texto)*

**Observação sobre o enunciado:** a descrição visual do projeto de FIFO não veio. A IA seguiu o exemplo recomendado para "Interface Mobile de Armazém / PWA" (campo do código em destaque, nome do produto, cartão verde "Lote Correto – Baixa Autorizada" e cartão vermelho "Violação de FIFO – Lote Esperado").

**Prompt de geração efetivamente usado (resumo):** interface mobile responsiva para operador de armazém conferir lotes em modo FIFO, consumindo a API Spring Boot existente; campo de lote em destaque; quantidade; cartões de retorno verde/vermelho/amarelo; fonte grande e alto contraste; sem menus supérfluos; PWA simples.

**Decisões de tecnologia e design:**

- HTML + CSS + JavaScript puros, servidos pelo Spring Boot em `src/main/resources/static/` (sem bibliotecas e sem build; abre em `http://localhost:8080/`). PWA com `manifest.webmanifest` e `sw.js` (rede primeiro; `/api/` nunca é guardado em cache).
- Verde, vermelho e amarelo reservados ao estado do lote; o resto da tela é neutro (azul-marinho e papel). A fileira aparece como a fita amarela do piso. Resultado em faixa de largura total, vermelho pulsando (respeita "reduzir movimento"). Fonte Bahnschrift (estilo sinalização industrial) com reservas do sistema.
- Nova rota `GET /api/fifo/proximos` (lote que deve sair primeiro de cada produto), para a tela indicar o lote certo antes da retirada sem duplicar a regra no JavaScript.
- Leitura de QR pela câmera com `BarcodeDetector` (Chrome/Android), exige HTTPS ou localhost.

**Verificação feita pela IA:** sintaxe do JS e do manifest; checagem de sintaxe do Java; 17 verificações automáticas da tela com a API simulada (jsdom): estados 200, 400 FIFO, 400 vencido, 400 saldo, 404, 422, 500, sem rede, texto do servidor sem virar HTML e toque na lista preenchendo o código. **Não foi aberta em navegador real, não foi vista em celular e o backend não foi executado com Maven/MySQL.**

**Ajustes de estilo/usabilidade corrigidos manualmente (a preencher pelo aluno após testar em navegador e celular):**

- [ ] Tamanho das fontes e legibilidade a 2 metros
- [ ] Contraste dos cartões verde/vermelho/amarelo no monitor/celular usados
- [ ] Largura dos botões e campos no celular (toque com luva?)
- [ ] Funcionamento da câmera (HTTPS/`localhost`) e do botão "Ler QR"
- [ ] Textos das mensagens de bloqueio
- [ ] Outros: ______

**Entrega:** `cristalmaster-aula07-interface.zip` (12 arquivos: tela, rota nova, README, roteiro de testes e `docs/carregar-demo.ps1`).

---

## Prompt 19 (22/10/2026)

**Prompt enviado:**

> Apenas para informação. Sempre coloque o AI log dentro da pasta DOCS.

**Ações realizadas:**

- Regra registrada: o `AI_LOG.md` passa a ser entregue sempre em `docs/AI_LOG.md`.
- Como o projeto já tinha um `docs/AI_LOG.md` próprio da equipe (Aulas 02 a 05), os dois registros foram **unidos em um só arquivo, sem apagar nada**: Parte 1 (equipe, texto original) e Parte 2 (conversas com a IA, Prompts 1 a 19). Entrega: `cristalmaster-ai-log-docs.zip` com `docs/AI_LOG.md`, para extrair por cima do arquivo atual.

---

## Prompt 20 (22/10/2026)

**Prompt enviado:**

> Como rodar o arquivo?

**Resposta resumida:** pergunta interpretada como "como rodar o sistema com a interface". Passo a passo: aplicar os zips na ordem, ligar o MySQL no XAMPP, subir com `.\mvnw.cmd clean spring-boot:run`, abrir `http://localhost:8080/`, carregar os lotes de demonstração (`docs/carregar-demo.ps1`, com `-ExecutionPolicy Bypass` se o Windows bloquear) e testar os cenários verde, vermelho e amarelo. Avisos: não abrir o `index.html` com duplo clique; a senha `senai` só vale no banco da apresentação. Nenhum arquivo do projeto foi alterado.

---

## Prompt 21 (22/10/2026)

**Prompt enviado:**

> Erro no powershell: *(log do `mvnw.cmd clean spring-boot:run`)*
> Trecho principal: `Failed to execute goal ... maven-compiler-plugin:3.15.0:compile ... Fatal error compiling: error: release version 21 not supported`

**Erro real de execução (Aula 07):**

- **Sintoma:** o Maven baixou os plugins, limpou o `target`, copiou os 7 recursos (a tela em `static/`) e parou ao compilar os 23 arquivos Java com `release version 21 not supported`.
- **Causa:** o Maven estava rodando com um JDK **anterior ao 21** (o `JAVA_HOME`/`java` do PowerShell aponta para uma versão antiga). O `pom.xml` pede Java 21. Não é erro do código: a falha ocorre antes de o código ser compilado.
- **Correção sugerida:** apontar `JAVA_HOME` e o `Path` da sessão para um JDK 21 ou superior (o log anterior do usuário mostrava o JDK 23 em `C:\Program Files\Java\jdk-23`), confirmar com `.\mvnw.cmd -version` e rodar de novo; para fixar, definir `JAVA_HOME` nas variáveis de ambiente do Windows ou instalar o JDK 21.
- **Status:** aguardando o resultado do usuário. O código novo (validação, rotas, tela) ainda não foi compilado.

---

## Prompt 22 (22/10/2026)

**Prompt enviado:**

> Rodei o código .\mvnw.cmd clean spring-boot:run e funcionou.

**Resultado:** após apontar o `JAVA_HOME` para um JDK 21 ou superior, o projeto compilou e subiu. Isso resolve as dúvidas pendentes da compilação: a dependência `spring-boot-starter-validation` foi resolvida pelo Maven e os 23 arquivos Java (validação, rotas, entidades, `EstoqueService`) compilaram no Spring Boot 4.1.1.

**Ainda não confirmado (a testar pelo aluno):** comportamento das rotas com o MySQL real (roteiro em `docs/TESTES_API.md`), aparência da tela em navegador/celular e câmera. Registrar os ajustes de usabilidade no checklist do Prompt 18.

---

## Prompt 23 (22/10/2026)

**Prompt enviado:**

> Explique passo a passo como rodar os testes.

**Resposta resumida:** passo a passo de quatro conjuntos de testes: (1) automático `.\mvnw.cmd test` (só verifica se o contexto sobe; exige MySQL ligado); (2) roteiro da API em PowerShell (`docs/TESTES_API.md`: 200, 201, 400, 404, 422) com conferência das tentativas bloqueadas no banco; (3) cenários da tela (verde, vermelho e amarelo) com os lotes de `docs/carregar-demo.ps1`; (4) FIFO no terminal (`FifoTeste` e `ControleDemo`).

**Ajuste feito na documentação:** identificado que o roteiro da API e o script de demonstração usam as mesmas fileiras (F01 a F03), o que geraria erro 400 "fileira ocupada" se misturados. `docs/TESTES_API.md` passou a ter a seção "Antes de começar" (banco limpo, como apagar o banco pelo `mysql.exe` do XAMPP, dois PowerShell) e o comando de conferência das movimentações. Entrega: `cristalmaster-docs.zip` (`docs/AI_LOG.md` e `docs/TESTES_API.md`).

---

## Prompt 24 (29/10/2026)

**Prompt enviado:**

> *(orientações da Aula 08 coladas: Integração Ponta a Ponta e Checkpoint 2; consumo da API pelo frontend com `fetch`/`axios` trocando dados fixos por `GET`/`POST`; CORS no backend; indicação de carregamento e de erro de comunicação; teste do fluxo completo com o script de simulação/mock rodando em segundo plano; fechamento do Sprint 2 no `AI_LOG.md` com os prompts das Aulas 05 a 08 e os erros/alucinações da IA na integração; exemplos de prompts para CORS em FastAPI/Express e para chamar a API em JavaScript/React/Streamlit)*
>
> preciso aprontar esta tarefa. tenho o projeto em andamento

**Resposta resumida:** nenhum arquivo tinha sido anexado. A IA pediu o projeto em `.zip` e a stack (backend, frontend, simulador), porque os prompts modelo da aula pressupõem FastAPI/Express.

---

## Prompt 25 (29/10/2026)

**Prompt enviado:**

> *(print do Explorer do VS Code com a pasta `cristal-master`)*

**Resposta resumida:** a IA identificou Spring Boot/Maven (`pom.xml`, `mvnw`, `.mvn`), pediu o `.zip` e já sugeriu uma classe `CorsConfig`. **Essa primeira sugestão estava incompleta:** liberava só `/api/**` com portas fixas em `allowedOrigins`, deixando `/produtos` e `/health` de fora. Corrigida na entrega (`/**` com `allowedOriginPatterns`).

---

## Prompt 26 (29/10/2026)

**Prompt enviado:**

> Pessa para min mostrar as pastas necessárias. vou lhe mandar o readmi

**Resposta resumida:** lista de pastas a expandir e de arquivos a colar (controllers, `application.properties`, tela, mock, `AI_LOG.md`) e do que não precisava mandar (`.mvn`, `target`, `zpastaBackup`...).

---

## Prompt 27 (29/10/2026)

**Prompt enviado:**

> *(conteúdo do `README.md`)*

**Análise:** a tela já é servida pelo próprio Spring (mesma origem, o navegador nem aplica CORS) e já consome a API; o `dados-mock.json` não é lido por ninguém, então não serve como "mock rodando em segundo plano"; as tentativas bloqueadas são gravadas, mas nenhuma rota as devolve. Proposta: simulador pela API real, polling na tela e rota `GET /api/movimentacoes`.

---

## Prompt 28 (29/10/2026)

**Prompt enviado:**

> *(conteúdo do `static/index.html`)*

**Resposta resumida:** aproveitar o `#conexao` e o `#atualizado` já existentes; acrescentar a seção "Movimentações ao vivo", a faixa vermelha de erro e o "Carregando...". Pedido o `app.js`.

---

## Prompt 29 (29/10/2026)

**Prompt enviado:**

> *(conteúdo do `application.properties`)*

**Resposta resumida:** porta 8080 (padrão); senha `senai`; alerta de que `spring.jpa.show-sql=true` vai encher o console com o polling da tela e do simulador.

---

## Prompt 30 (29/10/2026)

**Prompt enviado:**

> Que mais você precisa

**Resposta resumida:** lista em ordem de prioridade: `app.js`, controllers, `Movimentacao`, `MovimentacaoRepository`, `EstoqueService`, `AI_LOG.md`, `carregar-demo.ps1`.

---

## Prompt 31 (29/10/2026)

**Prompt enviado:**

> *(conteúdo do `static/js/app.js`)*

**Ações realizadas:** primeira versão do pacote da Aula 08: `app.js` (polling a cada 3 s, tempo-limite de 5 s, "Carregando...", faixa vermelha, dados esmaecidos sem sumir, "Movimentações ao vivo", destaque e avisos para o que chega), `index.html`, `css/integracao.css`, `config/CorsConfig.java`, `controllers/MovimentacaoController.java` e `mock/simulador.ps1`. O `app.js` foi executado contra uma API simulada (DOM mínimo em Node) em 4 cenários: primeira carga, dados novos, API caindo e API voltando.

**Falha da IA:** o primeiro teste deu erro por causa do próprio teste (relógio falso disparando o temporizador errado), não do `app.js`; corrigido o teste e os 4 cenários passaram.

---

## Prompt 32 (29/10/2026)

**Prompt enviado:**

> Se precisar de mais arquivos para eu lhe mandar, me informe antes de eu anexar os arquivos no código

**Resposta resumida:** pedidos o `docs/carregar-demo.ps1` (nomes dos campos do lote) e o `static/sw.js` (cache). **A IA tinha deduzido os nomes dos campos do `POST /api/lotes` no simulador sem confirmar**; pediu o script para conferir.

---

## Prompt 33 (29/10/2026)

**Prompt enviado:**

> *(conteúdo do `docs/carregar-demo.ps1`)*

**Ações realizadas:** campos confirmados (`codigoQr`, `produto`, `fileira`, `quantidade`, `dataEntrada`, `validade`); produtos do simulador trocados pelos da demo (Resina Cristal, Aditivo Azul, Aditivo Vermelho).

**Erro da IA corrigido na revisão:** no `simulador.ps1`, o filtro para achar um lote "fora do FIFO" usava `$_` dentro de outro `Where-Object` (`$_.produto -eq $_.produto`), comparando o lote com ele mesmo (sempre verdadeiro). Removido.

---

## Prompt 34 (29/10/2026)

**Prompt enviado:**

> *(conteúdo do `static/sw.js`)*

**Resposta resumida:** o service worker já busca da rede primeiro e nunca guarda `/api/` em cache, então não atrapalha a tela nova. Incluído o `integracao.css` no cache de reserva (versão `v2`). Entrega: `aula08-integracao.zip`.

---

## Prompt 35 (29/10/2026)

**Prompt enviado:**

> onde eu acho repositories

**Resposta resumida:** `src/main/java/br/com/cristalmaster/repositories/` (ou Ctrl + P no VS Code).

---

## Prompt 36 (29/10/2026)

**Prompt enviado:**

> *(print da pasta `repositories` com `LoteRepository`, `MovimentacaoRepository` e `ProdutoRepository`)*

**Resposta resumida:** o `MovimentacaoRepository` já existia; orientado a **não** copiar o do pacote.

---

## Prompt 37 (29/10/2026)

**Prompt enviado:**

> *(conteúdo do `MovimentacaoRepository.java`)*

**Resposta resumida:** estende `JpaRepository<Movimentacao, Long>`, então o `findAll(Pageable)` usado pelo `MovimentacaoController` já existe. Tabela de onde copiar cada arquivo do pacote.

---

## Prompt 38 (29/10/2026)

**Prompt enviado:**

> Todo promp que voce recebeu e que voce receberá, voce deve preencher o arqi AI_LOG.md

**Regra registrada:** todo prompt da conversa passa a ser registrado no `docs/AI_LOG.md`. Nesta conversa os prompts foram reunidos numa tabela à parte; na entrega final (Prompt 42) foram convertidos para este formato (Prompts 24 a 42).

---

## Prompt 39 (29/10/2026)

**Prompt enviado:**

> *(print da tela parada em "Conectando", listas vazias e "Sem atualização")* Abri a tela do front end mas o banco de dados não está se conectando embora eu tenha ativado o xampp. também não está aparecendo a atualização quando pressiono o botão atualizar. Verifique, revise e corrija.

**Erro real de execução (Aula 08):**

- **Sintoma:** tela parada em "Conectando", sem "Carregando...", sem faixa de erro, e o botão Atualizar sem efeito.
- **Diagnóstico pela tela:** se o `app.js` tivesse rodado, o topo mudaria para "Servidor online/offline". Conclusão: o JavaScript não executou (arquivo não aplicado, fora de `static/js/` ou versão antiga).
- **Causa provável do banco:** o `application.properties` usa a senha `senai` (banco da apresentação) e o MySQL do XAMPP vem com o `root` sem senha, então o Spring não consegue conectar (`Access denied`).
- **Falha da IA:** a primeira entrega falhava **em silêncio** quando o `app.js` não carregava. Corrigido: o `index.html` passou a mostrar em vermelho quando o `app.js` não carrega ou dá erro; o `app.js` diferencia erro 500 (provável banco) de API desligada; cache do service worker `v3`.

---

## Prompt 40 (29/10/2026)

**Prompt enviado:**

> em que pasta fica o spring boot

**Resposta resumida:** o Spring Boot não é uma pasta à parte: a própria `cristal-master` (com o `pom.xml`) é o projeto. Classe principal `CristalmasterApplication.java`; subir com `.\mvnw.cmd spring-boot:run` ou pelo botão Run. A pasta `backend/` é resto do projeto Node antigo.

---

## Prompt 41 (29/10/2026)

**Prompt enviado:**

> retorne todos os arquivos em suas respectivas pastas em um arquivo .zip para colocarmos na máquina de outro parceiro de trabalho

**Resposta resumida:** a IA só tinha os arquivos colados na conversa, então entregou `cristal-master-aula08.zip` com os arquivos da Aula 08 nas pastas certas e avisou que **não era o projeto completo** (faltavam `pom.xml`, models, services, CSS, ícones). Orientado a compactar a pasta inteira no próprio computador ou usar o Git.

---

## Prompt 42 (29/10/2026)

**Prompt enviado:**

> *(anexo: `CristalMaster_29-10.zip`, projeto completo)* Pesso que analize novamente todos os arquivos e me retorne com a tarefa atendida para hoje que lhe mandei

**Análise do projeto completo:** nenhum arquivo da Aula 08 tinha sido aplicado ainda (`app.js` e `index.html` da Aula 07, sem `CorsConfig`, `MovimentacaoController`, `integracao.css` e simulador). Conferido no código real: as mensagens do `EstoqueService` batem com o que a tela espera; o `cadastrarLote` aceita lote já vencido (o cenário "lote vencido" do simulador funciona); o `Movimentacao` tem os campos que a rota nova devolve.

**Ações realizadas:**

- Aplicados no projeto: `CorsConfig`, `MovimentacaoController`, `app.js`, `index.html`, `integracao.css`, `sw.js`, `mock/simulador.ps1`.
- `HealthController`: `GET /health` passou a **testar a conexão com o banco** (200 ou 503 com o motivo). Era requisito do Sprint 1 e o próximo passo nº 1 do README.
- `application-xampp.properties`: perfil `xampp` (root sem senha) para rodar em casa ou na máquina do parceiro sem alterar a senha da apresentação.
- `simulador.ps1`: números negativos passados entre parênteses (`NovoLote (-200) (-1)`).
- `README.md`, `docs/TESTES_API.md` (teste 7: health, movimentações, CORS) e `docs/AULA08_INTEGRACAO.md` (roteiro e problemas comuns) atualizados.
- Consolidação do Sprint 2 escrita abaixo.

**Verificação:** classes Java novas compiladas com `javac` contra versões mínimas das classes do Spring (sem erros); `app.js` retestado nos 4 cenários. **Não executado no ambiente da IA:** o Maven Central é bloqueado ali (HTTP 403), não há MySQL nem PowerShell. A compilação completa, o MySQL e o simulador precisam ser validados pela equipe no roteiro de `docs/AULA08_INTEGRACAO.md`.

**Entrega:** `CristalMaster_29-10_aula08.zip` (projeto completo, mesma estrutura do enviado).

---

## Prompt 43 (29/10/2026)

**Prompt enviado:**

> Temos um problema. foi feito estilos no css e não esta pegando, consegues revisar

**Diagnóstico:** os dois CSS do projeto enviado (`estilo.css` e `integracao.css`) estão com a sintaxe correta (chaves e comentários fechados); os estilos novos feitos depois não foram enviados. A causa mais provável é de entrega dos arquivos, não do CSS:

- O Spring Boot serve a tela a partir da **cópia** em `target/classes/static`, feita quando a API sobe. Editar `src/main/resources/static/css/...` com a API rodando não muda o que o navegador recebe até reiniciar.
- O navegador e o service worker podiam reaproveitar o CSS antigo do cache.

**Correções:**

- `application.properties`: `spring.web.resources.static-locations=file:src/main/resources/static/,classpath:/static/` (a tela passa a ser lida direto da pasta do projeto: alterou o CSS, basta F5) e `spring.web.resources.cache.cachecontrol.no-cache=true` (o navegador sempre confere se o arquivo mudou).
- `sw.js`: busca com `cache: 'no-cache'` e versão `v4`.
- Alerta: o `integracao.css` é carregado **depois** do `estilo.css`; regra com o mesmo seletor nos dois arquivos vale a do `integracao.css`.

**Não testado no ambiente da IA** (sem Spring/navegador); validar reiniciando a API uma vez e recarregando a página.

---

# Consolidação do Sprint 2 (Aulas 05 a 08)

## Objetivo

Sair da fundação técnica (Sprint 1) para um sistema que funciona de ponta a ponta: regra FIFO de verdade na API, validação com códigos HTTP corretos, tela do operador e, no fechamento, a tela reagindo ao simulador pela API e pelo banco.

## Principais prompts do Sprint 2

| Aula | Prompt (resumo) | Resultado |
|------|-----------------|-----------|
| 05 | "Como implementar uma primeira versão da regra FIFO para validar se o lote selecionado corresponde ao lote esperado?" (Parte 1) e Prompts 6 a 16 (envio do projeto em levas, comentários, como rodar, criação automática do banco, senha `senai`, apresentação, caso de erro do `ControleDemo`) | `FifoService.validarSaida` com casos OK, VIOLADO e erro; código comentado; banco criado sozinho (`createDatabaseIfNotExist=true`); código vazio tratado como inválido |
| 06 | Prompt 17: texto da Aula 06 (validação, payload, esquemas, códigos HTTP) "com base no programa que estamos desenvolvendo" | Bean Validation (`LoteRequest`, `SaidaRequest`), `ApiExceptionHandler` (400/404/422), `EstoqueService` com FIFO, validade e saldo, `TENTATIVA_BLOQUEADA`, `docs/TESTES_API.md` |
| 07 | Prompt 18: orientações da Aula 07 (interface para leitura a 2 metros, verde/vermelho/amarelo, consumir a API); Prompts 19 a 23 (AI_LOG em `docs/`, como rodar, erro de JDK, testes) | Tela PWA em HTML/CSS/JS servida pelo Spring, `GET /api/fifo/proximos`, leitura de QR, `carregar-demo.ps1` |
| 08 | Prompts 24 a 42: orientações da Aula 08 e envio dos arquivos; tela parada em "Conectando"; projeto completo | Polling, CORS, carregando/erro, `GET /api/movimentacoes`, "Movimentações ao vivo", simulador, `/health` com teste do banco, perfil `xampp` |

## Onde a IA errou ou alucinou na integração front ↔ back

| # | Aula | Erro da IA | Como foi resolvido |
|---|------|-----------|--------------------|
| 1 | 08 | **Stack errada nos prompts modelo:** os exemplos da aula falam em FastAPI/Express e portas 3000/5173; nosso backend é Spring Boot na 8080 com a tela na mesma origem | Explicada a stack; CORS feito em Spring (`WebMvcConfigurer`) |
| 2 | 08 | **CORS incompleto:** a primeira `CorsConfig` sugerida liberava só `/api/**` e portas fixas | `addMapping("/**")` com `allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*")` |
| 3 | 08 | **Campos deduzidos sem confirmar:** o simulador foi escrito com os nomes dos campos do `POST /api/lotes` "chutados" | Conferidos com o `carregar-demo.ps1` e o `LoteRequest` antes de aplicar |
| 4 | 08 | **Bug de PowerShell:** `$_` aninhado em dois `Where-Object` no simulador (filtro sempre verdadeiro) | Filtro reescrito na revisão |
| 5 | 08 | **Falha silenciosa:** quando o `app.js` não rodava, a tela ficava parada em "Conectando" sem explicar nada | Diagnóstico em vermelho no `index.html`; mensagens diferentes para API fora, erro 500 (banco) e rota inexistente |
| 6 | 08 | **Mock que não era mock:** o `dados-mock.json` do Sprint 1 não é lido pela aplicação e está em formato antigo | Simulador pela API real (`mock/simulador.ps1`) |
| 7 | 07 | **Tela dependente do texto do erro:** a tela identifica "FIFO violado" e "Lote vencido" pelo começo da mensagem da API | Mantido e documentado; próximo passo: a API devolver um código (`FIFO_VIOLADO`) |
| 8 | 07 | **Testes só com API falsa:** as 17 verificações da Aula 07 e os 4 cenários da Aula 08 usaram API simulada; a IA nunca rodou o Spring com MySQL | Validação real pela equipe (roteiro em `docs/AULA08_INTEGRACAO.md`) |
| 9 | 06 | **Dependência não confirmada:** o nome `spring-boot-starter-validation` no Boot 4 foi sugerido sem compilar | Confirmado quando a equipe compilou (Prompt 22) |
| 10 | 05/06 | **Afirmação falsa sobre o `pom.xml`** (tag `<n>`), feita no Sprint 1 e retratada no Prompt 6 | Retratação registrada |

## O que a equipe arrumou "no braço"

- **JDK errado na compilação** (Prompt 21): `release version 21 not supported`; a equipe apontou o `JAVA_HOME` para um JDK 21+ e o projeto compilou (Prompt 22).
- **Senha do MySQL** (Prompt 39): o banco não conectava no XAMPP por causa da senha `senai`; agora há o perfil `xampp`.
- **CSS alterado que não aparecia** (Prompt 43): a tela era servida da cópia em `target/` e o navegador usava cache; agora é lida direto de `src/` e sem cache.
- **Arquivos da Aula 08 no lugar certo** (Prompts 35 a 37 e 42): conferência do `MovimentacaoRepository` existente e aplicação dos arquivos no projeto completo.

## Validação real a registrar pela equipe

- [ ] API sobe e `/health` responde `Sistema OK - banco de dados conectado`
- [ ] Tela em `http://localhost:8080/` carrega e atualiza sozinha
- [ ] Simulador rodando e a tela mostrando entradas, saídas e bloqueios ao vivo
- [ ] API parada → faixa vermelha; API de volta → faixa some
- [ ] CORS testado pelo Live Server ou pelo `curl.exe` do roteiro
- Problemas encontrados ao rodar: ______

## Entregas do Sprint 2

- [x] Regra FIFO na API com validade e saldo, bloqueio e registro da tentativa
- [x] Validação de payload e códigos HTTP (200, 201, 400, 404, 422, 503)
- [x] Tela do operador (PWA) consumindo a API, sem dados fixos
- [x] CORS, carregando e erro de comunicação
- [x] Simulador em segundo plano e tela reagindo ao vivo
- [x] `AI_LOG.md` com os prompts do Sprint 2 e os erros da IA
- [ ] Validação em execução real (pendente da equipe)

---

# Aula 09: Auditoria Cruzada (projeto auditado: ForjaOEE)

Prompts enviados ao Claude durante a auditoria do projeto **ForjaOEE** (equipe autora: Pablo Sifuentes), seguido de uma consolidação. Ambiente: Windows 11, VS Code, terminal PowerShell. A IA não executou o projeto: todo diagnóstico foi feito a partir do `README.md` do ForjaOEE e dos logs e prints colados pela equipe.

---

## Prompt 44 (05/11/2026)

**Prompt enviado:**

> Auxilio com o projeto aplicado:
>
> Estou seguindo o passo a passo deste readme para acessar um projeto mas apareceu este erro abaixo: *(log do Maven: dependências baixadas e `BUILD FAILURE` em `maven-compiler-plugin:3.15.0:compile`)*
> Trecho principal: `Fatal error compiling: error: release version 21 not supported`
>
> *(anexo: `README.md` do ForjaOEE)*

**Diagnóstico:** o Maven estava usando um JDK **anterior ao 21**, e o projeto compila com `release 21`. As dependências baixaram normalmente, então o problema era só a versão do Java. Orientado a rodar `java -version` e `mvn -version` (a linha `Java version:` do Maven é a que vale, pois ele segue o `JAVA_HOME`), instalar um JDK 21 e apontar o `JAVA_HOME` para ele.

**Observação:** hipótese feita só pelo log. Confirmada no Prompt 51 (o Maven usava o JDK 11).

---

## Prompt 45 (05/11/2026)

**Prompt enviado:**

> *(print da tela "O backend está rodando, mas o frontend não foi encontrado")* Tentei abrir o programa com live server dentro do vs code e apareceu esta mensagem.

**Resposta resumida:** a mensagem vem do próprio backend, que procura `aplicacao/frontend` **relativo à pasta de onde foi iniciado**. O Live Server não é necessário: o backend serve as telas e o frontend chama `/api/...` na mesma origem. Orientado a parar o Live Server, reiniciar o backend a partir de `aplicacao/backend` e abrir a porta do backend.

**Falha da IA:** o comando sugerido foi `mvn spring-boot:run` (copiado do texto da tela), mas o README usa o wrapper `mvnw.cmd`, e o Maven pode nem estar instalado na máquina. Corrigido no Prompt 49.

---

## Prompt 46 (05/11/2026)

**Prompt enviado:**

> me ajude com o passo a passo para fazer funcionar o programa do zero. Estou usando o vscode

**Ações realizadas:**

- Leitura completa do `README.md` do ForjaOEE (a primeira leitura veio truncada; as linhas restantes foram lidas em seguida).
- Passo a passo de 0 a 7: pré-requisitos, abrir a pasta raiz no VS Code, criar o banco `forjaoee` no pgAdmin, criar o `application-local.properties` com a senha, subir o backend em `aplicacao\backend`, abrir `http://localhost:8080`, gerar dados com o simulador (modos `lote`, `loop` e `historico`) e rodar os testes.

**Falhas da IA:** (1) os comandos seguiram a sintaxe CMD do README (`mvnw.cmd ...`), embora o terminal padrão do VS Code seja o PowerShell (Prompt 49); (2) o passo da senha seguiu o README e omitiu o **usuário** e a **ativação do perfil `local`** (Prompt 53).

---

## Prompt 47 (05/11/2026)

**Prompt enviado:**

> *(print da tela "Cristal Master - Saída de lote", com "Servidor offline")* Parei no passo 5 e abriu este projeto que não é o projeto do colega.

**Diagnóstico:** outra aplicação respondia na porta 8080 (a tela é o Cristal Master, projeto da própria equipe, ver Parte 1). Orientado a conferir o log do ForjaOEE, rodar o ForjaOEE em outra porta (`--server.port=8081`) ou liberar a 8080 (`netstat -ano | findstr :8080`, `tasklist`, `taskkill`) e validar com `/api/sistema/status`.

**Observação:** a hipótese de "porta ocupada" não chegou a ser confirmada por nenhum log do ForjaOEE; as falhas seguintes foram de JDK e de banco de dados.

---

## Prompt 48 (05/11/2026)

**Prompt enviado:**

> onde eu olho o log?

**Resposta resumida:** o log é a saída do terminal onde roda o `spring-boot:run` (não há arquivo). Explicado como achar a aba certa no VS Code, rodar de novo se foi fechada, o que procurar (`Tomcat started on port`, `Port 8080 was already in use`, `Connection refused`) e como copiar o texto para colar na conversa (`cls` para limpar antes).

---

## Prompt 49 (05/11/2026)

**Prompt enviado:**

> gerou este erro: *(PowerShell: `mvnw.cmd : O termo 'mvnw.cmd' não é reconhecido como nome de cmdlet...`)*

**Erro real de execução:**

- **Sintoma:** `mvnw.cmd não é reconhecido`, com a sugestão do próprio PowerShell de usar `.\mvnw.cmd`.
- **Causa:** o PowerShell não executa programas da pasta atual sem o `.\`; os comandos do README são para CMD.
- **Correção:** `.\mvnw.cmd spring-boot:run`, conferindo a pasta com `pwd` e `dir`. Para argumentos `-D...`, usar aspas no PowerShell.
- **Falha da IA:** os comandos entregues no Prompt 46 não eram para o terminal em uso.

---

## Prompt 50 (05/11/2026)

**Prompt enviado:**

> gerou este erro: *(log do `.\mvnw.cmd spring-boot:run`: `BUILD FAILURE` em `maven-compiler-plugin:3.15.0:testCompile`)*
> Trecho principal: `Fatal error compiling: error: release version 21 not supported`

**Diagnóstico:** o mesmo erro do Prompt 44. O `JAVA_HOME` ainda não tinha efeito sobre o Maven (o código principal já estava compilado, provavelmente pela extensão Java do VS Code com outro JDK). Orientado a rodar `.\mvnw.cmd -version`, `echo $env:JAVA_HOME` e `java -version`, listar as pastas de JDK instaladas, definir `$env:JAVA_HOME` e `$env:Path` na sessão, tornar permanente nas variáveis do Windows e reiniciar o VS Code.

---

## Prompt 51 (05/11/2026)

**Prompt enviado:**

> *(sem texto: saída colada do terminal com `.\mvnw.cmd -version`, `echo $env:JAVA_HOME` e `java -version`)*

**Diagnóstico:**

- O Maven usava `Java version: 11.0.16` em `C:\Program Files\OpenJDK\jdk-11.0.16.8-hotspot`: **causa confirmada** do `release 21 not supported`.
- O comando `java` do `Path` era a versão **27.0.1.0.3**, que atende ao requisito (`release 21` aceita JDK 21 ou superior).
- A colagem trouxe junto o prefixo `PS C:\...>`, que o PowerShell tentou executar como comando (erros falsos de `Get-Process`). Orientado a copiar só o comando.
- Próximo passo: descobrir a pasta do JDK com `(Get-Command java).Source` e `dir "C:\Program Files\Java"`, e usar o JDK 21 (Temurin) como plano B se o 27 desse incompatibilidade.

---

## Prompt 52 (05/11/2026)

**Prompt enviado:**

> *(saída de `(Get-Command java).Source`, `dir "C:\Program Files\Java"` e da tentativa com `JAVA_HOME = "C:\Program Files\Java\jdk-27"`, seguida de `The JAVA_HOME environment variable is not defined correctly`)* Gerou este erro

**Erro real de execução:**

- **Sintoma:** o `mvnw.cmd` recusou o `JAVA_HOME`.
- **Falha da IA:** o caminho `jdk-27` foi dado como exemplo, mas a pasta real, visível na própria listagem do `dir`, era `jdk-27.0.1.0.3`. Caminho de exemplo não confirmado.
- **Correção:** `$env:JAVA_HOME = "C:\Program Files\Java\jdk-27.0.1.0.3"`, validado com `dir "$env:JAVA_HOME\bin\java.exe"`. Alternativa: usar a pasta `jdk-23`, também instalada.

---

## Prompt 53 (05/11/2026)

**Prompt enviado:**

> *(log completo do `.\mvnw.cmd spring-boot:run` com o JDK 27: o projeto compila e o Spring Boot sobe até o Flyway, e então falha com `FATAL: autenticação do tipo senha falhou para o usuário "root"`, SQL State 28P01)* gerou este erro:

**Diagnóstico:**

- O Java 27 funcionou, o projeto compilou e o Spring/Flyway chegaram ao PostgreSQL (o banco estava no ar).
- A autenticação falhou para o usuário `root`, que normalmente não existe num PostgreSQL novo (o padrão é `postgres`).
- O log mostrava `No active profile set`: o perfil `local` não estava ativo, então o `application-local.properties` do README não era lido.

**Ações orientadas:** criar `aplicacao\backend\src\main\resources\application-local.properties` com `spring.datasource.username=postgres` e a senha, conferir `url`/usuário no `application.properties` e rodar com `"-Dspring-boot.run.profiles=local"`.

**Observação:** o usuário padrão `root` foi deduzido do log; o `application.properties` não foi enviado à IA.

---

## Prompt 54 (05/11/2026)

**Prompt enviado:**

> como faço para acessar o postgreesql?

**Resposta resumida:** acesso pelo **pgAdmin** (senha mestra do pgAdmin é diferente da senha do usuário `postgres`; *Servers → PostgreSQL*) e pelo **psql** (`psql -U postgres -h localhost -p 5432`, com caminho completo se não estiver no `Path`). Criação do banco `forjaoee` por qualquer um dos dois. Para senha esquecida: conferir o serviço em *Serviços* e, em último caso, redefinir a senha do `postgres` editando temporariamente o `pg_hba.conf` (só vale para o PostgreSQL do próprio computador).

---

## Prompt 55 (05/11/2026)

**Prompt enviado:**

> identificamos a senha:
>
> Vamos por para rodar

**Resposta resumida:** (a senha não foi compartilhada com a IA) conferir se o banco `forjaoee` existe, criar o `application-local.properties` com usuário e senha, repetir o `JAVA_HOME` no terminal, rodar com `-Dspring-boot.run.profiles=local`, o que esperar no log, abrir `localhost:8080` (ou 8081) e, depois, o simulador em um segundo terminal.

---

## Prompt 56 (05/11/2026)

**Prompt enviado:**

> *(log do `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"`: `The following 1 profile is active: "local"` e, em seguida, `FATAL: banco de dados "forjaoee" não existe`, SQL State 3D000)*

**Diagnóstico:** o perfil `local` ficou ativo e o login no PostgreSQL passou. Faltava apenas criar o banco. Orientado a criar `forjaoee` vazio no pgAdmin (*Databases → Create → Database...*) ou com `psql -c "CREATE DATABASE forjaoee;"` e rodar de novo (o Flyway cria as tabelas).

**Observação:** o README do ForjaOEE já documentava este passo; ele foi pulado pela equipe auditora.

---

## Prompt 57 (05/11/2026)

**Prompt enviado:**

> consegui abrir o projeto. O que fazer?

**Resposta resumida:** com o backend no ar, o painel fica vazio até chegar telemetria. Orientado a abrir um segundo terminal, repetir o `JAVA_HOME`, compilar o simulador (`javac GerarTelemetria.java`) e enviar dados (modo `lote` para carga rápida, `loop` ao vivo ou `historico` para um turno), trocando a porta se necessário. Depois, conferir Dashboard, Ocorrências, Relatórios e Painel Andon.

**Não validado pela IA:** se o simulador rodou e se o dashboard passou a mostrar dados. Pendente da equipe.

---

## Prompt 58 (05/11/2026)

**Prompt enviado:**

> Com base nas duvidas e passos que fizemos acima. Gere um relatório conforme as instruções abaixo: *(texto da Aula 09: Fase 1, Fase 3 e modelo do `SETUP_AUDIT.md`)*

**Ações realizadas:** gerado o `SETUP_AUDIT.md` no modelo da aula, com 5 erros de onboarding, observações menores, sugestões para a equipe autora e o guia corrigido para Windows/PowerShell.

**Pontos que a equipe precisa conferir (campos que a IA não tinha como saber):**

- Nomes da equipe auditora e o tempo real cronometrado (a IA estimou cerca de 40 minutos pelos horários do log).
- A nota **6/10** é uma sugestão da IA, com justificativa no próprio relatório.
- O resultado do simulador e do dashboard ficou marcado como `[PREENCHER]`.
- O projeto não usa `.env`; o relatório trata o `application-local.properties` como equivalente e aponta a falta de um arquivo de exemplo.

---

## Prompt 59 (05/11/2026)

**Prompt enviado:**

> Com tudo isto preciso que você preencha este arquivo AI_LOG. com os prompts dados. *(anexo: `AI_LOG.md`)*

**Ações realizadas:** os Prompts 44 a 59 e a consolidação da Aula 09 foram adicionados **ao final** do arquivo. Nenhuma entrada anterior foi alterada ou removida.

---

# Consolidação da Aula 09 (Auditoria Cruzada)

## Objetivo

Colocar o ForjaOEE para rodar do zero, seguindo apenas o README, e entregar o `SETUP_AUDIT.md` (nota de reprodutibilidade, problemas do onboarding e guia corrigido). A IA foi usada para diagnosticar os erros a partir dos logs colados pela equipe.

## Como a IA ajudou a diagnosticar e debugar

| # | Sintoma (Prompt) | Diagnóstico da IA | Confirmação | Solução |
|---|------------------|-------------------|-------------|---------|
| 1 | `release version 21 not supported` (44, 50) | Maven com JDK anterior ao 21 | Confirmado: o Maven usava o JDK 11 (Prompt 51) | `JAVA_HOME` para o JDK 27 (compila com `release 21`) |
| 2 | "frontend não foi encontrado" (45) | Backend iniciado de outra pasta; Live Server desnecessário | Não confirmada por log; o README já documenta | Iniciar de `aplicacao\backend` |
| 3 | Tela do Cristal Master em `localhost:8080` (47) | Outra aplicação na porta 8080 | A tela era do projeto da própria equipe; "porta em uso" não apareceu em log do ForjaOEE | Porta 8081 ou encerrar o outro processo |
| 4 | `mvnw.cmd` não reconhecido (49) | PowerShell exige `.\` | Confirmado: o comando passou a rodar | `.\mvnw.cmd` |
| 5 | `JAVA_HOME ... not defined correctly` (52) | Caminho inexistente | Erro de caminho da própria IA | `jdk-27.0.1.0.3` |
| 6 | `autenticação falhou para o usuário "root"` (53) | Usuário `root` inexistente e perfil `local` inativo | Confirmado: o log seguinte mostrou o perfil `local` ativo e o login passou | `application-local.properties` com usuário e senha + `-Dspring-boot.run.profiles=local` |
| 7 | `banco de dados "forjaoee" não existe` (56) | Banco não criado | Confirmado: depois de criado, a equipe relatou que o projeto abriu (Prompt 57) | Criar o banco `forjaoee` |

## Onde a IA errou ou foi limitada

| # | Prompt | Erro ou limitação | Como foi resolvido |
|---|--------|-------------------|--------------------|
| 1 | 45 | Sugeriu `mvn spring-boot:run`, mas o projeto usa o wrapper `mvnw.cmd` | Passou-se a usar `.\mvnw.cmd` |
| 2 | 46 | Passo a passo em sintaxe CMD com o terminal do VS Code em PowerShell | Corrigido no Prompt 49 |
| 3 | 46 | O passo da senha seguiu o README e omitiu o usuário e a ativação do perfil `local` | Corrigido no Prompt 53 |
| 4 | 52 | Caminho de `JAVA_HOME` dado como exemplo sem conferir (`jdk-27`) | Caminho real da listagem do `dir` |
| 5 | 47 | A hipótese de porta ocupada foi apresentada como provável sem log que a confirmasse | As falhas seguintes eram de JDK e banco |
| 6 | todos | A IA não executou o projeto (sem Windows, sem PostgreSQL); todo diagnóstico veio de logs e prints | Cada hipótese foi validada pela equipe no terminal |

## O que a equipe arrumou "no braço"

- **JDK do Maven:** descobriu que o `JAVA_HOME` apontava para o JDK 11 e localizou a pasta real `jdk-27.0.1.0.3` (Prompts 51 e 52).
- **Senha do PostgreSQL:** identificou a senha do usuário (Prompt 55).
- **Configuração local:** criou o `application-local.properties` e o banco `forjaoee` (Prompts 55 e 56).
- **Forma de pedir ajuda:** passou a colar o log completo do terminal, o que permitiu os diagnósticos dos Prompts 51 a 56.

## Validação real a registrar pela equipe

- [x] Backend sobe com o perfil `local` e a interface abre em `http://localhost:8080` (relatado no Prompt 57)
- [ ] Simulador rodando (`GerarTelemetria`) e enviando leituras sem erro
- [ ] Dashboard, Ocorrências, Relatórios e Painel Andon mostrando dados
- [ ] `mvnw.cmd test` passando
- Tempo total real cronometrado: ______
- Problemas encontrados ao rodar o simulador: ______

## Entregas da Aula 09

- [x] `SETUP_AUDIT.md` gerado (rascunho, com campos `[PREENCHER]`)
- [x] `AI_LOG.md` atualizado com os prompts e a consolidação
- [ ] Revisar e completar o `SETUP_AUDIT.md` (nomes, tempo, resultado do simulador)
- [ ] Submeter a Issue ou o Pull Request com o `SETUP_AUDIT.md` no repositório do ForjaOEE

---

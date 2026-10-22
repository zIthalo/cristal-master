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

# Relatório de Auditoria de Setup e Onboarding

* **Projeto Auditado:** ForjaOEE (sistema supervisório e painel Andon de OEE, Frasle Mobility S.A.)
* **Equipe Autora:** Pablo Sifuentes
* **Equipe Auditora:** Paulo Henrique, Alexandre Fabrício, Ithalo Willian
* **Data da auditoria:** 05/11/2026
* **Ambiente de teste:** Windows 11, VS Code, terminal PowerShell, PostgreSQL local, JDK 11 / 23 / 27 instalados em paralelo
* **Tempo Gasto para Subir o Sistema:** aproximadamente 40 minutos até o backend subir e a interface abrir (primeira compilação registrada às 20:10, backend inicializando com sucesso após as 20:48). \[AJUSTAR com o cronômetro da equipe]
* **Nota de Reprodutibilidade:** **6 / 10**

> \*\*Justificativa da nota:\*\* o sistema sobe e a interface abre sem nenhuma alteração de código, e o `mvnw.cmd` dispensa instalar o Maven. Mas o passo a passo \*\*não funcionou de primeira\*\*: foram necessárias 5 correções de ambiente e de configuração que o README não cobre ou cobre de forma incompleta (ver seção 2). Todos os bloqueios foram de documentação e configuração, nenhum de código.

\---

## 1\. Diagnóstico do Onboarding Inicial

* **Clone e Dependências:** o projeto usa Maven (`pom.xml`), e as bibliotecas (Spring Boot 4.1.1, Flyway, driver PostgreSQL) baixam sozinhas na primeira execução. O wrapper `mvnw.cmd` está no repositório, então **não é preciso instalar o Maven**. O que faltou documentar foi uma seção de **pré-requisitos**: o README cita "Java 21" só na tabela de stack e não diz que o `JAVA\_HOME` precisa apontar para um JDK 21 ou superior, nem qual versão do PostgreSQL usar. Dependências que o auditor precisou garantir por conta própria: JDK 21+, PostgreSQL (com pgAdmin) e Git.
* **Configuração de Ambiente:** o projeto **não usa `.env`**. A configuração fica em `application.properties` (versionado, sem senha) e em `application-local.properties` (no `.gitignore`, **não existe no clone**). Não há arquivo de exemplo (`application-local.properties.example`) no repositório. O README orienta criar o arquivo só com a senha, mas isso não basta: o log mostrou que o usuário padrão do `application.properties` é `root`, que normalmente não existe num PostgreSQL recém-instalado (o padrão é `postgres`). Também não é dito que o perfil `local` precisa ser **ativado**: no primeiro teste o log mostrou `No active profile set, falling back to 1 default profile: "default"`, ou seja, o arquivo com a senha era ignorado.
* **Execução da API e Mock:** o backend sobe com `mvnw.cmd spring-boot:run` **depois de corrigidos os itens da seção 2**. O banco `forjaoee` precisa ser criado manualmente (o README avisa, mas é fácil pular). O Flyway cria as tabelas sozinho. O simulador (`simulator/GerarTelemetria.java`) tem comandos claros no README. \[PREENCHER: confirmar se o simulador rodou e se o dashboard mostrou os dados; no momento da redação deste relatório essa etapa ainda não tinha sido verificada.]
* **Acesso à Interface:** o frontend é servido pelo próprio backend, na mesma origem (`http://localhost:8080`), então **não há problema de CORS**. O erro de porta/pasta que ocorreu está descrito na seção 2.

\---

## 2\. Principais Gargalos e Erros Encontrados

* *Erro 1: `release version 21 not supported` ao compilar.*
O Maven usava o JDK 11 (o `JAVA\_HOME` do sistema apontava para `C:\\Program Files\\OpenJDK\\jdk-11.0.16.8-hotspot`), embora o comando `java -version` mostrasse outra versão. Corrigido apontando `JAVA\_HOME` para um JDK mais novo. **Problema de documentação:** o README não traz pré-requisitos nem orienta conferir `mvnw.cmd -version`.
* *Erro 2: `mvnw.cmd : O termo 'mvnw.cmd' não é reconhecido`.*
Os comandos do README são para **CMD** (`mvnw.cmd ...`), mas o terminal padrão do VS Code é o **PowerShell**, que exige `.\\mvnw.cmd`. O README é orientado ao IntelliJ e ao CMD e não menciona o VS Code.
* *Erro 3: tela "O backend está rodando, mas o frontend não foi encontrado".*
O backend procura `../frontend` relativo à pasta onde foi iniciado, e tinha sido iniciado de outra pasta. O README tem uma nota sobre isso, mas ela fica no fim da seção, e não diz que o **Live Server do VS Code não deve ser usado** (o auditor tentou abrir o frontend por ele, o que não funciona porque as chamadas `/api/...` precisam da mesma origem do backend).
* *Erro 4: `FATAL: autenticação do tipo senha falhou para o usuário "root"` (SQL State 28P01).*
O usuário padrão configurado é `root`, e o `application-local.properties` do README só define a senha. Foi preciso criar o arquivo com `spring.datasource.username=postgres` além da senha, e **ativar o perfil** com `-Dspring-boot.run.profiles=local`. **Problema de documentação:** nem o usuário nem a ativação do perfil estão descritos.
* *Erro 5: `FATAL: banco de dados "forjaoee" não existe` (SQL State 3D000).*
O banco não havia sido criado. O README documenta esse passo corretamente; foi falha do auditor, mas mostra que o erro é fácil de cometer e merece destaque (por exemplo, como primeiro item do "Como rodar").
* *Ocorrência de ambiente (não é falha do projeto): outra aplicação na porta 8080.*
Ao abrir `http://localhost:8080`, apareceu outro sistema ("Cristal Master"), porque uma aplicação de outro projeto ocupava a porta. O README não diz como trocar a porta (`--server.port=8081`).
* *Observações menores:*

  * As mensagens de erro do PostgreSQL aparecem com acentos quebrados (`autentica??o`) por causa do encoding Cp1252 do Windows. Não afeta o funcionamento.
  * O projeto compilou e iniciou normalmente com o **JDK 27**, embora o alvo seja o Java 21. Os avisos `sun.misc.Unsafe` no início do log vêm do Maven e são inofensivos.

### Sugestões para a equipe autora

1. Adicionar uma seção **Pré-requisitos** (JDK 21+, PostgreSQL, Git) com o comando `mvnw.cmd -version` para conferir o Java usado pelo Maven.
2. Incluir os comandos também em **PowerShell** (`.\\mvnw.cmd`) e citar o VS Code.
3. Versionar um `application-local.properties.example` com `spring.datasource.username` e `spring.datasource.password`.
4. Documentar a ativação do perfil (`-Dspring-boot.run.profiles=local`) ou configurar o projeto para carregá-lo sem ação manual. Alternativa: trocar o usuário padrão de `root` para `postgres`.
5. Avisar que o **Live Server não deve ser usado** e como mudar a porta se a 8080 estiver ocupada.

\---

## 3\. Passo a Passo Corrigido (Guia Definitivo)

> Comandos para \*\*Windows com PowerShell\*\* (terminal padrão do VS Code). Os passos 1 a 6 foram executados e validados nesta auditoria. O passo 7 segue o README e \[PREENCHER: confirmar resultado].

### Pré-requisitos

* **JDK 21 ou superior** (testado com o JDK 27). Instale o JDK, não apenas o JRE.
* **PostgreSQL** com o pgAdmin, e a senha do usuário `postgres` em mãos.
* **Git**.
* Não é necessário instalar o Maven (o projeto traz o `mvnw.cmd`).

### 1\. Clonar o repositório

```powershell
git clone <URL\_DO\_REPOSITORIO>
cd ForjaOEE
```

Abra a pasta raiz `ForjaOEE` no VS Code (*File → Open Folder*).

### 2\. Criar o banco de dados

No pgAdmin: *Servers → PostgreSQL → Databases → botão direito → Create → Database...*, nome **`forjaoee`**, **Save**. Deixe o banco vazio (o Flyway cria as tabelas).

Alternativa pelo terminal:

```powershell
psql -U postgres -h localhost -c "CREATE DATABASE forjaoee;"
```

### 3\. Criar o arquivo de configuração local

Crie o arquivo `aplicacao\\backend\\src\\main\\resources\\application-local.properties` com o usuário e a senha do **seu** PostgreSQL:

```properties
spring.datasource.username=postgres
spring.datasource.password=SUA\_SENHA
```

Esse arquivo está no `.gitignore` e não deve ser enviado ao GitHub.

### 4\. Apontar o terminal para o JDK 21+

Abra um terminal no VS Code (*Terminal → New Terminal*) e rode, ajustando o caminho para o seu JDK:

```powershell
$env:JAVA\_HOME = "C:\\Program Files\\Java\\jdk-27.0.1.0.3"
$env:Path = "$env:JAVA\_HOME\\bin;$env:Path"
```

Isso vale só para o terminal atual; repita em cada terminal novo, ou ajuste a variável de ambiente do sistema para ficar permanente.

### 5\. Subir o backend (que também serve o frontend)

```powershell
cd aplicacao\\backend
.\\mvnw.cmd -version
.\\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

* O `-version` deve mostrar `Java version: 21` ou superior.
* No log, procure `The following 1 profile is active: "local"` e, no fim, `Started ForjaoeeApplication`.
* Deixe esse terminal aberto, porque ele é o servidor.
* **Importante:** inicie sempre de dentro de `aplicacao\\backend`, senão o frontend não é encontrado.
* Se a porta 8080 estiver ocupada por outra aplicação, use a 8081:

```powershell
.\\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local" "-Dspring-boot.run.arguments=--server.port=8081"
```

### 6\. Abrir a interface

* Dashboard: **http://localhost:8080**
* Painel Andon: **http://localhost:8080/andon.html**

**Não use o Live Server do VS Code.** As telas são servidas pelo backend e dependem dele na mesma origem. Sem dados, o dashboard abre vazio; siga o passo 7.

### 7\. Gerar telemetria com o simulador

Abra um **segundo terminal** (botão `+`), repita o passo 4 e rode:

```powershell
cd simulator
javac GerarTelemetria.java

# Carga rápida: última hora de produção (2.000 leituras)
java GerarTelemetria --modo lote --quantidade 2000 --api http://localhost:8080/api/telemetria --seed 42

# Ou ao vivo: uma leitura de cada máquina a cada 30 s (Ctrl+C para parar)
java GerarTelemetria --modo loop --intervalo 30 --api http://localhost:8080/api/telemetria
```

Se usou a porta 8081 no passo 5, troque `8080` por `8081`. Depois, recarregue o navegador (F5).

### 8\. Tabela rápida de erros

|Mensagem|Causa|Solução|
|-|-|-|
|`release version 21 not supported`|Maven usando JDK antigo|Passo 4 (`JAVA\_HOME`)|
|`mvnw.cmd não é reconhecido`|PowerShell|Usar `.\\mvnw.cmd`|
|`autenticação ... falhou para o usuário "root"`|Usuário/perfil não configurados|Passo 3 e `-Dspring-boot.run.profiles=local`|
|`banco de dados "forjaoee" não existe`|Banco não criado|Passo 2|
|"frontend não foi encontrado"|Backend iniciado de outra pasta|Rodar de dentro de `aplicacao\\backend`|
|Abre outro sistema em `localhost:8080`|Porta ocupada por outra aplicação|Usar `--server.port=8081`|




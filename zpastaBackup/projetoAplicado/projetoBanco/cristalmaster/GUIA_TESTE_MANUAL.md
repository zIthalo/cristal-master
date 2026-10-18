# Guia de Teste Manual: Spring Boot + Banco de Dados

Roteiro para validar (e apresentar) que a aplicação sobe e conversa com o banco.

## 1. Pré-requisitos

| Item | Como conferir |
|------|---------------|
| JDK 21 | `java -version` (deve mostrar 21) |
| MySQL 8+ | `mysql --version` |
| Porta 8080 livre | nenhum outro serviço usando |

> Não precisa instalar Maven: o projeto traz o wrapper (`mvnw` / `mvnw.cmd`).

**Sem MySQL instalado?** Suba um com Docker:

```bash
docker run -d --name mysql-cristal -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=cristalmaster \
  -e MYSQL_USER=cristal \
  -e MYSQL_PASSWORD=troque_esta_senha \
  mysql:8
```

Com Docker, o banco e o usuário já são criados e você pode pular o passo 2.

## 2. Criar o banco

```bash
mysql -u root -p < docs/banco.sql
```

Confirme:

```sql
SHOW DATABASES LIKE 'cristalmaster';
```

## 3. Conferir a configuração

Arquivo `src/main/resources/application.properties`. Os padrões são:

- host `localhost`, porta `3306`, banco `cristalmaster`
- usuário `cristal`, senha `troque_esta_senha`

Se usou outra senha, defina a variável de ambiente antes de subir:

```bash
# Linux / macOS
export DB_PASSWORD=sua_senha

# Windows (PowerShell)
$env:DB_PASSWORD="sua_senha"
```

## 4. Subir a aplicação

```bash
# Linux / macOS
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

A primeira execução baixa as dependências (pode demorar). O sucesso aparece no console:

- `HikariPool-1 - Start completed.` → **conexão com o banco OK**
- `Tomcat started on port 8080`
- `Started CristalmasterApplication in X seconds`

## 5. Testar o endpoint de saúde

No navegador ou no terminal:

```bash
curl http://localhost:8080/health
```

Resposta esperada (HTTP 200):

```json
{
  "aplicacao": "cristalmaster",
  "horario": "2026-10-12T22:55:00.123",
  "banco": "UP",
  "produto": "MySQL",
  "catalogo": "cristalmaster"
}
```

## 5.1 Testar as rotas de dados

Na primeira execução o console mostra `Mock carregado: 5 lotes.`

```bash
# Lista em ordem FIFO (LT-2026-0003 aparece primeiro, entrada mais antiga)
curl http://localhost:8080/api/exemplo

# Consulta um lote
curl http://localhost:8080/api/exemplo/LT-2026-0001

# Lote inexistente -> 404
curl -i http://localhost:8080/api/exemplo/LT-9999

# Grava um novo lote -> 201
curl -i -X POST http://localhost:8080/api/dados \
  -H "Content-Type: application/json" \
  -d '{"codigo":"LT-2026-0006","produto":"Resina PET Cristal","quantidadeKg":1000,"dataEntrada":"2026-10-12","validade":"2027-10-12","fileira":"F06"}'

# Repetir o mesmo POST -> 409 (código duplicado)
# POST com "fileira":"F01" e outro código -> 409 (fileira ocupada)
# POST sem "produto" -> 400
```

No Windows PowerShell, prefira o Postman/Insomnia ou `Invoke-RestMethod`, pois o `curl` do PowerShell tem sintaxe diferente.

Para conferir no banco: `SELECT * FROM lote ORDER BY data_entrada;`

## 6. Teste negativo (ótimo para a apresentação)

1. Pare o MySQL (`docker stop mysql-cristal` ou pare o serviço).
2. Chame `curl http://localhost:8080/health` de novo.
3. Resposta esperada: HTTP **503** com `"banco": "DOWN"` e a mensagem de erro.
4. Reinicie o MySQL e chame de novo: volta para `UP`.

Isso mostra que o sistema detecta e informa a falha de conexão.

## 7. Teste automatizado

```bash
./mvnw test
```

O teste `CristalmasterApplicationTests.contextLoads` sobe o contexto completo, então **precisa do MySQL ligado**. Se o banco estiver parado, ele falha.

## 8. Problemas comuns

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `Access denied for user` | usuário/senha errados | conferir `DB_USER` / `DB_PASSWORD` e o `banco.sql` |
| `Unknown database 'cristalmaster'` | banco não criado | executar o passo 2 |
| `Communications link failure` | MySQL desligado ou porta errada | iniciar o MySQL, conferir `DB_HOST`/`DB_PORT` |
| `Port 8080 was already in use` | outra aplicação na porta | mudar `server.port` ou encerrar a outra |
| `release version 21 not supported` | JDK antigo | instalar JDK 21 |

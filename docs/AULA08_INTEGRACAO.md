# Aula 08: Integração ponta a ponta (Checkpoint 2)

Simulador → API Spring Boot → MySQL → tela do operador, tudo ao vivo.

```
 mock/simulador.ps1 ──POST /api/lotes, /api/saidas──▶  API Spring Boot (8080)  ──▶ MySQL
                                                              ▲
 Tela (index.html + app.js) ──GET a cada 3 s─────────────────┘
   /api/fifo/proximos · /api/lotes · /api/movimentacoes
```

## O que foi feito

| Item da aula | Onde | Como |
|---|---|---|
| 1. Consumo da API (GET e POST) | `static/js/app.js` | Nenhum dado fixo no código. A tela consulta `GET /api/fifo/proximos`, `GET /api/lotes` e `GET /api/movimentacoes` **a cada 3 s** (pausa com a aba escondida), com tempo-limite de 5 s por requisição, e envia `POST /api/saidas` ao confirmar. |
| 1. CORS no backend | `config/CorsConfig.java` | Libera `http://localhost:*` e `http://127.0.0.1:*` para GET/POST/PUT/DELETE/OPTIONS, headers abertos. Se a tela for aberta pelo Live Server (5500), Vite (5173) ou React (3000), o `app.js` aponta sozinho para `http://localhost:8080`. |
| 2. Carregando | `app.js` + `css/integracao.css` | "Carregando..." piscando na primeira consulta; "Atualizando..." no rodapé a cada ciclo. |
| 2. Erro de comunicação | `app.js` + `index.html` + `css/integracao.css` | Faixa **vermelha fixa** no topo com o motivo: API desligada/rede/CORS, erro 500 (provável banco fora) ou rota inexistente. Indicador "Servidor offline" e dados antigos **esmaecidos** (não somem). Ao voltar, a faixa some sozinha. Se o próprio `app.js` não carregar, o `index.html` mostra isso em vermelho em vez de ficar parado em "Conectando". |
| 3. Tela reagindo ao simulador | `app.js`, `MovimentacaoController.java`, `mock/simulador.ps1` | Seção **Movimentações ao vivo** (verde = saída, vermelho = bloqueio, com o motivo). Lote novo e movimentação nova piscam em amarelo e geram um aviso rápido no rodapé. |
| Diagnóstico do banco | `HealthController.java`, `application-xampp.properties` | `GET /health` testa a conexão com o MySQL (200 ou 503 com o motivo). Perfil `xampp` para rodar com o root sem senha sem mexer na senha da apresentação. |
| 4. Fechamento do Sprint 2 | `docs/AI_LOG.md` | Prompts 24 a 42 e a seção "Consolidação do Sprint 2 (Aulas 05 a 08)". |

## Arquivos da Aula 08

| Arquivo | Situação |
|---|---|
| `src/main/java/br/com/cristalmaster/config/CorsConfig.java` | novo |
| `src/main/java/br/com/cristalmaster/controllers/MovimentacaoController.java` | novo (`GET /api/movimentacoes`) |
| `src/main/java/br/com/cristalmaster/controllers/HealthController.java` | alterado (`/health` testa o banco) |
| `src/main/resources/application-xampp.properties` | novo (perfil com root sem senha) |
| `src/main/resources/static/js/app.js` | alterado |
| `src/main/resources/static/index.html` | alterado |
| `src/main/resources/static/css/integracao.css` | novo (o `estilo.css` não muda) |
| `src/main/resources/static/sw.js` | alterado (cache `v3` com o CSS novo) |
| `mock/simulador.ps1` | novo |
| `README.md`, `docs/TESTES_API.md`, `docs/AI_LOG.md` | atualizados |

## Roteiro da demonstração

1. **MySQL ligado:** XAMPP → **Start** no módulo **MySQL** (fica verde, porta 3306).
2. **API**, num PowerShell na pasta do projeto:
   - Banco da apresentação (senha `senai`): `\.mvnw.cmd spring-boot:run`
   - XAMPP com root sem senha: `\.mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=xampp"`

   Espere `Started CristalmasterApplication`. Dica: com o polling, `spring.jpa.show-sql=true` enche o console; deixe `false` durante a apresentação se quiser mostrar os logs.
3. **Confira o banco:** `http://localhost:8080/health` → `Sistema OK - banco de dados conectado`.
4. **Dados iniciais (banco limpo):** `powershell -ExecutionPolicy Bypass -File docs\carregar-demo.ps1`
5. **Tela:** `http://localhost:8080/` (se já estava aberta, **Ctrl + Shift + R**).
6. **Simulador em segundo plano**, em outro PowerShell:
   `powershell -ExecutionPolicy Bypass -File mock\simulador.ps1` (opcional: `-Intervalo 6` para ir mais devagar)
7. **Mostrar lado a lado** (terminal do simulador + navegador):
   - **ENTRADA** → lote novo piscando no "Estoque em ordem FIFO" + aviso azul.
   - **SAIDA OK** → movimentação verde; o saldo do lote cai.
   - **FORA DO FIFO** → movimentação vermelha "Bloqueada" com o lote esperado + aviso vermelho.
   - **LOTE VENCIDO** e **ACIMA SALDO** → bloqueios registrados com o motivo.
8. **Erro de comunicação:** pare a API (Ctrl + C). Em até 3 s aparece a faixa vermelha e "Servidor offline"; o simulador mostra `API FORA`. Suba a API de novo: tudo volta sozinho.
9. **Erro de banco (opcional):** com a API no ar, pare o MySQL no XAMPP. `/health` responde 503 e a tela avisa que o provável problema é o banco.
10. **CORS (opcional):** abra o `index.html` pelo Live Server do VS Code (porta 5500): a tela funciona porque o `CorsConfig` libera a origem. Prova:
    ```
    curl.exe -i -X OPTIONS http://localhost:8080/api/saidas -H "Origin: http://localhost:5500" -H "Access-Control-Request-Method: POST"
    ```
    A resposta deve ter `Access-Control-Allow-Origin: http://localhost:5500`.

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| A API não sobe; no terminal: `Access denied for user 'root'@'localhost' (using password: YES)` | XAMPP com root sem senha e o `application.properties` com `senai` | Subir com o perfil `xampp` (passo 2) |
| A API não sobe; `Communications link failure` | MySQL desligado | XAMPP → Start no MySQL |
| `release version 21 not supported` | Maven rodando com JDK antigo | Apontar `JAVA_HOME` para o JDK 21+ (`\.mvnw.cmd -version`) |
| `Port 8080 was already in use` | Outra instância da API aberta | Fechar o outro terminal ou encerrar o processo `java` |
| Tela parada em "Conectando", botão Atualizar sem efeito | `app.js` antigo ou não carregado | Conferir `static/js/app.js`, reiniciar a API, Ctrl + Shift + R; o `index.html` novo mostra o motivo em vermelho |
| Alterei o CSS/JS e a tela não muda | API servindo a cópia antiga de `target/` ou cache do navegador | Reiniciar a API **uma vez** depois de aplicar o `application.properties` novo; a partir daí basta F5 (se não mudar, Ctrl + Shift + R). Se o seletor também existe no `integracao.css`, vale o dele (é carregado depois) |
| O script `.ps1` não roda ("execução de scripts desabilitada") | Política do Windows | Usar `powershell -ExecutionPolicy Bypass -File ...` |
| `fileira já está ocupada` ao rodar o `carregar-demo.ps1` | Banco com dados de outro teste | Apagar o banco (ver `docs/TESTES_API.md`, "Antes de começar") |

## Testes feitos pela IA

- `app.js` executado contra uma API simulada (DOM mínimo em Node), 4 cenários: primeira carga; chegada de lote novo e de tentativa bloqueada (destaque + aviso); queda da API (faixa vermelha, dados mantidos e esmaecidos); retorno da API (faixa some). Todos passaram.
- `CorsConfig`, `MovimentacaoController`, `HealthController`, `Movimentacao` e `MovimentacaoRepository` compilados com `javac` contra versões mínimas das classes do Spring usadas (sem erros).
- **Não executado pela IA:** o projeto com Maven (o repositório Maven é bloqueado no ambiente dela), o MySQL e o `simulador.ps1` (sem PowerShell). A validação real é o roteiro acima.

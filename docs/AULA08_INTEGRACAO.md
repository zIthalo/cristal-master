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
| 1. Consumo da API | `static/js/app.js` | A tela já usava `fetch`. Agora consulta a API **a cada 3 s** (polling), com tempo-limite de 5 s por requisição, e lê também a nova rota `GET /api/movimentacoes`. Nenhum dado fixo no código. |
| 1. CORS | `config/CorsConfig.java` | Libera `http://localhost:*` e `http://127.0.0.1:*` para GET/POST/PUT/DELETE/OPTIONS, headers abertos. Se a tela for aberta pelo Live Server (5500), Vite (5173) ou React (3000), o `app.js` aponta sozinho para `http://localhost:8080`. |
| 2. Carregando | `app.js` + `css/integracao.css` | "Carregando..." piscando na primeira consulta; "Atualizando..." no rodapé a cada ciclo. |
| 2. Erro de comunicação | `app.js` + `css/integracao.css` | Faixa **vermelha fixa** no topo ("Sem comunicação com a API..."), indicador "Servidor offline", dados antigos **esmaecidos** (não somem). Ao voltar, a faixa some sozinha. |
| 3. Tela reagindo | `app.js`, `MovimentacaoController.java`, `mock/simulador.ps1` | Seção **Movimentações ao vivo** (verde = saída, vermelho = bloqueio). Lote novo e movimentação nova piscam em amarelo e geram um aviso rápido no rodapé. |

## Arquivos

| Arquivo | Situação |
|---|---|
| `src/main/java/br/com/cristalmaster/config/CorsConfig.java` | novo |
| `src/main/java/br/com/cristalmaster/controllers/MovimentacaoController.java` | novo |
| `src/main/java/br/com/cristalmaster/repositories/MovimentacaoRepository.java` | **só se ainda não existir** |
| `src/main/resources/static/js/app.js` | substitui o atual |
| `src/main/resources/static/index.html` | substitui o atual |
| `src/main/resources/static/css/integracao.css` | novo (o `estilo.css` não muda) |
| `src/main/resources/static/sw.js` | substitui o atual (cache v2 com o CSS novo) |
| `mock/simulador.ps1` | novo |

## Roteiro do teste ponta a ponta (para a apresentação)

1. **MySQL ligado** (XAMPP → Start no MySQL).
2. **API:** `mvnw.cmd spring-boot:run`. Dica: para o console não virar enxurrada de SQL com o polling, deixe `spring.jpa.show-sql=false` no `application.properties` durante a apresentação.
3. **Dados iniciais (banco limpo):** `powershell -ExecutionPolicy Bypass -File docs\carregar-demo.ps1`
4. **Tela:** abra `http://localhost:8080/` (se a tela já estava aberta, um **Ctrl + Shift + R** garante a versão nova).
5. **Simulador em segundo plano**, em outro terminal:
   `powershell -ExecutionPolicy Bypass -File mock\simulador.ps1`
   (opcional: `-Intervalo 6` para ficar mais devagar)
6. **Mostrar, lado a lado (terminal do simulador + navegador):**
   - **ENTRADA** no terminal → lote novo aparece piscando no "Estoque em ordem FIFO" + aviso azul.
   - **SAIDA OK** → movimentação verde; o saldo do lote cai.
   - **FORA DO FIFO** → movimentação vermelha "Bloqueada" com o motivo + aviso vermelho.
   - **LOTE VENCIDO** e **ACIMA SALDO** → bloqueios registrados.
7. **Erro de comunicação:** pare a API (Ctrl + C no terminal dela). Em até 3 s aparece a faixa vermelha e "Servidor offline"; o simulador mostra `API FORA`. Suba a API de novo: tudo volta sozinho.
8. **CORS (opcional):** abra o `index.html` pelo Live Server do VS Code (porta 5500). A tela funciona porque o `CorsConfig` libera a origem. Prova no terminal:
   ```
   curl.exe -i -X OPTIONS http://localhost:8080/api/saidas -H "Origin: http://localhost:5500" -H "Access-Control-Request-Method: POST"
   ```
   A resposta deve ter `Access-Control-Allow-Origin: http://localhost:5500`.

## Testes feitos

- `app.js` executado contra uma API simulada (DOM mínimo em Node): primeira carga, chegada de lote novo e de tentativa bloqueada (destaque + aviso), queda da API (faixa vermelha, dados mantidos e esmaecidos) e retorno da API (faixa some). Os quatro passaram.
- Ainda **não** testado em navegador real com o Spring rodando, nem o `simulador.ps1` no Windows: conferir no roteiro acima.

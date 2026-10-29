<!--
COLE ESTE TRECHO NO FINAL DO docs/AI_LOG.md.
Os itens marcados com [PREENCHER] dependem do que você realmente usou nas Aulas 05 a 07.
Não invente prompts: copie do histórico do chat que você usou em cada aula.
-->

## Sprint 2: fechamento (Aulas 05 a 08)

### Principais prompts do Sprint 2

| Aula | Objetivo | Prompt usado (resumo) | Resultado |
|---|---|---|---|
| 05 | [PREENCHER: ex. regra FIFO na saída / EstoqueService] | [PREENCHER] | [PREENCHER] |
| 06 | [PREENCHER: ex. validação de payload e códigos HTTP 400/404/422] | [PREENCHER] | [PREENCHER] |
| 07 | [PREENCHER: ex. tela operacional PWA com cartões verde/vermelho/amarelo] | [PREENCHER] | [PREENCHER] |
| 08 | Integração ponta a ponta: CORS, polling, loading/erro e simulador | "Preciso aprontar a Aula 08 (integração ponta a ponta e checkpoint 2). Tenho o projeto em andamento." + envio do README, `index.html`, `app.js`, `application.properties` e `carregar-demo.ps1`. | `CorsConfig`, rota `GET /api/movimentacoes`, `app.js` com polling, faixa de erro e "Movimentações ao vivo", e `mock/simulador.ps1`. |

### Onde a IA errou ou precisou de correção na integração front ↔ back

1. **Prompt de exemplo fora da nossa stack.** Os prompts modelo da aula falam em FastAPI/Express e porta 3000/5173. Nosso backend é Spring Boot na 8080, com a tela servida pelo próprio Spring (mesma origem, o navegador nem aplica CORS). Foi preciso explicar a stack para a IA não gerar middleware de outra tecnologia.
2. **CORS incompleto na primeira sugestão.** O primeiro `CorsConfig` sugerido liberava só `/api/**` e portas fixas com `allowedOrigins`. As rotas `/produtos` e `/health` ficavam de fora. Trocamos para `addMapping("/**")` com `allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*")`.
3. **Bug no filtro do simulador (PowerShell).** Na primeira versão do `simulador.ps1`, o filtro para achar um lote "fora do FIFO" usava `$_` dentro de outro `Where-Object` (`$_.produto -eq $_.produto`), que compara o lote com ele mesmo e é sempre verdadeiro. Removido na revisão.
4. **Mock antigo que ninguém lia.** O `mock/dados-mock.json` (Sprint 1) estava num formato que a API não aceita e não era lido pela aplicação, então não servia para "deixar o mock rodando". Foi substituído por um simulador que usa a API real.
5. **Tela depende do texto da mensagem de erro.** O `app.js` (Aula 07) identifica "FIFO violado" e "Lote vencido" pelo começo do texto da mensagem da API. Se alguém mudar a frase no `EstoqueService`, a tela mostra o cartão errado. Melhoria futura: a API devolver um campo `codigo` (ex.: `FIFO_VIOLADO`).
6. **Teste só com API simulada.** A IA testou a tela contra uma API falsa, não no navegador com o Spring rodando. A validação real foi feita por nós no roteiro de `docs/AULA08_INTEGRACAO.md`.
7. [PREENCHER: algo que deu errado quando vocês rodaram de verdade. Ex.: porta 8080 ocupada, `ExecutionPolicy` bloqueando o script, senha do MySQL diferente.]

### O que ajustamos "no braço"

- [PREENCHER: o que vocês corrigiram manualmente ao testar.]

### Aula 08: registro prompt a prompt (29/10/2026)

Ferramenta: Claude (claude.ai). Cada linha é uma mensagem enviada à IA e o que ela respondeu ou fez.

| # | Hora | Prompt enviado | O que a IA fez | Observação / correção |
|---|---|---|---|---|
| 1 | 19:10 | Colei as "Orientações para a Aula 08" (consumo da API, CORS, loading/erro, teste com simulador, fechamento no AI_LOG) + "preciso aprontar esta tarefa. tenho o projeto em andamento" | Verificou que nenhum arquivo tinha sido anexado e pediu o projeto (ZIP) e a stack (backend, frontend, simulador). | Os prompts modelo da aula eram para FastAPI/Express; nossa stack é outra. |
| 2 | 19:10 | Print do Explorer do VS Code com a pasta `cristal-master` | Identificou Spring Boot/Maven pelo `pom.xml` e `mvnw`, pediu o ZIP e já sugeriu uma classe `CorsConfig`. | Essa primeira versão do CORS liberava só `/api/**` com portas fixas; foi corrigida depois (ver item 2 dos erros). |
| 3 | 19:11 | "Peça para mim mostrar as pastas necessárias. vou lhe mandar o readme" | Listou quais pastas expandir, quais arquivos colar (controllers, `application.properties`, tela, mock, AI_LOG) e quais não mandar. | — |
| 4 | 19:11 | Enviei o `README.md` | Concluiu que a tela já é servida pelo Spring (mesma origem), que já consome a API, que o mock não é lido por ninguém e que falta uma rota para ver as tentativas bloqueadas. Propôs simulador + polling + `GET /api/movimentacoes`. | — |
| 5 | 19:13 | Enviei o `index.html` | Aproveitou o `#conexao` e o `#atualizado` já existentes e planejou a seção "Movimentações ao vivo" e a faixa vermelha de erro. Pediu o `app.js`. | — |
| 6 | 19:15 | Enviei o `application.properties` | Confirmou a porta 8080 e alertou que `spring.jpa.show-sql=true` vai encher o console com o polling. | Sugestão: `show-sql=false` na apresentação. |
| 7 | 19:15 | "Que mais você precisa" | Listou os arquivos em ordem de prioridade (`app.js` primeiro). | — |
| 8 | 19:16 | Enviei o `app.js` | Gerou o pacote: `app.js` (polling a cada 3 s, tempo-limite, loading, faixa de erro, movimentações ao vivo, avisos), `index.html`, `css/integracao.css`, `CorsConfig.java`, `MovimentacaoController.java` e `mock/simulador.ps1`. Testou o `app.js` contra uma API simulada (4 cenários). | Teste só com API falsa; validação real é nossa. |
| 9 | 19:19 | "Se precisar de mais arquivos para eu lhe mandar, me informe antes de eu anexar os arquivos no código" | Pediu `docs/carregar-demo.ps1` (nomes dos campos do lote) e `static/sw.js` (cache). | A IA tinha *chutado* os nomes dos campos no simulador; pediu o arquivo para confirmar. |
| 10 | 19:20 | Enviei o `carregar-demo.ps1` | Confirmou os campos (`codigoQr`, `produto`, `fileira`, `quantidade`, `dataEntrada`, `validade`), trocou os produtos do simulador pelos da demo e corrigiu o filtro de "lote fora do FIFO". | Bug do `$_` no `Where-Object` (item 3 dos erros). |
| 11 | 19:22 | Enviei o `sw.js` | Viu que o service worker já busca da rede primeiro e ignora `/api/`; só incluiu o `integracao.css` e mudou o cache para `v2`. Entregou o ZIP `aula08-integracao.zip`. | — |
| 12 | 19:24 | "onde eu acho repositories" | Indicou o caminho `src/main/java/br/com/cristalmaster/repositories/` e o atalho Ctrl + P. | — |
| 13 | 19:24 | Print da pasta `repositories` | Viu que o `MovimentacaoRepository` já existe e mandou **não** copiar o do pacote. | — |
| 14 | 19:25 | Enviei o `MovimentacaoRepository.java` | Confirmou que estende `JpaRepository<Movimentacao, Long>` (o controller novo funciona sem mudança) e passou a tabela de onde copiar cada arquivo. | — |
| 15 | 19:39 | "Todo prompt que você recebeu e que receberá, você deve preencher o arquivo AI_LOG.md" | Montou esta tabela com todos os prompts da conversa e passou a registrar cada novo prompt. | — |

# Cristal Master: Controle de Estoque do Almoxarifado

PWA mobile para o almoxarifado da Cristal Master (resinas e aditivos). O operador abre o app direto no celular, sem instalar nada de loja, e usa a câmera para ler os QR Codes dos lotes.

## Problema

1. **FIFO quebrado.** Pallets de resina (~1.000 kg) ficam em fileiras profundas no chão. Com pressa, o operador da empilhadeira pega o pallet mais fácil (o da frente, mais novo) e os antigos ficam no fundo até vencerem.
2. **Saldo do sistema diferente do real.** As movimentações são anotadas em fichas de papel e digitadas no ERP só no fim do turno, o que gera os "furos de estoque".

## Solução

- O app indica **qual lote e qual posição do piso devem sair primeiro**, antes de o operador pegar o material.
- O operador lê o **QR Code do lote**. Se for o lote errado (fora de ordem, vencido ou com quantidade acima do saldo), o sistema **bloqueia e registra a tentativa**.
- Toda movimentação é **gravada na hora**, sem ficha de papel e sem digitação em lote.
- Cada fileira do piso recebe um código (ex.: `F01`) e **um único lote por vez**, sinalizado com fita ou tinta no chão. Não há gasto com estrutura física (porta-pallets).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Java 21, Spring Boot 4.1.1 (Web MVC, Spring Data JPA) |
| Banco | MySQL 8 |
| Build | Maven (wrapper incluso) |
| Utilitários | Lombok |
| Frontend | PWA mobile com leitura de QR Code pela câmera (a desenvolver) |

## Estrutura do projeto

```
cristalmaster/
├── pom.xml
├── mvnw / mvnw.cmd              # Maven Wrapper
├── .mvn/wrapper/maven-wrapper.properties
├── dados-mock.json              # lotes de exemplo (cópia em src/main/resources/)
├── AI_LOG.md                    # registro dos prompts enviados à IA
├── docs/
│   ├── banco.sql                # criação do banco e do usuário
│   └── GUIA_TESTE_MANUAL.md     # roteiro de teste/apresentação
└── src/
    ├── main/
    │   ├── java/br/com/cristalmaster/
    │   │   ├── CristalmasterApplication.java
    │   │   ├── controller/   (HealthController, LoteController)
    │   │   ├── model/        (Lote)
    │   │   ├── repository/   (LoteRepository)
    │   │   └── config/       (MockDataLoader)
    │   └── resources/
    │       ├── application.properties
    │       └── dados-mock.json
    └── test/java/br/com/cristalmaster/CristalmasterApplicationTests.java
```

## Como executar

1. Ter **JDK 21** e **MySQL 8** (ou Docker).
2. Criar o banco: `mysql -u root -p < docs/banco.sql`
3. (Opcional) Definir variáveis de ambiente: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
4. Subir: `./mvnw spring-boot:run` (Windows: `mvnw.cmd spring-boot:run`)
5. Verificar: `GET http://localhost:8080/health` deve responder `"banco": "UP"`.
6. Na primeira execução, os 5 lotes de `dados-mock.json` são gravados na tabela `lote`.

Passo a passo completo, incluindo o teste negativo para apresentação, em [`docs/GUIA_TESTE_MANUAL.md`](docs/GUIA_TESTE_MANUAL.md).

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` (alias `/api/health`) | Testa ativamente o banco e retorna o status real (200 `UP` / 503 `DOWN`) |
| GET | `/api/exemplo` | Lista os lotes em ordem FIFO (mais antigo primeiro) |
| GET | `/api/exemplo/{codigo}` | Consulta um lote pelo código do QR Code |
| POST | `/api/dados` | Grava um lote (400 se inválido; 409 se código duplicado ou fileira ocupada) |

## Status e próximos passos

- [x] Projeto Spring Boot criado (Spring Initializr)
- [x] Conexão com MySQL configurada
- [x] Endpoint de health check (`/health`)
- [x] Primeira rota de dados com mock (`/api/exemplo`, `/api/dados`)
- [x] Sprint 1 consolidado no `AI_LOG.md`
- [ ] Validar o Sprint 1 em execução real (compilar e testar as rotas)
- [ ] Modelagem das demais entidades: Produto, Fileira/Posição, Movimentação, Tentativa Bloqueada
- [ ] Regra FIFO/FEFO: sugerir lote e posição de saída
- [ ] Validação da leitura de QR Code (ordem, validade, saldo) com bloqueio e registro
- [ ] Registro de movimentações em tempo real (entrada, saída, ajuste)
- [ ] Carga inicial a partir de `dados-mock.json`
- [ ] Frontend PWA (manifest, service worker, leitura de QR pela câmera)
Status do Projeto
Sprint 1 - Fundação Técnica ✅
Configuração do ambiente Spring Boot
Integração com MySQL
Estrutura de pastas organizada
Criação das entidades do sistema
Criação automática de tabelas via Hibernate
Endpoint de health check
Endpoint de exemplo da API
Mock industrial para simulação de dados
Sprint 2 - Regra de Negócio ✅
Implementação da primeira versão da regra FIFO (First In, First Out), responsável por validar se o lote selecionado para saída corresponde ao lote esperado pelo sistema.

Estrutura do Banco
As tabelas atualmente modeladas são:

produtos
lotes
movimentacoes
perfis
Regra FIFO Implementada
A classe FifoService contém a primeira implementação da lógica de validação FIFO.

Cenário Normal
Entrada:

Lote Esperado: LOT001
Lote Selecionado: LOT001
Resultado:

FIFO OK
Cenário de Anomalia
Entrada:

Lote Esperado: LOT001
Lote Selecionado: LOT005
Resultado:

FIFO VIOLADO
Cenário de Erro
Entrada:

Lote Esperado: null
Lote Selecionado: LOT001
Resultado:

Erro: lote inválido
Estrutura Atual do Projeto
src/main/java/br/com/cristalmaster
├── controllers
├── models
├── repositories
├── routes
├── services
│   ├── FifoService.java
│   └── FifoTeste.java
├── config
└── CristalmasterApplication.java
Próximos Passos
Implementar repositories das entidades.
Integrar a regra FIFO aos endpoints da API.
Ler os dados do mock industrial diretamente pela aplicação.
Desenvolver a interface PWA.
Implementar leitura de QR Code. ``


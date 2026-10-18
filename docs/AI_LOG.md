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
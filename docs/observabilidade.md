# Observabilidade no projeto Plataforma de Cursos

Este documento explica, em linguagem simples, a primeira implementação de
observabilidade do backend. Ele parte do zero: primeiro apresenta os conceitos
e depois explica cada arquivo, propriedade, função, header e etapa do fluxo.

## 1. O que é observabilidade?

Observabilidade é a capacidade de entender o que está acontecendo dentro de
uma aplicação por meio dos sinais produzidos por ela.

Uma analogia é o painel de um carro. Não precisamos desmontar o motor para
saber a velocidade, a temperatura ou a quantidade de combustível. O painel
mostra sinais sobre o funcionamento do carro.

Na aplicação, os sinais principais são:

```text
Aplicação
├── logs: eventos específicos que aconteceram
├── métricas: números acompanhados ao longo do tempo
└── traces: caminho de uma operação pelas diferentes etapas
```

Um dashboard organiza esses dados visualmente.

### Logs

Um log registra um acontecimento específico:

```text
"A requisição req-123 terminou com status 200."
"A criação do usuário falhou porque o banco não respondeu."
```

Níveis mais comuns:

```text
info  -> operação normal
warn  -> situação anormal que merece atenção
error -> alguma operação falhou
```

No Pino, esses níveis também aparecem como números:

```text
30 -> info
40 -> warn
50 -> error
```

### Métricas

Uma métrica é um número acompanhado ao longo do tempo:

```text
Quantidade de requisições: 1.250
Taxa de erros: 2%
Latência média: 180 ms
Latência p95: 900 ms
```

Logs e métricas são complementares:

```text
Métrica -> "5% das requisições falharam."
Log     -> "A requisição req-123 falhou por timeout no banco."
```

### Latência, throughput e taxa de erro

- **Latência:** quanto tempo uma requisição demora.
- **Throughput:** quantas requisições são processadas em determinado período.
- **Taxa de erro:** qual proporção das requisições falhou.

### Média e p95

A média é a soma das durações dividida pela quantidade de requisições. Ela pode
esconder casos muito lentos.

Se o p95 é 900 ms, significa que aproximadamente 95% das requisições terminaram
em até 900 ms. Os 5% restantes demoraram mais.

### Dashboard

Um dashboard apresenta os dados em gráficos e painéis. Neste projeto, o
Prometheus já coleta e armazena as métricas. O Grafana, que será adicionado
depois, poderá consultar o Prometheus e apresentar os gráficos.

### Tracing

Tracing acompanha uma operação pelas diferentes etapas:

```text
Frontend -> API -> Controller -> Use Case -> Repository -> PostgreSQL
```

Exemplo:

```text
Tempo total: 1.200 ms
├── Controller: 10 ms
├── Use Case: 40 ms
└── PostgreSQL: 1.150 ms
```

Tracing ainda não foi implementado no projeto.

## 2. O que foi implementado?

Até este ponto, o projeto possui:

```text
Logs estruturados com Pino                  OK
Logs automáticos das requisições HTTP       OK
Request ID                                  OK
Redaction de campos sensíveis no Pino        OK
Remoção de console.log sensível no auth      Pendente
Contador de requisições                     OK
Histograma de duração                       OK
Métricas automáticas do Node.js             OK
Endpoint GET /metrics                       OK
Prometheus coletando as métricas            OK
Consultas PromQL                            OK
Grafana                                     Ainda não
Centralização de logs com Loki ou ELK        Ainda não
Tracing com OpenTelemetry                    Ainda não
```

## 3. Bibliotecas instaladas

No backend foram instalados três pacotes:

```bash
npm install pino pino-http @prometheus-io/client
```

### `pino`

Cria logs estruturados em JSON.

### `pino-http`

Integra o Pino com o ciclo de requisição e resposta do Express. Ele consegue
registrar método, URL, status, duração e um identificador da requisição.

### `@prometheus-io/client`

É o cliente oficial atual do Prometheus para Node.js. Tutoriais antigos podem
usar o nome `prom-client`, que era o nome anterior do pacote.

Ele permite criar métricas como:

- `Counter`: contador que aumenta;
- `Gauge`: valor que pode aumentar ou diminuir;
- `Histogram`: distribuição de valores em faixas;
- `Registry`: registro central que guarda as métricas.

Nesta implementação usamos `Counter`, `Histogram` e `Registry`.

## 4. Visão geral do fluxo

### Fluxo de uma requisição

```text
Navegador ou frontend
        |
        | HTTP GET/POST/PUT/DELETE
        v
Express recebe a requisição
        |
        v
express.json()
interpreta o JSON do body
        |
        v
httpLogger
cria ou reutiliza o request ID
        |
        v
metricsMiddleware
marca o horário inicial
        |
        v
AuthMiddleware, quando aplicável
valida o JWT
        |
        v
Route
escolhe o Controller
        |
        v
Controller
converte HTTP em chamada da aplicação
        |
        v
Use Case
executa a regra de negócio
        |
        v
Repository -> Prisma -> PostgreSQL
        |
        v
Controller produz a resposta HTTP
        |
        v
evento "finish" da resposta
        |
        +--> Pino conclui o log HTTP
        |
        +--> Counter aumenta
        |
        +--> Histogram recebe a duração
```

### Fluxo da coleta

```text
Aplicação Express
mantém métricas na memória
        |
        v
GET /metrics
expõe uma representação textual
        ^
        | consulta a cada 5 segundos
        |
Prometheus
armazena o histórico
        |
        v
PromQL
consulta e calcula taxas, médias e percentis
```

A aplicação não envia as métricas para o Prometheus. O Prometheus consulta o
endpoint `/metrics` periodicamente. Esse processo é chamado de **scrape**.

## 5. Logs estruturados

Arquivo: `backend/src/observability/logger.ts`

```ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',

  redact: {
    paths: [
      'senha',
      'token',
      'req.body.senha',
      'req.headers.authorization',
    ],
    remove: true,
  },
});
```

### `pino(...)`

Cria uma instância do logger. Essa instância é exportada para que toda a
aplicação possa usar a mesma configuração.

### `level`

```ts
level: process.env.LOG_LEVEL ?? 'info'
```

Primeiro tenta ler a variável de ambiente `LOG_LEVEL`. Se ela não existir, usa
`info`.

Com nível `info`, o logger registra `info`, `warn` e `error`. Logs abaixo desse
nível, como `debug`, não são registrados.

### `redact`

`redact` protege propriedades sensíveis. As `paths` não são caminhos de
arquivos; são caminhos até propriedades dentro do objeto que seria registrado.

Exemplo de objeto:

```ts
{
  req: {
    body: {
      email: 'ana@email.com',
      senha: 'segredo',
    },
  },
}
```

O caminho até a senha é:

```text
req -> body -> senha
```

Por isso a configuração usa:

```ts
'req.body.senha'
```

Significado de cada caminho:

```text
senha                    -> propriedade senha na raiz
token                    -> propriedade token na raiz
req.body.senha           -> senha no body da requisição
req.headers.authorization -> JWT no header Authorization
```

### `remove: true`

Remove totalmente a propriedade do log. Sem essa opção, uma configuração de
redaction poderia substituir o valor por uma indicação como `[Redacted]`.

Essa proteção vale para dados que passam pelo Pino. Um `console.log(token)`
ignora completamente essa configuração. Por isso tokens e senhas nunca devem
ser registrados com `console.log`.

## 6. Middleware HTTP e request ID

Arquivo: `backend/src/middlewares/http-logger.ts`

```ts
import { randomUUID } from 'node:crypto';
import pinoHttp from 'pino-http';

import { logger } from '@/observability/logger';

export const httpLogger = pinoHttp({
  logger,

  genReqId(req, res) {
    const receivedId = req.headers['x-request-id'];

    const requestId =
      typeof receivedId === 'string'
        ? receivedId
        : randomUUID();

    res.setHeader('x-request-id', requestId);

    return requestId;
  },

  customLogLevel(_req, res, error) {
    if (error || res.statusCode >= 500) {
      return 'error';
    }

    if (res.statusCode >= 400) {
      return 'warn';
    }

    return 'info';
  },
});
```

### O que é middleware?

Middleware é uma função executada no caminho entre a chegada da requisição e o
Controller.

```text
Requisição -> middleware A -> middleware B -> Controller -> resposta
```

Ele pode executar alguma ação e depois chamar `next()` para liberar a
requisição. O `pino-http` administra esse ciclo internamente.

### O que é request ID?

O request ID identifica uma única requisição HTTP. Ele não identifica o
usuário.

```text
userId    -> identifica a pessoa
requestId -> identifica uma chamada HTTP
JWT       -> autentica e pode carregar dados do usuário
traceId   -> acompanha uma operação por vários serviços
```

A mesma pessoa recebe um request ID diferente para cada chamada:

```text
Ana faz login       -> request ID A
Ana lista cursos    -> request ID B
Ana cria um curso   -> request ID C
```

O request ID permite reunir os logs da mesma operação:

```text
req-123 -> recebeu POST /cursos
req-123 -> executou o Use Case
req-123 -> consultou o banco
req-123 -> terminou com status 500
```

### `randomUUID`

É uma função nativa do Node.js que cria um identificador aleatório, como:

```text
aecc8789-1b7b-411c-a08d-df318a51f693
```

### `logger`

```ts
logger,
```

Entrega ao `pino-http` a instância do Pino que já possui nível e redaction
configurados.

### `genReqId(req, res)`

É chamada quando uma requisição chega ao middleware.

- `req` representa a requisição recebida;
- `res` representa a resposta que será enviada.

### `req.headers['x-request-id']`

Headers são metadados enviados junto com uma mensagem HTTP.

O navegador cria automaticamente vários headers HTTP comuns, mas normalmente
não cria `x-request-id`. Esse header pode ter sido enviado por um frontend, API
Gateway, proxy ou outro serviço.

```ts
const receivedId = req.headers['x-request-id'];
```

Essa linha apenas procura o header na requisição recebida. Ela não cria nada.

### Escolha entre reutilizar e criar

```ts
const requestId =
  typeof receivedId === 'string'
    ? receivedId
    : randomUUID();
```

O operador ternário significa:

```text
O request ID recebido é uma string?
├── sim -> reutiliza
└── não -> cria um UUID
```

### `res.setHeader(...)`

```ts
res.setHeader('x-request-id', requestId);
```

Adiciona o request ID ao header da **resposta**. O cliente receberá algo como:

```http
HTTP/1.1 200 OK
x-request-id: aecc8789-1b7b-411c-a08d-df318a51f693
Content-Type: application/json
```

Essa linha não adiciona o valor ao header da requisição original, que já
chegou. Ela adiciona o valor à resposta.

### `return requestId`

Entrega o identificador ao `pino-http`. O Pino passa a incluir esse valor nos
logs como `reqId`.

Se essa aplicação chamar outro serviço e quiser manter a correlação, será
necessário enviar manualmente o mesmo valor como `x-request-id` na nova chamada.

### `customLogLevel`

Escolhe o nível do log depois que a resposta termina:

```text
status 200-399 -> info
status 400-499 -> warn
status 500+    -> error
erro recebido  -> error
```

Parâmetros:

- `_req`: requisição; o `_` indica que não é usada nessa função;
- `res`: resposta, usada para ler `statusCode`;
- `error`: erro associado à requisição, se existir.

O retorno é uma string (`info`, `warn` ou `error`) que informa ao Pino qual
nível usar.

## 7. Declaração das métricas

Arquivo: `backend/src/observability/metrics.ts`

```ts
import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from '@prometheus-io/client';

export const metricsRegistry = new Registry();

collectDefaultMetrics({
  register: metricsRegistry,
  prefix: 'course_platform_',
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Quantidade total de requisições HTTP',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});
```

### `Registry`

```ts
export const metricsRegistry = new Registry();
```

É o registro central das métricas. Pense nele como uma caixa:

```text
metricsRegistry
├── métricas automáticas do Node.js
├── http_requests_total
└── http_request_duration_seconds
```

O objeto é exportado porque o `server.ts` precisa consultá-lo para responder em
`GET /metrics`.

### `collectDefaultMetrics`

```ts
collectDefaultMetrics({
  register: metricsRegistry,
  prefix: 'course_platform_',
});
```

Configura a coleta de métricas automáticas do processo Node.js, como CPU,
memória, event loop e garbage collection.

Propriedades:

- `register`: informa em qual Registry guardar as métricas;
- `prefix`: adiciona um prefixo aos nomes para identificar a aplicação.

Exemplo de métrica gerada:

```text
course_platform_process_resident_memory_bytes
```

### `Counter`

Counter é um contador que normalmente só aumenta.

```text
0 -> 1 -> 2 -> 3
```

Configuração:

```ts
new Counter({
  name: 'http_requests_total',
  help: 'Quantidade total de requisições HTTP',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});
```

Propriedades:

- `name`: nome técnico usado no Prometheus e no PromQL;
- `help`: descrição humana da métrica;
- `labelNames`: dimensões usadas para separar as séries;
- `registers`: registries que receberão a métrica.

Labels utilizadas:

```text
method      -> GET, POST, PUT ou DELETE
route       -> /health, /usuarios ou /login
status_code -> 200, 201, 400 ou 500
```

Cada combinação forma uma série diferente:

```text
GET  /health   200 -> uma série
GET  /usuarios 200 -> outra série
POST /usuarios 201 -> outra série
POST /usuarios 500 -> outra série
```

Não se deve usar `requestId`, `userId` ou URL com IDs individuais como label.
Isso criaria séries demais, problema conhecido como alta cardinalidade.

### `Histogram`

Histogram registra uma distribuição de valores. Nesta implementação, os
valores são durações em segundos.

```ts
buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5]
```

Esses buckets são faixas cumulativas:

```text
le="0.05" -> duração menor ou igual a 50 ms
le="0.1"  -> duração menor ou igual a 100 ms
le="0.3"  -> duração menor ou igual a 300 ms
le="0.5"  -> duração menor ou igual a 500 ms
le="1"    -> duração menor ou igual a 1 segundo
le="2"    -> duração menor ou igual a 2 segundos
le="5"    -> duração menor ou igual a 5 segundos
```

Ao observar uma duração de `0.42` segundo, ela entra em todos os buckets cujo
limite é maior ou igual a `0.42`, começando pelo bucket `0.5`.

O Histogram gera famílias de métricas:

```text
http_request_duration_seconds_bucket -> quantidade em cada faixa
http_request_duration_seconds_count  -> total de observações
http_request_duration_seconds_sum    -> soma das durações
```

O p95 não é calculado diretamente pela biblioteca. A biblioteca guarda a
distribuição; o Prometheus calcula o p95 usando PromQL.

## 8. Middleware de métricas

Arquivo: `backend/src/middlewares/metrics.ts`

```ts
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.path === '/metrics') {
    return next();
  }

  const startedAt = performance.now();

  res.on('finish', () => {
    const finishedAt = performance.now();
    const durationSeconds = (finishedAt - startedAt) / 1000;

    const labels = {
      method: req.method,
      route: req.route?.path ?? 'unmatched',
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, durationSeconds);
  });

  next();
}
```

### `Request`, `Response` e `NextFunction`

- `Request`: requisição recebida pelo Express;
- `Response`: resposta que será enviada;
- `NextFunction`: função que libera a execução para a próxima etapa.

### Exclusão de `/metrics`

```ts
if (req.path === '/metrics') {
  return next();
}
```

O Prometheus consulta `/metrics` a cada cinco segundos. Se essa rota fosse
medida, a própria ferramenta de monitoramento aumentaria o contador de
requisições da aplicação e poluiria os dados.

### `performance.now()`

Retorna uma marca de tempo de alta precisão. Guardamos uma no início e outra no
fim:

```text
finishedAt - startedAt = duração em milissegundos
```

A divisão por `1000` converte milissegundos para segundos, unidade usada no
nome da métrica.

### `res.on('finish', callback)`

Registra uma função para executar quando a resposta terminar.

Somente nesse momento sabemos:

- qual foi o status HTTP final;
- quanto tempo toda a operação demorou;
- que Controller, Use Case e Repository já terminaram.

### Construção das labels

```ts
const labels = {
  method: req.method,
  route: req.route?.path ?? 'unmatched',
  status_code: String(res.statusCode),
};
```

- `req.method`: método HTTP;
- `req.route?.path`: padrão da rota que o Express encontrou;
- `unmatched`: valor usado quando nenhuma rota foi encontrada;
- `res.statusCode`: código final convertido para string.

### `Counter.inc(labels)`

```ts
httpRequestsTotal.inc(labels);
```

Incrementa em um o contador correspondente à combinação das labels.

### `Histogram.observe(labels, value)`

```ts
httpRequestDuration.observe(labels, durationSeconds);
```

Adiciona uma nova duração à distribuição correspondente às labels. Não retorna
uma resposta HTTP; apenas atualiza a métrica mantida em memória.

### `next()`

```ts
next();
```

Libera a requisição para continuar até o próximo middleware ou rota. Sem essa
chamada, a requisição ficaria parada.

## 9. Registro no servidor Express

Trecho relevante de `backend/src/server.ts`:

```ts
app.use(express.json());
app.use(httpLogger);
app.use(metricsMiddleware);

app.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', metricsRegistry.contentType);
  return res.end(await metricsRegistry.metrics());
});

app.get('/health', (_req, res) => {
  return res.status(200).json({ status: 'ok' });
});

app.use(usuarioRoutes);
```

### Por que a ordem importa?

O Express executa os middlewares na ordem em que foram registrados:

```text
express.json()
      v
httpLogger
      v
metricsMiddleware
      v
/metrics, /health ou usuarioRoutes
```

Como os middlewares aparecem antes das rotas, eles conseguem observar todas as
requisições posteriores.

### Endpoint `/metrics`

```ts
metricsRegistry.metrics()
```

Retorna uma `Promise` cujo resultado é uma string no formato de exposição do
Prometheus.

Exemplo simplificado:

```text
# HELP http_requests_total Quantidade total de requisições HTTP
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/health",status_code="200"} 3
```

### `metricsRegistry.contentType`

Contém o tipo de conteúdo HTTP correto para o formato produzido pelo Registry.

```ts
res.setHeader('Content-Type', metricsRegistry.contentType);
```

Informa ao Prometheus como interpretar o corpo da resposta.

### `res.end(...)`

Finaliza a resposta e envia a string das métricas. Diferentemente de
`res.json()`, não transforma o conteúdo em JSON.

### Endpoint `/health`

É uma rota simples usada para verificar se o processo responde:

```json
{
  "status": "ok"
}
```

Ela não prova que banco e dependências estão saudáveis. É apenas um health
check básico do processo HTTP.

## 10. Configuração do Prometheus

Arquivo: `monitoring/prometheus.yml`

```yaml
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: course-platform-api
    metrics_path: /metrics
    static_configs:
      - targets:
          - host.docker.internal:3333
```

### `scrape_interval`

Define a frequência das coletas:

```text
12:00:00 -> GET /metrics
12:00:05 -> GET /metrics
12:00:10 -> GET /metrics
```

### `scrape_configs`

Lista os alvos que o Prometheus deve monitorar.

### `job_name`

Nome lógico do backend dentro do Prometheus. O Prometheus adiciona essa
informação como label `job` às séries coletadas.

### `metrics_path`

Caminho HTTP consultado no alvo. Neste projeto é `/metrics`.

### `static_configs` e `targets`

Define estaticamente o endereço da aplicação:

```text
host.docker.internal:3333
```

O Prometheus está dentro do Docker e o backend está executando no Windows.
Dentro do contêiner, `localhost` apontaria para o próprio contêiner. O nome
`host.docker.internal` permite que ele acesse o computador hospedeiro.

## 11. Prometheus no Docker

Arquivo: `monitoring/docker-compose.yml`

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: course-platform-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
```

### `services`

Lista os serviços administrados pelo Docker Compose.

### `image`

Define a imagem usada para criar o contêiner. `latest` é conveniente para este
estudo local. Em produção, é melhor fixar uma versão para evitar atualizações
inesperadas.

### `container_name`

Nome amigável atribuído ao contêiner.

### `ports`

```yaml
"9090:9090"
```

O primeiro `9090` é a porta do computador. O segundo é a porta do contêiner.
Assim, a interface fica disponível em `http://localhost:9090`.

### `volumes`

```yaml
./prometheus.yml:/etc/prometheus/prometheus.yml:ro
```

Significa:

```text
arquivo local
./prometheus.yml
        -> disponibilizado dentro do contêiner em
/etc/prometheus/prometheus.yml
```

`ro` significa read-only: o contêiner pode ler o arquivo, mas não alterá-lo.

## 12. Passo a passo para reproduzir

### Passo 1: instalar as bibliotecas

Dentro de `backend`:

```powershell
npm install pino pino-http @prometheus-io/client
```

### Passo 2: criar o logger

Criar `backend/src/observability/logger.ts` com a configuração do Pino e a
proteção dos campos sensíveis.

### Passo 3: criar o middleware HTTP

Criar `backend/src/middlewares/http-logger.ts` para gerar o request ID e
escolher o nível do log com base no status.

### Passo 4: declarar as métricas

Criar `backend/src/observability/metrics.ts` com o Registry, o Counter, o
Histogram e as métricas padrão do Node.js.

### Passo 5: criar o middleware de métricas

Criar `backend/src/middlewares/metrics.ts` para marcar o início da requisição e
registrar contador e duração quando a resposta terminar.

### Passo 6: registrar tudo no Express

Em `backend/src/server.ts`, registrar os middlewares antes das rotas e criar os
endpoints `/metrics` e `/health`.

### Passo 7: testar o backend

```powershell
cd backend
npm run build
npm run dev
```

Em outro terminal:

```powershell
curl.exe -i http://localhost:3333/health
curl.exe http://localhost:3333/metrics
```

Resposta esperada de `/health`:

```http
HTTP/1.1 200 OK
x-request-id: algum-uuid
Content-Type: application/json

{"status":"ok"}
```

Em `/metrics`, procurar por:

```text
http_requests_total
http_request_duration_seconds_count
course_platform_process_resident_memory_bytes
```

### Passo 8: criar a configuração do Prometheus

Criar `monitoring/prometheus.yml` com o intervalo, job, caminho e alvo.

### Passo 9: iniciar o Prometheus

```powershell
cd monitoring
docker compose up -d
docker compose ps
```

Abrir:

```text
http://localhost:9090/targets
```

O job `course-platform-api` deve aparecer como `UP`.

## 13. Consultas PromQL estudadas

### Total acumulado

```promql
http_requests_total
```

Mostra o valor acumulado de cada combinação de labels.

### Requisições por segundo

```promql
rate(http_requests_total[1m])
```

Calcula a velocidade média de crescimento do Counter durante o último minuto.

Com tráfego muito baixo, a consulta pode retornar zero ou não ser muito útil.

### Quantidade de durações observadas

```promql
http_request_duration_seconds_count
```

### Latência média por rota

```promql
sum(rate(http_request_duration_seconds_sum[1m])) by (route)
/
sum(rate(http_request_duration_seconds_count[1m])) by (route)
```

A soma das durações é dividida pela quantidade de observações.

### p95 por rota

```promql
histogram_quantile(
  0.95,
  sum by (le, route) (
    rate(http_request_duration_seconds_bucket[1m])
  )
)
```

- `0.95`: percentil desejado;
- `_bucket`: dados das faixas do Histogram;
- `[1m]`: janela do último minuto;
- `by (le, route)`: preserva os limites das faixas e separa por rota.

## 14. Simulação completa

Considere uma chamada válida para `POST /usuarios`:

```text
1. Express recebe POST /usuarios.
2. express.json() interpreta o body.
3. httpLogger procura x-request-id.
4. Como ele não existe, randomUUID() cria um valor.
5. O valor é associado aos logs e colocado no header da resposta.
6. metricsMiddleware guarda o horário inicial.
7. AuthMiddleware valida o JWT.
8. A rota chama CriarUsuarioController.handle().
9. O Controller passa os dados ao CriarUsuarioUseCase.
10. O Use Case valida os dados e cria o hash da senha.
11. O Repository usa o Prisma para inserir no PostgreSQL.
12. O Controller responde com status 201.
13. A resposta emite o evento finish.
14. Counter.inc() aumenta a série POST /usuarios 201.
15. Histogram.observe() registra a duração total.
16. pino-http conclui o log com status, duração e reqId.
17. Alguns segundos depois, o Prometheus chama GET /metrics.
18. metricsRegistry.metrics() gera o texto das métricas.
19. O Prometheus armazena uma nova amostra no histórico.
20. Uma consulta PromQL transforma as amostras em taxa, média ou p95.
```

## 15. Comportamentos encontrados durante o teste

Ao testar uma rota inexistente, foi recebido `400 Não possui autorização` em
vez de `404`. Isso acontece porque o Router de usuários está montado na raiz e
contém:

```ts
usuarioRoutes.use(auth);
```

Depois de `POST /login`, qualquer caminho que atravesse esse Router passa pelo
middleware de autenticação, inclusive um caminho inexistente.

O `x-request-id` presente nessa resposta confirmou que o middleware de logs foi
executado antes do erro.

A resposta de erro apareceu como HTML com stack trace porque ainda não foi
implementado um middleware central de tratamento de erros. Isso é uma melhoria
separada da instrumentação atual.

Também é necessário garantir que o `AuthMiddleware` não use `console.log` para
imprimir `authorization`, token ou ID. O `console.log` não passa pelo Pino e não
respeita a configuração `redact`.

## 16. Cuidados importantes

1. Nunca registrar senha, JWT, refresh token ou secrets.
2. Não usar request ID como forma de autenticação.
3. Não usar request ID ou user ID como label de métrica.
4. Em produção, restringir o acesso ao endpoint `/metrics` à rede de
   monitoramento.
5. Um health check básico não prova que banco e dependências estão saudáveis.
6. Métricas vivem na memória do processo; se o processo reiniciar, o contador
   local reinicia. O histórico já coletado permanece no Prometheus.
7. Se a aplicação tiver vários processos ou réplicas, cada instância produz
   suas próprias métricas; o Prometheus coleta todas e as consultas agregam os
   resultados.

## 17. Resposta curta para entrevista

> Na minha aplicação Express, configurei logs estruturados com Pino e um
> request ID para correlacionar os eventos de cada chamada. Também criei um
> middleware que mede quantidade, status e duração das requisições usando um
> Counter e um Histogram. A aplicação expõe esses dados em `/metrics`, e o
> Prometheus coleta o endpoint periodicamente. Com PromQL, consigo analisar
> throughput, latência média e p95. Depois de uma correção, consultaria as
> mesmas métricas para comprovar se houve melhora.

## 18. Referências oficiais

- Cliente Prometheus para Node.js: <https://github.com/prometheus/client_js>
- Pino HTTP: <https://github.com/pinojs/pino-http>
- Redaction do Pino: <https://github.com/pinojs/pino/blob/main/docs/redaction.md>
- Primeiros passos com Prometheus:
  <https://prometheus.io/docs/introduction/first_steps/>

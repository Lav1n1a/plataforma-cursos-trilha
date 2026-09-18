import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from '@prometheus-io/client';

// Registro central das métricas
export const metricsRegistry = new Registry();

//coleta CPU, memória e infos do Node
collectDefaultMetrics({
  register: metricsRegistry,
  prefix: 'course_platform_',
});

// Quantidade de requisições
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Quantidade total de requisições HTTP',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

// Duração das requisições
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});
import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import {
  httpRequestDuration,
  httpRequestsTotal,
} from '@/observability/metrics';

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Não mede a própria rota de métricas
  if (req.path === '/metrics') {
    return next();
  }

  // Marca o momento em que a requisição começou
  const startedAt = performance.now();

  // Executa quando a resposta termina
  res.on('finish', () => {
    const finishedAt = performance.now();

    const durationSeconds =
      (finishedAt - startedAt) / 1000;

    const labels = {
      method: req.method,
      route: req.route?.path ?? 'unmatched',
      status_code: String(res.statusCode),
    };

    // Aumenta a quantidade de requisições
    httpRequestsTotal.inc(labels);

    // Registra quanto essa requisição demorou
    httpRequestDuration.observe(
      labels,
      durationSeconds,
    );
  });

  // Libera a requisição para continuar
  next();
}
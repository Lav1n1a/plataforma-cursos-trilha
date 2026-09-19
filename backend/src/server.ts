import 'dotenv/config';
import express  from "express";
import { usuarioRoutes } from "./rotas/usuario.routes";
import { oidcRoutes } from './rotas/oidc.routes';
import { oidcSession } from './middlewares/oidc-session';
import { httpLogger } from './middlewares/http-logger';
import { metricsMiddleware } from './middlewares/metrics';
import { metricsRegistry } from './observability/metrics';

const app = express()
app.use(express.json())

// Ativa os logs para as requisições
app.use(httpLogger);

// Medição das requisições
app.use(metricsMiddleware);

// Prometheus acessará este endpoint
app.get('/metrics', async (_req, res) => {
  res.setHeader(
    'Content-Type',
    metricsRegistry.contentType,
  );

  return res.end(await metricsRegistry.metrics());
});

app.get('/health', (_req, res) => {
  return res.status(200).json({
    status: 'ok',
  });
});

app.use(oidcSession);
app.use(oidcRoutes);
app.use(usuarioRoutes)

app.listen(3333, () => {
    console.log('Ouvindo porta 3333');
});

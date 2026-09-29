import 'dotenv/config';
import express from 'express';
import { createApp } from './app';
import { authUsers } from './auth/users';
import { PrismaSessionStore } from './auth/session-store';
import { prisma } from './data/prisma';
import { httpLogger } from './middlewares/http-logger';
import { metricsMiddleware } from './middlewares/metrics';
import { metricsRegistry } from './observability/metrics';

const store = new PrismaSessionStore();
await prisma.$connect();
await store.prune();
const cleanup = setInterval(() => {
  store.prune().catch(() => console.error('Falha ao remover sessões expiradas.'));
}, 15 * 60_000);
cleanup.unref();

const app = express();
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.use(httpLogger);
app.use(metricsMiddleware);
app.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', metricsRegistry.contentType);
  res.end(await metricsRegistry.metrics());
});
app.use(createApp(store, authUsers));
const port = Number(process.env.PORT ?? 3333);
const server = app.listen(port, () => console.log(`Backend disponível em http://localhost:${port}`));

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    clearInterval(cleanup);
    server.close(() => { prisma.$disconnect().finally(() => process.exit(0)); });
  });
}

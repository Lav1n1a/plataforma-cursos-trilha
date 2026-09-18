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
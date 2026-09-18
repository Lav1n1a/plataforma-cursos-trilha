import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',

  //protege propriedades listadas, dessa forma impedindo exposicao 
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
import pino from 'pino';

const transport = pino.transport({
  targets: [
    {
      // Continua mostrando os logs no terminal
      target: 'pino/file',

      options: {
        destination: 1,
      },
    },
    {
      // Envia os mesmos logs para o Loki
      target: 'pino-loki',

      options: {
        host:
          process.env.LOKI_URL ??
          'http://localhost:3100',

        labels: {
          application: 'course-platform-api',
          environment: 'development',
        },

        batching: {
          interval: 2,
          maxBufferSize: 1000,
        },
      },
    },
  ],
});

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
},
 transport,
);
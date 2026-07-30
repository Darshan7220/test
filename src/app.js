import express from 'express';
import helmet from 'helmet';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { createAuthRouter } from './routes/auth.js';

export function createApp({ config, userStore }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (request, response) => {
    response.json({ status: 'ok' });
  });
  app.use('/api/auth', createAuthRouter({ config, userStore }));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

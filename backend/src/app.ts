import express, { Express } from 'express';
import cors from 'cors';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Standard middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role'],
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Root Welcome & Health
  app.get('/', (req, res) => {
    res.json({
      message: '🚑 Arogyavahini Smart Ambulance & Traffic Priority Backend API',
      version: '1.0.0',
      status: 'active',
      endpoints: {
        health: '/api/health',
        users: '/api/v1/users',
        ambulances: '/api/v1/ambulances',
        emergencies: '/api/v1/emergencies',
      },
    });
  });

  // Mount API Routers
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter); // Alias for convenience

  // 404 and Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;

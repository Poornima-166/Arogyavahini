import { Router } from 'express';
import { userRoutes } from './userRoutes.js';
import { ambulanceRoutes } from './ambulanceRoutes.js';
import { emergencyRoutes } from './emergencyRoutes.js';
import { testConnection } from '../config/db.js';

export const apiRouter = Router();

// Health & Database Ping Endpoint
apiRouter.get('/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'ok',
    service: 'Arogyavahini PostgreSQL Backend Service',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Core Entity Routes
apiRouter.use('/users', userRoutes);
apiRouter.use('/ambulances', ambulanceRoutes);
apiRouter.use('/emergencies', emergencyRoutes);

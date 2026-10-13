/**
 * ==============================================================================
 * PROJECT: AROGYAVAHINI
 * MODULE:  Express Application Configuration
 * ==============================================================================
 * Shared Express application used by both server.ts (standalone Node / dev server)
 * and api/index.ts (Vercel Serverless Function).
 */

import express, { Express } from 'express';
import cors from 'cors';
import { apiRouter } from './routes.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role'],
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logger for debugging in development & production logs
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Liveness probe endpoint - indicates if the Node.js process is active
  app.get(['/api/health/live', '/health/live'], (req, res) => {
    return res.status(200).json({
      status: 'alive',
      liveness: true,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness probe endpoint - checks actual PostgreSQL database connectivity with a real query
  app.get(['/api/health/ready', '/health/ready'], async (req, res) => {
    let dbStatus: { connected: boolean; latencyMs?: number; error?: string; configuredHost?: string } = {
      connected: false,
    };

    try {
      const { checkDatabaseConnection } = await import('./config/database.js');
      dbStatus = await checkDatabaseConnection();
    } catch (err: any) {
      dbStatus = {
        connected: false,
        error: err.message || String(err),
      };
    }

    const isReady = dbStatus.connected;
    return res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not_ready',
      readiness: isReady,
      liveness: true,
      database: {
        engine: 'Neon PostgreSQL',
        status: isReady ? 'connected' : 'disconnected',
        host: dbStatus.configuredHost || undefined,
        latencyMs: dbStatus.latencyMs,
        error: dbStatus.error || null,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // General health check endpoint distinguishing application liveness from PostgreSQL readiness
  app.get(['/api/health', '/health'], async (req, res) => {
    let dbStatus: { connected: boolean; latencyMs?: number; error?: string; configuredHost?: string } = {
      connected: false,
    };

    try {
      const { checkDatabaseConnection } = await import('./config/database.js');
      dbStatus = await checkDatabaseConnection();
    } catch (err: any) {
      dbStatus = {
        connected: false,
        error: err.message || String(err),
      };
    }

    const isReady = dbStatus.connected;
    const requireReadiness = req.query.check === 'readiness' || req.query.check === 'ready';

    const payload = {
      status: isReady ? 'healthy' : 'degraded',
      liveness: true,
      readiness: isReady,
      system: 'Arogyavahini – Smart Integrated Emergency Medical Response System',
      version: '2.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        engine: 'Neon PostgreSQL',
        status: isReady ? 'connected' : 'disconnected',
        host: dbStatus.configuredHost || undefined,
        latencyMs: dbStatus.latencyMs,
        error: dbStatus.error || null,
      },
      timestamp: new Date().toISOString(),
    };

    return res.status(requireReadiness && !isReady ? 503 : 200).json(payload);
  });

  // REST API Routes
  // 1. Mount on standard /api prefix
  app.use('/api', apiRouter);

  // 2. Mount on root / as universal fallback for serverless rewrites where /api is stripped
  app.use('/', apiRouter);

  // 404 JSON Handler for unmatched API routes - guarantees no HTML 404 is returned to API callers
  app.use((req, res, next) => {
    const isApi = 
      req.path.startsWith('/api') ||
      req.path.startsWith('/auth') ||
      req.path.startsWith('/emergency') ||
      req.path.startsWith('/ambulances') ||
      req.path.startsWith('/hospitals') ||
      req.path.startsWith('/notifications') ||
      req.path.startsWith('/stats') ||
      req.path.startsWith('/patient') ||
      req.path.startsWith('/users') ||
      req.headers.accept?.includes('application/json');

    if (isApi) {
      return res.status(404).json({
        error: `API endpoint not found: ${req.method} ${req.originalUrl || req.path}`,
        status: 404,
        timestamp: new Date().toISOString(),
      });
    }
    next();
  });

  // Global Error Handler - returns clean JSON error response, avoiding raw stack traces/HTML
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[API Server Error] ${req.method} ${req.url}:`, err);
    const msg = (err?.message || String(err)).toLowerCase();
    const code = (err?.code || '').toString();
    const isDbConn =
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT' ||
      code === 'ENOTFOUND' ||
      code === 'ECONNRESET' ||
      code === '08001' ||
      code === '08006' ||
      msg.includes('econnrefused') ||
      msg.includes('connection refused') ||
      msg.includes('connection terminated') ||
      msg.includes('database_url') ||
      msg.includes('postgres_url');

    const status = isDbConn ? 503 : (err.status || 500);
    res.status(status).json({
      error: err.message || 'Internal Server Error',
      status,
      databaseStatus: isDbConn ? 'disconnected' : undefined,
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

export const app = createApp();

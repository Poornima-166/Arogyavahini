import http from 'http';
import dotenv from 'dotenv';
import { app } from './app.js';
import { testConnection, closePool } from './config/db.js';
import { initPostgresSchema } from './models/index.js';

dotenv.config();

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || '5000', 10);
const HOST = '0.0.0.0';

async function startServer() {
  console.log('------------------------------------------------------------');
  console.log('🚀 Starting Arogyavahini Express & PostgreSQL Backend Server');
  console.log('------------------------------------------------------------');

  // 1. Establish and test PostgreSQL connection
  console.log('📡 Testing PostgreSQL connection via node-postgres pool...');
  const connResult = await testConnection();

  if (connResult.success) {
    console.log('✅ PostgreSQL database connection established successfully.');
    // 2. Initialize schemas if connected
    try {
      await initPostgresSchema();
      console.log('✅ Core PostgreSQL schemas (Users, Ambulances, EmergencyRequests) verified.');
    } catch (schemaErr: any) {
      console.error('⚠️ Could not run DDL schema migration:', schemaErr.message);
    }
  } else {
    console.warn(`⚠️ PostgreSQL connection note: ${connResult.message}`);
    console.log('💡 Note: Set DATABASE_URL or PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE in .env to connect to live PostgreSQL.');
  }

  // 3. Start HTTP Server
  const server = http.createServer(app);

  server.listen(PORT, HOST, () => {
    console.log(`🚑 Arogyavahini Backend running at http://${HOST}:${PORT}`);
    console.log(`🔍 Health Check: http://${HOST}:${PORT}/api/health`);
    console.log(`👥 Users API: http://${HOST}:${PORT}/api/v1/users`);
    console.log(`🚑 Ambulances API: http://${HOST}:${PORT}/api/v1/ambulances`);
    console.log(`🚨 Emergency API: http://${HOST}:${PORT}/api/v1/emergencies`);
    console.log('------------------------------------------------------------');
  });

  // Graceful shutdown handlers
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('🔌 HTTP server closed.');
      await closePool();
      process.exit(0);
    });

    // Force close after 10s if hung
    setTimeout(() => {
      console.error('⚠️ Forcefully terminating after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Start if executed directly
startServer().catch((err) => {
  console.error('❌ Fatal error starting backend server:', err);
  process.exit(1);
});

export { app, startServer };

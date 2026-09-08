/**
 * ==============================================================================
 * PROJECT: AROGYAVAHINI
 * MODULE:  Backend Database Configuration (PostgreSQL & Resilient Local Engine)
 * ==============================================================================
 * This module configures a production-grade PostgreSQL connection pool using 'pg'.
 * When PostgreSQL credentials (DATABASE_URL, PGHOST, etc.) are provided in the
 * environment, queries execute directly against PostgreSQL. If running in a local
 * development or preview environment without a running Postgres daemon, it
 * automatically delegates to the embedded SQLite engine for zero-configuration testing.
 */

import pg from 'pg';
import { getDb as getSqliteDb, saveDb as saveSqliteDb } from '../db.js';

const { Pool } = pg;

// Detect PostgreSQL configuration from environment
const isPostgresEnabled = Boolean(
  process.env.DATABASE_URL || 
  (process.env.PGHOST && process.env.PGDATABASE)
);

let pool: pg.Pool | null = null;

if (isPostgresEnabled) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'arogyavahini',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      max: 20, // Connection pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]:', err);
    });

    console.log('🐘 [Database] PostgreSQL connection pool initialized.');
  } catch (err) {
    console.warn('⚠️ [Database] Failed to initialize PostgreSQL pool, falling back to local engine:', err);
    pool = null;
  }
} else {
  console.log('ℹ️ [Database] PostgreSQL not configured in environment. Using embedded SQLite engine.');
}

/**
 * Check if PostgreSQL is actively configured
 */
export function isPostgresActive(): boolean {
  return pool !== null;
}

/**
 * Get direct access to the PostgreSQL connection pool
 */
export function getPostgresPool(): pg.Pool | null {
  return pool;
}

/**
 * Universal query runner:
 * If PostgreSQL is active, runs with parameterized query ($1, $2...).
 * If local engine is active, runs against embedded SQLite.
 */
export async function dbQuery(sql: string, params: any[] = []): Promise<any> {
  if (pool) {
    try {
      const res = await pool.query(sql, params);
      return res.rows;
    } catch (err) {
      console.error('[PostgreSQL Query Error]:', err);
      throw err;
    }
  }

  // Fallback to SQLite
  const db = await getSqliteDb();
  // Transform Postgres parameterized placeholders ($1, $2) to SQLite placeholders (?) if needed
  const sqliteSql = sql.replace(/\$\d+/g, '?');
  const stmt = db.prepare(sqliteSql);
  stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  saveSqliteDb(db);
  return results;
}

export { getSqliteDb, saveSqliteDb };

/**
 * ==============================================================================
 * PROJECT: AROGYAVAHINI
 * MODULE:  Backend Database Configuration (PostgreSQL Exclusively)
 * ==============================================================================
 * Production-ready PostgreSQL connection pool using 'pg'.
 * Configured exclusively with PostgreSQL. No SQLite, in-memory, or mock fallbacks.
 * Uses DATABASE_URL / POSTGRES_URL environment variables.
 */

import pg from 'pg';
import { hashPassword } from '../security.js';

const { Pool } = pg;

// Read PostgreSQL connection string from environment variables
const rawConnectionString = (
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  process.env.POSTGRES_PRISMA_URL || 
  process.env.POSTGRES_URL_NON_POOLING || 
  ''
).trim();

const isPostgresConfigured = Boolean(
  rawConnectionString || 
  (process.env.PGHOST && process.env.PGDATABASE)
);

let poolInstance: pg.Pool | null = null;

export function getPostgresPool(): pg.Pool {
  if (!poolInstance) {
    if (!isPostgresConfigured) {
      const msg = '❌ [Database Configuration Error] PostgreSQL is not configured! DATABASE_URL or POSTGRES_URL environment variable must be set.';
      console.error(msg);
      throw new Error(msg);
    }

    const isSslDisabled = process.env.DB_SSL === 'false';
    const useSsl = !isSslDisabled && (
      Boolean(rawConnectionString && (
        rawConnectionString.includes('neon.tech') ||
        rawConnectionString.includes('sslmode=require') ||
        rawConnectionString.includes('amazonaws.com') ||
        rawConnectionString.includes('supabase.co')
      )) ||
      process.env.DB_SSL === 'true' ||
      process.env.NODE_ENV === 'production'
    );

    const isLocalhost = rawConnectionString.includes('localhost') || rawConnectionString.includes('127.0.0.1');

    poolInstance = new Pool({
      connectionString: rawConnectionString || undefined,
      host: process.env.PGHOST || process.env.POSTGRES_HOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : (process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : undefined),
      database: process.env.PGDATABASE || process.env.POSTGRES_DATABASE || 'arogyavahini',
      user: process.env.PGUSER || process.env.POSTGRES_USER || 'postgres',
      password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: process.env.PG_MAX_POOL ? parseInt(process.env.PG_MAX_POOL, 10) : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: isLocalhost ? 3000 : 10000,
    });

    poolInstance.on('error', (err) => {
      console.error('❌ [PostgreSQL Pool Error]:', err.message || err);
    });

    console.log('🐘 [Database] PostgreSQL connection pool initialized.');
  }

  return poolInstance;
}

/**
 * Universal parameterized query helper for PostgreSQL.
 * Queries PostgreSQL directly using the connection pool.
 * No mock or in-memory fallbacks.
 */
export async function dbQuery<T extends pg.QueryResultRow = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const pool = getPostgresPool();
  const res = await pool.query<T>(sql, params);
  return res.rows;
}

/**
 * Executes a real query against PostgreSQL to verify connectivity and measure latency.
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  latencyMs?: number;
  error?: string;
  configuredHost?: string;
}> {
  if (!isPostgresConfigured) {
    return {
      connected: false,
      error: 'DATABASE_URL or POSTGRES_URL environment variable is not set.',
    };
  }

  const startTime = Date.now();
  try {
    const pool = getPostgresPool();
    await pool.query('SELECT 1');
    const latencyMs = Date.now() - startTime;
    let host = 'configured';
    try {
      if (rawConnectionString) {
        host = new URL(rawConnectionString).host;
      }
    } catch { /* ignore url parse error */ }
    return {
      connected: true,
      latencyMs,
      configuredHost: host,
    };
  } catch (err: any) {
    let host = 'unreachable';
    try {
      if (rawConnectionString) {
        host = new URL(rawConnectionString).host;
      }
    } catch { /* ignore url parse error */ }
    return {
      connected: false,
      error: err.message || String(err),
      configuredHost: host,
    };
  }
}

/**
 * Checks if PostgreSQL configuration exists in the environment
 */
export function isPostgresActive(): boolean {
  return isPostgresConfigured;
}

/**
 * Helper to insert a notification into PostgreSQL
 */
export async function createPgNotification(params: {
  userId?: string | number | null;
  role?: 'patient' | 'driver' | 'admin';
  title: string;
  message: string;
  notificationType: string;
  emergencyRequestId?: number | null;
  isRead?: number;
}): Promise<void> {
  try {
    await dbQuery(
      `INSERT INTO notifications (user_id, role, title, message, notification_type, emergency_request_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        params.userId !== undefined && params.userId !== null ? String(params.userId) : null,
        params.role || null,
        params.title,
        params.message,
        params.notificationType,
        params.emergencyRequestId !== undefined && params.emergencyRequestId !== null ? Number(params.emergencyRequestId) : null,
        params.isRead ? 1 : 0,
      ]
    );
  } catch (err: any) {
    console.warn('[Notification] Failed to create notification:', err.message || err);
  }
}

/**
 * Helper to broadcast a notification to all users matching a role in PostgreSQL
 */
export async function notifyPgRole(
  role: 'patient' | 'driver' | 'admin',
  params: {
    title: string;
    message: string;
    notificationType: string;
    emergencyRequestId?: number | null;
    excludeUserId?: string | number | null;
  }
): Promise<void> {
  try {
    let sql = 'SELECT id FROM users WHERE role = $1 AND (delete_flag IS FALSE OR delete_flag IS NULL)';
    const queryParams: any[] = [role];

    if (params.excludeUserId) {
      sql += ' AND id::text != $2::text';
      queryParams.push(String(params.excludeUserId));
    }

    const users = await dbQuery<{ id: string }>(sql, queryParams);

    if (users.length > 0) {
      for (const u of users) {
        await dbQuery(
          `INSERT INTO notifications (user_id, role, title, message, notification_type, emergency_request_id, is_read, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, 0, NOW())`,
          [
            u.id,
            role,
            params.title,
            params.message,
            params.notificationType,
            params.emergencyRequestId || null,
          ]
        );
      }
    } else {
      // General role notification
      await dbQuery(
        `INSERT INTO notifications (user_id, role, title, message, notification_type, emergency_request_id, is_read, created_at)
         VALUES (NULL, $1, $2, $3, $4, $5, 0, NOW())`,
        [
          role,
          params.title,
          params.message,
          params.notificationType,
          params.emergencyRequestId || null,
        ]
      );
    }
  } catch (err: any) {
    console.warn('[Notification] Failed to notify role:', role, err.message || err);
  }
}

/**
 * Initializes and verifies core schemas and demo accounts in Neon PostgreSQL.
 * Safe, idempotent, non-destructive migrations.
 */
export async function initPostgresSchema(pool: pg.Pool): Promise<void> {
  const client = await pool.connect();
  try {
    // 1. Extensions
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `);

    // 2. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(30),
        role VARCHAR(30) NOT NULL CHECK (role IN ('patient', 'driver', 'admin')),
        auth_provider VARCHAR(50) DEFAULT 'local',
        delete_flag BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

    // Ensure medical profile columns exist in users table (non-destructive)
    const userColumnsToAdd: [string, string][] = [
      ['blood_type', 'VARCHAR(20)'],
      ['allergies', 'TEXT'],
      ['emergency_contact_name', 'VARCHAR(150)'],
      ['emergency_contact_phone', 'VARCHAR(50)'],
      ['emergency_contact_relation', 'VARCHAR(100)'],
      ['medical_notes', 'TEXT'],
    ];
    for (const [colName, colType] of userColumnsToAdd) {
      try {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${colName} ${colType};`);
      } catch { /* column might already exist */ }
    }

    // 3. Ambulances Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ambulances (
        id SERIAL PRIMARY KEY,
        vehicle_number VARCHAR(50) UNIQUE NOT NULL,
        driver_user_id VARCHAR(50),
        driver_name VARCHAR(150) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        type VARCHAR(50) DEFAULT 'Basic Life Support (BLS)',
        base_location VARCHAR(200) NOT NULL,
        status VARCHAR(30) DEFAULT 'AVAILABLE',
        current_latitude DECIMAL(10, 7),
        current_longitude DECIMAL(10, 7),
        last_gps_update TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure last_gps_update in ambulances
    try {
      await client.query('ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS last_gps_update TIMESTAMP WITH TIME ZONE;');
    } catch { /* non-blocking */ }

    // 4. Emergency Requests Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_requests (
        id SERIAL PRIMARY KEY,
        patient_id VARCHAR(50),
        patient_name VARCHAR(150) NOT NULL,
        emergency_type VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 7),
        longitude DECIMAL(10, 7),
        phone VARCHAR(30) NOT NULL,
        notes TEXT,
        driver_id VARCHAR(50),
        ambulance_id INTEGER,
        status VARCHAR(40) DEFAULT 'WAITING_FOR_DRIVER',
        route_origin TEXT,
        route_destination TEXT,
        optimized_routes TEXT,
        selected_route_id VARCHAR(50),
        current_eta_minutes REAL,
        current_distance_km REAL,
        current_traffic VARCHAR(30) DEFAULT 'Low',
        hospital_routes TEXT,
        selected_hospital VARCHAR(200),
        hospital_destination VARCHAR(200),
        navigation_started INTEGER DEFAULT 0,
        driver_current_latitude REAL,
        driver_current_longitude REAL,
        driver_accuracy REAL,
        navigation_stage VARCHAR(50) DEFAULT 'TO_PATIENT',
        route_updated_at TIMESTAMP WITH TIME ZONE,
        accepted_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        rating_overall_stars INTEGER,
        rating_speed_stars INTEGER,
        rating_service_stars INTEGER,
        rating_feedback TEXT,
        rating_submitted_at TIMESTAMP WITH TIME ZONE,
        patient_blood_type VARCHAR(20),
        patient_allergies TEXT,
        patient_emergency_contact_name VARCHAR(150),
        patient_emergency_contact_phone VARCHAR(50),
        patient_emergency_contact_relation VARCHAR(100),
        patient_medical_notes TEXT,
        vitals_heart_rate INTEGER,
        vitals_blood_pressure VARCHAR(30),
        vitals_spo2 INTEGER,
        vitals_respiratory_rate INTEGER,
        vitals_gcs INTEGER,
        vitals_blood_sugar INTEGER,
        triage_acuity VARCHAR(30),
        er_notified_at TIMESTAMP WITH TIME ZONE,
        er_prep_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure non-destructive migrations for emergency_requests columns
    try {
      await client.query('ALTER TABLE emergency_requests ALTER COLUMN driver_id TYPE VARCHAR(50) USING driver_id::text;');
    } catch { /* non-blocking */ }
    try {
      await client.query('ALTER TABLE emergency_requests ALTER COLUMN patient_id TYPE VARCHAR(50) USING patient_id::text;');
    } catch { /* non-blocking */ }
    try {
      await client.query('ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS notes TEXT;');
    } catch { /* non-blocking */ }

    // 5. Hospitals Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        specialty VARCHAR(200) NOT NULL,
        address VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 7) NOT NULL,
        longitude DECIMAL(10, 7) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        total_beds INTEGER DEFAULT 20,
        available_beds INTEGER DEFAULT 12,
        ward_capacity VARCHAR(30) DEFAULT 'AVAILABLE',
        rating DECIMAL(3, 1) DEFAULT 4.6,
        type VARCHAR(100) DEFAULT 'Multi-Specialty Emergency Hospital',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Notifications Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50),
        role VARCHAR(30),
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        notification_type VARCHAR(50) NOT NULL,
        emergency_request_id INTEGER,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      await client.query('ALTER TABLE notifications ALTER COLUMN user_id TYPE VARCHAR(50) USING user_id::text;');
    } catch { /* non-blocking */ }

    // 7. Activity Logs & Traffic Signal Priority Requests
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        emergency_id INTEGER,
        action TEXT NOT NULL,
        performed_by VARCHAR(100) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Seed demo users into PostgreSQL if empty
    const userCountRes = await client.query('SELECT COUNT(*) as count FROM users WHERE delete_flag IS FALSE OR delete_flag IS NULL');
    if (parseInt(userCountRes.rows[0].count, 10) === 0) {
      console.log('🌱 [Database] Seeding initial demo accounts in Neon PostgreSQL...');
      const demoPatientPass = hashPassword('password123');
      const demoDriverPass = hashPassword('password123');
      const demoAdminPass = hashPassword('password123');
      await client.query(`
        INSERT INTO users (id, client_id, name, email, password_hash, phone, role, auth_provider, delete_flag, blood_type, allergies, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, medical_notes) VALUES
        ('11111111-1111-4111-a111-111111111111', '00000000-0000-0000-0000-000000000001', 'Priya Rao', 'patient@arogyavahini.in', $1, '+91 98765 43210', 'patient', 'local', false, 'B+', 'Penicillin, NSAIDs (Aspirin)', 'Rajesh Rao', '+91 98451 98765', 'Spouse', 'Mild seasonal asthma; carries inhaler'),
        ('22222222-2222-4222-a222-222222222222', '00000000-0000-0000-0000-000000000001', 'Mohammed Irfan', 'driver@arogyavahini.in', $2, '+91 97410 54321', 'driver', 'local', false, 'O+', 'None', 'HQ Dispatch', '+91 80 2200 1122', 'Dispatch Supervisor', ''),
        ('33333333-3333-4333-a333-333333333333', '00000000-0000-0000-0000-000000000001', 'Dr. Arvind Deshmukh', 'admin@arogyavahini.in', $3, '+91 98111 22334', 'admin', 'local', false, 'A+', 'None', 'HQ Security', '+91 80 2200 1122', 'Command Center', '')
        ON CONFLICT (email) DO NOTHING;
      `, [demoPatientPass, demoDriverPass, demoAdminPass]);
    }

    // 9. Seed demo ambulances into PostgreSQL if empty
    const ambCountRes = await client.query('SELECT COUNT(*) as count FROM ambulances');
    if (parseInt(ambCountRes.rows[0].count, 10) === 0) {
      console.log('🌱 [Database] Seeding unified fleet in Neon PostgreSQL...');
      await client.query(`
        INSERT INTO ambulances (id, vehicle_number, driver_user_id, driver_name, phone, type, base_location, status, current_latitude, current_longitude) VALUES
        (1, 'KA-01-EA-1008', '22222222-2222-4222-a222-222222222222', 'Mohammed Irfan', '+91 97410 54321', 'Advanced Cardiac Life Support (ACLS)', 'Central Trauma Center, Block A', 'AVAILABLE', 12.9716, 77.5946),
        (2, 'KA-05-EM-2044', NULL, 'Suresh Gowda', '+91 98860 67890', 'Basic Life Support (BLS)', 'Indiranagar Emergency Hub', 'AVAILABLE', 12.9783, 77.6408),
        (3, 'KA-03-AX-3091', NULL, 'Ramesh Kumar', '+91 98450 12345', 'Critical Care Response Unit', 'Jayanagar General Hospital', 'AVAILABLE', 12.9250, 77.5938),
        (4, 'KA-04-ICU-4412', NULL, 'Anand Verma', '+91 99000 88776', 'Neonatal & Trauma ICU Mobile', 'Whitefield Rapid Response Station', 'AVAILABLE', 12.9698, 77.7499)
        ON CONFLICT (id) DO NOTHING;
      `);
      try {
        await client.query("SELECT setval(pg_get_serial_sequence('ambulances', 'id'), COALESCE(MAX(id), 1)) FROM ambulances;");
      } catch { /* sequence might not exist */ }
    }

    // 10. Seed hospitals into PostgreSQL if empty
    const hospCountRes = await client.query('SELECT COUNT(*) as count FROM hospitals');
    if (parseInt(hospCountRes.rows[0].count, 10) === 0) {
      console.log('🌱 [Database] Seeding hospitals in Neon PostgreSQL...');
      await client.query(`
        INSERT INTO hospitals (id, name, specialty, address, latitude, longitude, phone, total_beds, available_beds, ward_capacity, rating, type) VALUES
        (1, 'Victoria Hospital & Trauma Emergency Centre', 'Level-1 Government Trauma & Acute Resuscitation', 'Fort Road, Near City Market, Kalasipalya, Bengaluru 560002', 12.9634, 77.5746, '+91 80 2670 1150', 45, 16, 'AVAILABLE', 4.8, 'Apex Trauma Center'),
        (2, 'Bowring & Lady Curzon Emergency Hospital', 'Cardiac Emergency & Neuro-Trauma', 'Lady Curzon Rd, Tasker Town, Shivaji Nagar, Bengaluru 560001', 12.9839, 77.6025, '+91 80 2559 1325', 30, 8, 'AVAILABLE', 4.6, 'Emergency Critical Care'),
        (3, 'Manipal Hospital Bengaluru', 'Advanced Cardiac, Stroke & Multi-Organ ICU', '98, HAL Old Airport Rd, Kodihalli, Bengaluru 560017', 12.9590, 77.6531, '+91 80 2502 4444', 35, 12, 'AVAILABLE', 4.9, 'Multi-Specialty Emergency Hospital'),
        (4, 'Metro Apex Multi-Specialty & Trauma Center', 'Apex Level 1 Trauma & Critical Care', 'MG Road Medical Corridor, Bengaluru', 12.9755, 77.5980, '+91 80 2558 1008', 25, 14, 'AVAILABLE', 4.8, 'Apex Level 1 Trauma Hospital'),
        (5, 'Regional Cardiac & Critical Care Hospital', 'Apex Interventional Cardiology & Cardiac ICU', 'Indiranagar 100ft Road, Bengaluru', 12.9784, 77.6408, '+91 80 2520 2044', 18, 8, 'AVAILABLE', 4.7, 'Specialized Cardiac Hospital'),
        (6, 'City General Emergency Hospital', 'Comprehensive Emergency & Advanced ICU', 'Jayanagar 4th Block, Bengaluru', 12.9250, 77.5938, '+91 80 2656 3091', 30, 0, 'FULL', 4.4, 'Public Emergency Hospital')
        ON CONFLICT (id) DO NOTHING;
      `);
      try {
        await client.query("SELECT setval(pg_get_serial_sequence('hospitals', 'id'), COALESCE(MAX(id), 1)) FROM hospitals;");
      } catch { /* sequence might not exist */ }
    }

    console.log('✅ [Database] Neon PostgreSQL schemas verified and seeded.');
  } finally {
    client.release();
  }
}

/**
 * Fail-fast database startup verification.
 * Connects directly to PostgreSQL, tests with a real query, and initializes schemas.
 * If DATABASE_URL is missing, invalid, or unreachable, throws a clear error.
 */
export async function ensureDatabaseReady(): Promise<void> {
  if (!isPostgresConfigured) {
    const msg = '❌ [Database Fatal] PostgreSQL is not configured! DATABASE_URL or POSTGRES_URL environment variable must be set.';
    console.error(msg);
    throw new Error(msg);
  }

  console.log('🐘 [Database] Connecting to PostgreSQL and verifying schemas...');
  const pool = getPostgresPool();
  // Execute a real query against the configured PostgreSQL connection
  await pool.query('SELECT 1');
  await initPostgresSchema(pool);
  console.log('✅ [Database] PostgreSQL connected and schemas verified successfully.');
}

/**
 * Reset demo records directly in PostgreSQL while preserving users
 */
export async function resetDatabase(): Promise<void> {
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM activity_logs;');
    await client.query('DELETE FROM notifications;');
    await client.query('DELETE FROM emergency_requests;');
    await client.query("UPDATE ambulances SET status = 'AVAILABLE';");
    await client.query("UPDATE hospitals SET ward_capacity = 'AVAILABLE', available_beds = 12 WHERE ward_capacity = 'FULL' AND id != 6;");
    await client.query('COMMIT');
    console.log('✅ [Database] Demo records reset successfully in PostgreSQL.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'arogyavahini.sqlite');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Could not read existing SQLite database file, creating fresh in-memory database:', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initializeSchema(dbInstance);
  saveDb(dbInstance);
  return dbInstance;
}

export function saveDb(db: Database) {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

function initializeSchema(db: Database) {
  // Create Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('patient', 'driver', 'admin')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Ambulances table with driver_user_id
  db.run(`
    CREATE TABLE IF NOT EXISTS ambulances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_number TEXT UNIQUE NOT NULL,
      driver_user_id INTEGER,
      driver_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      type TEXT DEFAULT 'Basic Life Support (BLS)',
      base_location TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('AVAILABLE', 'ASSIGNED', 'BUSY', 'MAINTENANCE')) DEFAULT 'AVAILABLE',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_user_id) REFERENCES users(id)
    );
  `);

  // Create or Migrate EmergencyRequests table
  migrateEmergencyRequestsTable(db);
  ensureRouteOptimizationColumns(db);

  // Create ActivityLogs table for audit trail
  db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      emergency_id INTEGER,
      action TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      role TEXT CHECK(role IN ('patient', 'driver', 'admin')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      notification_type TEXT NOT NULL,
      emergency_request_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (emergency_request_id) REFERENCES emergency_requests(id)
    );
  `);

  seedInitialData(db);
}

function migrateEmergencyRequestsTable(db: Database) {
  try {
    const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='emergency_requests'");
    
    if (!tableCheck || tableCheck.length === 0 || !tableCheck[0].values || tableCheck[0].values.length === 0) {
      // Table doesn't exist, create it with new schema
      db.run(`
        CREATE TABLE emergency_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_id INTEGER,
          patient_name TEXT NOT NULL,
          emergency_type TEXT NOT NULL,
          location TEXT NOT NULL,
          latitude REAL,
          longitude REAL,
          phone TEXT NOT NULL,
          notes TEXT,
          driver_id INTEGER,
          ambulance_id INTEGER,
          status TEXT NOT NULL CHECK(status IN ('WAITING_FOR_DRIVER', 'DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED', 'COMPLETED', 'CANCELLED')) DEFAULT 'WAITING_FOR_DRIVER',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES users(id),
          FOREIGN KEY (driver_id) REFERENCES users(id),
          FOREIGN KEY (ambulance_id) REFERENCES ambulances(id)
        );
      `);
      return;
    }

    // Table exists: create new table with updated CHECK constraint and copy existing data
    const tableInfo = db.exec("PRAGMA table_info(emergency_requests)");
    const cols = tableInfo[0]?.values?.map((v: any[]) => v[1] as string) || [];
    const hasDriverId = cols.includes('driver_id');

    db.run(`
      CREATE TABLE emergency_requests_migration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        patient_name TEXT NOT NULL,
        emergency_type TEXT NOT NULL,
        location TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        phone TEXT NOT NULL,
        notes TEXT,
        driver_id INTEGER,
        ambulance_id INTEGER,
        status TEXT NOT NULL CHECK(status IN ('WAITING_FOR_DRIVER', 'DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED', 'COMPLETED', 'CANCELLED')) DEFAULT 'WAITING_FOR_DRIVER',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES users(id),
        FOREIGN KEY (driver_id) REFERENCES users(id),
        FOREIGN KEY (ambulance_id) REFERENCES ambulances(id)
      );
    `);

    const driverSelect = hasDriverId ? 'driver_id' : 'NULL as driver_id';

    db.run(`
      INSERT OR IGNORE INTO emergency_requests_migration (
        id, patient_id, patient_name, emergency_type, location, latitude, longitude, phone, notes, driver_id, ambulance_id, status, created_at, updated_at
      )
      SELECT 
        id, patient_id, patient_name, emergency_type, location, latitude, longitude, phone, notes,
        ${driverSelect},
        ambulance_id,
        CASE 
          WHEN status = 'REQUESTED' THEN 'WAITING_FOR_DRIVER'
          WHEN status IN ('AMBULANCE_ASSIGNED', 'ACCEPTED') THEN 'DRIVER_ACCEPTED'
          WHEN status IN ('WAITING_FOR_DRIVER', 'DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED', 'COMPLETED', 'CANCELLED') THEN status
          ELSE 'WAITING_FOR_DRIVER'
        END as status,
        created_at,
        updated_at
      FROM emergency_requests;
    `);

    db.run("DROP TABLE emergency_requests;");
    db.run("ALTER TABLE emergency_requests_migration RENAME TO emergency_requests;");
    console.log('Database migration complete: emergency_requests updated with WAITING_FOR_DRIVER and driver_id.');
  } catch (err) {
    console.error('Error during emergency_requests migration:', err);
  }
}

function ensureRouteOptimizationColumns(db: Database) {
  try {
    const tableInfo = db.exec("PRAGMA table_info(emergency_requests)");
    if (!tableInfo || tableInfo.length === 0 || !tableInfo[0].values) return;
    const cols = tableInfo[0].values.map((v: any[]) => v[1] as string);

    const columnsToAdd: [string, string][] = [
      ['route_origin', 'TEXT'],
      ['route_destination', 'TEXT'],
      ['optimized_routes', 'TEXT'],
      ['selected_route_id', 'TEXT'],
      ['current_eta_minutes', 'REAL'],
      ['current_distance_km', 'REAL'],
      ['current_traffic', 'TEXT'],
      ['hospital_routes', 'TEXT'],
      ['selected_hospital', 'TEXT'],
      ['navigation_started', 'INTEGER DEFAULT 0'],
      ['driver_current_latitude', 'REAL'],
      ['driver_current_longitude', 'REAL'],
      ['driver_accuracy', 'REAL'],
      ['navigation_stage', 'TEXT DEFAULT "TO_PATIENT"'],
      ['route_updated_at', 'TEXT'],
    ];

    for (const [colName, colType] of columnsToAdd) {
      if (!cols.includes(colName)) {
        db.run(`ALTER TABLE emergency_requests ADD COLUMN ${colName} ${colType};`);
      }
    }

    const ambInfo = db.exec("PRAGMA table_info(ambulances)");
    if (ambInfo && ambInfo[0]?.values) {
      const ambCols = ambInfo[0].values.map((v: any[]) => v[1] as string);
      const ambColsToAdd: [string, string][] = [
        ['current_latitude', 'REAL'],
        ['current_longitude', 'REAL'],
        ['last_gps_update', 'TEXT'],
      ];
      for (const [cName, cType] of ambColsToAdd) {
        if (!ambCols.includes(cName)) {
          db.run(`ALTER TABLE ambulances ADD COLUMN ${cName} ${cType};`);
        }
      }
    }
  } catch (err) {
    console.error('Error adding route optimization columns:', err);
  }
}

export function seedInitialData(db: Database) {
  // Check if users exist
  const userCheck = db.exec("SELECT COUNT(*) as count FROM users");
  const userCount = userCheck[0]?.values[0]?.[0] as number;

  if (userCount === 0) {
    console.log('Seeding standard user accounts...');
    db.run(`
      INSERT INTO users (id, name, email, password, phone, role) VALUES
      (1, 'Priya Rao', 'patient@arogyavahini.in', 'password123', '+91 98765 43210', 'patient'),
      (2, 'Mohammed Irfan', 'driver@arogyavahini.in', 'password123', '+91 97410 54321', 'driver'),
      (3, 'Dr. Arvind Deshmukh', 'admin@arogyavahini.in', 'password123', '+91 98111 22334', 'admin'),
      (4, 'Suresh Gowda', 'driver2@arogyavahini.in', 'password123', '+91 98860 67890', 'driver'),
      (5, 'Ramesh Kumar', 'driver3@arogyavahini.in', 'password123', '+91 98450 12345', 'driver'),
      (6, 'Anand Verma', 'driver4@arogyavahini.in', 'password123', '+91 99000 88776', 'driver');
    `);
  }

  // Check if ambulances exist
  const ambCheck = db.exec("SELECT COUNT(*) as count FROM ambulances");
  const ambCount = ambCheck[0]?.values[0]?.[0] as number;

  if (ambCount === 0) {
    console.log('Seeding unified fleet ambulances and driver assignments...');
    db.run(`
      INSERT INTO ambulances (id, vehicle_number, driver_user_id, driver_name, phone, type, base_location, status) VALUES
      (1, 'KA-01-EA-1008', 2, 'Mohammed Irfan', '+91 97410 54321', 'Advanced Cardiac Life Support (ACLS)', 'Central Trauma Center, Block A', 'AVAILABLE'),
      (2, 'KA-05-EM-2044', 4, 'Suresh Gowda', '+91 98860 67890', 'Basic Life Support (BLS)', 'Indiranagar Emergency Hub', 'AVAILABLE'),
      (3, 'KA-03-AX-3091', 5, 'Ramesh Kumar', '+91 98450 12345', 'Critical Care Response Unit', 'Jayanagar General Hospital', 'AVAILABLE'),
      (4, 'KA-04-ICU-4412', 6, 'Anand Verma', '+91 99000 88776', 'Neonatal & Trauma ICU Mobile', 'Whitefield Rapid Response Station', 'AVAILABLE');
    `);
  }

  // Check if sample emergencies exist
  const reqCheck = db.exec("SELECT COUNT(*) as count FROM emergency_requests");
  const reqCount = reqCheck[0]?.values[0]?.[0] as number;

  if (reqCount === 0) {
    console.log('Seeding initial resolved emergency log...');
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000).toISOString();

    db.run(`
      INSERT INTO emergency_requests (id, patient_id, patient_name, emergency_type, location, phone, notes, ambulance_id, status, created_at, updated_at) VALUES
      (1, 1, 'Priya Rao', 'Severe Trauma / Accident', 'MG Road Junction near Metro Pillar 140', '+91 98765 43210', 'Two wheeler collision, conscious with leg injury', 1, 'COMPLETED', '${twoHoursAgo}', '${twoHoursAgo}');
    `);

    db.run(`
      INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES
      (1, 'Emergency SOS requested by patient', 'Priya Rao', '${twoHoursAgo}'),
      (1, 'Ambulance KA-01-EA-1008 assigned to call', 'Arogyavahini Dispatch Engine', '${twoHoursAgo}'),
      (1, 'Request accepted by driver Mohammed Irfan', 'Mohammed Irfan', '${twoHoursAgo}'),
      (1, 'Ambulance reached hospital with patient', 'Mohammed Irfan', '${twoHoursAgo}');
    `);

    db.run(`
      INSERT INTO notifications (user_id, role, title, message, notification_type, emergency_request_id, is_read, created_at) VALUES
      (1, 'patient', 'Emergency Request Completed', 'Your emergency request has been completed.', 'EMERGENCY_COMPLETED', 1, 1, '${twoHoursAgo}'),
      (2, 'driver', 'Mission Completed', 'Hospital handover complete for emergency request #1. Ambulance is now ready on standby.', 'MISSION_COMPLETED', 1, 1, '${twoHoursAgo}'),
      (3, 'admin', 'Emergency Completed #1', 'Emergency request #1 has been successfully completed and resolved.', 'ADMIN_EMERGENCY_COMPLETED', 1, 1, '${twoHoursAgo}');
    `);
  }
}

// Reset database to default clean state
export async function resetDatabase(): Promise<void> {
  const db = await getDb();
  db.run(`DROP TABLE IF EXISTS notifications;`);
  db.run(`DROP TABLE IF EXISTS activity_logs;`);
  db.run(`DROP TABLE IF EXISTS emergency_requests;`);
  db.run(`DROP TABLE IF EXISTS ambulances;`);
  db.run(`DROP TABLE IF EXISTS users;`);
  
  initializeSchema(db);
  saveDb(db);
}

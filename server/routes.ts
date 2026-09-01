import { Router, Request, Response } from 'express';
import { getDb, saveDb, resetDatabase } from './db.js';

export const apiRouter = Router();

// Helper to convert sql.js QueryResults to array of objects
function formatQueryResult(result: any): any[] {
  if (!result || !result.columns || !result.values) return [];
  const columns = result.columns;
  return result.values.map((row: any[]) => {
    const obj: any = {};
    columns.forEach((col: string, index: number) => {
      obj[col] = row[index];
    });
    return obj;
  });
}

// ----------------------------------------------------
// 1. AUTHENTICATION & DEMO ROUTES
// ----------------------------------------------------

// POST /api/auth/register
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const assignedRole = role && ['patient', 'driver', 'admin'].includes(role) ? role : 'patient';
    const db = await getDb();

    // Check if email already exists
    const checkStmt = db.prepare('SELECT id FROM users WHERE email = :email');
    checkStmt.bind({ ':email': email.trim().toLowerCase() });
    if (checkStmt.step()) {
      checkStmt.free();
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    checkStmt.free();

    // Insert user
    db.run(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), password, phone || '', assignedRole]
    );
    saveDb(db);

    const userResult = db.exec('SELECT id, name, email, phone, role, created_at FROM users WHERE email = "' + email.trim().toLowerCase() + '"');
    const users = formatQueryResult(userResult[0]);
    const user = users[0];

    return res.status(201).json({
      message: 'Registration successful',
      user,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// POST /api/auth/login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await getDb();
    const query = db.exec(`SELECT id, name, email, phone, role, created_at FROM users WHERE email = '${email.trim().toLowerCase()}' AND password = '${password}'`);
    const users = formatQueryResult(query[0]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    return res.json({
      message: 'Login successful',
      user,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// POST /api/auth/demo/:role
apiRouter.post('/auth/demo/:role', async (req: Request, res: Response) => {
  try {
    const role = req.params.role;
    if (!['patient', 'driver', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid demo role. Use patient, driver, or admin.' });
    }

    const db = await getDb();
    const query = db.exec(`SELECT id, name, email, phone, role, created_at FROM users WHERE role = '${role}' LIMIT 1`);
    const users = formatQueryResult(query[0]);

    if (users.length === 0) {
      return res.status(404).json({ error: `No demo account found for role: ${role}` });
    }

    return res.json({
      message: `Demo logged in as ${role}`,
      user: users[0],
    });
  } catch (error: any) {
    console.error('Demo login error:', error);
    return res.status(500).json({ error: error.message || 'Demo login failed' });
  }
});

// ----------------------------------------------------
// 2. EMERGENCY REQUESTS & DRIVER DISPATCH WORKFLOW
// ----------------------------------------------------

// POST /api/emergency
// Creates emergency request in WAITING_FOR_DRIVER state with NO driver/ambulance assigned initially
apiRouter.post('/emergency', async (req: Request, res: Response) => {
  try {
    const { patient_id, patient_name, emergency_type, location, phone, notes, latitude, longitude } = req.body;

    if (!patient_name || !emergency_type || !location || !phone) {
      return res.status(400).json({ error: 'Patient name, emergency type, location, and phone are required.' });
    }

    const db = await getDb();
    const now = new Date().toISOString();
    const initialStatus = 'WAITING_FOR_DRIVER';

    // Insert emergency request with driver_id = NULL, ambulance_id = NULL
    db.run(
      `INSERT INTO emergency_requests 
       (patient_id, patient_name, emergency_type, location, latitude, longitude, phone, notes, driver_id, ambulance_id, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)`,
      [
        patient_id || null,
        patient_name.trim(),
        emergency_type,
        location.trim(),
        latitude || null,
        longitude || null,
        phone.trim(),
        notes ? notes.trim() : '',
        initialStatus,
        now,
        now,
      ]
    );

    // Fetch newly created emergency ID
    const idResult = db.exec("SELECT last_insert_rowid() as id");
    const emergencyId = idResult[0]?.values[0]?.[0];

    // Log activity
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        emergencyId,
        `Emergency SOS requested by ${patient_name.trim()}: ${emergency_type} at ${location.trim()}. Waiting for available ambulance driver to accept.`,
        patient_name.trim(),
        now,
      ]
    );

    saveDb(db);

    // Fetch complete record
    const fullQuery = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${emergencyId}
    `);

    const result = formatQueryResult(fullQuery[0]);

    return res.status(201).json({
      message: 'Emergency request received. Waiting for an available ambulance driver to accept your request.',
      emergency: result[0],
      ambulance: null,
    });
  } catch (error: any) {
    console.error('Create emergency error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create emergency request' });
  }
});

// POST /api/emergency/:id/accept
// Driver acceptance endpoint: binds the specific driver & ambulance to the request atomically
apiRouter.post('/emergency/:id/accept', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { driver_user_id, driver_name, ambulance_id } = req.body;

    const db = await getDb();

    // 1. Check if emergency exists and is still waiting for driver
    const checkQuery = db.exec(`SELECT * FROM emergency_requests WHERE id = ${id}`);
    const requests = formatQueryResult(checkQuery[0]);

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = requests[0];

    // Prevent multiple drivers accepting (Concurrency protection)
    if (emergency.ambulance_id !== null || emergency.driver_id !== null || emergency.status !== 'WAITING_FOR_DRIVER') {
      return res.status(409).json({ 
        error: 'This emergency request has already been accepted by another driver.' 
      });
    }

    // 2. Resolve driver's ambulance dynamically
    let targetAmbulance: any = null;

    if (ambulance_id) {
      const ambQuery = db.exec(`SELECT * FROM ambulances WHERE id = ${Number(ambulance_id)}`);
      const ambs = formatQueryResult(ambQuery[0]);
      if (ambs.length > 0) targetAmbulance = ambs[0];
    }

    if (!targetAmbulance && driver_user_id) {
      const ambQuery = db.exec(`SELECT * FROM ambulances WHERE driver_user_id = ${Number(driver_user_id)}`);
      const ambs = formatQueryResult(ambQuery[0]);
      if (ambs.length > 0) targetAmbulance = ambs[0];
    }

    if (!targetAmbulance && driver_name) {
      const ambQuery = db.exec(`SELECT * FROM ambulances WHERE LOWER(driver_name) LIKE '%${driver_name.toLowerCase().trim()}%'`);
      const ambs = formatQueryResult(ambQuery[0]);
      if (ambs.length > 0) targetAmbulance = ambs[0];
    }

    if (!targetAmbulance) {
      const ambQuery = db.exec("SELECT * FROM ambulances WHERE status = 'AVAILABLE' ORDER BY id ASC LIMIT 1");
      const ambs = formatQueryResult(ambQuery[0]);
      if (ambs.length > 0) targetAmbulance = ambs[0];
    }

    if (!targetAmbulance) {
      return res.status(400).json({ error: 'No active ambulance found to assign for this driver.' });
    }

    const resolvedDriverUserId = driver_user_id || targetAmbulance.driver_user_id || null;
    const now = new Date().toISOString();
    const actualDriverName = driver_name || targetAmbulance.driver_name;

    // 3. Atomically assign driver and ambulance and update status to DRIVER_ACCEPTED
    db.run(
      "UPDATE emergency_requests SET driver_id = ?, ambulance_id = ?, status = 'DRIVER_ACCEPTED', updated_at = ? WHERE id = ? AND status = 'WAITING_FOR_DRIVER' AND ambulance_id IS NULL",
      [resolvedDriverUserId, targetAmbulance.id, now, id]
    );

    // 4. Update ambulance status to BUSY
    db.run("UPDATE ambulances SET status = 'BUSY' WHERE id = ?", [targetAmbulance.id]);

    // 5. Add activity log
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        id,
        `Emergency accepted by driver ${actualDriverName} (Ambulance: ${targetAmbulance.vehicle_number})`,
        actualDriverName,
        now,
      ]
    );

    saveDb(db);

    // 6. Fetch updated record
    const fullQuery = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const updated = formatQueryResult(fullQuery[0]);

    return res.json({
      message: `Emergency accepted by ${actualDriverName}! Ambulance ${targetAmbulance.vehicle_number} is dispatched.`,
      emergency: updated[0],
      ambulance: targetAmbulance,
    });
  } catch (error: any) {
    console.error('Accept emergency error:', error);
    return res.status(500).json({ error: error.message || 'Failed to accept emergency request' });
  }
});

// GET /api/emergency
// Lists emergency requests (optional filter by patient_id, ambulance_id, or status)
apiRouter.get('/emergency', async (req: Request, res: Response) => {
  try {
    const { patient_id, ambulance_id, status } = req.query;
    const db = await getDb();

    let sql = `
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE 1=1
    `;

    if (patient_id) {
      sql += ` AND e.patient_id = ${Number(patient_id)}`;
    }
    if (ambulance_id) {
      sql += ` AND e.ambulance_id = ${Number(ambulance_id)}`;
    }
    if (status) {
      sql += ` AND e.status = '${status}'`;
    }

    sql += ` ORDER BY e.id DESC`;

    const query = db.exec(sql);
    const emergencies = formatQueryResult(query[0]);

    return res.json({
      count: emergencies.length,
      emergencies,
    });
  } catch (error: any) {
    console.error('Fetch emergencies error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch emergency requests' });
  }
});

// GET /api/emergency/:id
apiRouter.get('/emergency/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const db = await getDb();

    const query = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const emergencies = formatQueryResult(query[0]);
    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    // Fetch activity logs
    const logQuery = db.exec(`SELECT * FROM activity_logs WHERE emergency_id = ${id} ORDER BY id ASC`);
    const logs = formatQueryResult(logQuery[0]);

    return res.json({
      emergency: emergencies[0],
      logs,
    });
  } catch (error: any) {
    console.error('Fetch emergency detail error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch emergency details' });
  }
});

// PUT /api/emergency/:id/status
// Emergency status flow: WAITING_FOR_DRIVER -> DRIVER_ACCEPTED -> ON_THE_WAY -> REACHED -> COMPLETED
apiRouter.put('/emergency/:id/status', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status, updated_by, driver_ambulance_id } = req.body;

    const allowedStatuses = ['WAITING_FOR_DRIVER', 'DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED', 'COMPLETED', 'CANCELLED'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    const db = await getDb();

    // Check if emergency exists
    const checkQuery = db.exec(`SELECT * FROM emergency_requests WHERE id = ${id}`);
    const requests = formatQueryResult(checkQuery[0]);

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const currentRequest = requests[0];

    // Ownership check: If a driver tries to update an emergency not assigned to their ambulance
    if (driver_ambulance_id && currentRequest.ambulance_id && currentRequest.ambulance_id !== Number(driver_ambulance_id)) {
      return res.status(403).json({ error: 'You cannot update an emergency assigned to a different ambulance.' });
    }

    const now = new Date().toISOString();

    // Update emergency request status
    db.run("UPDATE emergency_requests SET status = ?, updated_at = ? WHERE id = ?", [status, now, id]);

    // Handle ambulance state transitions
    if (currentRequest.ambulance_id) {
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        // Free the ambulance back to AVAILABLE
        db.run("UPDATE ambulances SET status = 'AVAILABLE' WHERE id = ?", [currentRequest.ambulance_id]);
      } else if (['DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED'].includes(status)) {
        db.run("UPDATE ambulances SET status = 'BUSY' WHERE id = ?", [currentRequest.ambulance_id]);
      }
    }

    // If request had no ambulance and is now being assigned directly
    if (!currentRequest.ambulance_id && req.body.ambulance_id) {
      db.run("UPDATE emergency_requests SET ambulance_id = ? WHERE id = ?", [req.body.ambulance_id, id]);
      db.run("UPDATE ambulances SET status = 'BUSY' WHERE id = ?", [req.body.ambulance_id]);
    }

    // Add activity log
    const actor = updated_by || 'System / Driver';
    let logDescription = `Status updated to ${status}`;
    if (status === 'DRIVER_ACCEPTED') logDescription = 'Ambulance driver accepted dispatch request';
    if (status === 'ON_THE_WAY') logDescription = 'Ambulance en route with priority sirens active';
    if (status === 'REACHED') logDescription = 'Ambulance arrived at patient incident location';
    if (status === 'COMPLETED') logDescription = 'Emergency resolved and patient admitted to hospital trauma center';
    if (status === 'CANCELLED') logDescription = 'Emergency request cancelled';

    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [id, logDescription, actor, now]
    );

    saveDb(db);

    // Fetch updated record
    const updatedQuery = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const updated = formatQueryResult(updatedQuery[0]);

    return res.json({
      message: `Emergency status successfully updated to ${status}`,
      emergency: updated[0],
    });
  } catch (error: any) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update emergency status' });
  }
});

// ----------------------------------------------------
// 3. AMBULANCES MANAGEMENT
// ----------------------------------------------------

// GET /api/ambulances
apiRouter.get('/ambulances', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const query = db.exec("SELECT * FROM ambulances ORDER BY id ASC");
    const ambulances = formatQueryResult(query[0]);

    return res.json({
      count: ambulances.length,
      ambulances,
    });
  } catch (error: any) {
    console.error('Fetch ambulances error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch ambulances' });
  }
});

// GET /api/ambulances/available
apiRouter.get('/ambulances/available', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const query = db.exec("SELECT * FROM ambulances WHERE status = 'AVAILABLE' ORDER BY id ASC");
    const available = formatQueryResult(query[0]);

    return res.json({
      count: available.length,
      ambulances: available,
    });
  } catch (error: any) {
    console.error('Fetch available ambulances error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch available ambulances' });
  }
});

// POST /api/ambulances
apiRouter.post('/ambulances', async (req: Request, res: Response) => {
  try {
    const { vehicle_number, driver_name, phone, type, base_location, status, driver_user_id } = req.body;

    if (!vehicle_number || !driver_name || !phone || !base_location) {
      return res.status(400).json({ error: 'Vehicle number, driver name, phone, and base location are required.' });
    }

    const db = await getDb();
    const ambStatus = status || 'AVAILABLE';

    db.run(
      "INSERT INTO ambulances (vehicle_number, driver_name, phone, type, base_location, status, driver_user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [vehicle_number.trim(), driver_name.trim(), phone.trim(), type || 'Basic Life Support (BLS)', base_location.trim(), ambStatus, driver_user_id || null]
    );

    saveDb(db);

    const query = db.exec(`SELECT * FROM ambulances WHERE vehicle_number = '${vehicle_number.trim()}'`);
    const ambulances = formatQueryResult(query[0]);

    return res.status(201).json({
      message: 'Ambulance registered successfully',
      ambulance: ambulances[0],
    });
  } catch (error: any) {
    console.error('Create ambulance error:', error);
    return res.status(500).json({ error: error.message || 'Failed to add ambulance' });
  }
});

// PUT /api/ambulances/:id/status
apiRouter.put('/ambulances/:id/status', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const allowed = ['AVAILABLE', 'ASSIGNED', 'BUSY', 'MAINTENANCE'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid ambulance status. Allowed: ${allowed.join(', ')}` });
    }

    const db = await getDb();
    db.run("UPDATE ambulances SET status = ? WHERE id = ?", [status, id]);
    saveDb(db);

    const query = db.exec(`SELECT * FROM ambulances WHERE id = ${id}`);
    const ambulances = formatQueryResult(query[0]);

    return res.json({
      message: `Ambulance status updated to ${status}`,
      ambulance: ambulances[0],
    });
  } catch (error: any) {
    console.error('Update ambulance status error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update ambulance status' });
  }
});

// ----------------------------------------------------
// 4. STATS & ANALYTICS
// ----------------------------------------------------

// GET /api/stats
apiRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const db = await getDb();

    // Total emergencies
    const totalReqQuery = db.exec("SELECT COUNT(*) as total FROM emergency_requests");
    const totalEmergencies = (totalReqQuery[0]?.values[0]?.[0] as number) || 0;

    // Active emergencies (not COMPLETED or CANCELLED)
    const activeReqQuery = db.exec("SELECT COUNT(*) as active FROM emergency_requests WHERE status NOT IN ('COMPLETED', 'CANCELLED')");
    const activeEmergencies = (activeReqQuery[0]?.values[0]?.[0] as number) || 0;

    // Total Ambulances
    const totalAmbQuery = db.exec("SELECT COUNT(*) as total FROM ambulances");
    const totalAmbulances = (totalAmbQuery[0]?.values[0]?.[0] as number) || 0;

    // Available Ambulances
    const availAmbQuery = db.exec("SELECT COUNT(*) as avail FROM ambulances WHERE status = 'AVAILABLE'");
    const availableAmbulances = (availAmbQuery[0]?.values[0]?.[0] as number) || 0;

    // Assigned/Busy Ambulances
    const busyAmbQuery = db.exec("SELECT COUNT(*) as busy FROM ambulances WHERE status IN ('ASSIGNED', 'BUSY')");
    const busyAmbulances = (busyAmbQuery[0]?.values[0]?.[0] as number) || 0;

    // Completed emergencies
    const completedReqQuery = db.exec("SELECT COUNT(*) as comp FROM emergency_requests WHERE status = 'COMPLETED'");
    const completedEmergencies = (completedReqQuery[0]?.values[0]?.[0] as number) || 0;

    // Breakdown by emergency type
    const typeBreakdownQuery = db.exec("SELECT emergency_type, COUNT(*) as count FROM emergency_requests GROUP BY emergency_type");
    const typeBreakdown = formatQueryResult(typeBreakdownQuery[0]);

    return res.json({
      totalEmergencies,
      activeEmergencies,
      totalAmbulances,
      availableAmbulances,
      busyAmbulances,
      completedEmergencies,
      averageResponseTimeMinutes: 6.4,
      typeBreakdown,
    });
  } catch (error: any) {
    console.error('Fetch stats error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch statistics' });
  }
});

// ----------------------------------------------------
// 5. DEMO RESET
// ----------------------------------------------------

// POST /api/demo/reset
apiRouter.post('/demo/reset', async (req: Request, res: Response) => {
  try {
    await resetDatabase();
    return res.json({ message: 'Database reset to initial sample state with 4 ambulances and demo accounts!' });
  } catch (error: any) {
    console.error('Reset error:', error);
    return res.status(500).json({ error: error.message || 'Failed to reset database' });
  }
});

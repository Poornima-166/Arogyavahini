import { Router, Request, Response } from 'express';
import { getDb, saveDb, resetDatabase } from './db.js';
import { optimizeRoute, optimizeHospitals, calculateRouteScore, calculateGeoDistanceKm } from './routeOptimizer.js';
import { searchRealNearbyHospitals } from './hospitalSearch.js';

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

// Helper to safely parse JSON route fields in emergency records
function parseEmergencyRecord(e: any): any {
  if (!e) return e;
  const parsed = { ...e };
  if (typeof parsed.optimized_routes === 'string') {
    try {
      parsed.optimized_routes = JSON.parse(parsed.optimized_routes);
    } catch {
      parsed.optimized_routes = null;
    }
  }
  if (typeof parsed.hospital_routes === 'string') {
    try {
      parsed.hospital_routes = JSON.parse(parsed.hospital_routes);
    } catch {
      parsed.hospital_routes = null;
    }
  }

  // Ensure routes exist if emergency has been accepted / assigned
  if ((parsed.status === 'DRIVER_ACCEPTED' || parsed.status === 'ON_THE_WAY' || parsed.status === 'REACHED' || parsed.ambulance_id) && (!parsed.optimized_routes || parsed.optimized_routes.length === 0)) {
    const originLoc = parsed.route_origin || parsed.ambulance_base || 'Emergency Base Station';
    const destLoc = parsed.route_destination || parsed.location || 'Patient Incident Location';
    const driverCoords = (parsed.driver_current_latitude && parsed.driver_current_longitude)
      ? [parsed.driver_current_latitude, parsed.driver_current_longitude] as [number, number]
      : null;
    const patientCoords = (parsed.latitude && parsed.longitude)
      ? [parsed.latitude, parsed.longitude] as [number, number]
      : null;

    const routeOptResult = optimizeRoute(originLoc, destLoc, parsed.emergency_type || 'General', 0, driverCoords, patientCoords);
    const hospitalOptResult = optimizeHospitals(destLoc, parsed.emergency_type || 'General');
    
    parsed.optimized_routes = routeOptResult.allRoutes;
    parsed.selected_route_id = parsed.selected_route_id || routeOptResult.recommendedRoute.id;
    parsed.current_eta_minutes = parsed.current_eta_minutes || routeOptResult.recommendedRoute.estimatedMinutes;
    parsed.current_distance_km = parsed.current_distance_km || routeOptResult.recommendedRoute.distanceKm;
    parsed.current_traffic = parsed.current_traffic || routeOptResult.recommendedRoute.traffic;
    parsed.hospital_routes = hospitalOptResult.allHospitals;
    parsed.selected_hospital = parsed.selected_hospital || hospitalOptResult.recommendedHospital.name;
    parsed.route_origin = originLoc;
    parsed.route_destination = destLoc;
  }

  parsed.routes = parsed.optimized_routes || [];
  parsed.hospital_options = parsed.hospital_routes || [];
  parsed.hospital_destination = parsed.selected_hospital || null;
  parsed.current_stage = parsed.navigation_stage || (parsed.status === 'REACHED' ? 'TO_HOSPITAL' : 'TO_PATIENT');
  return parsed;
}

// Helper to create notifications in DB
function createNotification(
  db: any,
  params: {
    userId?: number | null;
    role?: 'patient' | 'driver' | 'admin';
    title: string;
    message: string;
    notificationType: string;
    emergencyRequestId?: number | null;
    isRead?: number;
  }
) {
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO notifications (user_id, role, title, message, notification_type, emergency_request_id, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.userId !== undefined ? params.userId : null,
      params.role || null,
      params.title,
      params.message,
      params.notificationType,
      params.emergencyRequestId !== undefined ? params.emergencyRequestId : null,
      params.isRead || 0,
      now,
    ]
  );
}

// Helper to notify all users with a specific role
function notifyRole(
  db: any,
  role: 'patient' | 'driver' | 'admin',
  params: {
    title: string;
    message: string;
    notificationType: string;
    emergencyRequestId?: number | null;
    excludeUserId?: number | null;
  }
) {
  const now = new Date().toISOString();
  let querySql = `SELECT id FROM users WHERE role = '${role}'`;
  if (params.excludeUserId) {
    querySql += ` AND id != ${params.excludeUserId}`;
  }
  const usersResult = db.exec(querySql);
  const users = formatQueryResult(usersResult[0]);

  if (users.length > 0) {
    for (const u of users) {
      db.run(
        `INSERT INTO notifications (user_id, role, title, message, notification_type, emergency_request_id, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          u.id,
          role,
          params.title,
          params.message,
          params.notificationType,
          params.emergencyRequestId || null,
          now,
        ]
      );
    }
  } else {
    db.run(
      `INSERT INTO notifications (user_id, role, title, message, notification_type, emergency_request_id, is_read, created_at)
       VALUES (NULL, ?, ?, ?, ?, ?, 0, ?)`,
      [
        role,
        params.title,
        params.message,
        params.notificationType,
        params.emergencyRequestId || null,
        now,
      ]
    );
  }
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

    const userResult = db.exec('SELECT id, name, email, phone, role, created_at FROM users WHERE email = "' + email.trim().toLowerCase() + '"');
    const users = formatQueryResult(userResult[0]);
    const user = users[0];

    // Notification for the newly registered user
    createNotification(db, {
      userId: user.id,
      role: assignedRole,
      title: 'Welcome to Arogyavahini',
      message: `Your account has been created successfully as ${assignedRole.toUpperCase()}. Emergency services are active.`,
      notificationType: 'USER_WELCOME',
    });

    // Notification for admins
    notifyRole(db, 'admin', {
      title: 'New User Registration',
      message: `New user registered: ${name.trim()} (${email.trim()}) as ${assignedRole.toUpperCase()}.`,
      notificationType: 'ADMIN_USER_REGISTERED',
      excludeUserId: user.id,
    });

    saveDb(db);

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

    // 1. Patient Notification: Exact user wording
    if (patient_id) {
      createNotification(db, {
        userId: Number(patient_id),
        role: 'patient',
        title: 'Emergency SOS Submitted',
        message: 'Your emergency request has been submitted successfully. Waiting for an available ambulance driver.',
        notificationType: 'EMERGENCY_CREATED',
        emergencyRequestId: Number(emergencyId),
      });
    }

    // 2. Driver Notification: Exact user wording
    notifyRole(db, 'driver', {
      title: 'New Emergency Alert',
      message: `New emergency request received near your service area.`,
      notificationType: 'NEW_EMERGENCY_BROADCAST',
      emergencyRequestId: Number(emergencyId),
    });

    // 3. Admin Notification: Incident alert
    notifyRole(db, 'admin', {
      title: `New SOS Broadcast #${emergencyId}`,
      message: `New emergency request submitted by ${patient_name.trim()}: ${emergency_type} at ${location.trim()}.`,
      notificationType: 'ADMIN_EMERGENCY_ALERT',
      emergencyRequestId: Number(emergencyId),
    });

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

    // 4. Dynamic AI Route Optimization (Origin: Ambulance Base -> Destination: Patient Location)
    const originLoc = targetAmbulance.base_location || 'Emergency Dispatch Base';
    const destLoc = emergency.location || 'Patient Incident Location';
    const routeOptResult = optimizeRoute(originLoc, destLoc, emergency.emergency_type || 'General');
    const hospitalOptResult = optimizeHospitals(destLoc, emergency.emergency_type || 'General');

    const recommendedRoute = routeOptResult.recommendedRoute;
    const recommendedHospital = hospitalOptResult.recommendedHospital;

    // Save generated routes and parameters
    db.run(
      `UPDATE emergency_requests SET 
        route_origin = ?,
        route_destination = ?,
        optimized_routes = ?,
        selected_route_id = ?,
        current_eta_minutes = ?,
        current_distance_km = ?,
        current_traffic = ?,
        hospital_routes = ?,
        selected_hospital = ?,
        route_updated_at = ?
       WHERE id = ?`,
      [
        originLoc,
        destLoc,
        JSON.stringify(routeOptResult.allRoutes),
        recommendedRoute.id,
        recommendedRoute.estimatedMinutes,
        recommendedRoute.distanceKm,
        recommendedRoute.traffic,
        JSON.stringify(hospitalOptResult.allHospitals),
        recommendedHospital.name,
        now,
        id,
      ]
    );

    // 5. Update ambulance status to BUSY
    db.run("UPDATE ambulances SET status = 'BUSY' WHERE id = ?", [targetAmbulance.id]);

    // 6. Add activity log with Route Optimization detail
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        id,
        `Emergency accepted by driver ${actualDriverName} (Ambulance: ${targetAmbulance.vehicle_number}). AI Route Generated: ${recommendedRoute.name} (${recommendedRoute.distanceKm} km, ETA: ${recommendedRoute.estimatedMinutes} min, Traffic: ${recommendedRoute.traffic})`,
        actualDriverName,
        now,
      ]
    );

    // 1. Patient Notification: Exact user wording & driver/ambulance details with AI Route notice
    if (emergency.patient_id) {
      createNotification(db, {
        userId: Number(emergency.patient_id),
        role: 'patient',
        title: 'Ambulance Driver Assigned',
        message: `An ambulance driver has accepted your emergency request. Driver: ${actualDriverName} | Ambulance: ${targetAmbulance.vehicle_number} (${targetAmbulance.phone}). Following AI-optimized route (ETA: ~${recommendedRoute.estimatedMinutes} mins).`,
        notificationType: 'DRIVER_ACCEPTED',
        emergencyRequestId: id,
      });
    }

    // 2. Driver Acceptance Confirmation: Exact user wording
    if (resolvedDriverUserId) {
      createNotification(db, {
        userId: Number(resolvedDriverUserId),
        role: 'driver',
        title: 'Emergency Request Accepted',
        message: 'You have successfully accepted the emergency request. AI route optimization active.',
        notificationType: 'DRIVER_ACCEPTED_CONFIRMATION',
        emergencyRequestId: id,
      });
    }

    // 3. Other Drivers Notification: Exact user wording
    notifyRole(db, 'driver', {
      title: 'Emergency Request Claimed',
      message: 'This emergency request has been accepted by another driver.',
      notificationType: 'EMERGENCY_CLAIMED_BY_OTHER',
      emergencyRequestId: id,
      excludeUserId: resolvedDriverUserId ? Number(resolvedDriverUserId) : null,
    });

    // 4. Admin Notification
    notifyRole(db, 'admin', {
      title: `Emergency Accepted #${id}`,
      message: `Emergency request #${id} accepted by driver ${actualDriverName} (Ambulance: ${targetAmbulance.vehicle_number}). AI Route: ${recommendedRoute.name} (ETA: ${recommendedRoute.estimatedMinutes} min).`,
      notificationType: 'ADMIN_EMERGENCY_ASSIGNED',
      emergencyRequestId: id,
    });

    saveDb(db);

    // 7. Fetch updated record
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

    const updated = formatQueryResult(fullQuery[0]).map(parseEmergencyRecord);

    return res.json({
      message: `Emergency accepted by ${actualDriverName}! Ambulance ${targetAmbulance.vehicle_number} is dispatched with AI Route Optimization.`,
      emergency: updated[0],
      ambulance: targetAmbulance,
      routeOptimization: routeOptResult,
      hospitalOptimization: hospitalOptResult,
    });
  } catch (error: any) {
    console.error('Accept emergency error:', error);
    return res.status(500).json({ error: error.message || 'Failed to accept emergency request' });
  }
});

// GET /api/nearby-hospitals
// Searches real hospitals nearby coordinates using OpenStreetMap Places / Google Places API
apiRouter.get('/nearby-hospitals', async (req: Request, res: Response) => {
  try {
    const lat = Number(req.query.lat || 12.9716);
    const lng = Number(req.query.lng || 77.5946);
    const emergencyType = (req.query.emergencyType as string) || 'General';
    const radius = Number(req.query.radius || 10000);

    const result = await searchRealNearbyHospitals(lat, lng, radius, emergencyType);
    return res.json(result);
  } catch (error: any) {
    console.error('Nearby hospitals search error:', error);
    return res.status(500).json({ error: error.message || 'Failed to search nearby hospitals' });
  }
});

// POST /api/emergency/:id/find-hospitals
// Fetches real nearby hospitals centered around patient emergency coordinates (or driver current location)
apiRouter.post('/emergency/:id/find-hospitals', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const db = await getDb();

    const query = db.exec(`SELECT * FROM emergency_requests WHERE id = ${id}`);
    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);
    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = emergencies[0];
    const searchLat = req.body.latitude || emergency.latitude || emergency.driver_current_latitude || 12.9716;
    const searchLng = req.body.longitude || emergency.longitude || emergency.driver_current_longitude || 77.5946;

    const result = await searchRealNearbyHospitals(
      Number(searchLat),
      Number(searchLng),
      10000,
      emergency.emergency_type || 'General'
    );

    const now = new Date().toISOString();
    const recommended = result.hospitals.find((h) => h.isRecommended) || result.hospitals[0];

    db.run(
      `UPDATE emergency_requests SET
        hospital_routes = ?,
        selected_hospital = COALESCE(selected_hospital, ?),
        updated_at = ?
       WHERE id = ?`,
      [JSON.stringify(result.hospitals), recommended?.name || null, now, id]
    );

    // Add activity log
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        id,
        `Real Nearby Hospitals searched around (${Number(searchLat).toFixed(4)}, ${Number(searchLng).toFixed(4)}): Found ${result.hospitals.length} facilities (${result.source})`,
        emergency.driver_name || 'Driver / Dispatch',
        now,
      ]
    );

    saveDb(db);

    const refetched = db.exec(`
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

    const updated = formatQueryResult(refetched[0]).map(parseEmergencyRecord)[0];

    return res.json({
      message: result.message,
      source: result.source,
      hospitals: result.hospitals,
      emergency: updated,
    });
  } catch (error: any) {
    console.error('Find nearby hospitals error:', error);
    return res.status(500).json({ error: error.message || 'Failed to search hospitals' });
  }
});

// POST /api/emergency/:id/navigate-to-hospital
// Transitions emergency to STAGE 2: Patient/Ambulance Location -> Selected Hospital
apiRouter.post('/emergency/:id/navigate-to-hospital', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { hospitalName, hospitalCoords, driverCoords } = req.body;
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

    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);
    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = emergencies[0];
    const targetHospital = hospitalName || emergency.selected_hospital || 'Emergency Trauma Hospital';
    
    // Origin is current ambulance GPS coords or patient coords
    const originLat = driverCoords?.latitude || emergency.driver_current_latitude || emergency.latitude || 12.9716;
    const originLng = driverCoords?.longitude || emergency.driver_current_longitude || emergency.longitude || 77.5946;
    const originLocation = `Patient Location (${emergency.location || 'Incident Site'})`;
    
    const hospCoords: [number, number] = hospitalCoords && hospitalCoords[0] && hospitalCoords[1]
      ? [hospitalCoords[0], hospitalCoords[1]]
      : [12.9647, 77.5753];

    // Compute Stage 2 Route Candidates
    const variationSeed = Math.floor(Math.random() * 1000) + 1;
    const routeOptResult = optimizeRoute(
      originLocation,
      targetHospital,
      emergency.emergency_type || 'General',
      variationSeed,
      [originLat, originLng],
      hospCoords
    );

    const recommended = routeOptResult.recommendedRoute;
    const now = new Date().toISOString();

    db.run(
      `UPDATE emergency_requests SET
        navigation_stage = 'TO_HOSPITAL',
        selected_hospital = ?,
        route_origin = ?,
        route_destination = ?,
        optimized_routes = ?,
        selected_route_id = ?,
        current_eta_minutes = ?,
        current_distance_km = ?,
        current_traffic = ?,
        route_updated_at = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        targetHospital,
        originLocation,
        targetHospital,
        JSON.stringify(routeOptResult.allRoutes),
        recommended.id,
        recommended.estimatedMinutes,
        recommended.distanceKm,
        recommended.traffic,
        now,
        now,
        id,
      ]
    );

    // Add activity log
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        id,
        `STAGE 2 NAVIGATION ACTIVATED: Transporting patient to ${targetHospital} (ETA: ${recommended.estimatedMinutes} mins, Distance: ${recommended.distanceKm} km)`,
        emergency.driver_name || 'Driver / Paramedic',
        now,
      ]
    );

    // Notify patient
    if (emergency.patient_id) {
      createNotification(db, {
        userId: Number(emergency.patient_id),
        role: 'patient',
        title: 'En Route to Hospital',
        message: `Ambulance is now navigating to ${targetHospital}. Estimated transit time: ~${recommended.estimatedMinutes} mins.`,
        notificationType: 'ON_THE_WAY',
        emergencyRequestId: id,
      });
    }

    saveDb(db);

    const refetched = db.exec(`
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

    const updated = formatQueryResult(refetched[0]).map(parseEmergencyRecord)[0];

    return res.json({
      message: `Stage 2 Navigation active towards ${targetHospital}`,
      emergency: updated,
      stage: 'TO_HOSPITAL',
      routeOptimization: routeOptResult,
    });
  } catch (error: any) {
    console.error('Navigate to hospital error:', error);
    return res.status(500).json({ error: error.message || 'Failed to start navigation to hospital' });
  }
});

// POST /api/emergency/:id/recalculate-route
// Driver clicks "Recalculate Route" or dynamic traffic changes occur
apiRouter.post('/emergency/:id/recalculate-route', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { origin, destination, originLatitude, originLongitude, destLatitude, destLongitude, stage } = req.body;
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

    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);
    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = emergencies[0];
    const originLoc = origin || emergency.route_origin || (emergency.driver_current_latitude ? 'Driver Live Location' : (emergency.ambulance_base || 'Emergency Base'));
    const destLoc = destination || emergency.route_destination || emergency.location;
    
    // Resolve origin and destination coordinates
    const originCoords: [number, number] | null = (originLatitude && originLongitude)
      ? [Number(originLatitude), Number(originLongitude)]
      : (emergency.driver_current_latitude && emergency.driver_current_longitude)
        ? [Number(emergency.driver_current_latitude), Number(emergency.driver_current_longitude)]
        : null;

    const destCoords: [number, number] | null = (destLatitude && destLongitude)
      ? [Number(destLatitude), Number(destLongitude)]
      : (emergency.latitude && emergency.longitude)
        ? [Number(emergency.latitude), Number(emergency.longitude)]
        : null;

    // Seed using timestamp for fresh live traffic simulation
    const variationSeed = Math.floor(Math.random() * 1000) + 1;
    const routeOptResult = optimizeRoute(
      originLoc,
      destLoc,
      emergency.emergency_type || 'General',
      variationSeed,
      originCoords,
      destCoords
    );

    const hospitalOptResult = optimizeHospitals(destLoc, emergency.emergency_type || 'General', variationSeed);
    const recommended = routeOptResult.recommendedRoute;
    const now = new Date().toISOString();
    const activeStage = stage || emergency.navigation_stage || 'TO_PATIENT';

    db.run(
      `UPDATE emergency_requests SET 
        route_origin = ?,
        route_destination = ?,
        optimized_routes = ?,
        selected_route_id = ?,
        current_eta_minutes = ?,
        current_distance_km = ?,
        current_traffic = ?,
        hospital_routes = ?,
        navigation_stage = ?,
        route_updated_at = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        originLoc,
        destLoc,
        JSON.stringify(routeOptResult.allRoutes),
        recommended.id,
        recommended.estimatedMinutes,
        recommended.distanceKm,
        recommended.traffic,
        JSON.stringify(hospitalOptResult.allHospitals),
        activeStage,
        now,
        now,
        id,
      ]
    );

    // Add activity log
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        id,
        `AI Route Recalculated: ${recommended.name} (ETA: ${recommended.estimatedMinutes} mins, Distance: ${recommended.distanceKm} km, Traffic: ${recommended.traffic})`,
        emergency.driver_name || 'Driver',
        now,
      ]
    );

    saveDb(db);

    const refetched = db.exec(`
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

    const updated = formatQueryResult(refetched[0]).map(parseEmergencyRecord)[0];

    return res.json({
      message: 'AI route updated based on live GPS and traffic conditions.',
      emergency: updated,
      routeOptimization: routeOptResult,
      hospitalOptimization: hospitalOptResult,
    });
  } catch (error: any) {
    console.error('Recalculate route error:', error);
    return res.status(500).json({ error: error.message || 'Failed to recalculate AI route' });
  }
});

// POST /api/emergency/:id/driver-location
// Driver continuously streams real-time GPS location
apiRouter.post('/emergency/:id/driver-location', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { latitude, longitude, accuracy } = req.body;

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    const db = await getDb();
    const now = new Date().toISOString();

    const query = db.exec(`SELECT * FROM emergency_requests WHERE id = ${id}`);
    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);
    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency not found' });
    }

    const emergency = emergencies[0];

    // Update emergency request driver coordinates
    db.run(
      `UPDATE emergency_requests SET
        driver_current_latitude = ?,
        driver_current_longitude = ?,
        driver_accuracy = ?,
        updated_at = ?
       WHERE id = ?`,
      [Number(latitude), Number(longitude), accuracy ? Number(accuracy) : null, now, id]
    );

    // Update ambulance table if linked
    if (emergency.ambulance_id) {
      db.run(
        `UPDATE ambulances SET
          current_latitude = ?,
          current_longitude = ?,
          last_gps_update = ?
         WHERE id = ?`,
        [Number(latitude), Number(longitude), now, emergency.ambulance_id]
      );
    }

    saveDb(db);

    return res.json({
      success: true,
      message: 'Driver GPS location updated successfully',
      location: {
        latitude: Number(latitude),
        longitude: Number(longitude),
        accuracy: accuracy ? Number(accuracy) : null,
        updated_at: now,
      },
    });
  } catch (error: any) {
    console.error('Driver location update error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update driver location' });
  }
});

// POST /api/emergency/:id/select-route
// Driver selects a specific route from the generated candidates
apiRouter.post('/emergency/:id/select-route', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { routeId } = req.body;

    if (!routeId) {
      return res.status(400).json({ error: 'Route ID is required' });
    }

    const db = await getDb();
    const query = db.exec(`SELECT * FROM emergency_requests WHERE id = ${id}`);
    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);

    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = emergencies[0];
    const allRoutes: any[] = emergency.optimized_routes || [];
    const targetRoute = allRoutes.find((r) => r.id === routeId);

    if (!targetRoute) {
      return res.status(400).json({ error: 'Selected route option not found among generated candidates.' });
    }

    const now = new Date().toISOString();
    db.run(
      `UPDATE emergency_requests SET 
        selected_route_id = ?,
        current_eta_minutes = ?,
        current_distance_km = ?,
        current_traffic = ?,
        route_updated_at = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        targetRoute.id,
        targetRoute.estimatedMinutes,
        targetRoute.distanceKm,
        targetRoute.traffic,
        now,
        now,
        id,
      ]
    );

    // Add activity log
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        id,
        `Driver selected navigation route: ${targetRoute.name} (${targetRoute.distanceKm} km, ETA: ${targetRoute.estimatedMinutes} min, Traffic: ${targetRoute.traffic})`,
        'Driver',
        now,
      ]
    );

    saveDb(db);

    const refetched = db.exec(`
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

    const updated = formatQueryResult(refetched[0]).map(parseEmergencyRecord)[0];

    return res.json({
      message: `Switched to ${targetRoute.name}`,
      emergency: updated,
      selectedRoute: targetRoute,
    });
  } catch (error: any) {
    console.error('Select route error:', error);
    return res.status(500).json({ error: error.message || 'Failed to switch route' });
  }
});

// POST /api/emergency/:id/start-navigation
// Driver starts turn-by-turn navigation
apiRouter.post('/emergency/:id/start-navigation', async (req: Request, res: Response) => {
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

    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);
    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = emergencies[0];
    const now = new Date().toISOString();

    db.run(
      "UPDATE emergency_requests SET status = 'ON_THE_WAY', navigation_started = 1, updated_at = ? WHERE id = ?",
      [now, id]
    );

    if (emergency.ambulance_id) {
      db.run("UPDATE ambulances SET status = 'BUSY' WHERE id = ?", [emergency.ambulance_id]);
    }

    // Add activity log
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        id,
        `Ambulance started navigation with sirens active towards ${emergency.location}`,
        emergency.driver_name || 'Driver',
        now,
      ]
    );

    // Patient notification
    if (emergency.patient_id) {
      createNotification(db, {
        userId: Number(emergency.patient_id),
        role: 'patient',
        title: 'Ambulance On The Way',
        message: `Your ambulance is following an AI-optimized route to reach you. Estimated arrival: ~${emergency.current_eta_minutes || 8} mins.`,
        notificationType: 'ON_THE_WAY',
        emergencyRequestId: id,
      });
    }

    // Admin notification
    notifyRole(db, 'admin', {
      title: `Navigation Active #${id}`,
      message: `Ambulance ${emergency.vehicle_number || ''} started navigation to ${emergency.location}. ETA: ${emergency.current_eta_minutes || 8} mins.`,
      notificationType: 'ADMIN_STATUS_UPDATE',
      emergencyRequestId: id,
    });

    saveDb(db);

    const refetched = db.exec(`
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

    const updated = formatQueryResult(refetched[0]).map(parseEmergencyRecord)[0];

    return res.json({
      message: 'Navigation started successfully. Sirens & green corridor active.',
      emergency: updated,
    });
  } catch (error: any) {
    console.error('Start navigation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to start navigation' });
  }
});

// POST /api/emergency/:id/select-hospital
// Selects and sets hospital destination for hospital transit stage
apiRouter.post('/emergency/:id/select-hospital', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { hospitalName, hospitalId } = req.body;

    if (!hospitalName) {
      return res.status(400).json({ error: 'Hospital name is required' });
    }

    const db = await getDb();
    const query = db.exec(`SELECT * FROM emergency_requests WHERE id = ${id}`);
    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);

    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = emergencies[0];
    const now = new Date().toISOString();

    db.run(
      "UPDATE emergency_requests SET selected_hospital = ?, updated_at = ? WHERE id = ?",
      [hospitalName, now, id]
    );

    // Add activity log
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        id,
        `Hospital destination selected: ${hospitalName}`,
        'Driver / Paramedic',
        now,
      ]
    );

    saveDb(db);

    const refetched = db.exec(`
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

    const updated = formatQueryResult(refetched[0]).map(parseEmergencyRecord)[0];

    return res.json({
      message: `Hospital destination set to ${hospitalName}`,
      emergency: updated,
    });
  } catch (error: any) {
    console.error('Select hospital error:', error);
    return res.status(500).json({ error: error.message || 'Failed to set hospital destination' });
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
    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);

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

    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);
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

    // Trigger Role-Specific Notifications based on Status
    if (status === 'ON_THE_WAY') {
      // 1. Patient Notification: Exact user wording
      if (currentRequest.patient_id) {
        createNotification(db, {
          userId: Number(currentRequest.patient_id),
          role: 'patient',
          title: 'Ambulance On The Way',
          message: 'Your ambulance is on the way.',
          notificationType: 'ON_THE_WAY',
          emergencyRequestId: id,
        });
      }
      // 2. Admin Notification
      notifyRole(db, 'admin', {
        title: `Ambulance En Route #${id}`,
        message: `Ambulance is now en route to ${currentRequest.location} for emergency #${id}.`,
        notificationType: 'ADMIN_STATUS_UPDATE',
        emergencyRequestId: id,
      });
    } else if (status === 'REACHED') {
      // 1. Patient Notification: Exact user wording
      if (currentRequest.patient_id) {
        createNotification(db, {
          userId: Number(currentRequest.patient_id),
          role: 'patient',
          title: 'Ambulance Arrived',
          message: 'Your ambulance has reached your location.',
          notificationType: 'REACHED',
          emergencyRequestId: id,
        });
      }
      // 2. Admin Notification
      notifyRole(db, 'admin', {
        title: `Ambulance At Scene #${id}`,
        message: `Ambulance reached incident scene for emergency request #${id} (${currentRequest.location}).`,
        notificationType: 'ADMIN_STATUS_UPDATE',
        emergencyRequestId: id,
      });
    } else if (status === 'COMPLETED') {
      // 1. Patient Notification: Exact user wording
      if (currentRequest.patient_id) {
        createNotification(db, {
          userId: Number(currentRequest.patient_id),
          role: 'patient',
          title: 'Emergency Request Completed',
          message: 'Your emergency request has been completed.',
          notificationType: 'EMERGENCY_COMPLETED',
          emergencyRequestId: id,
        });
      }
      // 2. Driver Notification
      if (currentRequest.driver_id) {
        createNotification(db, {
          userId: Number(currentRequest.driver_id),
          role: 'driver',
          title: 'Mission Completed',
          message: `Hospital handover complete for emergency request #${id}. Unit is now ready on standby.`,
          notificationType: 'MISSION_COMPLETED',
          emergencyRequestId: id,
        });
      }
      // 3. Admin Notification
      notifyRole(db, 'admin', {
        title: `Emergency Completed #${id}`,
        message: `Emergency request #${id} (${currentRequest.emergency_type} at ${currentRequest.location}) has been successfully completed.`,
        notificationType: 'ADMIN_EMERGENCY_COMPLETED',
        emergencyRequestId: id,
      });
    } else if (status === 'CANCELLED') {
      if (currentRequest.patient_id) {
        createNotification(db, {
          userId: Number(currentRequest.patient_id),
          role: 'patient',
          title: 'Emergency Request Cancelled',
          message: `Your emergency request #${id} has been cancelled.`,
          notificationType: 'EMERGENCY_CANCELLED',
          emergencyRequestId: id,
        });
      }
      if (currentRequest.driver_id) {
        createNotification(db, {
          userId: Number(currentRequest.driver_id),
          role: 'driver',
          title: 'Emergency Cancelled',
          message: `Emergency request #${id} was cancelled.`,
          notificationType: 'EMERGENCY_CANCELLED',
          emergencyRequestId: id,
        });
      }
      notifyRole(db, 'admin', {
        title: `Emergency Cancelled #${id}`,
        message: `Emergency request #${id} has been cancelled.`,
        notificationType: 'ADMIN_EMERGENCY_CANCELLED',
        emergencyRequestId: id,
      });
    }

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

    const updated = formatQueryResult(updatedQuery[0]).map(parseEmergencyRecord);

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

// ----------------------------------------------------
// 6. NOTIFICATIONS API
// ----------------------------------------------------

// GET /api/notifications
apiRouter.get('/notifications', async (req: Request, res: Response) => {
  try {
    const { userId, role, limit } = req.query;
    const db = await getDb();
    const maxLimit = limit ? Math.min(Number(limit), 100) : 50;

    let sql = 'SELECT * FROM notifications WHERE 1=1';

    if (role === 'admin') {
      if (userId) {
        sql += ` AND (role = 'admin' OR user_id = ${Number(userId)})`;
      } else {
        sql += ` AND role = 'admin'`;
      }
    } else if (role === 'driver') {
      if (userId) {
        sql += ` AND (user_id = ${Number(userId)} OR (role = 'driver' AND user_id IS NULL))`;
      } else {
        sql += ` AND role = 'driver'`;
      }
    } else if (role === 'patient') {
      if (userId) {
        sql += ` AND (user_id = ${Number(userId)} OR (role = 'patient' AND user_id IS NULL))`;
      } else {
        sql += ` AND role = 'patient'`;
      }
    } else if (userId) {
      sql += ` AND user_id = ${Number(userId)}`;
    }

    sql += ` ORDER BY id DESC LIMIT ${maxLimit}`;

    const query = db.exec(sql);
    const notifications = formatQueryResult(query[0]);

    // Calculate unread count
    let unreadCount = 0;
    for (const n of notifications) {
      if (!n.is_read) unreadCount++;
    }

    return res.json({
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/:id/read
apiRouter.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const db = await getDb();

    db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    saveDb(db);

    return res.json({ message: 'Notification marked as read', id });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ error: error.message || 'Failed to mark notification as read' });
  }
});

// POST /api/notifications/mark-all-read
apiRouter.post('/notifications/mark-all-read', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;
    const db = await getDb();

    let sql = 'UPDATE notifications SET is_read = 1 WHERE 1=1';
    if (role === 'admin') {
      if (userId) {
        sql += ` AND (role = 'admin' OR user_id = ${Number(userId)})`;
      } else {
        sql += ` AND role = 'admin'`;
      }
    } else if (role === 'driver') {
      if (userId) {
        sql += ` AND (user_id = ${Number(userId)} OR (role = 'driver' AND user_id IS NULL))`;
      } else {
        sql += ` AND role = 'driver'`;
      }
    } else if (role === 'patient') {
      if (userId) {
        sql += ` AND (user_id = ${Number(userId)} OR (role = 'patient' AND user_id IS NULL))`;
      } else {
        sql += ` AND role = 'patient'`;
      }
    } else if (userId) {
      sql += ` AND user_id = ${Number(userId)}`;
    }

    db.run(sql);
    saveDb(db);

    return res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Mark all read error:', error);
    return res.status(500).json({ error: error.message || 'Failed to mark all as read' });
  }
});

// DELETE /api/notifications/:id
apiRouter.delete('/notifications/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const db = await getDb();

    db.run('DELETE FROM notifications WHERE id = ?', [id]);
    saveDb(db);

    return res.json({ message: 'Notification deleted', id });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete notification' });
  }
});

// DELETE /api/notifications/clear-all
apiRouter.delete('/notifications/clear-all', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body || req.query;
    const db = await getDb();

    let sql = 'DELETE FROM notifications WHERE 1=1';
    if (role === 'admin') {
      if (userId) {
        sql += ` AND (role = 'admin' OR user_id = ${Number(userId)})`;
      } else {
        sql += ` AND role = 'admin'`;
      }
    } else if (role === 'driver') {
      if (userId) {
        sql += ` AND (user_id = ${Number(userId)} OR (role = 'driver' AND user_id IS NULL))`;
      } else {
        sql += ` AND role = 'driver'`;
      }
    } else if (role === 'patient') {
      if (userId) {
        sql += ` AND (user_id = ${Number(userId)} OR (role = 'patient' AND user_id IS NULL))`;
      } else {
        sql += ` AND role = 'patient'`;
      }
    } else if (userId) {
      sql += ` AND user_id = ${Number(userId)}`;
    }

    db.run(sql);
    saveDb(db);

    return res.json({ message: 'Notifications cleared successfully' });
  } catch (error: any) {
    console.error('Clear notifications error:', error);
    return res.status(500).json({ error: error.message || 'Failed to clear notifications' });
  }
});

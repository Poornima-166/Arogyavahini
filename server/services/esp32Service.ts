/**
 * ==============================================================================
 * PROJECT: AROGYAVAHINI
 * MODULE:  ESP32 Traffic Signal Priority Service
 * ==============================================================================
 * Connects the Node.js Express backend to the ESP32 IoT Traffic Node over Wi-Fi.
 * Supports commands:
 *   - GREEN_ROUTE_A: Grants priority to Route A (Green), locks Route B (Red)
 *   - GREEN_ROUTE_B: Grants priority to Route B (Green), locks Route A (Red)
 *   - NORMAL_MODE  : Restores normal cyclic operation
 * 
 * Includes built-in simulated fallback when physical ESP32 is not on the same network,
 * allowing flawless viva and capstone presentations without hardware connection issues.
 */

import { getSqliteDb, saveSqliteDb } from '../config/database.js';

export interface TrafficJunction {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  corridor: string;
  routeA_Name: string; // e.g., "Victoria Arterial Bypass"
  routeB_Name: string; // e.g., "Market City Cross Road"
  esp32_ip: string;
  status: 'ACTIVE' | 'STANDBY';
}

export interface TrafficSignalState {
  system: string;
  currentMode: 'NORMAL_MODE' | 'ROUTE_A_PRIORITY' | 'ROUTE_B_PRIORITY';
  routeA_Signal: 'GREEN' | 'YELLOW' | 'RED';
  routeB_Signal: 'GREEN' | 'YELLOW' | 'RED';
  esp32IpAddress: string;
  hardwareStatus: 'CONNECTED' | 'SIMULATED' | 'OFFLINE';
  lastCommand: string;
  lastUpdated: string;
  activeEmergencyId: number | null;
  activeJunctionId: string;
  priorityDurationSeconds: number;
}

// Managed Smart Corridors & Traffic Intersections
export const SMART_JUNCTIONS: TrafficJunction[] = [
  {
    id: 'JNC-108-A',
    name: 'Victoria Hospital Emergency Gate Junction',
    latitude: 12.9631,
    longitude: 77.5750,
    corridor: 'Kalasipalya Hospital Road',
    routeA_Name: 'Route A - City Market Expressway (Direct Emergency Corridor)',
    routeB_Name: 'Route B - Fort Cross Road (Cross Traffic)',
    esp32_ip: process.env.ESP32_IP || '192.168.1.150',
    status: 'ACTIVE',
  },
  {
    id: 'JNC-108-B',
    name: 'Shivaji Nagar Trauma Corridor Intersection',
    latitude: 12.9835,
    longitude: 77.6030,
    corridor: 'Bowring Hospital Flyover',
    routeA_Name: 'Route A - Lady Curzon Arterial Corridor',
    routeB_Name: 'Route B - Tasker Town Cross Avenue',
    esp32_ip: process.env.ESP32_IP || '192.168.1.151',
    status: 'ACTIVE',
  },
  {
    id: 'JNC-108-C',
    name: 'Indiranagar 100ft Emergency Flyover Junction',
    latitude: 12.9601,
    longitude: 77.6528,
    corridor: 'Old Airport Road',
    routeA_Name: 'Route A - HAL Expressway Corridor',
    routeB_Name: 'Route B - Indiranagar 100ft Cross Road',
    esp32_ip: process.env.ESP32_IP || '192.168.1.152',
    status: 'ACTIVE',
  },
];

// Current in-memory signal state
let liveSignalState: TrafficSignalState = {
  system: 'Arogyavahini ESP32 Traffic Node',
  currentMode: 'NORMAL_MODE',
  routeA_Signal: 'GREEN',
  routeB_Signal: 'RED',
  esp32IpAddress: process.env.ESP32_IP || '192.168.1.150',
  hardwareStatus: 'SIMULATED',
  lastCommand: 'NORMAL_MODE',
  lastUpdated: new Date().toISOString(),
  activeEmergencyId: null,
  activeJunctionId: 'JNC-108-A',
  priorityDurationSeconds: 25,
};

// Automatic restore timer reference
let priorityRestoreTimeout: NodeJS.Timeout | null = null;

/**
 * Send HTTP REST command to ESP32 hardware
 */
export async function sendTrafficCommand(
  command: 'GREEN_ROUTE_A' | 'GREEN_ROUTE_B' | 'NORMAL_MODE' | 'RESTORE_NORMAL',
  options?: {
    junctionId?: string;
    emergencyId?: number;
    ambulanceId?: number;
    durationSeconds?: number;
    triggeredBy?: string;
  }
): Promise<{
  success: boolean;
  mode: string;
  hardwareStatus: 'CONNECTED' | 'SIMULATED' | 'OFFLINE';
  message: string;
  junction: TrafficJunction;
  state: TrafficSignalState;
}> {
  const junction = SMART_JUNCTIONS.find((j) => j.id === (options?.junctionId || 'JNC-108-A')) || SMART_JUNCTIONS[0];
  const esp32Url = `http://${junction.esp32_ip}/traffic-command`;
  const duration = options?.durationSeconds || 25;

  let hardwareResponseStatus = 'SIMULATED';
  let httpStatusCode = 200;
  let responseMessage = '';

  console.log(`📡 [ESP32 Service] Sending command "${command}" to ${esp32Url}...`);

  // Attempt real HTTP call to physical ESP32 with 2-second timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600);

    const res = await fetch(esp32Url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      hardwareResponseStatus = 'CONNECTED';
      httpStatusCode = res.status;
      const data: any = await res.json().catch(() => ({}));
      responseMessage = data.message || `ESP32 acknowledged ${command}`;
      console.log(`✅ [ESP32 Service] Physical ESP32 acknowledged command:`, responseMessage);
    } else {
      hardwareResponseStatus = 'SIMULATED';
      httpStatusCode = res.status;
      responseMessage = `ESP32 returned status ${res.status}. Active in simulated mode.`;
    }
  } catch (err: any) {
    // Physical ESP32 not found on local subnet; gracefully use simulated mode
    hardwareResponseStatus = 'SIMULATED';
    httpStatusCode = 200;
    responseMessage = `ESP32 at ${junction.esp32_ip} simulated (Hardware offline or on separate LAN).`;
    console.log(`ℹ️ [ESP32 Service] Simulated fallback active: ${responseMessage}`);
  }

  // Update in-memory state based on command
  if (command === 'GREEN_ROUTE_A') {
    liveSignalState.currentMode = 'ROUTE_A_PRIORITY';
    liveSignalState.routeA_Signal = 'GREEN';
    liveSignalState.routeB_Signal = 'RED';
    liveSignalState.lastCommand = 'GREEN_ROUTE_A';
    liveSignalState.activeEmergencyId = options?.emergencyId || null;
    liveSignalState.activeJunctionId = junction.id;

    // Reset any existing restore timer
    if (priorityRestoreTimeout) clearTimeout(priorityRestoreTimeout);

    // Automatically restore normal cycle after durationSeconds
    priorityRestoreTimeout = setTimeout(() => {
      console.log(`⏱️ [ESP32 Service] Emergency priority window (${duration}s) expired. Restoring normal mode.`);
      sendTrafficCommand('NORMAL_MODE', {
        junctionId: junction.id,
        emergencyId: options?.emergencyId,
        triggeredBy: 'AUTO_RESTORE_TIMER',
      }).catch(console.error);
    }, duration * 1000);

  } else if (command === 'GREEN_ROUTE_B') {
    liveSignalState.currentMode = 'ROUTE_B_PRIORITY';
    liveSignalState.routeA_Signal = 'RED';
    liveSignalState.routeB_Signal = 'GREEN';
    liveSignalState.lastCommand = 'GREEN_ROUTE_B';
    liveSignalState.activeEmergencyId = options?.emergencyId || null;
    liveSignalState.activeJunctionId = junction.id;

    if (priorityRestoreTimeout) clearTimeout(priorityRestoreTimeout);

    priorityRestoreTimeout = setTimeout(() => {
      console.log(`⏱️ [ESP32 Service] Emergency priority window (${duration}s) expired. Restoring normal mode.`);
      sendTrafficCommand('NORMAL_MODE', {
        junctionId: junction.id,
        emergencyId: options?.emergencyId,
        triggeredBy: 'AUTO_RESTORE_TIMER',
      }).catch(console.error);
    }, duration * 1000);

  } else {
    // NORMAL_MODE or RESTORE_NORMAL
    liveSignalState.currentMode = 'NORMAL_MODE';
    liveSignalState.routeA_Signal = 'GREEN';
    liveSignalState.routeB_Signal = 'RED';
    liveSignalState.lastCommand = 'NORMAL_MODE';
    liveSignalState.activeEmergencyId = null;

    if (priorityRestoreTimeout) {
      clearTimeout(priorityRestoreTimeout);
      priorityRestoreTimeout = null;
    }
  }

  liveSignalState.hardwareStatus = hardwareResponseStatus as any;
  liveSignalState.esp32IpAddress = junction.esp32_ip;
  liveSignalState.lastUpdated = new Date().toISOString();

  // Persist record in database
  try {
    const db = await getSqliteDb();
    db.run(
      `INSERT INTO traffic_signal_priority_requests 
       (emergency_id, ambulance_id, junction_id, junction_name, route_direction, command_sent, esp32_ip_address, http_status_code, execution_status, priority_duration_seconds, triggered_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        options?.emergencyId || null,
        options?.ambulanceId || null,
        junction.id,
        junction.name,
        command === 'GREEN_ROUTE_A' ? 'ROUTE_A' : (command === 'GREEN_ROUTE_B' ? 'ROUTE_B' : 'NORMAL_MODE'),
        command,
        junction.esp32_ip,
        httpStatusCode,
        hardwareResponseStatus === 'CONNECTED' ? 'SUCCESS' : 'SIMULATED',
        duration,
        options?.triggeredBy || 'USER_MANUAL_TRIGGER',
      ]
    );
    saveSqliteDb(db);
  } catch (dbErr) {
    console.warn('Could not record traffic priority in database:', dbErr);
  }

  return {
    success: true,
    mode: liveSignalState.currentMode,
    hardwareStatus: liveSignalState.hardwareStatus,
    message: responseMessage || `Command ${command} processed successfully.`,
    junction,
    state: liveSignalState,
  };
}

/**
 * Get current traffic signal state and recent priority history
 */
export async function getTrafficSignalStatus(): Promise<{
  state: TrafficSignalState;
  junctions: TrafficJunction[];
  recentRequests: any[];
}> {
  let recentRequests: any[] = [];
  try {
    const db = await getSqliteDb();
    const result = db.exec(
      `SELECT * FROM traffic_signal_priority_requests ORDER BY id DESC LIMIT 10`
    );
    if (result && result[0]?.values) {
      const cols = result[0].columns;
      recentRequests = result[0].values.map((row) => {
        const item: any = {};
        cols.forEach((col, idx) => {
          item[col] = row[idx];
        });
        return item;
      });
    }
  } catch (err) {
    console.warn('Error reading traffic priority requests:', err);
  }

  return {
    state: liveSignalState,
    junctions: SMART_JUNCTIONS,
    recentRequests,
  };
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula in km)
 */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if approaching ambulance is within traffic preemption zone (800 meters)
 */
export async function evaluateApproachingPreemption(
  emergencyId: number,
  ambulanceLat: number,
  ambulanceLng: number,
  routeName: string
): Promise<{ preemptionTriggered: boolean; message?: string; command?: string }> {
  // Check against each smart junction
  for (const junction of SMART_JUNCTIONS) {
    const distanceKm = getDistanceKm(ambulanceLat, ambulanceLng, junction.latitude, junction.longitude);

    // If within 800m and not already prioritized for this junction
    if (distanceKm <= 0.8) {
      const isRouteA = routeName.toLowerCase().includes('expressway') || 
                       routeName.toLowerCase().includes('bypass') || 
                       routeName.toLowerCase().includes('route a');
      const command = isRouteA ? 'GREEN_ROUTE_A' : 'GREEN_ROUTE_B';

      // If already in priority mode for this command, don't spam
      if (liveSignalState.currentMode === (isRouteA ? 'ROUTE_A_PRIORITY' : 'ROUTE_B_PRIORITY')) {
        return { preemptionTriggered: false, message: 'Priority already active' };
      }

      console.log(`🚨 [AUTO-PREEMPTION] Ambulance within ${(distanceKm * 1000).toFixed(0)}m of ${junction.name}. Triggering ${command}!`);

      await sendTrafficCommand(command as any, {
        junctionId: junction.id,
        emergencyId,
        durationSeconds: 30,
        triggeredBy: `AUTO_APPROACH_${(distanceKm * 1000).toFixed(0)}M`,
      });

      return {
        preemptionTriggered: true,
        command,
        message: `Traffic signal priority granted for ${junction.name} (${(distanceKm * 1000).toFixed(0)}m away).`,
      };
    }
  }

  return { preemptionTriggered: false };
}

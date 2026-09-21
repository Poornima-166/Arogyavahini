import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { SMART_JUNCTIONS, sendTrafficCommand, getTrafficSignalStatus } from '../services/esp32Service.js';
import { calculateGeoDistanceKm } from '../routeOptimizer.js';

let ioInstance: SocketIOServer | null = null;

// Track active junction priority states to avoid re-triggering repeatedly
const junctionPriorityMap: Record<string, { active: boolean; emergencyId: number | null; triggeredAt: number }> = {};

export interface AmbulanceLocationPayload {
  ambulanceId: number;
  emergencyId?: number | null;
  driverId?: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number; // km/h
  heading?: number;
  timestamp?: string;
  source?: 'device_gps' | 'simulated';
}

export function initializeSocketIO(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Client registers role (patient, driver, admin)
    socket.on('join_role', (role: 'patient' | 'driver' | 'admin') => {
      socket.join(`role_${role}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined role room: role_${role}`);
    });

    // Client joins specific emergency room for targeted live updates
    socket.on('join_emergency', (emergencyId: string | number) => {
      const room = `emergency_${emergencyId}`;
      socket.join(room);
      console.log(`[Socket.IO] Socket ${socket.id} joined ${room}`);
    });

    socket.on('leave_emergency', (emergencyId: string | number) => {
      const room = `emergency_${emergencyId}`;
      socket.leave(room);
      console.log(`[Socket.IO] Socket ${socket.id} left ${room}`);
    });

    // Real-time GPS stream from driver's device (navigator.geolocation.watchPosition)
    socket.on('ambulance_location_update', async (data: AmbulanceLocationPayload) => {
      try {
        const enrichedPayload = {
          ...data,
          timestamp: data.timestamp || new Date().toISOString(),
        };

        // Broadcast to specific emergency room if on active mission
        if (data.emergencyId) {
          io.to(`emergency_${data.emergencyId}`).emit('ambulance_location_update', enrichedPayload);
        }

        // Broadcast to all admins and drivers
        io.to('role_admin').emit('ambulance_location_update', enrichedPayload);
        io.emit('fleet_ambulance_location', enrichedPayload);

        // Smart Geofence Traffic Signal Priority Check
        // If ambulance is within 800m (0.8km) of any smart junction along the route
        await checkTrafficJunctionApproach(data.latitude, data.longitude, data.emergencyId || null, data.ambulanceId);
      } catch (err) {
        console.error('[Socket.IO] Error handling ambulance_location_update:', err);
      }
    });

    // Driver mission status progression
    socket.on('ambulance_status_update', (data: {
      emergencyId: number;
      ambulanceId: number;
      status: string;
      driverName?: string;
      updatedAt?: string;
    }) => {
      console.log(`[Socket.IO] Status update for emergency #${data.emergencyId}: ${data.status}`);
      io.to(`emergency_${data.emergencyId}`).emit('ambulance_status_update', data);
      io.to('role_admin').emit('ambulance_status_update', data);
      io.to('role_driver').emit('ambulance_status_update', data);
    });

    // Route calculation update (dynamic rerouting, traffic avoidance)
    socket.on('route_updated', (data: {
      emergencyId: number;
      routeId: string;
      distanceKm: number;
      etaMinutes: number;
      traffic: string;
      coordinates: [number, number][];
      waypoints: string[];
    }) => {
      io.to(`emergency_${data.emergencyId}`).emit('route_updated', data);
      io.to('role_admin').emit('route_updated', data);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log('✅ Arogyavahini Socket.IO real-time engine initialized.');
  return io;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

/**
 * Evaluates ambulance GPS against smart traffic intersections.
 * When an active emergency ambulance approaches within 800m of a junction:
 * Automatically activates Green Corridor priority on ESP32 hardware and emits events.
 */
async function checkTrafficJunctionApproach(
  ambulanceLat: number,
  ambulanceLng: number,
  emergencyId: number | null,
  ambulanceId: number
) {
  if (!emergencyId) return; // Only trigger emergency priority for active SOS missions

  const APPROACH_RADIUS_KM = 0.8; // 800 meters
  const EXIT_RADIUS_KM = 0.15; // 150 meters (cleared junction)

  for (const junction of SMART_JUNCTIONS) {
    const dist = calculateGeoDistanceKm([ambulanceLat, ambulanceLng], [junction.latitude, junction.longitude]);
    const state = junctionPriorityMap[junction.id] || { active: false, emergencyId: null, triggeredAt: 0 };

    // 1. Approaching (< 800m) and not yet active for this junction
    if (dist <= APPROACH_RADIUS_KM && !state.active) {
      console.log(`🚨 [TRAFFIC PRIORITY] Ambulance #${ambulanceId} within ${(dist * 1000).toFixed(0)}m of ${junction.name}. Activating GREEN corridor.`);
      
      junctionPriorityMap[junction.id] = {
        active: true,
        emergencyId,
        triggeredAt: Date.now(),
      };

      // Send command to ESP32 hardware
      const result = await sendTrafficCommand('GREEN_ROUTE_A', {
        junctionId: junction.id,
        emergencyId: emergencyId || undefined,
        ambulanceId,
        durationSeconds: 30,
        triggeredBy: 'SOCKET_GEOFENCE_APPROACH',
      });

      // Broadcast Socket.IO event
      if (ioInstance) {
        const payload = {
          junctionId: junction.id,
          junctionName: junction.name,
          emergencyId,
          ambulanceId,
          distanceMeters: Math.round(dist * 1000),
          direction: 'ROUTE_A',
          priority: true,
          status: 'GREEN_ACTIVE',
          hardwareResponse: result,
          timestamp: new Date().toISOString(),
        };
        ioInstance.to(`emergency_${emergencyId}`).emit('traffic_priority_activated', payload);
        ioInstance.to('role_admin').emit('traffic_priority_activated', payload);
      }
    }
    // 2. Passed the junction (< 150m or moving away after being active for > 15 seconds)
    else if (state.active && state.emergencyId === emergencyId && (dist > APPROACH_RADIUS_KM + 0.2 || (dist < EXIT_RADIUS_KM && Date.now() - state.triggeredAt > 15000))) {
      console.log(`✅ [TRAFFIC PRIORITY] Ambulance #${ambulanceId} cleared junction ${junction.name}. Restoring normal cycle.`);
      
      junctionPriorityMap[junction.id] = {
        active: false,
        emergencyId: null,
        triggeredAt: 0,
      };

      await sendTrafficCommand('NORMAL_MODE', {
        junctionId: junction.id,
        emergencyId: emergencyId || undefined,
        ambulanceId,
        triggeredBy: 'SOCKET_GEOFENCE_CLEARED',
      });

      if (ioInstance) {
        const payload = {
          junctionId: junction.id,
          junctionName: junction.name,
          emergencyId,
          ambulanceId,
          status: 'NORMAL_RESTORED',
          timestamp: new Date().toISOString(),
        };
        ioInstance.to(`emergency_${emergencyId}`).emit('traffic_priority_completed', payload);
        ioInstance.to('role_admin').emit('traffic_priority_completed', payload);
      }
    }
  }
}

// Global broadcasting helpers for backend controllers
export function broadcastAmbulanceLocation(data: AmbulanceLocationPayload) {
  if (!ioInstance) return;
  const enrichedPayload = {
    ...data,
    timestamp: data.timestamp || new Date().toISOString(),
  };

  // Broadcast to specific emergency room if on active mission
  if (data.emergencyId) {
    ioInstance.to(`emergency_${data.emergencyId}`).emit('ambulance_location_update', enrichedPayload);
  }

  // Broadcast to all admins and drivers and global fleet listeners
  ioInstance.to('role_admin').emit('ambulance_location_update', enrichedPayload);
  ioInstance.to('role_driver').emit('ambulance_location_update', enrichedPayload);
  ioInstance.emit('fleet_ambulance_location', enrichedPayload);
}

export function broadcastEmergencyCreated(emergency: any) {
  if (!ioInstance) return;
  ioInstance.emit('emergency_created', emergency);
  ioInstance.to('role_driver').emit('emergency_created', emergency);
  ioInstance.to('role_admin').emit('emergency_created', emergency);
}

export function broadcastEmergencyAssigned(emergency: any, ambulance: any) {
  if (!ioInstance) return;
  const payload = { emergency, ambulance, timestamp: new Date().toISOString() };
  ioInstance.to(`emergency_${emergency.id}`).emit('emergency_assigned', payload);
  ioInstance.to('role_driver').emit('emergency_assigned', payload);
  ioInstance.to('role_admin').emit('emergency_assigned', payload);
}

export function broadcastAmbulanceStatus(
  arg1: any,
  ambulanceId?: number,
  status?: string,
  updatedBy?: string
) {
  if (!ioInstance) return;
  const payload =
    typeof arg1 === 'object' && arg1 !== null
      ? arg1
      : {
          emergencyId: Number(arg1),
          ambulanceId: ambulanceId || 0,
          status: status || '',
          updatedBy,
          timestamp: new Date().toISOString(),
        };
  if (payload.emergencyId) {
    ioInstance.to(`emergency_${payload.emergencyId}`).emit('ambulance_status_update', payload);
  }
  ioInstance.emit('ambulance_status_update', payload);
  ioInstance.to('role_admin').emit('ambulance_status_update', payload);
  ioInstance.to('role_driver').emit('ambulance_status_update', payload);
}

export function broadcastRouteUpdated(
  emergencyId: number,
  routeIdOrData: any,
  distanceKm?: number,
  estimatedMinutes?: number,
  traffic?: string,
  coordinates?: [number, number][],
  waypoints?: string[]
) {
  if (!ioInstance) return;
  const payload =
    typeof routeIdOrData === 'object' && routeIdOrData !== null
      ? { ...routeIdOrData, emergencyId, timestamp: new Date().toISOString() }
      : {
          emergencyId,
          routeId: routeIdOrData,
          distanceKm,
          estimatedMinutes,
          traffic,
          coordinates,
          waypoints,
          timestamp: new Date().toISOString(),
        };
  ioInstance.to(`emergency_${emergencyId}`).emit('route_updated', payload);
  ioInstance.to('role_admin').emit('route_updated', payload);
}

export function broadcastTrafficPriorityActivated(data: any) {
  if (!ioInstance) return;
  ioInstance.emit('traffic_priority_activated', data);
}

export function broadcastTrafficPriorityCompleted(data: any) {
  if (!ioInstance) return;
  ioInstance.emit('traffic_priority_completed', data);
}

export function broadcastPatientVitalsUpdated(emergencyId: number, data: any) {
  if (!ioInstance) return;
  const payload = {
    emergencyId,
    ...data,
    timestamp: new Date().toISOString(),
  };
  ioInstance.to(`emergency_${emergencyId}`).emit('patient_vitals_updated', payload);
  ioInstance.to('role_admin').emit('patient_vitals_updated', payload);
  ioInstance.emit('patient_vitals_updated', payload);
}


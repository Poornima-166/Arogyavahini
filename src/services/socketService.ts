import { io, Socket } from 'socket.io-client';

export interface AmbulanceLocationData {
  ambulanceId: number;
  emergencyId?: number | null;
  driverId?: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp?: string;
  source?: 'device_gps' | 'simulated';
}

export interface EmergencySocketPayload {
  id: number;
  patient_id?: number;
  patient_name: string;
  emergency_type: string;
  location: string;
  latitude: number;
  longitude: number;
  phone: string;
  notes?: string;
  status: string;
  created_at?: string;
}

export interface TrafficPriorityEventPayload {
  junctionId: string;
  junctionName: string;
  emergencyId: number;
  ambulanceId: number;
  distanceMeters?: number;
  direction?: string;
  priority?: boolean;
  status: string;
  hardwareResponse?: any;
  timestamp: string;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private connectionListeners: Set<(connected: boolean) => void> = new Set();

  public connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // Connect to same origin (handles proxy & port 3000 in development and production)
    this.socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log(`[SocketService] Connected to real-time server with ID: ${this.socket?.id}`);
      this.notifyConnectionListeners(true);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.warn(`[SocketService] Disconnected from real-time server: ${reason}`);
      this.notifyConnectionListeners(false);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[SocketService] Connection warning:', error.message);
      this.isConnected = false;
      this.notifyConnectionListeners(false);
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }

  public onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.add(listener);
    listener(this.isConnected);
    return () => this.connectionListeners.delete(listener);
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach((fn) => {
      try {
        fn(connected);
      } catch (e) {
        console.error('Error in socket connection listener:', e);
      }
    });
  }

  // Room management
  public joinRole(role: 'patient' | 'driver' | 'admin') {
    const s = this.getSocket();
    s?.emit('join_role', role);
  }

  public joinEmergency(emergencyId: number | string) {
    const s = this.getSocket();
    s?.emit('join_emergency', emergencyId);
  }

  public leaveEmergency(emergencyId: number | string) {
    const s = this.getSocket();
    s?.emit('leave_emergency', emergencyId);
  }

  // Emitters
  public emitAmbulanceLocation(data: AmbulanceLocationData) {
    const s = this.getSocket();
    s?.emit('ambulance_location_update', data);
  }

  public emitAmbulanceStatus(data: {
    emergencyId: number;
    ambulanceId: number;
    status: string;
    driverName?: string;
  }) {
    const s = this.getSocket();
    s?.emit('ambulance_status_update', {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  public emitRouteUpdate(data: {
    emergencyId: number;
    routeId: string;
    distanceKm: number;
    etaMinutes: number;
    traffic: string;
    coordinates: [number, number][];
    waypoints: string[];
  }) {
    const s = this.getSocket();
    s?.emit('route_updated', data);
  }

  // Listeners
  public onEmergencyCreated(callback: (emergency: EmergencySocketPayload) => void): () => void {
    const s = this.getSocket();
    s?.on('emergency_created', callback);
    return () => s?.off('emergency_created', callback);
  }

  public onEmergencyAssigned(callback: (data: { emergency: any; ambulance: any }) => void): () => void {
    const s = this.getSocket();
    s?.on('emergency_assigned', callback);
    return () => s?.off('emergency_assigned', callback);
  }

  public onAmbulanceLocationUpdate(callback: (data: AmbulanceLocationData) => void): () => void {
    const s = this.getSocket();
    s?.on('ambulance_location_update', callback);
    s?.on('fleet_ambulance_location', callback);
    return () => {
      s?.off('ambulance_location_update', callback);
      s?.off('fleet_ambulance_location', callback);
    };
  }

  public onAmbulanceStatusUpdate(callback: (data: { emergencyId: number; ambulanceId: number; status: string }) => void): () => void {
    const s = this.getSocket();
    s?.on('ambulance_status_update', callback);
    return () => s?.off('ambulance_status_update', callback);
  }

  public onRouteUpdated(callback: (data: any) => void): () => void {
    const s = this.getSocket();
    s?.on('route_updated', callback);
    return () => s?.off('route_updated', callback);
  }

  public onTrafficPriorityActivated(callback: (data: TrafficPriorityEventPayload) => void): () => void {
    const s = this.getSocket();
    s?.on('traffic_priority_activated', callback);
    return () => s?.off('traffic_priority_activated', callback);
  }

  public onTrafficPriorityCompleted(callback: (data: any) => void): () => void {
    const s = this.getSocket();
    s?.on('traffic_priority_completed', callback);
    return () => s?.off('traffic_priority_completed', callback);
  }

  public onPatientVitalsUpdated(callback: (data: any) => void): () => void {
    const s = this.getSocket();
    s?.on('patient_vitals_updated', callback);
    return () => s?.off('patient_vitals_updated', callback);
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const socketService = new SocketService();

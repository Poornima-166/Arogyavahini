import { User, Ambulance, EmergencyRequest, ActivityLog, SystemStats, CreateEmergencyInput, UserRole, EmergencyStatus, AmbulanceStatus, AppNotification, HospitalOption, EmergencyReport, Hospital, WardCapacityStatus, AmbulanceRatingInput } from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Notifications
  async getNotifications(params?: { userId?: number; role?: UserRole; limit?: number }): Promise<{ count: number; unreadCount: number; notifications: AppNotification[] }> {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId.toString());
    if (params?.role) query.set('role', params.role);
    if (params?.limit) query.set('limit', params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/notifications${queryString}`);
    return handleResponse(res);
  },

  async markNotificationRead(id: number): Promise<{ message: string; id: number }> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
    });
    return handleResponse(res);
  },

  async markAllNotificationsRead(params: { userId?: number; role?: UserRole }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async deleteNotification(id: number): Promise<{ message: string; id: number }> {
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async clearAllNotifications(params: { userId?: number; role?: UserRole }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/notifications/clear-all`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  // Auth
  async login(email: string, password: string): Promise<{ user: User; message: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async register(data: { name: string; email: string; password: string; phone?: string; role?: UserRole }): Promise<{ user: User; message: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async demoLogin(role: UserRole): Promise<{ user: User; message: string }> {
    const res = await fetch(`${API_BASE}/auth/demo/${role}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  // Patient Medical Profile Management
  async getPatientProfile(userId: number): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/patient/profile/${userId}`);
    return handleResponse(res);
  },

  async updatePatientProfile(userId: number, profileData: Partial<User>): Promise<{ user: User; message: string }> {
    const res = await fetch(`${API_BASE}/patient/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    return handleResponse(res);
  },

  // Emergency Requests
  async createEmergency(input: CreateEmergencyInput): Promise<{ message: string; emergency: EmergencyRequest; ambulance?: Ambulance }> {
    const res = await fetch(`${API_BASE}/emergency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse(res);
  },

  async getEmergencies(params?: { patient_id?: number; ambulance_id?: number; status?: string }): Promise<{ count: number; emergencies: EmergencyRequest[] }> {
    const query = new URLSearchParams();
    if (params?.patient_id) query.set('patient_id', params.patient_id.toString());
    if (params?.ambulance_id) query.set('ambulance_id', params.ambulance_id.toString());
    if (params?.status) query.set('status', params.status);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/emergency${queryString}`);
    return handleResponse(res);
  },

  async getEmergencyById(id: number): Promise<{ emergency: EmergencyRequest; logs: ActivityLog[] }> {
    const res = await fetch(`${API_BASE}/emergency/${id}`);
    return handleResponse(res);
  },

  async acceptEmergency(
    id: number,
    data: { driver_user_id?: number; driver_name?: string; ambulance_id?: number }
  ): Promise<{ message: string; emergency: EmergencyRequest; ambulance: Ambulance }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateEmergencyStatus(
    id: number,
    status: EmergencyStatus,
    updated_by?: string,
    driver_ambulance_id?: number
  ): Promise<{ message: string; emergency: EmergencyRequest }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, updated_by, driver_ambulance_id }),
    });
    return handleResponse(res);
  },

  // Submit ambulance service & response speed rating
  async submitEmergencyRating(
    id: number,
    data: AmbulanceRatingInput
  ): Promise<{ message: string; emergency: EmergencyRequest }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/rating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Automated 2km Proximity Alert Notification API
  async sendProximityAlert(
    id: number,
    data: { distance_km?: number; eta_minutes?: number }
  ): Promise<{ success: boolean; message: string; distance_km?: number; eta_minutes?: number }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/proximity-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Emergency Patient Report API
  async getEmergencyReport(id: number): Promise<{ report: EmergencyReport }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/report`);
    return handleResponse(res);
  },

  // AI Route Optimization APIs
  async recalculateRoute(
    id: number,
    params?: { origin?: string; destination?: string; originLatitude?: number; originLongitude?: number; destLatitude?: number; destLongitude?: number }
  ): Promise<{ message: string; emergency: EmergencyRequest; routeOptimization: any; hospitalOptimization: any }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/recalculate-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });
    return handleResponse(res);
  },

  async updateDriverLocation(
    id: number,
    coords: { latitude: number; longitude: number; accuracy?: number; speed?: number; heading?: number }
  ): Promise<{ success: boolean; message: string; location: { latitude: number; longitude: number; accuracy?: number; updated_at: string } }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/driver-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coords),
    });
    return handleResponse(res);
  },

  async findNearbyHospitals(
    id: number,
    params?: { latitude?: number; longitude?: number }
  ): Promise<{ message: string; source: 'live_places' | 'fallback'; hospitals: HospitalOption[]; emergency: EmergencyRequest }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/find-hospitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });
    return handleResponse(res);
  },

  async navigateToHospital(
    id: number,
    params: { hospitalName: string; hospitalCoords?: [number, number]; driverCoords?: { latitude: number; longitude: number } }
  ): Promise<{ message: string; stage: string; emergency: EmergencyRequest; routeOptimization: any }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/navigate-to-hospital`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async getNearbyHospitals(params: { lat: number; lng: number; emergencyType?: string; radius?: number }): Promise<{
    hospitals: HospitalOption[];
    source: 'live_places' | 'fallback';
    message: string;
  }> {
    const q = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
      emergencyType: params.emergencyType || 'General',
      radius: (params.radius || 10000).toString(),
    });
    const res = await fetch(`${API_BASE}/nearby-hospitals?${q.toString()}`);
    return handleResponse(res);
  },

  async getHospitals(): Promise<{ hospitals: Hospital[] }> {
    const res = await fetch(`${API_BASE}/hospitals`);
    return handleResponse(res);
  },

  async updateHospitalCapacity(
    id: number | string,
    ward_capacity: WardCapacityStatus,
    available_beds?: number
  ): Promise<{ message: string; hospital: Hospital }> {
    const res = await fetch(`${API_BASE}/hospitals/${id}/capacity`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ward_capacity, available_beds }),
    });
    return handleResponse(res);
  },

  async toggleHospitalCapacity(id: number | string): Promise<{ message: string; hospital: Hospital }> {
    const res = await fetch(`${API_BASE}/hospitals/${id}/toggle-capacity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  async selectRoute(
    id: number,
    routeId: string
  ): Promise<{ message: string; emergency: EmergencyRequest; selectedRoute: any }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/select-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeId }),
    });
    return handleResponse(res);
  },

  async startNavigation(
    id: number
  ): Promise<{ message: string; emergency: EmergencyRequest }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/start-navigation`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async selectHospital(
    id: number,
    hospitalName: string,
    hospitalId?: string
  ): Promise<{ message: string; emergency: EmergencyRequest }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/select-hospital`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalName, hospitalId }),
    });
    return handleResponse(res);
  },

  // Ambulances
  async getAmbulances(): Promise<{ count: number; ambulances: Ambulance[] }> {
    const res = await fetch(`${API_BASE}/ambulances`);
    return handleResponse(res);
  },

  async getAvailableAmbulances(): Promise<{ count: number; ambulances: Ambulance[] }> {
    const res = await fetch(`${API_BASE}/ambulances/available`);
    return handleResponse(res);
  },

  async createAmbulance(data: {
    vehicle_number: string;
    driver_name: string;
    phone: string;
    type?: string;
    base_location: string;
    status?: AmbulanceStatus;
  }): Promise<{ message: string; ambulance: Ambulance }> {
    const res = await fetch(`${API_BASE}/ambulances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateAmbulanceStatus(id: number, status: AmbulanceStatus): Promise<{ message: string; ambulance: Ambulance }> {
    const res = await fetch(`${API_BASE}/ambulances/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  // Stats
  async getStats(): Promise<SystemStats> {
    const res = await fetch(`${API_BASE}/stats`);
    return handleResponse(res);
  },

  // Reverse Geocoding API
  async reverseGeocode(lat: number, lng: number): Promise<{ formattedAddress: string; displayName: string; source: string; latitude: number; longitude: number }> {
    const res = await fetch(`${API_BASE}/reverse-geocode?lat=${lat}&lng=${lng}`);
    return handleResponse(res);
  },

  // Fleet location synchronization with user GPS
  async syncFleetLocation(data: { latitude: number; longitude: number; address?: string }): Promise<{ message: string; ambulances: Ambulance[] }> {
    const res = await fetch(`${API_BASE}/fleet/sync-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // IP Location Fallback
  async getIpLocation(): Promise<{ latitude: number; longitude: number; city: string; region: string; country: string; source: string }> {
    const res = await fetch(`${API_BASE}/ip-location`);
    return handleResponse(res);
  },

  // Reset Demo DB
  async resetDatabase(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/demo/reset`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Voice-to-Text & Symptom Triaging
  async analyzeSymptoms(payload: { rawTranscript: string; language?: string }): Promise<{
    success: boolean;
    source?: string;
    clinicalSummary: string;
    recommendedEmergencyType?: string;
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    symptoms: string[];
    dispatcherNotes: string;
    firstAidTip?: string;
  }> {
    const res = await fetch(`${API_BASE}/analyze-symptoms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Update emergency notes (e.g. for active emergencies)
  async updateEmergencyNotes(id: number, payload: { notes: string; updatedBy?: string }): Promise<{
    message: string;
    id: number;
    notes: string;
  }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // IoT Traffic Signal Priority APIs
  async getTrafficSignalStatus(): Promise<{
    state: {
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
    };
    junctions: any[];
    recentRequests: any[];
  }> {
    const res = await fetch(`${API_BASE}/traffic-signals/status`);
    return handleResponse(res);
  },

  async sendTrafficSignalCommand(
    command: 'GREEN_ROUTE_A' | 'GREEN_ROUTE_B' | 'NORMAL_MODE',
    options?: { junctionId?: string; emergencyId?: number; durationSeconds?: number }
  ): Promise<{
    success: boolean;
    mode: string;
    hardwareStatus: string;
    message: string;
    state: any;
  }> {
    const res = await fetch(`${API_BASE}/traffic-signals/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, ...options }),
    });
    return handleResponse(res);
  },

  async resetTrafficSignals(): Promise<{ success: boolean; mode: string; message: string }> {
    const res = await fetch(`${API_BASE}/traffic-signals/reset`, {
      method: 'POST',
    });
    return handleResponse(res);
  },
};

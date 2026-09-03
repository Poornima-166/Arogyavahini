import { User, Ambulance, EmergencyRequest, ActivityLog, SystemStats, CreateEmergencyInput, UserRole, EmergencyStatus, AmbulanceStatus, AppNotification } from '../types';

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

  // Reset Demo DB
  async resetDatabase(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/demo/reset`, {
      method: 'POST',
    });
    return handleResponse(res);
  },
};

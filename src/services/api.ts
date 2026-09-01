import { User, Ambulance, EmergencyRequest, ActivityLog, SystemStats, CreateEmergencyInput, UserRole, EmergencyStatus, AmbulanceStatus } from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
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

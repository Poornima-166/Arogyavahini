export type UserRole = 'patient' | 'driver' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  created_at?: string;
}

export type AmbulanceStatus = 'AVAILABLE' | 'ASSIGNED' | 'BUSY' | 'MAINTENANCE';

export interface Ambulance {
  id: number;
  vehicle_number: string;
  driver_name: string;
  phone: string;
  type: string;
  base_location: string;
  status: AmbulanceStatus;
  driver_user_id?: number | null;
  created_at?: string;
}

export type EmergencyStatus =
  | 'WAITING_FOR_DRIVER'
  | 'DRIVER_ACCEPTED'
  | 'ON_THE_WAY'
  | 'REACHED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface EmergencyRequest {
  id: number;
  patient_id?: number | null;
  patient_name: string;
  emergency_type: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  phone: string;
  notes?: string;
  driver_id?: number | null;
  ambulance_id?: number | null;
  status: EmergencyStatus;
  created_at: string;
  updated_at: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  ambulance_type?: string;
  ambulance_base?: string;
  ambulance_status?: AmbulanceStatus;
}

export interface ActivityLog {
  id: number;
  emergency_id: number;
  action: string;
  performed_by: string;
  timestamp: string;
}

export interface SystemStats {
  totalEmergencies: number;
  activeEmergencies: number;
  totalAmbulances: number;
  availableAmbulances: number;
  busyAmbulances: number;
  completedEmergencies: number;
  averageResponseTimeMinutes: number;
  typeBreakdown: { emergency_type: string; count: number }[];
}

export interface CreateEmergencyInput {
  patient_id?: number;
  patient_name: string;
  emergency_type: string;
  location: string;
  phone: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

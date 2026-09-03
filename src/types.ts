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
  current_latitude?: number | null;
  current_longitude?: number | null;
  last_gps_update?: string | null;
  created_at?: string;
}

export type EmergencyStatus =
  | 'WAITING_FOR_DRIVER'
  | 'DRIVER_ACCEPTED'
  | 'ON_THE_WAY'
  | 'REACHED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface RouteOption {
  id: string;
  name: string;
  summary: string;
  distanceKm: number;
  estimatedMinutes: number;
  traffic: 'Low' | 'Moderate' | 'Heavy';
  trafficDelayMinutes: number;
  routeScore: number;
  isRecommended: boolean;
  recommendationReason: string;
  waypoints: string[];
  coordinates: [number, number][]; // [lat, lng]
}

export interface HospitalOption {
  id: string;
  name: string;
  specialty: string;
  address: string;
  distanceKm: number;
  estimatedMinutes: number;
  traffic: 'Low' | 'Moderate' | 'Heavy';
  availableEmergencyBeds: number;
  isRecommended: boolean;
  recommendationReason: string;
  coordinates: [number, number];
  phone?: string;
  type?: string;
  source?: 'live_places' | 'fallback';
  rating?: number;
}

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

  // AI Route Optimization Fields
  route_origin?: string;
  route_destination?: string;
  optimized_routes?: RouteOption[];
  routes?: RouteOption[];
  selected_route_id?: string;
  current_eta_minutes?: number;
  current_distance_km?: number;
  current_traffic?: 'Low' | 'Moderate' | 'Heavy';
  hospital_routes?: HospitalOption[];
  hospital_options?: HospitalOption[];
  selected_hospital?: string;
  hospital_destination?: string | null;
  navigation_started?: number; // 0 or 1
  driver_current_latitude?: number | null;
  driver_current_longitude?: number | null;
  route_updated_at?: string;
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

export type NotificationType =
  | 'EMERGENCY_CREATED'
  | 'NEW_EMERGENCY_BROADCAST'
  | 'DRIVER_ACCEPTED'
  | 'DRIVER_ACCEPTED_CONFIRMATION'
  | 'EMERGENCY_CLAIMED_BY_OTHER'
  | 'ON_THE_WAY'
  | 'REACHED'
  | 'EMERGENCY_COMPLETED'
  | 'MISSION_COMPLETED'
  | 'EMERGENCY_CANCELLED'
  | 'ADMIN_EMERGENCY_ALERT'
  | 'ADMIN_EMERGENCY_ASSIGNED'
  | 'ADMIN_STATUS_UPDATE'
  | 'ADMIN_EMERGENCY_COMPLETED'
  | 'ADMIN_EMERGENCY_CANCELLED'
  | 'ADMIN_USER_REGISTERED'
  | 'ADMIN_FLEET_UPDATE'
  | 'USER_WELCOME'
  | 'SYSTEM_ALERT';

export interface AppNotification {
  id: number;
  user_id?: number | null;
  role?: UserRole | null;
  title: string;
  message: string;
  notification_type: NotificationType | string;
  emergency_request_id?: number | null;
  is_read: number; // 0 or 1
  created_at: string;
}


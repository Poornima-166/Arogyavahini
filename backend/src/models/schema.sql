-- ==============================================================================
-- PROJECT: AROGYAVAHINI EMERGENCY MANAGEMENT SYSTEM
-- POSTGRESQL CORE SCHEMAS: Users, Ambulances, and EmergencyRequests
-- ==============================================================================

-- Enable UUID extension if UUID identifiers are required in future extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. USERS TABLE
-- Stores authenticated users across roles: patient, driver, admin
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(30) NOT NULL CHECK (role IN ('patient', 'driver', 'admin')),
    
    -- Patient Clinical Profile & Emergency Contacts
    blood_type VARCHAR(10) DEFAULT 'B+',
    allergies TEXT DEFAULT 'None reported',
    medical_notes TEXT,
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(30),
    emergency_contact_relation VARCHAR(50) DEFAULT 'Next of Kin',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ==============================================================================
-- 2. AMBULANCES TABLE
-- Fleet management, vehicle attributes, live GPS coordinates, and duty status
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ambulances (
    id SERIAL PRIMARY KEY,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'ADVANCED_LIFE_SUPPORT' 
        CHECK (type IN ('ADVANCED_LIFE_SUPPORT', 'BASIC_LIFE_SUPPORT', 'CARDIAC_CARE_UNIT', 'NEONATAL_ICU')),
    driver_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    driver_name VARCHAR(150),
    phone VARCHAR(30),
    base_location VARCHAR(200) NOT NULL,
    current_latitude DECIMAL(10, 7) NOT NULL,
    current_longitude DECIMAL(10, 7) NOT NULL,
    current_address VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' 
        CHECK (status IN ('AVAILABLE', 'ASSIGNED', 'BUSY', 'MAINTENANCE', 'OFFLINE')),
    equipment_status JSONB DEFAULT '{"oxygen": true, "defibrillator": true, "ventilator": true, "suction": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ambulances Indexes
CREATE INDEX IF NOT EXISTS idx_ambulances_status ON ambulances(status);
CREATE INDEX IF NOT EXISTS idx_ambulances_driver ON ambulances(driver_user_id);
CREATE INDEX IF NOT EXISTS idx_ambulances_coords ON ambulances(current_latitude, current_longitude);

-- ==============================================================================
-- 3. EMERGENCY_REQUESTS TABLE
-- Real-time SOS calls, patient clinical status, ambulance assignment & route data
-- ==============================================================================
CREATE TABLE IF NOT EXISTS emergency_requests (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    patient_name VARCHAR(150) NOT NULL,
    emergency_type VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    notes TEXT,
    
    -- Mission Assignment & Status
    driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ambulance_id INTEGER REFERENCES ambulances(id) ON DELETE SET NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'WAITING_FOR_DRIVER' 
        CHECK (status IN (
            'WAITING_FOR_DRIVER', 
            'DRIVER_ACCEPTED', 
            'ON_THE_WAY', 
            'REACHED', 
            'TRANSFERRING_TO_HOSPITAL', 
            'COMPLETED', 
            'CANCELLED'
        )),
    
    -- Pre-hospital Patient Clinical Snapshot
    patient_blood_type VARCHAR(10),
    patient_allergies TEXT,
    patient_emergency_contact_name VARCHAR(150),
    patient_emergency_contact_phone VARCHAR(30),
    patient_emergency_contact_relation VARCHAR(50),
    patient_medical_notes TEXT,
    
    -- Route & Destination Hospital Navigation
    destination_hospital VARCHAR(200),
    destination_latitude DECIMAL(10, 7),
    destination_longitude DECIMAL(10, 7),
    selected_route_id VARCHAR(50),
    selected_route_name VARCHAR(150),
    route_distance_km DECIMAL(6, 2),
    route_eta_minutes INTEGER,
    current_traffic VARCHAR(30) DEFAULT 'Low',
    navigation_stage VARCHAR(50) DEFAULT 'PICKUP',
    
    -- Alerts & Quality of Care
    proximity_alert_sent BOOLEAN DEFAULT FALSE,
    rating_score INTEGER CHECK (rating_score BETWEEN 1 AND 5),
    rating_feedback TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    reached_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emergency Requests Indexes
CREATE INDEX IF NOT EXISTS idx_emergency_requests_status ON emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_patient ON emergency_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_driver ON emergency_requests(driver_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_ambulance ON emergency_requests(ambulance_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_created ON emergency_requests(created_at DESC);

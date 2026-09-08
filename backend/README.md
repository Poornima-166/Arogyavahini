# Arogyavahini Backend Service

Production-ready Node.js, Express, and PostgreSQL backend microservice architecture for **Arogyavahini - Smart Emergency Ambulance Management & Automated Traffic Signal Preemption**.

## Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.ts                   # PostgreSQL connection pool with node-postgres (pg.Pool)
│   ├── models/
│   │   ├── schema.sql              # Core PostgreSQL DDL schema definition
│   │   ├── User.ts                 # Users table model and queries
│   │   ├── Ambulance.ts            # Ambulances fleet model and queries
│   │   ├── EmergencyRequest.ts     # EmergencyRequests SOS mission model and queries
│   │   └── index.ts                # Schema auto-migration & barrel exports
│   ├── controllers/
│   │   ├── userController.ts       # Auth, registration, and user profiles
│   │   ├── ambulanceController.ts  # Fleet telemetry and dispatch operations
│   │   └── emergencyController.ts  # SOS lifecycle and driver assignment
│   ├── routes/
│   │   ├── userRoutes.ts           # /api/v1/users endpoints
│   │   ├── ambulanceRoutes.ts      # /api/v1/ambulances endpoints
│   │   ├── emergencyRoutes.ts      # /api/v1/emergencies endpoints
│   │   └── index.ts                # Central API router & health check
│   ├── middleware/
│   │   ├── errorHandler.ts         # Centralized error and 404 handlers
│   │   └── authMiddleware.ts       # Role-based access control
│   ├── app.ts                      # Express application setup
│   └── server.ts                   # Server bootstrap & PostgreSQL connection tester
└── README.md
```

## Core PostgreSQL Schemas

### 1. `users`
- **id**: `SERIAL PRIMARY KEY`
- **name**: `VARCHAR(150) NOT NULL`
- **email**: `VARCHAR(255) UNIQUE NOT NULL`
- **password**: `VARCHAR(255) NOT NULL`
- **phone**: `VARCHAR(30)`
- **role**: `VARCHAR(30) CHECK (role IN ('patient', 'driver', 'admin'))`
- **blood_type**, **allergies**, **medical_notes**: Patient clinical snapshot
- **emergency_contact_name**, **emergency_contact_phone**, **emergency_contact_relation**
- **created_at**, **updated_at**: `TIMESTAMP WITH TIME ZONE`

### 2. `ambulances`
- **id**: `SERIAL PRIMARY KEY`
- **vehicle_number**: `VARCHAR(50) UNIQUE NOT NULL`
- **type**: `VARCHAR(30) CHECK (type IN ('ADVANCED_LIFE_SUPPORT', 'BASIC_LIFE_SUPPORT', 'CARDIAC_CARE_UNIT', 'NEONATAL_ICU'))`
- **driver_user_id**: `INTEGER REFERENCES users(id)`
- **driver_name**, **phone**, **base_location**
- **current_latitude**, **current_longitude**: `DECIMAL(10, 7) NOT NULL`
- **current_address**: `VARCHAR(255)`
- **status**: `VARCHAR(30) CHECK (status IN ('AVAILABLE', 'ASSIGNED', 'BUSY', 'MAINTENANCE', 'OFFLINE'))`
- **equipment_status**: `JSONB` (oxygen, defibrillator, ventilator, suction)
- **created_at**, **updated_at**: `TIMESTAMP WITH TIME ZONE`

### 3. `emergency_requests`
- **id**: `SERIAL PRIMARY KEY`
- **patient_id**: `INTEGER REFERENCES users(id)`
- **patient_name**, **emergency_type**, **location**, **latitude**, **longitude**, **phone**, **notes**
- **driver_id**: `INTEGER REFERENCES users(id)`
- **ambulance_id**: `INTEGER REFERENCES ambulances(id)`
- **status**: `CHECK (status IN ('WAITING_FOR_DRIVER', 'DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED', 'TRANSFERRING_TO_HOSPITAL', 'COMPLETED', 'CANCELLED'))`
- **destination_hospital**, **destination_latitude**, **destination_longitude**
- **selected_route_id**, **route_distance_km**, **route_eta_minutes**, **current_traffic**
- **timestamps**: `created_at`, `accepted_at`, `reached_at`, `completed_at`, `updated_at`

## Environment Variables

Configure your PostgreSQL database credentials in `.env`:

```env
# Full Connection URL:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/arogyavahini

# Or individual parameters:
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=arogyavahini
PG_MAX_POOL=20
BACKEND_PORT=5000
```

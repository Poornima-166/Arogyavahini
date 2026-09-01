# Arogyavahini – Smart Integrated Emergency Medical Response System
**College Engineering Project – Phase 2**

---

## 📌 Project Overview
**Arogyavahini** is a comprehensive, full-stack emergency medical response system engineered to minimize emergency response times by connecting patients in distress, ambulance crews, hospital trauma wards, and dispatch administrators.

In an emergency, a patient triggers an SOS request with one tap or through a detailed medical incident form. The Arogyavahini dispatch engine instantly pairs the patient with the nearest available ambulance, locks the vehicle from the availability pool, and provides live status tracking through every critical stage of the response pipeline.

---

## 🚀 Key Functional Modules

### 1. 🚨 Patient Module
- **1-Click Emergency SOS Dispatch**: Large prominent emergency trigger with GPS location autofill.
- **Incident Specification**: Categorize emergencies (Cardiac Arrest, Trauma/Accident, Respiratory, Stroke FAST, Pregnancy, etc.).
- **Live Status Stepper Progression**:
  $$\text{REQUESTED} \longrightarrow \text{AMBULANCE\_ASSIGNED} \longrightarrow \text{ACCEPTED} \longrightarrow \text{ON\_THE\_WAY} \longrightarrow \text{REACHED} \longrightarrow \text{COMPLETED}$$
- **Assigned Ambulance & Crew Card**: Live driver contact, vehicle registration number, life support specification, and base location.
- **Immediate First-Aid Protocols**: On-screen CPR, severe bleeding, stroke (FAST), and choking guidance for bystanders while the ambulance is en route.
- **Emergency History**: Past dispatch history with timestamps and status logs.

### 2. 🚑 Ambulance Driver Module
- **Responder Cockpit**: Real-time incoming dispatch notifications with sound alert cues.
- **Incident Navigation**: Patient name, direct phone call button, and pickup location with GPS landmark.
- **Lifecycle Action Controls**:
  1. `Accept Request` (changes status to `ACCEPTED`)
  2. `Start Journey / On the Way` (changes status to `ON_THE_WAY` with siren trigger)
  3. `Mark as Reached Patient` (changes status to `REACHED`)
  4. `Complete & Hospital Handover` (changes status to `COMPLETED` and frees up the ambulance)
- **Vehicle Readiness**: Toggle availability between `AVAILABLE` and `MAINTENANCE`.

### 3. 🛡️ Admin & Hospital Command Center
- **Key Metric Analytics**: Total emergency calls, active dispatches, available fleet count, and average response times.
- **Master Emergency Ledger**: Searchable, filterable table of all emergency dispatches with action modals.
- **Fleet Management**: Monitor all ambulances, add new emergency vehicles, and toggle status.
- **1-Click Demo Reset**: Reset database to clean initial state for viva and project evaluations.

---

## 🏗️ Tech Stack
- **Frontend**: React 19, Tailwind CSS v4, Lucide Icons, Web Audio API
- **Backend**: Node.js, Express.js (REST APIs, CORS, JSON Middleware)
- **Database**: SQLite Database (`sql.js`) with automatic file persistence (`arogyavahini.sqlite`)
- **Development Tooling**: Vite, TypeScript, `tsx`, `esbuild`

---

## 🗄️ Database Schema

### 1. `users` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user ID |
| `name` | TEXT | NOT NULL | User's full name |
| `email` | TEXT | UNIQUE NOT NULL | Login email |
| `password` | TEXT | NOT NULL | Password |
| `phone` | TEXT | NULLABLE | Contact number |
| `role` | TEXT | NOT NULL | `patient`, `driver`, or `admin` |
| `created_at`| TEXT | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

### 2. `ambulances` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique ambulance ID |
| `vehicle_number` | TEXT | UNIQUE NOT NULL | Registration plate (e.g. `KA-01-EA-1008`) |
| `driver_name` | TEXT | NOT NULL | Assigned driver name |
| `phone` | TEXT | NOT NULL | Driver contact number |
| `type` | TEXT | NOT NULL | BLS / ACLS / Critical Care |
| `base_location` | TEXT | NOT NULL | Primary hospital/hub station |
| `status` | TEXT | NOT NULL | `AVAILABLE`, `ASSIGNED`, `BUSY`, `MAINTENANCE` |
| `created_at`| TEXT | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

### 3. `emergency_requests` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique emergency ID |
| `patient_id` | INTEGER | FOREIGN KEY (`users.id`) | Registered patient ID (or guest) |
| `patient_name` | TEXT | NOT NULL | Patient's name |
| `emergency_type` | TEXT | NOT NULL | Medical classification |
| `location` | TEXT | NOT NULL | Pickup address / GPS |
| `latitude` | REAL | NULLABLE | Latitude coordinate |
| `longitude` | REAL | NULLABLE | Longitude coordinate |
| `phone` | TEXT | NOT NULL | Patient contact phone |
| `notes` | TEXT | NULLABLE | Medical background/condition |
| `ambulance_id` | INTEGER | FOREIGN KEY (`ambulances.id`) | Assigned ambulance ID |
| `status` | TEXT | NOT NULL | `REQUESTED`, `AMBULANCE_ASSIGNED`, `ACCEPTED`, `ON_THE_WAY`, `REACHED`, `COMPLETED`, `CANCELLED` |
| `created_at`| TEXT | DEFAULT CURRENT_TIMESTAMP | Incident creation timestamp |
| `updated_at`| TEXT | DEFAULT CURRENT_TIMESTAMP | Status update timestamp |

### 4. `activity_logs` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique log ID |
| `emergency_id` | INTEGER | NOT NULL | Emergency request ID |
| `action` | TEXT | NOT NULL | Description of action taken |
| `performed_by` | TEXT | NOT NULL | Patient, Driver, or System Engine |
| `timestamp` | TEXT | DEFAULT CURRENT_TIMESTAMP | Log timestamp |

---

## 🔌 REST API Endpoints

### Authentication & Demo
- `POST /api/auth/register` – Register new user with specified role
- `POST /api/auth/login` – Login with email and password
- `POST /api/auth/demo/:role` – 1-Click quick login for demo roles (`patient`, `driver`, `admin`)

### Emergency Requests & Dispatch Engine
- `POST /api/emergency` – Trigger SOS emergency (automatically finds & assigns first `AVAILABLE` ambulance, updates vehicle status to `ASSIGNED`, creates emergency with `AMBULANCE_ASSIGNED`)
- `GET /api/emergency` – List all emergencies (supports `?patient_id=`, `?ambulance_id=`, `?status=`)
- `GET /api/emergency/:id` – Fetch single emergency details with assigned vehicle and audit logs
- `PUT /api/emergency/:id/status` – Update emergency lifecycle status (`ACCEPTED`, `ON_THE_WAY`, `REACHED`, `COMPLETED`, `CANCELLED`). Freeing ambulance to `AVAILABLE` on `COMPLETED` or `CANCELLED`.

### Ambulances & Fleet
- `GET /api/ambulances` – List all registered ambulances
- `GET /api/ambulances/available` – List ambulances currently `AVAILABLE`
- `POST /api/ambulances` – Register a new ambulance unit
- `PUT /api/ambulances/:id/status` – Update ambulance operational status

### System & Demo Control
- `GET /api/stats` – Aggregated statistics for admin dashboard
- `POST /api/demo/reset` – Reset SQLite database to clean sample dataset

---

## 🏃 Step-by-Step Instructions to Run Locally

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
The application will launch with Express and Vite integrated on **http://localhost:3000**.

### 3. Production Build & Start
```bash
npm run build
npm start
```

---

## 🔑 Pre-seeded Demo Accounts for Evaluation

| Role | Email | Password | Default Persona |
|---|---|---|---|
| **Patient** | `patient@demo.com` | `demo123` | Arun Sharma |
| **Driver** | `driver@demo.com` | `demo123` | Ramesh Kumar (KA-01-EA-1008) |
| **Admin** | `admin@demo.com` | `demo123` | Dr. Priya Deshmukh (Chief Medical Officer) |

*Note: You can also use the **1-Click Demo Buttons** located in the top navigation bar or the authentication modal for instant one-tap access during presentations.*

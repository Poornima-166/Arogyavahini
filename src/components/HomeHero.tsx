import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SystemStats } from '../types';
import { 
  AlertOctagon, 
  Truck, 
  ShieldCheck, 
  ArrowRight, 
  Activity, 
  CheckCircle, 
  MapPin, 
  Clock, 
  HeartPulse, 
  Cpu, 
  Database,
  Radio
} from 'lucide-react';

interface HomeHeroProps {
  onOpenAuth?: () => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({ onOpenAuth }) => {
  const { demoLogin, isLoading } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    loadStats();
    const timer = setInterval(loadStats, 5000);
    return () => clearInterval(timer);
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (e) {
      console.warn('Could not load stats', e);
    }
  };

  const handleLaunchRole = async (role: 'patient' | 'driver' | 'admin') => {
    await demoLogin(role);
  };

  return (
    <div id="home-hero-container" className="space-y-8 pb-12">
      {/* Top Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-[#0f172a] text-white p-6 sm:p-10 lg:p-12 border border-slate-800 shadow-md">
        {/* Background glow accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-semibold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Emergency Medical Response Platform</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-medium">Real-Time Dispatch Engine</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Smart Integrated Emergency{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-rose-300 to-amber-300">
              Medical Response System
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            A unified full-stack emergency medical platform connecting patients in crisis with the nearest available life-support ambulances, hospital trauma wards, and dispatch controllers.
          </p>

          {/* Massive Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => handleLaunchRole('patient')}
              className="w-full sm:w-auto px-7 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-2.5 text-base transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <AlertOctagon className="w-5 h-5 animate-pulse" />
              <span>TRIGGER EMERGENCY SOS</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleLaunchRole('admin')}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm sm:text-base transition-all"
            >
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <span>Open Admin Command Center</span>
            </button>
          </div>

          {/* Live Fleet Statistics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-slate-800">
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-2xl font-bold font-mono text-white">
                {stats ? stats.totalAmbulances : '4'}
              </span>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Active Ambulances</p>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {stats ? stats.availableAmbulances : '4'}
              </span>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Ready for Dispatch</p>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {stats ? stats.activeEmergencies : '0'}
              </span>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Live Emergencies</p>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-2xl font-bold font-mono text-rose-400">
                ~6.4 <span className="text-xs font-semibold">min</span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Avg. Response Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Role Portals */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dedicated Stakeholder Portals
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Select a portal below to access role-specific workflows and live dispatch operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Patient Portal Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center font-bold">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  Patient
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">Patient Portal</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  One-tap Emergency SOS dispatch with automated ambulance pairing, live GPS status progression, driver contact card, and first-aid instructions.
                </p>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant SOS Emergency Button</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Real-time Stepper (Requested → Reached)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Assigned Vehicle & Crew Details</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleLaunchRole('patient')}
              disabled={isLoading}
              className="mt-6 w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Access Patient Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ambulance Driver Console Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Driver
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">Driver Console</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Real-time responder cockpit for ambulance drivers to receive incoming dispatches, accept routes, start siren journeys, and log scene arrival.
                </p>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Instant Sound & Visual Alert</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>1-Click Status Controls (Accept/En Route)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Direct Patient Phone & Incident Pin</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleLaunchRole('driver')}
              disabled={isLoading}
              className="mt-6 w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Access Driver Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Admin Command Center Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  Admin
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">Admin Command Center</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Hospital emergency operations room for fleet tracking, dispatch monitoring, emergency triage analytics, manual assignment overrides, and audit trails.
                </p>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Comprehensive Emergency Ledger</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Fleet Availability & Maintenance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>System Diagnostics & Data Refresh</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleLaunchRole('admin')}
              disabled={isLoading}
              className="mt-6 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Access Command Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* System Architecture & Workflow Diagram */}
      <section className="bg-[#0f172a] text-white rounded-2xl p-6 sm:p-8 border border-slate-800">
        <div className="max-w-3xl mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4" />
            <span>Operational Architecture</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Emergency Dispatch & Lifecycle Pipeline
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Every step is recorded in SQLite database with state validation and atomic ambulance transitions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 relative">
            <div className="text-xl font-bold font-mono text-red-400 mb-1">01</div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">Patient SOS Trigger</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Patient submits location & emergency type via REST POST API <code className="text-[10px] text-amber-300 font-mono">/api/emergency</code>.
            </p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 relative">
            <div className="text-xl font-bold font-mono text-amber-400 mb-1">02</div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">Smart Match Engine</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              System identifies first available ambulance, locks vehicle status to <code className="text-[10px] text-amber-300 font-mono">ASSIGNED</code>, links record.
            </p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 relative">
            <div className="text-xl font-bold font-mono text-blue-400 mb-1">03</div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">Driver Siren Response</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Driver receives alarm, confirms dispatch (<code className="text-[10px] text-blue-300 font-mono">ACCEPTED</code> → <code className="text-[10px] text-blue-300 font-mono">ON_THE_WAY</code> → <code className="text-[10px] text-blue-300 font-mono">REACHED</code>).
            </p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 relative">
            <div className="text-xl font-bold font-mono text-emerald-400 mb-1">04</div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">Trauma Handover</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Patient admitted to emergency ward (<code className="text-[10px] text-emerald-300 font-mono">COMPLETED</code>). Ambulance automatically freed to <code className="text-[10px] text-emerald-300 font-mono">AVAILABLE</code>.
            </p>
          </div>
        </div>

        {/* Tech Stack Specs */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-red-400" />
            <span>Frontend: React 19 + Tailwind CSS + Lucide Icons</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Backend: Node.js + Express.js REST APIs</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span>Database: Persistent SQLite Engine (sql.js)</span>
          </div>
        </div>
      </section>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Ambulance, EmergencyRequest, SystemStats, EmergencyStatus, AmbulanceStatus } from '../types';
import { 
  ShieldCheck, 
  Truck, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  RotateCcw, 
  Activity, 
  Phone, 
  MapPin, 
  User, 
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useAuth();

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Add Ambulance Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVehicleNumber, setNewVehicleNumber] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBaseLocation, setNewBaseLocation] = useState('');
  const [newType, setNewType] = useState('Advanced Cardiac Life Support (ACLS)');
  const [isSubmittingAmb, setIsSubmittingAmb] = useState(false);

  // Selected Emergency Detail Modal
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyRequest | null>(null);

  useEffect(() => {
    loadAllAdminData();
    const interval = setInterval(loadAllAdminData, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadAllAdminData = async () => {
    try {
      const [statsData, reqData, ambData] = await Promise.all([
        api.getStats(),
        api.getEmergencies(),
        api.getAmbulances(),
      ]);
      setStats(statsData);
      setEmergencies(reqData.emergencies);
      setAmbulances(ambData.ambulances);
    } catch (e) {
      console.warn('Error loading admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmergencyStatus = async (id: number, status: EmergencyStatus) => {
    try {
      const res = await api.updateEmergencyStatus(id, status, 'Admin / Dispatch Control');
      showToast(res.message, 'success');
      loadAllAdminData();
      if (selectedEmergency?.id === id) {
        setSelectedEmergency(res.emergency);
      }
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  const handleUpdateAmbulanceStatus = async (id: number, status: AmbulanceStatus) => {
    try {
      const res = await api.updateAmbulanceStatus(id, status);
      showToast(res.message, 'success');
      loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update ambulance status', 'error');
    }
  };

  const handleAddAmbulance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleNumber || !newDriverName || !newPhone || !newBaseLocation) {
      showToast('Please fill all required ambulance details', 'error');
      return;
    }

    setIsSubmittingAmb(true);
    try {
      const res = await api.createAmbulance({
        vehicle_number: newVehicleNumber,
        driver_name: newDriverName,
        phone: newPhone,
        base_location: newBaseLocation,
        type: newType,
        status: 'AVAILABLE',
      });
      showToast(res.message, 'success');
      setShowAddModal(false);
      setNewVehicleNumber('');
      setNewDriverName('');
      setNewPhone('');
      setNewBaseLocation('');
      loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to register ambulance', 'error');
    } finally {
      setIsSubmittingAmb(false);
    }
  };

  const handleResetSystemData = async () => {
    if (!window.confirm('Reset emergency ledger and restore default fleet availability?')) return;
    try {
      const res = await api.resetDatabase();
      showToast(res.message, 'success');
      loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Reset failed', 'error');
    }
  };

  // Filtered emergency list
  const filteredEmergencies = emergencies.filter((req) => {
    const matchesSearch =
      req.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.emergency_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.vehicle_number && req.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return !['COMPLETED', 'CANCELLED'].includes(req.status);
    if (statusFilter === 'COMPLETED') return req.status === 'COMPLETED';
    if (statusFilter === 'CANCELLED') return req.status === 'CANCELLED';
    return req.status === statusFilter;
  });

  return (
    <div id="admin-dashboard-root" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#3b82f6] text-white flex items-center justify-center font-bold shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hospital Dispatch Command Center</h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live Fleet Tracking, Automated Dispatch Queue, and SQLite Master Logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSystemData}
            title="Restore Default Fleet & Clear Resolved Calls"
            className="p-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset System Data</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="py-2 px-3.5 rounded-lg bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all border border-slate-800"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Add Ambulance</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards / Reports */}
      <div id="admin-reports-section" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Emergencies */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Calls</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.totalEmergencies ?? 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">Logged in SQLite</span>
        </div>

        {/* Active Dispatches */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-red-600">Active Emergencies</span>
            <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats?.activeEmergencies ?? 0}</p>
          <span className="text-[11px] text-red-500 font-semibold">Currently en route / at scene</span>
        </div>

        {/* Available Ambulances */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Available Fleet</span>
            <Truck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
            {stats?.availableAmbulances ?? 0} <span className="text-sm text-slate-400 font-normal">/ {stats?.totalAmbulances ?? 0}</span>
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">Ready for instant SOS</span>
        </div>

        {/* Completed Emergencies */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Handover Complete</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.completedEmergencies ?? 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">Admitted to Trauma Ward</span>
        </div>
      </div>

      {/* AMBULANCE FLEET MANAGEMENT PANEL */}
      <div id="admin-fleet-section" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div id="admin-drivers-section" className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Emergency Ambulance Fleet & Driver Crew Management</h3>
            <p className="text-xs text-slate-500">Real-time status, vehicle readiness, and driver telemetry</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 font-mono">
            {ambulances.length} Registered Units
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {ambulances.map((amb) => (
            <div
              key={amb.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 font-mono block">{amb.vehicle_number}</span>
                  <span className="text-[11px] text-slate-500 truncate block max-w-[140px]">{amb.type}</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    amb.status === 'AVAILABLE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : amb.status === 'ASSIGNED'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : amb.status === 'BUSY'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {amb.status}
                </span>
              </div>

              <div className="text-xs space-y-1 text-slate-600 pt-2 border-t border-slate-100">
                <p className="flex items-center gap-1 font-medium">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{amb.driver_name}</span>
                </p>
                <p className="flex items-center gap-1 font-mono text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{amb.phone}</span>
                </p>
                <p className="flex items-center gap-1 text-[11px] text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{amb.base_location}</span>
                </p>
              </div>

              {/* Status Toggle buttons */}
              <div className="pt-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdateAmbulanceStatus(amb.id, 'AVAILABLE')}
                  className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-colors border ${
                    amb.status === 'AVAILABLE'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  Available
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAmbulanceStatus(amb.id, 'MAINTENANCE')}
                  className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-colors border ${
                    amb.status === 'MAINTENANCE'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Service
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EMERGENCY REQUESTS DATA TABLE */}
      <div id="admin-emergency-feed" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Emergency Dispatches Master Ledger</h3>
            <p className="text-xs text-slate-500">All registered SOS calls, assignments, and response lifecycles</p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    statusFilter === filter
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-mono">ID</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Emergency Type</th>
                <th className="py-3 px-4">Incident Location</th>
                <th className="py-3 px-4">Assigned Vehicle</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmergencies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No emergency requests found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredEmergencies.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">#{req.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{req.patient_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{req.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{req.emergency_type}</span>
                    </td>
                    <td className="py-3 px-4 max-w-[180px] truncate text-slate-600" title={req.location}>
                      {req.location}
                    </td>
                    <td className="py-3 px-4">
                      {req.vehicle_number ? (
                        <div>
                          <span className="font-bold font-mono text-slate-900">{req.vehicle_number}</span>
                          <span className="text-[10px] text-slate-500 block">{req.driver_name}</span>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-medium italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : req.status === 'CANCELLED'
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : req.status === 'WAITING_FOR_DRIVER'
                            ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                            : req.status === 'DRIVER_ACCEPTED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEmergency(req)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md transition-colors text-[11px]"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SYSTEM USERS & ROLE PERMISSIONS REGISTRY */}
      <div id="admin-users-section" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">System Users & Role Access Registry</h3>
              <p className="text-xs text-slate-500">Authorized personnel accounts, active dispatchers, and verified drivers</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 font-mono">
            Active Accounts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Admin Personnel</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">ADMIN</span>
            </div>
            <p className="text-slate-600 font-medium">System Administrator</p>
            <p className="text-[11px] text-slate-400 font-mono">admin@arogyavahini.gov.in</p>
            <span className="text-[10px] text-emerald-600 font-bold block pt-1">● Full Command Permissions</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Ambulance Crew</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">DRIVER</span>
            </div>
            <p className="text-slate-600 font-medium">Mohammed Irfan</p>
            <p className="text-[11px] text-slate-400 font-mono">+91 98450 11223</p>
            <span className="text-[10px] text-emerald-600 font-bold block pt-1">● Dispatch & Vehicle Tracking</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Emergency Caller</span>
              <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold uppercase">PATIENT</span>
            </div>
            <p className="text-slate-600 font-medium">Priya Rao</p>
            <p className="text-[11px] text-slate-400 font-mono">+91 98450 12345</p>
            <span className="text-[10px] text-emerald-600 font-bold block pt-1">● SOS Broadcast Access</span>
          </div>
        </div>
      </div>

      {/* ADD AMBULANCE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <h3 className="font-black text-base">Register New Ambulance Unit</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAmbulance} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle License Plate *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-02-ER-5599"
                  value={newVehicleNumber}
                  onChange={(e) => setNewVehicleNumber(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Driver Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manjunath Reddy"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Driver Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98450 99887"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medical Specification Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Advanced Cardiac Life Support (ACLS)">Advanced Cardiac Life Support (ACLS)</option>
                  <option value="Basic Life Support (BLS)">Basic Life Support (BLS)</option>
                  <option value="Critical Care Response Unit">Critical Care Response Unit</option>
                  <option value="Neonatal & Trauma ICU Mobile">Neonatal & Trauma ICU Mobile</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Base Station Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Malleshwaram Apollo Emergency Hub"
                  value={newBaseLocation}
                  onChange={(e) => setNewBaseLocation(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAmb}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                >
                  {isSubmittingAmb ? 'Registering...' : 'Save Ambulance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-red-400">Emergency Case File</span>
                <h3 className="font-black text-lg">Dispatch #{selectedEmergency.id}</h3>
              </div>
              <button onClick={() => setSelectedEmergency(null)} className="p-1 rounded-full hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Patient</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedEmergency.patient_name}</span>
                  <span className="text-slate-500 block">{selectedEmergency.phone}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Emergency Type</span>
                  <span className="font-bold text-red-700 text-sm">{selectedEmergency.emergency_type}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Location</span>
                <p className="font-semibold text-slate-800">{selectedEmergency.location}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Assigned Ambulance</span>
                <p className="font-bold text-slate-900">
                  {selectedEmergency.vehicle_number || 'None'} • Driver: {selectedEmergency.driver_name || 'N/A'} ({selectedEmergency.driver_phone || 'N/A'})
                </p>
              </div>

              {/* Status Override */}
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 block font-bold uppercase mb-1.5">
                  Admin Status Override
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['WAITING_FOR_DRIVER', 'DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED', 'COMPLETED', 'CANCELLED'] as EmergencyStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateEmergencyStatus(selectedEmergency.id, st)}
                      className={`p-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                        selectedEmergency.status === st
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
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
  const { t } = useLanguage();
  const { fetchNotifications } = useNotifications();

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
      fetchNotifications();
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
      fetchNotifications();
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t.adminPortalTitle}</h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                {t.adminConsoleBadge}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live Fleet Tracking, Emergency Dispatch Queue, and Central Incident Ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSystemData}
            title="Restore Default Fleet & Clear Resolved Calls"
            className="p-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-400 hover:border-red-200 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.adminResetSystem}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="py-2 px-3.5 rounded-lg bg-[#0f172a] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all border border-slate-800 dark:border-blue-600 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-400 dark:text-white" />
            <span>{t.adminAddAmbulance}</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards / Reports */}
      <div id="admin-reports-section" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Emergencies */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t.adminTotalCalls}</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{stats?.totalEmergencies ?? 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">Registered calls</span>
        </div>

        {/* Active Dispatches */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">{t.activeEmergencies}</span>
            <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">{stats?.activeEmergencies ?? 0}</p>
          <span className="text-[11px] text-red-500 font-semibold">{t.adminActiveCallsDesc}</span>
        </div>

        {/* Available Ambulances */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{t.availableAmbulances}</span>
            <Truck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats?.availableAmbulances ?? 0} <span className="text-sm text-slate-400 font-normal">/ {stats?.totalAmbulances ?? 0}</span>
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">{t.adminReadyFleetDesc}</span>
        </div>

        {/* Completed Emergencies */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t.completedTrips}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{stats?.completedEmergencies ?? 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">Admitted & Resolved</span>
        </div>
      </div>

      {/* AMBULANCE FLEET MANAGEMENT PANEL */}
      <div id="admin-fleet-section" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div id="admin-drivers-section" className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.adminFleetTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.adminFleetDesc}</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 font-mono">
            {ambulances.length} Registered Units
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {ambulances.map((amb) => (
            <div
              key={amb.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:border-blue-300 dark:hover:border-blue-600 transition-all space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-mono block">{amb.vehicle_number}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block max-w-[140px]">{amb.type}</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    amb.status === 'AVAILABLE'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      : amb.status === 'ASSIGNED'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                      : amb.status === 'BUSY'
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  {amb.status}
                </span>
              </div>

              <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-700">
                <p className="flex items-center gap-1 font-medium">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{amb.driver_name}</span>
                </p>
                <p className="flex items-center gap-1 font-mono text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{amb.phone}</span>
                </p>
                <p className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{amb.base_location}</span>
                </p>
              </div>

              {/* Status Toggle buttons */}
              <div className="pt-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdateAmbulanceStatus(amb.id, 'AVAILABLE')}
                  className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-colors border cursor-pointer ${
                    amb.status === 'AVAILABLE'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  Available
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAmbulanceStatus(amb.id, 'MAINTENANCE')}
                  className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-colors border cursor-pointer ${
                    amb.status === 'MAINTENANCE'
                      ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
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
      <div id="admin-emergency-feed" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.adminMasterLedgerTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.adminMasterLedgerDesc}</p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 font-mono">ID</th>
                <th className="py-3 px-4">{t.patientName}</th>
                <th className="py-3 px-4">{t.patientSelectEmergencyType}</th>
                <th className="py-3 px-4">{t.driverIncidentLocation}</th>
                <th className="py-3 px-4">{t.vehicleNumber}</th>
                <th className="py-3 px-4">{t.status}</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEmergencies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No emergency requests found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredEmergencies.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">#{req.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{req.patient_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{req.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{req.emergency_type}</span>
                    </td>
                    <td className="py-3 px-4 max-w-[180px] truncate text-slate-600 dark:text-slate-300" title={req.location}>
                      {req.location}
                    </td>
                    <td className="py-3 px-4">
                      {req.vehicle_number ? (
                        <div>
                          <span className="font-bold font-mono text-slate-900 dark:text-white">{req.vehicle_number}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{req.driver_name}</span>
                        </div>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium italic">{t.statusWaitingForDriver}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'COMPLETED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                            : req.status === 'CANCELLED'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            : req.status === 'WAITING_FOR_DRIVER'
                            ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 animate-pulse'
                            : req.status === 'DRIVER_ACCEPTED'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEmergency(req)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-md transition-colors text-[11px] cursor-pointer"
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
      <div id="admin-users-section" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.adminUsersTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.adminUsersDesc}</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 font-mono">
            Active Accounts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Admin Personnel</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-bold uppercase">{t.roleAdmin}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">System Administrator</p>
            <p className="text-[11px] text-slate-400 font-mono">admin@arogyavahini.gov.in</p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block pt-1">● Full Command Permissions</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Ambulance Crew</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase">{t.roleDriver}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">Mohammed Irfan</p>
            <p className="text-[11px] text-slate-400 font-mono">+91 98450 11223</p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block pt-1">● Dispatch & Vehicle Tracking</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Emergency Caller</span>
              <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-[10px] font-bold uppercase">{t.rolePatient}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">Priya Rao</p>
            <p className="text-[11px] text-slate-400 font-mono">+91 98450 12345</p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block pt-1">● SOS Broadcast Access</span>
          </div>
        </div>
      </div>

      {/* ADD AMBULANCE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <h3 className="font-black text-base">{t.adminAddAmbulance}</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full hover:bg-white/20 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAmbulance} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.vehicleNumber} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-02-ER-5599"
                  value={newVehicleNumber}
                  onChange={(e) => setNewVehicleNumber(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.driverName} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manjunath Reddy"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.phone} *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98450 99887"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.ambulanceType}</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Advanced Cardiac Life Support (ACLS)">Advanced Cardiac Life Support (ACLS)</option>
                  <option value="Basic Life Support (BLS)">Basic Life Support (BLS)</option>
                  <option value="Critical Care Response Unit">Critical Care Response Unit</option>
                  <option value="Neonatal & Trauma ICU Mobile">Neonatal & Trauma ICU Mobile</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.baseLocation} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Malleshwaram Apollo Emergency Hub"
                  value={newBaseLocation}
                  onChange={(e) => setNewBaseLocation(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAmb}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {isSubmittingAmb ? t.loading : 'Save Ambulance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-red-400">Emergency Case File</span>
                <h3 className="font-black text-lg">Dispatch #{selectedEmergency.id}</h3>
              </div>
              <button onClick={() => setSelectedEmergency(null)} className="p-1 rounded-full hover:bg-white/20 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{t.patientName}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedEmergency.patient_name}</span>
                  <span className="text-slate-500 dark:text-slate-400 block">{selectedEmergency.phone}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{t.patientSelectEmergencyType}</span>
                  <span className="font-bold text-red-700 dark:text-red-400 text-sm">{selectedEmergency.emergency_type}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{t.driverIncidentLocation}</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmergency.location}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{t.patientAssignedAmbulance}</span>
                <p className="font-bold text-slate-900 dark:text-white">
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
                      className={`p-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        selectedEmergency.status === st
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
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

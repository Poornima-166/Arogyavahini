import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Ambulance, EmergencyRequest, EmergencyStatus, AmbulanceStatus } from '../types';
import { soundEffects } from '../utils/sound';
import { EmergencyStatusStepper } from './EmergencyStatusStepper';
import { 
  Truck, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle2, 
  Navigation, 
  Hospital, 
  ShieldCheck, 
  PhoneCall, 
  Radio, 
  Clock, 
  AlertTriangle,
  History,
  Check,
  BellRing,
  AlertCircle
} from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const { user, showToast } = useAuth();

  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null);
  const [assignedEmergencies, setAssignedEmergencies] = useState<EmergencyRequest[]>([]);
  const [allEmergencies, setAllEmergencies] = useState<EmergencyRequest[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Poll driver dispatches every 3 seconds and sync on user change
  useEffect(() => {
    setSelectedAmbulance(null);
    loadDriverData();
    const interval = setInterval(loadDriverData, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const loadDriverData = async () => {
    try {
      const ambRes = await api.getAmbulances();
      setAmbulances(ambRes.ambulances);

      // Select driver's assigned vehicle or the first one
      let currentAmb = selectedAmbulance;
      if (!currentAmb && ambRes.ambulances.length > 0) {
        let matched: Ambulance | undefined;
        if (user) {
          matched = ambRes.ambulances.find(
            (a) => (user.id && a.driver_user_id === user.id) ||
                   (user.name && a.driver_name.toLowerCase().includes(user.name.toLowerCase().split(' ')[0]))
          );
        }
        currentAmb = matched || ambRes.ambulances[0];
        setSelectedAmbulance(currentAmb);
      } else if (currentAmb) {
        const refreshed = ambRes.ambulances.find((a) => a.id === currentAmb!.id);
        if (refreshed) setSelectedAmbulance(refreshed);
      }

      // Fetch emergencies
      const reqRes = await api.getEmergencies();
      setAllEmergencies(reqRes.emergencies);

      if (currentAmb) {
        // Filter emergencies for this ambulance (active missions)
        const filtered = reqRes.emergencies.filter(
          (e) => e.ambulance_id === currentAmb!.id && !['COMPLETED', 'CANCELLED'].includes(e.status)
        );
        setAssignedEmergencies(filtered);
      }
    } catch (e) {
      console.warn('Error loading driver data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAmbulance = (amb: Ambulance) => {
    setSelectedAmbulance(amb);
    const filtered = allEmergencies.filter(
      (e) => e.ambulance_id === amb.id && !['COMPLETED', 'CANCELLED'].includes(e.status)
    );
    setAssignedEmergencies(filtered);
    showToast(`Switched driver view to Ambulance ${amb.vehicle_number}`, 'info');
  };

  // Driver accepts an unassigned incoming emergency
  const handleAcceptEmergency = async (emergencyId: number) => {
    setAcceptingId(emergencyId);
    try {
      soundEffects.playDriverDispatchTone();

      const res = await api.acceptEmergency(emergencyId, {
        driver_user_id: user?.id,
        driver_name: user?.name || selectedAmbulance?.driver_name,
        ambulance_id: selectedAmbulance?.id,
      });

      showToast(res.message || 'Emergency request accepted successfully!', 'success');
      soundEffects.playEmergencyAlert();
      await loadDriverData();
    } catch (err: any) {
      showToast(err.message || 'Failed to accept request or already claimed by another driver.', 'error');
      await loadDriverData();
    } finally {
      setAcceptingId(null);
    }
  };

  const handleUpdateStatus = async (emergencyId: number, nextStatus: EmergencyStatus) => {
    setIsUpdating(true);
    try {
      if (nextStatus === 'ON_THE_WAY') {
        soundEffects.playEmergencyAlert();
      } else {
        soundEffects.playSuccessTone();
      }

      const res = await api.updateEmergencyStatus(
        emergencyId,
        nextStatus,
        `Driver ${user?.name || selectedAmbulance?.driver_name || 'Crew'}`,
        selectedAmbulance?.id
      );

      showToast(res.message, 'success');
      await loadDriverData();
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAmbulanceStatus = async (status: AmbulanceStatus) => {
    if (!selectedAmbulance) return;
    try {
      await api.updateAmbulanceStatus(selectedAmbulance.id, status);
      showToast(`Ambulance availability set to ${status}`, 'success');
      await loadDriverData();
    } catch (e: any) {
      showToast(e.message || 'Failed to update ambulance status', 'error');
    }
  };

  // Filter unassigned incoming requests that are waiting for driver acceptance
  const incomingRequests = allEmergencies.filter(
    (e) => e.status === 'WAITING_FOR_DRIVER' && !e.ambulance_id
  );

  // Active active emergency for current vehicle/driver
  const activeMission = assignedEmergencies.length > 0 ? assignedEmergencies[0] : null;

  return (
    <div id="driver-dashboard-root" className="space-y-6 pb-12">
      {/* Driver Cockpit Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Ambulance Crew Cockpit</h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Driver Module
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user ? (
                <>
                  Logged In Driver: <span className="font-semibold text-slate-800">{user.name}</span> • Vehicle: <span className="font-bold font-mono text-slate-900">{selectedAmbulance?.vehicle_number || 'None'}</span> • Driver Phone: <span className="font-mono text-slate-700">{user.phone || selectedAmbulance?.phone}</span>
                </>
              ) : (
                <>
                  Assigned Vehicle: <span className="font-bold font-mono text-slate-900">{selectedAmbulance?.vehicle_number || 'None'}</span> • On-Duty Driver: <span className="font-semibold text-slate-700">{selectedAmbulance?.driver_name || 'Unassigned'}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Vehicle Switcher Pill Bar */}
        <div id="driver-ambulance-status" className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Switch Vehicle:</span>
          {ambulances.map((amb) => (
            <button
              key={amb.id}
              onClick={() => handleSelectAmbulance(amb)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                selectedAmbulance?.id === amb.id
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="font-mono">{amb.vehicle_number}</span>
              <span className={`ml-1.5 text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                amb.status === 'AVAILABLE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : amb.status === 'ASSIGNED' || amb.status === 'BUSY'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {amb.status}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. INCOMING EMERGENCY REQUESTS (UNASSIGNED POOL) */}
      {/* ==================================================== */}
      <div id="driver-incoming-requests-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Incoming Emergency Requests</h3>
              <p className="text-xs text-slate-500">Unassigned emergencies waiting for driver acceptance</p>
            </div>
          </div>
          {incomingRequests.length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold animate-pulse">
              {incomingRequests.length} Pending SOS
            </span>
          )}
        </div>

        {incomingRequests.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
            <p className="font-medium text-slate-700">No unassigned emergency requests right now.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Standing by for incoming patient SOS triggers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomingRequests.map((req) => (
              <div 
                key={req.id} 
                className="bg-white rounded-2xl border-2 border-red-500 p-5 shadow-md space-y-4 animate-in fade-in"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                        🚨 SOS #{req.id}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                        WAITING FOR DRIVER
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-1.5">
                      {req.emergency_type}
                    </h4>
                  </div>
                </div>

                <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Incident Location</span>
                      <span className="font-semibold text-slate-900">{req.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700">Patient: <strong className="text-slate-900">{req.patient_name}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-slate-700">{req.phone}</span>
                    </div>
                  </div>

                  {req.notes && (
                    <div className="pt-1 border-t border-slate-200 text-slate-600 text-[11px]">
                      <strong className="text-slate-700">Medical Notes:</strong> {req.notes}
                    </div>
                  )}
                </div>

                {/* Accept Button */}
                <button
                  type="button"
                  onClick={() => handleAcceptEmergency(req.id)}
                  disabled={acceptingId === req.id}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{acceptingId === req.id ? 'Accepting & Dispatching...' : 'Accept Emergency Request'}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 2. MY ACTIVE EMERGENCY DISPATCH CARD (ONCE ACCEPTED) */}
      {/* ==================================================== */}
      {activeMission ? (
        <div id="driver-active-dispatch" className="bg-white rounded-2xl border-2 border-amber-500 shadow-md overflow-hidden animate-in fade-in duration-300">
          {/* Active Mission Header */}
          <div className="bg-[#0f172a] text-white p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center font-black animate-bounce">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider animate-pulse">
                    🚨 ACTIVE EMERGENCY MISSION #{activeMission.id}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(activeMission.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                  {activeMission.emergency_type}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-amber-400">
                Status: {activeMission.status}
              </span>
            </div>
          </div>

          {/* Stepper Status Progression */}
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <EmergencyStatusStepper currentStatus={activeMission.status} />
          </div>

          {/* Details & Interactive Action Buttons */}
          <div className="p-6 space-y-6">
            {/* Patient & Incident Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Patient Details
                </span>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{activeMission.patient_name}</span>
                </p>
                <div className="pt-2">
                  <a
                    href={`tel:${activeMission.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Patient ({activeMission.phone})</span>
                  </a>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1 md:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Emergency Incident Location
                </span>
                <p className="text-sm font-bold text-slate-900 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{activeMission.location}</span>
                </p>
                {activeMission.notes && (
                  <p className="text-xs text-slate-600 pt-1">
                    <span className="font-semibold text-slate-800">Medical Notes:</span> {activeMission.notes}
                  </p>
                )}
              </div>
            </div>

            {/* ACTION BUTTON CONTROLS (DISPATCH PROGRESSION WORKFLOW) */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Mission Progress Action Controls
                </h4>
                <span className="text-[11px] text-amber-800 font-medium">
                  Click the active button to progress the emergency response
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Start Journey / On the Way */}
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeMission.id, 'ON_THE_WAY')}
                  disabled={isUpdating || activeMission.status !== 'DRIVER_ACCEPTED'}
                  className={`p-3.5 rounded-xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-all shadow-xs ${
                    activeMission.status === 'DRIVER_ACCEPTED'
                      ? 'bg-orange-600 hover:bg-orange-700 text-white animate-pulse'
                      : ['ON_THE_WAY', 'REACHED'].includes(activeMission.status)
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Navigation className="w-5 h-5" />
                  <span>1. Start Journey (On The Way)</span>
                  {['ON_THE_WAY', 'REACHED'].includes(activeMission.status) && (
                    <span className="text-[10px] font-normal">✓ En Route</span>
                  )}
                </button>

                {/* 2. Mark as Reached */}
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeMission.id, 'REACHED')}
                  disabled={isUpdating || activeMission.status !== 'ON_THE_WAY'}
                  className={`p-3.5 rounded-xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-all shadow-xs ${
                    activeMission.status === 'ON_THE_WAY'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                      : activeMission.status === 'REACHED'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  <span>2. Mark Crew Reached Scene</span>
                  {activeMission.status === 'REACHED' && (
                    <span className="text-[10px] font-normal">✓ At Scene</span>
                  )}
                </button>

                {/* 3. Complete & Hospital Handover */}
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeMission.id, 'COMPLETED')}
                  disabled={isUpdating || activeMission.status !== 'REACHED'}
                  className={`p-3.5 rounded-xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-all shadow-xs ${
                    activeMission.status === 'REACHED'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Hospital className="w-5 h-5" />
                  <span>3. Complete Hospital Handover</span>
                  <span className="text-[10px] font-normal">Free Ambulance</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Standby state when no active emergency is assigned */
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <Check className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">Vehicle on Standby</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ambulance <span className="font-bold font-mono text-slate-800">{selectedAmbulance?.vehicle_number}</span> is currently available. When incoming emergency requests arrive, click <strong className="text-slate-800">"Accept Request"</strong> in the Incoming Requests section above to claim the mission.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleToggleAmbulanceStatus('AVAILABLE')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                selectedAmbulance?.status === 'AVAILABLE'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Set Available
            </button>

            <button
              onClick={() => handleToggleAmbulanceStatus('MAINTENANCE')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                selectedAmbulance?.status === 'MAINTENANCE'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Set Maintenance
            </button>
          </div>
        </div>
      )}

      {/* Driver Mission Log & Vehicle Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Specs */}
        <div id="driver-profile-info" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <h4 className="text-sm font-bold text-slate-900">Vehicle Equipment & Crew</h4>
          </div>

          {selectedAmbulance ? (
            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Vehicle Plate:</span>
                <span className="font-bold font-mono text-slate-900">{selectedAmbulance.vehicle_number}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Medical Level:</span>
                <span className="font-semibold text-slate-800">{selectedAmbulance.type}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Base Station:</span>
                <span className="font-semibold text-slate-800">{selectedAmbulance.base_location}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Primary Contact:</span>
                <span className="font-bold font-mono text-slate-900">{selectedAmbulance.phone}</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-500">Current Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedAmbulance.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {selectedAmbulance.status}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Select an ambulance to view equipment profile</p>
          )}
        </div>

        {/* Past Dispatches for this driver / ambulance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" />
              <h4 className="text-sm font-bold text-slate-900">Completed Emergency Missions</h4>
            </div>
            <span className="text-xs text-slate-400">All recorded trips</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto divide-y divide-slate-100">
            {allEmergencies
              .filter((e) => e.ambulance_id === selectedAmbulance?.id)
              .map((item) => (
                <div key={item.id} className="pt-2.5 text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">#{item.id} - {item.emergency_type}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">{item.location} • Patient: {item.patient_name}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            {allEmergencies.filter((e) => e.ambulance_id === selectedAmbulance?.id).length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">No past missions logged for this vehicle yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

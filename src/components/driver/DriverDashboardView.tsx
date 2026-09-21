import React from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  ShieldCheck, 
  AlertTriangle, 
  Heart, 
  Activity, 
  Radio, 
  ArrowRight,
  Sparkles,
  Compass,
  Check
} from 'lucide-react';
import { Ambulance, EmergencyRequest, AmbulanceStatus } from '../../types';
import { calculateDistanceKm, determinePriority, getGreeting, formatTimeAgo } from './driverHelpers';
import { DriverTab } from './DriverSidebar';

interface DriverDashboardViewProps {
  driverName: string;
  selectedAmbulance: Ambulance | null;
  ambulances: Ambulance[];
  onSelectAmbulance: (amb: Ambulance) => void;
  activeMission: EmergencyRequest | null;
  incomingRequests: EmergencyRequest[];
  todayDispatchesCount: number;
  driverCoords: { latitude: number; longitude: number; accuracy?: number } | null;
  gpsPermissionStatus: 'granted' | 'denied' | 'prompt' | 'unavailable' | 'demo';
  lastGpsTimestamp: string | null;
  onSelectTab: (tab: DriverTab) => void;
  onAcceptEmergency: (id: number) => void;
  isAcceptingId: number | null;
  onToggleAmbulanceStatus: (status: AmbulanceStatus) => void;
  onEnableLiveLocation: () => void;
}

export const DriverDashboardView: React.FC<DriverDashboardViewProps> = ({
  driverName,
  selectedAmbulance,
  ambulances,
  onSelectAmbulance,
  activeMission,
  incomingRequests,
  todayDispatchesCount,
  driverCoords,
  gpsPermissionStatus,
  lastGpsTimestamp,
  onSelectTab,
  onAcceptEmergency,
  isAcceptingId,
  onToggleAmbulanceStatus,
  onEnableLiveLocation,
}) => {
  const greeting = getGreeting();
  const currentVehicleNum = selectedAmbulance?.vehicle_number || 'KA-01-EA-1008';
  
  // Highest priority incoming emergency (Critical first)
  const topIncoming = React.useMemo(() => {
    if (incomingRequests.length === 0) return null;
    const sorted = [...incomingRequests].sort((a, b) => {
      const pA = determinePriority(a.emergency_type, a.notes);
      const pB = determinePriority(b.emergency_type, b.notes);
      if (pA === 'CRITICAL' && pB !== 'CRITICAL') return -1;
      if (pB === 'CRITICAL' && pA !== 'CRITICAL') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return sorted[0];
  }, [incomingRequests]);

  const topIncomingDist = React.useMemo(() => {
    if (!topIncoming) return null;
    const patLat = topIncoming.latitude ?? topIncoming.patient_latitude;
    const patLng = topIncoming.longitude ?? topIncoming.patient_longitude;
    return calculateDistanceKm(driverCoords?.latitude, driverCoords?.longitude, patLat, patLng);
  }, [topIncoming, driverCoords]);

  const topIncomingPriority = topIncoming ? determinePriority(topIncoming.emergency_type, topIncoming.notes) : 'NORMAL';

  // Overall status label
  const displayStatus = activeMission
    ? 'On Emergency'
    : selectedAmbulance?.status === 'AVAILABLE'
    ? 'Available'
    : selectedAmbulance?.status === 'MAINTENANCE'
    ? 'Maintenance'
    : 'Busy';

  return (
    <div id="driver-dashboard-view" className="space-y-6">
      {/* 1. TOP HERO AREA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
            Ambulance Crew Cockpit
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            {greeting}, <span className="text-amber-600 dark:text-amber-400">{driverName}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Ambulance:
            </span>
            <span className="font-bold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
              {currentVehicleNum}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Status:
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] ${
                activeMission
                  ? 'bg-red-600 text-white animate-pulse'
                  : displayStatus === 'Available'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              }`}
            >
              {displayStatus}
            </span>
          </div>
        </div>

        {/* Quick Ambulance Vehicle Selector */}
        {ambulances.length > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 px-2">Unit:</span>
            {ambulances.map((amb) => (
              <button
                key={amb.id}
                type="button"
                onClick={() => onSelectAmbulance(amb)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  selectedAmbulance?.id === amb.id
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {amb.vehicle_number}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. FOUR COMPACT SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Current Status
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              activeMission 
                ? 'bg-red-100 dark:bg-red-950 text-red-600'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
            }`}>
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {activeMission ? activeMission.status.replace(/_/g, ' ') : displayStatus}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {activeMission ? 'Dispatched to incident' : 'Ready for emergency callouts'}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            {!activeMission ? (
              <button
                type="button"
                onClick={() => onToggleAmbulanceStatus(selectedAmbulance?.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE')}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Toggle {selectedAmbulance?.status === 'AVAILABLE' ? 'Maintenance' : 'Available'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSelectTab('active')}
                className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Manage active status</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Active Emergency */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Emergency
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              activeMission ? 'bg-red-600 text-white animate-bounce' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white truncate">
              {activeMission ? activeMission.emergency_type : 'None Assigned'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {activeMission ? `Patient: ${activeMission.patient_name}` : 'Ambulance is idle in standby'}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {activeMission ? (
              <button
                type="button"
                onClick={() => onSelectTab('active')}
                className="text-[11px] font-black text-red-600 dark:text-red-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>View Mission #{activeMission.id}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Standby ready
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Today's Dispatches */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Today's Dispatches
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {todayDispatchesCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Completed missions today
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onSelectTab('history')}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View dispatch log</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 4: Ambulance / GPS Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ambulance / GPS
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              driverCoords ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-amber-100 dark:bg-amber-950 text-amber-600'
            }`}>
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-sm font-black font-mono text-slate-900 dark:text-white truncate">
              {driverCoords
                ? `${driverCoords.latitude.toFixed(4)}, ${driverCoords.longitude.toFixed(4)}`
                : 'GPS Searching...'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {driverCoords
                ? `Accuracy: ±${Math.round(driverCoords.accuracy || 10)}m`
                : 'Click to acquire GPS signal'}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">
              {lastGpsTimestamp || 'Live'}
            </span>
            <button
              type="button"
              onClick={onEnableLiveLocation}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {driverCoords ? 'Re-sync' : 'Fix GPS'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. CONDITIONAL HIGHLIGHT: ACTIVE EMERGENCY (IF ANY) */}
      {activeMission ? (
        <div
          id="driver-dashboard-active-emergency-banner"
          className="bg-linear-to-r from-red-600 to-rose-700 text-white rounded-2xl p-6 shadow-lg space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white text-red-600 flex items-center justify-center font-black shadow-md shrink-0 animate-bounce">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-red-950/80 text-amber-300 border border-red-400/40">
                  🚨 ACTIVE EMERGENCY IN PROGRESS
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-1">
                  {activeMission.emergency_type}
                </h2>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-white/20 font-mono text-xs font-black uppercase backdrop-blur-xs">
              STATUS: {activeMission.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-black/20 p-4 rounded-xl backdrop-blur-xs border border-white/10">
            <div>
              <span className="text-white/70 text-[10px] uppercase font-bold block">Patient</span>
              <span className="font-bold text-white text-sm">{activeMission.patient_name}</span>
            </div>
            <div>
              <span className="text-white/70 text-[10px] uppercase font-bold block">Destination</span>
              <span className="font-bold text-white truncate block">
                {activeMission.hospital_destination || activeMission.location}
              </span>
            </div>
            <div>
              <span className="text-white/70 text-[10px] uppercase font-bold block">Estimated ETA</span>
              <span className="font-bold text-white text-sm">
                {activeMission.current_eta_minutes ? `${activeMission.current_eta_minutes} mins` : 'Calculating...'}
              </span>
            </div>
            <div>
              <span className="text-white/70 text-[10px] uppercase font-bold block">Phone</span>
              <a href={`tel:${activeMission.phone}`} className="font-bold font-mono text-amber-200 hover:underline">
                {activeMission.phone}
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onSelectTab('active')}
              className="px-5 py-3 rounded-xl bg-white text-red-700 hover:bg-slate-100 font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <span>OPEN ACTIVE EMERGENCY</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('navigation')}
              className="px-4 py-3 rounded-xl bg-red-900/60 hover:bg-red-900/80 text-white font-bold text-sm border border-red-400/40 transition cursor-pointer flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              <span>Open Live Route Navigation</span>
            </button>
          </div>
        </div>
      ) : (
        /* 4. INCOMING EMERGENCY CARD (IF ANY) */
        <div id="driver-dashboard-incoming-section" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <span>Incoming Emergency Alert</span>
              {incomingRequests.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">
                  {incomingRequests.length} in queue
                </span>
              )}
            </h3>

            {incomingRequests.length > 1 && (
              <button
                type="button"
                onClick={() => onSelectTab('incoming')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                View all ({incomingRequests.length})
              </button>
            )}
          </div>

          {topIncoming ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-500 p-6 shadow-md space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black animate-pulse shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase">
                        {topIncomingPriority} PRIORITY
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(topIncoming.created_at)}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      🚨 {topIncoming.emergency_type}
                    </h4>
                  </div>
                </div>

                <div className="text-right sm:block">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Distance</span>
                  <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                    {topIncomingDist !== null ? `${topIncomingDist} km` : 'Proximity nearby'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Patient</span>
                  <span className="font-bold text-slate-900 dark:text-white">{topIncoming.patient_name}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Incident Location</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span className="truncate">{topIncoming.location}</span>
                  </span>
                </div>
              </div>

              {topIncoming.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50/50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-900/40">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Patient Note: </span>
                  {topIncoming.notes}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onAcceptEmergency(topIncoming.id)}
                  disabled={isAcceptingId === topIncoming.id}
                  className="flex-1 min-w-[140px] py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-black text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isAcceptingId === topIncoming.id ? 'Accepting...' : 'ACCEPT EMERGENCY'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTab('incoming')}
                  className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  VIEW EMERGENCY DETAILS
                </button>
              </div>
            </div>
          ) : (
            /* No active emergency and no incoming requests */
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  No active emergency requests
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Your ambulance is ready for dispatch. Our AI dispatch system monitors regional 108 emergency calls and will alert your cockpit automatically.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

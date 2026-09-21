import React from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Compass, 
  Clock, 
  Wrench, 
  Fuel, 
  Battery, 
  HeartPulse, 
  Radio
} from 'lucide-react';
import { Ambulance, AmbulanceStatus, EmergencyRequest, EmergencyStatus } from '../../types';

interface DriverAmbulanceStatusViewProps {
  selectedAmbulance: Ambulance | null;
  ambulances: Ambulance[];
  onSelectAmbulance: (amb: Ambulance) => void;
  driverName: string;
  driverPhone?: string;
  driverCoords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number | null;
    heading?: number | null;
  } | null;
  gpsPermissionStatus: 'granted' | 'denied' | 'prompt' | 'unavailable' | 'demo';
  lastGpsTimestamp: string | null;
  onEnableLiveLocation: () => void;
  onToggleAmbulanceStatus: (status: AmbulanceStatus) => void;
  activeMission: EmergencyRequest | null;
  onUpdateEmergencyStatus?: (id: number, status: EmergencyStatus) => void;
  onSwitchTab?: (tab: any) => void;
}

export const DriverAmbulanceStatusView: React.FC<DriverAmbulanceStatusViewProps> = ({
  selectedAmbulance,
  ambulances,
  onSelectAmbulance,
  driverName,
  driverPhone,
  driverCoords,
  gpsPermissionStatus,
  lastGpsTimestamp,
  onEnableLiveLocation,
  onToggleAmbulanceStatus,
  activeMission,
  onUpdateEmergencyStatus,
  onSwitchTab,
}) => {
  const currentStatus = activeMission ? activeMission.status : (selectedAmbulance?.status || 'AVAILABLE');

  return (
    <div id="driver-ambulance-status-view" className="space-y-6">
      {/* 1. VEHICLE PROFILE HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Ambulance Status & Telemetry
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                108 FLEET UNIT
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Unit: <strong className="font-mono text-slate-900 dark:text-white">{selectedAmbulance?.vehicle_number || 'KA-01-EA-1008'}</strong> • Driver: <strong className="text-slate-800 dark:text-slate-200">{driverName}</strong>
            </p>
          </div>
        </div>

        {/* Vehicle Switcher */}
        {ambulances.length > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 px-2">Select Vehicle:</span>
            {ambulances.map((amb) => (
              <button
                key={amb.id}
                type="button"
                onClick={() => onSelectAmbulance(amb)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
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

      {/* 2. CURRENT METRICS SUMMARY (4 TILES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ambulance Number */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Ambulance Number</span>
          <div className="text-base font-black font-mono text-slate-900 dark:text-white">
            {selectedAmbulance?.vehicle_number || 'KA-01-EA-1008'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Type: {selectedAmbulance?.type || 'Advanced Life Support (ALS)'}</span>
        </div>

        {/* Assigned Driver */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Lead Driver / Crew</span>
          <div className="text-base font-bold text-slate-900 dark:text-white truncate">
            {driverName}
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{driverPhone || selectedAmbulance?.phone || '+91 98450 12345'}</span>
        </div>

        {/* Current Operational Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current Status</span>
          <div className="text-base font-black uppercase text-amber-600 dark:text-amber-400">
            {activeMission ? activeMission.status.replace(/_/g, ' ') : selectedAmbulance?.status || 'AVAILABLE'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {activeMission ? 'Emergency in Progress' : 'Ready on Standby'}
          </span>
        </div>

        {/* Live GPS Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GPS Signal</span>
            <span className={`w-2 h-2 rounded-full ${driverCoords ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
          </div>
          <div className="text-sm font-black font-mono text-slate-900 dark:text-white truncate">
            {driverCoords
              ? `${driverCoords.latitude.toFixed(4)}, ${driverCoords.longitude.toFixed(4)}`
              : 'Acquiring Fix...'}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>±{Math.round(driverCoords?.accuracy || 10)}m</span>
            <button
              type="button"
              onClick={onEnableLiveLocation}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
            >
              Re-sync
            </button>
          </div>
        </div>
      </div>

      {/* 3. DEDICATED STATUS CONTROLS (ONLY SHOW SENSIBLE ACTIONS) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Operational Status Controls
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Broadcast vehicle availability to regional 108 Emergency Dispatch CAD
          </p>
        </div>

        {/* If Active Mission in Progress, show Emergency Status Transitions */}
        {activeMission ? (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase">
                Active Mission #{activeMission.id} Status Actions:
              </span>
              <button
                type="button"
                onClick={() => onSwitchTab?.('active')}
                className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Go to Active Emergency View →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {/* AVAILABLE */}
              <button
                type="button"
                disabled={true}
                className="p-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed text-center"
              >
                AVAILABLE
                <span className="text-[9px] block text-slate-400">Busy on SOS</span>
              </button>

              {/* ON EMERGENCY */}
              <button
                type="button"
                onClick={() => onUpdateEmergencyStatus?.(activeMission.id, 'DRIVER_ACCEPTED')}
                className={`p-2.5 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                  activeMission.status === 'DRIVER_ACCEPTED'
                    ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-500'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                ON EMERGENCY
                <span className="text-[9px] block opacity-75">Claimed</span>
              </button>

              {/* ON THE WAY */}
              <button
                type="button"
                onClick={() => onUpdateEmergencyStatus?.(activeMission.id, 'ON_THE_WAY')}
                className={`p-2.5 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                  activeMission.status === 'ON_THE_WAY'
                    ? 'bg-orange-600 text-white shadow-xs ring-2 ring-orange-500'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                ON THE WAY
                <span className="text-[9px] block opacity-75">En Route</span>
              </button>

              {/* AT SCENE */}
              <button
                type="button"
                onClick={() => onUpdateEmergencyStatus?.(activeMission.id, 'REACHED')}
                className={`p-2.5 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                  activeMission.status === 'REACHED' && activeMission.navigation_stage !== 'TO_HOSPITAL'
                    ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                AT SCENE
                <span className="text-[9px] block opacity-75">Reached</span>
              </button>

              {/* PATIENT ON BOARD */}
              <button
                type="button"
                onClick={() => {
                  if (activeMission.status !== 'REACHED') {
                    onUpdateEmergencyStatus?.(activeMission.id, 'REACHED');
                  }
                  onSwitchTab?.('active');
                }}
                className="p-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition text-center cursor-pointer"
              >
                PATIENT ON BOARD
                <span className="text-[9px] block opacity-75">To Hospital</span>
              </button>

              {/* COMPLETED */}
              <button
                type="button"
                onClick={() => {
                  onUpdateEmergencyStatus?.(activeMission.id, 'COMPLETED');
                }}
                className="p-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition text-center cursor-pointer"
              >
                COMPLETED
                <span className="text-[9px] block opacity-75">Handover</span>
              </button>
            </div>
          </div>
        ) : (
          /* When idle / no emergency, toggle availability or maintenance */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onToggleAmbulanceStatus('AVAILABLE')}
              className={`p-4 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                selectedAmbulance?.status === 'AVAILABLE'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-black">AVAILABLE FOR DISPATCH</span>
              <span className="text-[10px] font-normal opacity-80">Ambulance is in full service</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleAmbulanceStatus('MAINTENANCE')}
              className={`p-4 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                selectedAmbulance?.status === 'MAINTENANCE'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Wrench className="w-5 h-5" />
              <span className="text-sm font-black">MAINTENANCE / REFUELLING</span>
              <span className="text-[10px] font-normal opacity-80">Temporarily offline for servicing</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchTab?.('incoming')}
              className="p-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex flex-col items-center justify-center gap-1.5 cursor-pointer"
            >
              <Radio className="w-5 h-5 text-red-500" />
              <span className="text-sm font-black">VIEW INCOMING CALLS</span>
              <span className="text-[10px] font-normal opacity-80">Browse available emergency queue</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. VEHICLE EQUIPMENT & READINESS CHECKLIST */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Medical Equipment & Readiness Verification
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Oxygen Cylinders</span>
              <span className="font-black text-slate-900 dark:text-white">100% Full (2x 40L)</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Defibrillator / AED</span>
              <span className="font-black text-slate-900 dark:text-white">Calibrated & Charged</span>
            </div>
            <HeartPulse className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Fuel Tank Level</span>
              <span className="font-black text-slate-900 dark:text-white">88% (Diesel)</span>
            </div>
            <Fuel className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Auxiliary Battery</span>
              <span className="font-black text-slate-900 dark:text-white">13.8V Healthy</span>
            </div>
            <Battery className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

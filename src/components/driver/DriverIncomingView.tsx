import React, { useState } from 'react';
import { 
  BellRing, 
  AlertTriangle, 
  MapPin, 
  User, 
  Phone, 
  PhoneCall, 
  Clock, 
  Heart, 
  CheckCircle2, 
  XCircle, 
  Filter,
  ArrowUpDown,
  Search
} from 'lucide-react';
import { EmergencyRequest } from '../../types';
import { calculateDistanceKm, determinePriority, formatTimeAgo } from './driverHelpers';

interface DriverIncomingViewProps {
  incomingRequests: EmergencyRequest[];
  onAcceptEmergency: (id: number) => void;
  isAcceptingId: number | null;
  driverCoords: { latitude: number; longitude: number } | null;
  onRejectEmergency?: (id: number) => void;
}

export const DriverIncomingView: React.FC<DriverIncomingViewProps> = ({
  incomingRequests,
  onAcceptEmergency,
  isAcceptingId,
  driverCoords,
  onRejectEmergency,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'NORMAL'>('ALL');
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  const handleReject = (id: number) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    if (onRejectEmergency) {
      onRejectEmergency(id);
    }
  };

  // Filter and sort critical emergencies first
  const displayRequests = React.useMemo(() => {
    return incomingRequests
      .filter((req) => !dismissedIds.has(req.id))
      .map((req) => {
        const priority = determinePriority(req.emergency_type, req.notes);
        const patLat = req.latitude ?? req.patient_latitude;
        const patLng = req.longitude ?? req.patient_longitude;
        const distance = calculateDistanceKm(driverCoords?.latitude, driverCoords?.longitude, patLat, patLng);
        return {
          ...req,
          calculatedPriority: priority,
          calculatedDistance: distance,
        };
      })
      .filter((req) => {
        if (filterPriority !== 'ALL' && req.calculatedPriority !== filterPriority) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            req.emergency_type.toLowerCase().includes(q) ||
            req.patient_name.toLowerCase().includes(q) ||
            req.location.toLowerCase().includes(q) ||
            String(req.id).includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        // Priority weight: CRITICAL (3) > HIGH (2) > NORMAL (1)
        const weight = { CRITICAL: 3, HIGH: 2, NORMAL: 1 };
        const diff = weight[b.calculatedPriority] - weight[a.calculatedPriority];
        if (diff !== 0) return diff;
        // Then by recency
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [incomingRequests, dismissedIds, filterPriority, searchQuery, driverCoords]);

  return (
    <div id="driver-incoming-view" className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-xs">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Incoming Emergency Requests
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live regional SOS queue • Prioritized by medical urgency
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-xs border border-red-200 dark:border-red-900">
              {displayRequests.length} Available
            </span>
          </div>
        </div>

        {/* Search & Priority Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by patient, emergency or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Filter:</span>
            {(['ALL', 'CRITICAL', 'HIGH', 'NORMAL'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFilterPriority(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterPriority === p
                    ? p === 'CRITICAL'
                      ? 'bg-red-600 text-white shadow-xs'
                      : p === 'HIGH'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List / Grid of Requests */}
      {displayRequests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Incoming Emergencies
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            All regional SOS calls are currently assigned or in triage. Your ambulance is in standby status.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayRequests.map((req) => {
            const isCritical = req.calculatedPriority === 'CRITICAL';
            const isHigh = req.calculatedPriority === 'HIGH';

            return (
              <div
                key={req.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border-2 p-5 shadow-md flex flex-col justify-between space-y-4 transition-all ${
                  isCritical
                    ? 'border-red-500 ring-2 ring-red-500/20'
                    : isHigh
                    ? 'border-amber-400'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Card Top: Urgent Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            isCritical
                              ? 'bg-red-600 text-white animate-pulse'
                              : isHigh
                              ? 'bg-amber-500 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {req.calculatedPriority} PRIORITY
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(req.created_at)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          #{req.id}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1.5 flex items-center gap-1.5">
                        {isCritical && <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
                        <span>{req.emergency_type}</span>
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Distance</span>
                      <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                        {req.calculatedDistance !== null ? `${req.calculatedDistance} km` : '~2.4 km'}
                      </span>
                    </div>
                  </div>

                  {/* Incident & Patient Details */}
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Incident Location</span>
                        <span className="font-bold text-slate-900 dark:text-white">{req.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          Patient: <strong className="text-slate-900 dark:text-white">{req.patient_name}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-slate-700 dark:text-slate-300">{req.phone}</span>
                      </div>
                    </div>

                    {req.notes && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px]">
                        <strong className="text-slate-800 dark:text-slate-200">Patient Notes: </strong>
                        {req.notes}
                      </div>
                    )}

                    {/* Patient Medical Alerts */}
                    {(req.patient_blood_type || req.patient_allergies) && (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        {req.patient_blood_type && (
                          <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-black text-[10px] flex items-center gap-1">
                            <Heart className="w-2.5 h-2.5 fill-red-600 text-red-600" />
                            Blood: {req.patient_blood_type}
                          </span>
                        )}
                        {req.patient_allergies && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold text-[10px] flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                            Allergies: {req.patient_allergies}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions: Call, Reject, Accept */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${req.phone}`}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                      <span>Call Patient</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleReject(req.id)}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-500 hover:text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      title="Decline / Pass request to next closest unit"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAcceptEmergency(req.id)}
                    disabled={isAcceptingId === req.id}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isAcceptingId === req.id ? 'Claiming SOS...' : 'ACCEPT EMERGENCY DISPATCH'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

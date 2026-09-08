import React, { useState } from 'react';
import { useLocation, CITY_PRESETS, LocationPreset } from '../context/LocationContext';
import { 
  Compass, 
  MapPin, 
  Crosshair, 
  Check, 
  X, 
  Loader2, 
  Navigation, 
  AlertTriangle, 
  ShieldCheck, 
  Radio, 
  ExternalLink 
} from 'lucide-react';

interface LiveLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveLocationModal: React.FC<LiveLocationModalProps> = ({ isOpen, onClose }) => {
  const { 
    userCoords, 
    locationPermission, 
    locationSource, 
    resolvedAddress, 
    cityName,
    lastGpsTimestamp, 
    isLocating, 
    requestLocation, 
    setManualCoords 
  } = useLocation();

  const [customLat, setCustomLat] = useState<string>('');
  const [customLng, setCustomLng] = useState<string>('');
  const [customError, setCustomError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAcquireGps = async () => {
    await requestLocation(true);
  };

  const handleSelectPreset = async (preset: LocationPreset) => {
    await setManualCoords(preset.latitude, preset.longitude, `${preset.name}, ${preset.city}`);
  };

  const handleApplyCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setCustomError('Please enter valid latitude (-90 to 90) and longitude (-180 to 180)');
      return;
    }
    setCustomError(null);
    await setManualCoords(lat, lng, `Custom Pinned: [${lat.toFixed(5)}, ${lng.toFixed(5)}]`);
    setCustomLat('');
    setCustomLng('');
  };

  const getSourceBadge = () => {
    switch (locationSource) {
      case 'gps':
        return { label: 'High-Precision Browser GPS', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300' };
      case 'ip':
        return { label: 'Network / IP Geolocation', color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300' };
      case 'preset':
        return { label: 'Preset / Calibrated Location', color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300' };
      case 'cached':
        return { label: 'Cached Device Coordinates', color: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300' };
      default:
        return { label: 'Regional Command Center', color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300' };
    }
  };

  const badge = getSourceBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-[#0f172a] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-bold shadow-xs">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Live GPS & Location Calibrator</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time coordinates used for SOS dispatch & ETA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Current Active Location Card */}
          <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Active Location Fix
                </span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${badge.color}`}>
                {badge.label}
              </span>
            </div>

            {userCoords ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-emerald-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Latitude</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{userCoords.latitude.toFixed(5)}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-emerald-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Longitude</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{userCoords.longitude.toFixed(5)}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-emerald-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Accuracy</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">±{userCoords.accuracy || 15}m</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-emerald-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Last Ping</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs">{lastGpsTimestamp || 'Just now'}</span>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-emerald-200 dark:border-slate-700 flex items-start gap-2 text-xs">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">Resolved Address</span>
                    <span className="font-medium text-slate-900 dark:text-white leading-relaxed">{resolvedAddress || 'Resolving street address...'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                <span>Acquiring location coordinates...</span>
              </div>
            )}

            {/* GPS Re-acquire Button */}
            <button
              type="button"
              onClick={handleAcquireGps}
              disabled={isLocating}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Querying Browser GPS Sensor...' : 'Acquire High-Accuracy Device GPS'}</span>
            </button>
          </div>

          {/* Quick City Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Quick Pin Presets (Major Hubs)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select any regional hub to test immediate ambulance routing and nearest emergency hospitals:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {CITY_PRESETS.map((preset) => {
                const isSelected = userCoords && 
                  Math.abs(userCoords.latitude - preset.latitude) < 0.005 && 
                  Math.abs(userCoords.longitude - preset.longitude) < 0.005;

                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{preset.city}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block max-w-[180px]">
                        {preset.name}
                      </span>
                    </div>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Coordinate Input */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Custom Coordinates
            </label>
            <form onSubmit={handleApplyCustom} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude (e.g. 12.9716)"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude (e.g. 77.5946)"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {customError && (
                <p className="text-[11px] text-red-600 dark:text-red-400">{customError}</p>
              )}
              <button
                type="submit"
                className="w-full py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Apply Custom Coordinates
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

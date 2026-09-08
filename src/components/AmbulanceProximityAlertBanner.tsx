import React from 'react';
import { EmergencyRequest } from '../types';
import { 
  BellRing, 
  Radio, 
  Clock, 
  Navigation, 
  PhoneCall, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle,
  X,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AmbulanceProximityAlertBannerProps {
  emergency: EmergencyRequest;
  distanceKm: number;
  etaMinutes: number;
  onPlayVoiceAnnouncement: () => void;
  onDismiss: () => void;
  isAudioSpeaking?: boolean;
}

export const AmbulanceProximityAlertBanner: React.FC<AmbulanceProximityAlertBannerProps> = ({
  emergency,
  distanceKm,
  etaMinutes,
  onPlayVoiceAnnouncement,
  onDismiss,
  isAudioSpeaking = false,
}) => {
  const { language } = useLanguage();

  const getTitle = () => {
    if (language === 'kn') return '🚨 ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಮೀಪದಲ್ಲಿದೆ: 2 ಕಿ.ಮೀ ವ್ಯಾಪ್ತಿಯೊಳಗೆ!';
    if (language === 'hi') return '🚨 एम्बुलेंस नजदीक है: 2 किलोमीटर के दायरे में!';
    return '🚨 AMBULANCE NEARBY: Within 2 Kilometers!';
  };

  const getSubtitle = () => {
    const unit = emergency.vehicle_number || 'Emergency Unit';
    if (language === 'kn') {
      return `ನಿಯೋಜಿತ ${unit} ನಿಮ್ಮ ಸ್ಥಳದಿಂದ ಕೇವಲ ${distanceKm.toFixed(1)} ಕಿಮೀ ದೂರದಲ್ಲಿದೆ. ಸಿದ್ಧರಾಗಿರಿ.`;
    }
    if (language === 'hi') {
      return `सौंपी गई एम्बुलेंस ${unit} आपके स्थान से केवल ${distanceKm.toFixed(1)} किमी दूर है। कृपया तैयार रहें।`;
    }
    return `Assigned ambulance ${unit} is ${distanceKm.toFixed(1)} km away (~${etaMinutes} mins ETA). Please ensure street and gate access is clear.`;
  };

  return (
    <div 
      id="ambulance-2km-proximity-alert-banner"
      className="bg-gradient-to-r from-amber-500/15 via-red-500/15 to-amber-500/10 dark:from-amber-950/40 dark:via-red-950/40 dark:to-slate-900 border-2 border-amber-500 dark:border-amber-400 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300"
    >
      {/* Background radar pulse ring */}
      <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-amber-500/10 dark:bg-amber-400/5 animate-ping pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 dark:bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30 shrink-0 relative">
            <Radio className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-white dark:border-slate-900 animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                AUTOMATED PROXIMITY ALERT
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30 text-[11px] font-bold">
                ≤ 2.0 KM RADIUS
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
              {getTitle()}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-xl">
              {getSubtitle()}
            </p>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            type="button"
            id="btn-play-voice-announcement"
            onClick={onPlayVoiceAnnouncement}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isAudioSpeaking
                ? 'bg-amber-500 text-slate-950 animate-pulse'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
            title="Listen to the spoken voice proximity alert"
          >
            <Volume2 className="w-4 h-4 text-amber-500" />
            <span>{isAudioSpeaking ? 'Announcing...' : 'Hear Voice Alert'}</span>
          </button>

          {emergency.driver_phone && (
            <a
              id="btn-call-driver-proximity"
              href={`tel:${emergency.driver_phone}`}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Call driver directly"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Driver</span>
            </a>
          )}

          <button
            type="button"
            id="btn-dismiss-proximity-banner"
            onClick={onDismiss}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Acknowledge and dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time telemetry metrics and Arrival Preparation Checklist */}
      <div className="mt-4 pt-3.5 border-t border-amber-500/20 dark:border-amber-400/20 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Metric 1: Distance */}
        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/30 flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-blue-500" />
            GPS Distance:
          </span>
          <span className="text-sm font-black text-slate-900 dark:text-white">
            {distanceKm.toFixed(1)} km
          </span>
        </div>

        {/* Metric 2: Live ETA */}
        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/30 flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Estimated Arrival:
          </span>
          <span className="text-sm font-black text-amber-600 dark:text-amber-400">
            ~{etaMinutes} Mins
          </span>
        </div>

        {/* Metric 3: Priority Clearance */}
        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/30 flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Priority Signal:
          </span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Green Corridor Active
          </span>
        </div>
      </div>

      {/* Patient Pre-Arrival Action Checklist */}
      <div className="mt-3 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 text-[11px] text-slate-700 dark:text-slate-200">
        <span className="font-bold block text-amber-800 dark:text-amber-300 mb-1">
          ✓ Recommended Pre-Arrival Steps (Within 2 km):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Unlock front door/gate & turn on outside lights</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Keep your phone ready for the driver's call</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Gather medication list or patient ID</span>
          </div>
        </div>
      </div>
    </div>
  );
};

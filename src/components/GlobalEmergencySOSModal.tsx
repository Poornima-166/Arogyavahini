import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { soundEffects } from '../utils/sound';
import { EmergencyRequest, Ambulance } from '../types';
import { 
  AlertOctagon, 
  Truck, 
  Phone, 
  MapPin, 
  Activity, 
  Heart, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Compass, 
  Loader2, 
  X, 
  PhoneCall, 
  Zap, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

interface GlobalEmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmergencyDispatched?: (emergency: EmergencyRequest) => void;
}

const triggerHaptic = (pattern: number[] = [150, 80, 150]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore silently on unsupported devices
    }
  }
};

const EMERGENCY_TYPES = [
  { id: 'Cardiac Emergency', label: 'Cardiac Emergency (Chest Pain)', icon: Heart, color: 'text-red-500' },
  { id: 'Severe Trauma / Accident', label: 'Severe Trauma / Road Accident', icon: AlertTriangle, color: 'text-amber-500' },
  { id: 'Respiratory Distress', label: 'Severe Respiratory Distress', icon: Activity, color: 'text-blue-500' },
  { id: 'Stroke / Unconscious', label: 'Stroke / Unconscious State', icon: Zap, color: 'text-purple-500' },
  { id: 'Obstetric Emergency', label: 'Pregnancy / Labor Emergency', icon: ShieldAlert, color: 'text-pink-500' },
  { id: 'General Critical Emergency', label: 'Other Critical Emergency', icon: AlertOctagon, color: 'text-red-600' }
];

export const GlobalEmergencySOSModal: React.FC<GlobalEmergencySOSModalProps> = ({
  isOpen,
  onClose,
  onEmergencyDispatched
}) => {
  const { user, isAuthenticated, demoLogin, showToast } = useAuth();
  const { userCoords, resolvedAddress, cityName, requestLocation, isLocating, nearbyHospitals } = useLocation();
  const { notify, fetchNotifications } = useNotifications();
  const { t } = useLanguage();

  const [emergencyType, setEmergencyType] = useState('Cardiac Emergency');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchedEmergency, setDispatchedEmergency] = useState<EmergencyRequest | null>(null);
  const [assignedAmbulance, setAssignedAmbulance] = useState<Ambulance | null>(null);
  const [existingActiveEmergency, setExistingActiveEmergency] = useState<EmergencyRequest | null>(null);

  // Sync user info and address when modal opens
  useEffect(() => {
    if (isOpen) {
      triggerHaptic([200, 100, 200]);
      if (user) {
        setPatientName(user.name || '');
        setPhone(user.phone || '+91 98765 43210');
      } else {
        setPatientName('Emergency Caller');
        setPhone('+91 98765 43210');
      }

      if (resolvedAddress) {
        setLocationInput(resolvedAddress);
      } else if (userCoords) {
        setLocationInput(`GPS Pin [${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)}] - ${cityName || 'Bengaluru'}`);
      } else {
        setLocationInput(`${cityName || 'Bengaluru'} Emergency Location`);
      }

      // Check if user already has an ongoing emergency
      api.getEmergencies()
        .then((res) => {
          if (user?.id) {
            const active = res.emergencies.find(
              (e) => e.patient_id === user.id && !['COMPLETED', 'CANCELLED'].includes(e.status)
            );
            if (active) setExistingActiveEmergency(active);
          }
        })
        .catch(() => {});
    } else {
      setDispatchedEmergency(null);
      setAssignedAmbulance(null);
      setExistingActiveEmergency(null);
    }
  }, [isOpen, user, resolvedAddress, userCoords, cityName]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const handleAcquireLocation = async () => {
    try {
      triggerHaptic([60, 40, 60]);
      const coords = await requestLocation(true);
      if (coords) {
        setLocationInput(`GPS Pin [${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}]`);
        showToast('📍 High-accuracy GPS location acquired!', 'success');
      }
    } catch {
      showToast('Could not acquire GPS automatically. You may enter location manually.', 'info');
    }
  };

  const handleDispatchEmergency = async () => {
    setIsSubmitting(true);
    triggerHaptic([300, 100, 300]);
    soundEffects.playEmergencyAlert();

    try {
      // 1. Ensure caller profile is established (auto-login if unauthenticated)
      let activeUserId = user?.id;
      if (!isAuthenticated || !user) {
        try {
          const loginRes = await api.demoLogin('patient');
          activeUserId = loginRes.user.id;
          await demoLogin('patient');
        } catch (e) {
          console.warn('Auto-login fallback used:', e);
        }
      }

      // 2. Prepare location and coordinates
      let finalLat = userCoords?.latitude;
      let finalLng = userCoords?.longitude;
      let finalLocation = locationInput.trim();

      if (!finalLocation) {
        if (userCoords) {
          finalLocation = `GPS [${userCoords.latitude.toFixed(5)}, ${userCoords.longitude.toFixed(5)}]`;
        } else {
          finalLocation = `${cityName || 'Bengaluru'} - Urgent SOS Dispatch`;
        }
      }

      const finalPatientName = patientName.trim() || user?.name || 'Emergency Caller';
      const finalPhone = phone.trim() || user?.phone || '+91 98765 43210';

      // 3. Create emergency request with highest priority
      const res = await api.createEmergency({
        patient_id: activeUserId,
        patient_name: finalPatientName,
        emergency_type: emergencyType,
        location: finalLocation,
        latitude: finalLat,
        longitude: finalLng,
        phone: finalPhone,
        notes: notes ? `[RAPID SHORTCUT SOS Cmd+Shift+S] ${notes.trim()}` : '[RAPID SHORTCUT SOS Cmd+Shift+S] Immediate Ambulance Required',
        patient_blood_type: user?.blood_type || 'B+',
        patient_allergies: user?.allergies || 'Penicillin',
        patient_emergency_contact_name: user?.emergency_contact_name || 'Emergency Contact',
        patient_emergency_contact_phone: user?.emergency_contact_phone || '+91 98451 98765',
      });

      soundEffects.playDriverDispatchTone();
      setDispatchedEmergency(res.emergency);
      if (res.ambulance) {
        setAssignedAmbulance(res.ambulance);
      }

      notify(
        '🚨 EMERGENCY AMBULANCE DISPATCHED',
        `Ambulance dispatched for ${finalPatientName} at ${finalLocation}. Green Corridor traffic priority activated!`,
        'EMERGENCY_DISPATCHED'
      );

      fetchNotifications();
      showToast(res.message || '🚨 Ambulance dispatched! Green Corridor priority activated.', 'success');

      if (onEmergencyDispatched) {
        onEmergencyDispatched(res.emergency);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch emergency ambulance', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToTracking = () => {
    onClose();
    // Scroll to patient active emergency tracker
    setTimeout(() => {
      const tracker = document.getElementById('patient-active-emergency-tracker') || 
                      document.getElementById('patient-dashboard-root');
      if (tracker) {
        tracker.scrollIntoView({ behavior: 'smooth' });
      }
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div 
      id="global-emergency-sos-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-sos-title"
    >
      <div 
        id="global-emergency-sos-modal-content"
        className="bg-slate-900 border-2 border-red-600/90 rounded-2xl shadow-2xl shadow-red-900/50 max-w-xl w-full text-white overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        {/* Urgent Emergency Header */}
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 p-4 sm:p-5 flex items-center justify-between relative overflow-hidden">
          {/* Subtle background pulse */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white text-red-600 flex items-center justify-center font-black shadow-md animate-pulse shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="global-sos-title" className="text-lg sm:text-xl font-black tracking-tight uppercase text-white">
                  Rapid Emergency SOS
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-red-950/80 text-amber-200 border border-red-400 text-[10px] font-mono font-bold tracking-wider uppercase">
                  ⌘+Shift+S
                </span>
                <span className="px-2 py-0.5 rounded bg-red-950/80 text-amber-300 border border-red-400/60 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile Shake & Tap</span>
                </span>
              </div>
              <p className="text-xs text-red-100 font-medium">
                Instant Ambulance Dispatch • Green Corridor Priority • Real-Time GPS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close emergency modal"
            className="w-8 h-8 rounded-lg bg-red-800/80 hover:bg-red-900 text-white flex items-center justify-center transition cursor-pointer shrink-0 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {/* SUCCESS DISPATCH VIEW */}
          {dispatchedEmergency ? (
            <div className="space-y-4 py-2 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">
                  Ambulance Dispatched Successfully!
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Emergency ID: <span className="font-mono font-bold text-amber-400">#{dispatchedEmergency.id}</span> • Traffic Signals Set to GREEN
                </p>
              </div>

              {assignedAmbulance && (
                <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Assigned Unit:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{assignedAmbulance.vehicle_number}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Ambulance Type:</span>
                    <span className="font-semibold text-slate-200">{assignedAmbulance.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Paramedic Driver:</span>
                    <span className="font-semibold text-slate-200">{assignedAmbulance.driver_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700">
                    <span className="text-slate-400">Driver Phone:</span>
                    <a href={`tel:${assignedAmbulance.driver_phone}`} className="font-mono font-bold text-amber-400 hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {assignedAmbulance.driver_phone}
                    </a>
                  </div>
                </div>
              )}

              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-left flex items-start gap-2.5 text-xs text-red-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-300">Live Green Corridor Active:</span>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Nearby traffic signals on the ambulance path have been automatically granted green clearance. Please stay calm and keep your phone accessible.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGoToTracking}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>View Live Ambulance Tracker</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="tel:108"
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-red-400" />
                  <span>Call 108</span>
                </a>
              </div>
            </div>
          ) : existingActiveEmergency ? (
            /* EXISTING ACTIVE EMERGENCY DETECTED */
            <div className="space-y-4 py-2">
              <div className="bg-amber-950/50 border border-amber-500/50 rounded-xl p-4 text-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-100">You already have an active emergency in progress!</h4>
                  <p className="text-xs text-amber-200/90 mt-1">
                    Emergency request <span className="font-mono font-bold">#{existingActiveEmergency.id}</span> ({existingActiveEmergency.emergency_type}) is currently active.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Status: <span className="font-bold text-emerald-400">{existingActiveEmergency.status}</span> • Location: {existingActiveEmergency.location}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleGoToTracking}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>Open Active Emergency Tracker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExistingActiveEmergency(null)}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
                >
                  <span>Dispatch New SOS Instead</span>
                </button>
              </div>
            </div>
          ) : (
            /* STANDARD EMERGENCY DISPATCH FORM */
            <>
              {/* Mobile Voice Paramedic Hotline Quick Callout */}
              <div className="bg-gradient-to-r from-red-950/90 via-slate-900 to-amber-950/80 border border-red-500/40 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-500/60 flex items-center justify-center text-red-400 shrink-0">
                    <PhoneCall className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>Need Voice Assistance Right Now?</span>
                      <span className="text-[10px] bg-red-800 text-amber-200 px-1.5 py-0.2 rounded font-mono font-bold">24x7</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Tap to connect directly to national ambulance dispatch operator
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                  <a
                    href="tel:108"
                    onClick={() => triggerHaptic([50])}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call 108</span>
                  </a>
                  <a
                    href="tel:112"
                    onClick={() => triggerHaptic([50])}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-amber-300 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call 112</span>
                  </a>
                </div>
              </div>

              {/* Emergency Category Quick Select */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  1. Select Emergency Type:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EMERGENCY_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = emergencyType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic([30]);
                          setEmergencyType(type.id);
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-950/80 border-red-500 text-white shadow-sm ring-1 ring-red-500'
                            : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg bg-slate-900 ${type.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold leading-tight">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Location / GPS Pinning */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    2. Emergency Incident Location:
                  </label>
                  <button
                    type="button"
                    onClick={handleAcquireLocation}
                    disabled={isLocating}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                  >
                    <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Acquiring GPS...' : '📍 Refresh GPS Pin'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Enter street address, building, or landmark..."
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-red-500"
                  />
                  <div className="absolute right-2.5 top-2.5 text-slate-400">
                    <MapPin className="w-4 h-4 text-red-400" />
                  </div>
                </div>
                {userCoords && (
                  <p className="text-[10px] text-emerald-400/90 mt-1 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    Live GPS: {userCoords.latitude.toFixed(4)}, {userCoords.longitude.toFixed(4)} • Nearest ERs: {nearbyHospitals.length || '3 nearby'}
                  </p>
                )}
              </div>

              {/* Patient Name and Phone Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Patient / Caller Name:
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Patient or caller name"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Contact Phone Number:
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              {/* Brief Emergency Notes / Landmark */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Critical Details / Landmark (Optional):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Gate 2, 3rd floor, patient has chest pain and difficulty breathing"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-red-500"
                />
              </div>

              {/* Big High-Urgency Dispatch Action */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={handleDispatchEmergency}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-500 text-white font-black text-base uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Broadcasting SOS to Fleet...</span>
                    </>
                  ) : (
                    <>
                      <AlertOctagon className="w-5 h-5 animate-pulse" />
                      <span>Dispatch Ambulance Now</span>
                    </>
                  )}
                </button>

                {/* Direct National Hotline Emergency Fallbacks */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Direct Emergency Phone:</span>
                  <div className="flex items-center gap-2">
                    <a
                      href="tel:108"
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-red-400 font-bold border border-slate-700 flex items-center gap-1 transition"
                    >
                      <PhoneCall className="w-3 h-3 text-red-500" />
                      <span>Call 108</span>
                    </a>
                    <a
                      href="tel:112"
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold border border-slate-700 flex items-center gap-1 transition"
                    >
                      <PhoneCall className="w-3 h-3 text-amber-500" />
                      <span>Call 112</span>
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span>Smart Ambulance Network Active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 hidden sm:inline">Press <kbd className="font-mono text-slate-400">Esc</kbd> to close</span>
            <span className="text-amber-300/80 sm:hidden flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              <span>Shake phone anytime for SOS</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { EmergencyRequest, EmergencyStatus } from '../types';
import { soundEffects } from '../utils/sound';
import { EmergencyStatusStepper } from './EmergencyStatusStepper';
import { FirstAidGuide } from './FirstAidGuide';
import { 
  AlertOctagon, 
  MapPin, 
  Phone, 
  User, 
  Truck, 
  Activity, 
  Heart, 
  Clock, 
  Send, 
  CheckCircle2, 
  Compass, 
  RefreshCw,
  PhoneCall,
  ShieldAlert,
  Calendar,
  AlertTriangle
} from 'lucide-react';

const EMERGENCY_TYPES = [
  { id: 'Cardiac Arrest / Heart Attack', label: 'Cardiac Arrest / Chest Pain', icon: Heart, color: 'text-red-600 bg-red-50 border-red-200' },
  { id: 'Severe Trauma / Accident', label: 'Accident / Severe Bleeding', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'Respiratory Distress', label: 'Breathing Difficulty / Asthma', icon: Activity, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'Stroke / Neurological', label: 'Stroke / Sudden Paralysis', icon: ShieldAlert, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'Pregnancy / Labor Emergency', label: 'Pregnancy / Labor Crisis', icon: Heart, color: 'text-pink-600 bg-pink-50 border-pink-200' },
  { id: 'Unconscious / Fainting', label: 'Unconscious / Severe Fall', icon: AlertOctagon, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'General Medical Emergency', label: 'Other Critical Emergency', icon: Activity, color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

const SAMPLE_LOCATIONS = [
  'MG Road Metro Station, Entrance Gate 2, Bengaluru',
  'Indiranagar 100ft Road, Near CMH Hospital',
  'Jayanagar 4th Block, 11th Main Road, Near Bus Stand',
  'Koramangala 5th Block, Sony World Junction',
  'Whitefield Main Road, ITPL Back Gate',
];

export const PatientDashboard: React.FC = () => {
  const { user, showToast } = useAuth();

  // Form states
  const [patientName, setPatientName] = useState(user?.name || '');
  const [emergencyType, setEmergencyType] = useState('Cardiac Emergency / Severe Chest Pain');
  const [location, setLocation] = useState('MG Road Metro Station Gate 2, Bengaluru');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [sessionEmergencyId, setSessionEmergencyId] = useState<number | null>(null);

  // Active Emergency state
  const [activeEmergency, setActiveEmergency] = useState<EmergencyRequest | null>(null);
  const [patientHistory, setPatientHistory] = useState<EmergencyRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Poll active emergency every 3 seconds
  useEffect(() => {
    fetchActiveEmergency();
    fetchHistory();
    const interval = setInterval(() => {
      fetchActiveEmergency();
    }, 3000);
    return () => clearInterval(interval);
  }, [user, sessionEmergencyId]);

  // Sync user details to form
  useEffect(() => {
    if (user) {
      if (user.name) setPatientName(user.name);
      if (user.phone) setPhone(user.phone);
    } else {
      setPatientName('');
      setPhone('');
    }
  }, [user]);

  const fetchActiveEmergency = async () => {
    try {
      const res = await api.getEmergencies();
      if (user?.id) {
        // Authenticated patient: filter by user ID
        const uncompleted = res.emergencies.find(
          (e) => e.patient_id === user.id && !['COMPLETED', 'CANCELLED'].includes(e.status)
        );
        setActiveEmergency(uncompleted || null);
      } else if (sessionEmergencyId) {
        // Guest user with active session emergency
        const uncompleted = res.emergencies.find(
          (e) => e.id === sessionEmergencyId && !['COMPLETED', 'CANCELLED'].includes(e.status)
        );
        setActiveEmergency(uncompleted || null);
      } else {
        setActiveEmergency(null);
      }
    } catch (e) {
      console.warn('Error fetching active emergency:', e);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.getEmergencies();
      if (user?.id) {
        setPatientHistory(res.emergencies.filter((e) => e.patient_id === user.id));
      } else if (sessionEmergencyId) {
        setPatientHistory(res.emergencies.filter((e) => e.id === sessionEmergencyId));
      } else {
        setPatientHistory([]);
      }
    } catch (e) {
      console.warn('Error fetching history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setLocation(`Lat: ${latitude.toFixed(5)}, Long: ${longitude.toFixed(5)} (GPS Verified)`);
        showToast('📍 GPS Location detected successfully!', 'success');
      },
      (error) => {
        setIsLocating(false);
        // Fallback to random sample
        const fallback = SAMPLE_LOCATIONS[Math.floor(Math.random() * SAMPLE_LOCATIONS.length)];
        setLocation(fallback);
        showToast('Using preset landmark location.', 'info');
      },
      { timeout: 5000 }
    );
  };

  const handleSubmitSOS = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!patientName.trim() || !location.trim() || !phone.trim()) {
      showToast('Please fill in patient name, location, and contact phone.', 'error');
      return;
    }

    setIsSubmitting(true);
    soundEffects.playEmergencyAlert();

    try {
      const res = await api.createEmergency({
        patient_id: user?.id,
        patient_name: patientName,
        emergency_type: emergencyType,
        location,
        phone,
        notes,
      });

      setSessionEmergencyId(res.emergency.id);
      setActiveEmergency(res.emergency);
      showToast(res.message, 'success');
      soundEffects.playDriverDispatchTone();
      fetchHistory();
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch SOS', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEmergency = async () => {
    if (!activeEmergency) return;
    try {
      await api.updateEmergencyStatus(activeEmergency.id, 'CANCELLED', user?.name || 'Patient');
      showToast('Emergency request cancelled.', 'info');
      setActiveEmergency(null);
      fetchHistory();
    } catch (e: any) {
      showToast(e.message || 'Failed to cancel emergency', 'error');
    }
  };

  return (
    <div id="patient-dashboard-root" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div id="patient-profile-section" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Patient Emergency Portal</h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  SOS Responder
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {user ? (
                  <>
                    Logged In: <span className="font-semibold text-slate-800">{user.name}</span> • Role: <span className="text-blue-600 font-bold uppercase">{user.role}</span> • Phone: <span className="font-mono text-slate-700">{user.phone || phone || 'Not set'}</span>
                  </>
                ) : (
                  <>
                    Status: <span className="font-semibold text-slate-800">Guest Patient (Not Logged In)</span> • Ready for Immediate SOS Dispatch
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchActiveEmergency(); fetchHistory(); }}
            className="p-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* ACTIVE EMERGENCY DISPATCH CARD (IF ACTIVE) */}
      {activeEmergency ? (
        <div id="active-emergency-card" className="bg-white rounded-2xl border-2 border-red-500 shadow-lg overflow-hidden animate-in fade-in duration-300">
          {/* Header Banner */}
          <div className="bg-[#0f172a] text-white p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-600 flex items-center justify-center font-black animate-pulse">
                <AlertOctagon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    ACTIVE DISPATCH #{activeEmergency.id}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(activeEmergency.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                  {activeEmergency.emergency_type}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleCancelEmergency}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-colors border border-slate-700"
              >
                Cancel SOS Request
              </button>
            </div>
          </div>

          {/* Stepper Status Progression */}
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Live Response Progression
            </h4>
            <EmergencyStatusStepper currentStatus={activeEmergency.status} />
          </div>

          {/* Body: Assigned Ambulance Card & Incident Details */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assigned Ambulance Card */}
            <div className={`border rounded-xl p-5 space-y-4 transition-all ${
              activeEmergency.ambulance_id
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-amber-50/60 border-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-lg text-white shadow-xs ${
                    activeEmergency.ambulance_id ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'
                  }`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      activeEmergency.ambulance_id ? 'text-emerald-800' : 'text-amber-800'
                    }`}>
                      {activeEmergency.ambulance_id ? 'Dispatched Ambulance Unit' : 'Ambulance Unit'}
                    </span>
                    <h4 className="text-base font-bold font-mono text-slate-900">
                      {activeEmergency.vehicle_number || 'Searching for availability...'}
                    </h4>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                  activeEmergency.ambulance_id
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-amber-500 text-white animate-pulse'
                }`}>
                  {activeEmergency.status === 'WAITING_FOR_DRIVER' ? 'Waiting for Driver' : activeEmergency.status}
                </span>
              </div>

              {activeEmergency.ambulance_id && activeEmergency.vehicle_number ? (
                <div className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-emerald-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Assigned Driver:</span>
                    <span className="font-bold text-slate-900">{activeEmergency.driver_name || 'Driver Confirmed'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Vehicle Specification:</span>
                    <span className="font-semibold text-slate-800">{activeEmergency.ambulance_type || 'Advanced Life Support (ALS)'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Station Base:</span>
                    <span className="font-semibold text-slate-800">{activeEmergency.ambulance_base || 'City Central Hub'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500 font-medium">Emergency Driver Contact:</span>
                    <a
                      href={`tel:${activeEmergency.driver_phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{activeEmergency.driver_phone || 'Call Crew'}</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-amber-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Assigned Driver:</span>
                    <span className="font-semibold text-amber-900 italic">Not assigned yet</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Ambulance:</span>
                    <span className="font-semibold text-amber-900 italic">Searching for availability</span>
                  </div>
                  <div className="p-3 bg-amber-100/70 rounded-lg border border-amber-200 text-amber-900 text-xs font-medium leading-relaxed mt-2">
                    Emergency request received. Waiting for an available ambulance driver to accept your request.
                  </div>
                </div>
              )}
            </div>

            {/* Patient Incident Info */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>Incident & Pickup Location</span>
              </div>
              <p className="text-xs text-slate-800 font-semibold bg-slate-50 p-3 rounded-lg border border-slate-200">
                {activeEmergency.location}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Patient Name</span>
                  <span className="font-bold text-slate-900">{activeEmergency.patient_name}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Contact Phone</span>
                  <span className="font-bold font-mono text-slate-900">{activeEmergency.phone}</span>
                </div>
              </div>

              {activeEmergency.notes && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <span className="text-[10px] text-slate-500 block">Medical Notes</span>
                  <span className="text-slate-700">{activeEmergency.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* EMERGENCY SOS TRIGGER & FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form + SOS Trigger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Glowing Big SOS Action Card */}
          <div id="patient-emergency-sos" className="bg-[#0f172a] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden border border-slate-800">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  Instant Rapid Dispatch
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Need Immediate Medical Help?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
                  Press the SOS button below to trigger high-priority ambulance dispatch to your current location immediately.
                </p>
              </div>

              {/* Pulsating SOS Button */}
              <button
                type="button"
                onClick={() => handleSubmitSOS()}
                disabled={isSubmitting}
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-red-600 hover:bg-red-500 text-white font-black shadow-xl shadow-red-600/30 flex flex-col items-center justify-center shrink-0 border-4 border-red-400/40 transform hover:scale-105 active:scale-95 transition-all group"
              >
                <AlertOctagon className="w-9 h-9 group-hover:scale-110 transition-transform text-white" />
                <span className="text-xl font-bold tracking-wider mt-0.5">SOS</span>
                <span className="text-[9px] uppercase tracking-widest text-red-200 font-semibold">DISPATCH</span>
              </button>
            </div>
          </div>

          {/* Detailed Emergency Information Form */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Emergency Details Form</h3>
                <p className="text-xs text-slate-500">Provide incident location & condition to ensure optimal medical crew prep</p>
              </div>
              <span className="text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-100">
                Auto-assigned
              </span>
            </div>

            <form onSubmit={handleSubmitSOS} className="space-y-4">
              {/* Emergency Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Select Emergency Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EMERGENCY_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = emergencyType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setEmergencyType(type.id)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                          isSelected
                            ? 'border-red-600 bg-red-50/70 text-red-900 ring-1 ring-red-500 font-bold shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg border ${type.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs leading-snug">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Patient Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Priya Rao"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contact Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Location Input & GPS Helper */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Incident / Pickup Location *
                  </label>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md transition-colors border border-red-100"
                  >
                    <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Detecting GPS...' : 'Auto-Detect GPS'}</span>
                  </button>
                </div>

                <div className="relative">
                  <MapPin className="w-4 h-4 text-red-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Street, Landmark, Metro Station, Building..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-medium"
                  />
                </div>

                {/* Quick Location Shortcuts */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400 self-center">Landmarks:</span>
                  {SAMPLE_LOCATIONS.slice(0, 3).map((loc, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors truncate max-w-[200px]"
                    >
                      {loc.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medical notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Additional Medical Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Patient is conscious, has known asthma, oxygen cylinder required..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Dispatching Nearest Ambulance...' : 'Submit Emergency SOS Request'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right 1 Col: First-Aid Protocols & History */}
        <div className="space-y-6">
          <FirstAidGuide />

          {/* Past Emergencies / Activity Log */}
          <div id="patient-requests-history" className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Emergency Log</h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                {patientHistory.length} Total
              </span>
            </div>

            {isLoadingHistory ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading history...</div>
            ) : patientHistory.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No past emergency requests recorded.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 divide-y divide-slate-100">
                {patientHistory.slice(0, 5).map((item) => (
                  <div key={item.id} className="pt-2 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-800 truncate max-w-[140px]">{item.emergency_type}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'CANCELLED'
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{item.location}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono">{item.vehicle_number ? `Unit: ${item.vehicle_number}` : 'No vehicle'}</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

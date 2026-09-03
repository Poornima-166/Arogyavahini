import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { EmergencyRequest, EmergencyStatus } from '../types';
import { soundEffects } from '../utils/sound';
import { EmergencyStatusStepper } from './EmergencyStatusStepper';
import { FirstAidGuide } from './FirstAidGuide';
import { RouteMapVisualizer } from './RouteMapVisualizer';
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
  ShieldCheck,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user, showToast } = useAuth();
  const { language, t } = useLanguage();
  const { fetchNotifications } = useNotifications();

  const EMERGENCY_TYPES = [
    { 
      id: 'Cardiac Arrest / Heart Attack', 
      label: language === 'kn' ? 'ಹೃದಯಾಘಾತ / ಎದೆ ನೋವು' : language === 'hi' ? 'दिल का दौरा / सीने में दर्द' : 'Cardiac Arrest / Chest Pain', 
      icon: Heart, 
      color: 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900' 
    },
    { 
      id: 'Severe Trauma / Accident', 
      label: language === 'kn' ? 'ಅಪಘಾತ / ತೀವ್ರ ರಕ್ತಸ್ರಾವ' : language === 'hi' ? 'दुर्घटना / गंभीर रक्तस्राव' : 'Accident / Severe Bleeding', 
      icon: AlertTriangle, 
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' 
    },
    { 
      id: 'Respiratory Distress', 
      label: language === 'kn' ? 'ಉಸಿರಾಟದ ತೊಂದರೆ / ಅಸ್ತಮಾ' : language === 'hi' ? 'सांस लेने में तकलीफ / अस्थमा' : 'Breathing Difficulty / Asthma', 
      icon: Activity, 
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900' 
    },
    { 
      id: 'Stroke / Neurological', 
      label: language === 'kn' ? 'ಪಾರ್ಶ್ವವಾಯು (ಸ್ಟ್ರೋಕ್)' : language === 'hi' ? 'स्ट्रोक / अचानक पक्षाघात' : 'Stroke / Sudden Paralysis', 
      icon: ShieldAlert, 
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900' 
    },
    { 
      id: 'Pregnancy / Labor Emergency', 
      label: language === 'kn' ? 'ಗರ್ಭಧಾರಣೆ / ಪ್ರಸವ ತುರ್ತು' : language === 'hi' ? 'गर्भावस्था / प्रसव आपातकाल' : 'Pregnancy / Labor Crisis', 
      icon: Heart, 
      color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-900' 
    },
    { 
      id: 'Unconscious / Fainting', 
      label: language === 'kn' ? 'ಪ್ರಜ್ಞಾಹೀನತೆ / ತೀವ್ರ ಕುಸಿತ' : language === 'hi' ? 'बेहोशी / गंभीर गिरावट' : 'Unconscious / Severe Fall', 
      icon: AlertOctagon, 
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900' 
    },
    { 
      id: 'General Medical Emergency', 
      label: language === 'kn' ? 'ಇತರ ಗಂಭೀರ ವೈದ್ಯಕೀಯ ತುರ್ತು' : language === 'hi' ? 'अन्य गंभीर चिकित्सा आपातकाल' : 'Other Critical Emergency', 
      icon: Activity, 
      color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' 
    },
  ];

  const SAMPLE_LOCATIONS = [
    'MG Road Metro Station, Entrance Gate 2, Bengaluru',
    'Indiranagar 100ft Road, Near CMH Hospital',
    'Jayanagar 4th Block, 11th Main Road, Near Bus Stand',
    'Koramangala 5th Block, Sony World Junction',
    'Whitefield Main Road, ITPL Back Gate',
  ];

  // Form states
  const [patientName, setPatientName] = useState(user?.name || '');
  const [emergencyType, setEmergencyType] = useState('Cardiac Arrest / Heart Attack');
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
        const uncompleted = res.emergencies.find(
          (e) => e.patient_id === user.id && !['COMPLETED', 'CANCELLED'].includes(e.status)
        );
        setActiveEmergency(uncompleted || null);
      } else if (sessionEmergencyId) {
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
      () => {
        setIsLocating(false);
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
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch SOS', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEmergency = async () => {
    if (!activeEmergency) return;
    if (!window.confirm(t.patientCancelConfirm)) return;
    try {
      await api.updateEmergencyStatus(activeEmergency.id, 'CANCELLED', user?.name || 'Patient');
      showToast('Emergency request cancelled.', 'info');
      setActiveEmergency(null);
      fetchHistory();
      fetchNotifications();
    } catch (e: any) {
      showToast(e.message || 'Failed to cancel emergency', 'error');
    }
  };

  return (
    <div id="patient-dashboard-root" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div id="patient-profile-section" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t.patientPortalTitle}</h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">
                  {t.patientPortalBadge}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user ? (
                  <>
                    {t.patientLoggedInAs}: <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span> • {t.phone}: <span className="font-mono text-slate-700 dark:text-slate-300">{user.phone || phone || 'Not set'}</span>
                  </>
                ) : (
                  <>
                    {t.status}: <span className="font-semibold text-slate-800 dark:text-slate-200">Guest Access</span> • {t.heroSubBadge}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchActiveEmergency(); fetchHistory(); }}
            className="p-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ACTIVE EMERGENCY DISPATCH & REAL-TIME STATUS CARD */}
      {activeEmergency ? (
        <div id="active-emergency-status-card" className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-500 shadow-xl overflow-hidden animate-in fade-in duration-300">
          {/* Header Banner with Live Progress Indicator */}
          <div className="bg-[#0f172a] dark:bg-slate-950 text-white p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center font-black animate-pulse shadow-lg shadow-red-600/30 shrink-0">
                <AlertOctagon className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-extrabold uppercase tracking-wider">
                    LIVE SOS #{activeEmergency.id}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    {activeEmergency.status === 'WAITING_FOR_DRIVER' ? 'Searching Fleet' : activeEmergency.status === 'DRIVER_ACCEPTED' ? 'Ambulance Assigned' : activeEmergency.status === 'ON_THE_WAY' ? 'En Route to You' : activeEmergency.status === 'REACHED' ? 'Arrived at Scene' : activeEmergency.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(activeEmergency.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                  {activeEmergency.emergency_type} Emergency
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                id="btn-cancel-patient-sos"
                onClick={handleCancelEmergency}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition border border-slate-700 cursor-pointer shadow-xs"
              >
                {t.patientCancelSOS}
              </button>
            </div>
          </div>

          {/* Real-time ETA & Progress Highlight Banner */}
          {activeEmergency.ambulance_id ? (
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 text-white p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">
                    Estimated Time of Arrival (Live ETA)
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <span>~{activeEmergency.current_eta_minutes || 8} Mins</span>
                    <span className="text-xs font-medium text-slate-300">
                      ({activeEmergency.current_distance_km || 3.2} km away)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Live Traffic</span>
                  <span className="font-bold text-emerald-400">{activeEmergency.current_traffic || 'Low Congestion'}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Green Corridor Active</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-950/40 text-amber-200 p-4 border-b border-amber-900/50 flex items-center gap-3 text-xs">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span>
                <strong>Alert Broadcast in Progress:</strong> We are routing your SOS request to the nearest available ambulance units in real time. Please stay on this screen.
              </span>
            </div>
          )}

          {/* Stepper Status Progression */}
          <div className="p-6 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {t.pipelineTitle}
            </h4>
            <EmergencyStatusStepper currentStatus={activeEmergency.status} />
          </div>

          {/* Body: Assigned Ambulance Card & Incident Details */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assigned Ambulance Card */}
            <div className={`border rounded-xl p-5 space-y-4 transition-all ${
              activeEmergency.ambulance_id
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
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
                      activeEmergency.ambulance_id ? 'text-emerald-800 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-400'
                    }`}>
                      {activeEmergency.ambulance_id ? t.patientAssignedAmbulance : t.navAmbulanceStatus}
                    </span>
                    <h4 className="text-base font-bold font-mono text-slate-900 dark:text-white">
                      {activeEmergency.vehicle_number || 'Searching for available unit...'}
                    </h4>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                  activeEmergency.ambulance_id
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-amber-500 text-white animate-pulse'
                }`}>
                  {activeEmergency.status === 'WAITING_FOR_DRIVER' ? t.statusWaitingForDriver : activeEmergency.status}
                </span>
              </div>

              {activeEmergency.ambulance_id && activeEmergency.vehicle_number ? (
                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-emerald-200/80 dark:border-emerald-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t.driverName}:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{activeEmergency.driver_name || 'Driver Confirmed'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t.patientAmbulanceType}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{activeEmergency.ambulance_type || 'Advanced Life Support (ALS)'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t.patientBaseLocation}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{activeEmergency.ambulance_base || 'City Central Emergency Base'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t.patientDriverContact}:</span>
                    <a
                      href={`tel:${activeEmergency.driver_phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{activeEmergency.driver_phone || 'Call Paramedic'}</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-amber-200/80 dark:border-amber-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t.driverName}:</span>
                    <span className="font-semibold text-amber-900 dark:text-amber-300 italic">{t.statusWaitingDesc}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t.vehicleNumber}:</span>
                    <span className="font-semibold text-amber-900 dark:text-amber-300 italic">Broadcasting alert to nearest fleet</span>
                  </div>
                  <div className="p-3 bg-amber-100/70 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300 text-xs font-medium leading-relaxed mt-2">
                    {t.patientActiveAlertDesc}
                  </div>
                </div>
              )}
            </div>

            {/* Patient Incident Info */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>{t.driverIncidentLocation}</span>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                {activeEmergency.location}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{t.patientName}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeEmergency.patient_name}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{t.phone}</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{activeEmergency.phone}</span>
                </div>
              </div>

              {activeEmergency.notes && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{t.notes}</span>
                  <span className="text-slate-700 dark:text-slate-300">{activeEmergency.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Route Map & Live ETA Tracking */}
          {activeEmergency.routes && activeEmergency.routes.length > 0 && (
            <div className="p-6 pt-0">
              <RouteMapVisualizer
                originName={
                  activeEmergency.driver_current_latitude && activeEmergency.driver_current_longitude
                    ? `Live Ambulance GPS [${activeEmergency.driver_current_latitude.toFixed(4)}, ${activeEmergency.driver_current_longitude.toFixed(4)}]`
                    : activeEmergency.ambulance_base || 'Dispatched Ambulance Base'
                }
                destinationName={
                  (activeEmergency.navigation_stage === 'TO_HOSPITAL' || activeEmergency.status === 'REACHED') && activeEmergency.hospital_destination
                    ? activeEmergency.hospital_destination
                    : activeEmergency.location
                }
                routes={activeEmergency.routes}
                selectedRouteId={activeEmergency.selected_route_id}
                stage={(activeEmergency.navigation_stage as 'TO_PATIENT' | 'TO_HOSPITAL') || (activeEmergency.status === 'REACHED' ? 'TO_HOSPITAL' : 'TO_PATIENT')}
                hospitals={activeEmergency.hospital_options || []}
                selectedHospital={activeEmergency.hospital_destination}
                showSimulationControls={false}
                driverCoords={
                  activeEmergency.driver_current_latitude && activeEmergency.driver_current_longitude
                    ? {
                        latitude: activeEmergency.driver_current_latitude,
                        longitude: activeEmergency.driver_current_longitude,
                        accuracy: activeEmergency.driver_accuracy,
                      }
                    : null
                }
                patientCoords={
                  activeEmergency.patient_latitude && activeEmergency.patient_longitude
                    ? {
                        latitude: activeEmergency.patient_latitude,
                        longitude: activeEmergency.patient_longitude,
                      }
                    : null
                }
                isLiveTracking={Boolean(activeEmergency.driver_current_latitude)}
                gpsPermissionStatus={activeEmergency.driver_current_latitude ? 'granted' : 'prompt'}
                lastGpsTimestamp={activeEmergency.driver_location_updated_at ? new Date(activeEmergency.driver_location_updated_at).toLocaleTimeString() : null}
              />
            </div>
          )}
        </div>
      ) : null}

      {/* EMERGENCY SOS TRIGGER & FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form + SOS Trigger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Glowing Big SOS Action Card */}
          <div id="patient-emergency-sos" className="bg-[#0f172a] dark:bg-slate-950 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden border border-slate-800">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  {t.heroSubBadge}
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {t.patientTriggerTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
                  {t.patientTriggerDesc}
                </p>
              </div>

              {/* Pulsating SOS Button */}
              <button
                type="button"
                onClick={() => handleSubmitSOS()}
                disabled={isSubmitting}
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-red-600 hover:bg-red-500 text-white font-black shadow-xl shadow-red-600/30 flex flex-col items-center justify-center shrink-0 border-4 border-red-400/40 transform hover:scale-105 active:scale-95 transition-all group cursor-pointer"
              >
                <AlertOctagon className="w-9 h-9 group-hover:scale-110 transition-transform text-white" />
                <span className="text-xl font-bold tracking-wider mt-0.5">SOS</span>
                <span className="text-[9px] uppercase tracking-widest text-red-200 font-semibold">EMERGENCY</span>
              </button>
            </div>
          </div>

          {/* Detailed Emergency Information Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.patientEmergencyDetails}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.patientTriggerDesc}</p>
              </div>
              <span className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2.5 py-0.5 rounded-md border border-red-100 dark:border-red-900">
                Priority
              </span>
            </div>

            <form onSubmit={handleSubmitSOS} className="space-y-4">
              {/* Emergency Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  1. {t.patientSelectEmergencyType} *
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
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-red-600 bg-red-50/70 dark:bg-red-950/40 text-red-900 dark:text-red-300 ring-1 ring-red-500 font-bold shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium'
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.patientName} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Priya Rao"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.patientPhonePlaceholder} *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Location Input & GPS Helper */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t.driverIncidentLocation} *
                  </label>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 px-2 py-0.5 rounded-md transition-colors border border-red-100 dark:border-red-900 cursor-pointer"
                  >
                    <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Detecting GPS...' : t.patientUseCurrentLocation}</span>
                  </button>
                </div>

                <div className="relative">
                  <MapPin className="w-4 h-4 text-red-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t.patientLocationPlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-medium"
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
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors truncate max-w-[200px] cursor-pointer"
                    >
                      {loc.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medical notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.notes}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.patientNotesPlaceholder}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? t.loading : t.patientDispatchBtn}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right 1 Col: First-Aid Protocols & History */}
        <div className="space-y-6">
          <FirstAidGuide />

          {/* Past Emergencies / Activity Log */}
          <div id="patient-requests-history" className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">{t.patientHistoryTitle}</h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                {patientHistory.length} {t.all}
              </span>
            </div>

            {isLoadingHistory ? (
              <div className="py-6 text-center text-xs text-slate-400">{t.loading}</div>
            ) : patientHistory.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {t.patientNoHistory}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                {patientHistory.slice(0, 5).map((item) => (
                  <div key={item.id} className="pt-2 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{item.emergency_type}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                          : item.status === 'CANCELLED'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.location}</p>
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

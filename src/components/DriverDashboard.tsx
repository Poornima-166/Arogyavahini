import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { Ambulance, EmergencyRequest, EmergencyStatus, AmbulanceStatus } from '../types';
import { soundEffects } from '../utils/sound';
import { generateClientFallbackRoutes } from '../utils/routeOptimizer';
import { EmergencyStatusStepper } from './EmergencyStatusStepper';
import { RouteMapVisualizer } from './RouteMapVisualizer';
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
  AlertCircle,
  Sparkles
} from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const { user, showToast } = useAuth();
  const { t } = useLanguage();
  const { fetchNotifications } = useNotifications();

  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null);
  const [assignedEmergencies, setAssignedEmergencies] = useState<EmergencyRequest[]>([]);
  const [allEmergencies, setAllEmergencies] = useState<EmergencyRequest[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Live GPS Geolocation Tracking for Driver
  const [driverCoords, setDriverCoords] = useState<{
    latitude: number;
    longitude: number;
    speed?: number | null;
    heading?: number | null;
    accuracy?: number;
  } | null>(null);
  const [isTrackingGPS, setIsTrackingGPS] = useState(false);
  const [gpsPermissionStatus, setGpsPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unavailable' | 'demo'>('prompt');
  const [lastGpsTimestamp, setLastGpsTimestamp] = useState<string | null>(null);
  const [isSearchingHospitals, setIsSearchingHospitals] = useState(false);
  const [hospitalSearchSource, setHospitalSearchSource] = useState<'live_places' | 'fallback' | null>(null);
  const [hospitalSearchMessage, setHospitalSearchMessage] = useState<string | null>(null);
  const lastLocationSendTimeRef = React.useRef<number>(0);
  const watchIdRef = React.useRef<number | null>(null);

  // Explicit Live GPS Permission & Fix Trigger
  const handleEnableLiveLocation = () => {
    if (!navigator.geolocation) {
      setGpsPermissionStatus('unavailable');
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          accuracy: pos.coords.accuracy,
        };
        setDriverCoords(coords);
        setGpsPermissionStatus('granted');
        setLastGpsTimestamp(new Date().toLocaleTimeString());
        setIsTrackingGPS(true);
        showToast(`📍 Live GPS Connected (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`, 'success');

        const activeMission = assignedEmergencies.find((e) =>
          ['DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED'].includes(e.status)
        );
        if (activeMission) {
          api.updateDriverLocation(activeMission.id, {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            speed: coords.speed ?? undefined,
            heading: coords.heading ?? undefined,
          }).catch(console.warn);

          api.recalculateRoute(activeMission.id, {
            originLatitude: coords.latitude,
            originLongitude: coords.longitude,
          }).catch(console.warn);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        if (err.code === 1) {
          setGpsPermissionStatus('denied');
          showToast('Location permission denied. Click "Use Demo Location" to proceed.', 'error');
        } else {
          setGpsPermissionStatus('unavailable');
          showToast('Unable to acquire GPS signal. Using fallback.', 'info');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleUseDemoLocation = () => {
    const demoCoords = {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 5,
    };
    setDriverCoords(demoCoords);
    setGpsPermissionStatus('demo');
    setLastGpsTimestamp(new Date().toLocaleTimeString());
    setIsTrackingGPS(true);
    showToast('Simulation Demo Location activated (12.9716, 77.5946)', 'info');

    const activeMission = assignedEmergencies.find((e) =>
      ['DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED'].includes(e.status)
    );
    if (activeMission) {
      api.updateDriverLocation(activeMission.id, {
        latitude: demoCoords.latitude,
        longitude: demoCoords.longitude,
        accuracy: demoCoords.accuracy,
      }).catch(console.warn);
    }
  };

  // Poll driver dispatches every 3 seconds and sync on user change
  useEffect(() => {
    setSelectedAmbulance(null);
    loadDriverData();
    const interval = setInterval(loadDriverData, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle continuous Geolocation Watch Position
  useEffect(() => {
    const activeMission = assignedEmergencies.find((e) =>
      ['DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED'].includes(e.status)
    );

    if (activeMission && navigator.geolocation) {
      setIsTrackingGPS(true);

      if (watchIdRef.current === null) {
        try {
          const id = navigator.geolocation.watchPosition(
            (pos) => {
              const coords = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                speed: pos.coords.speed,
                heading: pos.coords.heading,
                accuracy: pos.coords.accuracy,
              };
              setDriverCoords(coords);

              // Throttle sending coordinates to backend every 3 seconds
              const now = Date.now();
              if (now - lastLocationSendTimeRef.current > 3000) {
                lastLocationSendTimeRef.current = now;
                api.updateDriverLocation(activeMission.id, {
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  speed: coords.speed ?? undefined,
                  heading: coords.heading ?? undefined,
                }).catch((err) => console.warn('Failed to stream driver GPS:', err));
              }
            },
            (err) => {
              console.warn('Geolocation watch error:', err.message);
              // Fallback to sample coordinates around Bangalore center if device GPS is blocked
              if (!driverCoords) {
                setDriverCoords({
                  latitude: 12.9716,
                  longitude: 77.5946,
                  accuracy: 10,
                });
              }
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 2000,
            }
          );
          watchIdRef.current = id;
        } catch (e) {
          console.warn('Could not initialize geolocation watchPosition:', e);
        }
      }
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTrackingGPS(false);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [assignedEmergencies]);

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
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Failed to accept request or already claimed by another driver.', 'error');
      await loadDriverData();
      fetchNotifications();
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
      fetchNotifications();
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

  const [isRecalculatingRoute, setIsRecalculatingRoute] = useState(false);

  const handleRecalculateRoute = async (emergencyId: number) => {
    setIsRecalculatingRoute(true);
    try {
      const res = await api.recalculateRoute(emergencyId);
      showToast(res.message || 'AI route recalculation complete!', 'success');
      await loadDriverData();
    } catch (e: any) {
      showToast(e.message || 'Failed to recalculate route', 'error');
    } finally {
      setIsRecalculatingRoute(false);
    }
  };

  const handleSelectRoute = async (emergencyId: number, routeId: string) => {
    try {
      const res = await api.selectRoute(emergencyId, routeId);
      showToast(`Selected route updated: ${res.selectedRoute?.name || routeId}`, 'info');
      await loadDriverData();
    } catch (e: any) {
      showToast(e.message || 'Failed to switch route', 'error');
    }
  };

  const handleSelectHospital = async (emergencyId: number, hospitalName: string) => {
    try {
      const res = await api.selectHospital(emergencyId, hospitalName);
      showToast(`Hospital destination set to ${hospitalName}`, 'success');
      await loadDriverData();
    } catch (e: any) {
      showToast(e.message || 'Failed to set hospital', 'error');
    }
  };

  const handleFindNearbyHospitals = async (emergencyId: number) => {
    setIsSearchingHospitals(true);
    try {
      const res = await api.findNearbyHospitals(emergencyId, {
        latitude: driverCoords?.latitude,
        longitude: driverCoords?.longitude,
      });
      setHospitalSearchSource(res.source);
      setHospitalSearchMessage(res.message);
      showToast(`Found ${res.hospitals.length} nearby emergency hospitals (${res.source === 'live_places' ? 'Live Places API' : 'Regional Network'})`, 'success');
      await loadDriverData();
    } catch (e: any) {
      showToast(e.message || 'Failed to query nearby hospitals', 'error');
    } finally {
      setIsSearchingHospitals(false);
    }
  };

  const handleNavigateToHospital = async (emergencyId: number, hospital: HospitalOption) => {
    setIsUpdating(true);
    try {
      const res = await api.navigateToHospital(emergencyId, {
        hospitalName: hospital.name,
        hospitalCoords: hospital.coordinates,
        driverCoords: driverCoords || undefined,
      });
      showToast(`🧭 STAGE 2 Navigation Engaged: En route to ${hospital.name}`, 'success');
      soundEffects.playEmergencyAlert();
      await loadDriverData();
    } catch (e: any) {
      showToast(e.message || 'Failed to navigate to hospital', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSwitchStage = async (emergencyId: number, newStage: 'TO_PATIENT' | 'TO_HOSPITAL') => {
    try {
      if (newStage === 'TO_HOSPITAL') {
        await handleFindNearbyHospitals(emergencyId);
      } else {
        await api.recalculateRoute(emergencyId, {
          originLatitude: driverCoords?.latitude,
          originLongitude: driverCoords?.longitude,
        });
        await loadDriverData();
      }
      showToast(`Switched navigation mode: ${newStage === 'TO_PATIENT' ? 'STAGE 1 (En Route to Patient)' : 'STAGE 2 (Hospital Transfer)'}`, 'info');
    } catch (e: any) {
      showToast(e.message || 'Failed to change stage', 'error');
    }
  };

  // Filter unassigned incoming requests that are waiting for driver acceptance
  const incomingRequests = allEmergencies.filter(
    (e) => e.status === 'WAITING_FOR_DRIVER' && !e.ambulance_id
  );

  // Active emergency for current vehicle/driver
  const activeMission = assignedEmergencies.length > 0 ? assignedEmergencies[0] : null;

  return (
    <div id="driver-dashboard-root" className="space-y-6 pb-12">
      {/* Driver Cockpit Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t.driverPortalTitle}</h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                {t.driverBadge}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {user ? (
                <>
                  {t.driverAssignedUnit}: <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span> • {t.vehicleNumber}: <span className="font-bold font-mono text-slate-900 dark:text-white">{selectedAmbulance?.vehicle_number || 'None'}</span> • {t.phone}: <span className="font-mono text-slate-700 dark:text-slate-300">{user.phone || selectedAmbulance?.phone}</span>
                </>
              ) : (
                <>
                  {t.vehicleNumber}: <span className="font-bold font-mono text-slate-900 dark:text-white">{selectedAmbulance?.vehicle_number || 'None'}</span> • {t.driverName}: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedAmbulance?.driver_name || 'Unassigned'}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Vehicle Switcher Pill Bar */}
        <div id="driver-ambulance-status" className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">{t.navAmbulanceStatus}:</span>
          {ambulances.map((amb) => (
            <button
              key={amb.id}
              onClick={() => handleSelectAmbulance(amb)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                selectedAmbulance?.id === amb.id
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span className="font-mono">{amb.vehicle_number}</span>
              <span className={`ml-1.5 text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                amb.status === 'AVAILABLE'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                  : amb.status === 'ASSIGNED' || amb.status === 'BUSY'
                  ? 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.driverIncomingAlerts}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.driverIncomingDesc}</p>
            </div>
          </div>
          {incomingRequests.length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold animate-pulse">
              {incomingRequests.length} {t.activeEmergencies}
            </span>
          )}
        </div>

        {incomingRequests.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
            <p className="font-medium text-slate-700 dark:text-slate-300">{t.driverNoIncoming}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{t.driverStandbyDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomingRequests.map((req) => (
              <div 
                key={req.id} 
                className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-500 p-5 shadow-md space-y-4 animate-in fade-in"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                        SOS #{req.id}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] font-bold">
                        {t.statusWaitingForDriver}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                      {req.emergency_type}
                    </h4>
                  </div>
                </div>

                <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">{t.driverIncidentLocation}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{req.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{t.patientName}: <strong className="text-slate-900 dark:text-white">{req.patient_name}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-slate-700 dark:text-slate-300">{req.phone}</span>
                    </div>
                  </div>

                  {req.notes && (
                    <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px]">
                      <strong className="text-slate-700 dark:text-slate-200">{t.notes}:</strong> {req.notes}
                    </div>
                  )}
                </div>

                {/* Accept Button */}
                <button
                  type="button"
                  onClick={() => handleAcceptEmergency(req.id)}
                  disabled={acceptingId === req.id}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{acceptingId === req.id ? t.loading : t.driverAcceptRequest}</span>
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
        <div id="driver-active-dispatch" className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-500 shadow-md overflow-hidden animate-in fade-in duration-300">
          {/* Active Mission Header */}
          <div className="bg-[#0f172a] dark:bg-slate-950 text-white p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center font-black animate-bounce">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider animate-pulse">
                    {t.navActiveEmergency} #{activeMission.id}
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
              <span className="text-xs font-semibold uppercase px-3 py-1 rounded-md bg-slate-800 dark:bg-slate-900 border border-slate-700 text-amber-400">
                {t.status}: {activeMission.status}
              </span>
            </div>
          </div>

          {/* Stepper Status Progression */}
          <div className="p-6 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
            <EmergencyStatusStepper currentStatus={activeMission.status} />
          </div>

          {/* Details & Interactive Action Buttons */}
          <div className="p-6 space-y-6">
            {/* Patient & Incident Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  {t.patientName}
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{activeMission.patient_name}</span>
                </p>
                <div className="pt-2">
                  <a
                    href={`tel:${activeMission.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{t.driverCallPatient} ({activeMission.phone})</span>
                  </a>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-1 md:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  {t.driverIncidentLocation}
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{activeMission.location}</span>
                </p>
                {activeMission.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{t.notes}:</span> {activeMission.notes}
                  </p>
                )}
              </div>
            </div>

            {/* AI Real-time Route Optimizer & Traffic Corridor Map */}
            {(() => {
              const routesToDisplay =
                activeMission.routes && activeMission.routes.length > 0
                  ? activeMission.routes
                  : activeMission.optimized_routes && activeMission.optimized_routes.length > 0
                  ? activeMission.optimized_routes
                  : generateClientFallbackRoutes(
                      selectedAmbulance?.base_location || 'Ambulance Station',
                      activeMission.location || 'Incident Location',
                      activeMission.emergency_type || 'General'
                    );

              const activeStage =
                (activeMission.navigation_stage as 'TO_PATIENT' | 'TO_HOSPITAL') ||
                (activeMission.status === 'REACHED' ? 'TO_HOSPITAL' : 'TO_PATIENT');

              return (
                <RouteMapVisualizer
                  originName={
                    driverCoords && driverCoords.latitude
                      ? `GPS [${driverCoords.latitude.toFixed(4)}, ${driverCoords.longitude.toFixed(4)}]`
                      : selectedAmbulance?.base_location || 'Ambulance Station'
                  }
                  destinationName={
                    activeStage === 'TO_HOSPITAL' && activeMission.hospital_destination
                      ? activeMission.hospital_destination
                      : activeMission.location
                  }
                  routes={routesToDisplay}
                  selectedRouteId={activeMission.selected_route_id || routesToDisplay[0]?.id}
                  onSelectRoute={(routeId) => handleSelectRoute(activeMission.id, routeId)}
                  onRecalculate={() => handleRecalculateRoute(activeMission.id)}
                  onStartNavigation={() => {
                    if (activeMission.status === 'DRIVER_ACCEPTED') {
                      handleUpdateStatus(activeMission.id, 'ON_THE_WAY');
                    } else {
                      showToast('Live GPS Navigation active along AI-optimized route', 'info');
                    }
                  }}
                  isRecalculating={isRecalculatingRoute}
                  stage={activeStage}
                  onSwitchStage={(newStage) => handleSwitchStage(activeMission.id, newStage)}
                  hospitals={activeMission.hospital_options || []}
                  selectedHospital={activeMission.hospital_destination}
                  onSelectHospital={(hospName) => handleSelectHospital(activeMission.id, hospName)}
                  onFindNearbyHospitals={() => handleFindNearbyHospitals(activeMission.id)}
                  onNavigateToHospital={(hosp) => handleNavigateToHospital(activeMission.id, hosp)}
                  isSearchingHospitals={isSearchingHospitals}
                  hospitalSearchSource={hospitalSearchSource}
                  hospitalSearchMessage={hospitalSearchMessage}
                  showSimulationControls={true}
                  driverCoords={driverCoords}
                  patientCoords={
                    activeMission.patient_latitude && activeMission.patient_longitude
                      ? { latitude: activeMission.patient_latitude, longitude: activeMission.patient_longitude }
                      : null
                  }
                  isLiveTracking={isTrackingGPS}
                  gpsPermissionStatus={gpsPermissionStatus}
                  onEnableLiveLocation={handleEnableLiveLocation}
                  onUseDemoLocation={handleUseDemoLocation}
                  lastGpsTimestamp={lastGpsTimestamp}
                />
              );
            })()}

            {/* ACTION BUTTON CONTROLS (DISPATCH PROGRESSION WORKFLOW) */}
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400">
                  {t.driverActiveMissionTitle}
                </h4>
                <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  {t.pipelineDesc}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Start Journey / On the Way */}
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeMission.id, 'ON_THE_WAY')}
                  disabled={isUpdating || activeMission.status !== 'DRIVER_ACCEPTED'}
                  className={`p-3.5 rounded-xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    activeMission.status === 'DRIVER_ACCEPTED'
                      ? 'bg-orange-600 hover:bg-orange-700 text-white animate-pulse'
                      : ['ON_THE_WAY', 'REACHED'].includes(activeMission.status)
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Navigation className="w-5 h-5" />
                  <span>1. {t.driverStartJourney}</span>
                  {['ON_THE_WAY', 'REACHED'].includes(activeMission.status) && (
                    <span className="text-[10px] font-normal">✓ {t.statusEnRoute}</span>
                  )}
                </button>

                {/* 2. Mark as Reached */}
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeMission.id, 'REACHED')}
                  disabled={isUpdating || activeMission.status !== 'ON_THE_WAY'}
                  className={`p-3.5 rounded-xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    activeMission.status === 'ON_THE_WAY'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                      : activeMission.status === 'REACHED'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  <span>2. {t.driverMarkReached}</span>
                  {activeMission.status === 'REACHED' && (
                    <span className="text-[10px] font-normal">✓ {t.statusAtScene}</span>
                  )}
                </button>

                {/* 3. Complete & Hospital Handover */}
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeMission.id, 'COMPLETED')}
                  disabled={isUpdating || activeMission.status !== 'REACHED'}
                  className={`p-3.5 rounded-xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    activeMission.status === 'REACHED'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Hospital className="w-5 h-5" />
                  <span>3. {t.driverCompleteTrip}</span>
                  <span className="text-[10px] font-normal">{t.driverReadyStandby}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Standby state when no active emergency is assigned */
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900">
            <Check className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.driverStandby}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.driverStandbyDesc}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleToggleAmbulanceStatus('AVAILABLE')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                selectedAmbulance?.status === 'AVAILABLE'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Set {t.statusAvailable}
            </button>

            <button
              onClick={() => handleToggleAmbulanceStatus('MAINTENANCE')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                selectedAmbulance?.status === 'MAINTENANCE'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
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
        <div id="driver-profile-info" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.navAmbulanceStatus}</h4>
          </div>

          {selectedAmbulance ? (
            <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t.vehicleNumber}:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{selectedAmbulance.vehicle_number}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t.ambulanceType}:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAmbulance.type}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t.baseLocation}:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAmbulance.base_location}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t.phone}:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{selectedAmbulance.phone}</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">{t.status}:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedAmbulance.status === 'AVAILABLE' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.driverCompletedMissions}</h4>
            </div>
            <span className="text-xs text-slate-400">{t.all}</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {allEmergencies
              .filter((e) => e.ambulance_id === selectedAmbulance?.id)
              .map((item) => (
                <div key={item.id} className="pt-2.5 text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">#{item.id} - {item.emergency_type}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        item.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{item.location} • {t.patientName}: {item.patient_name}</p>
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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useLocation } from '../context/LocationContext';
import { api } from '../services/api';
import { socketService } from '../services/socketService';
import { Ambulance, EmergencyRequest, EmergencyStatus, AmbulanceStatus, HospitalOption } from '../types';
import { soundEffects } from '../utils/sound';
import { DriverSidebar, DriverTab } from './driver/DriverSidebar';
import { DriverDashboardView } from './driver/DriverDashboardView';
import { DriverIncomingView } from './driver/DriverIncomingView';
import { DriverActiveView } from './driver/DriverActiveView';
import { DriverNavigationView } from './driver/DriverNavigationView';
import { DriverAmbulanceStatusView } from './driver/DriverAmbulanceStatusView';
import { DriverHistoryView } from './driver/DriverHistoryView';
import { DriverNotificationsView } from './driver/DriverNotificationsView';
import { DriverProfileSettingsView } from './driver/DriverProfileSettingsView';
import { EmergencyReportModal } from './EmergencyReportModal';
import { InTransitVitalsModal } from './InTransitVitalsModal';
import { Menu, X, Radio, BellRing, Navigation } from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const { user, showToast, logout } = useAuth();
  const { t } = useLanguage();
  const { unreadCount, fetchNotifications } = useNotifications();
  const { userCoords, locationPermission, lastGpsTimestamp: contextGpsTimestamp } = useLocation();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<DriverTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Ambulance and mission states
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null);
  const [assignedEmergencies, setAssignedEmergencies] = useState<EmergencyRequest[]>([]);
  const [allEmergencies, setAllEmergencies] = useState<EmergencyRequest[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [reportModalEmergencyId, setReportModalEmergencyId] = useState<number | null>(null);
  const [fallbackReportEmergency, setFallbackReportEmergency] = useState<EmergencyRequest | undefined>(undefined);

  // Live GPS Geolocation Tracking for Driver
  const [driverCoords, setDriverCoords] = useState<{
    latitude: number;
    longitude: number;
    speed?: number | null;
    heading?: number | null;
    accuracy?: number;
  } | null>(
    userCoords
      ? {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          accuracy: userCoords.accuracy,
        }
      : null
  );
  const [isTrackingGPS, setIsTrackingGPS] = useState(Boolean(userCoords));
  const [gpsPermissionStatus, setGpsPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unavailable' | 'demo'>(
    locationPermission === 'granted' ? 'granted' : locationPermission === 'denied' ? 'denied' : 'prompt'
  );
  const [lastGpsTimestamp, setLastGpsTimestamp] = useState<string | null>(contextGpsTimestamp || null);

  // Route & Hospital search states
  const [isRecalculatingRoute, setIsRecalculatingRoute] = useState(false);
  const [isSearchingHospitals, setIsSearchingHospitals] = useState(false);
  const [hospitalSearchSource, setHospitalSearchSource] = useState<'live_places' | 'fallback' | null>(null);
  const [hospitalSearchMessage, setHospitalSearchMessage] = useState<string | null>(null);

  const lastLocationSendTimeRef = useRef<number>(0);
  const watchIdRef = useRef<number | null>(null);

  const driverCoordsRef = useRef(driverCoords);
  driverCoordsRef.current = driverCoords;

  const assignedEmergenciesRef = useRef(assignedEmergencies);
  assignedEmergenciesRef.current = assignedEmergencies;

  const selectedAmbulanceRef = useRef(selectedAmbulance);
  selectedAmbulanceRef.current = selectedAmbulance;

  // Broadcasts driver location periodically to both emergency and ambulance tables and WebSockets
  const sendLocationUpdate = useCallback(
    async (coords: {
      latitude: number;
      longitude: number;
      speed?: number | null;
      heading?: number | null;
      accuracy?: number | null;
    }) => {
      const activeMission = assignedEmergenciesRef.current.find((e) =>
        ['DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED'].includes(e.status)
      );
      const amb = selectedAmbulanceRef.current;
      const ambId = amb?.id || activeMission?.ambulance_id || 1;

      // 1. If assigned to an active emergency, update emergency driver coordinates
      if (activeMission) {
        api
          .updateDriverLocation(activeMission.id, {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy ?? undefined,
            speed: coords.speed ?? undefined,
            heading: coords.heading ?? undefined,
          })
          .catch((err) => console.warn('Emergency driver GPS streaming notice:', err));
      }

      // 2. Always update ambulance table for live fleet tracking across admin and system
      if (ambId) {
        api
          .updateAmbulanceLocation(ambId, {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy ?? undefined,
            speed: coords.speed ?? undefined,
            heading: coords.heading ?? undefined,
          })
          .catch((err) => console.warn('Ambulance GPS streaming notice:', err));
      }

      // 3. Emit real-time socket payload
      socketService.emitAmbulanceLocation({
        ambulanceId: ambId,
        emergencyId: activeMission?.id || null,
        driverId: user?.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy ?? undefined,
        speed: coords.speed ?? undefined,
        heading: coords.heading ?? undefined,
        source: 'device_gps',
        timestamp: new Date().toISOString(),
      });
    },
    [user]
  );

  useEffect(() => {
    if (userCoords && !driverCoords) {
      setDriverCoords({
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        accuracy: userCoords.accuracy,
      });
      setGpsPermissionStatus(locationPermission === 'granted' ? 'granted' : locationPermission === 'denied' ? 'denied' : 'prompt');
      setIsTrackingGPS(true);
      if (contextGpsTimestamp) {
        setLastGpsTimestamp(contextGpsTimestamp);
      }
    }
  }, [userCoords, locationPermission, contextGpsTimestamp]);

  // Request browser geolocation permission immediately on initial mount
  useEffect(() => {
    if (navigator.geolocation && !driverCoords) {
      handleEnableLiveLocation();
    }
  }, []);

  // Poll driver dispatches every 3 seconds and sync on user change
  useEffect(() => {
    setSelectedAmbulance(null);
    loadDriverData();
    const interval = setInterval(loadDriverData, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Continuous Geolocation Watch Position & Periodic Backend Streaming
  useEffect(() => {
    if (!navigator.geolocation) return;

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
            setGpsPermissionStatus('granted');
            setLastGpsTimestamp(new Date().toLocaleTimeString());

            // Throttle sending coordinates to backend to every 3.5 seconds
            const now = Date.now();
            if (now - lastLocationSendTimeRef.current > 3500) {
              lastLocationSendTimeRef.current = now;
              sendLocationUpdate(coords);
            }
          },
          (err) => {
            console.warn('Geolocation watch position notice:', err.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 2500,
          }
        );
        watchIdRef.current = id;
      } catch (e) {
        console.warn('Could not initialize geolocation watchPosition:', e);
      }
    }

    // Periodic heartbeat: ensures updates are sent to the backend every 4 seconds
    // even when the ambulance is stationary (red light, waiting, traffic)
    const periodicLocationInterval = setInterval(() => {
      if (driverCoordsRef.current) {
        sendLocationUpdate(driverCoordsRef.current);
      }
    }, 4000);

    return () => {
      clearInterval(periodicLocationInterval);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [sendLocationUpdate]);

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
    showToast(`Switched driver cockpit to Ambulance ${amb.vehicle_number}`, 'info');
  };

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

        sendLocationUpdate(coords);

        const activeMission = assignedEmergencies.find((e) =>
          ['DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED'].includes(e.status)
        );
        if (activeMission) {
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
          showToast('Location permission denied. Please allow location access or enter coordinates manually.', 'error');
        } else {
          setGpsPermissionStatus('unavailable');
          showToast('Unable to acquire GPS signal. You can enter location manually.', 'info');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSetManualLocation = (lat: number, lng: number) => {
    const coords = {
      latitude: lat,
      longitude: lng,
      accuracy: 10,
    };
    setDriverCoords(coords);
    setGpsPermissionStatus('granted');
    setLastGpsTimestamp(new Date().toLocaleTimeString());
    setIsTrackingGPS(true);
    showToast(`📍 Ambulance location updated manually: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`, 'success');

    sendLocationUpdate(coords);

    const activeMission = assignedEmergencies.find((e) =>
      ['DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED'].includes(e.status)
    );
    if (activeMission) {
      api.recalculateRoute(activeMission.id, {
        originLatitude: coords.latitude,
        originLongitude: coords.longitude,
      }).catch(console.warn);
    }
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
      // Automatically navigate driver to Active Emergency screen
      setActiveTab('active');
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

  const handleRecalculateRoute = async (emergencyId: number) => {
    setIsRecalculatingRoute(true);
    try {
      const res = await api.recalculateRoute(emergencyId, {
        originLatitude: driverCoords?.latitude,
        originLongitude: driverCoords?.longitude,
      });
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
      showToast(`Found ${res.hospitals.length} nearby emergency hospitals`, 'success');
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
      await api.navigateToHospital(emergencyId, {
        hospitalName: hospital.name,
        hospitalCoords: hospital.coordinates,
        driverCoords: driverCoords || undefined,
      });
      showToast(`🧭 STAGE 2 Navigation: En route to ${hospital.name}`, 'success');
      soundEffects.playEmergencyAlert();
      await loadDriverData();
      setActiveTab('navigation');
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
      showToast(`Switched navigation: ${newStage === 'TO_PATIENT' ? 'Stage 1 (To Patient)' : 'Stage 2 (To Hospital)'}`, 'info');
    } catch (e: any) {
      showToast(e.message || 'Failed to change stage', 'error');
    }
  };

  const openReportModal = (id: number, emergency?: EmergencyRequest) => {
    setReportModalEmergencyId(id);
    setFallbackReportEmergency(emergency);
  };

  // Filter unassigned incoming requests waiting for driver
  const incomingRequests = allEmergencies.filter(
    (e) => e.status === 'WAITING_FOR_DRIVER' && !e.ambulance_id
  );

  // Active emergency for current vehicle/driver
  const activeMission = assignedEmergencies.length > 0 ? assignedEmergencies[0] : null;

  // Completed dispatches count for today
  const todayDispatchesCount = allEmergencies.filter((e) => {
    if (e.status !== 'COMPLETED') return false;
    const itemDate = new Date(e.created_at).toDateString();
    const today = new Date().toDateString();
    return itemDate === today;
  }).length;

  return (
    <div id="driver-portal-root" className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* MOBILE TOPBAR WITH MENU TRIGGER */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-2 cursor-pointer"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span className="text-xs">Menu</span>
        </button>

        <div className="flex items-center gap-2">
          {activeMission && (
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className="px-2.5 py-1 rounded-full bg-red-600 text-white font-black text-[10px] animate-pulse flex items-center gap-1 cursor-pointer"
            >
              <Radio className="w-3 h-3" />
              <span>SOS #{activeMission.id}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <BellRing className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* FIXED/COLLAPSIBLE ROLE-BASED SIDEBAR */}
      <div className={`${isMobileSidebarOpen ? 'block' : 'hidden'} md:block fixed md:sticky top-0 left-0 h-screen z-40`}>
        <DriverSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false);
          }}
          incomingCount={incomingRequests.length}
          activeEmergencyId={activeMission?.id}
          unreadNotificationsCount={unreadCount}
          onLogout={logout}
          selectedAmbulanceNumber={selectedAmbulance?.vehicle_number}
        />
      </div>

      {/* MAIN VIEW CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <DriverDashboardView
            driverName={user?.name || selectedAmbulance?.driver_name || 'Rajesh Kumar'}
            selectedAmbulance={selectedAmbulance}
            ambulances={ambulances}
            onSelectAmbulance={handleSelectAmbulance}
            activeMission={activeMission}
            incomingRequests={incomingRequests}
            todayDispatchesCount={todayDispatchesCount}
            driverCoords={driverCoords}
            gpsPermissionStatus={gpsPermissionStatus}
            lastGpsTimestamp={lastGpsTimestamp}
            onSelectTab={setActiveTab}
            onAcceptEmergency={handleAcceptEmergency}
            isAcceptingId={acceptingId}
            onToggleAmbulanceStatus={handleToggleAmbulanceStatus}
            onEnableLiveLocation={handleEnableLiveLocation}
          />
        )}

        {/* TAB 2: INCOMING EMERGENCIES */}
        {activeTab === 'incoming' && (
          <DriverIncomingView
            incomingRequests={incomingRequests}
            onAcceptEmergency={handleAcceptEmergency}
            isAcceptingId={acceptingId}
            driverCoords={driverCoords}
            onRejectEmergency={(id) => {
              showToast(`Emergency SOS #${id} declined and passed to regional pool`, 'info');
            }}
          />
        )}

        {/* TAB 3: ACTIVE EMERGENCY */}
        {activeTab === 'active' && (
          <DriverActiveView
            activeMission={activeMission}
            onUpdateStatus={handleUpdateStatus}
            isUpdating={isUpdating}
            onSwitchTab={setActiveTab}
            onOpenVitalsModal={() => setIsVitalsModalOpen(true)}
            onOpenReportModal={openReportModal}
            onSwitchStage={handleSwitchStage}
            onFindNearbyHospitals={handleFindNearbyHospitals}
            onSelectHospital={handleSelectHospital}
            onNavigateToHospital={handleNavigateToHospital}
            isSearchingHospitals={isSearchingHospitals}
            driverCoords={driverCoords}
          />
        )}

        {/* TAB 4: NAVIGATION */}
        {activeTab === 'navigation' && (
          <DriverNavigationView
            activeMission={activeMission}
            selectedAmbulance={selectedAmbulance}
            driverCoords={driverCoords}
            isTrackingGPS={isTrackingGPS}
            gpsPermissionStatus={gpsPermissionStatus}
            lastGpsTimestamp={lastGpsTimestamp}
            onEnableLiveLocation={handleEnableLiveLocation}
            onSetManualLocation={handleSetManualLocation}
            onRecalculateRoute={handleRecalculateRoute}
            isRecalculatingRoute={isRecalculatingRoute}
            onSelectRoute={handleSelectRoute}
            onSelectHospital={handleSelectHospital}
            onFindNearbyHospitals={handleFindNearbyHospitals}
            onNavigateToHospital={handleNavigateToHospital}
            isSearchingHospitals={isSearchingHospitals}
            hospitalSearchSource={hospitalSearchSource}
            hospitalSearchMessage={hospitalSearchMessage}
            onSwitchStage={handleSwitchStage}
            onUpdateStatus={handleUpdateStatus}
            showToast={showToast}
          />
        )}

        {/* TAB 5: AMBULANCE STATUS */}
        {activeTab === 'status' && (
          <DriverAmbulanceStatusView
            selectedAmbulance={selectedAmbulance}
            ambulances={ambulances}
            onSelectAmbulance={handleSelectAmbulance}
            driverName={user?.name || selectedAmbulance?.driver_name || 'Rajesh Kumar'}
            driverPhone={user?.phone || selectedAmbulance?.phone}
            driverCoords={driverCoords}
            gpsPermissionStatus={gpsPermissionStatus}
            lastGpsTimestamp={lastGpsTimestamp}
            onEnableLiveLocation={handleEnableLiveLocation}
            onToggleAmbulanceStatus={handleToggleAmbulanceStatus}
            activeMission={activeMission}
            onUpdateEmergencyStatus={handleUpdateStatus}
            onSwitchTab={setActiveTab}
          />
        )}

        {/* TAB 6: EMERGENCY HISTORY */}
        {activeTab === 'history' && (
          <DriverHistoryView
            emergencies={allEmergencies}
            onOpenReportModal={openReportModal}
            selectedAmbulanceVehicleNumber={selectedAmbulance?.vehicle_number}
          />
        )}

        {/* TAB 7: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <DriverNotificationsView />
        )}

        {/* TAB 8 & 9: PROFILE & SETTINGS */}
        {(activeTab === 'profile' || activeTab === 'settings') && (
          <DriverProfileSettingsView
            selectedAmbulance={selectedAmbulance}
            showToast={showToast}
          />
        )}
      </main>

      {/* SHARED MODALS */}
      {/* 1. In-Transit Vitals Modal */}
      {activeMission && (
        <InTransitVitalsModal
          isOpen={isVitalsModalOpen}
          onClose={() => setIsVitalsModalOpen(false)}
          emergencyId={activeMission.id}
          patientName={activeMission.patient_name}
          initialVitals={{
            heartRate: activeMission.vitals_heart_rate,
            bloodPressure: activeMission.vitals_blood_pressure,
            oxygenSaturation: activeMission.vitals_oxygen_saturation,
            respiratoryRate: activeMission.vitals_respiratory_rate,
            gcsScore: activeMission.vitals_gcs_score,
            temperature: activeMission.vitals_temperature,
            notes: activeMission.vitals_notes,
          }}
          onVitalsUpdated={() => {
            loadDriverData();
            showToast('Patient vitals telemetry transmitted to hospital ER', 'success');
          }}
        />
      )}

      {/* 2. Emergency Report Modal */}
      <EmergencyReportModal
        isOpen={reportModalEmergencyId !== null}
        onClose={() => {
          setReportModalEmergencyId(null);
          setFallbackReportEmergency(undefined);
        }}
        emergencyId={reportModalEmergencyId}
        fallbackEmergency={fallbackReportEmergency}
      />
    </div>
  );
};

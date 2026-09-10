import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { LocationProvider } from './context/LocationContext';
import { Navbar } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { PatientDashboard } from './components/PatientDashboard';
import { DriverDashboard } from './components/DriverDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { GlobalEmergencySOSModal } from './components/GlobalEmergencySOSModal';
import { soundEffects } from './utils/sound';
import { 
  HeartHandshake, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  AlertOctagon,
  Info, 
  Activity,
  PhoneCall,
  Phone,
  Smartphone,
  WifiOff,
  Wifi,
  Contrast
} from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, toast, showToast, demoLogin } = useAuth();
  const { notify, setIsOnline, fetchNotifications } = useNotifications();
  const { t } = useLanguage();
  const { isHighContrast, toggleHighContrast } = useTheme();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [showRestoredNotice, setShowRestoredNotice] = useState<boolean>(false);
  const [globalSosModalOpen, setGlobalSosModalOpen] = useState(false);
  const wasOfflineRef = useRef<boolean>(false);

  // Global Emergency Keyboard Shortcut Listener: Cmd+Shift+S (Mac) or Ctrl+Shift+S (Windows/Linux)
  // Ensures rapid access for users to trigger the emergency SOS flow even when they are not on the dashboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;
      const isKeyS = e.key?.toLowerCase() === 's' || e.code === 'KeyS';

      if (isCmdOrCtrl && isShift && isKeyS) {
        e.preventDefault();
        e.stopPropagation();

        // Sound emergency siren alert immediately
        soundEffects.playEmergencyAlert();

        // Open rapid Emergency SOS dispatch modal
        setGlobalSosModalOpen(true);

        // Notify user via toast and notification system
        showToast('🚨 Emergency SOS Shortcut (Cmd+Shift+S) Triggered!', 'error');
        notify(
          '🚨 Emergency SOS Shortcut Activated',
          'Rapid emergency SOS dispatch initiated via global keyboard shortcut (Cmd+Shift+S). Please confirm dispatch details to deploy an ambulance immediately.',
          'SYSTEM_ALERT'
        );

        // Also broadcast custom event for mounted components
        window.dispatchEvent(new CustomEvent('arogyavahini:rapid-sos-triggered'));
      }
    };

    const handleOpenSosEvent = () => {
      soundEffects.playEmergencyAlert();
      setGlobalSosModalOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('arogyavahini:open-rapid-sos', handleOpenSosEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('arogyavahini:open-rapid-sos', handleOpenSosEvent);
    };
  }, [notify, showToast]);

  // Mobile Shake-to-SOS Detection (Accelerometer-based emergency trigger)
  // Allows mobile users in distress to shake their device to trigger emergency dispatch without keyboard shortcuts
  useEffect(() => {
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;
    let lastTime = 0;
    let shakeCount = 0;
    let resetShakeTimer: any = null;
    let cooldownTimer: any = null;
    let inCooldown = false;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (inCooldown) return;

      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const now = Date.now();
      if (now - lastTime > 100) {
        const diffTime = now - lastTime;
        lastTime = now;

        if (lastX !== null && lastY !== null && lastZ !== null) {
          const deltaX = Math.abs(acc.x - lastX);
          const deltaY = Math.abs(acc.y - lastY);
          const deltaZ = Math.abs(acc.z - lastZ);
          const speed = ((deltaX + deltaY + deltaZ) / diffTime) * 10000;

          // Vigorous shake gesture threshold
          if (speed > 2500) {
            shakeCount++;
            clearTimeout(resetShakeTimer);
            resetShakeTimer = setTimeout(() => {
              shakeCount = 0;
            }, 1200);

            // 2 vigorous shakes in succession triggers SOS
            if (shakeCount >= 2) {
              shakeCount = 0;
              inCooldown = true;
              cooldownTimer = setTimeout(() => {
                inCooldown = false;
              }, 4000);

              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                try {
                  navigator.vibrate([300, 100, 300, 100, 400]);
                } catch {}
              }

              soundEffects.playEmergencyAlert();
              setGlobalSosModalOpen(true);
              showToast('🚨 Mobile Shake-to-SOS Activated! Emergency dispatch screen opened.', 'error');
              notify(
                '🚨 Shake-to-SOS Activated',
                'Mobile phone shake gesture detected. Emergency ambulance dispatch screen initiated.',
                'SYSTEM_ALERT'
              );
              window.dispatchEvent(new CustomEvent('arogyavahini:rapid-sos-triggered'));
            }
          }
        }

        lastX = acc.x;
        lastY = acc.y;
        lastZ = acc.z;
      }
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => {
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
      clearTimeout(resetShakeTimer);
      clearTimeout(cooldownTimer);
    };
  }, [notify, showToast]);

  // Offline detection listener: monitors browser connectivity and notifies user via NotificationProvider
  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setIsOnline(false);
      wasOfflineRef.current = true;

      // Notify the user via the NotificationProvider
      notify(
        'Internet Connection Lost',
        'You are currently offline. Emergency SOS requests, live ambulance GPS tracking, and ER telemetry require internet connectivity.',
        'OFFLINE_ALERT'
      );

      showToast('Internet connection lost. You are currently offline.', 'error');
    };

    const handleOnline = () => {
      setIsOffline(false);
      setIsOnline(true);

      if (wasOfflineRef.current) {
        // Notify the user via the NotificationProvider
        notify(
          'Internet Connection Restored',
          'Your connection has been restored. Live emergency synchronization and real-time fleet telemetry are back online.',
          'ONLINE_RESTORED'
        );

        showToast('Internet connection restored. Live sync active.', 'success');
        setShowRestoredNotice(true);
        fetchNotifications();
      }
      wasOfflineRef.current = false;
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Initial check on mount
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [notify, setIsOnline, fetchNotifications, showToast]);

  const openAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const role = user?.role?.toLowerCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white transition-colors duration-200">
      {/* Offline Status Alert Banner */}
      {isOffline && (
        <div
          id="offline-detection-banner"
          role="alert"
          className="bg-amber-600 dark:bg-amber-700 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-md z-50 border-b border-amber-500 animate-in slide-in-from-top duration-200"
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0 text-amber-100 animate-pulse" />
              <span>
                <strong>Offline Notice:</strong> Internet connection lost. Emergency SOS requests and real-time fleet telemetry are suspended until connection is restored.
              </span>
            </div>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-amber-700/80 dark:bg-amber-800/80 text-[11px] font-mono uppercase tracking-wider text-amber-100 border border-amber-500/50">
              Offline
            </span>
          </div>
        </div>
      )}

      {/* Online Restored Status Banner */}
      {showRestoredNotice && (
        <div
          id="online-restored-banner"
          role="status"
          className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md z-50 border-b border-emerald-500 animate-in fade-in duration-200"
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 shrink-0 text-emerald-100" />
              <span>
                <strong>Online:</strong> Internet connection restored. Real-time emergency synchronization is active.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowRestoredNotice(false)}
              className="text-emerald-100 hover:text-white text-xs font-semibold px-2 py-0.5 rounded hover:bg-emerald-700 transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-slate-900 text-emerald-400 border-slate-700'
                : toast.type === 'error'
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-white shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Single Role-Based Navbar */}
      <Navbar openAuthModal={openAuth} />

      {/* Main Page Body: Render exclusively based on authenticated user role */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {!isAuthenticated || !user ? (
          <HomeHero onOpenAuth={() => openAuth('login')} />
        ) : role === 'driver' ? (
          <DriverDashboard />
        ) : role === 'patient' ? (
          <PatientDashboard />
        ) : role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <HomeHero onOpenAuth={() => openAuth('login')} />
        )}
      </main>

      {/* Production-Grade Clean Footer */}
      <footer className="mt-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-sm">
                {t.appTitle}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {t.appSubtitle}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-600 dark:text-slate-300 font-medium text-xs">
            <span className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 px-3 py-1 rounded-md border border-red-200 dark:border-red-900 font-bold">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{t.footerEmergencyHotline}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>24/7 Verified Medical Dispatch</span>
            </span>
          </div>

          <div className="text-center md:text-right">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {t.footerDesc}
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Emergency SOS Quick Access Trigger (Responsive: thumb-dock on mobile, bottom-left on desktop) */}
      <div className="fixed bottom-5 right-4 sm:bottom-6 sm:left-6 sm:right-auto z-40 flex items-center gap-2">
        {/* Direct Mobile Speed Dial Call 108 */}
        <a
          href="tel:108"
          title="Direct Toll-Free Emergency Ambulance Hotline 108"
          onClick={() => {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try { navigator.vibrate([100]); } catch {}
            }
          }}
          className="flex sm:hidden p-2.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 active:bg-slate-700 text-red-400 border border-red-500/60 shadow-xl shadow-slate-950/60 items-center justify-center transition active:scale-95 cursor-pointer backdrop-blur-xs"
        >
          <PhoneCall className="w-4 h-4 text-red-500 animate-pulse" />
        </a>

        {/* High-Contrast Outdoor Glare Mode Quick Button */}
        <button
          type="button"
          id="floating-high-contrast-toggle"
          onClick={() => {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try { navigator.vibrate([60]); } catch {}
            }
            toggleHighContrast();
            showToast(
              !isHighContrast
                ? '☀️ High-Contrast Glare Mode Activated: Pitch Black & Vibrant Yellow'
                : 'High-Contrast Glare Mode Disabled',
              'info'
            );
          }}
          title={isHighContrast ? 'Disable High-Contrast Mode' : 'Enable High-Contrast Glare Mode for Direct Sunlight (Alt+H)'}
          className={`p-2.5 rounded-xl border shadow-xl flex items-center justify-center transition active:scale-95 cursor-pointer backdrop-blur-xs ${
            isHighContrast
              ? 'bg-yellow-400 text-black border-white font-extrabold shadow-[0_0_15px_rgba(255,230,0,0.8)]'
              : 'bg-slate-900/95 hover:bg-slate-800 text-yellow-400 border-yellow-500/40 shadow-slate-950/60'
          }`}
        >
          <Contrast className={`w-4 h-4 ${isHighContrast ? 'text-black' : 'text-yellow-400'}`} />
        </button>

        {/* Rapid SOS Trigger Button */}
        <button
          type="button"
          id="global-sos-floating-trigger"
          onClick={() => {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try { navigator.vibrate([200, 100, 200]); } catch {}
            }
            soundEffects.playEmergencyAlert();
            setGlobalSosModalOpen(true);
          }}
          title="Rapid Emergency SOS: Tap to dispatch or shake phone on mobile (or press Cmd+Shift+S)"
          className="px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-xl shadow-red-900/50 border border-red-400/80 flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs group animate-in fade-in slide-in-from-bottom-3"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
          <AlertOctagon className="w-4 h-4 text-white animate-pulse shrink-0" />
          <span className="inline font-black tracking-tight">SOS</span>
          <span className="hidden sm:inline">Dispatch</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-red-950/80 text-[10px] font-mono text-amber-200 border border-red-400/60 font-black tracking-wider">
            ⌘+Shift+S
          </span>
          <span className="flex sm:hidden items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/90 text-[10px] font-bold text-amber-300 border border-red-400/60">
            <Smartphone className="w-2.5 h-2.5" />
            <span>Shake / Tap</span>
          </span>
        </button>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Global Rapid Emergency SOS Modal (Cmd+Shift+S) */}
      <GlobalEmergencySOSModal
        isOpen={globalSosModalOpen}
        onClose={() => setGlobalSosModalOpen(false)}
        onEmergencyDispatched={async (emergency) => {
          if (role !== 'patient') {
            await demoLogin('patient');
          }
          fetchNotifications();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <LocationProvider>
              <AppContent />
            </LocationProvider>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

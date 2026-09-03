import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { soundEffects } from '../utils/sound';
import { Language } from '../i18n/translations';
import { NotificationBell } from './NotificationBell';
import { 
  Heart,
  Truck, 
  ShieldCheck, 
  User, 
  Volume2, 
  VolumeX, 
  LogOut, 
  PhoneCall, 
  LogIn, 
  AlertOctagon,
  BellRing,
  Radio,
  FileText,
  Users,
  Activity,
  BarChart3,
  Flame,
  Globe,
  Sun,
  Moon,
  ChevronDown,
  Check
} from 'lucide-react';

interface NavbarProps {
  openAuthModal: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ openAuthModal }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const [soundOn, setSoundOn] = useState(true);
  const [activeItem, setActiveItem] = useState<string>('dashboard');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundEffects.setSoundEnabled(next);
    if (next) soundEffects.playSuccessTone();
  };

  const handleNavClick = (itemId: string, targetElementId?: string) => {
    setActiveItem(itemId);
    if (targetElementId) {
      const element = document.getElementById(targetElementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const role = user?.role?.toLowerCase();

  const languageOptions: { code: Language; label: string; nativeName: string }[] = [
    { code: 'en', label: 'English', nativeName: 'English' },
    { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  ];

  const currentLangLabel = languageOptions.find((l) => l.code === language)?.nativeName || 'English';

  const getSubtitle = () => {
    if (role === 'driver') return t.appSubtitleDriver;
    if (role === 'admin') return t.appSubtitleAdmin;
    return t.appSubtitlePatient;
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:bg-red-700 transition-colors">
            A
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">
              {t.appTitle}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">
              {getSubtitle()}
            </span>
          </div>
        </div>

        {/* Dynamic Role-Based Navigation Items */}
        {isAuthenticated && user && (
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {/* DRIVER NAVIGATION */}
            {role === 'driver' && (
              <>
                <button
                  onClick={() => handleNavClick('dashboard', 'driver-dashboard-root')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'dashboard'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{t.navDriverDashboard}</span>
                </button>

                <button
                  onClick={() => handleNavClick('requests', 'driver-incoming-requests-section')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'requests'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <BellRing className="w-3.5 h-3.5 text-red-500" />
                  <span>{t.navIncomingRequests}</span>
                </button>

                <button
                  onClick={() => handleNavClick('active', 'driver-active-dispatch')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'active'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{t.navActiveEmergency}</span>
                </button>

                <button
                  onClick={() => handleNavClick('ambulance', 'driver-ambulance-status')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'ambulance'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.navAmbulanceStatus}</span>
                </button>

                <button
                  onClick={() => handleNavClick('profile', 'driver-profile-info')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'profile'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.navProfile}</span>
                </button>
              </>
            )}

            {/* PATIENT NAVIGATION */}
            {role === 'patient' && (
              <>
                <button
                  onClick={() => handleNavClick('dashboard', 'patient-dashboard-root')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'dashboard'
                      ? 'bg-red-50 text-red-900 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-red-600" />
                  <span>{t.navPatientDashboard}</span>
                </button>

                <button
                  onClick={() => handleNavClick('sos', 'patient-emergency-sos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'sos'
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold'
                  }`}
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>{t.navEmergencySOS}</span>
                </button>

                <button
                  onClick={() => handleNavClick('requests', 'patient-requests-history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'requests'
                      ? 'bg-red-50 text-red-900 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.navMyRequests}</span>
                </button>

                <button
                  onClick={() => handleNavClick('tracking', 'active-emergency-card')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'tracking'
                      ? 'bg-red-50 text-red-900 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{t.navAmbulanceTracking}</span>
                </button>

                <button
                  onClick={() => handleNavClick('profile', 'patient-profile-section')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'profile'
                      ? 'bg-red-50 text-red-900 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.navProfile}</span>
                </button>
              </>
            )}

            {/* ADMIN NAVIGATION */}
            {role === 'admin' && (
              <>
                <button
                  onClick={() => handleNavClick('dashboard', 'admin-dashboard-root')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'dashboard'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{t.navAdminDashboard}</span>
                </button>

                <button
                  onClick={() => handleNavClick('emergencies', 'admin-emergency-feed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'emergencies'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span>{t.navEmergencyRequests}</span>
                </button>

                <button
                  onClick={() => handleNavClick('ambulances', 'admin-fleet-section')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'ambulances'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span>{t.navAmbulances}</span>
                </button>

                <button
                  onClick={() => handleNavClick('drivers', 'admin-drivers-section')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'drivers'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{t.navDrivers}</span>
                </button>

                <button
                  onClick={() => handleNavClick('users', 'admin-users-section')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'users'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span>{t.navUsers}</span>
                </button>

                <button
                  onClick={() => handleNavClick('reports', 'admin-reports-section')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'reports'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.navReports}</span>
                </button>
              </>
            )}
          </nav>
        )}

        {/* Public / Unauthenticated Navigation */}
        {!isAuthenticated && (
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
              <PhoneCall className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>{t.hotlineLabel}</span>
            </span>
            <a href="tel:108" className="font-bold text-red-600 dark:text-red-400 hover:underline">
              108 / 112
            </a>
          </div>
        )}

        {/* Right Section: Language, Theme, Sound, User Info & Logout / Login */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Language Selector Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              title={t.languageSelect}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">{currentLangLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                {languageOptions.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => {
                      setLanguage(opt.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                      language === opt.code
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{opt.nativeName} ({opt.label})</span>
                    {language === opt.code && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? t.themeLight : t.themeDark}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Sound Mute/Unmute */}
          <button
            onClick={toggleSound}
            title={soundOn ? t.soundMute : t.soundUnmute}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Real-time Notification Bell for Authenticated Users */}
          {isAuthenticated && user && (
            <NotificationBell
              onOpenEmergency={(emergencyId) => {
                if (role === 'driver') {
                  const el = document.getElementById('driver-active-emergency-section') || document.getElementById('driver-incoming-requests-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else if (role === 'admin') {
                  const el = document.getElementById('admin-emergency-feed');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  const el = document.getElementById('patient-active-emergency-tracker') || document.getElementById('patient-history-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
          )}

          {/* Authenticated User Info */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[130px]">
                  {user.name}
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  {t.roleLabel}{' '}
                  <span className={`font-black ${
                    role === 'driver' ? 'text-amber-600 dark:text-amber-400' : role === 'admin' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {role === 'driver' ? t.roleDriver : role === 'admin' ? t.roleAdmin : t.rolePatient}
                  </span>
                </span>
              </div>

              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs ${
                role === 'driver' ? 'bg-amber-600' : role === 'admin' ? 'bg-blue-600' : 'bg-red-600'
              }`}>
                {user.name.charAt(0)}
              </div>

              <button
                onClick={logout}
                title={t.logout}
                className="py-1.5 px-2.5 sm:px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.logout}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="py-1.5 px-3.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all border border-slate-800 dark:border-slate-700"
            >
              <LogIn className="w-4 h-4 text-blue-400" />
              <span>{t.signInRegister}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      {isAuthenticated && user && (
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 py-1.5 px-3">
          {role === 'driver' && (
            <>
              <button
                onClick={() => handleNavClick('dashboard', 'driver-dashboard-root')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {t.navDriverDashboard}
              </button>
              <button
                onClick={() => handleNavClick('requests', 'driver-incoming-requests-section')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {t.navIncomingRequests}
              </button>
              <button
                onClick={() => handleNavClick('active', 'driver-active-dispatch')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {t.navActiveEmergency}
              </button>
              <button
                onClick={() => handleNavClick('ambulance', 'driver-ambulance-status')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {t.navAmbulanceStatus}
              </button>
              <button
                onClick={() => handleNavClick('profile', 'driver-profile-info')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {t.navProfile}
              </button>
            </>
          )}

          {role === 'patient' && (
            <>
              <button
                onClick={() => handleNavClick('dashboard', 'patient-dashboard-root')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {t.navPatientDashboard}
              </button>
              <button
                onClick={() => handleNavClick('sos', 'patient-emergency-sos')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-red-600 text-white"
              >
                {t.navEmergencySOS}
              </button>
              <button
                onClick={() => handleNavClick('requests', 'patient-requests-history')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {t.navMyRequests}
              </button>
              <button
                onClick={() => handleNavClick('tracking', 'active-emergency-card')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {t.navAmbulanceTracking}
              </button>
              <button
                onClick={() => handleNavClick('profile', 'patient-profile-section')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {t.navProfile}
              </button>
            </>
          )}

          {role === 'admin' && (
            <>
              <button
                onClick={() => handleNavClick('dashboard', 'admin-dashboard-root')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {t.navAdminDashboard}
              </button>
              <button
                onClick={() => handleNavClick('emergencies', 'admin-emergency-feed')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {t.navEmergencyRequests}
              </button>
              <button
                onClick={() => handleNavClick('ambulances', 'admin-fleet-section')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {t.navAmbulances}
              </button>
              <button
                onClick={() => handleNavClick('drivers', 'admin-drivers-section')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {t.navDrivers}
              </button>
              <button
                onClick={() => handleNavClick('users', 'admin-users-section')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {t.navUsers}
              </button>
              <button
                onClick={() => handleNavClick('reports', 'admin-reports-section')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {t.navReports}
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};

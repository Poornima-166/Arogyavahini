import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { soundEffects } from '../utils/sound';
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
  Flame
} from 'lucide-react';

interface NavbarProps {
  openAuthModal: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ openAuthModal }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [soundOn, setSoundOn] = useState(true);
  const [activeItem, setActiveItem] = useState<string>('dashboard');

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

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:bg-blue-700 transition-colors">
            A
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
              Arogyavahini
            </span>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
              {role === 'driver' ? 'Ambulance Crew Dispatch' : role === 'admin' ? 'Hospital Command Center' : 'Emergency Response'}
            </span>
          </div>
        </div>

        {/* Dynamic Role-Based Navigation Items */}
        {isAuthenticated && user && (
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-1">
            {/* DRIVER NAVIGATION */}
            {role === 'driver' && (
              <>
                <button
                  onClick={() => handleNavClick('dashboard', 'driver-dashboard-root')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'dashboard'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Driver Dashboard</span>
                </button>

                <button
                  onClick={() => handleNavClick('requests', 'driver-incoming-requests-section')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'requests'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BellRing className="w-3.5 h-3.5 text-red-500" />
                  <span>Incoming Requests</span>
                </button>

                <button
                  onClick={() => handleNavClick('active', 'driver-active-dispatch')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'active'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-amber-600" />
                  <span>Active Emergency</span>
                </button>

                <button
                  onClick={() => handleNavClick('ambulance', 'driver-ambulance-status')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'ambulance'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ambulance Status</span>
                </button>

                <button
                  onClick={() => handleNavClick('profile', 'driver-profile-info')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'profile'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Profile</span>
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
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-red-600" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => handleNavClick('sos', 'patient-emergency-sos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'sos'
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-red-600 hover:bg-red-50 font-bold'
                  }`}
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Emergency SOS</span>
                </button>

                <button
                  onClick={() => handleNavClick('requests', 'patient-requests-history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'requests'
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>My Requests</span>
                </button>

                <button
                  onClick={() => handleNavClick('tracking', 'active-emergency-card')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'tracking'
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ambulance Tracking</span>
                </button>

                <button
                  onClick={() => handleNavClick('profile', 'patient-profile-section')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'profile'
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Profile</span>
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
                      ? 'bg-blue-50 text-blue-900 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => handleNavClick('emergencies', 'admin-emergency-feed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'emergencies'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span>Emergency Requests</span>
                </button>

                <button
                  onClick={() => handleNavClick('ambulances', 'admin-fleet-section')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'ambulances'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Ambulances</span>
                </button>

                <button
                  onClick={() => handleNavClick('drivers', 'admin-drivers-section')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'drivers'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  <span>Drivers</span>
                </button>

                <button
                  onClick={() => handleNavClick('users', 'admin-users-section')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'users'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  <span>Users</span>
                </button>

                <button
                  onClick={() => handleNavClick('reports', 'admin-reports-section')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeItem === 'reports'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reports</span>
                </button>
              </>
            )}
          </nav>
        )}

        {/* Public / Unauthenticated Navigation */}
        {!isAuthenticated && (
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <PhoneCall className="w-3.5 h-3.5 text-red-500" />
              <span>Emergency Dispatch Hotline:</span>
            </span>
            <a href="tel:108" className="font-bold text-red-600 hover:underline">
              108 / 112
            </a>
          </div>
        )}

        {/* Right Section: Sound, User Info & Logout / Login */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Sound Mute/Unmute */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Mute Alert Audio' : 'Unmute Alert Audio'}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Authenticated User Info */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                  {user.name}
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase">
                  ROLE: <span className={`font-black ${
                    role === 'driver' ? 'text-amber-600' : role === 'admin' ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {user.role.toUpperCase()}
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
                title="Logout"
                className="py-1.5 px-2.5 sm:px-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-200 transition-all flex items-center gap-1.5 text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="py-1.5 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all border border-slate-800"
            >
              <LogIn className="w-4 h-4 text-blue-400" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Role Navigation Bar (Only for authenticated users on smaller screens) */}
      {isAuthenticated && user && (
        <div className="md:hidden flex items-center gap-1 overflow-x-auto border-t border-slate-200 bg-slate-50 py-1.5 px-3">
          {role === 'driver' && (
            <>
              <button
                onClick={() => handleNavClick('dashboard', 'driver-dashboard-root')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white text-slate-800 border border-slate-200"
              >
                Driver Dashboard
              </button>
              <button
                onClick={() => handleNavClick('requests', 'driver-incoming-requests-section')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white text-slate-800 border border-slate-200"
              >
                Incoming Requests
              </button>
              <button
                onClick={() => handleNavClick('active', 'driver-active-dispatch')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white text-slate-800 border border-slate-200"
              >
                Active Emergency
              </button>
              <button
                onClick={() => handleNavClick('ambulance', 'driver-ambulance-status')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white text-slate-800 border border-slate-200"
              >
                Ambulance Status
              </button>
              <button
                onClick={() => handleNavClick('profile', 'driver-profile-info')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white text-slate-800 border border-slate-200"
              >
                Profile
              </button>
            </>
          )}

          {role === 'patient' && (
            <>
              <button
                onClick={() => handleNavClick('dashboard', 'patient-dashboard-root')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white text-slate-800 border border-slate-200"
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNavClick('sos', 'patient-emergency-sos')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-red-600 text-white"
              >
                Emergency SOS
              </button>
              <button
                onClick={() => handleNavClick('requests', 'patient-requests-history')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white text-slate-800 border border-slate-200"
              >
                My Requests
              </button>
              <button
                onClick={() => handleNavClick('tracking', 'active-emergency-card')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white text-slate-800 border border-slate-200"
              >
                Ambulance Tracking
              </button>
              <button
                onClick={() => handleNavClick('profile', 'patient-profile-section')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white text-slate-800 border border-slate-200"
              >
                Profile
              </button>
            </>
          )}

          {role === 'admin' && (
            <>
              <button
                onClick={() => handleNavClick('dashboard', 'admin-dashboard-root')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white text-slate-800 border border-slate-200"
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNavClick('emergencies', 'admin-emergency-feed')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white text-slate-800 border border-slate-200"
              >
                Emergency Requests
              </button>
              <button
                onClick={() => handleNavClick('ambulances', 'admin-fleet-section')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white text-slate-800 border border-slate-200"
              >
                Ambulances
              </button>
              <button
                onClick={() => handleNavClick('drivers', 'admin-drivers-section')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white text-slate-800 border border-slate-200"
              >
                Drivers
              </button>
              <button
                onClick={() => handleNavClick('users', 'admin-users-section')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white text-slate-800 border border-slate-200"
              >
                Users
              </button>
              <button
                onClick={() => handleNavClick('reports', 'admin-reports-section')}
                className="px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-white text-slate-800 border border-slate-200"
              >
                Reports
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};

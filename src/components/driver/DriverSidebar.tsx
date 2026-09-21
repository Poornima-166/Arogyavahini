import React from 'react';
import { 
  Home, 
  BellRing, 
  Heart, 
  Navigation, 
  Truck, 
  History, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { Ambulance, EmergencyRequest } from '../../types';

export type DriverTab = 
  | 'dashboard'
  | 'incoming'
  | 'active'
  | 'navigation'
  | 'status'
  | 'history'
  | 'notifications'
  | 'profile'
  | 'settings';

interface DriverSidebarProps {
  activeTab: DriverTab;
  onSelectTab: (tab: DriverTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  incomingCount: number;
  hasActiveEmergency: boolean;
  activeMission?: EmergencyRequest | null;
  selectedAmbulance?: Ambulance | null;
  unreadNotificationsCount: number;
  onLogout: () => void;
}

export const DriverSidebar: React.FC<DriverSidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  incomingCount,
  hasActiveEmergency,
  selectedAmbulance,
  unreadNotificationsCount,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'dashboard' as DriverTab,
      label: 'Dashboard',
      icon: Home,
      badge: null,
    },
    {
      id: 'incoming' as DriverTab,
      label: 'Incoming Emergencies',
      icon: BellRing,
      badge: incomingCount > 0 ? {
        text: String(incomingCount),
        color: 'bg-red-600 text-white animate-pulse',
      } : null,
    },
    {
      id: 'active' as DriverTab,
      label: 'Active Emergency',
      icon: Heart,
      badge: hasActiveEmergency ? {
        text: 'ACTIVE',
        color: 'bg-amber-500 text-slate-950 font-black animate-pulse',
      } : null,
    },
    {
      id: 'navigation' as DriverTab,
      label: 'Navigation',
      icon: Navigation,
      badge: hasActiveEmergency ? {
        text: 'GPS',
        color: 'bg-emerald-600 text-white',
      } : null,
    },
    {
      id: 'status' as DriverTab,
      label: 'Ambulance Status',
      icon: Truck,
      badge: null,
    },
    {
      id: 'history' as DriverTab,
      label: 'Emergency History',
      icon: History,
      badge: null,
    },
    {
      id: 'notifications' as DriverTab,
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? {
        text: String(unreadNotificationsCount),
        color: 'bg-blue-600 text-white',
      } : null,
    },
    {
      id: 'profile' as DriverTab,
      label: 'Profile',
      icon: User,
      badge: null,
    },
    {
      id: 'settings' as DriverTab,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside
      id="driver-portal-sidebar"
      className={`bg-slate-900 dark:bg-slate-950 text-white border-r border-slate-800 flex flex-col transition-all duration-300 select-none z-30 shrink-0 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wider uppercase text-amber-400">DRIVER</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  PORTAL
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-white truncate">
                {selectedAmbulance?.vehicle_number || 'AMB-UNIT'}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Active Mission Alert Strip (when collapsed or expanded) */}
      {hasActiveEmergency && (
        <button
          type="button"
          onClick={() => onSelectTab('active')}
          className="mx-2 mt-3 p-2 rounded-xl bg-linear-to-r from-red-600 to-amber-600 text-white flex items-center gap-2.5 shadow-md hover:brightness-110 transition cursor-pointer"
        >
          <Radio className="w-4 h-4 animate-ping shrink-0" />
          {!isCollapsed && (
            <div className="text-left min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider block">MISSION IN PROGRESS</span>
              <span className="text-xs font-bold truncate block">Open Active Emergency</span>
            </div>
          )}
        </button>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto mt-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`driver-nav-${item.id}`}
              type="button"
              onClick={() => onSelectTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? 'text-slate-950 scale-110' : 'text-slate-400 group-hover:text-white'
                }`}
              />

              {!isCollapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}

              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider shrink-0 ${
                    item.badge.color
                  } ${isCollapsed ? 'ml-auto' : ''}`}
                >
                  {item.badge.text}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer / Logout */}
      <div className="p-2 border-t border-slate-800 space-y-1">
        <button
          type="button"
          onClick={onLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>

        {!isCollapsed && (
          <div className="px-3 py-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              CAD v2.4 Live
            </span>
            <span className="font-mono text-[9px] text-slate-600">108 Fleet</span>
          </div>
        )}
      </div>
    </aside>
  );
};

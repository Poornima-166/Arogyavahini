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
import { useLanguage } from '../../context/LanguageContext';

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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  incomingCount: number;
  hasActiveEmergency?: boolean;
  activeMission?: EmergencyRequest | null;
  activeEmergencyId?: number;
  selectedAmbulance?: Ambulance | null;
  selectedAmbulanceNumber?: string;
  unreadNotificationsCount: number;
  onLogout: () => void;
}

export const DriverSidebar: React.FC<DriverSidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed = false,
  onToggleCollapse = () => {},
  incomingCount,
  hasActiveEmergency = false,
  selectedAmbulance,
  selectedAmbulanceNumber,
  unreadNotificationsCount,
  onLogout,
}) => {
  const { t } = useLanguage();

  // DYNAMIC CONTEXTUAL NAVIGATION ORDER FOR DRIVER
  const navItems = hasActiveEmergency
    ? [
        {
          id: 'active' as DriverTab,
          label: `🚨 ${t.driverActive || 'Active Emergency'}`,
          icon: Heart,
          badge: {
            text: t.missionActive || 'MISSION ACTIVE',
            color: 'bg-red-600 text-white font-black animate-pulse',
          },
        },
        {
          id: 'navigation' as DriverTab,
          label: t.driverNavigation || 'GPS Route Navigation',
          icon: Navigation,
          badge: {
            text: t.turnByTurn || 'TURN-BY-TURN',
            color: 'bg-emerald-600 text-white font-black',
          },
        },
        {
          id: 'status' as DriverTab,
          label: t.driverStatus || 'Ambulance Status',
          icon: Truck,
          badge: {
            text: t.enRoute || 'EN ROUTE',
            color: 'bg-amber-500 text-slate-950 font-bold',
          },
        },
        {
          id: 'incoming' as DriverTab,
          label: t.driverIncoming || 'Incoming Requests',
          icon: BellRing,
          badge: incomingCount > 0 ? {
            text: String(incomingCount),
            color: 'bg-red-600 text-white animate-pulse',
          } : null,
        },
        {
          id: 'dashboard' as DriverTab,
          label: t.driverCockpit || 'Cockpit Overview',
          icon: Home,
          badge: null,
        },
        {
          id: 'notifications' as DriverTab,
          label: t.notifications || 'Notifications',
          icon: Bell,
          badge: unreadNotificationsCount > 0 ? {
            text: String(unreadNotificationsCount),
            color: 'bg-blue-600 text-white',
          } : null,
        },
        {
          id: 'history' as DriverTab,
          label: t.driverHistory || 'Dispatch History',
          icon: History,
          badge: null,
        },
        {
          id: 'profile' as DriverTab,
          label: t.driverProfile || 'Driver Profile',
          icon: User,
          badge: null,
        },
        {
          id: 'settings' as DriverTab,
          label: t.settings || 'Settings',
          icon: Settings,
          badge: null,
        },
      ]
    : [
        {
          id: 'dashboard' as DriverTab,
          label: t.dashboard || 'Dashboard',
          icon: Home,
          badge: null,
        },
        {
          id: 'incoming' as DriverTab,
          label: t.driverIncoming || 'Incoming Emergencies',
          icon: BellRing,
          badge: incomingCount > 0 ? {
            text: String(incomingCount),
            color: 'bg-red-600 text-white animate-pulse',
          } : null,
        },
        {
          id: 'active' as DriverTab,
          label: t.driverActive || 'Active Emergency',
          icon: Heart,
          badge: null,
        },
        {
          id: 'navigation' as DriverTab,
          label: t.driverNavigation || 'Navigation',
          icon: Navigation,
          badge: null,
        },
        {
          id: 'status' as DriverTab,
          label: t.driverStatus || 'Ambulance Status',
          icon: Truck,
          badge: null,
        },
        {
          id: 'notifications' as DriverTab,
          label: t.notifications || 'Notifications',
          icon: Bell,
          badge: unreadNotificationsCount > 0 ? {
            text: String(unreadNotificationsCount),
            color: 'bg-blue-600 text-white',
          } : null,
        },
        {
          id: 'history' as DriverTab,
          label: t.emergencyHistory || 'Emergency History',
          icon: History,
          badge: null,
        },
        {
          id: 'profile' as DriverTab,
          label: t.driverProfile || 'Driver Profile',
          icon: User,
          badge: null,
        },
        {
          id: 'settings' as DriverTab,
          label: t.settings || 'Settings',
          icon: Settings,
          badge: null,
        },
      ];

  const currentAmbulanceNo = selectedAmbulanceNumber || selectedAmbulance?.vehicle_number || 'Unit 108';

  return (
    <aside
      id="driver-portal-sidebar"
      className={`bg-slate-900 dark:bg-slate-950 text-white border-r border-slate-800 flex flex-col transition-all duration-300 select-none z-30 shrink-0 h-full ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 shrink-0 shadow-xs">
            <Truck className="w-5 h-5 text-slate-950" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wider uppercase text-amber-400">
                  {t.portalDriver || 'DRIVER'}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded border font-bold text-amber-400 bg-amber-500/20 border-amber-500/40">
                  {t.portalBadgeCockpit || 'COCKPIT'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-300 truncate">
                {currentAmbulanceNo}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? t.expandSidebar : t.collapseSidebar}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Prominent Action Banner for Driver (Active Mission Status or Quick Standby Indicator) */}
      <div className="mx-2 mt-3">
        {hasActiveEmergency ? (
          <button
            type="button"
            onClick={() => onSelectTab('navigation')}
            title={isCollapsed ? (t.missionActive || 'MISSION ACTIVE') : undefined}
            className="w-full p-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white flex items-center gap-2.5 shadow-md shadow-red-900/40 hover:brightness-110 active:scale-98 transition cursor-pointer"
          >
            <Radio className="w-4 h-4 animate-pulse shrink-0 text-white" />
            {!isCollapsed && (
              <div className="text-left min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider block text-white">
                  🚨 {t.missionActive || 'MISSION ACTIVE'}
                </span>
                <span className="text-xs font-bold truncate block text-amber-200">
                  {t.turnByTurn || 'Open Turn-By-Turn HUD'}
                </span>
              </div>
            )}
          </button>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            {!isCollapsed && (
              <div className="text-left min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-400">
                  🟢 {t.available || 'STANDBY READY'}
                </span>
                <span className="text-[11px] text-slate-400 truncate block">
                  {currentAmbulanceNo}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Links List */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto mt-1 custom-scrollbar">
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
          title={isCollapsed ? t.logout : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{t.logout}</span>}
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

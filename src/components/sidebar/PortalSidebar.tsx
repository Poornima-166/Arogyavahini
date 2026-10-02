import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  ShieldCheck 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    color: string;
  } | null;
  onClick?: () => void;
}

export interface PortalSidebarProps {
  portalId: string;
  portalTitle: string;
  portalBadge: string;
  portalSubtitle?: string;
  headerIcon: React.ComponentType<{ className?: string }>;
  themeColor: 'red' | 'blue' | 'amber' | 'emerald';
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  navItems: SidebarNavItem[];
  bannerAction?: {
    label: string;
    sublabel?: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'red' | 'amber' | 'blue';
  };
  onLogout: () => void;
  footerTag?: {
    system: string;
    subtext: string;
  };
}

export const PortalSidebar: React.FC<PortalSidebarProps> = ({
  portalId,
  portalTitle,
  portalBadge,
  portalSubtitle,
  headerIcon: HeaderIcon,
  themeColor,
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  navItems,
  bannerAction,
  onLogout,
  footerTag = { system: 'CAD v2.4 Live', subtext: '108 Network' },
}) => {
  const { t } = useLanguage();
  // Theme color styles
  const getThemeClasses = () => {
    switch (themeColor) {
      case 'red':
        return {
          iconBg: 'bg-red-600 text-white',
          badge: 'text-red-400 bg-red-500/20 border-red-500/40',
          title: 'text-red-400',
          activeNav: 'bg-red-600 text-white font-bold shadow-md shadow-red-600/25',
          activeIcon: 'text-white scale-110',
        };
      case 'blue':
        return {
          iconBg: 'bg-blue-600 text-white',
          badge: 'text-blue-400 bg-blue-500/20 border-blue-500/40',
          title: 'text-blue-400',
          activeNav: 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25',
          activeIcon: 'text-white scale-110',
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-600 text-white',
          badge: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
          title: 'text-emerald-400',
          activeNav: 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/25',
          activeIcon: 'text-white scale-110',
        };
      case 'amber':
      default:
        return {
          iconBg: 'bg-amber-500 text-slate-950',
          badge: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
          title: 'text-amber-400',
          activeNav: 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20',
          activeIcon: 'text-slate-950 scale-110',
        };
    }
  };

  const themeStyles = getThemeClasses();

  return (
    <aside
      id={`${portalId}-sidebar`}
      className={`bg-slate-900 dark:bg-slate-950 text-white border-r border-slate-800 flex flex-col transition-all duration-300 select-none z-30 shrink-0 h-full ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shrink-0 shadow-xs ${themeStyles.iconBg}`}>
            <HeaderIcon className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-black tracking-wider uppercase ${themeStyles.title}`}>
                  {portalTitle}
                </span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-bold ${themeStyles.badge}`}>
                  {portalBadge}
                </span>
              </div>
              {portalSubtitle && (
                <p className="text-xs font-semibold text-slate-300 truncate">
                  {portalSubtitle}
                </p>
              )}
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

      {/* Prominent Action Banner (e.g. SOS Trigger or Mission Alert) */}
      {bannerAction && (
        <button
          type="button"
          onClick={bannerAction.onClick}
          title={isCollapsed ? bannerAction.label : undefined}
          className={`mx-2 mt-3 p-2.5 rounded-xl text-white flex items-center gap-2.5 shadow-md hover:brightness-110 active:scale-98 transition cursor-pointer ${
            bannerAction.variant === 'blue'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-900/40'
              : bannerAction.variant === 'amber'
              ? 'bg-gradient-to-r from-red-600 to-amber-600 shadow-amber-900/40'
              : 'bg-gradient-to-r from-red-600 to-rose-600 shadow-red-900/40'
          }`}
        >
          <bannerAction.icon className="w-4 h-4 animate-pulse shrink-0" />
          {!isCollapsed && (
            <div className="text-left min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider block">
                {bannerAction.label}
              </span>
              {bannerAction.sublabel && (
                <span className="text-xs font-bold truncate block opacity-90">
                  {bannerAction.sublabel}
                </span>
              )}
            </div>
          )}
        </button>
      )}

      {/* Navigation Links List */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto mt-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`${portalId}-nav-${item.id}`}
              type="button"
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else {
                  onSelectTab(item.id);
                }
              }}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                isActive
                  ? themeStyles.activeNav
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? themeStyles.activeIcon : 'text-slate-400 group-hover:text-white'
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
              {footerTag.system}
            </span>
            <span className="font-mono text-[9px] text-slate-600">{footerTag.subtext}</span>
          </div>
        )}
      </div>
    </aside>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { AppNotification } from '../types';
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  Flame,
  Truck,
  CheckCircle2,
  Radio,
  MapPin,
  ShieldCheck,
  UserPlus,
  Info,
  X,
  Clock,
  Filter,
  Check,
} from 'lucide-react';

interface NotificationBellProps {
  onOpenEmergency?: (emergencyId: number) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onOpenEmergency }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();
  const { t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const [showAllModal, setShowAllModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalTypeFilter, setModalTypeFilter] = useState('ALL');

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EMERGENCY_CREATED':
      case 'NEW_EMERGENCY_BROADCAST':
      case 'ADMIN_EMERGENCY_ALERT':
        return <Flame className="w-4 h-4 text-red-500" />;
      case 'DRIVER_ACCEPTED':
      case 'DRIVER_ACCEPTED_CONFIRMATION':
      case 'ADMIN_EMERGENCY_ASSIGNED':
        return <Truck className="w-4 h-4 text-amber-500" />;
      case 'ON_THE_WAY':
      case 'ADMIN_STATUS_UPDATE':
        return <Radio className="w-4 h-4 text-blue-500" />;
      case 'REACHED':
        return <MapPin className="w-4 h-4 text-purple-500" />;
      case 'EMERGENCY_COMPLETED':
      case 'MISSION_COMPLETED':
      case 'ADMIN_EMERGENCY_COMPLETED':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'ADMIN_USER_REGISTERED':
      case 'USER_WELCOME':
        return <UserPlus className="w-4 h-4 text-cyan-500" />;
      case 'EMERGENCY_CANCELLED':
      case 'ADMIN_EMERGENCY_CANCELLED':
      case 'EMERGENCY_CLAIMED_BY_OTHER':
        return <Info className="w-4 h-4 text-slate-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSecs < 30) return t.notificationTimeJustNow;
      if (diffSecs < 60) return `${diffSecs}s ago`;
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return dateStr;
    }
  };

  const displayedNotifications = notifications.filter((n) => {
    if (filterMode === 'unread') return !n.is_read;
    return true;
  });

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.is_read) {
      markAsRead(n.id);
    }
    if (n.emergency_request_id && onOpenEmergency) {
      onOpenEmergency(n.emergency_request_id);
      setIsOpen(false);
      setShowAllModal(false);
    }
  };

  const filteredModalNotifications = notifications.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(modalSearch.toLowerCase()) ||
      n.message.toLowerCase().includes(modalSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (modalTypeFilter === 'UNREAD') return !n.is_read;
    if (modalTypeFilter === 'EMERGENCY')
      return (
        n.notification_type.includes('EMERGENCY') ||
        n.notification_type.includes('DRIVER') ||
        n.notification_type.includes('WAY') ||
        n.notification_type.includes('REACHED')
      );
    if (modalTypeFilter === 'SYSTEM')
      return n.notification_type.includes('USER') || n.notification_type.includes('SYSTEM');
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        title={t.notificationsTitle}
        className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-hidden"
        aria-label="View notifications"
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          id="notification-dropdown-panel"
          className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[520px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {t.notificationsTitle}
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-[10px] font-bold">
                  {unreadCount} {t.notificationsUnreadBadge}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title={t.notificationsMarkAllRead}
                  className="p-1 rounded-md text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">{t.notificationsMarkAllRead}</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 bg-white dark:bg-slate-900">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.all} ({notifications.length})
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterMode === 'unread'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.notificationsUnreadBadge} ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto max-h-[320px] divide-y divide-slate-100 dark:divide-slate-800">
            {displayedNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.notificationsEmpty}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-[200px] mx-auto">
                  {t.notificationsEmptyDesc}
                </p>
              </div>
            ) : (
              displayedNotifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-3 group relative ${
                    n.is_read
                      ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      : 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/40'
                  }`}
                >
                  {/* Icon Indicator */}
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getNotificationIcon(n.notification_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs truncate ${
                          n.is_read
                            ? 'font-medium text-slate-700 dark:text-slate-300'
                            : 'font-bold text-slate-900 dark:text-white'
                        }`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>

                    {n.emergency_request_id && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                        <span>{t.notificationViewEmergency} #{n.emergency_request_id}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons & Read Dot */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      title="Delete notification"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowAllModal(true);
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 px-1 py-0.5"
            >
              <span>{t.notificationsViewAll}</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors"
              >
                {t.notificationsClearAll}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Full "View All Notifications" Modal */}
      {showAllModal && (
        <div
          id="all-notifications-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-600 text-white">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t.notificationsTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chronological activity ledger & emergency alert stream ({notifications.length} total)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAllModal(false)}
                className="p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Controls: Search & Category Filter */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {['ALL', 'UNREAD', 'EMERGENCY', 'SYSTEM'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setModalTypeFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      modalTypeFilter === cat
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1 hover:bg-blue-100 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{t.notificationsMarkAllRead}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body: Full List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredModalNotifications.length === 0 ? (
                <div className="py-16 text-center">
                  <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No matching notifications found
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Try adjusting your search query or filter category.
                  </p>
                </div>
              ) : (
                filteredModalNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                      n.is_read
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-xs'
                    }`}
                  >
                    <div className="mt-0.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getNotificationIcon(n.notification_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm ${
                              n.is_read
                                ? 'font-semibold text-slate-800 dark:text-slate-200'
                                : 'font-bold text-slate-900 dark:text-white'
                            }`}
                          >
                            {n.title}
                          </h4>
                          {!n.is_read && (
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                              {t.notificationNew}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {n.message}
                      </p>

                      {n.emergency_request_id && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                          <span>{t.notificationViewEmergency} #{n.emergency_request_id}</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 self-center">
                      {!n.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                          title="Mark as read"
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                        title="Delete notification"
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {unreadCount} unread / {notifications.length} total alerts
              </span>

              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    {t.notificationsClearAll}
                  </button>
                )}
                <button
                  onClick={() => setShowAllModal(false)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { 
  Home, 
  AlertOctagon, 
  Truck, 
  Heart, 
  Building2, 
  History, 
  ShieldAlert, 
  Bell, 
  Settings, 
  Radio
} from 'lucide-react';
import { PortalSidebar, SidebarNavItem } from '../sidebar/PortalSidebar';
import { EmergencyRequest } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

export type PatientTab = 
  | 'dashboard'
  | 'emergency-info'
  | 'status'
  | 'tracking'
  | 'hospitals'
  | 'notifications'
  | 'history'
  | 'profile'
  | 'firstaid'
  | 'settings'
  | 'sos';

interface PatientSidebarProps {
  activeTab: PatientTab;
  onSelectTab: (tab: PatientTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userName?: string;
  hasActiveEmergency: boolean;
  activeEmergency?: EmergencyRequest | null;
  unreadNotificationsCount: number;
  onOpenSos: () => void;
  onOpenMedicalProfileModal: () => void;
  onLogout: () => void;
}

export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  userName = 'Patient User',
  hasActiveEmergency,
  activeEmergency,
  unreadNotificationsCount,
  onOpenSos,
  onOpenMedicalProfileModal,
  onLogout,
}) => {
  const { t } = useLanguage();

  // DYNAMIC CONTEXTUAL NAVIGATION ORDER
  // Emergency operations are prioritized at top; Medical Profile is placed lower after Emergency History as supporting medical information
  const navItems: SidebarNavItem[] = hasActiveEmergency
    ? [
        {
          id: 'dashboard',
          label: t.dashboard || 'Dashboard',
          icon: Home,
          badge: null,
          onClick: () => {
            onSelectTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
        },
        {
          id: 'emergency-info',
          label: `🚨 ${t.activeEmergency || 'Active Emergency'}`,
          icon: AlertOctagon,
          badge: {
            text: t.activeSos || 'ACTIVE SOS',
            color: 'bg-red-600 text-white font-black animate-pulse',
          },
          onClick: () => {
            onSelectTab('emergency-info');
            const el = document.getElementById('active-emergency-status-card');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'tracking',
          label: t.ambulanceTracking || 'Ambulance Tracking',
          icon: Truck,
          badge: {
            text: 'LIVE GPS',
            color: 'bg-emerald-500 text-slate-950 font-black',
          },
          onClick: () => {
            onSelectTab('tracking');
            const el = document.getElementById('active-emergency-status-card');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'hospitals',
          label: t.hospitalsFleetRadar || 'Hospitals & Fleet Radar',
          icon: Building2,
          badge: activeEmergency?.hospital_destination ? {
            text: t.assigned || 'ASSIGNED',
            color: 'bg-blue-600 text-white',
          } : null,
          onClick: () => {
            onSelectTab('hospitals');
            const el = document.getElementById('patient-live-radar-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'notifications',
          label: t.notifications || 'Notifications',
          icon: Bell,
          badge: unreadNotificationsCount > 0
            ? {
                text: String(unreadNotificationsCount),
                color: 'bg-blue-600 text-white',
              }
            : null,
          onClick: () => {
            onSelectTab('notifications');
          },
        },
        {
          id: 'history',
          label: t.emergencyHistory || 'Emergency History',
          icon: History,
          badge: null,
          onClick: () => {
            onSelectTab('history');
            const el = document.getElementById('patient-requests-history');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'profile',
          label: t.medicalProfile || 'Medical Profile',
          icon: Heart,
          badge: {
            text: t.erShared || 'ER SHARED',
            color: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold',
          },
          onClick: () => {
            onSelectTab('profile');
            const el = document.getElementById('patient-profile-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'firstaid',
          label: t.firstAidGuides || 'First Aid Guides',
          icon: ShieldAlert,
          badge: null,
          onClick: () => {
            onSelectTab('firstaid');
            const el = document.getElementById('patient-first-aid-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'settings',
          label: t.settings || 'Settings',
          icon: Settings,
          badge: null,
          onClick: () => {
            onSelectTab('settings');
            onOpenMedicalProfileModal();
          },
        },
      ]
    : [
        {
          id: 'dashboard',
          label: t.dashboard || 'Dashboard',
          icon: Home,
          badge: null,
          onClick: () => {
            onSelectTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
        },
        {
          id: 'emergency-info',
          label: t.emergencyInformation || 'Emergency Information',
          icon: AlertOctagon,
          badge: null,
          onClick: () => {
            onSelectTab('emergency-info');
            const el = document.getElementById('active-emergency-status-card') || document.getElementById('patient-emergency-sos');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'tracking',
          label: t.ambulanceTracking || 'Ambulance Tracking',
          icon: Truck,
          badge: null,
          onClick: () => {
            onSelectTab('tracking');
            const el = document.getElementById('patient-live-radar-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'hospitals',
          label: t.hospitalsFleetRadar || 'Hospitals & Fleet Radar',
          icon: Building2,
          badge: null,
          onClick: () => {
            onSelectTab('hospitals');
            const el = document.getElementById('patient-live-radar-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'notifications',
          label: t.notifications || 'Notifications',
          icon: Bell,
          badge: unreadNotificationsCount > 0
            ? {
                text: String(unreadNotificationsCount),
                color: 'bg-blue-600 text-white',
              }
            : null,
          onClick: () => {
            onSelectTab('notifications');
          },
        },
        {
          id: 'history',
          label: t.emergencyHistory || 'Emergency History',
          icon: History,
          badge: null,
          onClick: () => {
            onSelectTab('history');
            const el = document.getElementById('patient-requests-history');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'profile',
          label: t.medicalProfile || 'Medical Profile',
          icon: Heart,
          badge: null,
          onClick: () => {
            onSelectTab('profile');
            const el = document.getElementById('patient-profile-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'firstaid',
          label: t.firstAidGuides || 'First Aid Guides',
          icon: ShieldAlert,
          badge: null,
          onClick: () => {
            onSelectTab('firstaid');
            const el = document.getElementById('patient-first-aid-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'settings',
          label: t.settings || 'Settings',
          icon: Settings,
          badge: null,
          onClick: () => {
            onSelectTab('settings');
            onOpenMedicalProfileModal();
          },
        },
      ];

  return (
    <PortalSidebar
      portalId="patient-portal"
      portalTitle={t.portalPatient || 'PATIENT'}
      portalBadge={t.portalBadgePortal || 'PORTAL'}
      portalSubtitle={userName}
      headerIcon={Heart}
      themeColor="red"
      activeTab={activeTab}
      onSelectTab={(tabId) => onSelectTab(tabId as PatientTab)}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      navItems={navItems}
      bannerAction={{
        label: hasActiveEmergency ? (t.activeSosInProgress || '🚨 ACTIVE SOS IN PROGRESS') : (t.triggerEmergencySos || 'TRIGGER EMERGENCY SOS'),
        sublabel: hasActiveEmergency
          ? t('dispatchedTrackingSub', { id: activeEmergency?.id || '' })
          : (t.instant108DispatchSub || 'Instant 108 Dispatch (⌘⇧S)'),
        icon: AlertOctagon,
        onClick: hasActiveEmergency ? () => onSelectTab('tracking') : onOpenSos,
        variant: 'red',
      }}
      onLogout={onLogout}
      footerTag={{
        system: `${t.portalCitizen || 'Citizen'} SOS v2.4`,
        subtext: t.gpsActive || 'GPS Active',
      }}
    />
  );
};

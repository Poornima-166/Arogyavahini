import React from 'react';
import { 
  Activity, 
  Flame, 
  Heart, 
  Truck, 
  MapPin, 
  Building2, 
  Zap, 
  Users, 
  FileText, 
  Bell, 
  Settings, 
  ShieldCheck,
  Radio,
  Clock,
  User,
  AlertOctagon
} from 'lucide-react';
import { PortalSidebar, SidebarNavItem } from '../sidebar/PortalSidebar';
import { useLanguage } from '../../context/LanguageContext';

export type HospitalTab = 
  | 'dashboard'
  | 'emergencies'
  | 'trauma'
  | 'patient-info'
  | 'ambulances'
  | 'fleet-map'
  | 'wards'
  | 'traffic'
  | 'personnel'
  | 'reports'
  | 'history'
  | 'notifications'
  | 'profile'
  | 'settings';

interface HospitalSidebarProps {
  activeTab: HospitalTab;
  onSelectTab: (tab: HospitalTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hospitalName?: string;
  activeEmergenciesCount: number;
  availableAmbulancesCount: number;
  wardDiversionCount: number;
  unreadNotificationsCount: number;
  onOpenSettingsModal: () => void;
  onOpenProfileModal?: () => void;
  onLogout: () => void;
}

export const HospitalSidebar: React.FC<HospitalSidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  hospitalName = 'Command Center',
  activeEmergenciesCount,
  availableAmbulancesCount,
  wardDiversionCount,
  unreadNotificationsCount,
  onOpenSettingsModal,
  onOpenProfileModal,
  onLogout,
}) => {
  const { t } = useLanguage();
  const hasActiveEmergencies = activeEmergenciesCount > 0;

  // DYNAMIC CONTEXTUAL NAVIGATION ORDER
  // When active incoming emergencies exist, prioritize incoming patient details and bed preparation
  const navItems: SidebarNavItem[] = hasActiveEmergencies
    ? [
        {
          id: 'emergencies',
          label: `🚨 ${t.hospitalIncomingEmergencies || 'Incoming Emergencies'}`,
          icon: Flame,
          badge: {
            text: `${activeEmergenciesCount} ACTIVE`,
            color: 'bg-red-600 text-white font-black animate-pulse',
          },
          onClick: () => {
            onSelectTab('emergencies');
            const el = document.getElementById('admin-emergency-feed');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'patient-info',
          label: t.hospitalPatientInfo || 'Patient Information & e-PCR',
          icon: Heart,
          badge: {
            text: 'CRITICAL',
            color: 'bg-red-600 text-white font-bold animate-pulse',
          },
          onClick: () => {
            onSelectTab('patient-info');
            const el = document.getElementById('admin-er-trauma-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'fleet-map',
          label: t.ambulanceTracking || 'Ambulance ETA & Tracking',
          icon: MapPin,
          badge: {
            text: t.enRoute || 'EN ROUTE',
            color: 'bg-amber-500 text-slate-950 font-bold',
          },
          onClick: () => {
            onSelectTab('fleet-map');
            const el = document.getElementById('admin-fleet-map-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'trauma',
          label: t.emergencyInformation || 'Emergency Details & Triage',
          icon: AlertOctagon,
          badge: {
            text: 'DISPATCH',
            color: 'bg-red-600 text-white font-bold',
          },
          onClick: () => {
            onSelectTab('trauma');
            const el = document.getElementById('admin-er-trauma-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'wards',
          label: t.hospitalWards || 'Hospital Capacity / Beds',
          icon: Building2,
          badge: wardDiversionCount > 0
            ? {
                text: `${wardDiversionCount} Full`,
                color: 'bg-amber-500 text-slate-950 font-black',
              }
            : {
                text: t.bedsReady || 'BEDS READY',
                color: 'bg-emerald-600 text-white font-bold',
              },
          onClick: () => {
            onSelectTab('wards');
            const el = document.getElementById('admin-hospitals-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'ambulances',
          label: t.navAmbulances || 'Preparation & Fleet',
          icon: Truck,
          badge: availableAmbulancesCount > 0
            ? {
                text: `${availableAmbulancesCount} Ready`,
                color: 'bg-emerald-950 text-emerald-300 border border-emerald-800',
              }
            : null,
          onClick: () => {
            onSelectTab('ambulances');
            const el = document.getElementById('admin-fleet-section');
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
          id: 'dashboard',
          label: t.dashboard || 'Dashboard',
          icon: Activity,
          badge: null,
          onClick: () => {
            onSelectTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
        },
        {
          id: 'traffic',
          label: t.hospitalTraffic || 'Traffic Signal Priority',
          icon: Zap,
          badge: {
            text: 'IoT',
            color: 'bg-blue-600 text-white',
          },
          onClick: () => {
            onSelectTab('traffic');
            const el = document.getElementById('admin-traffic-signals-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'history',
          label: t.emergencyHistory || 'Emergency History',
          icon: Clock,
          badge: null,
          onClick: () => {
            onSelectTab('history');
            const el = document.getElementById('admin-emergency-feed');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'reports',
          label: t.hospitalReports || 'Reports & Master Ledger',
          icon: FileText,
          badge: null,
          onClick: () => {
            onSelectTab('reports');
            const el = document.getElementById('admin-reports-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'personnel',
          label: t.hospitalPersonnel || 'Medical Personnel',
          icon: Users,
          badge: null,
          onClick: () => {
            onSelectTab('personnel');
            const el = document.getElementById('admin-users-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'profile',
          label: t.navProfile || 'Hospital Profile',
          icon: User,
          badge: null,
          onClick: () => {
            onSelectTab('profile');
            if (onOpenProfileModal) onOpenProfileModal();
          },
        },
        {
          id: 'settings',
          label: t.settings || 'Settings',
          icon: Settings,
          onClick: () => {
            onSelectTab('settings');
            onOpenSettingsModal();
          },
          badge: null,
        },
      ]
    : [
        {
          id: 'dashboard',
          label: t.dashboard || 'Dashboard',
          icon: Activity,
          badge: null,
          onClick: () => {
            onSelectTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
        },
        {
          id: 'emergencies',
          label: t.hospitalIncomingEmergencies || 'Incoming Emergencies',
          icon: Flame,
          badge: null,
          onClick: () => {
            onSelectTab('emergencies');
            const el = document.getElementById('admin-emergency-feed');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'trauma',
          label: t.emergencyInformation || 'ER & Trauma Center',
          icon: AlertOctagon,
          badge: null,
          onClick: () => {
            onSelectTab('trauma');
            const el = document.getElementById('admin-er-trauma-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'patient-info',
          label: t.hospitalPatientInfo || 'Patient e-PCR Records',
          icon: Heart,
          badge: null,
          onClick: () => {
            onSelectTab('patient-info');
            const el = document.getElementById('admin-er-trauma-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'fleet-map',
          label: t.hospitalFleetRadar || 'Fleet Radar & Live Map',
          icon: MapPin,
          badge: null,
          onClick: () => {
            onSelectTab('fleet-map');
            const el = document.getElementById('admin-fleet-map-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'wards',
          label: t.hospitalWards || 'Ward Beds & Capacity',
          icon: Building2,
          badge: wardDiversionCount > 0
            ? {
                text: `${wardDiversionCount} Full`,
                color: 'bg-amber-500 text-slate-950 font-black',
              }
            : null,
          onClick: () => {
            onSelectTab('wards');
            const el = document.getElementById('admin-hospitals-section');
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
          icon: Clock,
          badge: null,
          onClick: () => {
            onSelectTab('history');
            const el = document.getElementById('admin-emergency-feed');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'reports',
          label: t.hospitalReports || 'Master Ledger & Reports',
          icon: FileText,
          badge: null,
          onClick: () => {
            onSelectTab('reports');
            const el = document.getElementById('admin-reports-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'ambulances',
          label: t.navAmbulances || 'Ambulance Fleet',
          icon: Truck,
          badge: availableAmbulancesCount > 0
            ? {
                text: `${availableAmbulancesCount} Ready`,
                color: 'bg-emerald-950 text-emerald-300 border border-emerald-800',
              }
            : null,
          onClick: () => {
            onSelectTab('ambulances');
            const el = document.getElementById('admin-fleet-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'traffic',
          label: t.hospitalTraffic || 'Traffic Signal Priority',
          icon: Zap,
          badge: {
            text: 'IoT',
            color: 'bg-blue-600 text-white',
          },
          onClick: () => {
            onSelectTab('traffic');
            const el = document.getElementById('admin-traffic-signals-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        },
        {
          id: 'profile',
          label: t.navProfile || 'Hospital Profile',
          icon: User,
          badge: null,
          onClick: () => {
            onSelectTab('profile');
            if (onOpenProfileModal) onOpenProfileModal();
          },
        },
        {
          id: 'settings',
          label: t.settings || 'Settings',
          icon: Settings,
          onClick: () => {
            onSelectTab('settings');
            onOpenSettingsModal();
          },
          badge: null,
        },
      ];

  return (
    <PortalSidebar
      portalId="hospital-portal"
      portalTitle={t.portalHospital || 'HOSPITAL'}
      portalBadge={t.portalBadgeCommand || 'COMMAND'}
      portalSubtitle={hospitalName}
      headerIcon={ShieldCheck}
      themeColor="blue"
      activeTab={activeTab}
      onSelectTab={(tabId) => onSelectTab(tabId as HospitalTab)}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      navItems={navItems}
      bannerAction={{
        label: hasActiveEmergencies
          ? `🚨 ${activeEmergenciesCount} INCOMING PATIENT${activeEmergenciesCount > 1 ? 'S' : ''}`
          : (t.criticalTraumaAdmission || 'ER TRAUMA MONITOR'),
        sublabel: hasActiveEmergencies
          ? (t.liveInTransitVitals || 'Live In-Transit Vitals • Tap to Prepare')
          : (t.telemetryStandbyActive || 'Telemetry Standby Active'),
        icon: Heart,
        onClick: () => onSelectTab('trauma'),
        variant: hasActiveEmergencies ? 'red' : 'blue',
      }}
      onLogout={onLogout}
      footerTag={{
        system: `${t.portalHospital || 'Hospital'} CAD v2.4`,
        subtext: t.opsRoom || 'Ops Room',
      }}
    />
  );
};

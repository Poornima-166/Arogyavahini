export type Language = 'en' | 'kn' | 'hi';

export interface TranslationDictionary {
  // Navigation & Header
  appTitle: string;
  appSubtitle: string;
  appSubtitlePatient: string;
  appSubtitleDriver: string;
  appSubtitleAdmin: string;
  hotlineLabel: string;
  soundMute: string;
  soundUnmute: string;
  themeLight: string;
  themeDark: string;
  languageSelect: string;
  roleLabel: string;
  logout: string;
  signInRegister: string;
  
  // Roles
  rolePatient: string;
  roleDriver: string;
  roleAdmin: string;

  // Nav Items - Driver
  navDriverDashboard: string;
  navIncomingRequests: string;
  navActiveEmergency: string;
  navAmbulanceStatus: string;
  navProfile: string;

  // Nav Items - Patient
  navPatientDashboard: string;
  navEmergencySOS: string;
  navMyRequests: string;
  navAmbulanceTracking: string;

  // Nav Items - Admin
  navAdminDashboard: string;
  navEmergencyRequests: string;
  navAmbulances: string;
  navDrivers: string;
  navUsers: string;
  navReports: string;

  // Common UI
  loading: string;
  cancel: string;
  submit: string;
  save: string;
  close: string;
  confirm: string;
  phone: string;
  location: string;
  status: string;
  type: string;
  actions: string;
  notes: string;
  search: string;
  filter: string;
  all: string;
  active: string;
  completed: string;
  cancelled: string;
  available: string;
  busy: string;
  assigned: string;
  maintenance: string;
  viewDetails: string;
  time: string;
  patientName: string;
  driverName: string;
  vehicleNumber: string;
  emergencyType: string;
  ambulanceType: string;
  baseLocation: string;
  activeEmergencies: string;
  availableAmbulances: string;
  completedTrips: string;

  // Stepper / Statuses
  statusWaitingForDriver: string;
  statusWaitingDesc: string;
  statusDriverAccepted: string;
  statusDriverAcceptedDesc: string;
  statusOnTheWay: string;
  statusOnTheWayDesc: string;
  statusReached: string;
  statusReachedDesc: string;
  statusCompleted: string;
  statusCompletedDesc: string;
  statusCancelled: string;
  statusCancelledDesc: string;
  statusEnRoute: string;
  statusAtScene: string;
  statusAvailable: string;

  // Home Hero
  heroBadge: string;
  heroSubBadge: string;
  heroTitle: string;
  heroTitleGradient: string;
  heroSubtitle: string;
  heroTriggerSOS: string;
  heroOpenAdmin: string;
  heroStatAmbulances: string;
  heroStatReady: string;
  heroStatEmergencies: string;
  heroStatResponseTime: string;
  heroPortalsTitle: string;
  heroPortalsSubtitle: string;

  // Portal Cards
  portalPatientTitle: string;
  portalPatientDesc: string;
  portalPatientF1: string;
  portalPatientF2: string;
  portalPatientF3: string;
  portalPatientBtn: string;

  portalDriverTitle: string;
  portalDriverDesc: string;
  portalDriverF1: string;
  portalDriverF2: string;
  portalDriverF3: string;
  portalDriverBtn: string;

  portalAdminTitle: string;
  portalAdminDesc: string;
  portalAdminF1: string;
  portalAdminF2: string;
  portalAdminF3: string;
  portalAdminBtn: string;

  // Architecture section
  pipelineTitle: string;
  pipelineSubtitle: string;
  pipelineDesc: string;
  pipelineStep1Title: string;
  pipelineStep1Desc: string;
  pipelineStep2Title: string;
  pipelineStep2Desc: string;
  pipelineStep3Title: string;
  pipelineStep3Desc: string;
  pipelineStep4Title: string;
  pipelineStep4Desc: string;
  networkBadge1: string;
  networkBadge2: string;
  networkBadge3: string;

  // Patient Dashboard
  patientPortalTitle: string;
  patientPortalBadge: string;
  patientWelcome: string;
  patientLoggedInAs: string;
  patientMedicalId: string;
  patientRegisteredPhone: string;
  patientActiveAlertTitle: string;
  patientActiveAlertDesc: string;
  patientAssignedAmbulance: string;
  patientDriverContact: string;
  patientAmbulanceType: string;
  patientBaseLocation: string;
  patientCancelSOS: string;
  patientCancelConfirm: string;
  patientTriggerTitle: string;
  patientTriggerDesc: string;
  patientInstantSOSBtn: string;
  patientEmergencyDetails: string;
  patientSelectEmergencyType: string;
  patientLocationPlaceholder: string;
  patientUseCurrentLocation: string;
  patientPhonePlaceholder: string;
  patientNotesPlaceholder: string;
  patientDispatchBtn: string;
  patientFirstAidTitle: string;
  patientFirstAidSubtitle: string;
  patientHistoryTitle: string;
  patientNoHistory: string;

  // Driver Dashboard
  driverPortalTitle: string;
  driverPortalBadge: string;
  driverBadge: string;
  driverAssignedUnit: string;
  driverAvailabilityStatus: string;
  driverSetAvailable: string;
  driverSetMaintenance: string;
  driverSwitchVehicle: string;
  driverIncomingTitle: string;
  driverIncomingSubtitle: string;
  driverIncomingAlerts: string;
  driverIncomingDesc: string;
  driverNoIncoming: string;
  driverAcceptBtn: string;
  driverAcceptRequest: string;
  driverAcceptSuccess: string;
  driverActiveMissionTitle: string;
  driverActiveMissionBadge: string;
  driverPatientDetails: string;
  driverIncidentLocation: string;
  driverEmergencyNature: string;
  driverCallPatient: string;
  driverActionStartJourney: string;
  driverStartJourney: string;
  driverActionArrived: string;
  driverMarkReached: string;
  driverActionComplete: string;
  driverCompleteTrip: string;
  driverReadyStandby: string;
  driverStandby: string;
  driverStandbyDesc: string;
  driverVehicleSpecs: string;
  driverMissionHistory: string;
  driverCompletedMissions: string;

  // Admin Dashboard
  adminPortalTitle: string;
  adminPortalBadge: string;
  adminConsoleBadge: string;
  adminSubtitle: string;
  adminResetData: string;
  adminResetSystem: string;
  adminAddAmbulance: string;
  adminTotalCalls: string;
  adminActiveCallsDesc: string;
  adminReadyFleetDesc: string;
  adminMetricTotalCalls: string;
  adminMetricActive: string;
  adminMetricAvailable: string;
  adminMetricAvgTime: string;
  adminFleetTitle: string;
  adminFleetSubtitle: string;
  adminFleetDesc: string;
  adminLedgerTitle: string;
  adminLedgerSubtitle: string;
  adminMasterLedgerTitle: string;
  adminMasterLedgerDesc: string;
  adminFilterAll: string;
  adminFilterActive: string;
  adminFilterCompleted: string;
  adminFilterCancelled: string;
  adminUsersTitle: string;
  adminUsersSubtitle: string;
  adminUsersDesc: string;

  // Auth Modal
  authSignInTitle: string;
  authRegisterTitle: string;
  authSubtitle: string;
  authQuickDemo: string;
  authFullName: string;
  authEmail: string;
  authPassword: string;
  authSelectRole: string;
  authSignInBtn: string;
  authRegisterBtn: string;
  authNoAccount: string;
  authHaveAccount: string;
  authCreateOne: string;

  // Footer
  footerNetwork: string;
  footerDesc: string;
  footerTollFree: string;
  footerEmergencyHotline: string;
  footerRights: string;
  footerCertified: string;

  // Notifications
  notificationsTitle: string;
  notificationsEmpty: string;
  notificationsEmptyDesc: string;
  notificationsMarkAllRead: string;
  notificationsClearAll: string;
  notificationsViewAll: string;
  notificationsClose: string;
  notificationsUnreadBadge: string;
  notificationNew: string;
  notificationTimeJustNow: string;
  notificationViewEmergency: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appTitle: 'Arogyavahini',
    appSubtitle: 'Emergency Medical Response & Ambulance Dispatch System',
    appSubtitlePatient: 'Emergency Response Network',
    appSubtitleDriver: 'Ambulance Crew Dispatch',
    appSubtitleAdmin: 'Hospital Command Center',
    hotlineLabel: '24/7 Emergency Dispatch Hotline:',
    soundMute: 'Mute Siren Audio',
    soundUnmute: 'Unmute Siren Audio',
    themeLight: 'Switch to Light Mode',
    themeDark: 'Switch to Dark Mode',
    languageSelect: 'Select Language',
    roleLabel: 'ROLE:',
    logout: 'Logout',
    signInRegister: 'Sign In / Register',

    rolePatient: 'PATIENT',
    roleDriver: 'DRIVER',
    roleAdmin: 'ADMIN',

    navDriverDashboard: 'Driver Dashboard',
    navIncomingRequests: 'Incoming Requests',
    navActiveEmergency: 'Active Emergency',
    navAmbulanceStatus: 'Ambulance Status',
    navProfile: 'Profile',

    navPatientDashboard: 'Dashboard',
    navEmergencySOS: 'Emergency SOS',
    navMyRequests: 'My Requests',
    navAmbulanceTracking: 'Ambulance Tracking',

    navAdminDashboard: 'Dashboard',
    navEmergencyRequests: 'Emergency Requests',
    navAmbulances: 'Ambulances',
    navDrivers: 'Drivers',
    navUsers: 'Users',
    navReports: 'Reports',

    loading: 'Loading...',
    cancel: 'Cancel',
    submit: 'Submit',
    save: 'Save',
    close: 'Close',
    confirm: 'Confirm',
    phone: 'Phone',
    location: 'Location',
    status: 'Status',
    type: 'Type',
    actions: 'Actions',
    notes: 'Notes',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    available: 'AVAILABLE',
    busy: 'BUSY',
    assigned: 'ASSIGNED',
    maintenance: 'MAINTENANCE',
    viewDetails: 'View Details',
    time: 'Time',
    patientName: 'Patient Name',
    driverName: 'Driver Name',
    vehicleNumber: 'Vehicle Number',
    emergencyType: 'Emergency Type',
    ambulanceType: 'Ambulance Type',
    baseLocation: 'Base Location',
    activeEmergencies: 'Active Emergencies',
    availableAmbulances: 'Available Ambulances',
    completedTrips: 'Completed Missions',

    statusWaitingForDriver: 'SOS Broadcast',
    statusWaitingDesc: 'Waiting for available crew to accept',
    statusDriverAccepted: 'Driver Accepted',
    statusDriverAcceptedDesc: 'Ambulance assigned & confirmed',
    statusOnTheWay: 'On The Way',
    statusOnTheWayDesc: 'En route with priority sirens active',
    statusReached: 'Crew Reached',
    statusReachedDesc: 'First responders at incident scene',
    statusCompleted: 'Hospital Admission',
    statusCompletedDesc: 'Handover complete at trauma center',
    statusCancelled: 'Emergency Cancelled',
    statusCancelledDesc: 'Request closed by user or dispatch',
    statusEnRoute: 'En Route',
    statusAtScene: 'At Scene',
    statusAvailable: 'Available',

    heroBadge: 'Emergency Medical Response Network',
    heroSubBadge: '24/7 Rapid Response Dispatch',
    heroTitle: 'Smart Integrated Emergency',
    heroTitleGradient: 'Medical Response System',
    heroSubtitle: 'A unified emergency medical network connecting patients in crisis with the nearest available life-support ambulances, hospital trauma wards, and dispatch controllers.',
    heroTriggerSOS: 'TRIGGER EMERGENCY SOS',
    heroOpenAdmin: 'Open Admin Command Center',
    heroStatAmbulances: 'Active Ambulances',
    heroStatReady: 'Ready for Dispatch',
    heroStatEmergencies: 'Live Emergencies',
    heroStatResponseTime: 'Avg. Response Time',
    heroPortalsTitle: 'Dedicated Stakeholder Portals',
    heroPortalsSubtitle: 'Select a portal below to access role-specific workflows and live dispatch operations',

    portalPatientTitle: 'Patient Portal',
    portalPatientDesc: 'One-tap Emergency SOS dispatch with automated ambulance pairing, live GPS status progression, driver contact card, and first-aid instructions.',
    portalPatientF1: 'Instant SOS Emergency Button',
    portalPatientF2: 'Real-time Stepper (Requested → Reached)',
    portalPatientF3: 'Assigned Vehicle & Crew Details',
    portalPatientBtn: 'Access Patient Portal',

    portalDriverTitle: 'Driver Console',
    portalDriverDesc: 'Real-time responder cockpit for ambulance drivers to receive incoming dispatches, accept routes, start siren journeys, and log scene arrival.',
    portalDriverF1: 'Instant Sound & Visual Siren Alert',
    portalDriverF2: '1-Click Status Controls (Accept/En Route)',
    portalDriverF3: 'Direct Patient Phone & Incident Pin',
    portalDriverBtn: 'Access Driver Console',

    portalAdminTitle: 'Admin Command Center',
    portalAdminDesc: 'Hospital emergency operations room for fleet tracking, dispatch monitoring, emergency triage analytics, manual assignment overrides, and audit trails.',
    portalAdminF1: 'Comprehensive Emergency Ledger',
    portalAdminF2: 'Fleet Availability & Maintenance',
    portalAdminF3: 'System Diagnostics & Data Refresh',
    portalAdminBtn: 'Access Command Center',

    pipelineTitle: 'Operational Emergency Lifecycle',
    pipelineSubtitle: 'State-certified emergency response lifecycle with immediate responder acknowledgment and live status updates.',
    pipelineDesc: 'Chronological emergency dispatch progression and live telemetry',
    pipelineStep1Title: 'Patient SOS Trigger',
    pipelineStep1Desc: 'Patient broadcasts incident location and medical emergency severity.',
    pipelineStep2Title: 'Driver Response & Claim',
    pipelineStep2Desc: 'Available paramedic crew reviews alert and immediately claims the emergency.',
    pipelineStep3Title: 'Siren Priority Journey',
    pipelineStep3Desc: 'Ambulance proceeds with emergency sirens active directly to patient location.',
    pipelineStep4Title: 'Trauma Ward Handover',
    pipelineStep4Desc: 'Patient admitted to emergency trauma center and ambulance returned to ready status.',
    networkBadge1: 'National Emergency Response Network',
    networkBadge2: '24/7 Centralized Dispatch Operation',
    networkBadge3: 'High-Availability Medical Telemetry',

    patientPortalTitle: 'Emergency Patient Portal',
    patientPortalBadge: 'Priority Medical Access',
    patientWelcome: 'Welcome back',
    patientLoggedInAs: 'Logged in as Emergency Contact',
    patientMedicalId: 'Patient ID',
    patientRegisteredPhone: 'Primary Contact',
    patientActiveAlertTitle: 'Active Emergency Dispatch in Progress',
    patientActiveAlertDesc: 'Keep your phone accessible. Emergency response team is coordinating this mission.',
    patientAssignedAmbulance: 'Assigned Ambulance',
    patientDriverContact: 'Driver Contact',
    patientAmbulanceType: 'Vehicle Type',
    patientBaseLocation: 'Base Station',
    patientCancelSOS: 'Cancel Emergency Call',
    patientCancelConfirm: 'Are you sure you want to cancel this emergency request?',
    patientTriggerTitle: 'Instant Emergency SOS Broadcast',
    patientTriggerDesc: 'Press the SOS button below for immediate ambulance dispatch to your current location.',
    patientInstantSOSBtn: 'ONE-TAP EMERGENCY SOS',
    patientEmergencyDetails: 'Emergency Details & Incident Location',
    patientSelectEmergencyType: 'Select Emergency Classification',
    patientLocationPlaceholder: 'Enter exact landmark or address',
    patientUseCurrentLocation: 'Auto-detect GPS',
    patientPhonePlaceholder: 'Emergency Contact Phone',
    patientNotesPlaceholder: 'Patient condition, symptoms, known allergies, floor/building details...',
    patientDispatchBtn: 'CONFIRM & BROADCAST SOS DISPATCH',
    patientFirstAidTitle: 'Emergency First Aid Guidance',
    patientFirstAidSubtitle: 'Immediate life-support instructions while ambulance is en route',
    patientHistoryTitle: 'Emergency Request History',
    patientNoHistory: 'No past emergency requests recorded.',

    driverPortalTitle: 'Ambulance Crew Cockpit',
    driverPortalBadge: 'Emergency Driver Terminal',
    driverBadge: 'Emergency Crew',
    driverAssignedUnit: 'Assigned Unit',
    driverAvailabilityStatus: 'Vehicle Availability Status',
    driverSetAvailable: 'Set to READY / AVAILABLE',
    driverSetMaintenance: 'Set to MAINTENANCE',
    driverSwitchVehicle: 'Switch Assigned Vehicle:',
    driverIncomingTitle: 'Incoming Emergency Dispatches',
    driverIncomingSubtitle: 'Urgent calls awaiting nearest driver acceptance',
    driverIncomingAlerts: 'Incoming Emergency Alerts',
    driverIncomingDesc: 'Urgent SOS requests broadcast in your operational radius',
    driverNoIncoming: 'No unassigned emergency dispatches in queue. Fleet is on standby.',
    driverAcceptBtn: 'ACCEPT EMERGENCY & DISPATCH',
    driverAcceptRequest: 'Accept Emergency Dispatch',
    driverAcceptSuccess: 'Emergency accepted! Dispatched to incident.',
    driverActiveMissionTitle: 'Active Emergency Mission',
    driverActiveMissionBadge: 'Priority Siren Active',
    driverPatientDetails: 'Patient Information',
    driverIncidentLocation: 'Incident Location',
    driverEmergencyNature: 'Emergency Classification',
    driverCallPatient: 'Call Patient',
    driverActionStartJourney: 'START JOURNEY (ON THE WAY)',
    driverStartJourney: 'Start Journey',
    driverActionArrived: 'ARRIVED AT SCENE (REACHED)',
    driverMarkReached: 'Mark Arrived at Scene',
    driverActionComplete: 'COMPLETE HOSPITAL HANDOVER',
    driverCompleteTrip: 'Complete Hospital Handover',
    driverReadyStandby: 'Unit is now free and ready on standby',
    driverStandby: 'Ready on Standby',
    driverStandbyDesc: 'Vehicle is active and awaiting next emergency dispatch',
    driverVehicleSpecs: 'Vehicle Equipment & Crew',
    driverMissionHistory: 'Completed Mission History',
    driverCompletedMissions: 'Completed Emergency Dispatches',

    adminPortalTitle: 'Hospital Dispatch Command Center',
    adminPortalBadge: 'Admin Command',
    adminConsoleBadge: 'Admin Console',
    adminSubtitle: 'Live Fleet Tracking, Central Dispatch Queue, and Operational Activity Logs',
    adminResetData: 'Restore Default Fleet',
    adminResetSystem: 'Reset System Data',
    adminAddAmbulance: 'Add Ambulance',
    adminTotalCalls: 'Total Emergencies',
    adminActiveCallsDesc: 'Currently en route / at scene',
    adminReadyFleetDesc: 'Ready for instant SOS',
    adminMetricTotalCalls: 'Total Emergencies',
    adminMetricActive: 'Active Calls',
    adminMetricAvailable: 'Ready Fleet',
    adminMetricAvgTime: 'Avg Response',
    adminFleetTitle: 'Emergency Ambulance Fleet & Crew Management',
    adminFleetSubtitle: 'Real-time readiness, vehicle telemetry, and crew status',
    adminFleetDesc: 'Real-time status, vehicle readiness, and driver telemetry',
    adminLedgerTitle: 'Emergency Dispatches Master Ledger',
    adminLedgerSubtitle: 'Complete chronological record of emergency dispatches and triage outcomes',
    adminMasterLedgerTitle: 'Emergency Dispatches Master Ledger',
    adminMasterLedgerDesc: 'All registered SOS calls, assignments, and response lifecycles',
    adminFilterAll: 'All Records',
    adminFilterActive: 'Active Calls',
    adminFilterCompleted: 'Completed',
    adminFilterCancelled: 'Cancelled',
    adminUsersTitle: 'Authorized Personnel & Role Directory',
    adminUsersSubtitle: 'Verified medical officers, paramedics, and registered patient profiles',
    adminUsersDesc: 'Authorized personnel accounts, active dispatchers, and verified drivers',

    authSignInTitle: 'Sign In to Arogyavahini',
    authRegisterTitle: 'Create Emergency Account',
    authSubtitle: 'Access rapid response dispatch, medical profiles, and mission controls.',
    authQuickDemo: 'Instant Role-Based Access:',
    authFullName: 'Full Name',
    authEmail: 'Email Address',
    authPassword: 'Password',
    authSelectRole: 'Select Role Access',
    authSignInBtn: 'Sign In to Portal',
    authRegisterBtn: 'Create Account & Sign In',
    authNoAccount: "Don't have an account?",
    authHaveAccount: 'Already have an account?',
    authCreateOne: 'Register new profile',

    footerNetwork: 'Arogyavahini Emergency Medical Response Network',
    footerDesc: 'Unified state emergency dispatch platform providing rapid paramedic mobilization, hospital trauma ward routing, and live patient tracking.',
    footerTollFree: 'Toll-Free Emergency Helpline: 108 / 112',
    footerEmergencyHotline: 'Emergency Helpline: 108 / 112',
    footerRights: 'All rights reserved. Government Healthcare Emergency Infrastructure.',
    footerCertified: 'Certified Emergency Medical Service Network',

    notificationsTitle: 'Notifications',
    notificationsEmpty: 'No notifications yet',
    notificationsEmptyDesc: 'Emergency dispatches, alerts, and system updates will appear here in real time.',
    notificationsMarkAllRead: 'Mark all as read',
    notificationsClearAll: 'Clear all',
    notificationsViewAll: 'View All Notifications',
    notificationsClose: 'Close panel',
    notificationsUnreadBadge: 'unread',
    notificationNew: 'NEW',
    notificationTimeJustNow: 'Just now',
    notificationViewEmergency: 'View Emergency Details',
  },

  kn: {
    appTitle: 'ಆರೋಗ್ಯವಾಹಿನಿ',
    appSubtitle: 'ತುರ್ತು ವೈದ್ಯಕೀಯ ಪ್ರತಿಕ್ರಿಯೆ ಮತ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ರವಾನೆ ವ್ಯವಸ್ಥೆ',
    appSubtitlePatient: 'ತುರ್ತು ವೈದ್ಯಕೀಯ ಸೇವಾ ಜಾಲ',
    appSubtitleDriver: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಿಬ್ಬಂದಿ ರವಾನೆ',
    appSubtitleAdmin: 'ಆಸ್ಪತ್ರೆ ಕಮಾಂಡ್ ನಿಯಂತ್ರಣ ಕೇಂದ್ರ',
    hotlineLabel: '24/7 ತುರ್ತು ರವಾನೆ ಸಹಾಯವಾಣಿ:',
    soundMute: 'ಸೈರನ್ ಶಬ್ದ ಮ್ಯೂಟ್ ಮಾಡಿ',
    soundUnmute: 'ಸೈರನ್ ಶಬ್ದ ಆನ್ ಮಾಡಿ',
    themeLight: 'ಲೈಟ್ ಮೋಡ್‌ಗೆ ಬದಲಿಸಿ',
    themeDark: 'ಡಾರ್ಕ್ ಮೋಡ್‌ಗೆ ಬದಲಿಸಿ',
    languageSelect: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    roleLabel: 'ಪಾತ್ರ:',
    logout: 'ಲಾಗ್ ಔಟ್',
    signInRegister: 'ಸೈನ್ ಇನ್ / ನೋಂದಣಿ',

    rolePatient: 'ರೋಗಿ',
    roleDriver: 'ಚಾಲಕರು',
    roleAdmin: 'ಆಡಳಿತ',

    navDriverDashboard: 'ಚಾಲಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    navIncomingRequests: 'ಒಳಬರುವ ವಿನಂತಿಗಳು',
    navActiveEmergency: 'ಸಕ್ರಿಯ ತುರ್ತು ಕರೆ',
    navAmbulanceStatus: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸ್ಥಿತಿ',
    navProfile: 'ಪ್ರೊಫೈಲ್',

    navPatientDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    navEmergencySOS: 'ತುರ್ತು SOS',
    navMyRequests: 'ನನ್ನ ವಿನಂತಿಗಳು',
    navAmbulanceTracking: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಟ್ರ್ಯಾಕಿಂಗ್',

    navAdminDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    navEmergencyRequests: 'ತುರ್ತು ವಿನಂತಿಗಳು',
    navAmbulances: 'ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಳು',
    navDrivers: 'ಚಾಲಕರು',
    navUsers: 'ಬಳಕೆದಾರರು',
    navReports: 'ವರದಿಗಳು',

    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    cancel: 'ರದ್ದುಮಾಡಿ',
    submit: 'ಸಲ್ಲಿಸಿ',
    save: 'ಉಳಿಸಿ',
    close: 'ಮುಚ್ಚಿ',
    confirm: 'ದೃಢೀಕರಿಸಿ',
    phone: 'ದೂರವಾಣಿ',
    location: 'ಸ್ಥಳ',
    status: 'ಸ್ಥಿತಿ',
    type: 'ವಿಧ',
    actions: 'ಕ್ರಮಗಳು',
    notes: 'ವಿವರಗಳು',
    search: 'ಹುಡುಕಿ',
    filter: 'ಫಿಲ್ಟರ್',
    all: 'ಎಲ್ಲಾ',
    active: 'ಸಕ್ರಿಯ',
    completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    cancelled: 'ರದ್ದುಗೊಂಡಿದೆ',
    available: 'ಲಭ್ಯವಿದೆ',
    busy: 'ಕಾರ್ಯನಿರತ',
    assigned: 'ನಿಯೋಜಿಸಲಾಗಿದೆ',
    maintenance: 'ನಿರ್ವಹಣೆಯಲ್ಲಿ',
    viewDetails: 'ವಿವರ ವೀಕ್ಷಿಸಿ',
    time: 'ಸಮಯ',
    patientName: 'ರೋಗಿಯ ಹೆಸರು',
    driverName: 'ಚಾಲಕರ ಹೆಸರು',
    vehicleNumber: 'ವಾಹನ ಸಂಖ್ಯೆ',
    emergencyType: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿಯ ವಿಧ',
    ambulanceType: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ವಿಧ',
    baseLocation: 'ಮೂಲ ನಿಲ್ದಾಣ',
    activeEmergencies: 'ಸಕ್ರಿಯ ತುರ್ತು ಕರೆಗಳು',
    availableAmbulances: 'ಲಭ್ಯವಿರುವ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಳು',
    completedTrips: 'ಪೂರ್ಣಗೊಂಡ ಟ್ರಿಪ್‌ಗಳು',

    statusWaitingForDriver: 'SOS ಪ್ರಸಾರವಾಗಿದೆ',
    statusWaitingDesc: 'ಚಾಲಕರ ಸ್ವೀಕಾರಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ',
    statusDriverAccepted: 'ಚಾಲಕರು ಸ್ವೀಕರಿಸಿದ್ದಾರೆ',
    statusDriverAcceptedDesc: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ನಿಯೋಜನೆ ದೃಢಪಟ್ಟಿದೆ',
    statusOnTheWay: 'ಮಾರ್ಗದಲ್ಲಿದೆ',
    statusOnTheWayDesc: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ವೇಗವಾಗಿ ಬರುತ್ತಿದೆ',
    statusReached: 'ಸಿಬ್ಬಂದಿ ತಲುಪಿದ್ದಾರೆ',
    statusReachedDesc: 'ಪ್ರಥಮ ಚಿಕಿತ್ಸಾ ಸಿಬ್ಬಂದಿ ಸ್ಥಳಕ್ಕೆ ತಲುಪಿದ್ದಾರೆ',
    statusCompleted: 'ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲು',
    statusCompletedDesc: 'ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗಕ್ಕೆ ಹಸ್ತಾಂತರ ಪೂರ್ಣ',
    statusCancelled: 'ತುರ್ತು ಕರೆ ರದ್ದಾಗಿದೆ',
    statusCancelledDesc: 'ವಿನಂತಿಯನ್ನು ಮುಕ್ತಾಯಗೊಳಿಸಲಾಗಿದೆ',
    statusEnRoute: 'ಮಾರ್ಗದಲ್ಲಿದೆ',
    statusAtScene: 'ಸ್ಥಳಕ್ಕೆ ತಲುಪಿದೆ',
    statusAvailable: 'ಲಭ್ಯವಿದೆ',

    heroBadge: 'ತುರ್ತು ವೈದ್ಯಕೀಯ ಸೇವಾ ಜಾಲ',
    heroSubBadge: '24/7 ಕ್ಷಿಪ್ರ ಪ್ರತಿಕ್ರಿಯೆ ರವಾನೆ',
    heroTitle: 'ಸ್ಮಾರ್ಟ್ ಸಂಯೋಜಿತ ತುರ್ತು',
    heroTitleGradient: 'ವೈದ್ಯಕೀಯ ಸ್ಪಂದನಾ ವ್ಯವಸ್ಥೆ',
    heroSubtitle: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿರುವ ನಾಗರಿಕರನ್ನು ಹತ್ತಿರದ ಲೈಫ್-ಸಪೋರ್ಟ್ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಳು ಮತ್ತು ಆಸ್ಪತ್ರೆಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುವ ಅಧಿಕೃತ ತುರ್ತು ವೇದಿಕೆ.',
    heroTriggerSOS: 'ತುರ್ತು SOS ಕಳುಹಿಸಿ',
    heroOpenAdmin: 'ಆಡಳಿತ ನಿಯಂತ್ರಣ ಕೇಂದ್ರ ತೆರೆಯಿರಿ',
    heroStatAmbulances: 'ಸಕ್ರಿಯ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಳು',
    heroStatReady: 'ರವಾನೆಗೆ ಸಿದ್ಧವಾಗಿವೆ',
    heroStatEmergencies: 'ಲೈವ್ ತುರ್ತು ಕರೆಗಳು',
    heroStatResponseTime: 'ಸರಾಸರಿ ಪ್ರತಿಕ್ರಿಯೆ ಸಮಯ',
    heroPortalsTitle: 'ವಿಶೇಷ ಪಾತ್ರ ಪೋರ್ಟಲ್‌ಗಳು',
    heroPortalsSubtitle: 'ಸಂಬಂಧಿತ ಕಾರ್ಯಗಳನ್ನು ನಿರ್ವಹಿಸಲು ಕೆಳಗಿನ ಪೋರ್ಟಲ್ ಆಯ್ಕೆಮಾಡಿ',

    portalPatientTitle: 'ರೋಗಿ ಪೋರ್ಟಲ್',
    portalPatientDesc: 'ಒಂದೇ ಕ್ಲಿಕ್‌ನಲ್ಲಿ SOS ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ಕರೆ, ಲೈವ್ GPS ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ಪ್ರಥಮ ಚಿಕಿತ್ಸಾ ಮಾರ್ಗದರ್ಶನ.',
    portalPatientF1: 'ತತ್‌ಕ್ಷಣದ SOS ತುರ್ತು ಬಟನ್',
    portalPatientF2: 'ನೈಜ ಸಮಯದ ಸ್ಟೆಪ್ಪರ್ ಪ್ರಗತಿ',
    portalPatientF3: 'ವಾಹನ ಮತ್ತು ಸಿಬ್ಬಂದಿ ವಿವರಗಳು',
    portalPatientBtn: 'ರೋಗಿ ಪೋರ್ಟಲ್‌ಗೆ ಪ್ರವೇಶಿಸಿ',

    portalDriverTitle: 'ಚಾಲಕರ ನಿಯಂತ್ರಣ ಕನ್ಸೋಲ್',
    portalDriverDesc: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಚಾಲಕರಿಗೆ ತುರ್ತು ಕರೆ ಸ್ವೀಕರಿಸಲು, ಮಾರ್ಗ ಪ್ರಾರಂಭಿಸಲು ಮತ್ತು ಸ್ಥಳಕ್ಕೆ ತಲುಪಿದ ದಾಖಲೆ ಮಾಡಲು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್.',
    portalDriverF1: 'ತತ್‌ಕ್ಷಣದ ಸೈರನ್ ಶಬ್ದ ಮತ್ತು ಎಚ್ಚರಿಕೆ',
    portalDriverF2: '1-ಕ್ಲಿಕ್ ಸ್ಥಿತಿ ನಿಯಂತ್ರಣಗಳು',
    portalDriverF3: 'ರೋಗಿಯ ನೇರ ದೂರವಾಣಿ ಮತ್ತು ಸ್ಥಳ',
    portalDriverBtn: 'ಚಾಲಕರ ಕನ್ಸೋಲ್‌ಗೆ ಪ್ರವೇಶಿಸಿ',

    portalAdminTitle: 'ಆಡಳಿತ ಕಮಾಂಡ್ ಸೆಂಟರ್',
    portalAdminDesc: 'ಆಸ್ಪತ್ರೆ ತುರ್ತು ಕಾರ್ಯಾಚರಣೆ ಕೊಠಡಿ: ಆಂಬ್ಯುಲೆನ್ಸ್ ನಿರ್ವಹಣೆ, ರವಾನೆ ಮೇಲ್ವಿಚಾರಣೆ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ.',
    portalAdminF1: 'ಸಮಗ್ರ ತುರ್ತು ಲೆಡ್ಜರ್',
    portalAdminF2: 'ವಾಹನ ಲಭ್ಯತೆ ಮತ್ತು ನಿರ್ವಹಣೆ',
    portalAdminF3: 'ವ್ಯವಸ್ಥೆಯ ಡೇಟಾ ರಿಫ್ರೆಶ್',
    portalAdminBtn: 'ಕಮಾಂಡ್ ಸೆಂಟರ್‌ಗೆ ಪ್ರವೇಶಿಸಿ',

    pipelineTitle: 'ತುರ್ತು ಕಾರ್ಯಾಚರಣೆ ಹಂತಗಳು',
    pipelineSubtitle: 'ತತ್‌ಕ್ಷಣದ ಸ್ವೀಕಾರ ಮತ್ತು ನಿಖರವಾದ ಸ್ಥಿತಿ ನವೀಕರಣಗಳೊಂದಿಗೆ ಅಧಿಕೃತ ತುರ್ತು ಪ್ರತಿಕ್ರಿಯೆ ವ್ಯವಸ್ಥೆ.',
    pipelineDesc: 'ಕಾಲಾನುಕ್ರಮದ ತುರ್ತು ರವಾನೆ ಪ್ರಗತಿ ಮತ್ತು ಲೈವ್ ಟೆಲಿಮೆಟ್ರಿ',
    pipelineStep1Title: 'ರೋಗಿ SOS ಪ್ರಸಾರ',
    pipelineStep1Desc: 'ರೋಗಿಯು ಘಟನಾ ಸ್ಥಳ ಮತ್ತು ವೈದ್ಯಕೀಯ ತೀವ್ರತೆಯನ್ನು ಪ್ರಸಾರ ಮಾಡುತ್ತಾರೆ.',
    pipelineStep2Title: 'ಚಾಲಕರ ಸ್ವೀಕಾರ',
    pipelineStep2Desc: 'ಲಭ್ಯವಿರುವ ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಿಬ್ಬಂದಿ ಕರೆಯನ್ನು ಪರಿಶೀಲಿಸಿ ತಕ್ಷಣ ಸ್ವೀಕರಿಸುತ್ತಾರೆ.',
    pipelineStep3Title: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಪ್ರಯಾಣ',
    pipelineStep3Desc: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸೈರನ್‌ನೊಂದಿಗೆ ರೋಗಿಯ ಸ್ಥಳಕ್ಕೆ ತ್ವರಿತವಾಗಿ ಹೊರಡುತ್ತದೆ.',
    pipelineStep4Title: 'ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲು',
    pipelineStep4Desc: 'ರೋಗಿಯನ್ನು ಟ್ರಾಮಾ ಕೇಂದ್ರಕ್ಕೆ ದಾಖಲಿಸಿ ಆಂಬ್ಯುಲೆನ್ಸ್ ಅನ್ನು ಮತ್ತೆ ಸಿದ್ಧಗೊಳಿಸಲಾಗುತ್ತದೆ.',
    networkBadge1: 'ರಾಜ್ಯ ತುರ್ತು ಸ್ಪಂದನಾ ಜಾಲ',
    networkBadge2: '24/7 ಕೇಂದ್ರೀಕೃತ ರವಾನೆ ಕಾರ್ಯಾಚರಣೆ',
    networkBadge3: 'ಹೆಚ್ಚಿನ ಲಭ್ಯತೆಯ ವೈದ್ಯಕೀಯ ಜಾಲ',

    patientPortalTitle: 'ತುರ್ತು ರೋಗಿ ಪೋರ್ಟಲ್',
    patientPortalBadge: 'ಆದ್ಯತೆಯ ವೈದ್ಯಕೀಯ ಪ್ರವೇಶ',
    patientWelcome: 'ಮರಳಿ ಸ್ವಾಗತ',
    patientLoggedInAs: 'ತುರ್ತು ಸಂಪರ್ಕವಾಗಿ ಲಾಗ್ ಇನ್ ಆಗಿದ್ದೀರಿ',
    patientMedicalId: 'ರೋಗಿ ಐಡಿ',
    patientRegisteredPhone: 'ನೋಂದಾಯಿತ ದೂರವಾಣಿ',
    patientActiveAlertTitle: 'ಸಕ್ರಿಯ ತುರ್ತು ರವಾನೆ ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    patientActiveAlertDesc: 'ದಯವಿಟ್ಟು ದೂರವಾಣಿಯನ್ನು ಲಭ್ಯವಿರಿಸಿ. ತುರ್ತು ತಂಡವು ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ.',
    patientAssignedAmbulance: 'ನಿಯೋಜಿತ ಆಂಬ್ಯುಲೆನ್ಸ್',
    patientDriverContact: 'ಚಾಲಕರ ಸಂಪರ್ಕ',
    patientAmbulanceType: 'ವಾಹನದ ವಿಧ',
    patientBaseLocation: 'ಆರಂಭಿಕ ನಿಲ್ದಾಣ',
    patientCancelSOS: 'ತುರ್ತು ಕರೆ ರದ್ದುಮಾಡಿ',
    patientCancelConfirm: 'ನೀವು ಈ ತುರ್ತು ಕರೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?',
    patientTriggerTitle: 'ತತ್‌ಕ್ಷಣದ ತುರ್ತು SOS ಪ್ರಸಾರ',
    patientTriggerDesc: 'ನಿಮ್ಮ ಸ್ಥಳಕ್ಕೆ ತಕ್ಷಣ ಆಂಬ್ಯುಲೆನ್ಸ್ ಕಳುಹಿಸಲು ಕೆಳಗಿನ SOS ಬಟನ್ ಒತ್ತಿರಿ.',
    patientInstantSOSBtn: 'ಒಂದೇ ಟ್ಯಾಪ್ ತುರ್ತು SOS',
    patientEmergencyDetails: 'ತುರ್ತು ವಿವರಗಳು ಮತ್ತು ಸ್ಥಳ',
    patientSelectEmergencyType: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿಯ ವಿಧ ಆರಿಸಿ',
    patientLocationPlaceholder: 'ನಿಖರವಾದ ವಿಳಾಸ ಅಥವಾ ಲ್ಯಾಂಡ್‌ಮಾರ್ಕ್ ನಮೂದಿಸಿ',
    patientUseCurrentLocation: 'GPS ಆಟೋ-ಪತ್ತೆ',
    patientPhonePlaceholder: 'ಸಂಪರ್ಕ ದೂರವಾಣಿ ಸಂಖ್ಯೆ',
    patientNotesPlaceholder: 'ರೋಗಿಯ ಲಕ್ಷಣಗಳು, ಅಲರ್ಜಿಗಳು, ಕಟ್ಟಡದ ಮಹಡಿ ವಿವರಗಳು...',
    patientDispatchBtn: 'ದೃಢೀಕರಿಸಿ ಮತ್ತು SOS ಪ್ರಸಾರ ಮಾಡಿ',
    patientFirstAidTitle: 'ತುರ್ತು ಪ್ರಥಮ ಚಿಕಿತ್ಸಾ ಮಾರ್ಗದರ್ಶಿ',
    patientFirstAidSubtitle: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಬರುವವರೆಗೆ ತಕ್ಷಣದ ಜೀವ ರಕ್ಷಣಾ ಕ್ರಮಗಳು',
    patientHistoryTitle: 'ಹಿಂದಿನ ತುರ್ತು ವಿನಂತಿಗಳ ಇತಿಹಾಸ',
    patientNoHistory: 'ಯಾವುದೇ ಹಿಂದಿನ ತುರ್ತು ವಿನಂತಿಗಳು ದಾಖಲಾಗಿಲ್ಲ.',

    driverPortalTitle: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಿಬ್ಬಂದಿ ಕಂಟ್ರೋಲ್',
    driverPortalBadge: 'ತುರ್ತು ಚಾಲಕರ ಟರ್ಮಿನಲ್',
    driverBadge: 'ತುರ್ತು ಸಿಬ್ಬಂದಿ',
    driverAssignedUnit: 'ನಿಯೋಜಿತ ವಾಹನ',
    driverAvailabilityStatus: 'ವಾಹನ ಲಭ್ಯತೆ ಸ್ಥಿತಿ',
    driverSetAvailable: 'ಸಿದ್ಧ / ಲಭ್ಯವಿದೆ ಎಂದು ಹೊಂದಿಸಿ',
    driverSetMaintenance: 'ನಿರ್ವಹಣೆಯಲ್ಲಿದೆ ಎಂದು ಹೊಂದಿಸಿ',
    driverSwitchVehicle: 'ನಿಯೋಜಿತ ವಾಹನ ಬದಲಿಸಿ:',
    driverIncomingTitle: 'ಒಳಬರುವ ತುರ್ತು ಕರೆಗಳು',
    driverIncomingSubtitle: 'ಚಾಲಕರ ಸ್ವೀಕಾರಕ್ಕಾಗಿ ಕಾಯುತ್ತಿರುವ ತುರ್ತು ಕರೆಗಳು',
    driverIncomingAlerts: 'ಒಳಬರುವ ತುರ್ತು ಎಚ್ಚರಿಕೆಗಳು',
    driverIncomingDesc: 'ನಿಮ್ಮ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ರವಾನೆಯಾದ ತುರ್ತು SOS ಕರೆಗಳು',
    driverNoIncoming: 'ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ಹೊಸ ತುರ್ತು ಕರೆಗಳಿಲ್ಲ. ಫ್ಲೀಟ್ ಸನ್ನದ್ಧವಾಗಿದೆ.',
    driverAcceptBtn: 'ತುರ್ತು ಕರೆ ಸ್ವೀಕರಿಸಿ & ಹೊರಡಿ',
    driverAcceptRequest: 'ತುರ್ತು ಕರೆ ಸ್ವೀಕರಿಸಿ',
    driverAcceptSuccess: 'ತುರ್ತು ಕರೆ ಸ್ವೀಕರಿಸಲಾಗಿದೆ! ಹೊರಡಲಾಗಿದೆ.',
    driverActiveMissionTitle: 'ಸಕ್ರಿಯ ತುರ್ತು ಮಿಷನ್',
    driverActiveMissionBadge: 'ಸೈರನ್ ಆನ್ ಆಗಿದೆ',
    driverPatientDetails: 'ರೋಗಿಯ ಮಾಹಿತಿ',
    driverIncidentLocation: 'ಘಟನಾ ಸ್ಥಳ',
    driverEmergencyNature: 'ತುರ್ತು ಸ್ಥಿತಿ ವರ್ಗೀಕರಣ',
    driverCallPatient: 'ರೋಗಿಗೆ ಕರೆ ಮಾಡಿ',
    driverActionStartJourney: 'ಪ್ರಯಾಣ ಆರಂಭಿಸಿ (ಮಾರ್ಗದಲ್ಲಿದೆ)',
    driverStartJourney: 'ಪ್ರಯಾಣ ಆರಂಭಿಸಿ',
    driverActionArrived: 'ಸ್ಥಳಕ್ಕೆ ತಲುಪಿದೆವು (ತಲುಪಿದೆ)',
    driverMarkReached: 'ಸ್ಥಳಕ್ಕೆ ತಲುಪಿದೆ ಎಂದು ಗುರುತಿಸಿ',
    driverActionComplete: 'ಆಸ್ಪತ್ರೆ ದಾಖಲಾತಿ ಪೂರ್ಣಗೊಳಿಸಿ',
    driverCompleteTrip: 'ಆಸ್ಪತ್ರೆ ದಾಖಲಾತಿ ಪೂರ್ಣಗೊಳಿಸಿ',
    driverReadyStandby: 'ವಾಹನವು ಸಿದ್ಧವಾಗಿದೆ ಮತ್ತು ಸ್ಟ್ಯಾಂಡ್‌ಬೈನಲ್ಲಿದೆ',
    driverStandby: 'ಸ್ಟ್ಯಾಂಡ್‌ಬೈನಲ್ಲಿ ಸಿದ್ಧವಾಗಿದೆ',
    driverStandbyDesc: 'ವಾಹನವು ಸಕ್ರಿಯವಾಗಿದೆ ಮತ್ತು ಮುಂದಿನ ಕರೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ',
    driverVehicleSpecs: 'ವಾಹನದ ಉಪಕರಣಗಳು ಮತ್ತು ಸಿಬ್ಬಂದಿ',
    driverMissionHistory: 'ಪೂರ್ಣಗೊಂಡ ಮಿಷನ್ ಇತಿಹಾಸ',
    driverCompletedMissions: 'ಪೂರ್ಣಗೊಂಡ ತುರ್ತು ಕಾರ್ಯಾಚರಣೆಗಳು',

    adminPortalTitle: 'ಆಸ್ಪತ್ರೆ ರವಾನೆ ಕಮಾಂಡ್ ಸೆಂಟರ್',
    adminPortalBadge: 'ಆಡಳಿತ ಕಮಾಂಡ್',
    adminConsoleBadge: 'ಆಡಳಿತ ಕನ್ಸೋಲ್',
    adminSubtitle: 'ಲೈವ್ ಫ್ಲೀಟ್ ಟ್ರ್ಯಾಕಿಂಗ್, ಕೇಂದ್ರೀಯ ರವಾನೆ ಮತ್ತು ಕಾರ್ಯಾಚರಣೆ ದಾಖಲೆಗಳು',
    adminResetData: 'ಡೀಫಾಲ್ಟ್ ಫ್ಲೀಟ್ ಮರುಸ್ಥಾಪಿಸಿ',
    adminResetSystem: 'ಡೇಟಾ ಮರುಹೊಂದಿಸಿ',
    adminAddAmbulance: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸೇರಿಸಿ',
    adminTotalCalls: 'ಒಟ್ಟು ತುರ್ತು ಕರೆಗಳು',
    adminActiveCallsDesc: 'ಪ್ರಸ್ತುತ ಮಾರ್ಗದಲ್ಲಿ / ಸ್ಥಳದಲ್ಲಿ',
    adminReadyFleetDesc: 'ತತ್‌ಕ್ಷಣದ ಕರೆಗೆ ಸಿದ್ಧವಾಗಿದೆ',
    adminMetricTotalCalls: 'ಒಟ್ಟು ತುರ್ತು ಕರೆಗಳು',
    adminMetricActive: 'ಸಕ್ರಿಯ ಕರೆಗಳು',
    adminMetricAvailable: 'ಸಿದ್ಧ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಳು',
    adminMetricAvgTime: 'ಸರಾಸರಿ ಪ್ರತಿಕ್ರಿಯೆ',
    adminFleetTitle: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಫ್ಲೀಟ್ ಮತ್ತು ಸಿಬ್ಬಂದಿ ನಿರ್ವಹಣೆ',
    adminFleetSubtitle: 'ನೈಜ-ಸಮಯದ ಸನ್ನದ್ಧತೆ, ವಾಹನ ಟೆಲಿಮೆಟ್ರಿ ಮತ್ತು ಸಿಬ್ಬಂದಿ ಸ್ಥಿತಿ',
    adminFleetDesc: 'ನೈಜ-ಸಮಯದ ಸ್ಥಿತಿ, ವಾಹನ ಸನ್ನದ್ಧತೆ ಮತ್ತು ಚಾಲಕರ ಮಾಹಿತಿ',
    adminLedgerTitle: 'ತುರ್ತು ರವಾನೆಗಳ ಮುಖ್ಯ ಲೆಡ್ಜರ್',
    adminLedgerSubtitle: 'ಎಲ್ಲಾ ತುರ್ತು ಕರೆಗಳ ಕಾಲಾನುಕ್ರಮದ ಅಧಿಕೃತ ದಾಖಲೆಗಳು',
    adminMasterLedgerTitle: 'ತುರ್ತು ರವಾನೆಗಳ ಮಾಸ್ಟರ್ ಲೆಡ್ಜರ್',
    adminMasterLedgerDesc: 'ಎಲ್ಲಾ ನೋಂದಾಯಿತ ಕರೆಗಳು ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆ ಪ್ರಗತಿ',
    adminFilterAll: 'ಎಲ್ಲಾ ದಾಖಲೆಗಳು',
    adminFilterActive: 'ಸಕ್ರಿಯ ಕರೆಗಳು',
    adminFilterCompleted: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    adminFilterCancelled: 'ರದ್ದುಗೊಂಡಿದೆ',
    adminUsersTitle: 'ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಮತ್ತು ಬಳಕೆದಾರರ ಡೈರೆಕ್ಟರಿ',
    adminUsersSubtitle: 'ದೃಢೀಕೃತ ವೈದ್ಯಕೀಯ ಅಧಿಕಾರಿಗಳು, ಪ್ಯಾರಾಮೆಡಿಕ್ಸ್ ಮತ್ತು ನೋಂದಾಯಿತ ರೋಗಿಗಳು',
    adminUsersDesc: 'ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಖಾತೆಗಳು ಮತ್ತು ನೋಂದಾಯಿತ ಚಾಲಕರು',

    authSignInTitle: 'ಆರೋಗ್ಯವಾಹಿನಿಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ',
    authRegisterTitle: 'ತುರ್ತು ಖಾತೆ ರಚಿಸಿ',
    authSubtitle: 'ತ್ವರಿತ ತುರ್ತು ರವಾನೆ ಮತ್ತು ವೈದ್ಯಕೀಯ ಪ್ರೊಫೈಲ್‌ಗೆ ಪ್ರವೇಶ ಪಡೆಯಿರಿ.',
    authQuickDemo: 'ತ್ವರಿತ ಪಾತ್ರ ಪ್ರವೇಶ:',
    authFullName: 'ಪೂರ್ಣ ಹೆಸರು',
    authEmail: 'ಇಮೇಲ್ ವಿಳಾಸ',
    authPassword: 'ಪಾಸ್‌ವರ್ಡ್',
    authSelectRole: 'ಪಾತ್ರ ಆಯ್ಕೆಮಾಡಿ',
    authSignInBtn: 'ಪೋರ್ಟಲ್‌ಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ',
    authRegisterBtn: 'ಖಾತೆ ರಚಿಸಿ & ಪ್ರವೇಶಿಸಿ',
    authNoAccount: 'ಖಾತೆ ಇಲ್ಲವೇ?',
    authHaveAccount: 'ಈಗಾಗಲೇ ಖಾತೆ ಹೊಂದಿದ್ದೀರಾ?',
    authCreateOne: 'ಹೊಸ ಪ್ರೊಫೈಲ್ ನೋಂದಾಯಿಸಿ',

    footerNetwork: 'ಆರೋಗ್ಯವಾಹಿನಿ ತುರ್ತು ವೈದ್ಯಕೀಯ ಸ್ಪಂದನಾ ಜಾಲ',
    footerDesc: 'ತ್ವರಿತ ಪ್ಯಾರಾಮೆಡಿಕ್ ಚಲನಶೀಲತೆ, ಆಸ್ಪತ್ರೆ ಟ್ರಾಮಾ ವಾರ್ಡ್ ಮಾರ್ಗ ಮತ್ತು ಲೈವ್ ರೋಗಿ ಟ್ರ್ಯಾಕಿಂಗ್ ಒದಗಿಸುವ ರಾಜ್ಯ ತುರ್ತು ರವಾನೆ ವೇದಿಕೆ.',
    footerTollFree: 'ಟೋಲ್-ಫ್ರೀ ತುರ್ತು ಸಹಾಯವಾಣಿ: 108 / 112',
    footerEmergencyHotline: 'ತುರ್ತು ಸಹಾಯವಾಣಿ: 108 / 112',
    footerRights: 'ಎಲ್ಲಾ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ. ಸರ್ಕಾರಿ ಆರೋಗ್ಯ ತುರ್ತು ಮೂಲಸೌಕರ್ಯ.',
    footerCertified: 'ಪ್ರಮಾಣೀಕೃತ ತುರ್ತು ವೈದ್ಯಕೀಯ ಸೇವಾ ಜಾಲ',

    notificationsTitle: 'ಅಧಿಸೂಚನೆಗಳು',
    notificationsEmpty: 'ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ',
    notificationsEmptyDesc: 'ತುರ್ತು ರವಾನೆಗಳು, ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಸಿಸ್ಟಮ್ ನವೀಕರಣಗಳು ಇಲ್ಲಿ ನೈಜ ಸಮಯದಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ.',
    notificationsMarkAllRead: 'ಎಲ್ಲವನ್ನೂ ಓದಿದೆ ಎಂದು ಗುರುತಿಸಿ',
    notificationsClearAll: 'ಎಲ್ಲವನ್ನೂ ತೆರವುಗೊಳಿಸಿ',
    notificationsViewAll: 'ಎಲ್ಲಾ ಅಧಿಸೂಚನೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    notificationsClose: 'ಮುಚ್ಚಿ',
    notificationsUnreadBadge: 'ಓದಿಲ್ಲ',
    notificationNew: 'ಹೊಸದು',
    notificationTimeJustNow: 'ಈಗಷ್ಟೇ',
    notificationViewEmergency: 'ತುರ್ತು ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
  },

  hi: {
    appTitle: 'आरोग्यवाहिनी',
    appSubtitle: 'आपातकालीन चिकित्सा प्रतिक्रिया और एम्बुलेंस प्रेषण प्रणाली',
    appSubtitlePatient: 'आपातकालीन चिकित्सा प्रतिक्रिया नेटवर्क',
    appSubtitleDriver: 'एम्बुलेंस क्रू प्रेषण',
    appSubtitleAdmin: 'अस्पताल कमांड सेंटर',
    hotlineLabel: '24/7 आपातकालीन प्रेषण हेल्पलाइन:',
    soundMute: 'सायरन म्यूट करें',
    soundUnmute: 'सायरन अनम्यूट करें',
    themeLight: 'लाइट मोड पर स्विच करें',
    themeDark: 'डार्क मोड पर स्विच करें',
    languageSelect: 'भाषा चुनें',
    roleLabel: 'भूमिका:',
    logout: 'लॉग आउट',
    signInRegister: 'साइन इन / पंजीकरण',

    rolePatient: 'मरीज',
    roleDriver: 'चालक',
    roleAdmin: 'प्रशासक',

    navDriverDashboard: 'चालक डैशबोर्ड',
    navIncomingRequests: 'आने वाले अनुरोध',
    navActiveEmergency: 'सक्रिय आपातकाल',
    navAmbulanceStatus: 'एम्बुलेंस स्थिति',
    navProfile: 'प्रोफ़ाइल',

    navPatientDashboard: 'डैशबोर्ड',
    navEmergencySOS: 'आपातकालीन SOS',
    navMyRequests: 'मेरे अनुरोध',
    navAmbulanceTracking: 'एम्बुलेंस ट्रैकिंग',

    navAdminDashboard: 'डैशबोर्ड',
    navEmergencyRequests: 'आपातकालीन अनुरोध',
    navAmbulances: 'एम्बुलेंस बेड़ा',
    navDrivers: 'चालक',
    navUsers: 'उपयोगकर्ता',
    navReports: 'रिपोर्ट',

    loading: 'लोड हो रहा है...',
    cancel: 'रद्द करें',
    submit: 'जमा करें',
    save: 'सहेजें',
    close: 'बंद करें',
    confirm: 'पुष्टि करें',
    phone: 'फ़ोन',
    location: 'स्थान',
    status: 'स्थिति',
    type: 'प्रकार',
    actions: 'कार्रवाई',
    notes: 'विवरण',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    all: 'सभी',
    active: 'सक्रिय',
    completed: 'पूर्ण',
    cancelled: 'रद्द',
    available: 'उपलब्ध',
    busy: 'व्यस्त',
    assigned: 'सौंपा गया',
    maintenance: 'रखरखाव में',
    viewDetails: 'विवरण देखें',
    time: 'समय',
    patientName: 'मरीज का नाम',
    driverName: 'चालक का नाम',
    vehicleNumber: 'वाहन संख्या',
    emergencyType: 'आपातकाल का प्रकार',
    ambulanceType: 'एम्बुलेंस प्रकार',
    baseLocation: 'मूल स्टेशन',
    activeEmergencies: 'सक्रिय आपातकाल',
    availableAmbulances: 'उपलब्ध एम्बुलेंस',
    completedTrips: 'पूर्ण मिशन',

    statusWaitingForDriver: 'SOS प्रसारित',
    statusWaitingDesc: 'चालक द्वारा स्वीकार किए जाने की प्रतीक्षा',
    statusDriverAccepted: 'चालक ने स्वीकार किया',
    statusDriverAcceptedDesc: 'एम्बुलेंस आवंटित और पुष्टि की गई',
    statusOnTheWay: 'रास्ते में है',
    statusOnTheWayDesc: 'सायरन के साथ एम्बुलेंस आ रही है',
    statusReached: 'दल घटनास्थल पर पहुंचा',
    statusReachedDesc: 'प्राथमिक प्रतिक्रिया दल घटना स्थल पर मौजूद',
    statusCompleted: 'अस्पताल में भर्ती',
    statusCompletedDesc: 'ट्रॉमा वार्ड में सुरक्षित प्रवेश पूर्ण',
    statusCancelled: 'आपातकाल रद्द',
    statusCancelledDesc: 'अनुरोध उपयोगकर्ता या नियंत्रण कक्ष द्वारा बंद',
    statusEnRoute: 'रास्ते में',
    statusAtScene: 'घटनास्थल पर',
    statusAvailable: 'उपलब्ध',

    heroBadge: 'आपातकालीन चिकित्सा प्रतिक्रिया नेटवर्क',
    heroSubBadge: '24/7 त्वरित प्रेषण प्रणाली',
    heroTitle: 'स्मार्ट एकीकृत आपातकालीन',
    heroTitleGradient: 'चिकित्सा प्रतिक्रिया प्रणाली',
    heroSubtitle: 'संकट में मरीजों को निकटतम उपलब्ध जीवन रक्षक एम्बुलेंस, अस्पताल ट्रॉमा वार्ड और प्रेषण नियंत्रकों से जोड़ने वाला एकीकृत आपातकालीन मंच।',
    heroTriggerSOS: 'आपातकालीन SOS भेजें',
    heroOpenAdmin: 'व्यवस्थापक कमांड सेंटर खोलें',
    heroStatAmbulances: 'सक्रिय एम्बुलेंस',
    heroStatReady: 'प्रेषण के लिए तैयार',
    heroStatEmergencies: 'लाइव आपात स्थिति',
    heroStatResponseTime: 'औसत प्रतिक्रिया समय',
    heroPortalsTitle: 'समर्पित भूमिका पोर्टल',
    heroPortalsSubtitle: 'विशिष्ट कार्यप्रवाहों तक पहुँचने के लिए नीचे दिए गए पोर्टल का चयन करें',

    portalPatientTitle: 'मरीज पोर्टल',
    portalPatientDesc: 'एक-टैप आपातकालीन SOS, स्वचालित एम्बुलेंस मिलान, लाइव GPS ट्रैकिंग और प्राथमिक चिकित्सा निर्देश।',
    portalPatientF1: 'तत्काल SOS आपातकालीन बटन',
    portalPatientF2: 'रीयल-टाइम स्थिति ट्रैकर',
    portalPatientF3: 'आवंटित वाहन और क्रू विवरण',
    portalPatientBtn: 'मरीज पोर्टल में प्रवेश करें',

    portalDriverTitle: 'चालक कंसोल',
    portalDriverDesc: 'एम्बुलेंस चालकों के लिए आने वाले अनुरोधों को स्वीकार करने, सायरन यात्रा शुरू करने और घटनास्थल आगमन दर्ज करने का कॉकपिट।',
    portalDriverF1: 'तत्काल ध्वनि और दृश्य सायरन अलर्ट',
    portalDriverF2: '1-क्लिक स्थिति नियंत्रण',
    portalDriverF3: 'सीधा मरीज फ़ोन और स्थान पिन',
    portalDriverBtn: 'चालक कंसोल में प्रवेश करें',

    portalAdminTitle: 'कमांड सेंटर',
    portalAdminDesc: 'अस्पताल आपातकालीन संचालन कक्ष: बेड़े की ट्रैकिंग, प्रेषण निगरानी और व्यापक आपातकालीन ऑडिट।',
    portalAdminF1: 'व्यापक आपातकालीन बहीखाता',
    portalAdminF2: 'बेड़े की उपलब्धता और रखरखाव',
    portalAdminF3: 'सिस्टम डायग्नोस्टिक्स और डेटा रीफ्रेश',
    portalAdminBtn: 'कमांड सेंटर में प्रवेश करें',

    pipelineTitle: 'परिचालन आपातकालीन जीवनचक्र',
    pipelineSubtitle: 'तत्काल प्रतिक्रियाकर्ता स्वीकृति और वास्तविक समय स्थिति अद्यतन के साथ राज्य-प्रमाणित आपातकालीन प्रणाली।',
    pipelineDesc: 'कालानुक्रमिक आपातकालीन प्रेषण प्रगति और लाइव टेलीमेट्री',
    pipelineStep1Title: 'मरीज SOS प्रसारण',
    pipelineStep1Desc: 'मरीज घटना स्थल और चिकित्सा आपातकाल की गंभीरता प्रसारित करता है।',
    pipelineStep2Title: 'चालक स्वीकृति',
    pipelineStep2Desc: 'उपलब्ध पैरामेडिक दल अलर्ट की समीक्षा करता है और तुरंत आपातकाल स्वीकार करता है।',
    pipelineStep3Title: 'सायरन प्राथमिकता यात्रा',
    pipelineStep3Desc: 'एम्बुलेंस सक्रिय सायरन के साथ सीधे मरीज के स्थान की ओर बढ़ती है।',
    pipelineStep4Title: 'ट्रॉमा वार्ड में प्रवेश',
    pipelineStep4Desc: 'मरीज को आपातकालीन ट्रॉमा सेंटर में भर्ती कराया जाता है और एम्बुलेंस तैयार स्थिति में लौट आती है।',
    networkBadge1: 'राष्ट्रीय आपातकालीन प्रतिक्रिया नेटवर्क',
    networkBadge2: '24/7 केंद्रीकृत प्रेषण संचालन',
    networkBadge3: 'उच्च उपलब्धता चिकित्सा टेलीमेट्री',

    patientPortalTitle: 'आपातकालीन मरीज पोर्टल',
    patientPortalBadge: 'प्राथमिकता चिकित्सा पहुंच',
    patientWelcome: 'वापसी पर स्वागत है',
    patientLoggedInAs: 'आपातकालीन संपर्क के रूप में लॉग इन',
    patientMedicalId: 'मरीज आईडी',
    patientRegisteredPhone: 'प्राथमिक संपर्क',
    patientActiveAlertTitle: 'सक्रिय आपातकालीन प्रेषण प्रगति पर है',
    patientActiveAlertDesc: 'कृपया अपना फ़ोन उपलब्ध रखें। आपातकालीन टीम इस मिशन का समन्वय कर रही है।',
    patientAssignedAmbulance: 'आवंटित एम्बुलेंस',
    patientDriverContact: 'चालक संपर्क',
    patientAmbulanceType: 'वाहन का प्रकार',
    patientBaseLocation: 'बेस स्टेशन',
    patientCancelSOS: 'आपातकालीन कॉल रद्द करें',
    patientCancelConfirm: 'क्या आप वाकई इस आपातकालीन अनुरोध को रद्द करना चाहते हैं?',
    patientTriggerTitle: 'तत्काल आपातकालीन SOS प्रसारण',
    patientTriggerDesc: 'अपने वर्तमान स्थान पर तत्काल एम्बुलेंस प्रेषण के लिए नीचे दिए गए SOS बटन को दबाएं।',
    patientInstantSOSBtn: 'एक-टैप आपातकालीन SOS',
    patientEmergencyDetails: 'आपातकालीन विवरण और स्थान',
    patientSelectEmergencyType: 'आपातकाल का प्रकार चुनें',
    patientLocationPlaceholder: 'सटीक पता या लैंडमार्क दर्ज करें',
    patientUseCurrentLocation: 'GPS ऑटो-डिटेक्ट',
    patientPhonePlaceholder: 'आपातकालीन संपर्क फ़ोन नंबर',
    patientNotesPlaceholder: 'मरीज की स्थिति, लक्षण, एलर्जी, इमारत/मंजिल विवरण...',
    patientDispatchBtn: 'पुष्टि करें और SOS प्रसारित करें',
    patientFirstAidTitle: 'आपातकालीन प्राथमिक चिकित्सा मार्गदर्शन',
    patientFirstAidSubtitle: 'एम्बुलेंस के रास्ते में होने के दौरान तत्काल जीवन रक्षक निर्देश',
    patientHistoryTitle: 'आपातकालीन अनुरोध इतिहास',
    patientNoHistory: 'कोई पिछला आपातकालीन अनुरोध दर्ज नहीं है।',

    driverPortalTitle: 'एम्बुलेंस क्रू कॉकपिट',
    driverPortalBadge: 'आपातकालीन चालक टर्मिनल',
    driverBadge: 'आपातकालीन क्रू',
    driverAssignedUnit: 'आवंटित इकाई',
    driverAvailabilityStatus: 'वाहन उपलब्धता स्थिति',
    driverSetAvailable: 'तैयार / उपलब्ध सेट करें',
    driverSetMaintenance: 'रखरखाव सेट करें',
    driverSwitchVehicle: 'आवंटित वाहन बदलें:',
    driverIncomingTitle: 'आने वाले आपातकालीन प्रेषण',
    driverIncomingSubtitle: 'चालक स्वीकृति की प्रतीक्षा कर रहे आपातकालीन अनुरोध',
    driverIncomingAlerts: 'आने वाले आपातकालीन अलर्ट',
    driverIncomingDesc: 'आपके परिचालन दायरे में प्रसारित तत्काल SOS अनुरोध',
    driverNoIncoming: 'कतार में कोई नया आपातकालीन अनुरोध नहीं है। बेड़ा स्टैंडबाय पर है।',
    driverAcceptBtn: 'आपातकाल स्वीकार करें और प्रस्थान करें',
    driverAcceptRequest: 'आपातकाल स्वीकार करें',
    driverAcceptSuccess: 'आपातकाल स्वीकार कर लिया गया! घटनास्थल के लिए प्रस्थान।',
    driverActiveMissionTitle: 'सक्रिय आपातकालीन मिशन',
    driverActiveMissionBadge: 'सायरन सक्रिय',
    driverPatientDetails: 'मरीज की जानकारी',
    driverIncidentLocation: 'घटना स्थल',
    driverEmergencyNature: 'आपातकाल वर्गीकरण',
    driverCallPatient: 'मरीज को कॉल करें',
    driverActionStartJourney: 'यात्रा शुरू करें (रास्ते में)',
    driverStartJourney: 'यात्रा शुरू करें',
    driverActionArrived: 'घटनास्थल पर पहुंचे (पहुंच गए)',
    driverMarkReached: 'घटनास्थल पर पहुंचे दर्ज करें',
    driverActionComplete: 'अस्पताल प्रवेश पूर्ण करें',
    driverCompleteTrip: 'अस्पताल प्रवेश पूर्ण करें',
    driverReadyStandby: 'इकाई अब मुक्त है और स्टैंडबाय पर तैयार है',
    driverStandby: 'स्टैंडबाय पर तैयार',
    driverStandbyDesc: 'वाहन सक्रिय है और अगले आपातकालीन प्रेषण की प्रतीक्षा कर रहा है',
    driverVehicleSpecs: 'वाहन उपकरण और क्रू',
    driverMissionHistory: 'पूर्ण मिशन इतिहास',
    driverCompletedMissions: 'पूर्ण किए गए आपातकालीन प्रेषण',

    adminPortalTitle: 'अस्पताल प्रेषण कमांड सेंटर',
    adminPortalBadge: 'व्यवस्थापक कमांड',
    adminConsoleBadge: 'व्यवस्थापक कंसोल',
    adminSubtitle: 'लाइव फ्लीट ट्रैकिंग, केंद्रीय प्रेषण कतार और परिचालन गतिविधि लॉग',
    adminResetData: 'डिफ़ॉल्ट बेड़ा पुनर्स्थापित करें',
    adminResetSystem: 'सिस्टम डेटा रीसेट करें',
    adminAddAmbulance: 'एम्बुलेंस जोड़ें',
    adminTotalCalls: 'कुल आपात स्थिति',
    adminActiveCallsDesc: 'वर्तमान में रास्ते में / घटनास्थल पर',
    adminReadyFleetDesc: 'तत्काल SOS के लिए तैयार',
    adminMetricTotalCalls: 'कुल आपात स्थिति',
    adminMetricActive: 'सक्रिय कॉल',
    adminMetricAvailable: 'तैयार बेड़ा',
    adminMetricAvgTime: 'औसत प्रतिक्रिया',
    adminFleetTitle: 'आपातकालीन एम्बुलेंस बेड़ा और क्रू प्रबंधन',
    adminFleetSubtitle: 'वास्तविक समय की तैयारी, वाहन टेलीमेट्री और क्रू स्थिति',
    adminFleetDesc: 'वास्तविक समय स्थिति, वाहन की तैयारी और चालक टेलीमेट्री',
    adminLedgerTitle: 'आपातकालीन प्रेषण मास्टर बहीखाता',
    adminLedgerSubtitle: 'आपातकालीन प्रेषण और परिणाम का पूरा कालानुक्रमिक रिकॉर्ड',
    adminMasterLedgerTitle: 'आपातकालीन प्रेषण मास्टर लेजर',
    adminMasterLedgerDesc: 'सभी पंजीकृत SOS कॉल, आवंटन और प्रतिक्रिया जीवनचक्र',
    adminFilterAll: 'सभी रिकॉर्ड',
    adminFilterActive: 'सक्रिय कॉल',
    adminFilterCompleted: 'पूर्ण',
    adminFilterCancelled: 'रद्द',
    adminUsersTitle: 'अधिकृत कार्मिक और भूमिका निर्देशिका',
    adminUsersSubtitle: 'सत्यापित चिकित्सा अधिकारी, पैरामेडिक्स और पंजीकृत मरीज',
    adminUsersDesc: 'अधिकृत कार्मिक खाते, सक्रिय प्रेषक और सत्यापित चालक',

    authSignInTitle: 'आरोग्यवाहिनी में साइन इन करें',
    authRegisterTitle: 'आपातकालीन खाता बनाएं',
    authSubtitle: 'त्वरित प्रतिक्रिया प्रेषण और चिकित्सा प्रोफ़ाइल तक पहुंचें।',
    authQuickDemo: 'त्वरित भूमिका पहुंच:',
    authFullName: 'पूरा नाम',
    authEmail: 'ईमेल पता',
    authPassword: 'पासवर्ड',
    authSelectRole: 'भूमिका चुनें',
    authSignInBtn: 'पोर्टल में साइन इन करें',
    authRegisterBtn: 'खाता बनाएं और साइन इन करें',
    authNoAccount: 'खाता नहीं है?',
    authHaveAccount: 'पहले से खाता है?',
    authCreateOne: 'नया प्रोफ़ाइल पंजीकृत करें',

    footerNetwork: 'आरोग्यवाहिनी आपातकालीन चिकित्सा प्रतिक्रिया नेटवर्क',
    footerDesc: 'त्वरित पैरामेडिक लामबंदी, अस्पताल ट्रॉमा वार्ड रूटिंग और लाइव मरीज ट्रैकिंग प्रदान करने वाला राज्य आपातकालीन प्रेषण मंच।',
    footerTollFree: 'टोल-फ्री आपातकालीन हेल्पलाइन: 108 / 112',
    footerEmergencyHotline: 'आपातकालीन हेल्पलाइन: 108 / 112',
    footerRights: 'सर्वाधिकार सुरक्षित। सरकारी स्वास्थ्य आपातकालीन बुनियादी ढांचा।',
    footerCertified: 'प्रमाणित आपातकालीन चिकित्सा सेवा नेटवर्क',

    notificationsTitle: 'सूचनाएं',
    notificationsEmpty: 'कोई सूचना नहीं है',
    notificationsEmptyDesc: 'आपातकालीन प्रेषण, अलर्ट और सिस्टम अपडेट यहां वास्तविक समय में दिखाई देंगे।',
    notificationsMarkAllRead: 'सभी को पढ़ा हुआ चिह्नित करें',
    notificationsClearAll: 'सभी साफ़ करें',
    notificationsViewAll: 'सभी सूचनाएं देखें',
    notificationsClose: 'पैनल बंद करें',
    notificationsUnreadBadge: 'अपठित',
    notificationNew: 'नया',
    notificationTimeJustNow: 'अभी-अभी',
    notificationViewEmergency: 'आपातकालीन विवरण देखें',
  },
};

import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  ShieldCheck, 
  Truck, 
  Clock, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  Globe, 
  BellRing, 
  RotateCcw, 
  Save, 
  Sparkles,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Ambulance } from '../../types';

interface DriverProfileSettingsViewProps {
  selectedAmbulance: Ambulance | null;
  onSaveDriverProfile?: (data: any) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DriverProfileSettingsView: React.FC<DriverProfileSettingsViewProps> = ({
  selectedAmbulance,
  onSaveDriverProfile,
  showToast,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [driverName, setDriverName] = useState(user?.name || 'Rajesh Kumar');
  const [phone, setPhone] = useState(user?.phone || '+91 98450 12345');
  const [licenseNumber, setLicenseNumber] = useState('KA-03-2018-0092144');
  const [shiftHours, setShiftHours] = useState('08:00 - 20:00 (Day Shift)');
  const [emergencyContact, setEmergencyContact] = useState('Fleet Base HQ (+91 80 2222 1080)');

  // Preference Settings
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState(true);
  const [autoRerouteEnabled, setAutoRerouteEnabled] = useState(true);
  const [vibrationAlerts, setVibrationAlerts] = useState(true);
  const [alertVolume, setAlertVolume] = useState(85);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveDriverProfile) {
      onSaveDriverProfile({ driverName, phone, licenseNumber, shiftHours, emergencyContact });
    }
    showToast('Driver profile updated successfully', 'success');
  };

  const handleTestSiren = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.2 * (alertVolume / 100), audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.7);
      showToast('Siren alert sound test played', 'info');
    } catch {
      showToast('Audio playback not permitted or unavailable', 'error');
    }
  };

  return (
    <div id="driver-profile-settings-view" className="space-y-6">
      {/* Profile Overview Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-xs">
            {driverName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {driverName}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Active Crew Member
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Assigned Vehicle: <strong className="font-mono text-slate-900 dark:text-white">{selectedAmbulance?.vehicle_number || 'KA-01-EA-1008'}</strong> • Shift: {shiftHours}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestSiren}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          <Volume2 className="w-4 h-4 text-amber-500" />
          <span>Test Alert Siren</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driver Profile Details Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <User className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Driver Identification & Credentials
            </h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-500 dark:text-slate-400 font-bold block mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-bold block mb-1">
                  Primary Mobile Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 font-bold block mb-1">
                  Heavy Vehicle Driving License
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-bold block mb-1">
                  Assigned Vehicle Reg
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedAmbulance?.vehicle_number || 'KA-01-EA-1008'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 font-bold block mb-1">
                  Operational Shift
                </label>
                <input
                  type="text"
                  value={shiftHours}
                  onChange={(e) => setShiftHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-500 dark:text-slate-400 font-bold block mb-1">
                Emergency Dispatch Base Contact
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* Driver Application Settings & Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Cockpit Preferences & Alerts
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-600" />}
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Night Cockpit (Dark Mode)</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Reduces glare during night emergency navigation</span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 font-bold text-xs border border-slate-200 dark:border-slate-600 cursor-pointer"
              >
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-blue-500" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">System Language</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">English, Kannada, Hindi, Telugu, Tamil</span>
                </div>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 font-bold text-xs border border-slate-200 dark:border-slate-600 cursor-pointer"
              >
                <option value="en">English (India)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
            </div>

            {/* Voice Navigation Alerts */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-emerald-500" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Spoken Turn-by-Turn Voice</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Speaks instructions during active high-speed runs</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={voiceAlertsEnabled}
                onChange={(e) => setVoiceAlertsEnabled(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Auto Recalculate */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <RotateCcw className="w-4 h-4 text-blue-500" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Auto-Recalculate on Deviation</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Reroute when missing turns or traffic blocks road</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoRerouteEnabled}
                onChange={(e) => setAutoRerouteEnabled(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Alert Volume Slider */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white">Emergency Siren Volume</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{alertVolume}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={alertVolume}
                onChange={(e) => setAlertVolume(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

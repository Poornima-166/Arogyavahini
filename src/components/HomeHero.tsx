import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { SystemStats } from '../types';
import { 
  AlertOctagon, 
  Truck, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle, 
  HeartPulse, 
  Radio,
  Building2,
  PhoneForwarded,
  Shield,
  Ambulance
} from 'lucide-react';

interface HomeHeroProps {
  onOpenAuth?: () => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({ onOpenAuth }) => {
  const { demoLogin, isLoading } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    loadStats();
    const timer = setInterval(loadStats, 5000);
    return () => clearInterval(timer);
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (e) {
      console.warn('Could not load stats', e);
    }
  };

  const handleLaunchRole = async (role: 'patient' | 'driver' | 'admin') => {
    await demoLogin(role);
  };

  return (
    <div id="home-hero-container" className="space-y-8 pb-12">
      {/* Top Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-[#0f172a] dark:bg-slate-950 text-white p-6 sm:p-10 lg:p-12 border border-slate-800 shadow-md">
        {/* Background glow accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 dark:bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>{t.heroBadge}</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-medium">{t.heroSubBadge}</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            {t.heroTitle}{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-rose-300 to-amber-300">
              {t.heroTitleGradient}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            {t.heroSubtitle}
          </p>

          {/* Massive Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => handleLaunchRole('patient')}
              className="w-full sm:w-auto px-7 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-2.5 text-base transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <AlertOctagon className="w-5 h-5 animate-pulse" />
              <span>{t.heroTriggerSOS}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleLaunchRole('admin')}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-200 hover:text-white font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm sm:text-base transition-all"
            >
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <span>{t.heroOpenAdmin}</span>
            </button>
          </div>

          {/* Live Fleet Statistics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-slate-800">
            <div className="bg-slate-800/60 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-2xl font-bold font-mono text-white">
                {stats ? stats.totalAmbulances : '4'}
              </span>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t.heroStatAmbulances}</p>
            </div>

            <div className="bg-slate-800/60 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {stats ? stats.availableAmbulances : '4'}
              </span>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t.heroStatReady}</p>
            </div>

            <div className="bg-slate-800/60 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {stats ? stats.activeEmergencies : '0'}
              </span>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t.heroStatEmergencies}</p>
            </div>

            <div className="bg-slate-800/60 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-2xl font-bold font-mono text-rose-400">
                ~6.4 <span className="text-xs font-semibold">min</span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t.heroStatResponseTime}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Role Portals */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.heroPortalsTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t.heroPortalsSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Patient Portal Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 flex items-center justify-center font-bold">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 px-2 py-0.5 rounded">
                  {t.rolePatient}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">{t.portalPatientTitle}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {t.portalPatientDesc}
                </p>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t.portalPatientF1}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t.portalPatientF2}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t.portalPatientF3}</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleLaunchRole('patient')}
              disabled={isLoading}
              className="mt-6 w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.portalPatientBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ambulance Driver Console Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded">
                  {t.roleDriver}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">{t.portalDriverTitle}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {t.portalDriverDesc}
                </p>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{t.portalDriverF1}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{t.portalDriverF2}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{t.portalDriverF3}</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleLaunchRole('driver')}
              disabled={isLoading}
              className="mt-6 w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.portalDriverBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Admin Command Center Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded">
                  {t.roleAdmin}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">{t.portalAdminTitle}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {t.portalAdminDesc}
                </p>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{t.portalAdminF1}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{t.portalAdminF2}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{t.portalAdminF3}</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleLaunchRole('admin')}
              disabled={isLoading}
              className="mt-6 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.portalAdminBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Emergency Lifecycle Operational Diagram */}
      <section className="bg-[#0f172a] dark:bg-slate-950 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm">
        <div className="max-w-3xl mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>{t.pipelineTitle}</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            {t.pipelineTitle}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {t.pipelineSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 relative">
            <div className="text-xl font-bold font-mono text-red-400 mb-1">01</div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">{t.pipelineStep1Title}</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {t.pipelineStep1Desc}
            </p>
          </div>

          <div className="bg-slate-800/60 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 relative">
            <div className="text-xl font-bold font-mono text-amber-400 mb-1">02</div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">{t.pipelineStep2Title}</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {t.pipelineStep2Desc}
            </p>
          </div>

          <div className="bg-slate-800/60 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 relative">
            <div className="text-xl font-bold font-mono text-blue-400 mb-1">03</div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">{t.pipelineStep3Title}</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {t.pipelineStep3Desc}
            </p>
          </div>

          <div className="bg-slate-800/60 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 relative">
            <div className="text-xl font-bold font-mono text-emerald-400 mb-1">04</div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">{t.pipelineStep4Title}</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {t.pipelineStep4Desc}
            </p>
          </div>
        </div>

        {/* Network Badges */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Ambulance className="w-4 h-4 text-red-400" />
            <span>{t.networkBadge1}</span>
          </div>
          <div className="flex items-center gap-2">
            <PhoneForwarded className="w-4 h-4 text-amber-400" />
            <span>{t.networkBadge2}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>{t.networkBadge3}</span>
          </div>
        </div>
      </section>
    </div>
  );
};

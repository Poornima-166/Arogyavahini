import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { PatientDashboard } from './components/PatientDashboard';
import { DriverDashboard } from './components/DriverDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { 
  HeartHandshake, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Activity,
  PhoneCall
} from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, toast } = useAuth();
  const { t } = useLanguage();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const role = user?.role?.toLowerCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white transition-colors duration-200">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-slate-900 text-emerald-400 border-slate-700'
                : toast.type === 'error'
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-white shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Single Role-Based Navbar */}
      <Navbar openAuthModal={openAuth} />

      {/* Main Page Body: Render exclusively based on authenticated user role */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {!isAuthenticated || !user ? (
          <HomeHero onOpenAuth={() => openAuth('login')} />
        ) : role === 'driver' ? (
          <DriverDashboard />
        ) : role === 'patient' ? (
          <PatientDashboard />
        ) : role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <HomeHero onOpenAuth={() => openAuth('login')} />
        )}
      </main>

      {/* Production-Grade Clean Footer */}
      <footer className="mt-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-sm">
                {t.appTitle}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {t.appSubtitle}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-600 dark:text-slate-300 font-medium text-xs">
            <span className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 px-3 py-1 rounded-md border border-red-200 dark:border-red-900 font-bold">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{t.footerEmergencyHotline}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>24/7 Verified Medical Dispatch</span>
            </span>
          </div>

          <div className="text-center md:text-right">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {t.footerDesc}
            </p>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { X, Shield, User as UserIcon, Truck, Lock, Mail, Phone, ArrowRight, Activity } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  defaultRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  defaultRole = 'patient',
}) => {
  const { login, register, demoLogin, isLoading } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRole>(defaultRole);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ name, email, password, phone, role });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleDemo = async (demoRole: UserRole) => {
    setError(null);
    try {
      await demoLogin(demoRole);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    }
  };

  return (
    <div id="auth-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        id="auth-modal-content"
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative"
      >
        {/* Header */}
        <div className="p-6 bg-[#0f172a] dark:bg-slate-950 text-white relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-lg bg-red-600 text-white shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-300">
              {t.appTitle} Secure Portal
            </span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-white">
            {mode === 'login' ? t.authSignInTitle : t.authRegisterTitle}
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {t.authSubtitle}
          </p>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Quick Role Access Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {t.authQuickDemo}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                1-Click
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('patient')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-400 transition-all text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-red-600 mb-1" />
                <span>{t.rolePatient}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('driver')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-400 transition-all text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer"
              >
                <Truck className="w-4 h-4 text-amber-500 mb-1" />
                <span>{t.roleDriver}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('admin')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-400 transition-all text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer"
              >
                <Shield className="w-4 h-4 text-blue-500 mb-1" />
                <span>{t.roleAdmin}</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.authFullName}</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Arun Sharma"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.phone}</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.authSelectRole}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['patient', 'driver', 'admin'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-1.5 text-xs font-bold rounded-lg border uppercase transition-all cursor-pointer ${
                          role === r
                            ? 'bg-[#0f172a] dark:bg-slate-800 text-white border-[#0f172a] dark:border-slate-600'
                            : 'bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {r === 'patient' ? t.rolePatient : r === 'driver' ? t.roleDriver : t.roleAdmin}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.authEmail}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.authPassword}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 text-sm mt-4 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                t.loading
              ) : mode === 'login' ? (
                <>
                  <span>{t.authSignInBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>{t.authRegisterBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login vs Register */}
          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
            {mode === 'login' ? (
              <p>
                {t.authNoAccount}{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer"
                >
                  {t.authCreateOne}
                </button>
              </p>
            ) : (
              <p>
                {t.authHaveAccount}{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer"
                >
                  {t.authSignInBtn}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

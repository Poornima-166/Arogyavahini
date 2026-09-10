import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, Smartphone, CheckCircle2 } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'floating' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // If already installed and launched from home screen in standalone mode
  if (isInstalled) {
    if (variant === 'navbar') {
      return (
        <span 
          title="App installed in standalone mode" 
          className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>App Installed</span>
        </span>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (installed) {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 4000);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback instruction for browsers where prompt hasn't triggered yet or manual install
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {/* Navbar variant */}
      {variant === 'navbar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          id="pwa-install-nav-btn"
          title="Install Arogyavahini on your phone or desktop for an app-like offline experience"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 animate-bounce text-red-600 dark:text-red-400" />
          <span>Install App</span>
        </button>
      )}

      {/* Floating or Mobile Banner variant */}
      {variant === 'floating' && (
        <button
          type="button"
          onClick={handleInstallClick}
          id="pwa-install-floating-btn"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 shadow-xl text-xs font-semibold backdrop-blur-xs transition active:scale-95"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Install App</span>
        </button>
      )}

      {/* iOS & Manual Installation Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-slate-900 dark:text-slate-100">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">Install Arogyavahini</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add to your Home Screen for instant offline access</p>
              </div>
            </div>

            <div className="space-y-3.5 my-5 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    Tap the Share Button <Share2 className="w-4 h-4 text-blue-500 inline" />
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">In your mobile browser (Safari / Chrome), tap the Share icon located in the toolbar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    Select "Add to Home Screen" <PlusSquare className="w-4 h-4 text-emerald-500 inline" />
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Scroll through the menu options and tap "Add to Home Screen".</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Tap "Add"</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Confirm in the top right corner. The Arogyavahini icon will appear on your phone home screen.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-sm transition shadow-lg shadow-red-600/30"
              >
                Got It, Thank You
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-2xl text-xs font-bold animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>Arogyavahini installed to your home screen!</span>
        </div>
      )}
    </>
  );
};

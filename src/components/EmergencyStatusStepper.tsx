import React from 'react';
import { EmergencyStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { AlertCircle, CheckCircle2, Navigation, Truck, UserCheck, Hospital } from 'lucide-react';

interface StepperProps {
  currentStatus: EmergencyStatus;
}

export const EmergencyStatusStepper: React.FC<StepperProps> = ({ currentStatus }) => {
  const { t } = useLanguage();

  const STEPS: { status: EmergencyStatus; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
    { status: 'WAITING_FOR_DRIVER', label: t.statusWaitingForDriver, icon: AlertCircle, desc: t.statusWaitingDesc },
    { status: 'DRIVER_ACCEPTED', label: t.statusDriverAccepted, icon: UserCheck, desc: t.statusDriverAcceptedDesc },
    { status: 'ON_THE_WAY', label: t.statusOnTheWay, icon: Navigation, desc: t.statusOnTheWayDesc },
    { status: 'REACHED', label: t.statusReached, icon: CheckCircle2, desc: t.statusReachedDesc },
    { status: 'COMPLETED', label: t.statusCompleted, icon: Hospital, desc: t.statusCompletedDesc },
  ];

  const getStepIndex = (status: EmergencyStatus): number => {
    switch (status) {
      case 'WAITING_FOR_DRIVER':
        return 0;
      case 'DRIVER_ACCEPTED':
        return 1;
      case 'ON_THE_WAY':
        return 2;
      case 'REACHED':
        return 3;
      case 'COMPLETED':
        return 4;
      case 'CANCELLED':
        return -1;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  if (currentStatus === 'CANCELLED') {
    return (
      <div id="emergency-stepper-cancelled" className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-4 text-center">
        <div className="inline-flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold text-xs">
          <AlertCircle className="w-4 h-4" />
          <span>{t.statusCancelled}</span>
        </div>
        <p className="text-[11px] text-red-600 dark:text-red-300 mt-0.5">{t.statusCancelledDesc}</p>
      </div>
    );
  }

  return (
    <div id="emergency-stepper-container" className="w-full py-2">
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-between relative">
        <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 dark:bg-slate-800 -z-0 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(0, (currentIndex / (STEPS.length - 1)) * 100)}%` }}
          />
        </div>

        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.status} className="flex flex-col items-center relative z-10 w-28 text-center">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isCurrent
                    ? 'bg-[#0f172a] dark:bg-slate-800 text-amber-400 ring-4 ring-amber-100 dark:ring-amber-950/60 shadow-md animate-pulse'
                    : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 shadow-xs'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-xs mt-2 font-bold ${
                  isCurrent ? 'text-slate-900 dark:text-white' : isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {step.label}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight px-1">{step.desc}</span>
            </div>
          );
        })}
      </div>

      {/* Mobile Stepper (Vertical Flow) */}
      <div className="md:hidden space-y-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={step.status}
              className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors border ${
                isCurrent ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' : isCompleted ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900' : 'opacity-60 border-transparent'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-[#0f172a] dark:bg-slate-800 text-amber-400 animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isCurrent ? 'text-slate-900 dark:text-white' : isCompleted ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                    {step.label}
                  </span>
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 rounded">
                      {t.active}
                    </span>
                  )}
                  {isCompleted && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded">
                      {t.completed}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

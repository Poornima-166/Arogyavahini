import React from 'react';
import { EmergencyStatus } from '../types';
import { AlertCircle, CheckCircle2, Navigation, Truck, UserCheck, Hospital } from 'lucide-react';

interface StepperProps {
  currentStatus: EmergencyStatus;
}

const STEPS: { status: EmergencyStatus; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { status: 'WAITING_FOR_DRIVER', label: 'SOS Requested', icon: AlertCircle, desc: 'Waiting for driver to accept' },
  { status: 'DRIVER_ACCEPTED', label: 'Driver Accepted', icon: UserCheck, desc: 'Ambulance assigned & confirmed' },
  { status: 'ON_THE_WAY', label: 'On The Way', icon: Navigation, desc: 'En route with priority sirens' },
  { status: 'REACHED', label: 'Crew Reached', icon: CheckCircle2, desc: 'First responders at incident scene' },
  { status: 'COMPLETED', label: 'Hospital Admission', icon: Hospital, desc: 'Handover complete at trauma center' },
];

export const EmergencyStatusStepper: React.FC<StepperProps> = ({ currentStatus }) => {
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
      <div id="emergency-stepper-cancelled" className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
        <div className="inline-flex items-center gap-2 text-red-700 font-semibold text-xs">
          <AlertCircle className="w-4 h-4" />
          <span>Emergency Request Cancelled</span>
        </div>
        <p className="text-[11px] text-red-600 mt-0.5">This request was terminated or closed.</p>
      </div>
    );
  }

  return (
    <div id="emergency-stepper-container" className="w-full py-2">
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-between relative">
        <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 -z-0 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(0, (currentIndex / (STEPS.length - 1)) * 100)}%` }}
          />
        </div>

        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.status} className="flex flex-col items-center relative z-10 w-28 text-center">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isCurrent
                    ? 'bg-[#0f172a] text-amber-400 ring-4 ring-amber-100 shadow-md animate-pulse'
                    : 'bg-white text-slate-400 border border-slate-200 shadow-xs'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-xs mt-2 font-bold ${
                  isCurrent ? 'text-slate-900' : isCompleted ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 leading-tight px-1">{step.desc}</span>
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
          const isPending = index > currentIndex;

          return (
            <div
              key={step.status}
              className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors border ${
                isCurrent ? 'bg-amber-50/70 border-amber-200' : isCompleted ? 'bg-emerald-50/50 border-emerald-100' : 'opacity-60 border-transparent'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-[#0f172a] text-amber-400 animate-pulse'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isCurrent ? 'text-slate-900' : isCompleted ? 'text-emerald-800' : 'text-slate-600'}`}>
                    {step.label}
                  </span>
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 rounded">
                      Active
                    </span>
                  )}
                  {isCompleted && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded">
                      Done
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

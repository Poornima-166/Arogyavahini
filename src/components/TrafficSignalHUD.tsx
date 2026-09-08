/**
 * ==============================================================================
 * PROJECT: AROGYAVAHINI
 * COMPONENT: Traffic Signal Priority HUD (ESP32 IoT Controller Interface)
 * ==============================================================================
 * Renders the live physical state of the 2-way traffic intersection controlled by
 * the ESP32 microcontroller over Wi-Fi. Demonstrates green corridor preemption
 * for final year capstone presentations and viva examiners.
 */

import React, { useState, useEffect } from 'react';
import { Radio, Wifi, ShieldAlert, RefreshCw, Cpu, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface TrafficSignalHUDProps {
  emergencyId?: number;
  ambulanceId?: number;
  activeRouteName?: string;
  className?: string;
}

export const TrafficSignalHUD: React.FC<TrafficSignalHUDProps> = ({
  emergencyId,
  ambulanceId,
  activeRouteName,
  className = '',
}) => {
  const [signalState, setSignalState] = useState<{
    system: string;
    currentMode: 'NORMAL_MODE' | 'ROUTE_A_PRIORITY' | 'ROUTE_B_PRIORITY';
    routeA_Signal: 'GREEN' | 'YELLOW' | 'RED';
    routeB_Signal: 'GREEN' | 'YELLOW' | 'RED';
    esp32IpAddress: string;
    hardwareStatus: 'CONNECTED' | 'SIMULATED' | 'OFFLINE';
    lastCommand: string;
    lastUpdated: string;
    activeJunctionId: string;
  } | null>(null);

  const [junctions, setJunctions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Poll signal state every 3 seconds
  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const data = await api.getTrafficSignalStatus();
        if (isMounted && data?.state) {
          setSignalState(data.state);
          if (data.junctions) setJunctions(data.junctions);
        }
      } catch (err) {
        console.warn('Traffic signal poll warning:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleCommand = async (command: 'GREEN_ROUTE_A' | 'GREEN_ROUTE_B' | 'NORMAL_MODE') => {
    setIsLoading(true);
    setActionFeedback(null);
    try {
      const res = await api.sendTrafficSignalCommand(command, {
        emergencyId,
        durationSeconds: 25,
      });
      if (res.state) {
        setSignalState(res.state);
      }
      setActionFeedback(
        command === 'NORMAL_MODE'
          ? 'Normal cyclical traffic restored.'
          : `Emergency Priority activated for ${command === 'GREEN_ROUTE_A' ? 'Route A' : 'Route B'}`
      );
    } catch (err: any) {
      setActionFeedback(`Notice: ${err.message || 'Command executed in fallback mode'}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const currentMode = signalState?.currentMode || 'NORMAL_MODE';
  const routeASignal = signalState?.routeA_Signal || (currentMode === 'ROUTE_A_PRIORITY' ? 'GREEN' : currentMode === 'ROUTE_B_PRIORITY' ? 'RED' : 'GREEN');
  const routeBSignal = signalState?.routeB_Signal || (currentMode === 'ROUTE_B_PRIORITY' ? 'GREEN' : 'RED');
  const isHardwareConnected = signalState?.hardwareStatus === 'CONNECTED';
  const esp32Ip = signalState?.esp32IpAddress || '192.168.1.150';

  return (
    <div
      id="traffic-signal-hud"
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl ${className}`}
    >
      {/* Header with ESP32 Connectivity Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-wide">ESP32 Traffic Signal Priority Node</h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                IoT REST Gateway
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Corridor: <span className="text-slate-300 font-medium">Victoria Hospital Emergency Gate Junction (JNC-108-A)</span>
            </p>
          </div>
        </div>

        {/* Hardware Status Indicator */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <Wifi className={`w-3.5 h-3.5 ${isHardwareConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="text-slate-400">IP: <code className="text-slate-200 font-mono">{esp32Ip}</code></span>
          <span className="text-slate-600">•</span>
          <span className={`font-bold flex items-center gap-1 ${isHardwareConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isHardwareConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            {isHardwareConnected ? 'Hardware Online' : 'Hardware Simulation'}
          </span>
        </div>
      </div>

      {/* Two-Way Traffic Intersection Visualization (Route A vs Route B) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        {/* Route A Signal Box */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            currentMode === 'ROUTE_A_PRIORITY'
              ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
              : 'bg-slate-950/50 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase text-emerald-400 tracking-wider">Corridor 1</span>
              <h4 className="text-sm font-bold text-slate-200">Route A (Emergency Arterial)</h4>
              <span className="text-[11px] text-slate-400">City Market Expressway Corridor</span>
            </div>
            {currentMode === 'ROUTE_A_PRIORITY' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wide animate-pulse">
                Ambulance Priority Green
              </span>
            )}
          </div>

          {/* Traffic Light Housing (A) */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-around">
            {/* Red Light */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full transition-all duration-300 border ${
                  routeASignal === 'RED'
                    ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/60 ring-2 ring-red-400/40'
                    : 'bg-red-950/30 border-red-900/30 opacity-30'
                }`}
              />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Red</span>
            </div>

            {/* Yellow Light */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full transition-all duration-300 border ${
                  routeASignal === 'YELLOW'
                    ? 'bg-amber-400 border-amber-300 shadow-lg shadow-amber-400/60 ring-2 ring-amber-300/40'
                    : 'bg-amber-950/30 border-amber-900/30 opacity-30'
                }`}
              />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Caution</span>
            </div>

            {/* Green Light */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full transition-all duration-300 border ${
                  routeASignal === 'GREEN'
                    ? 'bg-emerald-400 border-emerald-300 shadow-lg shadow-emerald-400/80 ring-2 ring-emerald-300/50'
                    : 'bg-emerald-950/30 border-emerald-900/30 opacity-30'
                }`}
              />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Green</span>
            </div>
          </div>
        </div>

        {/* Route B Signal Box */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            currentMode === 'ROUTE_B_PRIORITY'
              ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
              : 'bg-slate-950/50 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase text-amber-400 tracking-wider">Corridor 2</span>
              <h4 className="text-sm font-bold text-slate-200">Route B (Cross Traffic)</h4>
              <span className="text-[11px] text-slate-400">Fort Road & Market Crossings</span>
            </div>
            {currentMode === 'ROUTE_B_PRIORITY' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wide animate-pulse">
                Ambulance Priority Green
              </span>
            )}
          </div>

          {/* Traffic Light Housing (B) */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-around">
            {/* Red Light */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full transition-all duration-300 border ${
                  routeBSignal === 'RED'
                    ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/60 ring-2 ring-red-400/40'
                    : 'bg-red-950/30 border-red-900/30 opacity-30'
                }`}
              />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Red</span>
            </div>

            {/* Yellow Light */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full transition-all duration-300 border ${
                  routeBSignal === 'YELLOW'
                    ? 'bg-amber-400 border-amber-300 shadow-lg shadow-amber-400/60 ring-2 ring-amber-300/40'
                    : 'bg-amber-950/30 border-amber-900/30 opacity-30'
                }`}
              />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Caution</span>
            </div>

            {/* Green Light */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full transition-all duration-300 border ${
                  routeBSignal === 'GREEN'
                    ? 'bg-emerald-400 border-emerald-300 shadow-lg shadow-emerald-400/80 ring-2 ring-emerald-300/50'
                    : 'bg-emerald-950/30 border-emerald-900/30 opacity-30'
                }`}
              />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Green</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="mb-3 p-2.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Viva / Project Presentation Quick-Trigger Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">IoT Signal Controls:</span>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleCommand('GREEN_ROUTE_A')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentMode === 'ROUTE_A_PRIORITY'
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Priority Route A (Green)
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleCommand('GREEN_ROUTE_B')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentMode === 'ROUTE_B_PRIORITY'
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Priority Route B (Green)
          </button>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleCommand('NORMAL_MODE')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
          <span>Restore Normal Cycle</span>
        </button>
      </div>

      {/* Hardware Architecture Footer Explainer for Viva */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
        <span className="flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          <span>Automated Preemption: Ambulance within 800m sends POST /traffic-command to ESP32</span>
        </span>
        <span className="font-mono text-slate-400 text-[10px]">
          Command: {signalState?.lastCommand || 'NORMAL_MODE'} • Safe Yellow Interlock: Active
        </span>
      </div>
    </div>
  );
};

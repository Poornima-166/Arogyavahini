import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Navigation,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  MapPin,
  Play,
  Square,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Radio,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { RouteOption, NavigationInstruction } from '../types';
import {
  generateRouteNavigationSteps,
  speakInstruction,
  cancelSpeech,
  isTextToSpeechSupported,
  isSpeechRecognitionSupported,
  isAmbulanceOffRoute,
  calculateHaversineDistanceMeters,
} from '../utils/voiceNavigation';

interface VoiceNavigationHUDProps {
  route: RouteOption | null;
  stage: 'TO_PATIENT' | 'TO_HOSPITAL';
  destinationName: string;
  isMissionAccepted: boolean;
  driverCoords?: { latitude: number; longitude: number; speed?: number | null } | null;
  onStartNavigation?: () => void;
  onStopNavigation?: () => void;
  onMarkReached?: () => void;
  onUpdateStatus?: () => void;
  onShowRoute?: () => void;
  onRouteRecalculateNeeded?: () => void;
  missionStatus?: string;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const VoiceNavigationHUD: React.FC<VoiceNavigationHUDProps> = ({
  route,
  stage,
  destinationName,
  isMissionAccepted,
  driverCoords,
  onStartNavigation,
  onStopNavigation,
  onMarkReached,
  onUpdateStatus,
  onShowRoute,
  onRouteRecalculateNeeded,
  missionStatus = 'DRIVER_ACCEPTED',
  showToast,
}) => {
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceCommandFeedback, setVoiceCommandFeedback] = useState<string | null>(null);
  const [recognizedTranscript, setRecognizedTranscript] = useState<string>('');
  const [offRouteDetected, setOffRouteDetected] = useState<boolean>(false);
  const [offRouteDeviationMeters, setOffRouteDeviationMeters] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const autoProgressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRecalculateTimeRef = useRef<number>(0);

  const ttsSupported = isTextToSpeechSupported();
  const sttSupported = isSpeechRecognitionSupported();

  // Generate steps based on route and stage
  const steps: NavigationInstruction[] = React.useMemo(() => {
    return generateRouteNavigationSteps(route, stage, destinationName);
  }, [route, stage, destinationName]);

  const currentInstruction: NavigationInstruction = steps[currentStepIndex] || steps[0];

  // Helper to speak current instruction
  const announceInstruction = useCallback(
    (index: number) => {
      const targetStep = steps[index];
      if (!targetStep) return;

      if (!isMuted && ttsSupported) {
        setIsSpeaking(true);
        speakInstruction(targetStep.text, false, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
    },
    [steps, isMuted, ttsSupported]
  );

  // Auto progression when voice navigation is active
  useEffect(() => {
    if (!isVoiceActive) {
      if (autoProgressTimerRef.current) clearInterval(autoProgressTimerRef.current);
      return;
    }

    // Interval to simulate moving along route steps
    autoProgressTimerRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          const nextIndex = prev + 1;
          announceInstruction(nextIndex);
          return nextIndex;
        }
        return prev;
      });
    }, 9000); // Progress every 9 seconds

    return () => {
      if (autoProgressTimerRef.current) clearInterval(autoProgressTimerRef.current);
    };
  }, [isVoiceActive, steps.length, announceInstruction]);

  // Handle stage change: reset step index
  useEffect(() => {
    setCurrentStepIndex(0);
  }, [stage]);

  // Real GPS deviation and dynamic step progress watcher
  useEffect(() => {
    if (!isVoiceActive || !driverCoords || !route?.coordinates || route.coordinates.length < 2) {
      setOffRouteDetected(false);
      return;
    }

    // 1. Check off-route deviation (> 150m)
    const { isOffRoute, deviationMeters } = isAmbulanceOffRoute(driverCoords, route.coordinates, 150);
    setOffRouteDetected(isOffRoute);
    setOffRouteDeviationMeters(deviationMeters);

    if (isOffRoute) {
      const now = Date.now();
      // Debounce recalculation: maximum once per 15 seconds
      if (now - lastRecalculateTimeRef.current > 15000) {
        lastRecalculateTimeRef.current = now;
        speakInstruction('Route deviation detected. Recalculating fastest response path.', isMuted);
        if (showToast) {
          showToast(`Route deviation detected (${deviationMeters}m off corridor). Auto-recalculating...`, 'info');
        }
        if (onRouteRecalculateNeeded) {
          onRouteRecalculateNeeded();
        }
      }
    }
  }, [driverCoords, isVoiceActive, route?.coordinates, isMuted, onRouteRecalculateNeeded, showToast]);

  // Toggle Voice Navigation Start/Stop
  const handleToggleVoiceNavigation = () => {
    if (isVoiceActive) {
      setIsVoiceActive(false);
      cancelSpeech();
      setIsSpeaking(false);
      if (onStopNavigation) onStopNavigation();
      if (showToast) showToast('Voice Navigation paused', 'info');
    } else {
      setIsVoiceActive(true);
      if (onStartNavigation) onStartNavigation();
      announceInstruction(currentStepIndex);
      if (showToast) showToast('Voice Navigation started with turn-by-turn spoken guidance', 'success');
    }
  };

  // Toggle Mute / Unmute
  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      speakInstruction('Voice navigation unmuted.', false);
      if (showToast) showToast('Voice navigation unmuted', 'info');
    } else {
      cancelSpeech();
      setIsSpeaking(false);
      setIsMuted(true);
      if (showToast) showToast('Voice navigation muted', 'info');
    }
  };

  // Next / Prev Step
  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const next = currentStepIndex + 1;
      setCurrentStepIndex(next);
      announceInstruction(next);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prev = currentStepIndex - 1;
      setCurrentStepIndex(prev);
      announceInstruction(prev);
    }
  };

  // Voice Command Processing
  const processVoiceCommand = useCallback(
    (rawTranscript: string) => {
      const cmd = rawTranscript.trim().toLowerCase();
      setRecognizedTranscript(cmd);

      // 1. "start navigation"
      if (cmd.includes('start navigation') || cmd.includes('start journey') || cmd.includes('begin navigation')) {
        setIsVoiceActive(true);
        if (onStartNavigation) onStartNavigation();
        announceInstruction(0);
        setVoiceCommandFeedback('Command executed: Start Navigation');
        speakInstruction('Starting navigation.', isMuted);
        if (showToast) showToast('🎤 Voice Command: "Start Navigation"', 'success');
        return;
      }

      // 2. "stop navigation"
      if (cmd.includes('stop navigation') || cmd.includes('stop voice') || cmd.includes('pause navigation')) {
        setIsVoiceActive(false);
        cancelSpeech();
        if (onStopNavigation) onStopNavigation();
        setVoiceCommandFeedback('Command executed: Stop Navigation');
        speakInstruction('Navigation stopped.', isMuted);
        if (showToast) showToast('🎤 Voice Command: "Stop Navigation"', 'info');
        return;
      }

      // 3. "mute voice"
      if (cmd.includes('mute voice') || cmd === 'mute' || cmd.includes('silence')) {
        cancelSpeech();
        setIsMuted(true);
        setVoiceCommandFeedback('Command executed: Mute Voice');
        if (showToast) showToast('🎤 Voice Command: "Mute Voice"', 'info');
        return;
      }

      // 4. "unmute voice"
      if (cmd.includes('unmute voice') || cmd === 'unmute' || cmd.includes('enable voice')) {
        setIsMuted(false);
        setVoiceCommandFeedback('Command executed: Unmute Voice');
        speakInstruction('Voice unmuted.', false);
        if (showToast) showToast('🎤 Voice Command: "Unmute Voice"', 'success');
        return;
      }

      // 5. "mark as reached"
      if (cmd.includes('mark as reached') || cmd.includes('reached') || cmd.includes('arrived')) {
        if (onMarkReached) onMarkReached();
        setVoiceCommandFeedback('Command executed: Mark as Reached');
        speakInstruction('Location marked as reached.', isMuted);
        if (showToast) showToast('🎤 Voice Command: "Mark as Reached"', 'success');
        return;
      }

      // 6. "update status"
      if (cmd.includes('update status') || cmd.includes('next status') || cmd.includes('advance status')) {
        if (onUpdateStatus) onUpdateStatus();
        setVoiceCommandFeedback('Command executed: Update Status');
        speakInstruction('Updating mission status.', isMuted);
        if (showToast) showToast('🎤 Voice Command: "Update Status"', 'success');
        return;
      }

      // 7. "show route"
      if (cmd.includes('show route') || cmd.includes('view route') || cmd.includes('route map')) {
        if (onShowRoute) onShowRoute();
        setVoiceCommandFeedback('Command executed: Show Route');
        speakInstruction('Displaying route.', isMuted);
        if (showToast) showToast('🎤 Voice Command: "Show Route"', 'info');
        return;
      }

      // Unrecognized
      setVoiceCommandFeedback(`Unrecognized command: "${cmd}". Try: "Start navigation", "Mute voice", "Mark as reached".`);
    },
    [onStartNavigation, onStopNavigation, onMarkReached, onUpdateStatus, onShowRoute, announceInstruction, isMuted, showToast]
  );

  // Initialize Speech Recognition
  const toggleListening = () => {
    if (!sttSupported) {
      if (showToast) {
        showToast('Speech recognition is not supported in this browser. Please use manual controls.', 'error');
      }
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsListening(false);
      setVoiceCommandFeedback(null);
    } else {
      try {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setVoiceCommandFeedback('Listening for commands... Speak clearly.');
        };

        recognition.onresult = (event: any) => {
          const lastResult = event.results[event.results.length - 1];
          if (lastResult && lastResult[0]) {
            const transcript = lastResult[0].transcript;
            processVoiceCommand(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setVoiceCommandFeedback('Microphone permission denied. Please allow microphone access.');
          } else {
            setVoiceCommandFeedback(`Voice error: ${event.error}. Manual controls active.`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error('Failed to initialize speech recognition:', err);
        setIsListening(false);
        setVoiceCommandFeedback('Speech recognition failed to start. Use manual controls.');
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  // Maneuver Icon Resolver
  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver) {
      case 'turn-left':
        return <CornerUpLeft className="w-6 h-6 text-amber-400 animate-pulse" />;
      case 'turn-right':
        return <CornerUpRight className="w-6 h-6 text-amber-400 animate-pulse" />;
      case 'approaching':
        return <Flag className="w-6 h-6 text-red-400 animate-bounce" />;
      case 'reached':
        return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
      case 'start':
        return <Navigation className="w-6 h-6 text-blue-400" />;
      case 'straight':
      default:
        return <ArrowUp className="w-6 h-6 text-blue-400" />;
    }
  };

  if (!isMissionAccepted) {
    return null;
  }

  return (
    <div
      id="voice-navigation-hud"
      className="bg-slate-900 border border-slate-700/80 rounded-2xl p-3.5 sm:p-4 shadow-xl text-white space-y-3"
    >
      {/* HUD Header Bar: Status & Primary Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
              isVoiceActive
                ? 'bg-blue-600/30 border-blue-500/40 text-blue-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Radio className={`w-4 h-4 ${isVoiceActive ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                Voice-Assisted Navigation
              </span>
              {isVoiceActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white">
              {stage === 'TO_PATIENT' ? 'Stage 1: En Route to Patient' : 'Stage 2: Hospital Transfer'}
            </h4>
          </div>
        </div>

        {/* Action Controls Group: Start/Stop, Mute/Unmute, Mic for Commands */}
        <div className="flex items-center gap-2">
          {/* Start / Stop Voice Navigation Button */}
          <button
            id="btn-toggle-voice-navigation"
            type="button"
            onClick={handleToggleVoiceNavigation}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
              isVoiceActive
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
            title={isVoiceActive ? 'Stop Voice Navigation' : 'Start Voice Navigation'}
          >
            {isVoiceActive ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isVoiceActive ? 'Stop Voice Navigation' : 'Start Voice Navigation'}</span>
          </button>

          {/* Mute / Unmute Button */}
          <button
            id="btn-toggle-voice-mute"
            type="button"
            onClick={handleToggleMute}
            className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              isMuted
                ? 'bg-red-950/60 border-red-800 text-red-300 hover:bg-red-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute Voice' : 'Mute Voice'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
          </button>

          {/* Microphone Button (Voice Commands) */}
          <button
            id="btn-driver-voice-commands"
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              isListening
                ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/40 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title={
              sttSupported
                ? isListening
                  ? 'Listening for Voice Commands... Click to stop.'
                  : 'Click to speak voice commands (e.g., "Start navigation", "Mark as reached")'
                : 'Voice recognition not supported in this browser'
            }
          >
            {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Off-Route Alert Banner */}
      {offRouteDetected && (
        <div
          id="off-route-recalculation-alert"
          className="bg-amber-950/80 border border-amber-500/60 rounded-xl p-2.5 flex items-center justify-between gap-2 text-amber-200 text-xs animate-pulse"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Off-Route Detected:</strong> Vehicle is {offRouteDeviationMeters}m off active emergency corridor. Recalculating...
            </span>
          </div>
          {onRouteRecalculateNeeded && (
            <button
              type="button"
              onClick={onRouteRecalculateNeeded}
              className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shrink-0 cursor-pointer"
            >
              Recalculate
            </button>
          )}
        </div>
      )}

      {/* Main Instruction Display Banner (Clearly Displayed on Map Screen) */}
      <div
        id="current-navigation-instruction-display"
        className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-inner"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow">
            {getManeuverIcon(currentInstruction.maneuver)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">
                {currentInstruction.distanceText}
              </span>
              <span className="text-[11px] text-slate-400">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              {isSpeaking && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold animate-pulse">
                  <Volume2 className="w-3 h-3" /> Speaking
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5 leading-snug">
              {currentInstruction.text}
            </p>
          </div>
        </div>

        {/* Step Navigation Controls (Prev / Next manual overrides) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
            title="Previous step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextStep}
            disabled={currentStepIndex === steps.length - 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
            title="Next step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-500 rounded-full"
          style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Voice Recognition Feedback & Fallback Banner */}
      {!sttSupported && (
        <div className="px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Speech recognition is not supported in this browser. All manual navigation controls are fully functional.
          </span>
        </div>
      )}

      {isListening && (
        <div className="px-3 py-2 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
            <span className="font-semibold">Listening for commands:</span>
            <span className="text-[11px] text-slate-300">
              "Start navigation", "Stop navigation", "Show route", "Mute voice", "Unmute voice", "Mark as reached", "Update status"
            </span>
          </div>
          <button
            type="button"
            onClick={toggleListening}
            className="text-[10px] uppercase font-bold text-red-400 hover:text-white px-2 py-0.5 rounded bg-red-900/40 cursor-pointer"
          >
            Stop Mic
          </button>
        </div>
      )}

      {voiceCommandFeedback && (
        <div className="px-3 py-1.5 rounded-lg bg-blue-950/50 border border-blue-800/40 text-[11px] text-blue-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>{voiceCommandFeedback}</span>
        </div>
      )}
    </div>
  );
};

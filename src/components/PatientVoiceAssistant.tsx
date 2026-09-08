import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
  Navigation,
  PhoneCall,
  HeartPulse,
  Building2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  CornerDownRight,
} from 'lucide-react';
import { EmergencyRequest } from '../types';
import { speakInstruction, cancelSpeech, isTextToSpeechSupported, isSpeechRecognitionSupported } from '../utils/voiceNavigation';
import { useLanguage } from '../context/LanguageContext';

interface PatientVoiceAssistantProps {
  activeEmergency: EmergencyRequest | null;
  distanceKm: number | null;
  etaMinutes: number | null;
  isWithin2Km: boolean;
  onOpenFirstAid?: () => void;
  onOpenVoiceSymptoms?: () => void;
  onCallDriver?: () => void;
  onCancelEmergency?: () => void;
  onCheckProximity?: () => void;
}

interface QuickVoicePrompt {
  id: string;
  label: string;
  command: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PatientVoiceAssistant: React.FC<PatientVoiceAssistantProps> = ({
  activeEmergency,
  distanceKm,
  etaMinutes,
  isWithin2Km,
  onOpenFirstAid,
  onOpenVoiceSymptoms,
  onCallDriver,
  onCancelEmergency,
  onCheckProximity,
}) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [assistantReply, setAssistantReply] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [recognizedCommandType, setRecognizedCommandType] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isComponentMounted = useRef<boolean>(true);

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      cancelSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // Voice language code based on app context
  const getRecognitionLang = (): string => {
    if (language === 'kn') return 'kn-IN';
    if (language === 'hi') return 'hi-IN';
    return 'en-IN';
  };

  // Helper to speak response aloud
  const speakResponse = useCallback(
    (text: string) => {
      setAssistantReply(text);
      if (isMuted || !isTextToSpeechSupported()) return;

      setIsSpeaking(true);
      speakInstruction(text, false, {
        onStart: () => {
          if (isComponentMounted.current) setIsSpeaking(true);
        },
        onEnd: () => {
          if (isComponentMounted.current) setIsSpeaking(false);
        },
        onError: () => {
          if (isComponentMounted.current) setIsSpeaking(false);
        },
      });
    },
    [isMuted]
  );

  // Command processing engine
  const processVoiceCommand = useCallback(
    (spokenText: string) => {
      const text = spokenText.toLowerCase().trim();
      setTranscript(spokenText);

      // 1. Where is the ambulance / ETA / Distance command
      if (
        text.includes('where') ||
        text.includes('ambulance') ||
        text.includes('status') ||
        text.includes('eta') ||
        text.includes('far') ||
        text.includes('distance') ||
        text.includes('ಎಲ್ಲಿದೆ') ||
        text.includes('ಆಂಬ್ಯುಲೆನ್ಸ್') ||
        text.includes('कहाँ') ||
        text.includes('दूरी')
      ) {
        setRecognizedCommandType('AMBULANCE_STATUS');
        if (!activeEmergency) {
          speakResponse('There is currently no active emergency dispatch in progress.');
          return;
        }

        const dist = distanceKm !== null ? `${distanceKm.toFixed(1)} kilometers` : `${activeEmergency.current_distance_km || 3.2} kilometers`;
        const eta = etaMinutes !== null ? `${etaMinutes} minutes` : `${activeEmergency.current_eta_minutes || 6} minutes`;
        const unit = activeEmergency.vehicle_number || 'Emergency Unit';
        const proximityNote = isWithin2Km ? 'It is currently within your 2 kilometer proximity safety zone.' : '';

        if (language === 'kn') {
          speakResponse(`ಆಂಬ್ಯುಲೆನ್ಸ್ ${unit} ಪ್ರಸ್ತುತ ${dist} ದೂರದಲ್ಲಿದೆ. ಅಂದಾಜು ಆಗಮನ ${eta}ಗಳಲ್ಲಿ. ${isWithin2Km ? 'ಇದು 2 ಕಿಲೋಮೀಟರ್ ಒಳಗೆ ಬಂದಿದೆ.' : ''}`);
        } else if (language === 'hi') {
          speakResponse(`एम्बुलेंस ${unit} वर्तमान में ${dist} दूर है। अनुमानित समय ${eta} है। ${isWithin2Km ? 'यह 2 किलोमीटर के दायरे में है।' : ''}`);
        } else {
          speakResponse(`Ambulance ${unit} is currently ${dist} away with an estimated arrival in ${eta}. ${proximityNote}`);
        }
        if (onCheckProximity) onCheckProximity();
        return;
      }

      // 2. Proximity specific command (Within 2 km)
      if (
        text.includes('2 km') ||
        text.includes('2km') ||
        text.includes('nearby') ||
        text.includes('proximity') ||
        text.includes('close') ||
        text.includes('ಹತ್ತಿರ') ||
        text.includes('समीप') ||
        text.includes('पास')
      ) {
        setRecognizedCommandType('PROXIMITY_CHECK');
        const dist = distanceKm !== null ? distanceKm : (activeEmergency?.current_distance_km || 2.4);
        if (dist <= 2.0) {
          speakResponse(`Yes! The ambulance is inside the 2-kilometer zone, approximately ${dist.toFixed(1)} km away.`);
        } else {
          speakResponse(`The ambulance is currently ${dist.toFixed(1)} km away, approaching the 2-kilometer threshold.`);
        }
        if (onCheckProximity) onCheckProximity();
        return;
      }

      // 3. Call Driver command
      if (
        text.includes('call') ||
        text.includes('driver') ||
        text.includes('phone') ||
        text.includes('contact') ||
        text.includes('ಚಾಲಕ') ||
        text.includes('ಡ್ರೈವರ್') ||
        text.includes('चालक') ||
        text.includes('फ़ೋನ್')
      ) {
        setRecognizedCommandType('CALL_DRIVER');
        if (activeEmergency?.driver_phone) {
          speakResponse(`Connecting you to ambulance driver ${activeEmergency.driver_name || 'crew'} at ${activeEmergency.driver_phone}.`);
          if (onCallDriver) onCallDriver();
        } else {
          speakResponse('Driver contact information is being assigned by the dispatch center.');
        }
        return;
      }

      // 4. First Aid Guidance command
      if (
        text.includes('first aid') ||
        text.includes('what should i do') ||
        text.includes('help') ||
        text.includes('cpr') ||
        text.includes('bleeding') ||
        text.includes('ಉಸಿರಾಟ') ||
        text.includes('ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ') ||
        text.includes('प्राथमिक') ||
        text.includes('मदद')
      ) {
        setRecognizedCommandType('FIRST_AID');
        speakResponse('Keep the patient calm and in a safe position. Loosen tight clothing and do not administer food or liquids. The first aid guide is displayed on your screen.');
        if (onOpenFirstAid) onOpenFirstAid();
        return;
      }

      // 5. Update Symptoms / Voice Notes command
      if (
        text.includes('symptom') ||
        text.includes('worse') ||
        text.includes('record') ||
        text.includes('note') ||
        text.includes('ಲಕ್ಷಣ') ||
        text.includes('ಸ್ಥಿತಿ') ||
        text.includes('लक्षण')
      ) {
        setRecognizedCommandType('UPDATE_SYMPTOMS');
        speakResponse('Opening the voice symptom recorder so you can update the emergency medical crew.');
        if (onOpenVoiceSymptoms) onOpenVoiceSymptoms();
        return;
      }

      // 6. Hospital Info command
      if (
        text.includes('hospital') ||
        text.includes('destination') ||
        text.includes('bed') ||
        text.includes('ಆಸ್ಪತ್ರೆ') ||
        text.includes('अस्पताल')
      ) {
        setRecognizedCommandType('HOSPITAL_INFO');
        const hospName = activeEmergency?.selected_hospital || 'Central Multispecialty Trauma Hospital';
        speakResponse(`Destination hospital is ${hospName} with 24/7 critical emergency bay and green corridor clearance enabled.`);
        return;
      }

      // 7. Cancel Emergency command
      if (
        text.includes('cancel') ||
        text.includes('stop') ||
        text.includes('ರದ್ದು') ||
        text.includes('रद्द')
      ) {
        setRecognizedCommandType('CANCEL_EMERGENCY');
        speakResponse('To cancel this emergency dispatch, please tap the confirmation button on your screen.');
        if (onCancelEmergency) onCancelEmergency();
        return;
      }

      // Default Help / Unrecognized
      setRecognizedCommandType('HELP');
      speakResponse(`Command received: "${spokenText}". You can say: Where is my ambulance? Check 2 km proximity, Call driver, or First aid help.`);
    },
    [activeEmergency, distanceKm, etaMinutes, isWithin2Km, language, onCallDriver, onCheckProximity, onCancelEmergency, onOpenFirstAid, onOpenVoiceSymptoms, speakResponse]
  );

  // Toggle voice recognition
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      speakResponse('Speech recognition is not supported in this browser. Please tap the quick voice command chips below.');
      return;
    }

    try {
      const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechClass();
      recognitionRef.current = recognition;

      recognition.lang = getRecognitionLang();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        cancelSpeech();
      };

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        processVoiceCommand(spoken);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsListening(false);
      speakResponse('Unable to access microphone. Tap any command chip below instead.');
    }
  };

  // Quick Command Chips
  const quickPrompts: QuickVoicePrompt[] = [
    {
      id: 'where_amb',
      label: 'Where is ambulance?',
      command: 'Where is the ambulance and what is the ETA?',
      icon: Navigation,
    },
    {
      id: 'check_2km',
      label: 'Check 2 km proximity',
      command: 'Is the ambulance within 2 kilometers?',
      icon: Radio,
    },
    {
      id: 'call_driver',
      label: 'Call Driver',
      command: 'Call the ambulance driver',
      icon: PhoneCall,
    },
    {
      id: 'first_aid',
      label: 'First Aid Help',
      command: 'What first aid should I give?',
      icon: HeartPulse,
    },
    {
      id: 'hospital_info',
      label: 'Which Hospital?',
      command: 'Which hospital is the ambulance going to?',
      icon: Building2,
    },
    {
      id: 'update_symptoms',
      label: 'Update Symptoms',
      command: 'I want to update my symptoms',
      icon: Sparkles,
    },
  ];

  return (
    <div 
      id="patient-voice-assistant-card"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4"
    >
      {/* Header bar with Status & Mute */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Patient Voice Commands & AI Assistant
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
                Speech AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Speak or tap commands for hands-free ambulance tracking, 2km radar alerts, & emergency triage
            </p>
          </div>
        </div>

        {/* Audio Mute toggle */}
        <button
          type="button"
          id="btn-voice-assistant-mute"
          onClick={() => {
            if (!isMuted) cancelSpeech();
            setIsMuted(!isMuted);
          }}
          className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
            isMuted
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          }`}
          title={isMuted ? 'Unmute voice assistant answers' : 'Mute voice assistant answers'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Voice On'}</span>
        </button>
      </div>

      {/* Interactive Microphone Listening Trigger & Pulse */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          id="btn-patient-voice-mic-toggle"
          onClick={toggleListening}
          className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-500/30 animate-pulse'
              : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>Listening... (Tap to stop)</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-red-500" />
              <span>Tap to Speak Voice Command</span>
            </>
          )}
        </button>

        {/* Listening wave bars or state badge */}
        <div className="flex-1 flex items-center justify-between w-full text-xs text-slate-500 dark:text-slate-400 px-2">
          {isListening ? (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span>Listening for "Where is ambulance?", "Check 2km", "Call driver"...</span>
            </div>
          ) : isSpeaking ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Volume2 className="w-4 h-4 animate-bounce" />
              <span>Speaking audio response...</span>
            </div>
          ) : (
            <span className="text-[11px]">
              Ready. Say <span className="font-semibold text-slate-700 dark:text-slate-200">"Where's my ambulance?"</span> or tap below.
            </span>
          )}
        </div>
      </div>

      {/* Voice Transcript & Spoken Assistant Answer */}
      {(transcript || assistantReply) && (
        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs space-y-2 animate-in fade-in duration-200">
          {transcript && (
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
              <CornerDownRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-blue-900 dark:text-blue-300">You said: </span>
                <span className="italic">"{transcript}"</span>
              </div>
            </div>
          )}

          {assistantReply && (
            <div className="flex items-start gap-2 pt-2 border-t border-blue-200/60 dark:border-blue-900/60 text-slate-800 dark:text-slate-100">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white">Voice Assistant: </span>
                <span>{assistantReply}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Tap Command Chips */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
          One-Tap Voice Commands (Instant Testing & Hands-Free):
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {quickPrompts.map((prompt) => {
            const Icon = prompt.icon;
            return (
              <button
                key={prompt.id}
                type="button"
                id={`btn-voice-prompt-${prompt.id}`}
                onClick={() => processVoiceCommand(prompt.command)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200/80 dark:border-slate-700"
              >
                <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{prompt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

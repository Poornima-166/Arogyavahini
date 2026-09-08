import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  AlertOctagon,
  HeartPulse,
  Activity,
  Check,
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Clock,
  HelpCircle,
  Stethoscope,
  ShieldAlert,
  Flame,
  AlertTriangle,
  FileText,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { Language, TranslationDictionary } from '../i18n/translations';

interface VoiceSymptomRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySymptoms: (data: {
    rawTranscript: string;
    enhancedNotes: string;
    suggestedEmergencyType?: string;
    urgency?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    symptoms?: string[];
  }) => void;
  initialTranscript?: string;
  language: Language;
  t: TranslationDictionary;
}

interface QuickSymptomChip {
  id: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  suggestedType: string;
}

const QUICK_SYMPTOMS: QuickSymptomChip[] = [
  { id: 'chest_pain', label: 'Severe Chest Pain & Left Arm', category: 'Cardiac', icon: HeartPulse, suggestedType: 'Cardiac' },
  { id: 'short_breath', label: 'Difficulty Breathing / Wheezing', category: 'Respiratory', icon: Activity, suggestedType: 'Respiratory' },
  { id: 'trauma_bleed', label: 'Profuse Bleeding / Heavy Cut', category: 'Trauma', icon: ShieldAlert, suggestedType: 'Trauma' },
  { id: 'unconscious', label: 'Unresponsive / Fainted', category: 'Critical Care', icon: AlertOctagon, suggestedType: 'Critical Care' },
  { id: 'stroke_signs', label: 'Face Drooping / Slurred Speech', category: 'Critical Care', icon: AlertTriangle, suggestedType: 'Critical Care' },
  { id: 'labor_pains', label: 'Labor Contractions / Water Broke', category: 'Pregnancy', icon: HelpCircle, suggestedType: 'Pregnancy' },
  { id: 'seizure', label: 'Seizure / Violent Shaking', category: 'Critical Care', icon: Flame, suggestedType: 'Critical Care' },
  { id: 'high_fever', label: 'High Fever & Disorientation', category: 'General', icon: Stethoscope, suggestedType: 'General' },
];

export const VoiceSymptomRecorder: React.FC<VoiceSymptomRecorderProps> = ({
  isOpen,
  onClose,
  onApplySymptoms,
  initialTranscript = '',
  language,
  t,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(initialTranscript);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Analysis results
  const [triageResult, setTriageResult] = useState<{
    clinicalSummary: string;
    recommendedEmergencyType?: string;
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    symptoms: string[];
    dispatcherNotes: string;
    firstAidTip?: string;
  } | null>(null);

  // Speech Recognition and Web Audio refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Determine speech recognition language code
  const getSpeechLangCode = (lang: Language): string => {
    switch (lang) {
      case 'kn':
        return 'kn-IN';
      case 'hi':
        return 'hi-IN';
      default:
        return 'en-IN';
    }
  };

  // Sync initial transcript if opened
  useEffect(() => {
    if (isOpen) {
      if (initialTranscript) {
        setTranscript(initialTranscript);
      }
      setPermissionError(null);
    } else {
      stopRecording();
    }
  }, [isOpen, initialTranscript]);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechSupported(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, []);

  // Start Voice Recording
  const startRecording = async () => {
    setPermissionError(null);
    setInterimTranscript('');
    audioChunksRef.current = [];

    // 1. Request microphone access and setup AudioContext for live visualizer
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;

      // Setup MediaRecorder for playback backup
      try {
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const url = URL.createObjectURL(audioBlob);
            setRecordedAudioUrl(url);
          }
        };
        recorder.start(250);
        mediaRecorderRef.current = recorder;
      } catch (recErr) {
        console.warn('MediaRecorder not available or failed:', recErr);
      }

      // Setup Web Audio Analyser for smooth visual frequency waveform
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        drawWaveform();
      }
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setPermissionError(t.voiceMicPermissionError || 'Microphone access was denied. Please allow microphone permissions.');
      return;
    }

    // 2. Setup Web Speech Recognition
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = getSpeechLangCode(language);
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptChunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              currentFinal += transcriptChunk + ' ';
            } else {
              currentInterim += transcriptChunk;
            }
          }

          if (currentFinal) {
            setTranscript((prev) => (prev ? `${prev.trim()} ${currentFinal.trim()}` : currentFinal.trim()));
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition event:', event.error);
          if (event.error === 'not-allowed') {
            setPermissionError('Microphone permission blocked in browser settings.');
            stopRecording();
          }
        };

        recognition.onend = () => {
          // If still marked as recording, restart (keeps listening even during slight pauses)
          if (isRecording && recognitionRef.current) {
            try {
              recognition.start();
            } catch {
              // Ignore restart error
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech recognition init error:', e);
      }
    } else {
      setIsRecording(true);
    }

    // Timer
    setRecordingSeconds(0);
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 60) {
          // Auto-stop at 60s
          stopRecording();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Stop Voice Recording
  const stopRecording = () => {
    setIsRecording(false);
    setInterimTranscript('');

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setAudioLevel(0);
  };

  // Draw Audio Waveform on Canvas
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!isRecording && !analyserRef.current) return;
      analyser.getByteFrequencyData(dataArray);

      // Compute average volume for glow effect
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      setAudioLevel(avg);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

        // Dynamic emergency green to red gradient depending on speech energy
        const hue = 140 - (dataArray[i] / 255) * 140; // 140 (green) to 0 (red)
        ctx.fillStyle = `hsl(${hue}, 85%, 55%)`;

        // Centered mirror waveform
        const yTop = (canvas.height - barHeight) / 2;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, yTop, barWidth - 2, Math.max(barHeight, 3), 3) : ctx.rect(x, yTop, barWidth - 2, Math.max(barHeight, 3));
        ctx.fill();

        x += barWidth + 1;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  // Add quick symptom chip text
  const handleAddSymptomChip = (chip: QuickSymptomChip) => {
    setTranscript((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return chip.label;
      if (trimmed.includes(chip.label)) return trimmed;
      return `${trimmed}. ${chip.label}`;
    });

    // Auto update suggested triage emergency type if not already set
    if (!triageResult) {
      setTriageResult({
        clinicalSummary: `Patient reported: ${chip.label}`,
        recommendedEmergencyType: chip.suggestedType,
        urgency: chip.category === 'Cardiac' || chip.category === 'Critical Care' ? 'CRITICAL' : 'HIGH',
        symptoms: [chip.label],
        dispatcherNotes: `[PATIENT SYMPTOM CHIP]: ${chip.label}\n• Priority: ${chip.suggestedType === 'Cardiac' ? 'CRITICAL' : 'HIGH'}\n• Suggested Unit: ${chip.suggestedType}`,
        firstAidTip: 'Keep patient calm and still while ambulance arrives.',
      });
    }
  };

  // Run AI / Clinical Triage Analysis on Transcript
  const handleAnalyzeSymptoms = async () => {
    const textToAnalyze = transcript.trim();
    if (!textToAnalyze) return;

    setIsAnalyzing(true);
    try {
      const res = await api.analyzeSymptoms({
        rawTranscript: textToAnalyze,
        language,
      });

      setTriageResult({
        clinicalSummary: res.clinicalSummary,
        recommendedEmergencyType: res.recommendedEmergencyType,
        urgency: res.urgency || 'HIGH',
        symptoms: res.symptoms || [],
        dispatcherNotes: res.dispatcherNotes,
        firstAidTip: res.firstAidTip,
      });
    } catch (err) {
      console.warn('Symptom triage error, applying heuristic fallback:', err);
      // Fallback
      setTriageResult({
        clinicalSummary: `Patient reported symptoms: ${textToAnalyze.slice(0, 160)}`,
        recommendedEmergencyType: textToAnalyze.toLowerCase().includes('chest') ? 'Cardiac' : 'General',
        urgency: 'HIGH',
        symptoms: ['Reported Distress'],
        dispatcherNotes: `[VOICE REPORT]: ${textToAnalyze}\n• Caller notes: Provide immediate paramedic assessment upon arrival.`,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Audio Playback toggle
  const toggleAudioPlayback = () => {
    if (!recordedAudioUrl) return;
    if (!audioElementRef.current) {
      const audio = new Audio(recordedAudioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audioElementRef.current = audio;
    }

    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // Apply to SOS Form and close
  const handleApply = () => {
    const finalRaw = transcript.trim();
    if (!finalRaw && !triageResult) {
      onClose();
      return;
    }

    const enhanced = triageResult?.dispatcherNotes
      ? triageResult.dispatcherNotes
      : `[VOICE REPORT]: ${finalRaw}`;

    onApplySymptoms({
      rawTranscript: finalRaw,
      enhancedNotes: enhanced,
      suggestedEmergencyType: triageResult?.recommendedEmergencyType,
      urgency: triageResult?.urgency,
      symptoms: triageResult?.symptoms,
    });
    onClose();
  };

  // Clear text
  const handleClear = () => {
    setTranscript('');
    setInterimTranscript('');
    setTriageResult(null);
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="voice-symptom-recorder-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-recorder-title"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto transition-all">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Mic className={`w-5 h-5 ${isRecording ? 'animate-bounce text-amber-200' : ''}`} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-bold uppercase tracking-wider text-rose-100">
                <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-300 animate-ping' : 'bg-emerald-300'}`} />
                <span>Voice-to-Text Triage</span>
              </div>
              <h3 id="voice-recorder-title" className="text-base sm:text-lg font-black tracking-tight text-white">
                {t.voiceRecordingTitle}
              </h3>
            </div>
          </div>

          <button
            id="btn-close-voice-recorder"
            type="button"
            onClick={() => {
              stopRecording();
              onClose();
            }}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Close voice recorder"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 text-slate-800 dark:text-slate-200">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.voiceRecordingSubtitle}
          </p>

          {/* Microphone Permission Warning */}
          {permissionError && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Microphone Access Error</span>
                <p className="text-[11px] leading-relaxed">{permissionError}</p>
              </div>
            </div>
          )}

          {/* Active Audio Waveform & Recording Status Area */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isRecording
              ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-900/80 shadow-inner'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-600 animate-ping' : 'bg-slate-400'}`} />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {isRecording ? t.voiceListening : transcript ? 'Speech Recorded' : 'Ready to Record'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  ({getSpeechLangCode(language)})
                </span>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <Clock className="w-3.5 h-3.5 text-red-500" />
                <span>
                  00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 01:00
                </span>
              </div>
            </div>

            {/* Live Audio Visualizer Canvas */}
            <div className="h-16 w-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-2 relative shadow-inner">
              {isRecording ? (
                <canvas ref={canvasRef} width={400} height={60} className="w-full h-full block" />
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <Mic className="w-4 h-4 text-slate-500" />
                  <span>Click "Start Voice Recording" to capture your symptoms</span>
                </div>
              )}
            </div>

            {/* Action Trigger Controls */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {!isRecording ? (
                <button
                  id="btn-start-voice-recording"
                  type="button"
                  onClick={startRecording}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-xs cursor-pointer transform hover:scale-102 active:scale-98"
                >
                  <Mic className="w-4 h-4 text-white" />
                  <span>{t.voiceStartRecording}</span>
                </button>
              ) : (
                <button
                  id="btn-stop-voice-recording"
                  type="button"
                  onClick={stopRecording}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-xs cursor-pointer animate-pulse"
                >
                  <Square className="w-4 h-4 fill-current text-red-500" />
                  <span>{t.voiceStopRecording}</span>
                </button>
              )}

              {/* Recorded Audio Replay */}
              {recordedAudioUrl && !isRecording && (
                <button
                  type="button"
                  onClick={toggleAudioPlayback}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Play back audio"
                >
                  {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingAudio ? 'Pause Audio' : 'Playback Audio'}</span>
                </button>
              )}

              {transcript && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isRecording}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.voiceClear}</span>
                </button>
              )}
            </div>
          </div>

          {/* Transcribed Symptoms Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="voice-symptom-text" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-red-600" />
                <span>{t.voiceTranscribedLabel}</span>
              </label>
              <span className="text-[10px] text-slate-400">
                You can review or edit typed words before submitting
              </span>
            </div>

            <div className="relative">
              <textarea
                id="voice-symptom-text"
                rows={3}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Example: My chest feels heavy and tight, pain spreading into left shoulder and sweating..."
                className="w-full p-3 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none leading-relaxed font-sans"
              />

              {/* Interim realtime streaming preview */}
              {interimTranscript && (
                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900/60 text-xs italic text-amber-900 dark:text-amber-300 flex items-center gap-1.5 rounded-b-xl">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <span>Transcribing live: "{interimTranscript}"</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick 1-Tap Emergency Symptom Chips */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t.voiceQuickSymptoms}
              </span>
              <span className="text-[10px] text-slate-400">Tap to instantly add critical symptoms</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_SYMPTOMS.map((chip) => {
                const Icon = chip.icon;
                const isContained = transcript.includes(chip.label);
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleAddSymptomChip(chip)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isContained
                        ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{chip.label}</span>
                    {isContained && <Check className="w-3 h-3 text-red-600 dark:text-red-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Clinical Triage / Dispatcher Context Card */}
          {triageResult ? (
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 space-y-3">
              <div className="flex items-center justify-between border-b border-blue-200/80 dark:border-blue-900/60 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                    Clinical Triage & Dispatcher Summary
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    triageResult.urgency === 'CRITICAL'
                      ? 'bg-red-600 text-white animate-pulse'
                      : triageResult.urgency === 'HIGH'
                      ? 'bg-amber-500 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {triageResult.urgency} PRIORITY
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                  {triageResult.clinicalSummary}
                </p>

                {triageResult.recommendedEmergencyType && (
                  <div className="flex items-center gap-2 pt-1 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Recommended Unit:</span>
                    <span className="font-bold text-red-700 dark:text-red-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-red-200 dark:border-red-900">
                      {triageResult.recommendedEmergencyType} Ambulance (ALS/BLS)
                    </span>
                  </div>
                )}

                {triageResult.firstAidTip && (
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2 mt-2">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span><strong>Pre-Arrival Advice:</strong> {triageResult.firstAidTip}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            transcript && !isRecording && (
              <button
                type="button"
                onClick={handleAnalyzeSymptoms}
                disabled={isAnalyzing}
                className="w-full py-2 px-3 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing clinical urgency with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{t.voiceSummarizeAi}</span>
                  </>
                )}
              </button>
            )
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              stopRecording();
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer text-center"
          >
            {t.cancel}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-apply-voice-symptoms"
              type="button"
              onClick={handleApply}
              disabled={!transcript.trim()}
              className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{t.voiceApplySymptoms}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

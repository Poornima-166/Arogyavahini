import { RouteOption, NavigationInstruction } from '../types';

/**
 * Checks if browser SpeechSynthesis (TTS) is supported
 */
export function isTextToSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Checks if browser SpeechRecognition (STT) is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/**
 * Calculates real Haversine distance in meters between two GPS coordinates
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculates minimum distance in meters from a GPS point to a line segment
 */
function distToSegmentMeters(
  pLat: number,
  pLng: number,
  vLat: number,
  vLng: number,
  wLat: number,
  wLng: number
): number {
  const l2 = Math.pow(wLat - vLat, 2) + Math.pow(wLng - vLng, 2);
  if (l2 === 0) return calculateHaversineDistanceMeters(pLat, pLng, vLat, vLng);

  // Project point onto line segment
  let t = ((pLat - vLat) * (wLat - vLat) + (pLng - vLng) * (wLng - vLng)) / l2;
  t = Math.max(0, Math.min(1, t));

  const projLat = vLat + t * (wLat - vLat);
  const projLng = vLng + t * (wLng - vLng);
  return calculateHaversineDistanceMeters(pLat, pLng, projLat, projLng);
}

/**
 * Finds distance in meters from an ambulance GPS point to the closest point along the route polyline
 */
export function findDistanceToPolylineMeters(
  currentLat: number,
  currentLng: number,
  polyline: [number, number][]
): number {
  if (!polyline || polyline.length < 2) return 0;

  let minDistance = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = distToSegmentMeters(
      currentLat,
      currentLng,
      polyline[i][0],
      polyline[i][1],
      polyline[i + 1][0],
      polyline[i + 1][1]
    );
    if (d < minDistance) {
      minDistance = d;
    }
  }

  return minDistance === Infinity ? 0 : Math.round(minDistance);
}

/**
 * Checks if the ambulance is significantly off-route (default > 150m deviation threshold)
 */
export function isAmbulanceOffRoute(
  coords: { latitude: number; longitude: number },
  polyline: [number, number][],
  deviationThresholdMeters: number = 150
): { isOffRoute: boolean; deviationMeters: number } {
  if (!coords || !polyline || polyline.length < 2) {
    return { isOffRoute: false, deviationMeters: 0 };
  }

  const dist = findDistanceToPolylineMeters(coords.latitude, coords.longitude, polyline);
  return {
    isOffRoute: dist > deviationThresholdMeters,
    deviationMeters: dist,
  };
}

/**
 * Generates turn-by-turn spoken and visual navigation instructions based on the active route & stage
 */
export function generateRouteNavigationSteps(
  route: RouteOption | null,
  stage: 'TO_PATIENT' | 'TO_HOSPITAL',
  destinationName: string
): NavigationInstruction[] {
  const destClean = destinationName || (stage === 'TO_PATIENT' ? 'Patient Incident Location' : 'Hospital Trauma Center');
  const waypoints = route?.waypoints && route.waypoints.length > 0
    ? route.waypoints
    : ['Main Arterial Link', 'Emergency Green Corridor', 'Central Crossing'];

  if (stage === 'TO_PATIENT') {
    return [
      {
        id: 0,
        text: 'Starting navigation to the patient.',
        maneuver: 'start',
        distanceText: 'Departing base',
        progressPercent: 0,
      },
      {
        id: 1,
        text: `Continue straight along ${waypoints[0] || 'arterial emergency lane'}.`,
        maneuver: 'straight',
        distanceText: 'In 600m',
        progressPercent: 18,
      },
      {
        id: 2,
        text: `Turn left onto ${waypoints[1] || 'Main Avenue'}. Green corridor signal active.`,
        maneuver: 'turn-left',
        distanceText: 'In 400m',
        progressPercent: 38,
      },
      {
        id: 3,
        text: `Turn right towards ${waypoints[2] || 'Crossway Link'}. Priority clearance engaged.`,
        maneuver: 'turn-right',
        distanceText: 'In 800m',
        progressPercent: 62,
      },
      {
        id: 4,
        text: 'Continue straight. Traffic lights automated to green.',
        maneuver: 'straight',
        distanceText: 'In 1.1km',
        progressPercent: 80,
      },
      {
        id: 5,
        text: `You are approaching the destination: ${destClean}.`,
        maneuver: 'approaching',
        distanceText: 'In 250m',
        progressPercent: 92,
      },
      {
        id: 6,
        text: 'You have reached the patient location. Prepare emergency triage and stabilization.',
        maneuver: 'reached',
        distanceText: 'Arrived at scene',
        progressPercent: 100,
      },
    ];
  }

  // Stage 2: TO_HOSPITAL
  return [
    {
      id: 0,
      text: `Starting navigation to ${destClean}.`,
      maneuver: 'start',
      distanceText: 'Departing scene',
      progressPercent: 0,
    },
    {
      id: 1,
      text: 'Continue straight onto arterial expressway with emergency sirens active.',
      maneuver: 'straight',
      distanceText: 'In 800m',
      progressPercent: 22,
    },
    {
      id: 2,
      text: `Turn left onto ${waypoints[0] || 'Hospital Fast Corridor'}. Automated green signal active.`,
      maneuver: 'turn-left',
      distanceText: 'In 500m',
      progressPercent: 48,
    },
    {
      id: 3,
      text: 'Turn right at the medical trauma boulevard intersection.',
      maneuver: 'turn-right',
      distanceText: 'In 350m',
      progressPercent: 72,
    },
    {
      id: 4,
      text: `You are approaching ${destClean} emergency trauma entrance.`,
      maneuver: 'approaching',
      distanceText: 'In 150m',
      progressPercent: 90,
    },
    {
      id: 5,
      text: `You have reached the hospital destination. Hand over patient to emergency trauma team.`,
      maneuver: 'reached',
      distanceText: 'Trauma Bay',
      progressPercent: 100,
    },
  ];
}

// Memory to prevent repeating the identical spoken announcement in quick succession
let lastSpokenText: string = '';
let lastSpokenTime: number = 0;

/**
 * Plays speech using Web Speech API with duplicate suppression
 */
export function speakInstruction(
  text: string,
  isMuted: boolean,
  callbacks?: { onStart?: () => void; onEnd?: () => void; onError?: () => void }
): void {
  if (isMuted || !isTextToSpeechSupported() || !text) {
    return;
  }

  const now = Date.now();
  // Prevent repeating identical announcement within 8 seconds
  if (text === lastSpokenText && now - lastSpokenTime < 8000) {
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.lang = 'en-US';

    // Pick best natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen')))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      lastSpokenText = text;
      lastSpokenTime = Date.now();
      if (callbacks?.onStart) callbacks.onStart();
    };
    if (callbacks?.onEnd) utterance.onend = callbacks.onEnd;
    if (callbacks?.onError) utterance.onerror = callbacks.onError;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Voice navigation speech error:', err);
    if (callbacks?.onError) callbacks.onError();
  }
}

/**
 * Stops any speech currently in progress
 */
export function cancelSpeech(): void {
  if (isTextToSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
      lastSpokenText = '';
    } catch {
      // Ignore
    }
  }
}

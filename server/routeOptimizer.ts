export interface RouteOption {
  id: string;
  name: string;
  summary: string;
  distanceKm: number;
  estimatedMinutes: number;
  traffic: 'Low' | 'Moderate' | 'Heavy';
  trafficDelayMinutes: number;
  routeScore: number;
  isRecommended: boolean;
  recommendationReason: string;
  waypoints: string[];
  coordinates: [number, number][]; // [lat, lng]
}

export interface HospitalOption {
  id: string;
  name: string;
  specialty: string;
  address: string;
  distanceKm: number;
  estimatedMinutes: number;
  traffic: 'Low' | 'Moderate' | 'Heavy';
  availableEmergencyBeds: number;
  isRecommended: boolean;
  recommendationReason: string;
  coordinates: [number, number];
}

export interface RouteOptimizationResult {
  origin: string;
  destination: string;
  emergencyType: string;
  calculatedAt: string;
  recommendedRoute: RouteOption;
  alternativeRoutes: RouteOption[];
  allRoutes: RouteOption[];
}

export interface HospitalOptimizationResult {
  patientLocation: string;
  emergencyType: string;
  recommendedHospital: HospitalOption;
  alternativeHospitals: HospitalOption[];
  allHospitals: HospitalOption[];
}

// Deterministic pseudo-random helper based on seed string
function getHashNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Known coordinates for common landmarks in Bengaluru/Karnataka for realistic simulation
const LOCATION_COORDS: Record<string, [number, number]> = {
  'Central Trauma Center, Block A': [12.9647, 77.5753],
  'Indiranagar Emergency Hub': [12.9784, 77.6408],
  'Jayanagar 4th Block Rescue Station': [12.9299, 77.5824],
  'Whitefield Fast-Response Depot': [12.9698, 77.7499],
  'Koramangala 5th Block': [12.9352, 77.6245],
  'Indiranagar 100ft Road': [12.9719, 77.6412],
  'MG Road Metro Station': [12.9756, 77.6066],
  'Jayanagar 4th Block': [12.9299, 77.5824],
  'Whitefield Main Road': [12.9698, 77.7499],
  'Majestic Bus Terminal': [12.9767, 77.5713],
  'Hebbal Flyover Junction': [13.0358, 77.5970],
  'Electronic City Phase 1': [12.8452, 77.6602],
  'Malleshwaram 8th Cross': [12.9988, 77.5695],
  'Rajajinagar 1st Block': [12.9912, 77.5543],
  'Banashankari 2nd Stage': [12.9255, 77.5468],
  'BTM Layout 2nd Stage': [12.9166, 77.6101],
  'HSR Layout Sector 2': [12.9121, 77.6446],
  'Yeshwanthpur Junction': [13.0223, 77.5492],
  'Ulsoor Lake Road': [12.9818, 77.6200],
};

function getCoordsForLocation(loc: string): [number, number] {
  if (!loc) return [12.9716, 77.5946];
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (loc.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(loc.toLowerCase())) {
      return coords;
    }
  }
  const hash = getHashNumber(loc);
  const latOffset = ((hash % 100) - 50) / 1500;
  const lngOffset = (((hash >> 3) % 100) - 50) / 1500;
  return [12.9716 + latOffset, 77.5946 + lngOffset];
}

// Calculate Euclidean approx distance in km
export function calculateGeoDistanceKm(p1: [number, number], p2: [number, number]): number {
  const dLat = (p2[0] - p1[0]) * 111;
  const dLng = (p2[1] - p1[1]) * 111 * Math.cos((p1[0] * Math.PI) / 180);
  const dist = Math.sqrt(dLat * dLat + dLng * dLng);
  return Math.max(1.2, parseFloat(dist.toFixed(1)));
}

/**
 * AI ROUTE SCORING ALGORITHM
 * 
 * ROUTE_SCORE = (Travel Time in Minutes * 10) + (Traffic Penalty) + (Distance in km * 2)
 * 
 * Where Traffic Penalty:
 * - Heavy: 25 points
 * - Moderate: 10 points
 * - Low: 0 points
 */
export function calculateRouteScore(estimatedMinutes: number, traffic: 'Low' | 'Moderate' | 'Heavy', distanceKm: number): number {
  let trafficPenalty = 0;
  if (traffic === 'Heavy') trafficPenalty = 25;
  else if (traffic === 'Moderate') trafficPenalty = 10;
  else trafficPenalty = 0;

  const score = (estimatedMinutes * 10) + trafficPenalty + (distanceKm * 2);
  return Math.round(score * 10) / 10;
}

/**
 * Dynamically generates 3 distinct route candidates and evaluates them using AI scoring
 */
export function optimizeRoute(
  originLocation: string,
  destinationLocation: string,
  emergencyType: string = 'General',
  variationSeed: number = 0,
  originCoordsParam?: [number, number] | null,
  destinationCoordsParam?: [number, number] | null
): RouteOptimizationResult {
  const originCoords = originCoordsParam && originCoordsParam[0] && originCoordsParam[1]
    ? originCoordsParam
    : getCoordsForLocation(originLocation);
  const destCoords = destinationCoordsParam && destinationCoordsParam[0] && destinationCoordsParam[1]
    ? destinationCoordsParam
    : getCoordsForLocation(destinationLocation);
  const baseDistance = calculateGeoDistanceKm(originCoords, destCoords);

  const seed = getHashNumber(originLocation + destinationLocation + emergencyType) + variationSeed;
  const isCritical = emergencyType.toLowerCase().includes('cardiac') || emergencyType.toLowerCase().includes('trauma') || emergencyType.toLowerCase().includes('respiratory');

  // Traffic scenario patterns based on seed
  const trafficProfiles: ('Low' | 'Moderate' | 'Heavy')[][] = [
    ['Moderate', 'Heavy', 'Low'],
    ['Low', 'Moderate', 'Heavy'],
    ['Moderate', 'Low', 'Heavy'],
    ['Heavy', 'Moderate', 'Low'],
  ];
  const profile = trafficProfiles[seed % trafficProfiles.length];

  // Route A: Expressway / Arterial Bypass (Slightly longer, moderate/low traffic, fastest)
  const distA = Math.max(1.8, parseFloat((baseDistance * 1.15).toFixed(1)));
  const trafficA = profile[0];
  const delayA = trafficA === 'Heavy' ? 6 : (trafficA === 'Moderate' ? 2 : 0);
  const speedKmhA = trafficA === 'Heavy' ? 22 : (trafficA === 'Moderate' ? 38 : 48);
  const estMinA = Math.max(4, Math.round((distA / speedKmhA) * 60 + delayA));
  const scoreA = calculateRouteScore(estMinA, trafficA, distA);

  // Route B: Direct City Arterial / Market Road (Shortest distance, but often high traffic)
  const distB = Math.max(1.2, parseFloat((baseDistance * 0.95).toFixed(1)));
  const trafficB = profile[1];
  const delayB = trafficB === 'Heavy' ? 9 : (trafficB === 'Moderate' ? 4 : 1);
  const speedKmhB = trafficB === 'Heavy' ? 14 : (trafficB === 'Moderate' ? 24 : 35);
  const estMinB = Math.max(5, Math.round((distB / speedKmhB) * 60 + delayB));
  const scoreB = calculateRouteScore(estMinB, trafficB, distB);

  // Route C: Ring Road / Elevated Flyover (Longer distance, low/smooth traffic)
  const distC = Math.max(2.4, parseFloat((baseDistance * 1.32).toFixed(1)));
  const trafficC = profile[2];
  const delayC = trafficC === 'Heavy' ? 5 : (trafficC === 'Moderate' ? 2 : 0);
  const speedKmhC = trafficC === 'Heavy' ? 26 : (trafficC === 'Moderate' ? 42 : 55);
  const estMinC = Math.max(5, Math.round((distC / speedKmhC) * 60 + delayC));
  const scoreC = calculateRouteScore(estMinC, trafficC, distC);

  // Generate intermediate coordinates for visual polyline
  const generatePath = (curveFactor: number): [number, number][] => {
    const points: [number, number][] = [];
    const steps = 7;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Linear interpolation + perpendicular arc curve
      const lat = originCoords[0] + (destCoords[0] - originCoords[0]) * t + Math.sin(t * Math.PI) * curveFactor * 0.015;
      const lng = originCoords[1] + (destCoords[1] - originCoords[1]) * t + Math.sin(t * Math.PI) * curveFactor * -0.015;
      points.push([parseFloat(lat.toFixed(5)), parseFloat(lng.toFixed(5))]);
    }
    return points;
  };

  const routeA: RouteOption = {
    id: 'route-expressway',
    name: 'Route A (Outer Arterial Corridor)',
    summary: 'Via Elevated Expressway & Signal-Free Bypass',
    distanceKm: distA,
    estimatedMinutes: estMinA,
    traffic: trafficA,
    trafficDelayMinutes: delayA,
    routeScore: scoreA,
    isRecommended: false,
    recommendationReason: '',
    waypoints: ['Elevated Corridor Link', 'Signal-Free Underpass', 'Main Avenue Direct Access'],
    coordinates: generatePath(0.6),
  };

  const routeB: RouteOption = {
    id: 'route-direct',
    name: 'Route B (Direct City Center)',
    summary: 'Via Central High Street & Commercial Avenue',
    distanceKm: distB,
    estimatedMinutes: estMinB,
    traffic: trafficB,
    trafficDelayMinutes: delayB,
    routeScore: scoreB,
    isRecommended: false,
    recommendationReason: '',
    waypoints: ['Central Junction', 'Market Circle', 'Cross Road 4'],
    coordinates: generatePath(-0.4),
  };

  const routeC: RouteOption = {
    id: 'route-ringroad',
    name: 'Route C (Outer Ring Road Bypass)',
    summary: 'Via Peripheral Ring Road & Green Corridor',
    distanceKm: distC,
    estimatedMinutes: estMinC,
    traffic: trafficC,
    trafficDelayMinutes: delayC,
    routeScore: scoreC,
    isRecommended: false,
    recommendationReason: '',
    waypoints: ['Outer Ring Expressway', 'Service Link Flyover', 'Perimeter Sector Exit'],
    coordinates: generatePath(1.2),
  };

  const allRoutes = [routeA, routeB, routeC];
  
  // Sort by lowest score (best route)
  allRoutes.sort((a, b) => a.routeScore - b.routeScore);

  // Mark best route as recommended and provide AI rationale
  allRoutes[0].isRecommended = true;
  const best = allRoutes[0];
  const second = allRoutes[1];

  best.recommendationReason = 'Selected as the fastest emergency response route based on current travel time, traffic conditions and distance.';

  // Set alternative reasons
  for (let i = 1; i < allRoutes.length; i++) {
    const alt = allRoutes[i];
    if (alt.traffic === 'Heavy') {
      alt.recommendationReason = `Alternative: Shorter in physical distance, but currently delayed by +${alt.trafficDelayMinutes} mins due to heavy traffic congestion.`;
    } else {
      alt.recommendationReason = `Alternative route with +${alt.estimatedMinutes - best.estimatedMinutes} mins added transit duration.`;
    }
  }

  return {
    origin: originLocation,
    destination: destinationLocation,
    emergencyType,
    calculatedAt: new Date().toISOString(),
    recommendedRoute: allRoutes[0],
    alternativeRoutes: [allRoutes[1], allRoutes[2]],
    allRoutes,
  };
}

/**
 * Optimizes destination hospital choice based on patient emergency type and traffic
 */
export function optimizeHospitals(
  patientLocation: string,
  emergencyType: string = 'General',
  variationSeed: number = 0
): HospitalOptimizationResult {
  const patientCoords = getCoordsForLocation(patientLocation);
  const seed = getHashNumber(patientLocation + emergencyType) + variationSeed;
  const isCardiac = emergencyType.toLowerCase().includes('cardiac') || emergencyType.toLowerCase().includes('heart') || emergencyType.toLowerCase().includes('chest');
  const isTrauma = emergencyType.toLowerCase().includes('trauma') || emergencyType.toLowerCase().includes('accident') || emergencyType.toLowerCase().includes('fracture') || emergencyType.toLowerCase().includes('burn');
  const isRespiratory = emergencyType.toLowerCase().includes('respiratory') || emergencyType.toLowerCase().includes('breath') || emergencyType.toLowerCase().includes('asthma');

  const hospitalsData = [
    {
      id: 'hosp-victoria',
      name: 'Victoria Government Multi-Specialty Hospital',
      specialty: 'Trauma & Critical Emergency Care (Level 1)',
      address: 'Fort Road, Near City Market, Bengaluru',
      baseCoords: [12.9647, 77.5753] as [number, number],
      priorityFor: isTrauma ? 1 : 0,
      beds: 12,
    },
    {
      id: 'hosp-jayadeva',
      name: 'Sri Jayadeva Institute of Cardiovascular Sciences',
      specialty: 'Apex Cardiac ICU & Interventional Catheterization',
      address: 'Bannerghatta Main Road, 9th Block, Jayanagar',
      baseCoords: [12.9230, 77.5990] as [number, number],
      priorityFor: isCardiac ? 2 : 0,
      beds: 8,
    },
    {
      id: 'hosp-manipal',
      name: 'Manipal Emergency & Intensive Care Center',
      specialty: 'Comprehensive Emergency & Advanced ICU',
      address: 'HAL Airport Road, Kodihalli',
      baseCoords: [12.9584, 77.6496] as [number, number],
      priorityFor: isRespiratory ? 1 : 0,
      beds: 15,
    },
    {
      id: 'hosp-bowring',
      name: 'Bowring & Lady Curzon Government Hospital',
      specialty: 'General Emergency & Pediatric Trauma',
      address: 'Lady Curzon Road, Shivaji Nagar',
      baseCoords: [12.9840, 77.6044] as [number, number],
      priorityFor: 0,
      beds: 9,
    },
  ];

  const evaluatedHospitals: HospitalOption[] = hospitalsData.map((h, idx) => {
    const dist = calculateGeoDistanceKm(patientCoords, h.baseCoords);
    const trafficLevels: ('Low' | 'Moderate' | 'Heavy')[] = ['Low', 'Moderate', 'Heavy'];
    const traffic = trafficLevels[(seed + idx) % 3];
    const delay = traffic === 'Heavy' ? 7 : (traffic === 'Moderate' ? 3 : 0);
    const speed = traffic === 'Heavy' ? 18 : (traffic === 'Moderate' ? 32 : 44);
    const estMin = Math.max(5, Math.round((dist / speed) * 60 + delay));
    
    // Hospital score considers distance, time, and specialty match bonus
    const specialtyBonus = h.priorityFor * 25; // deduct 25-50 points for matching specialized center
    const score = (estMin * 10) + (traffic === 'Heavy' ? 20 : (traffic === 'Moderate' ? 8 : 0)) + (dist * 2) - specialtyBonus;

    let reason = '';
    if (h.priorityFor > 0) {
      reason = `Recommended apex facility specialized in ${emergencyType} with ready ICU trauma bay and lowest response ETA.`;
    } else {
      reason = `General emergency center ${dist} km away with ${h.beds} active emergency beds.`;
    }

    return {
      id: h.id,
      name: h.name,
      specialty: h.specialty,
      address: h.address,
      distanceKm: dist,
      estimatedMinutes: estMin,
      traffic,
      availableEmergencyBeds: h.beds,
      isRecommended: false,
      recommendationReason: reason,
      coordinates: h.baseCoords,
      score,
    };
  }).sort((a: any, b: any) => a.score - b.score);

  evaluatedHospitals[0].isRecommended = true;

  return {
    patientLocation,
    emergencyType,
    recommendedHospital: evaluatedHospitals[0],
    alternativeHospitals: evaluatedHospitals.slice(1),
    allHospitals: evaluatedHospitals,
  };
}

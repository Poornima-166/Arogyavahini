import { RouteOption, HospitalOption } from '../types';

// Deterministic hash helper for consistent coords based on location string
function getHashNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const LOCATION_COORDS: Record<string, [number, number]> = {
  'Central Trauma Center, Block A': [12.9647, 77.5753],
  'Indiranagar Emergency Hub': [12.9784, 77.6408],
  'Jayanagar 4th Block Rescue Station': [12.9299, 77.5824],
  'Whitefield Fast-Response Depot': [12.9698, 77.7499],
  'Koramangala 5th Block': [12.9352, 77.6245],
  'Indiranagar 100ft Road': [12.9719, 77.6412],
  'MG Road Metro Station': [12.9756, 77.6066],
  'MG Road Metro Station Gate 2, Bengaluru': [12.9756, 77.6066],
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

export function getClientCoordsForLocation(loc: string): [number, number] {
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

export function calculateGeoDistanceKm(p1: [number, number], p2: [number, number]): number {
  const dLat = (p2[0] - p1[0]) * 111;
  const dLng = (p2[1] - p1[1]) * 111 * Math.cos((p1[0] * Math.PI) / 180);
  const dist = Math.sqrt(dLat * dLat + dLng * dLng);
  return Math.max(1.2, parseFloat(dist.toFixed(1)));
}

export function calculateRouteScore(estimatedMinutes: number, traffic: 'Low' | 'Moderate' | 'Heavy', distanceKm: number): number {
  let trafficPenalty = 0;
  if (traffic === 'Heavy') trafficPenalty = 25;
  else if (traffic === 'Moderate') trafficPenalty = 10;
  else trafficPenalty = 0;

  const score = (estimatedMinutes * 10) + trafficPenalty + (distanceKm * 2);
  return Math.round(score * 10) / 10;
}

export function generateClientFallbackRoutes(
  originLoc: string,
  destLoc: string,
  emergencyType: string = 'General',
  variationSeed: number = 0,
  originCoordsParam?: [number, number] | null,
  destinationCoordsParam?: [number, number] | null
): RouteOption[] {
  const originCoords = originCoordsParam && originCoordsParam[0] && originCoordsParam[1]
    ? originCoordsParam
    : getClientCoordsForLocation(originLoc);
  const destCoords = destinationCoordsParam && destinationCoordsParam[0] && destinationCoordsParam[1]
    ? destinationCoordsParam
    : getClientCoordsForLocation(destLoc);
  const baseDistance = calculateGeoDistanceKm(originCoords, destCoords);

  const seed = getHashNumber(originLoc + destLoc + emergencyType) + variationSeed;

  const trafficProfiles: ('Low' | 'Moderate' | 'Heavy')[][] = [
    ['Moderate', 'Heavy', 'Low'],
    ['Low', 'Moderate', 'Heavy'],
    ['Moderate', 'Low', 'Heavy'],
    ['Heavy', 'Moderate', 'Low'],
  ];
  const profile = trafficProfiles[seed % trafficProfiles.length];

  const distA = Math.max(1.8, parseFloat((baseDistance * 1.15).toFixed(1)));
  const trafficA = profile[0];
  const delayA = trafficA === 'Heavy' ? 6 : (trafficA === 'Moderate' ? 2 : 0);
  const speedKmhA = trafficA === 'Heavy' ? 22 : (trafficA === 'Moderate' ? 38 : 48);
  const estMinA = Math.max(4, Math.round((distA / speedKmhA) * 60 + delayA));
  const scoreA = calculateRouteScore(estMinA, trafficA, distA);

  const distB = Math.max(1.2, parseFloat((baseDistance * 0.95).toFixed(1)));
  const trafficB = profile[1];
  const delayB = trafficB === 'Heavy' ? 9 : (trafficB === 'Moderate' ? 4 : 1);
  const speedKmhB = trafficB === 'Heavy' ? 14 : (trafficB === 'Moderate' ? 24 : 35);
  const estMinB = Math.max(5, Math.round((distB / speedKmhB) * 60 + delayB));
  const scoreB = calculateRouteScore(estMinB, trafficB, distB);

  const distC = Math.max(2.4, parseFloat((baseDistance * 1.32).toFixed(1)));
  const trafficC = profile[2];
  const delayC = trafficC === 'Heavy' ? 5 : (trafficC === 'Moderate' ? 2 : 0);
  const speedKmhC = trafficC === 'Heavy' ? 26 : (trafficC === 'Moderate' ? 42 : 55);
  const estMinC = Math.max(5, Math.round((distC / speedKmhC) * 60 + delayC));
  const scoreC = calculateRouteScore(estMinC, trafficC, distC);

  const generatePath = (curveFactor: number): [number, number][] => {
    const points: [number, number][] = [];
    const steps = 7;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
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
    waypoints: ['Ring Road Service Lane', 'Green Corridor Node 7', 'Express Transit Flyover'],
    coordinates: generatePath(0.9),
  };

  const allRoutes = [routeA, routeB, routeC];
  allRoutes.sort((a, b) => a.routeScore - b.routeScore);

  allRoutes[0].isRecommended = true;
  allRoutes[0].recommendationReason = 'Selected as the fastest emergency response route based on current travel time, traffic conditions and distance.';

  for (let i = 1; i < allRoutes.length; i++) {
    allRoutes[i].isRecommended = false;
    if (allRoutes[i].traffic === 'Heavy') {
      allRoutes[i].recommendationReason = `Alternative: Shorter in physical distance, but currently delayed by +${allRoutes[i].trafficDelayMinutes} mins due to heavy traffic congestion.`;
    } else {
      allRoutes[i].recommendationReason = `Alternative route with +${allRoutes[i].estimatedMinutes - allRoutes[0].estimatedMinutes} mins added transit duration.`;
    }
  }

  return allRoutes;
}

export function formatMinutes(mins: number): string {
  if (mins < 1) return '< 1 min';
  return `${Math.round(mins)} mins`;
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

export function getTrafficBadgeClass(traffic?: 'Low' | 'Moderate' | 'Heavy') {
  switch (traffic) {
    case 'Low':
      return {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-300',
        border: 'border-emerald-500/30',
        indicator: 'bg-emerald-400',
      };
    case 'Moderate':
      return {
        bg: 'bg-amber-500/20',
        text: 'text-amber-300',
        border: 'border-amber-500/30',
        indicator: 'bg-amber-400',
      };
    case 'Heavy':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-300',
        border: 'border-red-500/30',
        indicator: 'bg-red-400 animate-pulse',
      };
    default:
      return {
        bg: 'bg-slate-500/20',
        text: 'text-slate-300',
        border: 'border-slate-500/30',
        indicator: 'bg-slate-400',
      };
  }
}


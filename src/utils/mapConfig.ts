import L from './leafletPatch';

/**
 * Standard OpenStreetMap Configuration for Arogyavahini
 * 
 * Free, open-access, production-grade basemap with zero API key dependencies,
 * zero watermarks, and full international & Indian subcontinent street coverage.
 */
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

export const DEFAULT_MAP_CONFIG = {
  tileUrl: OSM_TILE_URL,
  attribution: OSM_ATTRIBUTION,
  maxZoom: 19,
  minZoom: 3,
  subdomains: ['a', 'b', 'c'] as string[] | string,
};

/**
 * Standard default coordinates for Bengaluru Emergency Command.
 * Used ONLY as initial framing anchor before the browser's live GPS fix is received.
 */
export const BENGALURU_DEFAULT_COORDS: [number, number] = [12.9716, 77.5946];

/**
 * Validates latitude and longitude strictly:
 * - Latitude must be a valid float between -90 and 90
 * - Longitude must be a valid float between -180 and 180
 * - Rejects (0, 0) / Null Island (which places users off the coast of West Africa)
 * - Rejects inverted coordinates where longitude (>90) is wrongly passed as latitude
 */
export function isValidLatLng(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) return false;
  
  // Latitude check
  if (lat < -90 || lat > 90) return false;
  // Longitude check
  if (lng < -180 || lng > 180) return false;

  // Guard against (0, 0) Null Island off the coast of West Africa
  if (Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001) {
    return false;
  }

  return true;
}

/**
 * Sanitizes and safely orders latitude and longitude.
 * Format: [latitude, longitude]
 */
export function sanitizeCoordinates(
  lat: unknown,
  lng: unknown,
  fallback: [number, number] = BENGALURU_DEFAULT_COORDS
): [number, number] {
  if (isValidLatLng(lat, lng)) {
    return [lat as number, lng as number];
  }
  return fallback;
}

/**
 * Creates a clean, standard OpenStreetMap Leaflet TileLayer.
 * Guaranteed to never request or display "API KEY REQUIRED" or Carto watermark tiles.
 */
export function createBaseTileLayer(customOptions?: L.TileLayerOptions): L.TileLayer {
  return L.tileLayer(OSM_TILE_URL, {
    maxZoom: 19,
    minZoom: 3,
    subdomains: ['a', 'b', 'c'],
    attribution: OSM_ATTRIBUTION,
    crossOrigin: true,
    ...customOptions,
  });
}

/**
 * Helper to initialize a standard Leaflet map with OpenStreetMap basemap.
 */
export function initStandardLeafletMap(
  container: HTMLElement,
  center: [number, number],
  zoom: number = 14,
  mapOptions?: L.MapOptions
): { map: L.Map; baseLayer: L.TileLayer } {
  // Clear any existing Leaflet ID if container was re-rendered
  if ((container as any)._leaflet_id) {
    delete (container as any)._leaflet_id;
  }

  const [lat, lng] = sanitizeCoordinates(center[0], center[1]);

  const map = L.map(container, {
    zoomControl: false,
    attributionControl: true,
    ...mapOptions,
  }).setView([lat, lng], zoom);

  // Add zoom control at top-right
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Add base OpenStreetMap tile layer
  const baseLayer = createBaseTileLayer().addTo(map);

  return { map, baseLayer };
}

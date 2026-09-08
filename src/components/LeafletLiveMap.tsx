import React, { useEffect, useRef } from 'react';
import L from '../utils/leafletPatch';
import { RouteOption, HospitalOption } from '../types';
import { formatMinutes, formatDistance, getTrafficBadgeClass } from '../utils/routeOptimizer';
import { useLocation } from '../context/LocationContext';

interface LeafletLiveMapProps {
  routes: RouteOption[];
  activeRouteId: string;
  onSelectRoute?: (routeId: string) => void;
  driverCoords?: { latitude: number; longitude: number } | null;
  patientCoords?: { latitude: number; longitude: number } | null;
  originName: string;
  destinationName: string;
  stage?: 'TO_PATIENT' | 'TO_HOSPITAL';
  hospitals?: HospitalOption[];
  selectedHospital?: string;
  onSelectHospital?: (hospitalName: string) => void;
  isLiveTracking?: boolean;
}

export const LeafletLiveMap: React.FC<LeafletLiveMapProps> = ({
  routes = [],
  activeRouteId,
  onSelectRoute,
  driverCoords,
  patientCoords,
  originName,
  destinationName,
  stage = 'TO_PATIENT',
  hospitals = [],
  selectedHospital,
  onSelectHospital,
  isLiveTracking = false,
}) => {
  const { userCoords } = useLocation();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylinesLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);

  const activeRoute = routes.find((r) => r.id === activeRouteId) || routes[0];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      const initialLat = driverCoords?.latitude || patientCoords?.latitude || userCoords?.latitude || activeRoute?.coordinates?.[0]?.[0] || 12.9716;
      const initialLng = driverCoords?.longitude || patientCoords?.longitude || userCoords?.longitude || activeRoute?.coordinates?.[0]?.[1] || 77.5946;
      const initialZoom = 14;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([initialLat, initialLng], initialZoom);

      L.control.zoom({ position: 'topright' }).addTo(map);

      // CartoDB Voyager / OpenStreetMap standard tiles for high visibility & contrast
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      polylinesLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.remove();
        } catch {
          // safe cleanup
        }
        mapInstanceRef.current = null;
      }
      polylinesLayerRef.current = null;
      markersLayerRef.current = null;
      ambulanceMarkerRef.current = null;
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  // Center map on user's live browser coordinates as soon as geolocation arrives
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const currentLat = driverCoords?.latitude || patientCoords?.latitude || userCoords?.latitude;
    const currentLng = driverCoords?.longitude || patientCoords?.longitude || userCoords?.longitude;
    if (currentLat && currentLng && (!routes || routes.length === 0)) {
      try {
        map.setView([currentLat, currentLng], 15, { animate: false });
      } catch {
        // safe fallback
      }
    }
  }, [driverCoords?.latitude, driverCoords?.longitude, patientCoords?.latitude, patientCoords?.longitude, userCoords?.latitude, userCoords?.longitude, routes?.length]);

  // Update Polylines and Markers whenever routes, active route, or coords change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const polylinesLayer = polylinesLayerRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !polylinesLayer || !markersLayer) return;

    polylinesLayer.clearLayers();
    markersLayer.clearLayers();

    const allPoints: L.LatLngExpression[] = [];

    // Draw Alternative Routes first (dashed, clickable)
    routes
      .filter((r) => r.id !== activeRouteId)
      .forEach((r) => {
        if (!r.coordinates || r.coordinates.length === 0) return;
        const latlngs: [number, number][] = r.coordinates.map((pt) => [pt[0], pt[1]]);
        const polyline = L.polyline(latlngs, {
          color: '#64748b',
          weight: 4,
          opacity: 0.6,
          dashArray: '8, 8',
          lineCap: 'round',
          lineJoin: 'round',
        });

        polyline.on('click', () => {
          if (onSelectRoute) onSelectRoute(r.id);
        });

        polyline.bindTooltip(
          `<div style="font-family: sans-serif; font-size: 11px; padding: 2px 4px;">
            <strong>${r.name}</strong><br/>
            ETA: ${formatMinutes(r.estimatedMinutes)} | Dist: ${formatDistance(r.distanceKm)}<br/>
            <em>Click to switch to this route</em>
          </div>`,
          { sticky: true }
        );

        polylinesLayer.addLayer(polyline);
        latlngs.forEach((pt) => allPoints.push(pt));
      });

    // Draw Active / Selected Route (glow outline + solid colored line)
    if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 0) {
      const latlngs: [number, number][] = activeRoute.coordinates.map((pt) => [pt[0], pt[1]]);

      // Outer glow polyline
      const glowPolyline = L.polyline(latlngs, {
        color: '#10b981',
        weight: 10,
        opacity: 0.3,
        lineCap: 'round',
        lineJoin: 'round',
      });
      polylinesLayer.addLayer(glowPolyline);

      // Core route polyline
      const corePolyline = L.polyline(latlngs, {
        color: '#059669',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });

      corePolyline.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
          <strong style="color: #047857;">🤖 ${activeRoute.name} (Active)</strong><br/>
          <strong>ETA:</strong> ${formatMinutes(activeRoute.estimatedMinutes)} | <strong>Dist:</strong> ${formatDistance(activeRoute.distanceKm)}<br/>
          <strong>Traffic:</strong> ${activeRoute.traffic} Congestion
        </div>`,
        { sticky: true }
      );

      polylinesLayer.addLayer(corePolyline);
      latlngs.forEach((pt) => allPoints.push(pt));
    }

    // Determine Ambulance Location (GPS coordinates if live, else route origin)
    let ambLat: number | null = null;
    let ambLng: number | null = null;

    if (driverCoords && driverCoords.latitude && driverCoords.longitude) {
      ambLat = driverCoords.latitude;
      ambLng = driverCoords.longitude;
    } else if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 0) {
      ambLat = activeRoute.coordinates[0][0];
      ambLng = activeRoute.coordinates[0][1];
    } else if (patientCoords && patientCoords.latitude && patientCoords.longitude) {
      ambLat = patientCoords.latitude - 0.012;
      ambLng = patientCoords.longitude - 0.010;
    } else if (userCoords && userCoords.latitude && userCoords.longitude) {
      ambLat = userCoords.latitude - 0.012;
      ambLng = userCoords.longitude - 0.010;
    }

    if (ambLat !== null && ambLng !== null) {
      allPoints.push([ambLat, ambLng]);

      // Create Ambulance Marker with Live Beacon & Siren Pulse
      const ambulanceIcon = L.divIcon({
        className: 'custom-ambulance-marker',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(16, 185, 129, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 34px; height: 34px; background: #0f172a; border: 2.5px solid #10b981; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
              <span style="font-size: 17px;">🚑</span>
            </div>
            <div style="position: absolute; -top: 18px; background: #047857; color: #ffffff; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              ${isLiveTracking ? 'LIVE GPS' : 'AMBULANCE'}
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const ambMarker = L.marker([ambLat, ambLng], { icon: ambulanceIcon }).addTo(markersLayer);
      ambMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #059669;">🚑 Dispatched Emergency Ambulance</strong><br/>
          <strong>Base/GPS:</strong> ${originName}<br/>
          <strong>Status:</strong> ${isLiveTracking ? '🟢 Live GPS Streaming' : 'Ready & Navigating'}<br/>
          <strong>Coords:</strong> ${ambLat.toFixed(5)}, ${ambLng.toFixed(5)}
        </div>
      `);
      ambulanceMarkerRef.current = ambMarker;
    }

    // Determine Destination Location (Patient SOS or Hospital)
    let destLat: number | null = null;
    let destLng: number | null = null;

    if (patientCoords && patientCoords.latitude && patientCoords.longitude) {
      destLat = patientCoords.latitude;
      destLng = patientCoords.longitude;
    } else if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 0) {
      const last = activeRoute.coordinates[activeRoute.coordinates.length - 1];
      destLat = last[0];
      destLng = last[1];
    } else if (driverCoords && driverCoords.latitude && driverCoords.longitude) {
      destLat = driverCoords.latitude + 0.015;
      destLng = driverCoords.longitude + 0.012;
    } else if (userCoords && userCoords.latitude && userCoords.longitude) {
      destLat = userCoords.latitude;
      destLng = userCoords.longitude;
    }

    if (destLat !== null && destLng !== null) {
      allPoints.push([destLat, destLng]);

      // Create Destination / Patient Marker
      const isPatientStage = stage === 'TO_PATIENT';
      const destIcon = L.divIcon({
        className: 'custom-destination-marker',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background: ${isPatientStage ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 34px; height: 34px; background: ${isPatientStage ? '#dc2626' : '#2563eb'}; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); color: white; font-weight: 900; font-size: 16px;">
              ${isPatientStage ? '🆘' : '🏥'}
            </div>
            <div style="position: absolute; -top: 18px; background: ${isPatientStage ? '#991b1b' : '#1e40af'}; color: #ffffff; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              ${isPatientStage ? 'PATIENT SOS' : 'HOSPITAL'}
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const destMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(markersLayer);
      destMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: ${isPatientStage ? '#dc2626' : '#2563eb'};">${isPatientStage ? '🆘 Patient Incident Location' : '🏥 Hospital Facility'}</strong><br/>
          <strong>Destination:</strong> ${destinationName}<br/>
          <strong>Target Coords:</strong> ${destLat.toFixed(5)}, ${destLng.toFixed(5)}
        </div>
      `);
    }

    // Render Hospital Markers with Emergency Ward Capacity Color Coding (Available vs Full)
    if (hospitals.length > 0) {
      hospitals.forEach((h) => {
        if (!h.coordinates) return;
        const isChosen = selectedHospital === h.name;
        const isFull = h.ward_capacity === 'FULL' || h.emergencyWardCapacity === 'FULL' || h.availableEmergencyBeds === 0;
        const statusColor = isFull ? '#dc2626' : '#059669';
        const statusBg = isFull ? '#fee2e2' : '#d1fae5';
        const statusText = isFull ? '#991b1b' : '#065f46';
        const badgeLabel = isFull ? 'FULL' : 'AVAIL';

        const hospIcon = L.divIcon({
          className: 'custom-hosp-marker',
          html: `
            <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
              <div style="width: 30px; height: 30px; background: ${statusColor}; border: ${isChosen ? '3px solid #fbbf24' : '2px solid #ffffff'}; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 3px 10px ${isFull ? 'rgba(220,38,38,0.5)' : 'rgba(5,150,105,0.45)'};">
                <span style="color: #ffffff; font-size: 12px; font-weight: 900; line-height: 1;">H</span>
                <span style="color: #ffffff; font-size: 7px; font-weight: 900; text-transform: uppercase; line-height: 1; margin-top: 1px;">${badgeLabel}</span>
              </div>
              <span style="position: absolute; top: -2px; right: -2px; width: 9px; height: 9px; background: ${isFull ? '#ef4444' : '#10b981'}; border: 1.5px solid #ffffff; border-radius: 50%;"></span>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const hMarker = L.marker([h.coordinates[0], h.coordinates[1]], { icon: hospIcon }).addTo(markersLayer);
        hMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 190px;">
            <div style="margin-bottom: 3px;">
              <strong style="color: #0f172a; font-size: 13px;">🏥 ${h.name}</strong>
            </div>
            <div style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: ${statusBg}; color: ${statusText}; margin-bottom: 5px;">
              ${isFull ? '🔴 Ward: FULL (Diversion Mode)' : `🟢 Ward: AVAILABLE (${h.availableEmergencyBeds || 12} Beds)`}
            </div><br/>
            <strong>Specialty:</strong> ${h.specialty || 'Critical Care'}<br/>
            <strong>Distance:</strong> ${formatDistance(h.distanceKm)} (~${formatMinutes(h.estimatedMinutes)})<br/>
            ${isFull ? '<div style="margin: 4px 0; font-size: 10.5px; color: #dc2626; font-weight: 600;">⚠️ Emergency ward capacity saturated. Alternate hospital recommended.</div>' : ''}
            <button 
              style="margin-top: 5px; width: 100%; background: ${isFull ? '#dc2626' : '#059669'}; color: white; border: none; padding: 5px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;" 
              onclick="window.selectHospitalByName && window.selectHospitalByName('${h.name}')"
            >
              ${isChosen ? '✓ Currently Selected Destination' : (isFull ? 'Select Anyway (Diversion Mode)' : 'Select as Destination')}
            </button>
          </div>
        `);
        allPoints.push([h.coordinates[0], h.coordinates[1]]);
      });
    }

    // Auto fit bounds or center
    if (allPoints.length > 1) {
      try {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15, animate: false });
      } catch {
        // safe fallback
      }
    } else if (allPoints.length === 1) {
      try {
        map.setView(allPoints[0], 15, { animate: false });
      } catch {
        // safe fallback
      }
    }
  }, [
    routes, 
    activeRouteId, 
    driverCoords?.latitude, 
    driverCoords?.longitude, 
    patientCoords?.latitude, 
    patientCoords?.longitude, 
    userCoords?.latitude, 
    userCoords?.longitude, 
    originName, 
    destinationName, 
    stage, 
    hospitals, 
    selectedHospital, 
    isLiveTracking
  ]);

  // Provide global helper for popup hospital selection
  useEffect(() => {
    (window as any).selectHospitalByName = (name: string) => {
      if (onSelectHospital) onSelectHospital(name);
    };
    return () => {
      delete (window as any).selectHospitalByName;
    };
  }, [onSelectHospital]);

  // Center on Ambulance button handler
  const handleCenterAmbulance = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    try {
      if (driverCoords && driverCoords.latitude && driverCoords.longitude) {
        map.setView([driverCoords.latitude, driverCoords.longitude], 15, { animate: false });
      } else if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 0) {
        map.setView([activeRoute.coordinates[0][0], activeRoute.coordinates[0][1]], 15, { animate: false });
      }
    } catch {
      // safe fallback
    }
  };

  // Center on Full Route handler
  const handleCenterRoute = () => {
    const map = mapInstanceRef.current;
    if (!map || !activeRoute || !activeRoute.coordinates || activeRoute.coordinates.length === 0) return;
    try {
      const bounds = L.latLngBounds(activeRoute.coordinates.map((pt) => [pt[0], pt[1]]));
      map.fitBounds(bounds, { padding: [45, 45], animate: false });
    } catch {
      // safe fallback
    }
  };

  return (
    <div className="relative w-full h-[320px] sm:h-[400px] rounded-b-none overflow-hidden bg-slate-950">
      {/* Real-time Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls & Overlays */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 flex-wrap">
        {/* GPS Live Tracking Badge */}
        <div className="bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-white">
            {isLiveTracking ? 'Live GPS Active' : 'Live Map'}
          </span>
          {driverCoords && (
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              ({driverCoords.latitude.toFixed(4)}, {driverCoords.longitude.toFixed(4)})
            </span>
          )}
        </div>

        {/* Center Buttons */}
        <button
          type="button"
          onClick={handleCenterAmbulance}
          className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/80 shadow-md text-xs font-semibold text-slate-200 transition cursor-pointer flex items-center gap-1.5"
          title="Center on Ambulance"
        >
          <span>🚑 Ambulance</span>
        </button>

        <button
          type="button"
          onClick={handleCenterRoute}
          className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/80 shadow-md text-xs font-semibold text-slate-200 transition cursor-pointer flex items-center gap-1.5"
          title="Fit Full Route"
        >
          <span>🗺️ Fit Route</span>
        </button>
      </div>

      {/* Route Info Pill Overlay */}
      {activeRoute && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[400] bg-slate-900/95 backdrop-blur-md p-2.5 sm:px-4 sm:py-2 rounded-xl border border-slate-700/80 shadow-xl flex items-center justify-between sm:justify-start gap-3 sm:gap-4 text-xs text-white">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Route</div>
            <div className="font-bold text-emerald-400 truncate max-w-[140px] sm:max-w-[200px]">
              {activeRoute.name}
            </div>
          </div>
          <div className="w-[1px] h-6 bg-slate-700" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">ETA</div>
            <div className="font-bold text-white">{formatMinutes(activeRoute.estimatedMinutes)}</div>
          </div>
          <div className="w-[1px] h-6 bg-slate-700" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Distance</div>
            <div className="font-bold text-white">{formatDistance(activeRoute.distanceKm)}</div>
          </div>
          <div className="w-[1px] h-6 bg-slate-700 hidden sm:block" />
          <div className="hidden sm:block">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Traffic</div>
            <span className="font-bold text-amber-300">{activeRoute.traffic}</span>
          </div>
        </div>
      )}
    </div>
  );
};

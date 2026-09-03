import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RouteOption, HospitalOption } from '../types';
import { formatMinutes, formatDistance, getTrafficBadgeClass } from '../utils/routeOptimizer';

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
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([12.9716, 77.5946], 13);

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
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

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
    let ambLat: number;
    let ambLng: number;

    if (driverCoords && driverCoords.latitude && driverCoords.longitude) {
      ambLat = driverCoords.latitude;
      ambLng = driverCoords.longitude;
    } else if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 0) {
      ambLat = activeRoute.coordinates[0][0];
      ambLng = activeRoute.coordinates[0][1];
    } else {
      ambLat = 12.9716;
      ambLng = 77.5946;
    }

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

    // Determine Destination Location (Patient SOS or Hospital)
    let destLat: number;
    let destLng: number;

    if (patientCoords && patientCoords.latitude && patientCoords.longitude) {
      destLat = patientCoords.latitude;
      destLng = patientCoords.longitude;
    } else if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 0) {
      const last = activeRoute.coordinates[activeRoute.coordinates.length - 1];
      destLat = last[0];
      destLng = last[1];
    } else {
      destLat = 12.9756;
      destLng = 77.6066;
    }

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

    // Render Hospital Markers if in Hospital stage
    if (stage === 'TO_HOSPITAL' && hospitals.length > 0) {
      hospitals.forEach((h) => {
        if (!h.coordinates) return;
        const isChosen = selectedHospital === h.name;
        const hospIcon = L.divIcon({
          className: 'custom-hosp-marker',
          html: `
            <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
              <div style="width: 26px; height: 26px; background: ${isChosen ? '#059669' : '#334155'}; border: 2px solid #ffffff; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                🏥
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const hMarker = L.marker([h.coordinates[0], h.coordinates[1]], { icon: hospIcon }).addTo(markersLayer);
        hMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <strong style="color: #059669;">${h.name}</strong><br/>
            <strong>Specialty:</strong> ${h.specialty}<br/>
            <strong>ICU Beds:</strong> ${h.availableEmergencyBeds}<br/>
            <strong>ETA:</strong> ${formatMinutes(h.estimatedMinutes)} (${formatDistance(h.distanceKm)})<br/>
            <button style="margin-top: 4px; background: #059669; color: white; border: none; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;" onclick="window.selectHospitalByName && window.selectHospitalByName('${h.name}')">Select Hospital</button>
          </div>
        `);
        allPoints.push([h.coordinates[0], h.coordinates[1]]);
      });
    }

    // Auto fit bounds
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
    }
  }, [routes, activeRouteId, driverCoords, patientCoords, originName, destinationName, stage, hospitals, selectedHospital, isLiveTracking]);

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
    if (driverCoords && driverCoords.latitude && driverCoords.longitude) {
      map.setView([driverCoords.latitude, driverCoords.longitude], 15, { animate: true });
    } else if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 0) {
      map.setView([activeRoute.coordinates[0][0], activeRoute.coordinates[0][1]], 15, { animate: true });
    }
  };

  // Center on Full Route handler
  const handleCenterRoute = () => {
    const map = mapInstanceRef.current;
    if (!map || !activeRoute || !activeRoute.coordinates || activeRoute.coordinates.length === 0) return;
    const bounds = L.latLngBounds(activeRoute.coordinates.map((pt) => [pt[0], pt[1]]));
    map.fitBounds(bounds, { padding: [45, 45], animate: true });
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

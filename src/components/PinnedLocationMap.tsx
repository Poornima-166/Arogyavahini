import React, { useEffect, useRef } from 'react';
import L from '../utils/leafletPatch';
import { Crosshair, MapPin, ShieldCheck } from 'lucide-react';

interface PinnedLocationMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  onRefreshLocation?: () => void;
  isRefreshing?: boolean;
}

export const PinnedLocationMap: React.FC<PinnedLocationMapProps> = ({
  latitude,
  longitude,
  accuracy,
  address,
  onRefreshLocation,
  isRefreshing = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Clear any prior leaflet container identifier if left over
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([latitude, longitude], 16);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Update marker
    const pinIcon = L.divIcon({
      className: 'pinned-patient-marker',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background: rgba(220, 38, 38, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 32px; height: 32px; background: #dc2626; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(220,38,38,0.5);">
            <span style="font-size: 15px;">📍</span>
          </div>
          <div style="position: absolute; -top: 20px; background: #991b1b; color: #ffffff; font-size: 9px; font-weight: 800; padding: 1.5px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            AUTO-PINNED GPS
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (markerRef.current) {
      try {
        markerRef.current.setLatLng([latitude, longitude]);
      } catch {
        markerRef.current = L.marker([latitude, longitude], { icon: pinIcon }).addTo(map);
      }
    } else {
      const m = L.marker([latitude, longitude], { icon: pinIcon }).addTo(map);
      markerRef.current = m;
    }

    // Update accuracy circle
    const accRadius = Math.max(accuracy || 15, 10);
    if (circleRef.current) {
      try {
        circleRef.current.setLatLng([latitude, longitude]);
        circleRef.current.setRadius(accRadius);
      } catch {
        circleRef.current = L.circle([latitude, longitude], {
          radius: accRadius,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.15,
          weight: 1.5,
        }).addTo(map);
      }
    } else {
      const c = L.circle([latitude, longitude], {
        radius: accRadius,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.15,
        weight: 1.5,
      }).addTo(map);
      circleRef.current = c;
    }

    try {
      map.setView([latitude, longitude], map.getZoom() || 16, { animate: false });
    } catch {
      // safe fallback
    }
  }, [latitude, longitude, accuracy]);

  useEffect(() => {
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
      markerRef.current = null;
      circleRef.current = null;
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.setView([latitude, longitude], 16, { animate: false });
      } catch {
        // safe fallback
      }
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-44 sm:h-52 z-0" />

      {/* Floating control bar on top */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-700/80 shadow-md flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Auto-Pinned Location</span>
          {accuracy && (
            <span className="text-slate-400 text-[10px] font-mono">±{Math.round(accuracy)}m</span>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRecenter}
            title="Recenter pin on map"
            className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 shadow-md transition cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          {onRefreshLocation && (
            <button
              type="button"
              onClick={onRefreshLocation}
              disabled={isRefreshing}
              title="Refresh GPS location pin"
              className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <MapPin className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-bounce text-red-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Floating bottom coordinates bar */}
      <div className="absolute bottom-2.5 left-2.5 right-12 z-10 pointer-events-none">
        <div className="bg-slate-950/85 backdrop-blur-xs text-slate-300 px-2.5 py-1 rounded-md text-[10px] font-mono truncate border border-slate-800/80 inline-block max-w-full">
          📍 {latitude.toFixed(5)}, {longitude.toFixed(5)} {address ? `• ${address}` : ''}
        </div>
      </div>
    </div>
  );
};

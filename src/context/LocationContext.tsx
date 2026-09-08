import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { HospitalOption } from '../types';

export interface UserCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number | null;
  heading?: number | null;
}

export type LocationPermissionStatus = 'prompt' | 'granted' | 'denied' | 'locating' | 'unavailable';
export type LocationSource = 'gps' | 'ip' | 'preset' | 'cached' | 'default';

export interface LocationPreset {
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}

export const CITY_PRESETS: LocationPreset[] = [
  { name: 'Bengaluru Central / Vidhana Soudha', city: 'Bengaluru', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Bengaluru Indiranagar 100ft Rd', city: 'Bengaluru', latitude: 12.9784, longitude: 77.6408 },
  { name: 'Bengaluru Whitefield ITPL', city: 'Bengaluru', latitude: 12.9698, longitude: 77.7499 },
  { name: 'Mumbai Nariman Point / Marine Lines', city: 'Mumbai', latitude: 18.9220, longitude: 72.8347 },
  { name: 'Delhi Connaught Place / AIIMS', city: 'Delhi', latitude: 28.6315, longitude: 77.2167 },
  { name: 'Hyderabad Hitec City Cyber Towers', city: 'Hyderabad', latitude: 17.4435, longitude: 78.3772 },
  { name: 'Chennai Anna Salai / Greams Rd', city: 'Chennai', latitude: 13.0604, longitude: 80.2496 },
  { name: 'Kolkata Park Street / Medical College', city: 'Kolkata', latitude: 22.5535, longitude: 88.3518 },
];

export interface LocationContextType {
  userCoords: UserCoordinates | null;
  locationPermission: LocationPermissionStatus;
  locationSource: LocationSource;
  resolvedAddress: string | null;
  cityName: string | null;
  nearbyHospitals: HospitalOption[];
  isLoadingHospitals: boolean;
  hospitalSearchSource: 'live_places' | 'fallback' | null;
  hospitalSearchMessage: string | null;
  lastGpsTimestamp: string | null;
  isLocating: boolean;
  requestLocation: (highAccuracy?: boolean) => Promise<UserCoordinates | null>;
  setManualCoords: (lat: number, lng: number, customAddress?: string) => Promise<void>;
  refreshHospitals: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with saved coords from localStorage or null
  const [userCoords, setUserCoords] = useState<UserCoordinates | null>(() => {
    try {
      const saved = localStorage.getItem('arogyavahini_saved_coords');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [locationPermission, setLocationPermission] = useState<LocationPermissionStatus>('prompt');
  const [locationSource, setLocationSource] = useState<LocationSource>(() => {
    return localStorage.getItem('arogyavahini_saved_coords') ? 'cached' : 'default';
  });
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string | null>('Bengaluru');
  const [nearbyHospitals, setNearbyHospitals] = useState<HospitalOption[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState<boolean>(false);
  const [hospitalSearchSource, setHospitalSearchSource] = useState<'live_places' | 'fallback' | null>(null);
  const [hospitalSearchMessage, setHospitalSearchMessage] = useState<string | null>(null);
  const [lastGpsTimestamp, setLastGpsTimestamp] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const lastSyncCoordsRef = useRef<string>('');

  // Synchronize fleet and load nearby hospitals when user coords are discovered or updated
  const onLocationResolved = async (
    coords: UserCoordinates, 
    source: LocationSource = 'gps', 
    forcedAddress?: string
  ) => {
    setUserCoords(coords);
    setLocationSource(source);
    setLastGpsTimestamp(new Date().toLocaleTimeString());

    try {
      localStorage.setItem('arogyavahini_saved_coords', JSON.stringify(coords));
    } catch {
      // ignore
    }

    // 1. Reverse Geocode real GPS coordinates
    let formattedAddr: string | null = forcedAddress || null;
    if (!formattedAddr) {
      try {
        const geo = await api.reverseGeocode(coords.latitude, coords.longitude);
        if (geo && geo.formattedAddress) {
          formattedAddr = geo.formattedAddress;
          setResolvedAddress(geo.formattedAddress);
          // Try to extract city from address
          const parts = geo.formattedAddress.split(',');
          if (parts.length > 2) {
            setCityName(parts[parts.length - 3].trim());
          }
        } else {
          formattedAddr = `GPS [${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}]`;
          setResolvedAddress(formattedAddr);
        }
      } catch {
        formattedAddr = `GPS [${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}]`;
        setResolvedAddress(formattedAddr);
      }
    } else {
      setResolvedAddress(formattedAddr);
    }

    // 2. Synchronize standby ambulances around the user's actual location (avoid repeat syncs for trivial movements)
    const coordKey = `${coords.latitude.toFixed(3)},${coords.longitude.toFixed(3)}`;
    if (lastSyncCoordsRef.current !== coordKey) {
      lastSyncCoordsRef.current = coordKey;
      api.syncFleetLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: formattedAddr || undefined,
      }).catch((err) => console.warn('Fleet sync notification:', err));
    }

    // 3. Discover real nearby hospitals around this location via Google Places API
    loadHospitalsForCoords(coords.latitude, coords.longitude);
  };

  const loadHospitalsForCoords = async (lat: number, lng: number) => {
    setIsLoadingHospitals(true);
    try {
      const res = await api.getNearbyHospitals({ lat, lng, radius: 12000 });
      if (res && res.hospitals && res.hospitals.length > 0) {
        setNearbyHospitals(res.hospitals);
        setHospitalSearchSource((res.source as 'live_places' | 'fallback') || 'live_places');
        setHospitalSearchMessage(res.message || 'Hospitals discovered in your vicinity');
      }
    } catch (err) {
      console.warn('Failed to load nearby hospitals:', err);
    } finally {
      setIsLoadingHospitals(false);
    }
  };

  // Browser Geolocation with progressive fallback
  const requestLocation = async (highAccuracy: boolean = true): Promise<UserCoordinates | null> => {
    setIsLocating(true);
    setLocationPermission('locating');

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationPermission('unavailable');
        setIsLocating(false);
        // Fallback to IP location
        fallbackToIpLocation().then(resolve);
        return;
      }

      let hasResolved = false;

      // Quick fallback timer: if browser GPS prompt is ignored or hanging for > 6s, fetch IP location in background so user doesn't wait
      const ipFallbackTimer = setTimeout(() => {
        if (!hasResolved && !userCoords) {
          console.log('GPS prompt pending, acquiring IP geolocation fallback...');
          fallbackToIpLocation();
        }
      }, 3500);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          hasResolved = true;
          clearTimeout(ipFallbackTimer);
          setIsLocating(false);
          const coords: UserCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : 10,
            speed: position.coords.speed,
            heading: position.coords.heading,
          };
          setLocationPermission('granted');
          await onLocationResolved(coords, 'gps');
          resolve(coords);
        },
        async (err) => {
          hasResolved = true;
          clearTimeout(ipFallbackTimer);
          setIsLocating(false);
          console.warn('Geolocation acquisition error code:', err.code, err.message);
          if (err.code === 1) {
            setLocationPermission('denied');
          } else {
            setLocationPermission('unavailable');
          }

          // On error, fallback to IP location if we don't have userCoords yet
          if (!userCoords) {
            const ipCoords = await fallbackToIpLocation();
            resolve(ipCoords);
          } else {
            resolve(userCoords);
          }
        },
        { 
          enableHighAccuracy: highAccuracy, 
          timeout: highAccuracy ? 8000 : 4000, 
          maximumAge: 10000 
        }
      );
    });
  };

  // Fast IP Geolocation fallback
  const fallbackToIpLocation = async (): Promise<UserCoordinates | null> => {
    try {
      const ipData = await api.getIpLocation();
      if (ipData && typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
        const coords: UserCoordinates = {
          latitude: ipData.latitude,
          longitude: ipData.longitude,
          accuracy: 500, // approximate city radius
        };
        if (ipData.city) setCityName(ipData.city);
        await onLocationResolved(coords, 'ip', `${ipData.city || 'Regional Center'}, ${ipData.region || ''} ${ipData.country || ''}`.trim());
        return coords;
      }
    } catch (err) {
      console.warn('IP geolocation query error:', err);
    }

    // Default Anchor: Bengaluru Central Command
    const defaultCoords: UserCoordinates = {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 25,
    };
    await onLocationResolved(defaultCoords, 'default', 'Vidhana Soudha, Bengaluru, Karnataka, India');
    return defaultCoords;
  };

  const setManualCoords = async (lat: number, lng: number, customAddress?: string) => {
    const coords: UserCoordinates = {
      latitude: lat,
      longitude: lng,
      accuracy: 10,
    };
    setLocationPermission('granted');
    await onLocationResolved(coords, 'preset', customAddress);
  };

  const refreshHospitals = async () => {
    if (userCoords) {
      await loadHospitalsForCoords(userCoords.latitude, userCoords.longitude);
    }
  };

  // Immediate location pipeline on load
  useEffect(() => {
    let isMounted = true;

    const initializeLocation = async () => {
      // 1. If we already have cached coords from localStorage, sync them immediately
      if (userCoords && isMounted) {
        onLocationResolved(userCoords, 'cached');
      }

      // 2. Request live GPS (or fallback to IP if browser blocks)
      await requestLocation(true);

      // 3. Establish continuous GPS watchPosition for live movement tracking
      if (navigator.geolocation && isMounted) {
        try {
          const id = navigator.geolocation.watchPosition(
            (position) => {
              if (!isMounted) return;
              const coords: UserCoordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : 10,
                speed: position.coords.speed,
                heading: position.coords.heading,
              };
              setUserCoords(coords);
              setLocationSource('gps');
              setLocationPermission('granted');
              setLastGpsTimestamp(new Date().toLocaleTimeString());
            },
            (err) => {
              console.warn('Continuous GPS watch notification:', err.message);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
          );
          watchIdRef.current = id;
        } catch (e) {
          console.warn('Could not establish geolocation watch:', e);
        }
      }
    };

    initializeLocation();

    return () => {
      isMounted = false;
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <LocationContext.Provider
      value={{
        userCoords,
        locationPermission,
        locationSource,
        resolvedAddress,
        cityName,
        nearbyHospitals,
        isLoadingHospitals,
        hospitalSearchSource,
        hospitalSearchMessage,
        lastGpsTimestamp,
        isLocating,
        requestLocation,
        setManualCoords,
        refreshHospitals,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

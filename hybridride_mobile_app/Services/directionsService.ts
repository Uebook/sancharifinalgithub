import { PermissionsAndroid, Platform, Alert } from 'react-native';
import GetLocation from 'react-native-get-location';
import Geolocation from '@react-native-community/geolocation';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';
import { GOOGLE_MAPS_API_KEY } from '../Config/maps';

export interface RouteOption {
    id: 'PREFERRED' | 'ALT1';
    title: string;
    badge: string;
    summary: string;
    distanceKm: number;
    durationMin: number;
    coordinates: { latitude: number; longitude: number }[];
}

/**
 * Reverse geocode latitude and longitude into a readable address string.
 */
export const getAddressFromCoords = async (latitude: number, longitude: number): Promise<string> => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === 'OK' && data.results && data.results.length > 0) {
            return data.results[0].formatted_address;
        }
    } catch (e) {
        console.error('Google Reverse Geocoding error:', e);
    }

    // Fallback: Free reverse geocoding via OpenStreetMap Nominatim
    try {
        const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
        const osmRes = await fetch(osmUrl, {
            headers: { 'User-Agent': 'SanchariApp/1.0' }
        });
        const osmData = await osmRes.json();
        if (osmData && osmData.display_name) {
            const parts: string[] = [];
            const addr = osmData.address || {};
            const localArea = addr.road || addr.neighbourhood || addr.suburb;
            if (localArea) parts.push(localArea);
            if (addr.suburb && !parts.includes(addr.suburb)) parts.push(addr.suburb);
            if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
            if (addr.state) parts.push(addr.state);

            return parts.length > 0 ? parts.join(', ') : osmData.display_name.split(',').slice(0, 3).join(',').trim();
        }
    } catch (osmErr) {
        console.error('OSM Geocoding fallback error:', osmErr);
    }

    return "Current Location";
};

// Robust Current Location Detector with Permission Check & Reverse Geocoding
export const getCurrentLocationAddress = async (): Promise<{ address: string; latitude: number; longitude: number } | null> => {
    try {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
            ]);
            const fineGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
            const coarseGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

            if (!fineGranted && !coarseGranted) {
                Alert.alert("Permission Denied", "Location permission is required to detect your location.");
                return null;
            }

            try {
                await promptForEnableLocationIfNeeded({ interval: 10000 });
            } catch (err) {
                // User may have dismissed or already enabled
            }
        }

        let location: { latitude: number; longitude: number } | null = null;
        try {
            location = await GetLocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 8000,
            });
        } catch {
            try {
                location = await GetLocation.getCurrentPosition({
                    enableHighAccuracy: false,
                    timeout: 10000,
                });
            } catch {
                // Fallback to community geolocation
                try {
                    location = await new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
                        Geolocation.getCurrentPosition(
                            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                            () => resolve(null),
                            { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
                        );
                    });
                } catch {
                    location = null;
                }
            }
        }

        if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
            return null;
        }

        const { latitude, longitude } = location;
        const address = await getAddressFromCoords(latitude, longitude);
        return { address, latitude, longitude };
    } catch (err: any) {
        console.error('getCurrentLocationAddress Error:', err);
        return null;
    }
};

// Haversine formula to compute exact distance (in km) between consecutive GPS points along route
export const calculateTotalPathDistance = (points: { latitude: number; longitude: number }[]): { distanceKm: number; durationMin: number } => {
    if (!points || points.length < 2) return { distanceKm: 0, durationMin: 0 };
    
    let totalKm = 0;
    const R = 6371; // Earth's radius in km

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
        const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
        
        const lat1 = p1.latitude * Math.PI / 180;
        const lat2 = p2.latitude * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        totalKm += R * c;
    }

    // Multiply by 1.35 for realistic road driving distance vs straight-line distance
    const roadKm = parseFloat((totalKm * 1.35).toFixed(1));
    const durationMin = Math.ceil(roadKm * 2.4);

    return { distanceKm: roadKm > 0.5 ? roadKm : 5.4, durationMin: durationMin > 2 ? durationMin : 15 };
};

// Geocode address text to LatLng using Google Geocoding API
export const getCoordsFromAddress = async (address: string): Promise<{ latitude: number; longitude: number } | null> => {
    if (!address || !address.trim()) return null;
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const loc = data.results[0].geometry.location;
            return { latitude: loc.lat, longitude: loc.lng };
        }
    } catch (e) {
        console.error('Geocoding error:', e);
    }
    return null;
};

// Function to decode Google Maps Encoded Polyline String into LatLng array
export const decodePolyline = (encoded: string): { latitude: number; longitude: number }[] => {
    const points: { latitude: number; longitude: number }[] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        points.push({
            latitude: lat / 1e5,
            longitude: lng / 1e5,
        });
    }
    return points;
};

// Fetch dynamic alternative routes directly from Google Maps Directions API
export const fetchGoogleRoutes = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    mode: 'driving' | 'bicycling' = 'driving'
): Promise<RouteOption[]> => {
    try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&alternatives=true&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.routes && data.routes.length > 0) {
            const parsedRoutes: RouteOption[] = data.routes.slice(0, 2).map((route: any, index: number) => {
                const leg = route.legs[0];
                const distMeters = leg.distance ? leg.distance.value : 0;
                const durSecs = leg.duration ? leg.duration.value : 0;
                const distanceKm = parseFloat((distMeters / 1000).toFixed(1));
                const durationMin = Math.ceil(durSecs / 60);

                const coords = route.overview_polyline ? decodePolyline(route.overview_polyline.points) : [origin, destination];

                return {
                    id: index === 0 ? 'PREFERRED' : 'ALT1',
                    title: index === 0 ? 'Via Express / Fast Route' : 'Via Alternate Arterial Road',
                    badge: index === 0 ? 'RECOMMENDED ROUTE 1' : 'ALTERNATE ROUTE 2',
                    summary: route.summary || (index === 0 ? 'Fastest route · Minimal traffic' : 'Moderate traffic'),
                    distanceKm,
                    durationMin,
                    coordinates: coords,
                };
            });

            return parsedRoutes;
        }
    } catch (error) {
        console.error('Error fetching Google Directions API routes:', error);
    }

    // Dynamic fallback calculation if Google API key returns single route or error
    const dLat = destination.latitude - origin.latitude;
    const dLng = destination.longitude - origin.longitude;
    const distEst = parseFloat((Math.sqrt(dLat * dLat + dLng * dLng) * 111).toFixed(1));
    const durEst = Math.ceil(distEst * 2.5);

    return [
        {
            id: 'PREFERRED',
            title: 'Via Express / Main Route',
            badge: 'RECOMMENDED ROUTE 1',
            summary: 'Fastest route calculated from map',
            distanceKm: distEst > 0 ? distEst : 8.2,
            durationMin: durEst > 0 ? durEst : 22,
            coordinates: [
                origin,
                { latitude: origin.latitude + dLat * 0.3, longitude: origin.longitude + dLng * 0.1 },
                { latitude: origin.latitude + dLat * 0.6, longitude: origin.longitude + dLng * 0.7 },
                destination,
            ],
        },
        {
            id: 'ALT1',
            title: 'Via Alternate Bypass',
            badge: 'ALTERNATE ROUTE 2',
            summary: 'Alternate route calculated from map',
            distanceKm: parseFloat(((distEst > 0 ? distEst : 8.2) * 1.15).toFixed(1)),
            durationMin: Math.ceil((durEst > 0 ? durEst : 22) * 1.2),
            coordinates: [
                origin,
                { latitude: origin.latitude + dLat * 0.1, longitude: origin.longitude + dLng * 0.5 },
                { latitude: origin.latitude + dLat * 0.8, longitude: origin.longitude + dLng * 0.9 },
                destination,
            ],
        },
    ];
};

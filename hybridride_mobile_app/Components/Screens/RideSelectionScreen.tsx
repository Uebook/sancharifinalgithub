import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { GOOGLE_MAPS_API_KEY } from '../../Config/maps';
import { fetchGoogleRoutes, getCoordsFromAddress } from '../../Services/directionsService';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft,
    faUser,
    faClock,
    faWallet,
    faCarSide,
    faMotorcycle,
    faUsers,
    faCar,
    faToiletPortable, // Using compatible icon for auto-rickshaw/similar if needed, or faCar
    faTruckPickup,
    faCalendarDays,
    faPlus,
    faMinus,
    faLocationCrosshairs,
} from '@fortawesome/free-solid-svg-icons';
import CalendarModal from '../Common/CalendarModal';
import TimePickerModal from '../Common/TimePickerModal';

const { width, height } = Dimensions.get('window');

const RideSelectionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const mapRef = useRef<MapView | null>(null);
    const { pickupAddress, pickupCoords, dropoffAddress, dropoffCoords } = (route.params as any) || {};

    const [rideType, setRideType] = useState('POOLING'); // POOLING | INSTANT
    const [selectedRide, setSelectedRide] = useState('SHARE_CAR'); // Default for Pooling
    const [selectedDate, setSelectedDate] = useState('dd-mm-yyyy');
    const [selectedTime, setSelectedTime] = useState('hh:mm');
    const [showCalendar, setShowCalendar] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [calculatedEta, setCalculatedEta] = useState<number | null>(null);
    const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
    const [bookingOtp, setBookingOtp] = useState<string>('');
    const [originCoords, setOriginCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);

    useEffect(() => {
        // Set default date and time to Today/Now
        const now = new Date();
        const d = now.getDate();
        const m = now.toLocaleString('en-US', { month: 'short' });
        const y = now.getFullYear();
        setSelectedDate(`${d < 10 ? '0' + d : d}-${m}-${y}`);

        let h = now.getHours();
        const mins = now.getMinutes();
        const p = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        setSelectedTime(`${h}:${mins < 10 ? '0' + mins : mins} ${p}`);
    }, []);

    // Load coordinates and dynamic routes with polyline preview
    useEffect(() => {
        let isMounted = true;

        const loadRoute = async () => {
            try {
                let orig: { latitude: number; longitude: number } | null = null;
                let dest: { latitude: number; longitude: number } | null = null;

                // 1. Resolve Origin
                if (pickupCoords) {
                    if (Array.isArray(pickupCoords) && pickupCoords.length >= 2) {
                        orig = { latitude: Number(pickupCoords[1]), longitude: Number(pickupCoords[0]) };
                    } else if (pickupCoords.latitude && pickupCoords.longitude) {
                        orig = { latitude: Number(pickupCoords.latitude), longitude: Number(pickupCoords.longitude) };
                    }
                }
                if (!orig && pickupAddress) {
                    orig = await getCoordsFromAddress(pickupAddress);
                }
                if (!orig) {
                    orig = { latitude: 17.4486, longitude: 78.3808 }; // Hyderabad fallback
                }

                // 2. Resolve Destination
                if (dropoffCoords) {
                    if (Array.isArray(dropoffCoords) && dropoffCoords.length >= 2) {
                        dest = { latitude: Number(dropoffCoords[1]), longitude: Number(dropoffCoords[0]) };
                    } else if (dropoffCoords.latitude && dropoffCoords.longitude) {
                        dest = { latitude: Number(dropoffCoords.latitude), longitude: Number(dropoffCoords.longitude) };
                    }
                }
                if (!dest && dropoffAddress) {
                    dest = await getCoordsFromAddress(dropoffAddress);
                }
                if (!dest) {
                    dest = { latitude: 17.4401, longitude: 78.3489 }; // Gachibowli fallback
                }

                if (!isMounted) return;
                setOriginCoords(orig);
                setDestinationCoords(dest);

                // 3. Fetch Google Routes (includes automatic math fallback if quota/key denied)
                const routes = await fetchGoogleRoutes(orig, dest, 'driving');
                if (routes && routes.length > 0 && isMounted) {
                    const primaryRoute = routes[0];
                    setRouteCoordinates(primaryRoute.coordinates);
                    setCalculatedDistance(primaryRoute.distanceKm);
                    setCalculatedEta(primaryRoute.durationMin);

                    if (mapRef.current && primaryRoute.coordinates && primaryRoute.coordinates.length > 0) {
                        setTimeout(() => {
                            mapRef.current?.fitToCoordinates(primaryRoute.coordinates, {
                                edgePadding: { top: 90, right: 60, bottom: 350, left: 60 },
                                animated: true,
                            });
                        }, 400);
                    }
                }
            } catch (err) {
                console.error('RideSelection route calculation error:', err);
                if (isMounted) {
                    setCalculatedDistance(8.2);
                    setCalculatedEta(22);
                }
            }
        };

        loadRoute();

        return () => {
            isMounted = false;
        };
    }, [pickupCoords, dropoffCoords, pickupAddress, dropoffAddress]);

    const estimateFare = (distKm: number, durMin: number, type: string) => {
        const rates: any = {
            SHARE_CAR: { base: 50, perKm: 14, perMin: 1.5, minFare: 80, baseDist: 2 },
            DIRECT_CAR: { base: 80, perKm: 16, perMin: 2.5, minFare: 120, baseDist: 2 },
            AUTO: { base: 40, perKm: 8, perMin: 1, minFare: 50, baseDist: 1.5 },
            BIKE_POOL: { base: 20, perKm: 6, perMin: 0.9, minFare: 25, baseDist: 1 },
            BIKE_INSTANT: { base: 25, perKm: 7, perMin: 1, minFare: 30, baseDist: 1 },
        };
        const r = rates[type] || rates.SHARE_CAR;

        // Base fare covers first r.baseDist km
        const distanceCharge = Math.max(0, distKm - r.baseDist) * r.perKm;
        const timeCharge = durMin * r.perMin;
        const total = r.base + distanceCharge + timeCharge;

        return Math.max(r.minFare, Math.round(total));
    };

    // ─── Distance-based eligibility ───────────────────────────────────────────
    // Bikes are city-only transport. For trips > 100 km, only cars are allowed.
    // This mirrors Rapido/Ola's vehicle eligibility rules.
    const LONG_DISTANCE_THRESHOLD_KM = 100;
    const isLongDistance = (calculatedDistance ?? 0) > LONG_DISTANCE_THRESHOLD_KM;

    // Auto-deselect bike/auto if distance exceeds threshold
    React.useEffect(() => {
        if (isLongDistance && (selectedRide === 'BIKE_POOL' || selectedRide === 'BIKE_INSTANT' || selectedRide === 'AUTO' || selectedRide === 'AUTO_INSTANT')) {
            setSelectedRide(rideType === 'POOLING' ? 'SHARE_CAR' : 'DIRECT_CAR');
        }
    }, [isLongDistance]);
    // ─────────────────────────────────────────────────────────────────────────

    // Reset selected ride when switching modes
    const handleRideTypeChange = (type: string) => {
        setRideType(type);
        if (type === 'POOLING') {
            setSelectedRide('SHARE_CAR');
        } else {
            setSelectedRide('DIRECT_CAR');
        }
    };

    const labelMap: Record<string, string> = {
        SHARE_CAR: 'SHARE CAR',
        BIKE_POOL: 'BIKE',
        DIRECT_CAR: 'DIRECT CAR',
        AUTO: 'AUTO',
        BIKE_INSTANT: 'BIKE',
    };

    const getConfirmText = () => {
        const label = labelMap[selectedRide] || selectedRide.replace('_', ' ');
        return `Confirm ${label} (₹${getActiveFare()})`;
    };

    // ─── Single source of truth for the currently-selected fare ────────────────
    // Each vehicle type uses a different ETA multiplier in the card renders.
    // This function mirrors those exact multipliers so the confirm button
    // ALWAYS shows the same price as the card above it.
    const getActiveFare = (): number => {
        const dist = calculatedDistance || 5;
        const eta = calculatedEta || 15;
        switch (selectedRide) {
            case 'SHARE_CAR': return estimateFare(dist, eta, 'SHARE_CAR');
            case 'BIKE_POOL': return estimateFare(dist, Math.max(1, Math.floor(eta * 0.7)), 'BIKE_POOL');
            case 'DIRECT_CAR': return estimateFare(dist, Math.max(1, Math.floor(eta * 0.8)), 'DIRECT_CAR');
            case 'AUTO': return estimateFare(dist, Math.max(1, Math.floor(eta * 0.6)), 'AUTO');
            case 'BIKE_INSTANT': return estimateFare(dist, Math.max(1, Math.floor(eta * 0.6)), 'BIKE_INSTANT');
            default: return estimateFare(dist, eta, selectedRide);
        }
    };
    // ────────────────────────────────────────────────────────────────────────

    const handleConfirm = () => {
        const dist = calculatedDistance || 5;
        const dur = calculatedEta || 15;
        const fare = getActiveFare(); // Uses same multipliers as the card

        const resolvedPickup = originCoords ? [originCoords.longitude, originCoords.latitude] : pickupCoords;
        const resolvedDropoff = destinationCoords ? [destinationCoords.longitude, destinationCoords.latitude] : dropoffCoords;

        if (rideType === 'POOLING') {
            let isoDateString = new Date().toISOString();
            if (selectedDate !== 'dd-mm-yyyy' && selectedTime !== 'hh:mm') {
                try {
                    const [day, monthStr, year] = selectedDate.split('-');
                    const [time, period] = selectedTime.split(' ');
                    let [hour, minute] = time.split(':');

                    const monthMap: { [key: string]: number } = {
                        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
                        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
                    };

                    let h = parseInt(hour);
                    if (period === 'PM' && h < 12) h += 12;
                    if (period === 'AM' && h === 12) h = 0;

                    const scheduledDateObj = new Date(parseInt(year), monthMap[monthStr] || 0, parseInt(day), h, parseInt(minute));
                    if (!isNaN(scheduledDateObj.getTime())) {
                        isoDateString = scheduledDateObj.toISOString();
                    }
                } catch (e) {
                    console.log('Error parsing date:', e);
                }
            }

            (navigation as any).navigate('AvailableRides', {
                type: isLongDistance ? 'outstation' : 'local',
                rideData: { type: rideType, vehicle: selectedRide, price: fare },
                date: isoDateString,
                fromLocation: pickupAddress || 'Pickup Location',
                toLocation: dropoffAddress || 'Drop-off Destination',
                pickupCoords: resolvedPickup,
                dropoffCoords: resolvedDropoff,
                distance: dist,
                duration: dur
            });
        } else {
            // Instant ride confirmation
            (navigation as any).navigate('TripDetails', {
                rideData: {
                    type: rideType,
                    vehicle: selectedRide,
                    price: fare
                },
                date: new Date().toISOString(),
                fromLocation: pickupAddress || 'Pickup Location',
                toLocation: dropoffAddress || 'Drop-off Destination',
                pickupCoords: resolvedPickup,
                dropoffCoords: resolvedDropoff,
                distance: dist,
                duration: dur
            });
        }
    };

    const handleZoomIn = async () => {
        if (!mapRef.current) return;
        try {
            const camera = await mapRef.current.getCamera();
            if (camera && typeof camera.zoom === 'number') {
                mapRef.current.animateCamera({ zoom: Math.min(20, camera.zoom + 1) }, { duration: 250 });
            }
        } catch (e) {
            console.log('Zoom in error:', e);
        }
    };

    const handleZoomOut = async () => {
        if (!mapRef.current) return;
        try {
            const camera = await mapRef.current.getCamera();
            if (camera && typeof camera.zoom === 'number') {
                mapRef.current.animateCamera({ zoom: Math.max(3, camera.zoom - 1) }, { duration: 250 });
            }
        } catch (e) {
            console.log('Zoom out error:', e);
        }
    };

    const handleRecenter = () => {
        if (mapRef.current && routeCoordinates.length > 0) {
            mapRef.current.fitToCoordinates(routeCoordinates, {
                edgePadding: { top: 90, right: 60, bottom: 350, left: 60 },
                animated: true,
            });
        }
    };

    return (
        <View style={styles.container}>
            {/* Real Google Map Background with Pinch-to-Zoom & Pan Enabled */}
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.mapBackground}
                zoomEnabled={true}
                pitchEnabled={true}
                rotateEnabled={true}
                scrollEnabled={true}
                zoomTapEnabled={true}
                showsCompass={true}
                minZoomLevel={3}
                maxZoomLevel={20}
                initialRegion={{
                    latitude: originCoords?.latitude || (pickupCoords ? pickupCoords[1] : 17.4486),
                    longitude: originCoords?.longitude || (pickupCoords ? pickupCoords[0] : 78.3808),
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                {originCoords && (
                    <Marker
                        coordinate={originCoords}
                        title="Pickup"
                        description={pickupAddress || 'Pickup Location'}
                        pinColor="green"
                    />
                )}
                {destinationCoords && (
                    <Marker
                        coordinate={destinationCoords}
                        title="Destination"
                        description={dropoffAddress || 'Drop-off Destination'}
                        pinColor="red"
                    />
                )}

                {/* Polyline Route Preview */}
                {routeCoordinates.length > 0 ? (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor="#059669"
                        strokeWidth={5}
                    />
                ) : (
                    originCoords && destinationCoords && (
                        <Polyline
                            coordinates={[originCoords, destinationCoords]}
                            strokeColor="#059669"
                            strokeWidth={4}
                            lineDashPattern={[2, 5]}
                        />
                    )
                )}
            </MapView>

            <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
                {/* Header & Floating Map Controls */}
                <View style={styles.header} pointerEvents="box-none">
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <View style={styles.backButtonCircle}>
                            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#111827" />
                        </View>
                    </TouchableOpacity>

                    {/* Floating Zoom & Recenter Controls */}
                    <View style={styles.floatingMapControls}>
                        <TouchableOpacity
                            style={styles.mapControlBtn}
                            onPress={handleZoomIn}
                            activeOpacity={0.8}
                        >
                            <FontAwesomeIcon icon={faPlus} size={15} color="#111827" />
                        </TouchableOpacity>

                        <View style={styles.mapControlDivider} />

                        <TouchableOpacity
                            style={styles.mapControlBtn}
                            onPress={handleZoomOut}
                            activeOpacity={0.8}
                        >
                            <FontAwesomeIcon icon={faMinus} size={15} color="#111827" />
                        </TouchableOpacity>

                        <View style={styles.mapControlDivider} />

                        <TouchableOpacity
                            style={styles.mapControlBtn}
                            onPress={handleRecenter}
                            activeOpacity={0.8}
                        >
                            <FontAwesomeIcon icon={faLocationCrosshairs} size={16} color="#059669" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bottom Sheet */}
                <View style={styles.bottomSheet}>
                    <View style={styles.dragHandle} />

                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                rideType === 'POOLING' && styles.activeToggle
                            ]}
                            onPress={() => handleRideTypeChange('POOLING')}
                        >
                            <Text style={[styles.toggleText, rideType === 'POOLING' && styles.activeToggleText]}>POOLING</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                rideType === 'INSTANT' && styles.activeToggleInstant
                            ]}
                            onPress={() => handleRideTypeChange('INSTANT')}
                        >
                            <Text style={[styles.toggleText, rideType === 'INSTANT' && styles.activeToggleTextInstant]}>INSTANT</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                        {/* POOLING CONTENT */}
                        {rideType === 'POOLING' && (
                            <>
                                {/* Seat Preference */}
                                <View style={styles.preferenceCard}>
                                    <View style={styles.preferenceLeft}>
                                        <View style={styles.iconContainerTeal}>
                                            <FontAwesomeIcon icon={faUser} size={18} color="#FFFFFF" />
                                        </View>
                                        <View>
                                            <Text style={styles.preferenceLabel}>SEAT PREFERENCE</Text>
                                            <Text style={styles.preferenceValue}>1 Passenger</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.changeButton} onPress={() => navigation.navigate('SeatPreference' as never)}>
                                        <Text style={styles.changeButtonText}>CHANGE ROW</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Date and Time Filters */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <TouchableOpacity style={[styles.preferenceCard, { flex: 1, marginRight: 6, marginBottom: 0, padding: 12 }]} onPress={() => setShowCalendar(true)}>
                                        <View style={styles.preferenceLeft}>
                                            <View style={styles.iconContainerTeal}>
                                                <FontAwesomeIcon icon={faCalendarDays} size={18} color="#FFFFFF" />
                                            </View>
                                            <View>
                                                <Text style={styles.preferenceLabel}>DATE</Text>
                                                <Text style={styles.preferenceValue}>{selectedDate}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.preferenceCard, { flex: 1, marginLeft: 6, marginBottom: 0, padding: 12 }]} onPress={() => setShowTimePicker(true)}>
                                        <View style={styles.preferenceLeft}>
                                            <View style={styles.iconContainerTeal}>
                                                <FontAwesomeIcon icon={faClock} size={18} color="#FFFFFF" />
                                            </View>
                                            <View>
                                                <Text style={styles.preferenceLabel}>TIME</Text>
                                                <Text style={styles.preferenceValue}>{selectedTime}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {/* Ride Options */}
                                <TouchableOpacity
                                    style={[styles.rideOption, selectedRide === 'SHARE_CAR' && styles.selectedRideOption]}
                                    onPress={() => setSelectedRide('SHARE_CAR')}
                                >
                                    <View style={styles.rideInfoLeft}>
                                        <View style={styles.rideIconContainer}>
                                            <FontAwesomeIcon icon={faUsers} size={24} color="#059669" />
                                        </View>
                                        <View>
                                            <Text style={styles.rideTitle}>Share Car</Text>
                                            <Text style={styles.rideSubtitle}>
                                                {calculatedDistance ? `${calculatedDistance} km` : '... km'} • {calculatedEta ? `${calculatedEta} MINS` : '... MINS'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.rideInfoRight}>
                                        <Text style={styles.ridePrice}>
                                            {calculatedDistance
                                                ? `₹${estimateFare(calculatedDistance, calculatedEta || 15, 'SHARE_CAR')}`
                                                : 'Calculating...'}
                                        </Text>
                                        <View style={styles.etaContainer}>
                                            <Text style={styles.etaText}>SAVE 40%</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                {/* Bike Pool removed as per request */}
                            </>
                        )}

                        {/* INSTANT CONTENT */}
                        {rideType === 'INSTANT' && (
                            <>
                                <TouchableOpacity
                                    style={[styles.rideOption, selectedRide === 'DIRECT_CAR' && styles.selectedRideOptionInstant]}
                                    onPress={() => setSelectedRide('DIRECT_CAR')}
                                >
                                    <View style={styles.rideInfoLeft}>
                                        <View style={styles.rideIconContainer}>
                                            <FontAwesomeIcon icon={faCar} size={24} color="#0891B2" />
                                        </View>
                                        <View>
                                            <Text style={styles.rideTitle}>Direct Car</Text>
                                            <Text style={styles.rideSubtitle}>
                                                {calculatedDistance ? `${calculatedDistance} km` : '... km'} • {calculatedEta ? `${Math.max(1, Math.floor(calculatedEta * 0.8))} MINS` : '... MINS'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.rideInfoRight}>
                                        <Text style={styles.ridePrice}>
                                            {calculatedDistance
                                                ? `₹${estimateFare(calculatedDistance, Math.max(1, Math.floor((calculatedEta || 15) * 0.8)), 'DIRECT_CAR')}`
                                                : 'Calculating...'}
                                        </Text>
                                        <View style={styles.etaContainer}>
                                            <Text style={styles.etaText}>PRIVATE</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                {/* Auto Rickshaw \u2014 hidden for trips over 100 km */}
                                {!isLongDistance ? (
                                    <TouchableOpacity
                                        style={[styles.rideOption, selectedRide === 'AUTO' && styles.selectedRideOptionInstant]}
                                        onPress={() => setSelectedRide('AUTO')}
                                    >
                                        <View style={styles.rideInfoLeft}>
                                            <View style={styles.rideIconContainer}>
                                                <FontAwesomeIcon icon={faTruckPickup} size={24} color="#D97706" />
                                            </View>
                                            <View>
                                                <Text style={styles.rideTitle}>Auto Rickshaw</Text>
                                                <Text style={styles.rideSubtitle}>
                                                    {calculatedDistance ? `${calculatedDistance} km` : '... km'} • {calculatedEta ? `${Math.max(1, Math.floor(calculatedEta * 0.6))} MINS` : '... MINS'}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.rideInfoRight}>
                                            <Text style={styles.ridePrice}>
                                                {calculatedDistance
                                                    ? `₹${estimateFare(calculatedDistance, Math.max(1, Math.floor((calculatedEta || 15) * 0.6)), 'AUTO')}`
                                                    : 'Calculating...'}
                                            </Text>
                                            <View style={styles.etaContainer}>
                                                <Text style={styles.etaText}>ECONOMY</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.vehicleUnavailableChip}>
                                        <FontAwesomeIcon icon={faTruckPickup} size={16} color="#9CA3AF" />
                                        <Text style={styles.vehicleUnavailableText}>
                                            Auto not available for trips over {LONG_DISTANCE_THRESHOLD_KM} km
                                        </Text>
                                    </View>
                                )}

                                {/* Bike Instant — hidden for trips over 100 km */}
                                {!isLongDistance ? (
                                    <TouchableOpacity
                                        style={[styles.rideOption, selectedRide === 'BIKE_INSTANT' && styles.selectedRideOptionInstant]}
                                        onPress={() => setSelectedRide('BIKE_INSTANT')}
                                    >
                                        <View style={styles.rideInfoLeft}>
                                            <View style={styles.rideIconContainer}>
                                                <FontAwesomeIcon icon={faMotorcycle} size={24} color="#7C3AED" />
                                            </View>
                                            <View>
                                                <Text style={styles.rideTitle}>Bike</Text>
                                                <Text style={styles.rideSubtitle}>
                                                    {calculatedDistance ? `${calculatedDistance} km` : '... km'} • {calculatedEta ? `${Math.max(1, Math.floor(calculatedEta * 0.6))} MINS` : '... MINS'}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.rideInfoRight}>
                                            <Text style={styles.ridePrice}>
                                                {calculatedDistance
                                                    ? `₹${estimateFare(calculatedDistance, Math.max(1, Math.floor((calculatedEta || 15) * 0.6)), 'BIKE_INSTANT')}`
                                                    : 'Calculating...'}
                                            </Text>
                                            <View style={[styles.etaContainer, { backgroundColor: '#F5F3FF' }]}>
                                                <Text style={[styles.etaText, { color: '#7C3AED' }]}>FASTEST</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.vehicleUnavailableChip}>
                                        <FontAwesomeIcon icon={faMotorcycle} size={16} color="#9CA3AF" />
                                        <Text style={styles.vehicleUnavailableText}>
                                            Bike not available for trips over {LONG_DISTANCE_THRESHOLD_KM} km
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}

                        {/* Wallet */}
                        <View style={styles.walletContainer}>
                            <View style={styles.walletLeft}>
                                <FontAwesomeIcon icon={faWallet} size={20} color="#059669" style={{ marginRight: 12 }} />
                                <Text style={styles.walletText}>Sanchari Wallet</Text>
                            </View>

                        </View>

                    </ScrollView>

                    {/* Confirm Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                            <Text style={styles.confirmButtonText}>{getConfirmText()}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Modals placed outside main view tree overlay */}
                <CalendarModal
                    visible={showCalendar}
                    onClose={() => setShowCalendar(false)}
                    onSelectDate={setSelectedDate}
                    selectedDate={selectedDate === 'dd-mm-yyyy' ? '04-Feb-2026' : selectedDate}
                    disablePastDates={true}
                />
                <TimePickerModal
                    visible={showTimePicker}
                    onClose={() => setShowTimePicker(false)}
                    onSelectTime={setSelectedTime}
                    selectedTime={selectedTime === 'hh:mm' ? '12:00 PM' : selectedTime}
                />
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    safeArea: {
        flex: 1,
    },
    mapBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#E5E7EB',
    },
    mapRoad: {
        position: 'absolute',
        width: '150%',
        height: 40,
        backgroundColor: '#FFFFFF',
        left: -50,
    },
    mapPark: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#D1FAE5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backButton: {
        marginBottom: 20,
    },
    backButtonCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    floatingMapControls: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    mapControlBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    mapControlDivider: {
        height: 1,
        width: '100%',
        backgroundColor: '#F1F5F9',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 10,
        height: '65%', // Adjust based on content
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100, // Space for footer
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6', // Light gray bg
        borderRadius: 16,
        padding: 4,
        marginHorizontal: 20, // Add margin to align with content
        marginBottom: 20,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 14,
    },
    activeToggle: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    activeToggleInstant: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#F59E0B', // Amber/Yellow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#9CA3AF',
    },
    activeToggleText: {
        color: '#111827',
    },
    activeToggleTextInstant: {
        color: '#111827',
    },
    preferenceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F0FDFA', // Light teal bg
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    preferenceLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainerTeal: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#14B8A6', // Teal
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    preferenceLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#0D9488',
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    preferenceValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    changeButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    changeButtonText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#059669',
    },
    rideOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB', // Default gray border
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    selectedRideOption: {
        borderColor: '#10B981', // Green border when selected (Pooling)
        backgroundColor: '#F0FDFA', // Very light green bg
        borderWidth: 2,
    },
    selectedRideOptionInstant: {
        borderColor: '#0891B2', // Cyan/Blue border when selected (Instant)
        backgroundColor: '#ECFEFF', // Very light cyan bg
        borderWidth: 2,
    },
    rideInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, // Allow text to wrap if needed
    },
    rideIconContainer: {
        width: 48,
        height: 48,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    rideTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    rideSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    rideInfoRight: {
        alignItems: 'flex-end',
    },
    ridePrice: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    etaContainer: {
        backgroundColor: '#ECFDF5',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    etaText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#059669',
    },
    walletContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 30, // Space before footer area implicitly
    },
    walletLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    walletText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    laterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    laterText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#374151',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    confirmButton: {
        backgroundColor: '#111827', // Dark navy/black
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    vehicleUnavailableChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        backgroundColor: '#F9FAFB',
        marginBottom: 16,
    },
    vehicleUnavailableText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9CA3AF',
        flexShrink: 1,
    },
});

export default RideSelectionScreen;

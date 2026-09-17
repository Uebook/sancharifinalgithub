import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Image,
    Animated,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faCircle,
    faSackDollar,
    faStar,
    faLocationDot
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../Context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { getNearbyRides, acceptRide, getDriverEarnings } from '../../Services/rideService';

const { width, height } = Dimensions.get('window');

const DriverOnlineScreen = () => {
    const navigation = useNavigation();
    const { logout } = useAuth();

    const [pendingRides, setPendingRides] = useState<any[]>([]);
    const [currentRideIndex, setCurrentRideIndex] = useState(0);
    const [accepting, setAccepting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [todayEarnings, setTodayEarnings] = useState<number>(0);

    const [pulseAnim] = useState(new Animated.Value(1));
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Timer bar animation (30 second countdown per ride)
    const timerAnim = useRef(new Animated.Value(1)).current;
    const timerAnimation = useRef<Animated.CompositeAnimation | null>(null);

    // ─── Pulse animation ────────────────────────────────────
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // ─── Fetch today's earnings on mount ────────────────────
    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const result = await getDriverEarnings();
                if (result?.success && result?.data?.today !== undefined) {
                    setTodayEarnings(result.data.today);
                }
            } catch { /* silent fail — shows ₹0 as fallback */ }
        };
        fetchEarnings();
    }, []);

    // ─── Fetch pending rides & poll every 8 sec ─────────────
    const fetchRides = useCallback(async () => {
        try {
            const result = await getNearbyRides();
            if (result.success && result.data.length > 0) {
                setPendingRides(result.data);
                setCurrentRideIndex(0);
            } else {
                setPendingRides([]);
            }
        } catch { /* network error — retry on next tick */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchRides();
        pollingRef.current = setInterval(fetchRides, 8000);
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [fetchRides]);

    // ─── Timer bar reset when a new ride shows up ────────────
    useEffect(() => {
        if (pendingRides.length > 0) {
            timerAnim.setValue(1);
            timerAnimation.current = Animated.timing(timerAnim, {
                toValue: 0,
                duration: 30000, // 30 seconds to accept
                useNativeDriver: false,
            });
            timerAnimation.current.start(({ finished }) => {
                if (finished) {
                    // Auto-dismiss this ride request, show next
                    setCurrentRideIndex(i => i + 1);
                }
            });
        }
        return () => { timerAnimation.current?.stop(); };
    }, [pendingRides, currentRideIndex]);

    // ─── Accept Ride ─────────────────────────────────────────
    const handleAcceptRide = async () => {
        const ride = pendingRides[currentRideIndex];
        if (!ride || accepting) return;
        setAccepting(true);
        timerAnimation.current?.stop();
        if (pollingRef.current) clearInterval(pollingRef.current);

        try {
            const result = await acceptRide(ride._id);
            if (result.success) {
                navigation.navigate('DriverRideNavigation' as never, {
                    bookingId: ride._id,
                    passenger: {
                        name: ride.passenger?.name || 'Passenger',
                        phone: ride.passenger?.phone || '',
                        initial: (ride.passenger?.name?.[0] || 'P').toUpperCase(),
                    },
                    pickup: ride.pickup?.address || 'Pickup',
                    dropoff: ride.dropoff?.address || 'Dropoff',
                    fare: ride.finalFare,
                } as never);
            } else {
                Alert.alert('Ride Taken', result.message || 'This ride was already accepted by another driver.');
                fetchRides();
            }
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || 'Could not accept ride. Try again.');
            fetchRides();
        } finally {
            setAccepting(false);
        }
    };

    const handleDecline = () => {
        timerAnimation.current?.stop();
        setCurrentRideIndex(i => i + 1);
    };

    const currentRide = pendingRides[currentRideIndex];
    const showRequest = !!currentRide;

    return (
        <View style={styles.container}>
            {/* Map Placeholder */}
            <View style={styles.mapPlaceholder}>
                <Image
                    source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Mapbox_iOS_SDK_on_iPad.png' }}
                    style={styles.mapImage}
                    resizeMode="cover"
                />
            </View>

            <SafeAreaView style={styles.overlayContainer} edges={['top']}>
                {/* Top Bar */}
                <View style={styles.topBar}>
                    <View style={styles.earningsPill}>
                        <View style={styles.coinIcon}>
                            <FontAwesomeIcon icon={faSackDollar} size={14} color="#F59E0B" />
                        </View>
                        <View>
                            <Text style={styles.earnedLabel}>EARNED TODAY</Text>
                            <Text style={styles.earnedValue}>₹{todayEarnings.toFixed(2)}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.offlineButton} onPress={() => navigation.navigate('DriverHome' as never, { manualReturn: true } as never)}>
                        <FontAwesomeIcon icon={faCircle} size={8} color="#EF4444" style={{ marginRight: 6 }} />
                        <Text style={styles.offlineText}>Go Offline</Text>
                    </TouchableOpacity>
                </View>

                {/* Center: Searching / Loading */}
                {!showRequest && (
                    <View style={styles.searchingContainer}>
                        <Animated.View style={[styles.radarCircle, { transform: [{ scale: pulseAnim }], opacity: 0.5 }]} />
                        <Animated.View style={[styles.radarCircle, { width: 150, height: 150, borderRadius: 75, opacity: 0.3, transform: [{ scale: pulseAnim }] }]} />
                        <View style={styles.centerMarker}>
                            <View style={styles.myLocationDot} />
                        </View>
                        {loading
                            ? <ActivityIndicator color="#10B981" style={{ marginTop: 100 }} />
                            : <Text style={styles.searchingText}>Finding Rides...</Text>
                        }
                    </View>
                )}
            </SafeAreaView>

            {/* Ride Request Card */}
            {showRequest && (
                <View style={styles.requestCard}>
                    {/* Timer bar */}
                    <Animated.View style={[styles.timerFill, {
                        width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                    }]} />

                    <View style={styles.cardContent}>
                        {/* Passenger Info & Fare */}
                        <View style={styles.passengerRow}>
                            <View style={styles.passengerProfile}>
                                <View style={styles.avatarCircle}>
                                    <Text style={styles.avatarText}>
                                        {(currentRide.passenger?.name?.[0] || 'P').toUpperCase()}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.passengerName}>{currentRide.passenger?.name || 'Passenger'}</Text>
                                    <View style={styles.ratingRow}>
                                        <FontAwesomeIcon icon={faStar} size={10} color="#F59E0B" />
                                        <Text style={styles.ratingText}>4.8</Text>
                                        <Text style={styles.tripsText}>• {currentRide.seats || 1} seat(s)</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.fareContainer}>
                                <Text style={styles.fareAmount}>₹{currentRide.finalFare || currentRide.offeredFare}</Text>
                                <Text style={styles.fareLabel}>OFFERED FARE</Text>
                                <Text style={styles.distanceText}>{currentRide.distanceKm} km</Text>
                            </View>
                        </View>

                        {/* Route */}
                        <View style={styles.routeContainer}>
                            <View style={styles.routeRow}>
                                <View style={styles.timelineLeft}>
                                    <View style={styles.pickupDot} />
                                    <View style={styles.timelineLine} />
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timeLabel}>PICKUP</Text>
                                    <Text style={styles.locationName} numberOfLines={1}>
                                        {currentRide.pickup?.address || 'Pickup location'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.routeRow}>
                                <View style={styles.timelineLeft}>
                                    <View style={styles.dropoffSquare} />
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timeLabel}>DROP-OFF</Text>
                                    <Text style={styles.locationName} numberOfLines={1}>
                                        {currentRide.dropoff?.address || 'Dropoff location'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
                                <Text style={styles.declineText}>Decline</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.acceptButton, accepting && { opacity: 0.7 }]}
                                onPress={handleAcceptRide}
                                disabled={accepting}
                            >
                                {accepting
                                    ? <ActivityIndicator color="#FFFFFF" />
                                    : <Text style={styles.acceptText}>Accept Ride</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    mapPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#E5E7EB' },
    mapImage: { width: '100%', height: '100%', opacity: 0.6 },
    overlayContainer: { flex: 1, justifyContent: 'space-between' },
    topBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: 20, paddingTop: 10,
    },
    earningsPill: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827',
        padding: 12, borderRadius: 30,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
    },
    coinIcon: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: '#374151',
        justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    earnedLabel: { fontSize: 8, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5 },
    earnedValue: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    offlineButton: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },
    offlineText: { fontSize: 14, fontWeight: '700', color: '#111827' },
    searchingContainer: {
        position: 'absolute', top: height / 2 - 100, left: 0, right: 0,
        alignItems: 'center', justifyContent: 'center',
    },
    radarCircle: {
        position: 'absolute', width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#10B981',
    },
    centerMarker: {
        width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
    },
    myLocationDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#111827' },
    searchingText: {
        marginTop: 100, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 6,
        borderRadius: 16, fontSize: 12, fontWeight: '600', color: '#111827',
    },
    requestCard: {
        position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#FFFFFF',
        borderRadius: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
        overflow: 'hidden',
    },
    timerFill: { height: 4, backgroundColor: '#10B981' },
    cardContent: { padding: 20 },
    passengerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    passengerProfile: { flexDirection: 'row', alignItems: 'center' },
    avatarCircle: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5E7EB',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    avatarText: { fontSize: 20, fontWeight: '700', color: '#374151' },
    passengerName: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
    tripsText: { fontSize: 12, color: '#6B7280' },
    fareContainer: { alignItems: 'flex-end' },
    fareAmount: { fontSize: 24, fontWeight: '900', color: '#111827' },
    fareLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginTop: 2 },
    distanceText: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    routeContainer: { marginBottom: 24 },
    routeRow: { flexDirection: 'row', marginBottom: 12 },
    timelineLeft: { alignItems: 'center', width: 20, marginRight: 12 },
    pickupDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', marginTop: 3 },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginVertical: 2 },
    dropoffSquare: { width: 12, height: 12, backgroundColor: '#111827', marginTop: 3 },
    timelineContent: { flex: 1 },
    timeLabel: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 2 },
    locationName: { fontSize: 14, fontWeight: '700', color: '#111827' },
    actionButtonsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    declineButton: {
        paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16,
        borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
    },
    declineText: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
    acceptButton: {
        flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: '#111827',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#111827', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    acceptText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});

export default DriverOnlineScreen;

import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Animated,
    Easing,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMapMarkerAlt, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../Context/AuthContext';
import { getActiveRide, updateRideStatus } from '../../Services/rideService';

const { width } = Dimensions.get('window');

const FindingDriverScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { logout } = useAuth();
    const params = (route.params as any) || {};
    const bookingId = params.bookingId;

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [elapsedSec, setElapsedSec] = useState(0);

    // Pulse animation
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // Poll elapsed counter
    useEffect(() => {
        const tick = setInterval(() => setElapsedSec(s => s + 1), 1000);
        return () => clearInterval(tick);
    }, []);

    const SEARCH_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Poll API every 5 seconds for driver acceptance
    useEffect(() => {
        if (!bookingId) return;

        const poll = async () => {
            try {
                const result = await getActiveRide();
                const booking = result?.data;

                if (!booking) {
                    // Booking no longer active (maybe cancelled by server?)
                    return;
                }

                if (booking.status === 'accepted' || booking.status === 'arrived') {
                    // Driver accepted! Navigate to DriverAccepted screen
                    clearInterval(pollingRef.current!);
                    clearTimeout(timeoutRef.current!);
                    (navigation as any).navigate('DriverAccepted', {
                        bookingId: booking._id,
                        driver: {
                            name: booking.driver?.name || 'Driver',
                            rating: booking.driver?.driverDetails?.ratings?.average || 4.8,
                            trips: booking.driver?.driverDetails?.ratings?.count || 0,
                            car: booking.driver?.driverDetails?.vehicle?.model || 'Vehicle',
                            vehicleColor: booking.driver?.driverDetails?.vehicle?.color || 'Grey',
                            vehicleType: booking.driver?.driverDetails?.vehicle?.type || 'Sedan',
                            plateNumber: booking.driver?.driverDetails?.vehicle?.plateNumber || 'XX00 XX 0000',
                            initial: (booking.driver?.name?.[0] || 'D').toUpperCase(),
                            phone: booking.driver?.phone || '',
                        },
                    });
                }
            } catch (e) {
                // Network error — silently retry
            }
        };

        pollingRef.current = setInterval(poll, 5000);
        poll(); // immediate first check

        // ─── Auto-cancel after 5 minutes if no driver found ──────────────────────────
        timeoutRef.current = setTimeout(async () => {
            clearInterval(pollingRef.current!);
            try {
                if (bookingId) {
                    await updateRideStatus(bookingId, 'cancelled', 'No driver found within 5 minutes');
                }
            } catch { }
            Alert.alert(
                'No Drivers Available',
                'We could not find a driver for your ride. Your request has been cancelled. Please try again.',
                [{ text: 'OK', onPress: () => (navigation as any).navigate('PassengerHome') }]
            );
        }, SEARCH_TIMEOUT_MS);
        // ────────────────────────────────────────────────────────────────────────

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [bookingId]);

    const handleCancel = async () => {
        Alert.alert('Cancel Ride', 'Are you sure you want to cancel?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes, Cancel',
                style: 'destructive',
                onPress: async () => {
                    try {
                        if (bookingId) {
                            await updateRideStatus(bookingId, 'cancelled', 'Cancelled by passenger');
                        }
                    } catch { }
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    navigation.goBack();
                },
            },
        ]);
    };

    const formatElapsed = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('PassengerHome' as never, { manualReturn: true } as never)}>
                    <FontAwesomeIcon icon={faArrowLeft} size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
            <View style={styles.content}>

                {/* Visual Radar Effect */}
                <View style={styles.radarContainer}>
                    <Animated.View
                        style={[
                            styles.pulseCircle,
                            {
                                transform: [{ scale: pulseAnim }],
                                opacity: pulseAnim.interpolate({ inputRange: [1, 1.2], outputRange: [0.3, 0] })
                            }
                        ]}
                    />
                    <View style={styles.iconCircle}>
                        <FontAwesomeIcon icon={faMapMarkerAlt} size={32} color="#111827" />
                    </View>
                </View>

                <Text style={styles.title}>Finding your ride</Text>
                <Text style={styles.subtitle}>Waiting for driver responses...</Text>
                <Text style={styles.timer}>⏱ {formatElapsed(elapsedSec)}</Text>

            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>Cancel Request</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    radarContainer: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
    pulseCircle: {
        position: 'absolute', width: 180, height: 180, borderRadius: 90,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    iconCircle: {
        width: 100, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
    },
    title: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#14B8A6', fontWeight: '600', marginBottom: 12 },
    timer: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
    footer: { padding: 20, paddingBottom: 40 },
    cancelButton: {
        backgroundColor: '#1F2937', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
        borderWidth: 1, borderColor: '#374151',
    },
    cancelButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default FindingDriverScreen;

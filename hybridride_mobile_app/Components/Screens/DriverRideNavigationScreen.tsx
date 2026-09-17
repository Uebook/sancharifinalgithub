import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    Dimensions,
    TextInput,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowRight,
    faPhone,
    faMessage,
    faChevronRight,
    faLocationDot
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../Context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { updateRideStatus, getBookingById } from '../../Services/rideService';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { CONFIG } from '../../Constants/Config';

import { GOOGLE_MAPS_API_KEY } from '../../Config/maps';

const { width, height } = Dimensions.get('window');

const DriverRideNavigationScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { logout } = useAuth();
    const params = (route.params as any) || {};
    const bookingId = params.bookingId || null;
    const passenger = params.passenger || {};
    const pickupAddr = params.pickup || 'Pickup location';
    const fare = params.fare || 0;
    const initialDropoff = params.dropoff || 'Dropoff location';

    const [viewState, setViewState] = useState<'PICKUP' | 'VERIFY' | 'DROP_OFF'>(params.initialViewState || 'PICKUP');
    const [dropoffAddr, setDropoffAddr] = useState(initialDropoff);
    const [otp, setOtp] = useState(['', '', '', '']);
    const inputs = useRef<Array<TextInput | null>>([]);

    // Dynamic routing data
    const [rideTime, setRideTime] = useState('-- min');
    const [rideDistance, setRideDistance] = useState('-- km');
    const [pickupDistance, setPickupDistance] = useState('-- m');
    const [pickupEta, setPickupEta] = useState('-- min');
    const mapRef = useRef<MapView>(null);

    // Dynamic Coordinates
    // If the coordinates from params are [0,0], it means they are obfuscated by the backend
    const driverCoords = params.driverCoords || { latitude: 28.6139, longitude: 77.2090 };
    const pickupCoords = params.pickupCoords || { latitude: 28.5355, longitude: 77.3910 };

    // Obfuscated check state
    const [realDropoff, setRealDropoff] = useState<any>(null);
    const rawDropoff = params.dropoffCoords || { latitude: 28.4595, longitude: 77.0266 };
    const isDropoffObfuscated = rawDropoff.latitude === 0 && rawDropoff.longitude === 0;
    const dropoffCoords = realDropoff || (isDropoffObfuscated ? null : rawDropoff);

    // Use null for destination if not yet arrived to avoid drawing a line to nowhere
    const currentDestination = viewState === 'DROP_OFF' && dropoffCoords ? dropoffCoords : pickupCoords;

    const handleArrived = async () => {
        try {
            if (bookingId) {
                const result = await updateRideStatus(bookingId, 'arrived');
                if (!result.success) {
                    Alert.alert('Error', result.message || 'Failed to update status to Arrived');
                    return;
                }
            }
            setViewState('VERIFY');
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to update status');
        }
    };

    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Move to next input
        if (text && index < 3) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleVerify = async () => {
        try {
            if (bookingId) {
                const result = await updateRideStatus(bookingId, 'ongoing', undefined, otp.join(''));
                if (!result.success) {
                    Alert.alert('Error', result.message || 'Failed to start ride');
                    return;
                }

                // Refetch booking to get real dropoff coordinates
                const res = await getBookingById(bookingId);
                if (res.success && res.data) {
                    const b = res.data;
                    if (b.dropoff?.coordinates) {
                        setRealDropoff({
                            latitude: b.dropoff.coordinates[1],
                            longitude: b.dropoff.coordinates[0]
                        });
                    }
                    if (b.dropoff?.address && b.dropoff.address !== 'Hidden until OTP') {
                        setDropoffAddr(b.dropoff.address);
                    }
                }
            }
            setViewState('DROP_OFF');
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to start ride');
        }
    };

    useEffect(() => {
        if (!bookingId) return;

        const pollInterval = setInterval(async () => {
            try {
                const res = await getBookingById(bookingId);
                if (res.success && res.data) {
                    if (res.data.status === 'cancelled') {
                        clearInterval(pollInterval);
                        Alert.alert(
                            'Ride Cancelled',
                            `The passenger has cancelled this ride.\nReason: ${res.data.cancellationReason || 'No reason provided'}`,
                            [{ text: 'OK', onPress: () => (navigation as any).navigate('DriverHome') }]
                        );
                    }
                }
            } catch (error) {
                console.error('Polling error in DriverRideNavigation:', error);
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [bookingId]);

    const handleCompleteTrip = async () => {
        try {
            if (bookingId) {
                const result = await updateRideStatus(bookingId, 'completed');
                if (!result.success) {
                    Alert.alert('Error', result.message || 'Failed to complete trip');
                    return;
                }
            }
            (navigation as any).navigate('DriverRideCompleted', { bookingId, fare });
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to complete trip');
        }
    };

    const handleSOS = () => {
        Linking.openURL(`tel:${CONFIG.CALL_CENTER_PHONE}`);
    };

    // ─── Cancel Ride (driver-initiated) ─────────────────────────────────────────
    // Drivers sometimes get stuck in the active ride loop with no way to cancel.
    // This gives them an escape hatch on both the PICKUP and VERIFY screens.
    const handleCancelRide = () => {
        Alert.alert(
            'Cancel Ride?',
            'Are you sure you want to cancel this ride? This will notify the passenger.',
            [
                { text: 'No, Keep Ride', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (bookingId) {
                                const result = await updateRideStatus(bookingId, 'cancelled', 'Driver cancelled the ride');
                                if (!result.success) {
                                    Alert.alert('Error', result.message || 'Could not cancel ride. Please try again.');
                                    return;
                                }
                            }
                            // Navigate back to driver home
                            (navigation as any).navigate('DriverHome');
                        } catch (error: any) {
                            Alert.alert('Error', error?.response?.data?.message || 'Failed to cancel ride.');
                        }
                    }
                }
            ]
        );
    };
    // ────────────────────────────────────────────────────────────────────────

    const renderPickupView = () => (
        <>
            {/* Navigation Banner (Floating Top) */}
            <View style={styles.navBanner}>
                <TouchableOpacity style={styles.backButtonCompact} onPress={() => (navigation as any).navigate('DriverHome', { manualReturn: true })}>
                    <FontAwesomeIcon icon={faChevronRight} size={18} color="#FFFFFF" style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                <View style={styles.turnIconBox}>
                    <FontAwesomeIcon icon={faArrowRight} size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.distanceText}>{pickupDistance}</Text>
                    <Text style={styles.instructionText}>{pickupEta} away</Text>
                </View>
            </View>

            {/* Bottom Sheet - Pickup Details */}
            <View style={styles.bottomSheet}>
                <View style={styles.dragHandle} />

                <View style={styles.passengerInfoRow}>
                    <View>
                        <Text style={styles.statusTitle}>Picking up {passenger?.name || 'Passenger'}</Text>
                        <Text style={styles.addressText}>{pickupAddr}</Text>
                    </View>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{(passenger?.name?.[0] || 'P').toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={styles.actionButton}>
                        <FontAwesomeIcon icon={faPhone} size={16} color="#DC2626" />
                        <Text style={styles.actionButtonText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => (navigation as any).navigate('DriverChat', { bookingId, passengerName: passenger.name })}>
                        <FontAwesomeIcon icon={faMessage} size={16} color="#111827" />
                        <Text style={styles.actionButtonText}>Chat</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.mainButton} onPress={handleArrived}>
                    <Text style={styles.mainButtonText}>I have Arrived</Text>
                </TouchableOpacity>

                {/* Emergency cancel — driver stuck with an active ride and no way out */}
                <TouchableOpacity style={styles.cancelRideLink} onPress={handleCancelRide}>
                    <Text style={styles.cancelRideLinkText}>Cancel Ride</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    const renderVerifyView = () => (
        <View style={styles.bottomSheet}>
            <View style={styles.dragHandle} />

            <View style={styles.verifyHeader}>
                <Text style={styles.verifyTitle}>Verify Ride</Text>
                <Text style={styles.verifySubtitle}>Ask passenger for 4-digit code</Text>
            </View>

            <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={(ref) => {
                            inputs.current[index] = ref;
                        }}
                        style={styles.otpInput}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        textAlign="center"
                    />
                ))}
            </View>

            <TouchableOpacity style={[styles.mainButton, { backgroundColor: '#E0F2FE' }]} onPress={handleVerify}>
                <Text style={[styles.mainButtonText, { color: '#0284C7' }]}>Verify & Start Ride</Text>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
                <TouchableOpacity style={[styles.actionButton, { flex: 1, marginRight: 8 }]} onPress={() => (navigation as any).navigate('DriverChat', { bookingId, passengerName: passenger.name })}>
                    <Text style={styles.actionButtonText}>Chat</Text>
                </TouchableOpacity>
                {/* Cancel button now triggers real cancellation, not just state reset */}
                <TouchableOpacity style={[styles.actionButton, { flex: 1, marginLeft: 8, backgroundColor: '#FEF2F2' }]} onPress={handleCancelRide}>
                    <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>Cancel Ride</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderDropOffView = () => (
        <>
            {/* Navigation Banner (Floating Top) - Matches Screenshot */}
            <View style={styles.navBannerDark}>
                <TouchableOpacity style={styles.backButton} onPress={() => (navigation as any).navigate('DriverHome', { manualReturn: true })}>
                    <FontAwesomeIcon icon={faChevronRight} size={20} color="#FFFFFF" style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.distanceTextLarge}>{rideDistance}</Text>
                    <Text style={styles.instructionTextSmall}>Navigating to Drop-off</Text>
                </View>
                <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
                    <Text style={styles.sosText}>SOS</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Sheet - Drop Off Details */}
            <View style={styles.bottomSheet}>

                <View style={styles.dropOffHeaderRow}>
                    <View>
                        <Text style={styles.dropOffLabel}>DROPPING OFF</Text>
                        <Text style={styles.dropOffLocation} numberOfLines={1}>{dropoffAddr}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.timeLabel}>TIME</Text>
                        <Text style={styles.timeValue}>{rideTime}</Text>
                    </View>
                </View>

                {/* Passenger Row */}
                <View style={styles.passengerCard}>
                    <View style={styles.passengerRow}>
                        <View style={styles.avatarCircleSmall}>
                            <Text style={styles.avatarTextSmall}>{(passenger?.name?.[0] || 'P').toUpperCase()}</Text>
                        </View>
                        <Text style={styles.passengerName}>{passenger?.name || 'Passenger'}</Text>
                        <TouchableOpacity onPress={() => (navigation as any).navigate('DriverChat', { bookingId, passengerName: passenger.name })}>
                            <Text style={styles.chatLink}>CHAT WITH PASSENGER</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={[styles.mainButton, { backgroundColor: '#EF4444', marginTop: 24 }]} onPress={handleCompleteTrip}>
                    <Text style={styles.mainButtonText}>Complete Trip</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <View style={styles.container}>
            {/* Real Map Layer */}
            <View style={styles.mapPlaceholder}>
                <MapView
                    ref={mapRef}
                    style={StyleSheet.absoluteFillObject}
                    initialRegion={{
                        ...driverCoords,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    }}
                    zoomEnabled={true}
                    scrollEnabled={true}
                    pitchEnabled={true}
                    rotateEnabled={true}
                >
                    {currentDestination && (
                        <MapViewDirections
                            origin={driverCoords}
                            destination={currentDestination}
                            apikey={GOOGLE_MAPS_API_KEY}
                            strokeWidth={6}
                            strokeColor={viewState === 'DROP_OFF' ? "#0284C7" : "#10B981"}
                            onReady={(result) => {
                                if (viewState === 'DROP_OFF') {
                                    setRideTime(`${Math.ceil(result.duration)} min`);
                                    setRideDistance(`${result.distance.toFixed(1)} km`);
                                } else {
                                    setPickupDistance(`${(result.distance > 1 ? result.distance.toFixed(1) + " km" : Math.round(result.distance * 1000) + " m")}`);
                                    setPickupEta(`${Math.ceil(result.duration)} min`);
                                }
                                mapRef.current?.fitToCoordinates(result.coordinates, {
                                    edgePadding: { top: 150, right: 50, bottom: 400, left: 50 },
                                    animated: true,
                                });
                            }}
                        />
                    )}
                    <Marker coordinate={driverCoords} title="Driver Location">
                        <View style={styles.carMarker}>
                            <View style={styles.carTop} />
                        </View>
                    </Marker>
                    <Marker
                        coordinate={pickupCoords}
                        title={"Pickup Location"}
                    />
                    {dropoffCoords && viewState === 'DROP_OFF' && (
                        <Marker
                            coordinate={dropoffCoords}
                            title={"Drop-off Location"}
                        />
                    )}
                </MapView>
            </View>

            <SafeAreaView style={styles.content} edges={['top']}>
                {viewState === 'PICKUP' && renderPickupView()}
                {viewState === 'VERIFY' && renderVerifyView()}
                {viewState === 'DROP_OFF' && renderDropOffView()}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    mapPlaceholder: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#E5E7EB',
    },
    mapImage: {
        width: '100%',
        height: '100%',
        opacity: 0.6,
    },
    centerMarkerContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
    },
    carMarker: {
        width: 24,
        height: 40,
        backgroundColor: '#111827',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#374151',
    },
    carTop: {
        width: 18,
        height: 4,
        backgroundColor: '#FCD34D',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 4,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    navBanner: {
        margin: 20,
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    navBannerDark: {
        margin: 20,
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        position: 'relative',
    },
    backButton: {
        width: 40,
        height: 40,
        backgroundColor: '#374151',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    distanceTextLarge: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    instructionTextSmall: {
        fontSize: 14,
        color: '#E5E7EB',
        fontWeight: '500',
    },
    sosButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: '#DC2626', // Red
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(220, 38, 38, 0.3)', // Glow effect
    },
    sosText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 12,
    },
    backButtonCompact: {
        width: 36,
        height: 36,
        backgroundColor: '#374151',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    turnIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    distanceText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    instructionText: {
        fontSize: 14,
        color: '#D1D5DB',
        fontWeight: '600',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40, // Safe area padding
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    passengerInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    statusTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    addressText: {
        fontSize: 14,
        color: '#6B7280',
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#374151',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    mainButton: {
        backgroundColor: '#10B981', // Teal/Green
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    mainButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    // Verify Styles
    verifyHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    verifyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    verifySubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
        gap: 16,
    },
    otpInput: {
        width: 60,
        height: 60,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    secondaryActions: {
        flexDirection: 'row',
        marginTop: 16,
    },
    // Drop Off Styles
    dropOffHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    dropOffLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF', // Gray-400
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    dropOffLocation: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 2,
    },
    dropOffAddress: {
        fontSize: 14,
        color: '#6B7280',
    },
    timeLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    timeValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    passengerCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
    },
    passengerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarCircleSmall: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarTextSmall: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
    },
    passengerName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    chatLink: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0D9488', // Teal
    },
    cancelRideLink: {
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 4,
    },
    cancelRideLinkText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#EF4444',
        textDecorationLine: 'underline',
    },
});

export default DriverRideNavigationScreen;

import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Animated,
    Image,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAPS_API_KEY } from '../../Config/maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faStar, faCommentAlt, faPhone, faCar, faCircle, faArrowLeft, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../Context/AuthContext';
import { getActiveRide, updateRideStatus } from '../../Services/rideService';
import { Linking, Alert } from 'react-native';
import DriverChatModal from './DriverChatModal';
import CancellationModal from './CancellationModal';

const { width } = Dimensions.get('window');

const DriverAcceptedScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { logout } = useAuth();
    const { driver } = route.params as any || {};
    const bookingId = (route.params as any)?.bookingId || null;

    // Modals state
    const [chatVisible, setChatVisible] = React.useState(false);
    const [cancelModalVisible, setCancelModalVisible] = React.useState(false);
    const [etaMinutes, setEtaMinutes] = React.useState<number | null>(null);
    const [bookingOtp, setBookingOtp] = React.useState<string>('----');

    // Simulated driver location (nearby pickup)
    const pickupCoords = {
        latitude: (route.params as any)?.pickupCoords?.[1] || 28.6139,
        longitude: (route.params as any)?.pickupCoords?.[0] || 77.2090,
    };

    const driverCoords = {
        latitude: pickupCoords.latitude + 0.005,
        longitude: pickupCoords.longitude + 0.005,
    };

    // Dynamic driver data with fallback
    const driverName = driver?.name || "Driver";
    const driverRating = driver?.rating || 4.9;
    const driverCar = driver?.car || "Vehicle";
    const driverInitial = driver?.initial || "D";
    const driverPhone = driver?.phone || "";
    const driverTrips = driver?.trips || 0;
    const vehicleColor = driver?.vehicleColor || "Grey";
    const vehicleType = driver?.vehicleType || "Sedan";
    const plateNumber = driver?.plateNumber || "XX00 XX 0000";

    const handleCallDriver = () => {
        if (driverPhone) {
            Linking.openURL(`tel:${driverPhone}`);
        } else {
            console.log("No phone number available");
        }
    };

    // Scale animation for the pulse center
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        const pollRideStatus = async () => {
            try {
                const result = await getActiveRide();
                if (result.success && result.data) {
                    const ride = result.data;
                    if (ride.otp) setBookingOtp(ride.otp);
                    if (ride.status === 'ongoing') {
                        clearInterval(pollInterval);
                        (navigation as any).navigate('RideTracking', {
                            bookingId: ride._id,
                            driver: {
                                name: ride.driver?.name || "Driver",
                                car: ride.driver?.driverDetails?.vehicle?.model || "Vehicle",
                                initial: (ride.driver?.name?.[0] || "D").toUpperCase(),
                                phone: ride.driver?.phone || "",
                                price: ride.finalFare || ride.offeredFare
                            },
                            pickupCoords: ride.pickupCoords,
                            dropoffCoords: ride.dropoffCoords,
                        });
                    } else if (ride.status === 'cancelled') {
                        clearInterval(pollInterval);
                        (navigation as any).navigate('PassengerHome');
                    }
                }
            } catch (error) {
                console.error('Polling error in DriverAcceptedScreen:', error);
            }
        };

        // Status Polling logic
        const pollInterval = setInterval(pollRideStatus, 5000);

        return () => clearInterval(pollInterval);
    }, []);

    const handleConfirmCancel = async (reason: string) => {
        if (!bookingId) return;
        try {
            const res = await updateRideStatus(bookingId, 'cancelled', reason);
            if (res.success) {
                setCancelModalVisible(false);
                (navigation as any).navigate('PassengerHome');
            } else {
                Alert.alert('Error', res.message || 'Failed to cancel ride');
            }
        } catch (error) {
            console.error('Cancel ride error:', error);
            Alert.alert('Error', 'An error occurred while cancelling the ride');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Status Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => (navigation as any).navigate('PassengerHome', { manualReturn: true })} style={styles.backButton}>
                    <FontAwesomeIcon icon={faArrowLeft} size={20} color="#111827" />
                </TouchableOpacity>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                        {etaMinutes ? `Arriving in ${etaMinutes} mins` : 'Driver is on the way'}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => setCancelModalVisible(true)} style={styles.cancelButtonHeader}>
                    <FontAwesomeIcon icon={faTimes} size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            {/* Map View instead of Animation Area */}
            <View style={styles.mapArea}>
                <MapView
                    provider={PROVIDER_GOOGLE}
                    style={StyleSheet.absoluteFill}
                    initialRegion={{
                        ...pickupCoords,
                        latitudeDelta: 0.015,
                        longitudeDelta: 0.0121,
                    }}
                >
                    <Marker coordinate={pickupCoords} title="Pickup Location" />
                    <Marker
                        coordinate={driverCoords}
                        title={driverName}
                        description={driverCar}
                    >
                        <View style={styles.driverMarker}>
                            <FontAwesomeIcon icon={faCar} size={14} color="#FFFFFF" />
                        </View>
                    </Marker>

                    <MapViewDirections
                        origin={driverCoords}
                        destination={pickupCoords}
                        apikey={GOOGLE_MAPS_API_KEY}
                        strokeWidth={4}
                        strokeColor="#111827"
                        onReady={(result) => {
                            setEtaMinutes(Math.ceil(result.duration));
                        }}
                    />
                </MapView>
            </View>

            {/* Driver Details Card */}
            <View style={styles.card}>
                <View style={styles.handle} />

                {/* Driver Header */}
                <View style={styles.driverHeader}>
                    <View>
                        <Text style={styles.meetTitle}>Meet {driverName}</Text>
                        <View style={styles.ratingRow}>
                            <View style={styles.ratingBadge}>
                                <FontAwesomeIcon icon={faStar} size={10} color="#854D0E" />
                                <Text style={styles.ratingText}>{driverRating}</Text>
                            </View>
                            <Text style={styles.tripsText}>• {driverTrips} trips</Text>
                        </View>
                    </View>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{driverInitial}</Text>
                    </View>
                </View>

                {/* Communication Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setChatVisible(true)}
                    >
                        <FontAwesomeIcon icon={faCommentAlt} size={16} color="#111827" />
                        <Text style={styles.actionButtonText}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleCallDriver}
                    >
                        <FontAwesomeIcon icon={faPhone} size={16} color="#111827" />
                        <Text style={styles.actionButtonText}>Call</Text>
                    </TouchableOpacity>
                </View>

                {/* OTP Section */}
                <View style={styles.otpContainer}>
                    <Text style={styles.otpLabel}>SHARE THIS CODE WITH DRIVER</Text>
                    <View style={styles.otpRow}>
                        {bookingOtp.split('').map((digit, index) => (
                            <View key={index} style={styles.otpDigitBox}>
                                <Text style={styles.otpDigit}>{digit}</Text>
                            </View>
                        ))}
                    </View>
                    <Text style={styles.otpFooter}>Security verification code</Text>
                </View>

                {/* Vehicle Info */}
                <View style={styles.vehicleContainer}>
                    <View>
                        <Text style={styles.vehicleLabel}>VEHICLE</Text>
                        <Text style={styles.vehicleName}>{driverCar}</Text>
                        <Text style={styles.vehicleDetails}>{vehicleColor} • {vehicleType}</Text>
                    </View>
                    <View style={styles.licenseBadge}>
                        <Text style={styles.licenseText}>{plateNumber}</Text>
                    </View>
                </View>

                {/* Navigation Button */}
                <TouchableOpacity
                    style={styles.trackButton}
                    onPress={() => (navigation as any).navigate('RideTracking', {
                        driver,
                        bookingId,
                        pickupCoords: [pickupCoords.longitude, pickupCoords.latitude],
                        dropoffCoords: (route.params as any)?.dropoffCoords
                    })}
                >
                    <Text style={styles.trackButtonText}>View Map Track</Text>
                </TouchableOpacity>

            </View>
            {/* Modals */}
            <DriverChatModal
                visible={chatVisible}
                onClose={() => setChatVisible(false)}
                onCallPress={() => {
                    setChatVisible(false);
                    handleCallDriver();
                }}
                driverName={driverName}
                bookingId={bookingId}
            />

            <CancellationModal
                visible={cancelModalVisible}
                onClose={() => setCancelModalVisible(false)}
                onConfirm={handleConfirmCancel}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F9FF', // Very light blue bg
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    statusBadge: {
        flex: 1,
        backgroundColor: '#111827',
        paddingVertical: 10,
        borderRadius: 24,
        marginHorizontal: 12,
        alignItems: 'center',
    },
    cancelButtonHeader: {
        padding: 8,
    },
    statusText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    animationArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#A7F3D0', // Light teal
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#0F766E', // Dark teal
    },
    mapArea: {
        flex: 1,
        backgroundColor: '#E5E7EB',
    },
    driverMarker: {
        padding: 5,
        backgroundColor: '#111827',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 24,
    },
    driverHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    meetTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#92400E',
        marginLeft: 4,
    },
    tripsText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#334155',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        borderRadius: 12,
        marginHorizontal: 6,
    },
    actionButtonText: {
        marginLeft: 8,
        fontWeight: '700',
        color: '#111827',
    },
    otpContainer: {
        backgroundColor: '#F0FDFA',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCFBF1',
        marginBottom: 24,
    },
    otpLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#0F766E',
        letterSpacing: 1,
        marginBottom: 16,
        textAlign: 'center',
    },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 12,
        gap: 12,
    },
    otpDigitBox: {
        width: 48,
        height: 56,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    otpDigit: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
    },
    otpFooter: {
        fontSize: 10,
        color: '#14B8A6',
        fontWeight: '600',
    },
    vehicleContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    vehicleLabel: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '700',
        marginBottom: 4,
    },
    vehicleName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    vehicleDetails: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    licenseBadge: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    licenseText: {
        fontWeight: '800',
        color: '#111827',
        fontSize: 14,
    },
    trackButton: {
        backgroundColor: '#111827',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    trackButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
});

export default DriverAcceptedScreen;

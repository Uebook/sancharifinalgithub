import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCommentAlt, faPhone, faTimes, faCar, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../Context/AuthContext';
import { getActiveRide, updateRideStatus } from '../../Services/rideService';
import { CONFIG } from '../../Constants/Config';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import DriverChatModal from './DriverChatModal';
import CancellationModal from './CancellationModal';
import { Linking, Alert } from 'react-native';

const { width, height } = Dimensions.get('window');
import { GOOGLE_MAPS_API_KEY } from '../../Config/maps';
import { getCurrentLocationAddress } from '../../Services/directionsService';

const RideTrackingScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { logout } = useAuth();
    const { driver } = route.params as any || {};
    const bookingId = (route.params as any)?.bookingId || null;

    const [chatVisible, setChatVisible] = useState(false);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);

    // Dynamic driver data with fallback
    const driverName = driver?.name || "Michael";
    const driverCar = driver?.car || "Toyota Camry";
    const driverInitial = driver?.initial || "M";

    const [eta, setEta] = useState(0);
    const [distance, setDistance] = useState(0);
    const mapRef = useRef<MapView>(null);

    // Locations from route params
    const pickupCoords = (route.params as any)?.pickupCoords;
    const dropoffCoords = (route.params as any)?.dropoffCoords;

    const [passengerLoc, setPassengerLoc] = useState<{ latitude: number; longitude: number } | null>(
        pickupCoords ? {
            latitude: Number(pickupCoords[1] ?? pickupCoords.latitude),
            longitude: Number(pickupCoords[0] ?? pickupCoords.longitude),
        } : null
    );

    const [destLoc, setDestLoc] = useState<{ latitude: number; longitude: number } | null>(
        dropoffCoords ? {
            latitude: Number(dropoffCoords[1] ?? dropoffCoords.latitude),
            longitude: Number(dropoffCoords[0] ?? dropoffCoords.longitude),
        } : null
    );

    useEffect(() => {
        if (!passengerLoc) {
            getCurrentLocationAddress().then(res => {
                if (res) {
                    setPassengerLoc({ latitude: res.latitude, longitude: res.longitude });
                }
            });
        }
    }, []);

    const driverLoc = passengerLoc ? {
        latitude: passengerLoc.latitude + 0.005,
        longitude: passengerLoc.longitude + 0.005,
    } : null;

    useEffect(() => {
        // Status Polling logic
        const pollInterval = setInterval(async () => {
            try {
                const result = await getActiveRide();
                if (result.success && result.data) {
                    const ride = result.data;
                    if (ride.status === 'completed') {
                        clearInterval(pollInterval);
                        (navigation as any).navigate('RideCompleted', {
                            bookingId: ride._id,
                            driver: {
                                name: ride.driver?.name || "Driver",
                                initial: (ride.driver?.name?.[0] || "D").toUpperCase(),
                            },
                            price: ride.finalFare || ride.offeredFare || "0.00",
                            paymentMethod: ride.paymentMethod
                        });
                    } else if (ride.status === 'cancelled') {
                        clearInterval(pollInterval);
                        (navigation as any).navigate('PassengerHome');
                    }
                } else if (result.success && !result.data) {
                    // Ride completed and cleared from active
                    clearInterval(pollInterval);
                    (navigation as any).navigate('PassengerHome');
                }
            } catch (error) {
                console.error('Polling error in RideTrackingScreen:', error);
            }
        }, 5000); // Check every 5 seconds

        return () => {
            clearInterval(pollInterval);
        };
    }, []);

    const handleCallDriver = () => {
        Linking.openURL('tel:1234567890');
    };

    const handleSOS = () => {
        Linking.openURL(`tel:${CONFIG.CALL_CENTER_PHONE}`);
    };

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
        <View style={styles.container}>
            {/* Real Google Map Layer */}
            <View style={styles.mapLayer}>
                <MapView
                    ref={mapRef}
                    style={StyleSheet.absoluteFillObject}
                    zoomEnabled={true}
                    scrollEnabled={true}
                    pitchEnabled={true}
                    rotateEnabled={true}
                    zoomTapEnabled={true}
                    showsCompass={true}
                    showsUserLocation={true}
                    minZoomLevel={3}
                    maxZoomLevel={20}
                    initialRegion={driverLoc || passengerLoc ? {
                        ...(driverLoc || passengerLoc!),
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    } : undefined}
                >
                    {driverLoc && destLoc && (
                        <MapViewDirections
                            origin={driverLoc}
                            destination={destLoc}
                            apikey={GOOGLE_MAPS_API_KEY}
                            strokeWidth={4}
                            strokeColor="#10B981"
                            onReady={(result) => {
                                setEta(Math.ceil(result.duration));
                                setDistance(result.distance);
                                mapRef.current?.fitToCoordinates(result.coordinates, {
                                    edgePadding: { top: 50, right: 50, bottom: 400, left: 50 },
                                    animated: true,
                                });
                            }}
                        />
                    )}
                    {driverLoc && (
                        <Marker coordinate={driverLoc} title="Driver Location">
                            <View style={styles.carCircle}>
                                <FontAwesomeIcon icon={faCar} size={16} color="#FFFFFF" />
                            </View>
                        </Marker>
                    )}
                    {passengerLoc && <Marker coordinate={passengerLoc} title="Pickup Location" />}
                    {destLoc && <Marker coordinate={destLoc} title="Destination" />}
                </MapView>
            </View>

            <CancellationModal
                visible={cancelModalVisible}
                onClose={() => setCancelModalVisible(false)}
                onConfirm={handleConfirmCancel}
            />

            <SafeAreaView style={styles.uiLayer} pointerEvents="box-none">

                {/* Back Button */}
                <TouchableOpacity onPress={() => (navigation as any).navigate('PassengerHome', { manualReturn: true })} style={styles.backButton}>
                    <View style={styles.backButtonCircle}>
                        <FontAwesomeIcon icon={faArrowLeft} size={20} color="#111827" />
                    </View>
                </TouchableOpacity>

                {/* Top ETA Card */}
                <View style={styles.etaCard}>
                    <Text style={styles.etaLabel}>ESTIMATED ARRIVAL</Text>
                    <Text style={styles.etaTime}>{eta} min</Text>
                </View>

                {/* SOS Button */}
                <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
                    <Text style={styles.sosText}>SOS</Text>
                </TouchableOpacity>

                {/* Bottom Driver Sheet */}
                <View style={styles.bottomSheet}>
                    <View style={styles.driverRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{driverInitial}</Text>
                        </View>
                        <View style={styles.driverInfo}>
                            <Text style={styles.driverName}>{driverName}</Text>
                            <Text style={styles.carInfo}>{driverCar}</Text>
                        </View>
                        <View style={styles.licenseBox}>
                            <Text style={styles.licenseSmall}>HSW</Text>
                            <Text style={styles.licenseLarge}>882</Text>
                        </View>
                        <View style={styles.demoBadge}>
                            {/* <Text style={styles.demoText}>END (DEMO)</Text> */}
                        </View>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.chatButton}
                            onPress={() => setChatVisible(true)}
                        >
                            <FontAwesomeIcon icon={faCommentAlt} size={16} color="#111827" />
                            <Text style={styles.chatText}>Chat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.callButton}
                            onPress={handleCallDriver}
                        >
                            <FontAwesomeIcon icon={faPhone} size={16} color="#FFFFFF" />
                            <Text style={styles.callText}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setCancelModalVisible(true)}
                        >
                            <FontAwesomeIcon icon={faTimes} size={16} color="#EF4444" />
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Progress Indicator */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: '40%' }]} />
                        </View>
                        <Text style={styles.statusLabel}>ON TRIP TO DESTINATION</Text>
                    </View>

                </View>

            </SafeAreaView>

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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    mapLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    uiLayer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    etaCard: {
        marginTop: 35,
        position: 'absolute',
        top: 60,
        left: 20,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    etaLabel: {

        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 2,
    },
    etaTime: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonCircle: {
        width: 48,
        marginTop: 40,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    sosButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    sosText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 12,
    },
    bottomSheet: {
        backgroundColor: '#FFFFFF',
        margin: 10,
        marginBottom: 20,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        marginTop: 'auto', // Push to bottom
    },
    driverRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#334155',
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    carInfo: {
        fontSize: 12,
        color: '#6B7280',
    },
    licenseBox: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 8,
    },
    licenseSmall: {
        fontSize: 8,
        color: '#6B7280',
        fontWeight: '600',
    },
    licenseLarge: {
        fontSize: 12,
        color: '#111827',
        fontWeight: '700',
    },
    demoBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    demoText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
    },
    actionRow: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 12,
    },
    chatButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0FDF4', // Light green hint
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    chatText: {
        marginLeft: 8,
        fontWeight: '700',
        color: '#065F46',
    },
    callButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111827',
        paddingVertical: 14,
        borderRadius: 12,
    },
    callText: {
        marginLeft: 8,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    cancelText: {
        marginLeft: 8,
        fontWeight: '700',
        color: '#EF4444',
    },
    progressContainer: {
        alignItems: 'center',
    },
    progressBar: {
        width: '100%',
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        marginBottom: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#14B8A6',
    },
    statusLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    carMarker: {
        position: 'absolute',
        top: -20, // Offset to center the car on the point
        left: -20,
        zIndex: 10,
    },
    carCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#111827',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
});

export default RideTrackingScreen;

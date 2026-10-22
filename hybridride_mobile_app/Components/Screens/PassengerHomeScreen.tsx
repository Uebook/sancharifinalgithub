import React, { useState, useCallback, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    Alert,
    PermissionsAndroid,
    ActivityIndicator
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import BottomNavBar from '../Navigation/BottomNavBar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faLocationCrosshairs,
    faBriefcase,
    faMountainSun,
    faUserGroup,
    faGraduationCap,
    faHouseUser,
    faShieldHalved,
    faUser,
    faLocationDot,
    faRightFromBracket
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../Context/AuthContext';
import { getActiveRide } from '../../Services/rideService';
import { GOOGLE_MAPS_API_KEY } from '../../Config/maps';
import axios from 'axios';
import GetLocation from 'react-native-get-location';
import { getCurrentLocationAddress, getAddressFromCoords } from '../../Services/directionsService';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';
import SosModal from '../Common/SosModal';

// Polyfill for react-native-google-places-autocomplete
// @ts-ignore
navigator.geolocation = require('@react-native-community/geolocation');

import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';

const { width, height } = Dimensions.get('window');

const PassengerHomeScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuth();
    const [rideType, setRideType] = useState('CITY_RIDE');
    const [destinationFlexibility, setDestinationFlexibility] = useState('EXACT');
    const [isCheckingRide, setIsCheckingRide] = useState(false);
    const [sosVisible, setSosVisible] = useState(false);
    const [pickupAddress, setPickupAddress] = useState('');
    const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const pickupRef = useRef<GooglePlacesAutocompleteRef>(null);
    const mapRef = useRef<MapView>(null);

    const handleCurrentLocation = async (silent = false) => {
        setIsLocating(true);
        try {
            const res = await getCurrentLocationAddress();
            if (res) {
                setPickupAddress(res.address);
                setPickupCoords([res.longitude, res.latitude]);
                if (pickupRef.current) {
                    pickupRef.current.setAddressText(res.address);
                }
                if (mapRef.current) {
                    mapRef.current.animateToRegion({
                        latitude: res.latitude,
                        longitude: res.longitude,
                        latitudeDelta: 0.015,
                        longitudeDelta: 0.0121,
                    }, 800);
                }
            }
        } catch (error: any) {
            if (!silent) {
                Alert.alert("Location Issue", error.message || "Could not fetch location.");
            }
        } finally {
            setIsLocating(false);
        }
    };

    // Auto-detect user current location on screen mount
    React.useEffect(() => {
        handleCurrentLocation(true);
    }, []);

    // Auto-resume active ride logic
    useFocusEffect(
        useCallback(() => {
            // Re-fetch user location if not yet resolved
            if (!pickupCoords) {
                handleCurrentLocation(true);
            }

            const checkActive = async () => {
                // Skip auto-resume if coming back manually (e.g., via Back button)
                if ((route.params as any)?.manualReturn) {
                    return;
                }

                setIsCheckingRide(true);
                try {
                    const result = await getActiveRide();
                    if (result.success && result.data) {
                        const ride = result.data;
                        const status = ride.status;

                        if (status === 'pending') {
                            (navigation as any).navigate('FindingDriver', { bookingId: ride._id });
                        } else if (status === 'accepted' || status === 'arrived') {
                            (navigation as any).navigate('DriverAccepted', {
                                bookingId: ride._id,
                                driver: {
                                    name: ride.driver?.name || 'Driver',
                                    rating: ride.driver?.driverDetails?.ratings?.average || 4.8,
                                    trips: ride.driver?.driverDetails?.ratings?.count || 0,
                                    car: ride.driver?.driverDetails?.vehicle?.model || 'Vehicle',
                                    vehicleColor: ride.driver?.driverDetails?.vehicle?.color || 'Grey',
                                    vehicleType: ride.driver?.driverDetails?.vehicle?.type || 'Sedan',
                                    plateNumber: ride.driver?.driverDetails?.vehicle?.plateNumber || 'XX00 XX 0000',
                                    initial: (ride.driver?.name?.[0] || 'D').toUpperCase(),
                                    phone: ride.driver?.phone || '',
                                },
                                pickupCoords: ride.pickupCoords,
                            });
                        } else if (status === 'ongoing') {
                            (navigation as any).navigate('RideTracking', {
                                bookingId: ride._id,
                                driver: {
                                    name: ride.driver?.name || 'Driver',
                                    car: ride.driver?.driverDetails?.vehicle?.model || 'Vehicle',
                                    initial: (ride.driver?.name?.[0] || 'D').toUpperCase(),
                                },
                                pickupCoords: ride.pickupCoords,
                                dropoffCoords: ride.dropoffCoords,
                            });
                        } else if (status === 'completed' && ride.paymentStatus === 'pending') {
                            (navigation as any).navigate('RideCompleted', {
                                bookingId: ride._id,
                                driver: {
                                    name: ride.driver?.name || 'Driver',
                                    initial: (ride.driver?.name?.[0] || 'D').toUpperCase(),
                                },
                                price: ride.finalFare || ride.offeredFare || "0.00",
                                paymentMethod: ride.paymentMethod
                            });
                        }
                    }
                } catch (error) {
                    console.error('Failed to check active ride:', error);
                } finally {
                    setIsCheckingRide(false);
                }
            };

            checkActive();
        }, [navigation])
    );

    return (
        <View style={styles.container}>
            {/* Real Google Map Background */}
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.mapBackground}
                zoomEnabled={true}
                scrollEnabled={true}
                pitchEnabled={true}
                rotateEnabled={true}
                zoomTapEnabled={true}
                minZoomLevel={3}
                maxZoomLevel={20}
                showsUserLocation={true}
                showsMyLocationButton={false}
                followsUserLocation={!pickupCoords}
                loadingEnabled={true}
                onUserLocationChange={async (event) => {
                    const coord = event.nativeEvent?.coordinate;
                    if (coord && typeof coord.latitude === 'number' && typeof coord.longitude === 'number') {
                        const { latitude, longitude } = coord;
                        if (!pickupCoords || !pickupAddress) {
                            setPickupCoords([longitude, latitude]);
                            if (mapRef.current) {
                                mapRef.current.animateToRegion({
                                    latitude,
                                    longitude,
                                    latitudeDelta: 0.015,
                                    longitudeDelta: 0.0121,
                                }, 600);
                            }
                            try {
                                const addr = await getAddressFromCoords(latitude, longitude);
                                if (addr && addr !== 'Current Location') {
                                    setPickupAddress(addr);
                                    if (pickupRef.current) {
                                        pickupRef.current.setAddressText(addr);
                                    }
                                }
                            } catch (e) {
                                console.log('Error reverse geocoding onUserLocationChange:', e);
                            }
                        }
                    }
                }}
                initialRegion={pickupCoords ? {
                    latitude: pickupCoords[1],
                    longitude: pickupCoords[0],
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.0121,
                } : undefined}
                region={pickupCoords ? {
                    latitude: pickupCoords[1],
                    longitude: pickupCoords[0],
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.0121,
                } : undefined}
            >
                {pickupCoords && (
                    <Marker
                        coordinate={{
                            latitude: pickupCoords[1],
                            longitude: pickupCoords[0],
                        }}
                    />
                )}
            </MapView>

            <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
                {/* Header */}
                <View style={styles.header}>
                    {/* <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                        <FontAwesomeIcon icon={faRightFromBracket} size={20} color="#EF4444" />
                    </TouchableOpacity> */}

                    <View style={styles.rideTypeToggle}>
                        <TouchableOpacity
                            style={[styles.toggleButton, rideType === 'CITY_RIDE' && styles.activeToggle]}
                            onPress={() => setRideType('CITY_RIDE')}
                        >
                            <Text style={[styles.toggleText, rideType === 'CITY_RIDE' && styles.activeToggleText]}>City Ride</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleButton, rideType === 'OUTSTATION' && styles.activeToggle]}
                            onPress={() => (navigation as any).navigate('Outstation')}
                        >
                            <Text style={[styles.toggleText, rideType === 'OUTSTATION' && styles.activeToggleText]}>Outstation</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Wallet Balance & SOS Button */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity style={{ padding: 8, backgroundColor: '#FEF2F2', borderRadius: 20, borderWidth: 1, borderColor: '#FCA5A5' }} onPress={() => setSosVisible(true)}>
                            <FontAwesomeIcon icon={faShieldHalved} size={16} color="#EF4444" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.walletBadge} onPress={() => (navigation as any).navigate('Wallet')}>
                            <Text style={styles.walletBalText}>₹{user?.walletBalance || 0}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bottom Sheet / Content Card */}
                <View style={[styles.bottomSheet, { bottom: 60 + (insets.bottom > 0 ? insets.bottom - 10 : 0) }]}>
                    <View style={styles.dragHandle} />

                    <View style={[styles.scrollContent, { flex: 1, overflow: 'visible' }]}>
                        <Text style={styles.greeting}>Good evening! Need a ride?</Text>

                        {/* Ride Input Card */}
                        <View style={[styles.rideInputCard, { zIndex: 999 }]}>
                            <View style={styles.timelineContainer}>
                                <View style={styles.timelineDotGreen} />
                                <View style={styles.timelineLine} />
                                <View style={styles.timelineSquareBlack} />
                            </View>
                            <View style={[styles.inputFields, { zIndex: 1000 }]}>
                                <TouchableOpacity
                                    style={[styles.inputRow, { zIndex: 2000, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                                    onPress={() => (navigation as any).navigate('DropLocation', {
                                        mode: 'PICKUP',
                                        onSelectPickup: (addr: string, coords: [number, number] | null) => {
                                            setPickupAddress(addr);
                                            if (coords) setPickupCoords(coords);
                                        }
                                    })}
                                    activeOpacity={0.8}
                                >
                                    <View style={{ flex: 1, paddingRight: 10 }}>
                                        <Text style={styles.inputLabel}>PICKUP LOCATION</Text>
                                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>
                                            {pickupAddress || (isLocating ? 'Detecting your location...' : 'Search Pickup Location')}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.inlineTargetButton}
                                        onPress={() => handleCurrentLocation(false)}
                                        disabled={isLocating}
                                    >
                                        {isLocating ? (
                                            <ActivityIndicator size="small" color="#10B981" />
                                        ) : (
                                            <FontAwesomeIcon icon={faLocationCrosshairs} size={20} color="#10B981" />
                                        )}
                                    </TouchableOpacity>
                                </TouchableOpacity>
                                <View style={[styles.divider, { zIndex: -1 }]} />
                                <TouchableOpacity style={[styles.inputRow, { zIndex: -1 }]} onPress={() => (navigation as any).navigate('DropLocation', {
                                    pickupAddress,
                                    pickupCoords
                                })}>
                                    <Text style={styles.inputLabel}>DROP-OFF</Text>
                                    <Text style={styles.inputPlaceholder}>Search destination</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Special Offers */}
                        <Text style={styles.sectionHeader}>SPECIAL OFFERS FOR YOU</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            <View style={styles.offerCard}>
                                <View style={styles.offerIconContainer}>
                                    <FontAwesomeIcon icon={faBriefcase} size={24} color="#92400E" />
                                </View>
                                <View>
                                    <Text style={styles.offerTitle}>Workday Pass</Text>
                                    <Text style={styles.offerSubtitle}>Flat 10% off on all city rides</Text>
                                </View>
                            </View>
                            <View style={[styles.offerCard, { marginLeft: 12 }]}>
                                <View style={styles.offerIconContainer}>
                                    <FontAwesomeIcon icon={faMountainSun} size={24} color="#10B981" />
                                </View>
                                <View>
                                    <Text style={styles.offerTitle}>Weekend Getaway</Text>
                                    <Text style={styles.offerSubtitle}>Outstation rides at 15% off</Text>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Destination Flexibility */}
                        <Text style={styles.sectionHeader}>DESTINATION FLEXIBILITY</Text>
                        <View style={styles.flexibilityContainer}>
                            <TouchableOpacity
                                style={[styles.flexOption, destinationFlexibility === 'EXACT' && styles.activeFlexOption]}
                                onPress={() => setDestinationFlexibility('EXACT')}
                            >
                                <Text style={[styles.flexTitle, destinationFlexibility === 'EXACT' && styles.activeFlexTitle]}>EXACT</Text>
                                <Text style={styles.flexSubtitle}>Low</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.flexOption, destinationFlexibility === '1KM' && styles.activeFlexOption]}
                                onPress={() => setDestinationFlexibility('1KM')}
                            >
                                <Text style={styles.flexTitle}>±1 KM</Text>
                                <Text style={styles.flexSubtitle}>Med</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.flexOption, destinationFlexibility === '10MIN' && styles.activeFlexOption]}
                                onPress={() => setDestinationFlexibility('10MIN')}
                            >
                                <Text style={styles.flexTitle}>±10 MIN</Text>
                                <Text style={styles.flexSubtitle}>High</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Trust Score */}
                        <View style={styles.trustScoreContainer}>
                            <Text style={styles.trustHeader}>TRUST SCORE NEARBY</Text>
                            <View style={styles.trustRow}>
                                <FontAwesomeIcon icon={faUser} size={12} color="#F59E0B" style={{ marginRight: 8 }} />
                                <Text style={styles.trustText}>Partners nearby rated 4.8★+</Text>
                            </View>
                            <View style={styles.trustRow}>
                                <FontAwesomeIcon icon={faShieldHalved} size={12} color="#F59E0B" style={{ marginRight: 8 }} />
                                <Text style={styles.trustText}>Verified Government ID</Text>
                            </View>
                        </View>

                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.bookButton} onPress={() => (navigation as any).navigate('DropLocation', {
                            pickupAddress,
                            pickupCoords
                        })}>
                            <Text style={styles.bookButtonText}>Book Ride</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bottom Navigation */}
                <BottomNavBar activeTab="RIDES" />

                {/* Emergency SOS Modal */}
                <SosModal visible={sosVisible} onClose={() => setSosVisible(false)} currentLocation={pickupAddress} />

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
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
        paddingHorizontal: 20,
        zIndex: 10,
    },
    rideTypeToggle: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    toggleButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    activeToggle: {
        backgroundColor: '#111827',
    },
    toggleText: {
        fontWeight: '700',
        color: '#6B7280',
    },
    activeToggleText: {
        color: '#FFFFFF',
    },
    inlineTargetButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ECFDF5', // Light green background
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    walletBadge: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 20,
        marginLeft: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        minWidth: 60,
        alignItems: 'center',
    },
    walletBalText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111827',
    },
    logoutButton: {
        position: 'absolute',
        left: 20,
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
    bottomSheet: {
        position: 'absolute',
        bottom: 60, // Above bottom nav
        left: 0,
        right: 0,
        top: 150, // Start lower down
        backgroundColor: '#F9FAFB',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 20,
    },
    rideInputCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 24,
    },
    timelineContainer: {
        marginRight: 16,
        alignItems: 'center',
        paddingTop: 8,
    },
    timelineDotGreen: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
        minHeight: 30,
    },
    timelineSquareBlack: {
        width: 12,
        height: 12,
        backgroundColor: '#111827',
        borderRadius: 2,
    },
    inputFields: {
        flex: 1,
    },
    inputRow: {
        paddingVertical: 4,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 4,
    },
    inputValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    inputPlaceholder: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    sectionHeader: {
        fontSize: 11,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 12,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    horizontalScroll: {
        marginBottom: 24,
        flexDirection: 'row',
    },
    offerCard: {
        backgroundColor: '#EFF6FF', // Light blue
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        width: 250,
        marginRight: 12,
    },
    offerIconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    offerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E3A8A', // Dark Blue
        marginBottom: 2,
    },
    offerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginRight: 12,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    flexibilityContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
    },
    flexOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    activeFlexOption: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    flexTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 2,
    },
    activeFlexTitle: {
        color: '#111827',
    },
    flexSubtitle: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    trustScoreContainer: {
        backgroundColor: '#F0F9FF', // Very light blue
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    trustHeader: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1D4ED8', // Blue
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    trustRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    trustText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111827',
    },
    bookButton: {
        backgroundColor: '#111827',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginBottom: 10,
    },
    bookButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    navItem: {
        alignItems: 'center',
    },
    navText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9CA3AF',
    },
    activeNavText: {
        color: '#111827',
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
});

export default PassengerHomeScreen;

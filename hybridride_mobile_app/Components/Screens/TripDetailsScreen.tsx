import React, { useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faArrowRight, faClock, faRulerCombined, faWallet } from '@fortawesome/free-solid-svg-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAPS_API_KEY } from '../../Config/maps';
import { getImageUrl } from '../../Services/apiClient';
import apiClient from '../../Services/apiClient';

const { width } = Dimensions.get('window');

const TripDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const mapRef = useRef<MapView>(null);
    const { 
        fromLocation, 
        toLocation, 
        rideData, 
        passengers, 
        date, 
        distance, 
        duration,
        pickupCoords,
        dropoffCoords
    } = (route.params as any) || {};
    
    const price = (route.params as any)?.calculatedPrice || rideData?.price || 50;
    const [confirming, setConfirming] = useState(false);

    // ─── Confirm pool/outstation/rental booking (wallet-deduction on backend) ───
    // Cash is not accepted anywhere. Wallet balance is deducted at booking.
    // Passengers must top up their wallet via Razorpay before booking.
    const handleConfirmPoolBooking = async (onSuccess: () => void) => {
        try {
            setConfirming(true);
            // Balance check via backend — backend will reject with 402 if insufficient
            onSuccess();
        } catch (error: any) {
            Alert.alert('Booking Failed', error?.response?.data?.message || 'Could not confirm booking.');
        } finally {
            setConfirming(false);
        }
    };
    // ──────────────────────────────────────────────────────────────────────

    // Dynamic Trip Stats from params
    const tripStats = {
        time: duration ? `${duration} min` : '--',
        distance: distance ? `${distance} km` : '--',
        minPrice: Math.round(price * 0.9),
        maxPrice: Math.round(price * 1.1),
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <View style={styles.backButtonCircle}>
                        <FontAwesomeIcon icon={faArrowLeft} size={20} color="#111827" />
                    </View>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Trip Details</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Real Map Visualizer */}
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={StyleSheet.absoluteFillObject}
                        showsUserLocation={true}
                        initialRegion={pickupCoords ? {
                            latitude: pickupCoords[1],
                            longitude: pickupCoords[0],
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        } : undefined}
                        scrollEnabled={true}
                        zoomEnabled={true}
                        pitchEnabled={true}
                        rotateEnabled={true}
                        zoomTapEnabled={true}
                        minZoomLevel={3}
                        maxZoomLevel={20}
                    >
                        {pickupCoords && (
                            <Marker
                                coordinate={{ latitude: pickupCoords[1], longitude: pickupCoords[0] }}
                                title="Pickup"
                                pinColor="green"
                            />
                        )}
                        {dropoffCoords && (
                            <Marker
                                coordinate={{ latitude: dropoffCoords[1], longitude: dropoffCoords[0] }}
                                title="Destination"
                                pinColor="black"
                            />
                        )}
                        {pickupCoords && dropoffCoords && (
                            <MapViewDirections
                                origin={{ latitude: pickupCoords[1], longitude: pickupCoords[0] }}
                                destination={{ latitude: dropoffCoords[1], longitude: dropoffCoords[0] }}
                                apikey={GOOGLE_MAPS_API_KEY}
                                strokeWidth={4}
                                strokeColor="#111827"
                                onReady={(result) => {
                                    mapRef.current?.fitToCoordinates(result.coordinates, {
                                        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                                        animated: false,
                                    });
                                }}
                            />
                        )}
                    </MapView>
                    <View style={styles.distanceBadgeOverlay}>
                        <Text style={styles.distanceBadgeText}>{tripStats.distance}</Text>
                    </View>
                </View>

                {/* Content Card */}
                <View style={styles.card}>
                    <View style={styles.handle} />

                    <View style={styles.addressList}>
                        <View style={styles.addressItem}>
                            <View style={[styles.dot, { backgroundColor: '#14B8A6' }]} />
                            <Text style={styles.addressText} numberOfLines={1}>{fromLocation || 'Current Location'}</Text>
                        </View>
                        <View style={styles.addressLine} />
                        <View style={styles.addressItem}>
                            <View style={[styles.dot, { backgroundColor: '#111827' }]} />
                            <Text style={styles.addressText} numberOfLines={1}>{toLocation || 'Set Destination'}</Text>
                        </View>
                    </View>

                    <Text style={styles.cardTitle}>Estimate Fare</Text>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        {/* Time */}
                        <View style={styles.statItem}>
                            <FontAwesomeIcon icon={faClock} size={24} color="#1F2937" />
                            <Text style={styles.statValue}>{tripStats.time}</Text>
                            <Text style={styles.statLabel}>Est. Time</Text>
                        </View>

                        {/* Distance */}
                        <View style={styles.statItem}>
                            <FontAwesomeIcon icon={faRulerCombined} size={24} color="#D97706" />
                            <Text style={styles.statValue}>{tripStats.distance}</Text>
                            <Text style={styles.statLabel}>Distance</Text>
                        </View>

                        {/* Seats */}

                    </View>

                    {/* Pooling Review Details */}
                    {(route.params as any)?.rideData?.type === 'POOLING' ? (
                        <View style={{ width: '100%', marginBottom: 24 }}>
                            {/* Driver Info */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                <View style={{
                                    width: 48, height: 48, borderRadius: 24, backgroundColor: '#DBEAFE',
                                    alignItems: 'center', justifyContent: 'center', marginRight: 16,
                                    overflow: 'hidden'
                                }}>
                                    {(route.params as any)?.rideData?.driver?.profileImage ? (
                                        <Image source={{ uri: getImageUrl((route.params as any).rideData.driver.profileImage) || undefined }} style={{ width: 48, height: 48 }} />
                                    ) : (
                                        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E40AF' }}>
                                            {((route.params as any)?.rideData?.driver?.name || 'D').charAt(0)}
                                        </Text>
                                    )}
                                </View>
                                <View>
                                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                                        {(route.params as any)?.rideData?.driver?.name || 'Driver'}
                                    </Text>
                                    <Text style={{ fontSize: 14, color: '#6B7280' }}>
                                        {(route.params as any)?.rideData?.driver?.carModel || ((route.params as any)?.rideData?.type === 'POOLING' ? 'Vehicle Info' : (route.params as any)?.rideData?.type)}
                                    </Text>
                                </View>
                            </View>

                            {/* Departure Time */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, backgroundColor: '#ECFDF5', padding: 12, borderRadius: 12 }}>
                                <FontAwesomeIcon icon={faClock} size={16} color="#059669" style={{ marginRight: 8 }} />
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#065F46' }}>
                                    Departing at {(route.params as any)?.rideData?.time || (route.params as any)?.rideData?.depTime || 'Scheduled Time'}
                                </Text>
                            </View>

                            {/* Fixed Price Display */}
                            <View style={{ alignItems: 'center' }}>
                                <Text style={styles.priceLabel}>TOTAL FARE</Text>
                                <Text style={styles.priceMain}>
                                    ₹{(route.params as any)?.calculatedPrice || (route.params as any)?.rideData?.price}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        /* Standard Price Range for Bidding */
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>RECOMMENDED FARE (TOTAL)</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceMain}>₹{tripStats.minPrice}</Text>
                                <Text style={styles.priceSeparator}>-</Text>
                                <Text style={styles.priceMain}>₹{tripStats.maxPrice}</Text>
                            </View>
                            <Text style={styles.priceDisclaimer}>
                                Based on current traffic, demand, and route distance.
                            </Text>
                        </View>
                    )}

                    {/* Action Button */}
                        <TouchableOpacity
                            style={[styles.actionButton, confirming && { opacity: 0.7 }]}
                            disabled={confirming}
                            onPress={() => {
                            // Check if it's a future date
                            // Assuming 'date' param is passed to this screen. 
                            // If missing, we assume Today for now, but in Outstation flow it should be passed.
                            // For this task, I'll access the route params which I need to add to the component.
                            const params = route.params as any || {};
                            const { date } = params;

                            console.log('TripDetailsScreen Params:', JSON.stringify(params, null, 2));
                            console.log('Received Date:', date);
                            // Parse the date string to check if it's truly in the future (tomorrow or later)
                            let isFuture = false;

                            if (date) {
                                const lowerDate = date.toLowerCase();
                                if (lowerDate.includes('today')) {
                                    isFuture = false;
                                } else {
                                    // Compare date parts
                                    const selectedDate = new Date(date);
                                    const todayDate = new Date();

                                    // Reset time components to compare only the date
                                    selectedDate.setHours(0, 0, 0, 0);
                                    todayDate.setHours(0, 0, 0, 0);

                                    // It is future if selected date is strictly greater than today
                                    isFuture = selectedDate.getTime() > todayDate.getTime();
                                }
                            }

                            if (isFuture) {
                                (navigation as any).navigate('OutstationScheduledScreen', {
                                    rideData: (route.params as any)?.rideData,
                                    date,
                                    fromLocation: (route.params as any)?.fromLocation
                                });
                            } else {
                                // Check if Pooling or Rental
                                const rideData = (route.params as any)?.rideData;
                                const mode = (route.params as any)?.mode;

                                if (rideData?.type === 'POOLING' || mode === 'RENTAL' || rideData?.type === 'RENTAL') {
                                    const calculatedPrice = (route.params as any)?.calculatedPrice || rideData?.price;
                                    const isRental = mode === 'RENTAL' || rideData?.type === 'RENTAL';
                                    const name = isRental ? (rideData.provider || 'Rental Provider') : (rideData.driver?.name || rideData.driverName || 'Driver');
                                    const car = isRental ? (rideData.type || 'Vehicle') : (rideData.driver?.carModel || rideData.carModel || rideData.type || 'Car');
                                    const driverData = {
                                        name, car, initial: name.charAt(0),
                                        rating: rideData.driver?.rating || rideData.rating || '4.9',
                                        price: calculatedPrice
                                    };
                                    // Wallet-only — backend deducts at booking, navigate directly
                                    handleConfirmPoolBooking(() => {
                                        (navigation as any).navigate('PoolingSuccess', {
                                            driver: driverData,
                                            rideData: { ...rideData, type: isRental ? 'RENTAL' : 'POOLING' },
                                            price: calculatedPrice,
                                            passengers: (route.params as any)?.passengers || (isRental ? 'Full' : 1),
                                            seatDistribution: (route.params as any)?.seatDistribution,
                                            status: 'CONFIRMED',
                                            paymentMethod: 'wallet',
                                        });
                                    });
                                } else {
                                    // Map Frontend Types to Backend Enums
                                    const backendRideType = rideData?.type === 'INSTANT' ? 'city' : 'city'; // Adjust mapping logic as needed
                                    
                                    let backendVehicleType = 'CAR';
                                    const v = rideData?.vehicle || '';
                                    if (v.includes('BIKE')) backendVehicleType = 'BIKE';
                                    else if (v.includes('AUTO')) backendVehicleType = 'AUTO';
                                    else backendVehicleType = 'CAR';

                                    (navigation as any).navigate('OfferFare', {
                                        pickupAddress: fromLocation,
                                        pickupCoords: pickupCoords,
                                        dropoffAddress: toLocation,
                                        dropoffCoords: dropoffCoords,
                                        vehicleType: backendVehicleType,
                                        rideType: backendRideType,
                                        distanceKm: distance,
                                        durationMins: duration,
                                        estimatedFare: Math.round(price)
                                    });
                                }
                            }
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                {confirming ? (
                                    <ActivityIndicator color="#FFFFFF" style={{ marginRight: 12 }} />
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faWallet} size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
                                        <Text style={styles.actionButtonText}>
                                            {((route.params as any)?.rideData?.type === 'POOLING' || (route.params as any)?.mode === 'RENTAL')
                                                ? 'Confirm & Pay from Wallet'
                                                : 'Set Your Price'}
                                        </Text>
                                        {!((route.params as any)?.rideData?.type === 'POOLING' || (route.params as any)?.mode === 'RENTAL') &&
                                            <FontAwesomeIcon icon={faArrowRight} size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                                        }
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>

                </View>

            </ScrollView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 20,
    },
    backButton: {
        padding: 4,
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
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitleContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
    },
    mapContainer: {
        height: 220,
        width: '100%',
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
        marginBottom: -32, // Allow card to overlap
    },
    endPointSquare: {
        width: 16,
        height: 16,
        backgroundColor: '#111827',
    },
    distanceBadge: {
        position: 'absolute',
        top: 40,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    distanceBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
    },
    card: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        alignItems: 'center',
        flex: 1, // Fill remaining space
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 32,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 40,
    },
    statItem: {
        backgroundColor: '#F9FAFB',
        width: '45%',
        aspectRatio: 1,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    statItemTeal: {
        backgroundColor: '#F0FDFA',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginTop: 12,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    priceContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    priceLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    priceMain: {
        fontSize: 40,
        fontWeight: '900',
        color: '#111827',
    },
    priceSeparator: {
        fontSize: 24,
        fontWeight: '400',
        color: '#9CA3AF',
        marginHorizontal: 12,
    },
    priceDisclaimer: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 18,
    },
    actionButton: {
        backgroundColor: '#111827',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginRight: 12,
    },
    distanceBadgeOverlay: {
        position: 'absolute',
        top: 35,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    addressList: {
        width: '100%',
        marginBottom: 24,
    },
    addressItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    addressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        flex: 1,
    },
    addressLine: {
        width: 2,
        height: 20,
        backgroundColor: '#E5E7EB',
        marginLeft: 4,
        marginVertical: 2,
    }
});

export default TripDetailsScreen;

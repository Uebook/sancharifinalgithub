import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft,
    faStar,
    faCircle,
    faSquare,
    faChair,
    faCar,
    faShieldCheck,
    faSnowflake,
    faLuggageCart,
    faUser,
    faMapMarkerAlt,
    faRoute,
    faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getImageUrl } from '../../Services/apiClient';
import poolService from '../../Services/poolService';

const { width } = Dimensions.get('window');

const OutstationRideDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { rideData, mode, fromLocation, toLocation, date, seats } = (route.params as any) || {};

    const isPooling = mode === 'POOLING';
    const ride = rideData?.fullData || {};
    const [loading, setLoading] = useState(false);

    const driverName = ride.host?.name || rideData?.driver || rideData?.provider || 'Sanchari Driver';
    const vehicleDetails = ride.host?.driverDetails?.vehicle;
    const vehicleName = vehicleDetails?.model
        ? `${vehicleDetails.make || ''} ${vehicleDetails.model}`.trim()
        : (ride.vehicle || rideData?.type || (isPooling ? 'Outstation SUV' : 'Full Cab Rental'));
    const plateNumber = vehicleDetails?.plateNumber || vehicleDetails?.number || '';
    const rating = ride.host?.driverDetails?.ratings?.average || rideData?.rating || '4.9';
    const profileImage = ride.host?.profileImage;

    const pickupAddress = ride.origin?.name || fromLocation || 'Pickup Location';
    const dropoffAddress = ride.destination?.name || toLocation || 'Drop Location';

    const departureTime = isPooling && ride.scheduledTime
        ? new Date(ride.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Flexible DEP';

    const displayPrice = ride.pricePerSeat || rideData?.price || 15;
    const priceUnit = isPooling ? 'PER SEAT' : 'PER KM';

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faArrowLeft} size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ride Details</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Driver & Vehicle Card */}
                <View style={styles.card}>
                    <View style={styles.profileRow}>
                        <View style={styles.avatarContainer}>
                            {profileImage ? (
                                <Image source={{ uri: getImageUrl(profileImage) || '' }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{driverName.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={styles.driverName}>{driverName}</Text>
                            <View style={styles.ratingRow}>
                                <FontAwesomeIcon icon={faStar} size={12} color="#F59E0B" style={{ marginRight: 4 }} />
                                <Text style={styles.ratingText}>{rating}</Text>
                                <Text style={styles.dotSeparator}>•</Text>
                                <Text style={styles.verifiedText}>Verified Driver</Text>
                            </View>
                        </View>
                        <View style={styles.modePill}>
                            <Text style={styles.modePillText}>{isPooling ? 'POOLING' : 'RENTAL'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Vehicle Details */}
                    <View style={styles.vehicleRow}>
                        <View style={styles.vehicleIconCircle}>
                            <FontAwesomeIcon icon={faCar} size={18} color="#10B981" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.vehicleName}>{vehicleName}</Text>
                            {plateNumber ? (
                                <Text style={styles.plateText}>Plate: {plateNumber}</Text>
                            ) : (
                                <Text style={styles.plateText}>Commercial Registered Vehicle</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Route & Schedule Card */}
                <View style={styles.card}>
                    <Text style={styles.cardSectionHeader}>ROUTE & TIMINGS</Text>

                    {/* Time Summary */}
                    <View style={styles.timeSummaryRow}>
                        <View>
                            <Text style={styles.timeLabel}>DEPARTURE</Text>
                            <Text style={styles.timeValue}>{departureTime}</Text>
                        </View>
                        <View style={styles.routeBadge}>
                            <FontAwesomeIcon icon={faRoute} size={12} color="#059669" style={{ marginRight: 4 }} />
                            <Text style={styles.routeBadgeText}>Direct Route</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.timeLabel}>ARRIVAL</Text>
                            <Text style={styles.timeValue}>{isPooling ? 'Scheduled' : 'Doorstep'}</Text>
                        </View>
                    </View>

                    {/* Timeline */}
                    <View style={styles.timelineContainer}>
                        <View style={styles.timelineItem}>
                            <View style={styles.iconColumn}>
                                <FontAwesomeIcon icon={faCircle} size={12} color="#10B981" />
                                <View style={styles.verticalLine} />
                            </View>
                            <View style={styles.textColumn}>
                                <Text style={styles.pointLabel}>PICKUP LOCATION</Text>
                                <Text style={styles.pointAddress}>{pickupAddress}</Text>
                            </View>
                        </View>

                        <View style={styles.timelineItem}>
                            <View style={styles.iconColumn}>
                                <FontAwesomeIcon icon={faSquare} size={12} color="#F43F5E" />
                            </View>
                            <View style={styles.textColumn}>
                                <Text style={styles.pointLabel}>DROP LOCATION</Text>
                                <Text style={styles.pointAddress}>{dropoffAddress}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Features & Availability */}
                <View style={styles.card}>
                    <Text style={styles.cardSectionHeader}>TRIP FEATURES & CAPACITY</Text>
                    <View style={styles.featuresGrid}>
                        <View style={styles.featureChip}>
                            <FontAwesomeIcon icon={faSnowflake} size={14} color="#0284C7" style={{ marginRight: 6 }} />
                            <Text style={styles.featureChipText}>Air Conditioned</Text>
                        </View>
                        <View style={styles.featureChip}>
                            <FontAwesomeIcon icon={faChair} size={14} color="#059669" style={{ marginRight: 6 }} />
                            <Text style={styles.featureChipText}>
                                {isPooling ? `${ride.availableSeats || 4} Seats Available` : `${ride.totalSeats || 4} Seater Rental`}
                            </Text>
                        </View>
                        <View style={styles.featureChip}>
                            <FontAwesomeIcon icon={faShieldCheck} size={14} color="#8B5CF6" style={{ marginRight: 6 }} />
                            <Text style={styles.featureChipText}>Safety Insured</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action Footer */}
            <View style={styles.footer}>
                <View style={styles.priceColumn}>
                    <Text style={styles.footerPriceLabel}>
                        {isPooling ? 'Fare per seat' : 'Rental rate'}
                    </Text>
                    <Text style={styles.footerPriceValue}>
                        ₹{displayPrice} <Text style={styles.footerPriceUnit}>{priceUnit}</Text>
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.actionButton, loading && { opacity: 0.7 }]}
                    disabled={loading}
                    onPress={async () => {
                        if (isPooling) {
                            navigation.navigate('SeatPreference' as never, {
                                rideData: {
                                    ...rideData,
                                    type: 'POOLING',
                                    isOutstation: true,
                                    tripId: ride._id
                                },
                                fromLocation: pickupAddress,
                                toLocation: dropoffAddress,
                                date,
                                maxSeats: ride.availableSeats,
                                initialSeats: seats
                            } as never);
                        } else {
                            setLoading(true);
                            try {
                                const totalSeatsToBook = ride.availableSeats || 4;
                                const response = await poolService.bookSeat(ride._id, totalSeatsToBook);

                                if (response.success) {
                                    const driverData = {
                                        name: driverName,
                                        car: vehicleName,
                                        initial: driverName.charAt(0),
                                        rating: rating,
                                        price: displayPrice
                                    };

                                    navigation.navigate('PoolingSuccess' as never, {
                                        driver: driverData,
                                        rideData: { ...rideData, ...ride, type: 'RENTAL' },
                                        price: displayPrice,
                                        passengers: 'Full Car',
                                        status: 'REQUESTED',
                                        mode: 'RENTAL',
                                        fromLocation: pickupAddress,
                                        toLocation: dropoffAddress,
                                        date
                                    } as never);
                                } else {
                                    Alert.alert('Booking Failed', response.message || 'Could not request rental');
                                }
                            } catch (error: any) {
                                console.error("Rental booking error:", error);
                                Alert.alert('Error', error.response?.data?.message || 'Failed to request rental. Ensure you are logged in.');
                            } finally {
                                setLoading(false);
                            }
                        }
                    }}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.actionButtonText}>
                            {isPooling ? 'Continue to Seat Selection' : 'Request Cab Rental'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 120,
    },
    card: {
        backgroundColor: '#1E293B',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#334155',
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    driverName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#F59E0B',
    },
    dotSeparator: {
        marginHorizontal: 6,
        color: '#64748B',
    },
    verifiedText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#10B981',
    },
    modePill: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    modePillText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#10B981',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: '#334155',
        marginVertical: 14,
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vehicleIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    vehicleName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    plateText: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    cardSectionHeader: {
        fontSize: 11,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    timeSummaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0F172A',
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
    },
    timeLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
    },
    timeValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 2,
    },
    routeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    routeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#10B981',
    },
    timelineContainer: {
        paddingTop: 4,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 14,
    },
    iconColumn: {
        alignItems: 'center',
        width: 20,
        marginRight: 12,
        paddingTop: 2,
    },
    verticalLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#334155',
        marginVertical: 4,
    },
    textColumn: {
        flex: 1,
    },
    pointLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    pointAddress: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 2,
        lineHeight: 18,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    featureChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    featureChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#E2E8F0',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1E293B',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#334155',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceColumn: {
        flex: 1,
    },
    footerPriceLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
    },
    footerPriceValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        marginTop: 1,
    },
    footerPriceUnit: {
        fontSize: 11,
        fontWeight: '700',
        color: '#10B981',
    },
    actionButton: {
        backgroundColor: '#10B981',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});

export default OutstationRideDetailScreen;

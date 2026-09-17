import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Switch,
    Dimensions,
    ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft,
    faCalendar,
    faUser,
    faCarSide,
    faClock,
    faHandHoldingDollar,
    faCreditCard,
    faMinus,
    faPlus,
    faCircle,
    faSquare,
    faClockRotateLeft
} from '@fortawesome/free-solid-svg-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTrips } from '../Context/TripContext';

const { width } = Dimensions.get('window');

const OutstationReviewScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const {
        fromLocation,
        toLocation,
        date,
        seats,
        rideData,
        driver,
        price,
        passengers,
        seatDistribution,
        status,
        mode
    } = route.params as any || {};

    const { bookSeat } = useTrips();

    const [suggestFare, setSuggestFare] = useState(false);
    const isPooling = mode === 'POOLING';
    const ride = rideData?.fullData || {};

    // Use passed price or fallback to default
    const initialPrice = ride.pricePerSeat || (price ? parseFloat(price) : 45);
    const [baseFare, setBaseFare] = useState(initialPrice);

    const serviceFee = 4.50; // Mock service fee
    // If we have seat count from params, use it, else default to seats prop or 1
    const seatCount = typeof passengers === 'number' ? passengers : (seats || 1);

    // Total fare calculation depends on whether we are pooling (per seat) or rental (total)
    // For now assuming baseFare is per seat for pooling, and total for rental
    const totalFare = (baseFare * (mode === 'RENTAL' ? 1 : seatCount)) + serviceFee;

    const formattedTime = ride.scheduledTime
        ? new Date(ride.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '6:30 AM';

    const distanceText = ride.route?.distance ? `~${ride.route.distance} km` : '~612 km';
    const durationText = ride.route?.duration ? `${Math.floor(ride.route.duration / 60)}h ${ride.route.duration % 60}m` : '3h 30m';

    const incrementFare = () => setBaseFare((prev: number) => prev + 5);
    const decrementFare = () => setBaseFare((prev: number) => (prev > 10 ? prev - 5 : prev));

    const handleConfirm = () => {
        if (rideData?.tripId) {
            const currentPassenger = {
                id: 'p_' + Math.random().toString(36).substr(2, 9),
                initial: 'Y',
                color: '#10B981' // Hybrid Ride theme color
            };
            bookSeat(rideData.tripId, currentPassenger, seatCount);
        }

        (navigation as any).navigate('PoolingSuccess', {
            driver: driver || { name: 'Driver', rating: 4.8 }, // Fallback if no driver data
            rideData: { ...rideData, fromLocation, toLocation, date },
            price: totalFare.toFixed(2),
            passengers: passengers || seats,
            seatDistribution,
            status: status || 'CONFIRMED'
        });
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <FontAwesomeIcon icon={faArrowLeft} size={20} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Review Request</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Trip Details Card */}
                    <View style={styles.card}>
                        <View style={styles.tripHeader}>
                            <View style={styles.badge}>
                                <FontAwesomeIcon icon={faCalendar} size={12} color="#4B5563" style={{ marginRight: 6 }} />
                                <Text style={styles.badgeText}>{date || '2026-02-20'}</Text>
                            </View>
                            <View style={[styles.badge, { marginLeft: 8 }]}>
                                <FontAwesomeIcon icon={faUser} size={12} color="#4B5563" style={{ marginRight: 6 }} />
                                <Text style={styles.badgeText}>{seatCount} Seat{seatCount > 1 ? 's' : ''}</Text>
                            </View>
                        </View>

                        <View style={styles.locationContainer}>
                            {/* Origin */}
                            <View style={styles.locationItem}>
                                <View style={styles.timelineContainer}>
                                    <FontAwesomeIcon icon={faCircle} size={12} color="#10B981" />
                                    <View style={styles.verticalLine} />
                                </View>
                                <View style={styles.addressContainer}>
                                    <Text style={styles.locationLabel}>ORIGIN</Text>
                                    <Text style={styles.locationText}>{fromLocation || 'San Francisco, CA'}</Text>
                                </View>
                            </View>

                            {/* Destination */}
                            <View style={styles.locationItem}>
                                <View style={styles.timelineContainer}>
                                    <FontAwesomeIcon icon={faSquare} size={12} color="#111827" />
                                </View>
                                <View style={styles.addressContainer}>
                                    <Text style={styles.locationLabel}>DESTINATION</Text>
                                    <Text style={styles.locationText}>{toLocation || 'Los Angeles, CA'}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.tripFooter}>
                            <View style={styles.tripInfoItem}>
                                <FontAwesomeIcon icon={faCarSide} size={14} color="#4B5563" style={{ marginRight: 6 }} />
                                <Text style={styles.tripInfoText}>{distanceText}</Text>
                            </View>
                            <View style={styles.tripInfoItem}>
                                <Text style={styles.tripInfoText}>{durationText}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Fare Card */}
                    <View style={[styles.card, { marginTop: 16 }]}>
                        <View style={styles.fareHeader}>
                            <View style={styles.fareTitleRow}>
                                <FontAwesomeIcon icon={faHandHoldingDollar} size={18} color="#F59E0B" style={{ marginRight: 8 }} />
                                <Text style={styles.cardTitle}>Suggest a Fare?</Text>
                            </View>
                            <Switch
                                trackColor={{ false: "#E5E7EB", true: "#D1FAE5" }}
                                thumbColor={suggestFare ? "#10B981" : "#F3F4F6"}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={setSuggestFare}
                                value={suggestFare}
                            />
                        </View>

                        <View style={styles.fareContent}>
                            <Text style={styles.standardFareLabel}>STANDARD FARE</Text>

                            {suggestFare ? (
                                <View style={styles.fareAdjustContainer}>
                                    <TouchableOpacity onPress={decrementFare} style={styles.fareButton}>
                                        <FontAwesomeIcon icon={faMinus} size={16} color="#111827" />
                                    </TouchableOpacity>
                                    <Text style={styles.largeFareText}>₹{baseFare}</Text>
                                    <TouchableOpacity onPress={incrementFare} style={styles.fareButton}>
                                        <FontAwesomeIcon icon={faPlus} size={16} color="#111827" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={styles.largeFareText}>₹{baseFare}</Text>
                            )}
                            <Text style={styles.perSeatText}>{mode === 'RENTAL' ? 'Total Trip' : 'per seat'}</Text>

                            <View style={styles.divider} />

                            <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabel}>
                                    {mode === 'RENTAL' ? 'Trip Fare' : `${seatCount} Seat${seatCount > 1 ? 's' : ''} x ₹${baseFare}`}
                                </Text>
                                <Text style={styles.breakdownValue}>
                                    ₹{(baseFare * (mode === 'RENTAL' ? 1 : seatCount)).toFixed(2)}
                                </Text>
                            </View>
                            <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabel}>Service Fee</Text>
                                <Text style={styles.breakdownValue}>₹{serviceFee.toFixed(2)}</Text>
                            </View>

                            <View style={[styles.divider, { marginVertical: 12 }]} />

                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Estimated Total</Text>
                                <Text style={styles.totalValue}>₹{totalFare.toFixed(2)}</Text>
                            </View>

                            <Text style={styles.disclaimerText}>
                                Final fare may vary slightly. Drivers may counter-offer your bid.
                            </Text>
                        </View>
                    </View>

                    {/* Payment Card */}
                    <View style={[styles.card, { marginTop: 16, flexDirection: 'row', alignItems: 'center' }]}>
                        <View style={styles.paymentIcon}>
                            <FontAwesomeIcon icon={faCreditCard} size={20} color="#10B981" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.paymentLabel}>PAYMENT METHOD</Text>
                            <Text style={styles.paymentValue}>Sanchari Wallet</Text>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Footer Action */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleConfirm}
                    >
                        <Text style={styles.confirmButtonText}>Confirm Ride Request</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    content: {
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tripHeader: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
    },
    locationContainer: {
        marginBottom: 20,
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    timelineContainer: {
        alignItems: 'center',
        marginRight: 12,
        width: 20,
        marginTop: 4,
    },
    verticalLine: {
        width: 2,
        height: 40,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
        borderRadius: 1,
    },
    addressContainer: {
        flex: 1,
        paddingBottom: 20,
    },
    locationLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    locationText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    tripFooter: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
    },
    tripInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    },
    tripInfoText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
    },
    fareHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    fareTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    fareContent: {
        alignItems: 'center',
    },
    standardFareLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    largeFareText: {
        fontSize: 42,
        fontWeight: '800',
        color: '#111827',
    },
    perSeatText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        marginBottom: 20,
    },
    fareAdjustContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    fareButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        width: '100%',
        marginVertical: 12,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 8,
    },
    breakdownLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    breakdownValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    disclaimerText: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 16,
    },
    paymentIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 2,
    },
    paymentValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    changeButton: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10B981',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 10,
    },
    confirmButton: {
        backgroundColor: '#111827',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});

export default OutstationReviewScreen;

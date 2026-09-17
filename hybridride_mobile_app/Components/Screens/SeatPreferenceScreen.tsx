import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faHandPointUp, faWallet, faMoneyBillWave, faCheckCircle, faCar, faMotorcycle, faBus } from '@fortawesome/free-solid-svg-icons';
import poolService from '../../Services/poolService';
import { Alert } from 'react-native';
import { useAuth } from '../Context/AuthContext';



const { width } = Dimensions.get('window');

const SeatPreferenceScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { rideData, fromLocation, toLocation, date, maxSeats, pickupCoords, dropoffCoords, distance, duration, initialSeats, vehicleType } = (route.params as any) || {};


    const [passengers, setPassengers] = useState<number>(initialSeats || 1);


    // Granular seat distribution state
    const [seatDistribution, setSeatDistribution] = useState({ FRONT: 0, MIDDLE: 0, BACK: 0 });
    const [showReviewSheet, setShowReviewSheet] = useState(false);
    const { user } = useAuth();

    const ROW_LIMITS = {
        FRONT: (vehicleType === 'BIKE' || vehicleType === 'AUTO') ? 0 : 1,
        MIDDLE: (vehicleType === 'BIKE') ? 0 : (vehicleType === 'AUTO' ? 3 : (vehicleType === 'TRAVELER' ? 10 : 3)),
        BACK: (vehicleType === 'BIKE' || vehicleType === 'AUTO' || (maxSeats && maxSeats <= 4)) ? 0 : (vehicleType === 'TRAVELER' ? 15 : 3)
    };


    const totalAllocated = Object.values(seatDistribution).reduce((a, b) => a + b, 0);

    const availableLimit = Math.max(1, Math.min(
        rideData?.seatsAvailable ?? rideData?.availableSeats ?? maxSeats ?? 4,
        maxSeats || 4
    ));

    const handleIncrement = () => {
        let limit = availableLimit;
        if (vehicleType === 'BIKE') limit = 1;
        else if (vehicleType === 'AUTO') limit = Math.min(3, availableLimit);

        if (passengers < limit) {
            setPassengers((prev: number) => prev + 1);
        }
    };


    const handleDecrement = () => {
        if (passengers > 1) {
            setPassengers((prev: number) => {
                const newCount = prev - 1;

                // If we reduce passengers below allocated, we must reset or reduce allocation
                if (totalAllocated > newCount) {
                    setSeatDistribution({ FRONT: 0, MIDDLE: 0, BACK: 0 });
                }
                return newCount;
            });
        }
    };

    const handleIncrementRow = (row: 'FRONT' | 'MIDDLE' | 'BACK') => {
        // @ts-ignore
        if (seatDistribution[row] < ROW_LIMITS[row] && totalAllocated < passengers) {
            setSeatDistribution(prev => ({ ...prev, [row]: prev[row] + 1 }));
        }
    };

    const handleDecrementRow = (row: 'FRONT' | 'MIDDLE' | 'BACK') => {
        if (seatDistribution[row] > 0) {
            setSeatDistribution(prev => ({ ...prev, [row]: prev[row] - 1 }));
        }
    };

    const handleConfirmSelection = () => {
        // If user hasn't manually picked row seats, auto-allocate default seats
        if (totalAllocated === 0 || totalAllocated !== passengers) {
            if (ROW_LIMITS.FRONT >= passengers) {
                setSeatDistribution({ FRONT: passengers, MIDDLE: 0, BACK: 0 });
            } else {
                setSeatDistribution({ FRONT: 0, MIDDLE: passengers, BACK: 0 });
            }
        }
        setShowReviewSheet(true);
    };

    const handleFinalConfirm = async () => {
        setShowReviewSheet(false);
        const calculatedPrice = getPrice();

        // If this is an backend-connected trip
        if (rideData?.tripId) {
            try {
                // Check wallet balance
                const price = parseFloat(getPrice());
                if ((user?.walletBalance || 0) < price) {
                    Alert.alert('Insufficient Balance', 'You don\'t have enough balance in your Sanchari Wallet. Please top up.');
                    return;
                }

                const response = await poolService.bookSeat(rideData.tripId, passengers, 'wallet');
                if (!response.success) {
                    Alert.alert('Booking Failed', response.message || 'Could not book seat');
                    return; // Halt navigation if booking fails
                }
            } catch (error: any) {
                console.error("Error booking seat:", error);
                Alert.alert('Error', error.response?.data?.message || 'Failed to book seat. Ensure you have an active account.');
                return;
            }
        }
        console.log('rideData', rideData)

        if (rideData?.type === 'POOLING') {
            const ride = rideData.fullData || {};
            const driverName = ride.host?.name || rideData.driver?.name || rideData.driverName || 'Driver';
            const carModel = ride.host?.driverDetails?.vehicle?.model || rideData.driver?.carModel || rideData.carModel || rideData.type || 'Car';
            const rating = ride.host?.driverDetails?.ratings?.average || rideData.driver?.rating || rideData.rating || '4.9';

            const driverData = {
                name: driverName,
                car: carModel,
                initial: driverName.charAt(0),
                rating: rating,
                price: calculatedPrice
            };

            navigation.navigate('PoolingSuccess' as never, {
                driver: driverData,
                rideData: { ...rideData, ...ride }, // Merge full data
                price: calculatedPrice,
                passengers,
                seatDistribution,
                status: 'CONFIRMED',
                mode: 'POOLING',
                fromLocation,
                toLocation,
                date
            } as any);
        } else {
            navigation.navigate('TripDetails' as never, {
                rideData,
                fromLocation,
                toLocation,
                passengers,
                seatDistribution,
                date,
                calculatedPrice,
                pickupCoords,
                dropoffCoords,
                distance,
                duration
            } as any);
        }
    };

    const getPrice = () => {
        const basePrice = Number(rideData?.pricePerSeat || rideData?.price || 50);
        const totalAllocated = seatDistribution.FRONT + seatDistribution.MIDDLE + seatDistribution.BACK;

        if (rideData?.seatPricing && totalAllocated > 0) {
            const frontPrice = (rideData.seatPricing.front || basePrice) * seatDistribution.FRONT;
            const middlePrice = (rideData.seatPricing.middle || basePrice) * seatDistribution.MIDDLE;
            const backPrice = (rideData.seatPricing.back || basePrice) * seatDistribution.BACK;
            return Math.round(frontPrice + middlePrice + backPrice).toString();
        }

        const count = totalAllocated > 0 ? totalAllocated : (passengers || 1);
        return Math.round(basePrice * count).toString();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faArrowLeft} size={20} color="#111827" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Select Seat Preference</Text>
                    {passengers - totalAllocated > 0 && (
                        <Text style={{ fontSize: 10, color: '#F59E0B', fontWeight: '700', marginTop: 2 }}>
                            {passengers - totalAllocated} SEAT{passengers - totalAllocated > 1 ? 'S' : ''} REMAINING TO ALLOCATE BELOW
                        </Text>
                    )}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>

                    {/* Passengers Counter */}
                    <View style={styles.counterCard}>
                        <View>
                            <Text style={styles.counterLabel}>PASSENGERS</Text>
                            <Text style={styles.counterValue}>{passengers} Seat{passengers > 1 ? 's' : ''}</Text>
                            <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700', marginTop: 2 }}>
                                Max {availableLimit} seat{availableLimit > 1 ? 's' : ''} available
                            </Text>
                        </View>
                        <View style={styles.counterControls}>
                            <TouchableOpacity onPress={handleDecrement} style={styles.controlButton}>
                                <Text style={styles.controlText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.controlValue}>{passengers}</Text>
                            <TouchableOpacity onPress={handleIncrement} style={styles.controlButton}>
                                <Text style={styles.controlText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Vehicle Interior Visual */}
                    <View style={styles.vehicleContainer}>
                        <View style={styles.vehicleInterior}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                <FontAwesomeIcon 
                                    icon={vehicleType === 'BIKE' ? faMotorcycle : (vehicleType === 'TRAVELER' ? faBus : faCar)} 
                                    size={16} 
                                    color="#6B7280" 
                                    style={{ marginRight: 10 }}
                                />
                                <Text style={[styles.interiorLabel, { marginBottom: 0 }]}>VEHICLE INTERIOR ({vehicleType || 'CAR'})</Text>
                            </View>

                            {vehicleType === 'BIKE' ? (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <View style={[styles.seat, styles.seatOccupied, { width: 80, height: 100, marginBottom: 20 }]}>
                                        <Text style={{ color: '#6B7280', fontSize: 24 }}>§</Text>
                                    </View>
                                    <Text style={{ color: '#9CA3AF', textAlign: 'center', fontWeight: '700' }}>
                                        {vehicleType === 'BIKE' ? 'Bike' : 'Auto'} selection confirmed.
                                    </Text>
                                    <View style={[styles.seat, styles.selectedRowBlock, { width: 80, height: 100, marginTop: 20, borderColor: '#14B8A6', borderWidth: 2 }]}>
                                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>YOU</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.interiorGrid}>
                                    {/* Driver Row */}
                                    <View style={styles.rowContainer}>
                                        <View style={[styles.seat, styles.seatOccupied]}>
                                            <Text style={styles.seatIcon}>§</Text>
                                        </View>
                                        <View style={[styles.seat, styles.seatDriver]}>
                                            <Text style={styles.seatTextDriver}>DRIVER</Text>
                                        </View>
                                    </View>

                                    {/* Front Row */}
                                    <View style={[styles.rowBlock, seatDistribution.FRONT > 0 && styles.selectedRowBlock]}>
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={[styles.rowText, seatDistribution.FRONT > 0 && styles.selectedRowText]}>FRONT ROW</Text>
                                            <Text style={[styles.rowSubText, seatDistribution.FRONT > 0 && styles.selectedRowSubText]}>
                                                ₹{(rideData?.seatPricing?.front || rideData?.pricePerSeat || rideData?.price || 15).toFixed(0)}/seat • Only 1
                                            </Text>
                                        </View>
                                        <View style={styles.seatControls}>
                                            <TouchableOpacity onPress={() => handleDecrementRow('FRONT')} style={styles.seatControlButton}>
                                                <Text style={styles.seatControlText}>-</Text>
                                            </TouchableOpacity>
                                            <Text style={[styles.seatControlValue, seatDistribution.FRONT > 0 && { color: '#FFFFFF' }]}>{seatDistribution.FRONT}</Text>
                                            <TouchableOpacity onPress={() => handleIncrementRow('FRONT')} style={styles.seatControlButton}>
                                                <Text style={styles.seatControlText}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Middle Row */}
                                    <View style={[styles.rowBlock, seatDistribution.MIDDLE > 0 && styles.selectedRowBlock]}>
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={[styles.rowText, seatDistribution.MIDDLE > 0 && styles.selectedRowText]}>MIDDLE ROW</Text>
                                            <Text style={[styles.rowSubText, seatDistribution.MIDDLE > 0 && styles.selectedRowSubText]}>
                                                ₹{(rideData?.seatPricing?.middle || rideData?.pricePerSeat || rideData?.price || 12).toFixed(0)}/seat
                                            </Text>
                                        </View>
                                        <View style={styles.seatControls}>
                                            <TouchableOpacity onPress={() => handleDecrementRow('MIDDLE')} style={styles.seatControlButton}>
                                                <Text style={styles.seatControlText}>-</Text>
                                            </TouchableOpacity>
                                            <Text style={[styles.seatControlValue, seatDistribution.MIDDLE > 0 && { color: '#FFFFFF' }]}>{seatDistribution.MIDDLE}</Text>
                                            <TouchableOpacity onPress={() => handleIncrementRow('MIDDLE')} style={styles.seatControlButton}>
                                                <Text style={styles.seatControlText}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Back Row */}
                                    <View
                                        style={[
                                            styles.rowBlock,
                                            seatDistribution.BACK > 0 && styles.selectedRowBlock,
                                            (vehicleType !== 'TRAVELER' && maxSeats && maxSeats <= 4) && { opacity: 0.5 }
                                        ]}
                                    >
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={[styles.rowText, seatDistribution.BACK > 0 && styles.selectedRowText]}>BACK ROW</Text>
                                            <Text style={[styles.rowSubText, seatDistribution.BACK > 0 && styles.selectedRowSubText]}>
                                                ₹{(rideData?.seatPricing?.back || rideData?.pricePerSeat || rideData?.price || 10).toFixed(0)}/seat
                                            </Text>
                                        </View>
                                        <View style={styles.seatControls}>
                                            <TouchableOpacity onPress={() => handleDecrementRow('BACK')} disabled={vehicleType !== 'TRAVELER' && maxSeats && maxSeats <= 4} style={styles.seatControlButton}>
                                                <Text style={styles.seatControlText}>-</Text>
                                            </TouchableOpacity>
                                            <Text style={[styles.seatControlValue, seatDistribution.BACK > 0 && { color: '#FFFFFF' }]}>{seatDistribution.BACK}</Text>
                                            <TouchableOpacity onPress={() => handleIncrementRow('BACK')} disabled={vehicleType !== 'TRAVELER' && maxSeats && maxSeats <= 4} style={styles.seatControlButton}>
                                                <Text style={styles.seatControlText}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                        {(vehicleType !== 'TRAVELER' && maxSeats && maxSeats <= 4) && (
                                            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 10 }}>UNAVAILABLE</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}

                            {/* Legend - Moved below seats but above helper */}
                            <View style={styles.legendContainer}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#14B8A6' }]} />
                                    <Text style={styles.legendText}>SELECTED</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#374151' }]} />
                                    <Text style={styles.legendText}>AVAILABLE</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#1F2937', opacity: 0.5 }]} />
                                    <Text style={styles.legendText}>FULL</Text>
                                </View>
                            </View>

                            {/* Helper Text - Moved inside vehicle container */}
                            <View style={styles.helperContainer}>
                                <FontAwesomeIcon icon={faHandPointUp} size={16} color="#D97706" style={{ marginRight: 8 }} />
                                <Text style={styles.helperText}>
                                    {vehicleType === 'BIKE'
                                        ? "Bike confirmed for 1 passenger"
                                        : (vehicleType === 'AUTO' && totalAllocated === passengers)
                                            ? "Auto seats selected"
                                            : `Allocated ${totalAllocated} of ${passengers} seats`
                                    }
                                </Text>
                            </View>

                        </View>
                    </View>

                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.footerInfo}>
                    <Text style={styles.totalLabel}>Estimated Total</Text>
                    <Text style={styles.totalPrice}>₹{getPrice()}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.confirmButton, (totalAllocated === passengers || vehicleType === 'BIKE' || vehicleType === 'AUTO') ? styles.confirmButtonActive : styles.confirmButtonDisabled]}
                    disabled={vehicleType === 'BIKE' || vehicleType === 'AUTO' ? passengers < 1 : totalAllocated !== passengers}
                    onPress={handleConfirmSelection}
                >
                    <Text style={[styles.confirmButtonText, (totalAllocated === passengers || vehicleType === 'BIKE' || vehicleType === 'AUTO') ? styles.confirmButtonTextActive : styles.confirmButtonTextDisabled]}>
                        {vehicleType === 'BIKE' || vehicleType === 'AUTO'
                            ? `Confirm ${vehicleType === 'BIKE' ? 'Bike' : 'Auto'} Booking`
                            : (totalAllocated === passengers ? 'Confirm Selection' : `Select ${passengers - totalAllocated} more`)}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Review Preference Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showReviewSheet}
                onRequestClose={() => setShowReviewSheet(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setShowReviewSheet(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.modalContent}
                        onPress={() => { }}
                    >
                        <View style={styles.modalHandle} />

                        <Text style={styles.modalTitle}>Review Preference</Text>

                        <View style={styles.reviewRow}>
                            <Text style={styles.reviewLabel}>SEAT COUNT</Text>
                            <Text style={styles.reviewValue}>{passengers} Passenger{passengers > 1 ? 's' : ''}</Text>
                        </View>

                        <View style={styles.reviewRow}>
                            <Text style={styles.reviewLabel}>SEAT DISTRIBUTION</Text>
                            <View style={{ alignItems: 'flex-end' }}>
                                {seatDistribution.FRONT > 0 && <Text style={styles.reviewValueTeal}>Front: {seatDistribution.FRONT}</Text>}
                                {seatDistribution.MIDDLE > 0 && <Text style={styles.reviewValueTeal}>Middle: {seatDistribution.MIDDLE}</Text>}
                                {seatDistribution.BACK > 0 && <Text style={styles.reviewValueTeal}>Back: {seatDistribution.BACK}</Text>}
                            </View>
                        </View>

                        <Text style={[styles.reviewLabel, { marginBottom: 16 }]}>PAYMENT METHOD</Text>
                        <View style={styles.paymentSelector}>
                            <View
                                style={[styles.paymentOption, styles.paymentOptionActive]}
                            >
                                <FontAwesomeIcon icon={faWallet} size={16} color="#FFFFFF" />
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={[styles.paymentText, styles.paymentTextActive]}>Sanchari Cash (Wallet)</Text>
                                    <Text style={[styles.balanceText, styles.balanceTextActive]}>Available: ₹{user?.walletBalance || 0}</Text>
                                </View>
                                <FontAwesomeIcon icon={faCheckCircle} size={14} color="#FFFFFF" style={{ marginLeft: 'auto' }} />
                            </View>

                            {(user?.walletBalance || 0) < parseFloat(getPrice()) && (
                                <TouchableOpacity
                                    style={styles.topUpHint}
                                    onPress={() => navigation.navigate('Wallet' as never)}
                                >
                                    <Text style={styles.topUpHintText}>Insufficient balance. Tap to Top-up.</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={[styles.reviewRow, styles.reviewTotalRow]}>
                            <Text style={styles.reviewLabelTotal}>Estimated Price</Text>
                            <Text style={styles.reviewValueTotal}>₹{getPrice()}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.finalConfirmButton}
                            onPress={handleFinalConfirm}
                        >
                            <Text style={styles.finalConfirmButtonText}>Confirm Preference</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 4,
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800', // Extra bold for header
        color: '#111827',
    },
    content: {
        flex: 1,
        backgroundColor: '#F9FAFB', // Light gray background for content
        padding: 20,
    },
    counterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        padding: 16,
        marginBottom: 30,
    },
    counterLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    counterValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    counterControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    controlButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    controlValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
        width: 20,
        textAlign: 'center',
    },
    vehicleContainer: {
        marginTop: 80,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    vehicleInterior: {
        width: width * 0.85, // Slightly wider for better fit
        backgroundColor: '#111827', // Dark navy interior
        borderRadius: 40,
        padding: 20,
        paddingTop: 40,
        alignItems: 'center',
        // Removed fixed height to allow dynamic growth
        paddingBottom: 40,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100,
        backgroundColor: '#F3F4F6',
    },
    interiorLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#6B7280',
        marginBottom: 20,
        letterSpacing: 2,
    },
    interiorGrid: {
        width: '100%',
        paddingHorizontal: 19,
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    seat: {
        width: '45%',
        height: 60,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    seatOccupied: {
        backgroundColor: '#1F2937', // Darker gray
    },
    seatDriver: {
        backgroundColor: '#1F2937',
        borderWidth: 1,
        borderColor: '#374151',
    },
    seatIcon: {
        color: '#4B5563',
        fontSize: 18,
    },
    seatTextDriver: {
        fontSize: 10,
        fontWeight: '800',
        color: '#4B5563',
    },
    rowBlock: {
        width: '100%',
        backgroundColor: '#374151', // Dark Gray Available
        borderRadius: 16,
        paddingVertical: 24, // Taller rows
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#4B5563',
    },
    selectedRowBlock: {
        backgroundColor: '#374151', // Keep bg same or slightly lighter?
        borderColor: '#14B8A6', // Teal border
        borderWidth: 2,
    },
    rowText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 2,
    },
    selectedRowText: {
        color: '#FFFFFF',
    },
    rowSubText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#14B8A6', // Teal
        marginTop: 4,
    },
    selectedRowSubText: {
        color: '#2DD4BF',
    },
    legendContainer: {
        flexDirection: 'row',
        marginTop: 30,
        width: '100%',
        justifyContent: 'center',
        gap: 16,

    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 2, // Soft square
        marginRight: 6,
    },
    legendText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    helperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white on dark bg
        padding: 12,
        borderRadius: 12,
        justifyContent: 'center',
        marginTop: 24,
        width: '100%',
    },
    helperText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF', // Lighter text for dark bg
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    footerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
    },
    totalPrice: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
    },
    // Seat Control Styles
    seatControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)', // Semi-transparent dark
        borderRadius: 12,
        padding: 4,
        marginTop: 8,
    },
    seatControlButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
    },
    seatControlText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    seatControlValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#9CA3AF', // Default gray, white if selected
        width: 30,
        textAlign: 'center',
    },
    confirmButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    confirmButtonActive: {
        backgroundColor: '#111827', // Dark navy active
    },
    confirmButtonDisabled: {
        backgroundColor: '#E5E7EB',
        opacity: 0.5,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '800',
    },
    confirmButtonTextActive: {
        color: '#FFFFFF', // White text when active
    },
    confirmButtonTextDisabled: {
        color: '#9CA3AF',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly darker
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 32,
    },
    reviewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6', // Very subtle separator
        paddingBottom: 16,
    },
    reviewTotalRow: {
        borderBottomWidth: 0, // No separator for last item
        marginTop: 10,
        marginBottom: 30,
    },
    reviewLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 0.5,
    },
    reviewValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    reviewValueTeal: {
        fontSize: 16,
        fontWeight: '800',
        color: '#14B8A6', // Teal
        marginBottom: 4,
    },
    reviewLabelTotal: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111827',
    },
    reviewValueTotal: {
        fontSize: 28,
        fontWeight: '900',
        color: '#111827',
    },
    finalConfirmButton: {
        backgroundColor: '#111827',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: 'rgba(17, 24, 39, 0.5)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    finalConfirmButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    paymentSelector: {
        gap: 12,
        marginBottom: 24,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    paymentOptionActive: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    paymentText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#374151',
        marginLeft: 12,
    },
    paymentTextActive: {
        color: '#FFFFFF',
    },
    balanceText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
    },
    balanceTextActive: {
        color: '#9CA3AF',
    },
    topUpHint: {
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    topUpHintText: {
        color: '#DC2626',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
});

export default SeatPreferenceScreen;

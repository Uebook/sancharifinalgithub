import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faPlus, faMinus, faRocket, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { requestRide, updateRideStatus } from '../../Services/rideService';
import { useAuth } from '../Context/AuthContext';

const { width } = Dimensions.get('window');

const OfferFareScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    // Receive ride details from previous screen (TripDetails / RideSelection)
    const params = (route.params as any) || {};
    const pickupAddress = params.pickupAddress || 'Current Location';
    const pickupCoords = params.pickupCoords || [77.2090, 28.6139]; // Default Delhi
    const dropoffAddress = params.dropoffAddress || 'Destination';
    const dropoffCoords = params.dropoffCoords || [77.1025, 28.5562];
    const vehicleType = params.vehicleType || 'CAR';
    const rideType = params.rideType || 'city';
    const distanceKm = params.distanceKm || 10;
    const durationMins = params.durationMins || 20;
    const suggestedFare = params.estimatedFare || 150;

    const { user } = useAuth();
    const [price, setPrice] = useState(suggestedFare);
    const [loading, setLoading] = useState(false);

    const handleIncrement = () => setPrice((prev: number) => prev + 5);
    const handleDecrement = () => setPrice((prev: number) => (prev > 20 ? prev - 5 : prev));

    const handleFindDriver = async () => {
        if (loading) return;

        // Balance Check
        if ((user?.walletBalance || 0) < price) {
            Alert.alert(
                'Insufficient Balance', 
                'You need to top up your wallet to book a ride.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Top Up', onPress: () => navigation.navigate('Wallet' as never) }
                ]
            );
            return;
        }

        setLoading(true);
        try {
            const result = await requestRide({
                pickupAddress,
                pickupCoords,
                dropoffAddress,
                dropoffCoords,
                rideType,
                vehicleType,
                distanceKm,
                durationMins,
                offeredFare: price,
                paymentMethod: 'wallet',
            });

            if (result.success) {
                // Navigate to FindingDriver and pass the booking ID for polling
                (navigation as any).navigate('FindingDriver', {
                    bookingId: result.data._id,
                });
            } else {
                Alert.alert('Error', result.message || 'Could not request a ride. Try again.');
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Network error. Please try again.';
            if (error?.response?.status === 402) {
                // Insufficient wallet balance
                Alert.alert(
                    'Insufficient Balance',
                    error?.response?.data?.message || 'Please top up your wallet to book a ride.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Top Up Wallet', onPress: () => navigation.navigate('Wallet' as never) }
                    ]
                );
            } else if (error?.response?.status === 409) {
                // Already has an active ride — navigate to it or cancel it
                const existingBookingId = error?.response?.data?.data?.bookingId;
                Alert.alert('Active Ride', 'You already have an active ride.', [
                    {
                        text: 'Cancel Active Ride',
                        style: 'destructive',
                        onPress: async () => {
                            if (existingBookingId) {
                                try {
                                    setLoading(true);
                                    await updateRideStatus(existingBookingId, 'cancelled', 'Requested new ride');
                                    Alert.alert('Success', 'Active ride cancelled. You can now request a new one.');
                                } catch (e) {
                                    Alert.alert('Error', 'Failed to cancel active ride.');
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }
                    },
                    { text: 'View Ride', onPress: () => navigation.navigate('DriverAccepted' as never) },
                ]);
            } else {
                const serverError = error?.response?.data?.error;
                Alert.alert('Error', serverError ? `${msg}: ${serverError}` : msg);
            }
        } finally {
            setLoading(false);
        }
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
                <Text style={styles.headerTitle}>Offer your fare</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>

                <Text style={styles.subtitle}>Drivers are more likely to accept higher bids.</Text>

                {/* Price Controls */}
                <View style={styles.priceControlContainer}>
                    <TouchableOpacity style={styles.controlButtonLight} onPress={handleDecrement}>
                        <FontAwesomeIcon icon={faMinus} size={15} color="#9CA3AF" />
                    </TouchableOpacity>

                    <View style={styles.priceDisplay}>
                        <Text style={styles.currencySymbol}>₹</Text>
                        <Text style={styles.priceValue}>{price}</Text>
                    </View>

                    <TouchableOpacity style={styles.controlButtonDark} onPress={handleIncrement}>
                        <FontAwesomeIcon icon={faPlus} size={15} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Quick Options */}
                <View style={styles.quickOptionsContainer}>
                    <TouchableOpacity style={styles.quickOption} onPress={() => setPrice(Math.round(suggestedFare * 0.85))}>
                        <Text style={styles.quickOptionText}>Min ₹{Math.round(suggestedFare * 0.85)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickOption} onPress={() => setPrice(suggestedFare)}>
                        <Text style={styles.quickOptionText}>Est ₹{suggestedFare}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickOption, styles.quickOptionTeal]} onPress={() => setPrice(Math.round(suggestedFare * 1.2))}>
                        <Text style={[styles.quickOptionText, styles.quickOptionTextTeal]}>Fast ₹{Math.round(suggestedFare * 1.2)}</Text>
                        <FontAwesomeIcon icon={faRocket} size={12} color="#0F766E" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <FontAwesomeIcon icon={faInfoCircle} size={20} color="#3B82F6" style={{ marginRight: 12, marginTop: 2 }} />
                    <Text style={styles.infoText}>
                        {pickupAddress} → {dropoffAddress}{'\n'}
                        <Text style={styles.boldBlue}>~{distanceKm} km • ~{durationMins} min</Text>
                    </Text>
                </View>

            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.findDriverButton, loading && { opacity: 0.7 }]}
                    onPress={handleFindDriver}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color="#FFFFFF" />
                        : <Text style={styles.findDriverButtonText}>Find Driver for ₹{price}</Text>
                    }
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 40,
    },
    backButton: { padding: 4 },
    backButtonCircle: { width: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    content: { justifyContent: 'center', flex: 1, alignItems: 'center', paddingHorizontal: 20 },
    subtitle: { fontSize: 14, color: '#9CA3AF', fontWeight: '600', marginBottom: 40, textAlign: 'center' },
    priceControlContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginBottom: 40, width: '100%',
    },
    controlButtonLight: {
        width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF',
        borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    controlButtonDark: {
        width: 64, height: 64, borderRadius: 32, backgroundColor: '#111827',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    priceDisplay: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 30 },
    currencySymbol: { fontSize: 24, fontWeight: '700', color: '#9CA3AF', marginTop: 8, marginRight: 4 },
    priceValue: { fontSize: 80, fontWeight: '900', color: '#111827', lineHeight: 90 },
    quickOptionsContainer: { flexDirection: 'row', gap: 12, marginBottom: 40 },
    quickOption: {
        paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24,
        borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF',
    },
    quickOptionTeal: { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1', flexDirection: 'row', alignItems: 'center' },
    quickOptionText: { fontSize: 14, fontWeight: '700', color: '#374151' },
    quickOptionTextTeal: { color: '#0F766E' },
    infoBox: {
        flexDirection: 'row', backgroundColor: '#EFF6FF', borderRadius: 16,
        padding: 16, width: '100%', alignItems: 'flex-start',
    },
    infoText: { flex: 1, fontSize: 13, color: '#1D4ED8', lineHeight: 20 },
    boldBlue: { fontWeight: '800', color: '#1E40AF' },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    findDriverButton: {
        backgroundColor: '#14B8A6', paddingVertical: 18, borderRadius: 16, alignItems: 'center',
        shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    findDriverButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
});

export default OfferFareScreen;

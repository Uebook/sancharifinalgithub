import React from 'react';
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
import { faCheck } from '@fortawesome/free-solid-svg-icons';

const { width } = Dimensions.get('window');

const DriverRideCompletedScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const {
        bookingId,
        passengerName = "Passenger",
        fare = "0"
    } = route.params as any || {};

    const numericFare = parseFloat(fare?.toString()) || 0;
    const computedNet = numericFare.toFixed(2);
    const formattedFare = numericFare.toFixed(2);

    const handleFindNextRide = () => {
        // Navigate to Rating Screen with required params
        navigation.navigate('DriverRating' as never, { bookingId, passengerName } as never);
    };
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>

                {/* Success Icon */}
                <View style={styles.successIconContainer}>
                    <FontAwesomeIcon icon={faCheck} size={40} color="#FFFFFF" />
                </View>

                {/* Title */}
                <Text style={styles.title}>Trip Completed!</Text>
                <Text style={styles.subtitle}>Here's your earnings breakdown.</Text>

                {/* Earnings Card */}
                <View style={styles.earningsCard}>
                    {/* Total Fare */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Fare</Text>
                        <Text style={styles.value}>₹{formattedFare}</Text>
                    </View>

                    <View style={styles.separator} />

                    {/* Net Earnings */}
                    <View style={styles.netEarningsContainer}>
                        <Text style={styles.netLabel}>Net Earnings</Text>
                        <Text style={styles.netValue}>₹{computedNet}</Text>
                    </View>
                </View>

            </View>

            {/* Footer Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.findButton} onPress={handleFindNextRide}>
                    <Text style={styles.findButtonText}>Find Next Ride</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827', // Dark background
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    successIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10B981', // Green
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        marginBottom: 40,
        textAlign: 'center',
    },
    earningsCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6B7280', // Gray-500
    },
    value: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
    },
    separator: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
    },
    subLabel: {
        fontSize: 14,
        color: '#9CA3AF', // Gray-400
    },
    subValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    subValueRed: {
        fontSize: 14,
        fontWeight: '700',
        color: '#EF4444', // Red-500
    },
    netEarningsContainer: {
        marginTop: 16,
        backgroundColor: '#F9FAFB', // Light gray bg
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    netLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    netValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#10B981', // Green-500
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
    },
    findButton: {
        backgroundColor: '#14B8A6', // Teal-500
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#14B8A6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    findButtonText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});

export default DriverRideCompletedScreen;

import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheckCircle, faUser, faCar, faMapMarkerAlt, faTicketAlt, faHome, faClock } from '@fortawesome/free-solid-svg-icons';

const { width } = Dimensions.get('window');

const PoolingSuccessScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { driver, rideData, price, passengers, seatDistribution, status } = (route.params as any) || {};

    const isRequest = status === 'REQUESTED';

    const handleGoHome = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'PassengerHome' as never }],
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Success Header */}
                <View style={styles.header}>
                    <View style={[styles.iconContainer, isRequest && { backgroundColor: '#E0F2FE' }]}>
                        <FontAwesomeIcon
                            icon={isRequest ? faClock : faCheckCircle}
                            size={48}
                            color={isRequest ? '#0284C7' : '#10B981'}
                        />
                    </View>
                    <Text style={styles.title}>{isRequest ? 'Request Sent' : 'Booking Confirmed!'}</Text>
                    <Text style={styles.subtitle}>
                        {isRequest
                            ? "We'll notify you when the driver accepts."
                            : 'Your seat has been reserved.'}
                    </Text>
                </View>

                {/* Driver & Vehicle Card */}
                <View style={styles.card}>
                    <Text style={styles.cardHeader}>DRIVER DETAILS</Text>
                    <View style={styles.driverRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{driver?.initial || 'D'}</Text>
                        </View>
                        <View style={styles.driverInfo}>
                            <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
                            <View style={styles.ratingContainer}>
                                <Text style={styles.ratingText}>★ {driver?.rating || '4.8'}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.vehicleRow}>
                        <View style={styles.vehicleIcon}>
                            <FontAwesomeIcon icon={faCar} size={20} color="#6B7280" />
                        </View>
                        <View>
                            <Text style={styles.vehicleName}>{driver?.car || 'Vehicle Info'}</Text>
                            <Text style={styles.plateNumber}>{rideData?.vehicle?.plateNumber || 'HSW 882'}</Text>
                        </View>
                    </View>
                </View>

                {/* Ride Details Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardHeader}>TRIP DETAILS</Text>
                        <View style={styles.timeBadge}>
                            <FontAwesomeIcon icon={faClock} size={12} color="#059669" />
                            <Text style={styles.timeText}>
                                {rideData?.time || rideData?.depTime || rideData?.startTime || rideData?.eta || 'Scheduled'}
                            </Text>
                        </View>
                    </View>

                    {/* Route */}
                    <View style={styles.routeContainer}>
                        <View style={styles.routeItem}>
                            <View style={[styles.dot, { backgroundColor: '#14B8A6' }]} />
                            <Text style={styles.routeText} numberOfLines={1}>
                                {typeof rideData?.origin === 'object' ? rideData.origin.name : (rideData?.origin || rideData?.from || rideData?.fromLocation || 'Pickup Location')}
                            </Text>
                        </View>
                        <View style={styles.routeLine} />
                        <View style={styles.routeItem}>
                            <View style={[styles.dot, { backgroundColor: '#111827' }]} />
                            <Text style={styles.routeText} numberOfLines={1}>
                                {typeof rideData?.destination === 'object' ? rideData.destination.name : (rideData?.destination || rideData?.to || rideData?.toLocation || 'Dropoff Location')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Seats & Price */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>SEATS</Text>
                            <Text style={styles.statValue}>{passengers || 1}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>TOTAL FARE</Text>
                            <Text style={styles.statValuePrice}>₹{price || '0.00'}</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
                    <Text style={styles.homeButtonText}>Go to Home</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 30,
    },
    iconContainer: {
        marginBottom: 16,
        backgroundColor: '#D1FAE5',
        padding: 16,
        borderRadius: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        marginBottom: 16,
        letterSpacing: 1,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#059669',
        marginLeft: 6,
    },
    driverRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#475569',
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    ratingContainer: {
        backgroundColor: '#FEF3C7',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#D97706',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vehicleIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    vehicleName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    plateNumber: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 2,
    },
    routeContainer: {
        paddingLeft: 8,
    },
    routeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 30,
    },
    routeLine: {
        width: 2,
        height: 24,
        backgroundColor: '#E5E7EB',
        marginLeft: 5,
        marginVertical: 4,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    routeText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {

    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    statValuePrice: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    footer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    homeButton: {
        backgroundColor: '#111827',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    homeButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default PoolingSuccessScreen;

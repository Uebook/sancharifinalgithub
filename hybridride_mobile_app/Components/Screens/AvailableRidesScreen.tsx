import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faStar, faCar, faClock, faUser } from '@fortawesome/free-solid-svg-icons';
import apiClient, { getImageUrl } from '../../Services/apiClient';
import poolService from '../../Services/poolService';

const { width } = Dimensions.get('window');

const AvailableRidesScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { type, rideData, date, fromLocation, toLocation, pickupCoords, dropoffCoords, distance, duration } = (route.params as any) || {};

    const [availableRides, setAvailableRides] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    // const { trips } = useTrips();

    React.useEffect(() => {
        const fetchRides = async () => {
            setLoading(true);
            try {
                const fromCoordsStr = pickupCoords ? `${pickupCoords[0]},${pickupCoords[1]}` : undefined;
                const toCoordsStr = dropoffCoords ? `${dropoffCoords[0]},${dropoffCoords[1]}` : undefined;

                const response = await poolService.searchRides(type || 'local', date, fromCoordsStr, toCoordsStr);

                    const cityPools = response.data.map((t: any) => {
                        const vehicleDetails = t.host?.driverDetails?.vehicle;
                        const vName = vehicleDetails?.model
                            ? `${vehicleDetails.make || ''} ${vehicleDetails.model}`.trim()
                            : (t.vehicle || 'Pool Vehicle');
                        const vPlate = vehicleDetails?.plateNumber || vehicleDetails?.number || '';

                        return {
                            id: t._id,
                            driver: {
                                name: t.host?.name || 'Sanchari Driver',
                                rating: t.host?.driverDetails?.ratings?.average || 4.8,
                                carModel: vPlate ? `${vName} (${vPlate})` : vName
                            },
                            carType: t.vehicleType === 'BIKE' ? 'BIKE POOL' : 'CAR POOL',
                            vehicleType: t.vehicleType || 'CAR',
                            maxSeats: t.totalSeats || 4,
                            seatsAvailable: t.availableSeats,
                            price: t.pricePerSeat || 50,
                            time: t.scheduledTime,
                            eta: new Date(t.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            image: t.host?.profileImage,
                            origin: t.origin?.name || fromLocation || 'Pickup',
                            destination: t.destination?.name || toLocation || 'Destination',
                        };
                    });
                    setAvailableRides(cityPools);
            } catch (error) {
                console.error("Error fetching city pools:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRides();
    }, []);

    const getVehicleIcon = (type: string) => {
        switch (type?.toUpperCase()) {
            case 'BIKE': return faUser;
            case 'TRAVELER': return faCar;
            case 'AUTO': return faCar; // Could use customized icon if available
            default: return faCar;
        }
    };

    const handleSelectRide = (ride: any) => {
        // Navigate to SeatPreference with selected ride details
        (navigation as any).navigate('SeatPreference', {
            rideData: { ...rideData, ...ride, tripId: ride.id, }, // Merge original with selected to pass tripId
            date: ride.eta || date,
            fromLocation: fromLocation || ride.origin?.name,
            toLocation: toLocation || ride.destination?.name,
            pickupCoords,
            dropoffCoords,
            distance: ride.distance || distance,
            duration: ride.duration || duration,
            maxSeats: ride.maxSeats, // For dynamic seating logic
            vehicleType: ride.vehicleType,
        });
    };

    const renderRideItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.rideCard} onPress={() => handleSelectRide(item)}>
            <View style={styles.rideHeader}>
                <View style={styles.driverInfo}>
                    <View style={styles.avatarPlaceholder}>
                        {item.image ? (
                            <Image source={{ uri: getImageUrl(item.image) || undefined }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                        ) : (
                            <FontAwesomeIcon icon={faUser} size={20} color="#9CA3AF" />
                        )}
                    </View>
                    <View>
                        <Text style={styles.driverName}>{item.driver?.name || 'Driver'}</Text>
                        <View style={styles.ratingContainer}>
                            <FontAwesomeIcon icon={faStar} size={12} color="#F59E0B" />
                            <Text style={styles.ratingText}>{item.driver?.rating || '4.8'}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>₹{item.price.toFixed(2)}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.rideDetails}>
                <View style={styles.detailItem}>
                    <FontAwesomeIcon icon={getVehicleIcon(item.vehicleType)} size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{item.driver?.carModel || 'Vehicle'}</Text>
                </View>
                <View style={[styles.detailItem, { marginLeft: 16 }]}>
                    <FontAwesomeIcon icon={faClock} size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{item.eta} away</Text>
                </View>
                <View style={[styles.detailItem, { marginLeft: 16 }]}>
                    <FontAwesomeIcon icon={faUser} size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{item.seatsAvailable} seats left</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <View style={styles.backButtonCircle}>
                        <FontAwesomeIcon icon={faArrowLeft} size={20} color="#111827" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Available Pools</Text>
                <View style={{ width: 44 }} />
            </View>

            <FlatList
                data={availableRides}
                renderItem={renderRideItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <Text style={styles.listHeader}>Select a driver to join their pool</Text>
                }
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 50 }}>
                        <Text style={{ color: '#6B7280' }}>
                            {loading ? 'Searching for available drivers...' : 'No drivers available at the moment.'}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
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
        paddingVertical: 16,
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
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    listContent: {
        padding: 20,
    },
    listHeader: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
        fontWeight: '600',
    },
    rideCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    rideHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 4,
    },
    priceContainer: {
        backgroundColor: '#ECFDF5',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#059669',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    rideDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
        marginLeft: 6,
    },
});

export default AvailableRidesScreen;

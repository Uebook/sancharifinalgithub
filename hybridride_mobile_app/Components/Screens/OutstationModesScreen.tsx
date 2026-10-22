import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft,
    faStar,
    faCar,
    faSnowflake,
    faArrowRight,
    faBus,
    faSuitcase,
    faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import poolService from '../../Services/poolService';

const { width } = Dimensions.get('window');

const OutstationModesScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { fromLocation, toLocation, fromCoords, toCoords, date, seats } = (route.params as any) || {};
    const [activeTab, setActiveTab] = useState<'POOLING' | 'RENTAL'>('POOLING');

    const [poolingOptions, setPoolingOptions] = useState<any[]>([]);
    const [rentalOptions, setRentalOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRides = async () => {
        setLoading(true);
        try {
            // Fetch Outstation Pooling
            const poolingResponse = await poolService.searchRides('outstation', date, fromCoords, toCoords);
            if (poolingResponse.success) {
                const pools = poolingResponse.data.map((t: any) => {
                    const vehicleDetails = t.host?.driverDetails?.vehicle;
                    const vName = vehicleDetails?.model
                        ? `${vehicleDetails.make || ''} ${vehicleDetails.model}`.trim()
                        : (t.vehicle || 'Outstation SUV');
                    const vPlate = vehicleDetails?.plateNumber || vehicleDetails?.number || '';

                    return {
                        id: t._id,
                        tripId: t._id,
                        type: vPlate ? `${vName} (${vPlate})` : vName,
                        rating: t.host?.driverDetails?.ratings?.average || 4.9,
                        driver: t.host?.name || 'Sanchari Driver',
                        price: t.pricePerSeat || 150,
                        depTime: new Date(t.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        arrTime: 'Flexible',
                        seatsLeft: t.availableSeats,
                        icon: t.totalSeats > 7 ? faBus : faCar,
                        color: t.totalSeats > 7 ? '#E3F2FD' : '#ECFDF5',
                        origin: t.origin?.name || fromLocation || 'Pickup',
                        destination: t.destination?.name || toLocation || 'Destination',
                        fullData: t
                    };
                });
                setPoolingOptions(pools);
            }

            // Fetch Outstation Rentals
            const rentalResponse = await poolService.searchRides('rental', date, fromCoords, toCoords);
            if (rentalResponse.success) {
                const rentals = rentalResponse.data.map((t: any) => {
                    const vehicleDetails = t.host?.driverDetails?.vehicle;
                    const vName = vehicleDetails?.model
                        ? `${vehicleDetails.make || ''} ${vehicleDetails.model}`.trim()
                        : (t.vehicle || 'Full Car Rental');
                    const vPlate = vehicleDetails?.plateNumber || vehicleDetails?.number || '';

                    return {
                        id: t._id,
                        tripId: t._id,
                        type: vPlate ? `${vName} (${vPlate})` : vName,
                        rating: t.host?.driverDetails?.ratings?.average || 5.0,
                        provider: t.host?.name || 'Sanchari Partner',
                        price: t.pricePerSeat || 18,
                        tripType: 'PER KM',
                        features: ['Flexible DEP', 'Doorstep ARR', 'Private Vehicle'],
                        icon: t.totalSeats > 7 ? faBus : faCar,
                        color: t.totalSeats > 7 ? '#FEF3C7' : '#F0FDF4',
                        origin: t.origin?.name || fromLocation || 'Pickup',
                        destination: t.destination?.name || toLocation || 'Destination',
                        fullData: t
                    };
                });
                setRentalOptions(rentals);
            }
        } catch (error) {
            console.error("Error fetching outstation data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRides();
    }, [date, fromLocation, toLocation, JSON.stringify(fromCoords), JSON.stringify(toCoords)]);

    const renderPoolingItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => (navigation as any).navigate('OutstationRideDetail', {
                rideData: item,
                mode: 'POOLING',
                fromLocation: item.origin,
                toLocation: item.destination,
                seats
            })}
            activeOpacity={0.85}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                    <FontAwesomeIcon icon={item.icon} size={20} color="#0F172A" />
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={styles.vehicleType} numberOfLines={1}>{item.type}</Text>
                    <View style={styles.ratingRow}>
                        <FontAwesomeIcon icon={faStar} size={11} color="#F59E0B" style={{ marginRight: 4 }} />
                        <Text style={styles.ratingText}>{item.rating} • {item.driver}</Text>
                    </View>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>₹{item.price}</Text>
                    <Text style={styles.priceLabel}>PER SEAT</Text>
                </View>
            </View>

            <View style={styles.timeContainer}>
                <View style={styles.timeBlock}>
                    <Text style={styles.timeText}>{item.depTime}</Text>
                    <Text style={styles.timeLabel}>DEP</Text>
                </View>
                <View style={styles.routeLineContainer}>
                    <View style={styles.routeLine} />
                    <Text style={styles.routeLabel}>Direct Route</Text>
                </View>
                <View style={[styles.timeBlock, { alignItems: 'flex-end' }]}>
                    <Text style={styles.timeText}>{item.arrTime}</Text>
                    <Text style={styles.timeLabel}>ARR</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.seatsLeft} SEAT{item.seatsLeft > 1 ? 'S' : ''} LEFT</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: '#F1F5F9' }]}>
                    <FontAwesomeIcon icon={faSnowflake} size={12} color="#0284C7" style={{ marginRight: 4 }} />
                    <Text style={[styles.badgeText, { color: '#0F172A' }]}>AC VEHICLE</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderRentalItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => (navigation as any).navigate('OutstationRideDetail', {
                rideData: item,
                mode: 'RENTAL',
                fromLocation: item.origin,
                toLocation: item.destination,
                seats
            })}
            activeOpacity={0.85}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                    <FontAwesomeIcon icon={item.icon} size={20} color="#0F172A" />
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={styles.vehicleType} numberOfLines={1}>{item.type}</Text>
                    <View style={styles.ratingRow}>
                        <FontAwesomeIcon icon={faStar} size={11} color="#F59E0B" style={{ marginRight: 4 }} />
                        <Text style={styles.ratingText}>{item.rating} • {item.provider}</Text>
                    </View>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>₹{item.price}</Text>
                    <Text style={styles.priceLabel}>{item.tripType}</Text>
                </View>
            </View>

            <View style={styles.timeContainer}>
                <View style={styles.timeBlock}>
                    <Text style={styles.timeText}>Flexible</Text>
                    <Text style={styles.timeLabel}>DEP</Text>
                </View>
                <View style={styles.routeLineContainer}>
                    <View style={styles.routeLine} />
                    <Text style={styles.routeLabel}>Direct Route</Text>
                </View>
                <View style={[styles.timeBlock, { alignItems: 'flex-end' }]}>
                    <Text style={styles.timeText}>Doorstep</Text>
                    <Text style={styles.timeLabel}>ARR</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={[styles.badge, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[styles.badgeText, { color: '#0284C7' }]}>Full Vehicle Rental</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const fromName = fromLocation ? fromLocation.split(',')[0] : 'Pickup';
    const toName = toLocation ? toLocation.split(',')[0] : 'Destination';

    return (
        <View style={styles.container}>
            <View style={styles.topSection}>
                <SafeAreaView>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <FontAwesomeIcon icon={faArrowLeft} size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.dateText}>{date || 'Anytime'}</Text>
                            <View style={styles.routeRow}>
                                <Text style={styles.routeText} numberOfLines={1}>{fromName}</Text>
                                <FontAwesomeIcon icon={faArrowRight} size={12} color="#94A3B8" style={{ marginHorizontal: 8 }} />
                                <Text style={styles.routeText} numberOfLines={1}>{toName}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'POOLING' && styles.activeTab]}
                            onPress={() => setActiveTab('POOLING')}
                        >
                            <Text style={[styles.tabText, activeTab === 'POOLING' && styles.activeTabText]}>OUTSTATION POOLING</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'RENTAL' && styles.activeTab]}
                            onPress={() => setActiveTab('RENTAL')}
                        >
                            <Text style={[styles.tabText, activeTab === 'RENTAL' && styles.activeTabText]}>CAB RENTAL</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Filter Bar */}
                    <View style={styles.filterBar}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.optionsCountText}>
                                {activeTab === 'POOLING' ? poolingOptions.length : rentalOptions.length}
                            </Text>
                            <Text style={styles.optionsLabelText}> {activeTab === 'POOLING' ? 'pool options available' : 'rental cabs available'}</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            <View style={styles.listContainer}>
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
                        <ActivityIndicator size="large" color="#10B981" />
                        <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '600' }}>Fetching available outstation rides...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={activeTab === 'POOLING' ? poolingOptions : rentalOptions}
                        renderItem={activeTab === 'POOLING' ? renderPoolingItem : renderRentalItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyTitle}>No {activeTab === 'POOLING' ? 'Outstation Pools' : 'Rentals'} Found</Text>
                                <Text style={styles.emptySub}>
                                    No drivers have published {activeTab === 'POOLING' ? 'outstation pool' : 'cab rental'} rides for {fromName} → {toName} on this date yet.
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    topSection: {
        backgroundColor: '#0F172A',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 16,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTextContainer: {
        flex: 1,
    },
    dateText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '700',
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    routeText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        flexShrink: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 4,
        marginBottom: 12,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#10B981',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94A3B8',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    filterBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionsCountText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#10B981',
    },
    optionsLabelText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
    },
    listContainer: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    detailsContainer: {
        flex: 1,
    },
    vehicleType: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    ratingText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
    },
    priceLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    timeBlock: {
        flex: 1,
    },
    timeText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
    },
    timeLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        marginTop: 1,
    },
    routeLineContainer: {
        flex: 2,
        alignItems: 'center',
    },
    routeLine: {
        height: 2,
        backgroundColor: '#CBD5E1',
        width: '100%',
        marginBottom: 4,
    },
    routeLabel: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
    },
    badge: {
        backgroundColor: '#ECFDF5',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#059669',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
        paddingHorizontal: 30,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
    },
    emptySub: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default OutstationModesScreen;

import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faStar, faCar } from '@fortawesome/free-solid-svg-icons';
import { getOnlineDrivers } from '../../Services/rideService';

const DriverOffersScreen = () => {
    const navigation = useNavigation();
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const res = await getOnlineDrivers();
            if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                const colors = ['#CBD5E1', '#A7F3D0', '#BFDBFE', '#FDE68A', '#FCA5A5'];
                const mapped = res.data.map((d: any, idx: number) => ({
                    id: d._id || `driver-${idx}`,
                    name: d.name || 'Driver',
                    rating: d.driverDetails?.ratings?.average || 4.9,
                    car: d.driverDetails?.vehicle?.model || d.driverDetails?.vehicle?.make || 'Vehicle',
                    price: d.offeredFare || 180 + idx * 15,
                    timeAway: `${2 + idx * 2} min away`,
                    initial: (d.name?.[0] || 'D').toUpperCase(),
                    color: colors[idx % colors.length],
                    phone: d.phone || '',
                    vehicleColor: d.driverDetails?.vehicle?.color || 'Grey',
                    vehicleType: d.driverDetails?.vehicle?.type || 'Sedan',
                    plateNumber: d.driverDetails?.vehicle?.plateNumber || 'XX00 XX 0000',
                }));
                setDrivers(mapped);
            } else {
                setDrivers([]);
            }
        } catch (e) {
            console.error('Failed to fetch online driver offers:', e);
            setDrivers([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOffers();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOffers();
    };

    const handleDecline = (id: string) => {
        setDrivers(prev => prev.filter(d => d.id !== id));
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <FontAwesomeIcon icon={faTimes} size={20} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Drivers offering rides...</Text>
                <View style={{ width: 20 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#10B981" />
                        <Text style={styles.loadingText}>Searching for available drivers near you...</Text>
                    </View>
                ) : drivers.length > 0 ? (
                    drivers.map((driver) => (
                        <View key={driver.id} style={styles.driverCard}>
                            {/* Driver Info Header */}
                            <View style={styles.cardHeader}>
                                <View style={styles.driverProfile}>
                                    <View style={[styles.avatar, { backgroundColor: driver.color }]}>
                                        <Text style={styles.avatarText}>{driver.initial}</Text>
                                    </View>
                                    <View style={styles.driverDetails}>
                                        <Text style={styles.driverName}>{driver.name}</Text>
                                        <View style={styles.ratingContainer}>
                                            <FontAwesomeIcon icon={faStar} size={12} color="#F59E0B" />
                                            <Text style={styles.ratingText}>{driver.rating}</Text>
                                            <Text style={styles.dot}>•</Text>
                                            <Text style={styles.carModel}>{driver.car}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.priceContainer}>
                                    <Text style={styles.priceText}>₹{driver.price}</Text>
                                    <Text style={styles.offeredText}>Offered</Text>
                                </View>
                            </View>

                            {/* Actions */}
                            <View style={styles.cardActions}>
                                <View style={styles.timeTag}>
                                    <Text style={styles.timeTagText}>{driver.timeAway}</Text>
                                </View>

                                <View style={styles.buttonGroup}>
                                    <TouchableOpacity style={styles.declineButton} onPress={() => handleDecline(driver.id)}>
                                        <Text style={styles.declineText}>Decline</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.acceptButton}
                                        onPress={() => (navigation as any).navigate('DriverAccepted', { driver })}
                                    >
                                        <Text style={styles.acceptText}>Accept</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <FontAwesomeIcon icon={faCar} size={40} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>No Drivers Online</Text>
                        <Text style={styles.emptySub}>No active drivers are offering rides nearby right now. Pull down to refresh.</Text>
                    </View>
                )}
            </ScrollView>
            <Text style={styles.footerText}>Prices are final. No hidden fees.</Text>
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
        paddingTop: 10,
        marginBottom: 20,
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        flexGrow: 1,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginTop: 16,
        marginBottom: 6,
    },
    emptySub: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 18,
    },
    driverCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    driverProfile: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
    },
    driverDetails: {
        justifyContent: 'center',
    },
    driverName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
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
    dot: {
        marginHorizontal: 6,
        color: '#9CA3AF',
        fontSize: 12,
    },
    carModel: {
        fontSize: 12,
        color: '#6B7280',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    offeredText: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeTag: {
        backgroundColor: '#F0FDFA',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    timeTagText: {
        color: '#0F766E',
        fontSize: 12,
        fontWeight: '700',
    },
    buttonGroup: {
        flexDirection: 'row',
    },
    declineButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginRight: 8,
    },
    declineText: {
        color: '#6B7280',
        fontWeight: '700',
        fontSize: 14,
    },
    acceptButton: {
        backgroundColor: '#111827',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    acceptText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    footerText: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 12,
        marginBottom: 20,
    }
});

export default DriverOffersScreen;

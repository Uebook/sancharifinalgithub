import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

import poolService from '../../Services/poolService';

// Visual Tabs
type Tab = 'Ongoing' | 'Scheduled' | 'Completed' | 'Cancelled';

const DriverProfileMyTripsScreen = () => {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<Tab>('Scheduled');
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await poolService.getDriverHistory();
                if (res.success) {
                    const mapped = res.data.map((t: any) => ({
                        id: t._id,
                        date: new Date(t.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + new Date(t.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        origin: t.origin?.name || 'Unknown',
                        destination: t.destination?.name || 'Unknown',
                        price: t.pricePerSeat ? `₹${t.pricePerSeat}` : '₹15',
                        status: t.status === 'scheduled' ? 'Scheduled'
                            : t.status === 'ongoing' ? 'Ongoing'
                                : t.status === 'completed' ? 'Completed'
                                    : 'Cancelled'
                    }));
                    setTrips(mapped);
                }
            } catch (err) {
                console.error("Error fetching driver profile trips:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const currentTrips = trips.filter(trip => activeTab === trip.status);

    const renderTab = (tabName: Tab) => (
        <TouchableOpacity
            style={[styles.tab, activeTab === tabName && styles.tabActive]}
            onPress={() => setActiveTab(tabName)}
        >
            <Text style={[styles.tabText, activeTab === tabName && styles.tabTextActive]}>
                {tabName}
            </Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#10B981" />
            </SafeAreaView>
        );
    }

    const renderTripCard = (trip: any) => (
        <View key={trip.id} style={styles.card}>
            {/* Header: Date Tag & Price */}
            <View style={styles.cardHeader}>
                <View style={styles.dateTag}>
                    <Text style={styles.dateTagText}>SCHEDULED FOR {trip.date}</Text>
                </View>
                <Text style={styles.priceText}>{trip.price}</Text>
            </View>

            {/* Route Visualization */}
            <View style={styles.routeContainer}>
                {/* Timeline Graphics */}
                <View style={styles.timelineColumn}>
                    <View style={styles.dotOrigin} />
                    <View style={styles.line} />
                    <View style={styles.squareDest} />
                </View>

                {/* Locations */}
                <View style={styles.locationsColumn}>
                    <View style={styles.locationItem}>
                        <Text style={styles.locationText}>{trip.origin}</Text>
                    </View>
                    <View style={{ height: 24 }} />
                    <View style={styles.locationItem}>
                        <Text style={styles.locationText}>{trip.destination}</Text>
                    </View>
                </View>
            </View>

            {/* Footer: Status & Details */}
            <View style={styles.cardFooter}>
                <Text style={styles.statusLabel}>
                    {activeTab === 'Scheduled' ? 'SCHEDULED' : activeTab.toUpperCase()}
                </Text>
                <TouchableOpacity 
                    style={styles.detailsButton}
                    onPress={() => {
                        const targetTab = (activeTab === 'Scheduled' || activeTab === 'Ongoing') ? 'Upcoming' : 'Past';
                        (navigation as any).navigate('DriverMyTrips', { initialTab: targetTab });
                    }}
                >
                    <Text style={styles.detailsText}>DETAILS</Text>
                    <FontAwesomeIcon icon={faChevronRight} size={10} color="#94A3B8" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Rides</Text>
            </View>

            {/* Scrollable Tabs */}
            <View style={styles.tabsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContainer}
                >
                    {renderTab('Ongoing')}
                    {renderTab('Scheduled')}
                    {renderTab('Completed')}
                    {renderTab('Cancelled')}
                </ScrollView>
            </View>

            {/* Content List */}
            <ScrollView contentContainerStyle={styles.contentList}>
                {currentTrips.length > 0 ? (
                    currentTrips.map(renderTripCard)
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No {activeTab.toLowerCase()} rides found.</Text>
                    </View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#080C14',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#0F172A',
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    tabsWrapper: {
        backgroundColor: '#0F172A',
        paddingBottom: 12,
        paddingTop: 8,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        backgroundColor: '#1E293B',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginRight: 4,
    },
    tabActive: {
        backgroundColor: '#064E3B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    tabTextActive: {
        color: '#10B981',
        fontWeight: '700',
    },
    contentList: {
        padding: 20,
    },
    card: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    dateTag: {
        backgroundColor: '#064E3B',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#10B98133',
    },
    dateTagText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    priceText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    routeContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    timelineColumn: {
        alignItems: 'center',
        marginRight: 16,
        paddingTop: 6,
    },
    dotOrigin: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981',
    },
    line: {
        width: 2,
        height: 36,
        backgroundColor: '#1E293B',
        marginVertical: 4,
    },
    squareDest: {
        width: 12,
        height: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 2,
    },
    locationsColumn: {
        flex: 1,
    },
    locationItem: {
        height: 24,
        justifyContent: 'center',
    },
    locationText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
        paddingTop: 16,
    },
    statusLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#10B981',
        letterSpacing: 1,
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailsText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        marginRight: 6,
        letterSpacing: 0.5,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyStateText: {
        color: '#64748B',
        fontSize: 14,
    }
});

export default DriverProfileMyTripsScreen;

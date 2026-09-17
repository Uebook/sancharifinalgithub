import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faCar, faClock, faMapMarkerAlt, faUser, faChevronRight, faCircle } from '@fortawesome/free-solid-svg-icons';
import poolService from '../../Services/poolService';
import * as rideService from '../../Services/rideService';
import { useAuth } from '../Context/AuthContext';
import { Alert } from 'react-native';
import CancellationModal from './CancellationModal';

const { width } = Dimensions.get('window');

const TABS = ['Ongoing', 'Upcoming', 'Completed', 'Cancelled'] as const;
type TabType = typeof TABS[number];

const PassengerMyTripsScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('Completed');
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [selectedRideId, setSelectedRideId] = useState<string | null>(null);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Fetch both Carpool (Pool) and On-Demand (Ride) history
            const [poolRes, rideRes] = await Promise.all([
                poolService.getPassengerHistory(),
                rideService.getRideHistory()
            ]);

            let combinedRides: any[] = [];

            if (poolRes.success && poolRes.data) {
                // Mark pool rides for UI mapping
                combinedRides = [...combinedRides, ...poolRes.data.map((r: any) => ({ ...r, _type: 'POOL' }))];
            }

            if (rideRes.success && rideRes.data) {
                // Mark on-demand rides for UI mapping
                combinedRides = [...combinedRides, ...rideRes.data.map((r: any) => ({ ...r, _type: 'BOOKING' }))];
            }

            // Sort by createdAt or scheduledTime descending
            combinedRides.sort((a, b) => {
                const dateA = new Date(a.scheduledTime || a.createdAt).getTime();
                const dateB = new Date(b.scheduledTime || b.createdAt).getTime();
                return dateB - dateA;
            });

            setRides(combinedRides);
        } catch (error) {
            console.error("Error fetching combined history:", error);
            Alert.alert("Error", "Could not fetch your full ride history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const mapStatus = (status: string): TabType => {
        switch (status) {
            case 'scheduled': return 'Upcoming';
            case 'pending': return 'Upcoming';
            case 'accepted': return 'Upcoming';
            case 'arrived': return 'Upcoming';
            case 'ongoing': return 'Ongoing';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            default: return 'Completed';
        }
    };

    const filteredRides = rides.filter(ride => mapStatus(ride.status) === activeTab);

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return 'Today';
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderRideItem = ({ item }: { item: any }) => {
        const uiStatus = mapStatus(item.status);

        if (item._type === 'BOOKING') {
            const originName = item.pickup?.address || 'Pickup';
            const destName = item.dropoff?.address || 'Dropoff';
            const dateStr = item.createdAt;
            const total = (item.finalFare || 0).toFixed(2);
            const driverName = item.driver?.name || 'Driver';

            return (
                <TouchableOpacity style={styles.card} activeOpacity={0.9}>
                    <View style={styles.cardHeader}>
                        <View style={styles.dateContainer}>
                            <Text style={styles.dateText}>{formatDate(dateStr)}</Text>
                            <View style={styles.dot} />
                            <Text style={styles.timeText}>{formatTime(dateStr)}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(uiStatus).bg }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(uiStatus).text }]}>{uiStatus}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.routeContainer}>
                        <View style={styles.routeRow}>
                            <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
                            <Text style={styles.addressText} numberOfLines={1}>{originName}</Text>
                        </View>
                        <View style={styles.routeLine} />
                        <View style={styles.routeRow}>
                            <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
                            <Text style={styles.addressText} numberOfLines={1}>{destName}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.footerRow}>
                        <View style={styles.driverInfo}>
                            <FontAwesomeIcon icon={faCar} size={14} color="#6B7280" />
                            <Text style={styles.carText}>On-Demand</Text>
                            <Text style={[styles.carText, { color: '#9CA3AF' }]}> • {driverName}</Text>
                        </View>
                        <Text style={styles.priceText}>₹{total}</Text>
                    </View>
                </TouchableOpacity>
            );
        }

        // Default: POOL Ride Mapping
        const myBooking = item.passengers?.find((p: any) => p.user?._id === (user as any)?._id || p.user === (user as any)?._id);
        const mySeats = myBooking?.seatsBooked || 1;
        const myTotal = ((item.pricePerSeat || 15) * mySeats).toFixed(2);

        return (
            <TouchableOpacity style={styles.card} activeOpacity={0.9}>
                <View style={styles.cardHeader}>
                    <View style={styles.dateContainer}>
                        <Text style={styles.dateText}>{formatDate(item.scheduledTime)}</Text>
                        <View style={styles.dot} />
                        <Text style={styles.timeText}>{formatTime(item.scheduledTime)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(uiStatus).bg }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(uiStatus).text }]}>{uiStatus}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.routeContainer}>
                    <View style={styles.routeRow}>
                        <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.addressText} numberOfLines={1}>{item.origin.name}</Text>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.routeRow}>
                        <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
                        <Text style={styles.addressText} numberOfLines={1}>{item.destination.name}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.footerRow}>
                    <View style={styles.driverInfo}>
                        {item.host?.name && (
                            <>
                                <FontAwesomeIcon icon={faCar} size={14} color="#6B7280" />
                                <Text style={styles.carText}>{mySeats > 1 ? `${mySeats} Seats` : '1 Seat'}</Text>
                                <Text style={[styles.carText, { color: '#9CA3AF' }]}> • {item.host.name}</Text>
                            </>
                        )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.priceText}>₹{myTotal}</Text>
                        {myBooking?.paymentStatus === 'paid' && (
                            <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '700', marginTop: 2 }}>PAID</Text>
                        )}
                    </View>
                </View>



                {uiStatus === 'Upcoming' && (
                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => {
                            setSelectedRideId(item._id);
                            setCancelModalVisible(true);
                        }}
                    >
                        <Text style={styles.cancelButtonText}>Cancel Ride</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const handleConfirmCancel = async (reason: string) => {
        if (!selectedRideId) return;
        try {
            console.log("Cancelling pool booking:", selectedRideId, "Reason:", reason);
            setLoading(true);
            const res = await poolService.cancelBooking(selectedRideId, reason);
            if (res.success) {
                setCancelModalVisible(false);
                fetchHistory();
                Alert.alert("Success", "Your booking has been cancelled.");
            } else {
                console.warn("Cancel booking failed:", res.message);
                Alert.alert("Error", res.message || "Failed to cancel booking");
            }
        } catch (error: any) {
            console.error("Cancel booking error detailed:", error.response?.data || error.message);
            Alert.alert("Error", "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Ongoing': return { bg: '#ECFDF5', text: '#059669' };
            case 'Upcoming': return { bg: '#EFF6FF', text: '#2563EB' };
            case 'Completed': return { bg: '#F3F4F6', text: '#4B5563' };
            case 'Cancelled': return { bg: '#FEF2F2', text: '#DC2626' };
            default: return { bg: '#F3F4F6', text: '#4B5563' };
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faArrowLeft} size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Rides</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            <FlatList
                data={filteredRides}
                renderItem={renderRideItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesomeIcon icon={faCar} size={48} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No {activeTab.toLowerCase()} rides found</Text>
                    </View>
                }
            />

            <CancellationModal
                visible={cancelModalVisible}
                onClose={() => setCancelModalVisible(false)}
                onConfirm={handleConfirmCancel}
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
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tab: {
        marginRight: 24,
        paddingBottom: 8,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#10B981',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#10B981',
        fontWeight: '700',
    },
    listContent: {
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
        marginHorizontal: 8,
    },
    timeText: {
        fontSize: 14,
        color: '#6B7280',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    routeContainer: {
        marginLeft: 4,
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    routeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    routeLine: {
        width: 2,
        height: 16,
        backgroundColor: '#E5E7EB',
        marginLeft: 3,
        marginVertical: 2,
    },
    addressText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    carText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 6,
        fontWeight: '600',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#9CA3AF',
    },
    cancelButton: {
        marginTop: 16,
        backgroundColor: '#FEF2F2',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    cancelButtonText: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 14,
    },
    otpContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    otpLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#166534',
        letterSpacing: 0.5,
    },
    otpValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: 2,
    },
});

export default PassengerMyTripsScreen;

import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Alert, ActivityIndicator, Linking } from 'react-native';
import poolService from '../../Services/poolService';
import * as rideService from '../../Services/rideService';
import { faChevronLeft, faArrowRightLong, faUser, faPhone, faChevronDown, faChevronUp, faTimesCircle, faCar } from '@fortawesome/free-solid-svg-icons';
import CancellationModal from './CancellationModal';

type Tab = 'Upcoming' | 'Past';

const DriverMyTripsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const initialTab = (route.params as any)?.initialTab || 'Upcoming';
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const [poolRes, rideRes] = await Promise.all([
                poolService.getDriverHistory(),
                rideService.getRideHistory() // This endpoint now returns on-demand rides
            ]);

            let combined: any[] = [];

            if (poolRes.success && poolRes.data) {
                combined = [...combined, ...poolRes.data.map((t: any) => {
                    let catLabel = 'CITY POOL';
                    if (t.poolCategory) {
                        catLabel = t.poolCategory.replace(/_/g, ' ').toUpperCase();
                    } else if (t.type && t.type !== 'regular') {
                        catLabel = t.type.replace(/_/g, ' ').toUpperCase();
                    } else if (t.vehicleType === 'BIKE') {
                        catLabel = 'BIKE POOL';
                    }

                    return {
                        _type: 'POOL',
                        id: t._id,
                        poolCategoryLabel: catLabel,
                        isPlanned: Boolean(t.isPlanned || t.isCommute || (t.waypoints && t.waypoints.length > 0) || (t.type && t.type.toLowerCase().includes('commute'))),
                        date: new Date(t.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + new Date(t.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        rawDate: t.scheduledTime,
                        origin: t.origin?.name || 'Unknown',
                        destination: t.destination?.name || 'Unknown',
                        price: t.pricePerSeat ? `₹${t.pricePerSeat}` : '₹15',
                        bookedSeats: t.totalSeats - t.availableSeats,
                        totalSeats: t.totalSeats,
                        status: t.status,
                        type: t.type,
                        tabStatus: t.status === 'scheduled' || t.status === 'ongoing' ? 'Upcoming' : 'Past',
                        passengers: t.passengers?.map((p: any) => ({
                            id: p.user?._id || Math.random().toString(),
                            name: p.user?.name || 'Passenger',
                            phone: p.user?.phone || 'N/A',
                            seats: p.seatsBooked || 1,
                            initial: p.user?.name?.charAt(0) || 'P',
                            status: p.bookingStatus || 'confirmed',
                            paymentStatus: p.paymentStatus,
                            otp: p.otp,
                            reason: p.cancellationReason || '',
                            color: p.bookingStatus === 'cancelled' ? '#EF4444' : '#10B981'
                        })) || []
                    };
                })];
            }

            if (rideRes.success && rideRes.data) {
                combined = [...combined, ...rideRes.data.map((t: any) => ({
                    _type: 'BOOKING',
                    id: t._id,
                    poolCategoryLabel: 'ON-DEMAND RIDE',
                    date: new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    rawDate: t.createdAt,
                    origin: t.pickup?.address || 'Unknown',
                    destination: t.dropoff?.address || 'Unknown',
                    price: `₹${t.finalFare || 0}`,
                    bookedSeats: 1,
                    totalSeats: 1,
                    status: t.status,
                    tabStatus: (t.status === 'completed' || t.status === 'cancelled') ? 'Past' : 'Upcoming',
                    passengers: [{
                        id: t.passenger?._id,
                        name: t.passenger?.name || 'Passenger',
                        phone: t.passenger?.phone || 'N/A',
                        seats: 1,
                        initial: t.passenger?.name?.charAt(0) || 'P',
                        status: t.status === 'cancelled' ? 'cancelled' : 'confirmed',
                        color: t.status === 'cancelled' ? '#EF4444' : '#10B981'
                    }]
                }))];
            }

            // Sort by rawDate descending
            combined.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
            setTrips(combined);

        } catch (error) {
            console.error("Error fetching driver history:", error);
            Alert.alert("Error", "Could not fetch your trips");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchHistory();
    }, []);

    // Simple mapping: 'Upcoming' includes scheduled/ongoing trips. 'Past' includes completed/cancelled trips.
    const currentTrips = trips.filter(trip => activeTab === trip.tabStatus);

    const updateTripStatus = async (tripId: string, action: string, reason?: string) => {
        try {
            setLoading(true);
            const trip = trips.find(t => t.id === tripId);
            const isBooking = trip?._type === 'BOOKING';

            let response;
            if (isBooking) {
                // Mapping component actions ('completed', 'cancelled') to rideService status
                const statusMap: any = {
                    'completed': 'completed',
                    'cancelled': 'cancelled',
                    'ongoing': 'ongoing',
                    'arrived': 'arrived'
                };
                response = await rideService.updateRideStatus(tripId, statusMap[action] || action, reason);
            } else {
                response = await poolService.updateTripStatus(tripId, action, reason);
            }

            if (response.success) {
                // Refresh the list from backend to ensure consistent state
                await fetchHistory();
                Alert.alert("Success", `Trip has been marked as ${action}.`);
            } else {
                Alert.alert("Error", "Could not update trip status.");
            }
        } catch (error: any) {
            console.error("Error updating trip status", error);
            Alert.alert("Error", error.response?.data?.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmCancel = (reason: string) => {
        if (selectedTripId) {
            updateTripStatus(selectedTripId, 'cancelled', reason);
            setCancelModalVisible(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Trips</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'Upcoming' && styles.activeTab]}
                    onPress={() => setActiveTab('Upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'Upcoming' && styles.activeTabText]}>Upcoming</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'Past' && styles.activeTab]}
                    onPress={() => setActiveTab('Past')}
                >
                    <Text style={[styles.tabText, activeTab === 'Past' && styles.activeTabText]}>Past</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#2DD4BF" style={{ marginTop: 50 }} />
                ) : currentTrips.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 50, color: '#6B7280' }}>No {activeTab.toLowerCase()} trips found.</Text>
                ) : currentTrips.map((trip) => {
                    const isExpanded = expandedTripId === trip.id;
                    const occupancyRate = (trip.bookedSeats / trip.totalSeats) * 100;

                    return (
                        <View key={trip.id} style={styles.tripCard}>
                            {/* Header: Date & Price */}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => setExpandedTripId(isExpanded ? null : trip.id)}
                            >
                                <View style={styles.cardHeader}>
                                    <View>
                                        {/* Optional Planned Commute Badge */}
                                        {trip.isPlanned && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: '#10B981', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                                                    <Text style={{ color: '#10B981', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>
                                                        PLANNED COMMUTE
                                                    </Text>
                                                </View>
                                            </View>
                                        )}

                                        <Text style={styles.tripDateLabel}>SCHEDULED FOR</Text>
                                        <Text style={styles.tripDateValue}>{trip.date}</Text>
                                    </View>
                                    <View style={styles.priceContainer}>
                                        <Text style={styles.tripPrice}>{trip.price}</Text>
                                        <Text style={styles.perSeatText}>PER SEAT</Text>
                                    </View>
                                </View>

                                {/* Route */}
                                <View style={styles.routeRow}>
                                    <View style={styles.locationBlock}>
                                        <Text style={styles.locationText}>{trip.origin.split(',')[0]}</Text>
                                        <Text style={styles.regionText}>{trip.origin.split(',').slice(1).join(',') || 'Region'}</Text>
                                    </View>
                                    <View style={styles.arrowContainer}>
                                        <FontAwesomeIcon icon={faArrowRightLong} size={16} color="#10B981" />
                                    </View>
                                    <View style={styles.locationBlock}>
                                        <Text style={styles.locationText}>{trip.destination.split(',')[0]}</Text>
                                        <Text style={styles.regionText}>{trip.destination.split(',').slice(1).join(',') || 'Region'}</Text>
                                    </View>
                                </View>

                                {/* Progress / Occupancy */}
                                <View style={styles.occupancySection}>
                                    <View style={styles.occupancyLabelRow}>
                                        <Text style={styles.occupancyLabel}>Trip Occupancy</Text>
                                        <Text style={styles.occupancyValue}>{trip.bookedSeats} / {trip.totalSeats} Seats</Text>
                                    </View>
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, { width: `${occupancyRate}%` }]} />
                                    </View>
                                </View>

                                <View style={styles.toggleManifestRow}>
                                    <Text style={styles.toggleManifestText}>
                                        {isExpanded ? 'Hide Manifest' : 'View Passengers'}
                                    </Text>
                                    <FontAwesomeIcon
                                        icon={isExpanded ? faChevronUp : faChevronDown}
                                        size={12}
                                        color="#64748B"
                                    />
                                </View>
                            </TouchableOpacity>

                            {/* Expandable Manifest */}
                            {isExpanded && (
                                <View style={styles.manifestContainer}>
                                    <View style={styles.manifestHeader}>
                                        <Text style={styles.manifestTitle}>Passenger Manifest</Text>
                                    </View>
                                    {trip.passengers.length > 0 ? (
                                        trip.passengers.map((p: any) => (
                                            <View key={p.id} style={styles.passengerRow}>
                                                <View style={[styles.passengerAvatar, { backgroundColor: p.color }]}>
                                                    <Text style={styles.pAvatarText}>{p.initial}</Text>
                                                </View>
                                                <View style={styles.pInfo}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <Text style={styles.pName}>{p.name}</Text>
                                                        {p.status === 'cancelled' && (
                                                            <View style={styles.pCancelledBadge}>
                                                                <Text style={styles.pCancelledBadgeText}>CANCELLED</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text style={styles.pSeats}>{p.seats} Seat{p.seats > 1 ? 's' : ''}</Text>
                                                    {p.paymentStatus === 'paid' && (
                                                        <Text style={{ fontSize: 9, color: '#10B981', fontWeight: '800' }}>PAID</Text>
                                                    )}

                                                    {p.status === 'cancelled' && p.reason && (
                                                        <Text style={styles.pReasonText}>Reason: {p.reason}</Text>
                                                    )}
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.pCallButton}
                                                    onPress={() => Linking.openURL(`tel:${p.phone}`)}
                                                >
                                                    <FontAwesomeIcon icon={faPhone} size={14} color="#10B981" />
                                                </TouchableOpacity>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.noPassengersText}>No seats booked yet.</Text>
                                    )}
                                </View>
                            )}

                            {/* Actions */}
                            <View style={styles.actionRow}>
                                {activeTab === 'Upcoming' && (
                                    <>
                                        <TouchableOpacity 
                                            style={styles.cancelButton} 
                                            onPress={() => {
                                                setSelectedTripId(trip.id);
                                                setCancelModalVisible(true);
                                            }}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancel Trip</Text>
                                        </TouchableOpacity>
                                        
                                        {(() => {
                                            const isFuture = new Date(trip.rawDate) > new Date();
                                            return (
                                                <TouchableOpacity 
                                                    style={[styles.startTripButton, isFuture && { backgroundColor: '#94A3B8', opacity: 0.7 }]} 
                                                    onPress={() => {
                                                        if (isFuture) {
                                                            Alert.alert("Wait", "You can only mark this trip as completed after the scheduled time.");
                                                        } else {
                                                            updateTripStatus(trip.id, 'completed');
                                                        }
                                                    }}
                                                >
                                                    <Text style={styles.startTripText}>
                                                        {isFuture ? 'Wait for time' : 'Complete Trip'}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })()}
                                    </>
                                )}
                                {activeTab === 'Past' && (
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        {trip.status === 'cancelled' && (
                                            <View style={styles.cancelledBadge}>
                                                <Text style={styles.cancelledBadgeText}>CANCELLED</Text>
                                            </View>
                                        )}
                                        {/* <TouchableOpacity style={[styles.viewDetailsButton, trip.status === 'cancelled' && { flex: 0, paddingHorizontal: 20 }]}>
                                            <Text style={styles.viewDetailsText}>View Trip Summary</Text>
                                        </TouchableOpacity> */}
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

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
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    tabContainer: {
        flexDirection: 'row',
        margin: 20,
        borderRadius: 12,
        padding: 4,
        backgroundColor: '#FFFFFF',
        marginBottom: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#F3F4F6', // Basic grey highlight for active tab in Simple view
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#111827',
        fontWeight: '700',
    },
    content: {
        padding: 20,
        paddingTop: 10,
    },
    tripCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    tripDate: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginTop: 4,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    tripPrice: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    perSeatText: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    locationText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    arrowContainer: {
        marginHorizontal: 12,
    },
    seatInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
    },
    passengerAvatars: {
        flexDirection: 'row',
        paddingLeft: 4,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#111827',
        opacity: 0.7,
    },
    seatStatusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#FEF2F2',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginRight: 10,
    },
    cancelButtonText: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 14,
    },
    viewDetailsButton: {
        flex: 1,
        backgroundColor: '#0F172A',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginLeft: 10,
    },
    viewDetailsText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    tripDateLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    tripDateValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 2,
    },
    locationBlock: {
        flex: 1,
    },
    regionText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    occupancySection: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    occupancyLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    occupancyLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    occupancyValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1E293B',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 3,
    },
    toggleManifestRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        marginBottom: 4,
    },
    toggleManifestText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        marginRight: 6,
    },
    manifestContainer: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    manifestHeader: {
        marginBottom: 12,
    },
    manifestTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
    },
    passengerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderRadius: 10,
        marginBottom: 8,
    },
    passengerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pAvatarText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
    },
    pInfo: {
        flex: 1,
        marginLeft: 12,
    },
    pName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    pSeats: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 1,
    },
    pCallButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    noPassengersText: {
        textAlign: 'center',
        fontSize: 13,
        color: '#94A3B8',
        fontStyle: 'italic',
        paddingVertical: 10,
    },
    startTripButton: {
        flex: 1,
        backgroundColor: '#1E293B',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginLeft: 10,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    startTripText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
    },
    cancelledBadge: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    cancelledBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#EF4444',
    },
    pCancelledBadge: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    pCancelledBadgeText: {
        fontSize: 8,
        fontWeight: '800',
        color: '#EF4444',
    },
    pReasonText: {
        fontSize: 11,
        color: '#EF4444',
        marginTop: 2,
        fontStyle: 'italic',
    },
    pOtpBadge: {
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    pOtpLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#64748B',
    },
    pOtpValue: {
        fontSize: 12,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: 1,
    }
});

export default DriverMyTripsScreen;

import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronLeft,
    faCalendarDays,
    faWallet,
    faArrowUpRightFromSquare,
    faCar,
    faClock,
    faReceipt
} from '@fortawesome/free-solid-svg-icons';
import CalendarModal from '../Common/CalendarModal';
import { getDriverEarnings } from '../../Services/rideService';
import poolService from '../../Services/poolService';
import { useAuth } from '../Context/AuthContext';
import { requestWithdrawal } from '../../Services/walletService';

type Period = 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

const DriverEarningsScreen = () => {
    const navigation = useNavigation<any>();
    const { user, refetchUser } = useAuth();
    const [activeTab, setActiveTab] = useState<Period>('TODAY');
    const [startDate, setStartDate] = useState('04-Feb-2026');
    const [endDate, setEndDate] = useState('02-Mar-2026');
    const [isCustomFetched, setIsCustomFetched] = useState(false);

    // Calendar Modal State
    const [showStartCalendar, setShowStartCalendar] = useState(false);
    const [showEndCalendar, setShowEndCalendar] = useState(false);

    // Real data fetching state
    const [earningsData, setEarningsData] = useState<{
        [key in Period]: { total: string; todayRides: number; totalRides: number; trips: any[] }
    }>({
        TODAY: { total: "₹0.00", todayRides: 0, totalRides: 0, trips: [] },
        WEEK: { total: "₹0.00", todayRides: 0, totalRides: 0, trips: [] },
        MONTH: { total: "₹0.00", todayRides: 0, totalRides: 0, trips: [] },
        CUSTOM: { total: "₹0.00", todayRides: 0, totalRides: 0, trips: [] }
    });
    const [loading, setLoading] = useState(true);

    const fetchEarnings = async () => {
        try {
            setLoading(true);
            const [earnRes, historyRes] = await Promise.all([
                getDriverEarnings(),
                poolService.getDriverHistory()
            ]);

            let mappedTrips: any[] = [];
            if (historyRes?.success && Array.isArray(historyRes?.data)) {
                mappedTrips = historyRes.data.map((ride: any) => ({
                    id: ride._id,
                    location: `${ride.origin?.name || 'Origin'} → ${ride.destination?.name || 'Destination'}`,
                    time: new Date(ride.scheduledTime || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    amount: `+₹${(ride.passengers?.length || 1) * (ride.pricePerSeat || ride.finalFare || 150)}`,
                    details: `${ride.vehicleType || 'Vehicle'} · ${ride.status?.toUpperCase()}`
                }));
            }

            if (earnRes?.success && earnRes?.data) {
                const { today, week, month, total, todayRides, totalRides } = earnRes.data;
                setEarningsData({
                    TODAY: {
                        total: `₹${parseFloat(today || 0).toFixed(2)}`,
                        todayRides: todayRides || 0,
                        totalRides: totalRides || 0,
                        trips: mappedTrips
                    },
                    WEEK: {
                        total: `₹${parseFloat(week || 0).toFixed(2)}`,
                        todayRides: todayRides || 0,
                        totalRides: totalRides || 0,
                        trips: mappedTrips
                    },
                    MONTH: {
                        total: `₹${parseFloat(month || 0).toFixed(2)}`,
                        todayRides: todayRides || 0,
                        totalRides: totalRides || 0,
                        trips: mappedTrips
                    },
                    CUSTOM: {
                        total: `₹${parseFloat(total || 0).toFixed(2)}`,
                        todayRides: todayRides || 0,
                        totalRides: totalRides || 0,
                        trips: mappedTrips
                    }
                });
            }
        } catch (error) {
            console.error('Failed to fetch driver earnings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEarnings();
    }, []);

    const handleWithdraw = () => {
        const balance = user?.walletBalance || 0;
        const netAmount = balance * 0.98;

        if (netAmount < 100) {
            Alert.alert(
                'Minimum Balance Required',
                'You need a minimum withdrawable balance of ₹100. Navigate to Wallet to check details.',
                [
                    { text: 'Go to Wallet', onPress: () => navigation.navigate('Wallet', { mode: 'driver' }) },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
            return;
        }

        const isBankComplete = user?.driverDetails?.bankDetails?.accountNumber && user?.driverDetails?.bankDetails?.ifscCode && user?.driverDetails?.bankDetails?.bankName && user?.driverDetails?.bankDetails?.accountHolderName;

        if (!isBankComplete) {
            Alert.alert(
                'Bank Details Missing',
                'Please link your bank account details before initiating a payout.',
                [
                    { text: 'Add Bank Details', onPress: () => navigation.navigate('DriverBankDetails') },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
            return;
        }

        const maskedAcc = `****${user.driverDetails.bankDetails.accountNumber.slice(-4)}`;

        Alert.alert(
            'Confirm Withdrawal Request',
            `Initiate payout of ₹${netAmount.toFixed(2)} to ${user.driverDetails.bankDetails.bankName} (${maskedAcc})?\n(2% platform fee applicable)`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm & Send',
                    onPress: async () => {
                        try {
                            const res = await requestWithdrawal(netAmount, 'bank');
                            if (res.success) {
                                Alert.alert(
                                    'Request Submitted',
                                    'Your withdrawal request has been sent to admin for approval.',
                                    [
                                        {
                                            text: 'View Wallet Status',
                                            onPress: () => navigation.navigate('Wallet', { mode: 'driver' })
                                        }
                                    ]
                                );
                                refetchUser();
                                fetchEarnings();
                            } else {
                                Alert.alert('Request Failed', res.message || 'Could not submit withdrawal request');
                            }
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to connect');
                        }
                    }
                }
            ]
        );
    };

    const currentData = earningsData[activeTab];

    return (
        <SafeAreaView style={styles.container}>
            {/* Dark Premium Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={18} color="#F8FAFC" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Driver Earnings</Text>
                <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw} activeOpacity={0.8}>
                    <FontAwesomeIcon icon={faWallet} size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.withdrawText}>Withdraw</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Main Earnings Summary Card */}
                <View style={styles.card}>
                    {/* Period Tabs */}
                    <View style={styles.tabContainer}>
                        {(['TODAY', 'WEEK', 'MONTH', 'CUSTOM'] as Period[]).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Custom Range Filter */}
                    {activeTab === 'CUSTOM' && (
                        <View style={styles.customDateContainer}>
                            <View style={styles.dateRow}>
                                <TouchableOpacity style={styles.dateInputWrapper} onPress={() => setShowStartCalendar(true)}>
                                    <Text style={styles.dateLabel}>START DATE</Text>
                                    <View style={styles.dateInput}>
                                        <Text style={styles.dateText}>{startDate}</Text>
                                        <FontAwesomeIcon icon={faCalendarDays} size={14} color="#10B981" />
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.dateInputWrapper} onPress={() => setShowEndCalendar(true)}>
                                    <Text style={styles.dateLabel}>END DATE</Text>
                                    <View style={styles.dateInput}>
                                        <Text style={styles.dateText}>{endDate}</Text>
                                        <FontAwesomeIcon icon={faCalendarDays} size={14} color="#10B981" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity style={styles.fetchButton} onPress={() => setIsCustomFetched(true)} activeOpacity={0.85}>
                                <Text style={styles.fetchButtonText}>Fetch Date Range Earnings</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Big Amount Display */}
                    <View style={styles.amountContainer}>
                        <Text style={styles.amountText}>{currentData.total}</Text>
                        <Text style={styles.amountLabel}>
                            {activeTab === 'CUSTOM' && isCustomFetched ? 'CUSTOM RANGE EARNINGS' : `${activeTab} TOTAL EARNINGS`}
                        </Text>
                    </View>

                    {/* Quick Stats Grid */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <FontAwesomeIcon icon={faCar} size={16} color="#10B981" style={{ marginBottom: 6 }} />
                            <Text style={styles.statNumber}>{currentData.todayRides}</Text>
                            <Text style={styles.statLabel}>Today Trips</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <FontAwesomeIcon icon={faReceipt} size={16} color="#6366F1" style={{ marginBottom: 6 }} />
                            <Text style={styles.statNumber}>{currentData.totalRides}</Text>
                            <Text style={styles.statLabel}>Total Completed</Text>
                        </View>
                    </View>
                </View>

                {/* Section Header */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Trip Earnings History</Text>
                    <TouchableOpacity onPress={fetchEarnings}>
                        <Text style={styles.refreshText}>Refresh</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="large" color="#10B981" />
                        <Text style={styles.emptyText}>Fetching dynamic earnings...</Text>
                    </View>
                ) : currentData.trips.length > 0 ? (
                    currentData.trips.map((trip) => (
                        <View key={trip.id} style={styles.tripCard}>
                            <View style={styles.tripLeft}>
                                <Text style={styles.tripLocation} numberOfLines={1}>{trip.location}</Text>
                                <View style={styles.timeRow}>
                                    <FontAwesomeIcon icon={faClock} size={12} color="#94A3B8" style={{ marginRight: 6 }} />
                                    <Text style={styles.tripTime}>{trip.time}</Text>
                                </View>
                            </View>
                            <View style={styles.tripRight}>
                                <Text style={styles.tripAmount}>{trip.amount}</Text>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{trip.details}</Text>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <FontAwesomeIcon icon={faReceipt} size={32} color="#475569" style={{ marginBottom: 12 }} />
                        <Text style={styles.emptyText}>No completed trips found for this period.</Text>
                    </View>
                )}

            </ScrollView>

            {/* Modals */}
            <CalendarModal
                visible={showStartCalendar}
                onClose={() => setShowStartCalendar(false)}
                onSelectDate={setStartDate}
                selectedDate={startDate}
            />
            <CalendarModal
                visible={showEndCalendar}
                onClose={() => setShowEndCalendar(false)}
                onSelectDate={setEndDate}
                selectedDate={endDate}
            />

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A', // Dark Slate 900
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#1E293B',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#F8FAFC',
    },
    withdrawButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981', // Emerald
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 12,
    },
    withdrawText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: '#1E293B', // Slate 800
        borderRadius: 24,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#334155',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#10B981',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    amountContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    amountText: {
        fontSize: 44,
        fontWeight: '900',
        color: '#10B981',
        marginBottom: 6,
    },
    amountLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1.2,
    },
    statsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#334155',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '800',
        color: '#F8FAFC',
    },
    statLabel: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
        marginTop: 2,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#F8FAFC',
    },
    refreshText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#10B981',
    },
    tripCard: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    tripLeft: {
        flex: 1,
        marginRight: 12,
    },
    tripLocation: {
        fontSize: 15,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 6,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tripTime: {
        fontSize: 12,
        color: '#94A3B8',
    },
    tripRight: {
        alignItems: 'flex-end',
    },
    tripAmount: {
        fontSize: 17,
        fontWeight: '800',
        color: '#10B981',
        marginBottom: 4,
    },
    badge: {
        backgroundColor: '#0F172A',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 14,
        marginTop: 8,
    },
    customDateContainer: {
        marginTop: 16,
        backgroundColor: '#0F172A',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dateInputWrapper: {
        flex: 1,
        marginHorizontal: 4,
    },
    dateLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    dateInput: {
        backgroundColor: '#1E293B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    dateText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#F8FAFC',
    },
    fetchButton: {
        backgroundColor: '#10B981',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    fetchButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
    },
});

export default DriverEarningsScreen;

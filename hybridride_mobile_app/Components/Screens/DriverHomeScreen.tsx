import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import DriverBottomNavBar from '../Navigation/DriverBottomNavBar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronRight,
    faCalendarDays,
    faFolderOpen,
    faStar,
    faCheckCircle,
    faShield,
    faFlag,
    faChartLine,
    faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../Context/AuthContext';
import { driverService } from '../../Services/driverService';
import { getActiveRide } from '../../Services/rideService';
import { getImageUrl } from '../../Services/apiClient';
import SosModal from '../Common/SosModal';

const DriverHomeScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user, logout, refetchUser } = useAuth();
    const [isOnline, setIsOnline] = useState(user?.driverDetails?.isOnline || false);
    const [isLoadingToggle, setIsLoadingToggle] = useState(false);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [demandData, setDemandData] = useState<any>(null);

    // Auto-resume active ride logic (Driver side) & fetch telemetry data
    useFocusEffect(
        useCallback(() => {
            const checkActive = async () => {
                if ((route.params as any)?.manualReturn) {
                    return;
                }

                try {
                    const result = await getActiveRide();
                    if (result.success && result.data) {
                        const ride = result.data;
                        const status = ride.status;

                        if (ride.driver && ride.driver._id === user?._id) {
                            if (status === 'accepted' || status === 'arrived' || status === 'ongoing') {
                                (navigation as any).navigate('DriverRideNavigation', {
                                    bookingId: ride._id,
                                    passenger: ride.passenger,
                                    pickup: ride.pickup?.address,
                                    dropoff: ride.dropoff?.address,
                                    fare: ride.finalFare || ride.offeredFare,
                                    initialViewState: status === 'ongoing' ? 'DROP_OFF' : 'PICKUP'
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error('Failed to check active ride (driver):', error);
                }
            };

            const fetchTelemetryData = async () => {
                try {
                    const [dashRes, demandRes] = await Promise.all([
                        driverService.getDashboardSummary(),
                        driverService.getDemandHotspots()
                    ]);
                    if (dashRes?.success && dashRes?.data) {
                        setDashboardData(dashRes.data);
                    }
                    if (demandRes?.success && demandRes?.data) {
                        setDemandData(demandRes.data);
                    }
                } catch (err) {
                    console.error('Error loading driver telemetry:', err);
                }
            };

            checkActive();
            fetchTelemetryData();
        }, [navigation, user])
    );

    // Sync local state with user state
    React.useEffect(() => {
        if (user?.driverDetails) {
            setIsOnline(user.driverDetails.isOnline || false);
        }
    }, [user]);

    const [sosVisible, setSosVisible] = useState(false);

    const handleToggleStatus = async () => {
        if (isLoadingToggle) return;
        setIsLoadingToggle(true);
        try {
            await driverService.toggleStatus();
            await refetchUser();
        } catch (error) {
            console.error('Failed to toggle status:', error);
        } finally {
            setIsLoadingToggle(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Top Profile Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.profileSection}
                            onPress={() => navigation.navigate('DriverProfile' as never)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.avatarRing}>
                                <View style={styles.avatarInner}>
                                    {user?.profileImage ? (
                                        <Image
                                            source={{ uri: getImageUrl(user.profileImage) || undefined }}
                                            style={styles.avatarImage}
                                        />
                                    ) : (
                                        <Text style={styles.avatarText}>
                                            {getInitials(user?.name || 'Srishylam Jadi')}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.driverMeta}>
                                <Text style={styles.greetingText}>Good morning</Text>
                                <Text style={styles.driverName}>{user?.name || 'Srishylam Jadi'}</Text>

                                <View style={styles.badgesRow}>
                                    <FontAwesomeIcon icon={faStar} size={12} color="#F59E0B" />
                                    <Text style={styles.ratingText}>
                                        {user?.driverDetails?.ratings?.average || '5.0'}
                                    </Text>
                                    <Text style={styles.metaDot}>·</Text>
                                    <Text style={styles.tripsText}>
                                        {user?.driverDetails?.ratings?.count ? `${user.driverDetails.ratings.count} trips` : '47 trips'}
                                    </Text>
                                    <Text style={styles.metaDot}>·</Text>
                                    <View style={styles.verifiedBadge}>
                                        <FontAwesomeIcon icon={faCheckCircle} size={10} color="#10B981" />
                                        <Text style={styles.verifiedText}>Verified</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Top Right Action Buttons */}
                        <View style={styles.topRightActions}>
                            <TouchableOpacity style={styles.shieldBtn} onPress={() => setSosVisible(true)}>
                                <FontAwesomeIcon icon={faShield} size={14} color="#EF4444" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.statusTogglePill, isOnline && styles.statusTogglePillOnline]}
                                onPress={handleToggleStatus}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#9CA3AF' }]} />
                                <Text style={styles.statusPillText}>{isOnline ? 'On' : 'Off'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Today's Earnings Banner */}
                    <TouchableOpacity
                        style={styles.earningsCard}
                        onPress={() => navigation.navigate('DriverEarnings' as never)}
                        activeOpacity={0.9}
                    >
                        <View style={styles.earningsTopRow}>
                            <View>
                                <Text style={styles.earningsCategoryText}>TODAY'S EARNINGS</Text>
                                <Text style={styles.earningsAmount}>₹{dashboardData?.todayEarnings ?? 0}</Text>
                                <Text style={styles.earningsSubText}>
                                    {dashboardData?.todayRidesCount ?? 0} rides · {dashboardData?.timeOnlineHours ?? 0}h online
                                </Text>
                            </View>

                            <View style={styles.earningsGraphSide}>
                                {/* Sparkline graph graphic */}
                                <View style={styles.graphContainer}>
                                    <FontAwesomeIcon icon={faChartLine} size={34} color="#10B981" />
                                </View>
                                <View style={styles.peakHoursRow}>
                                    <FontAwesomeIcon icon={faChevronRight} size={10} color="#64748B" />
                                    <Text style={styles.peakText}>peak hours live</Text>
                                </View>
                            </View>
                        </View>

                        {/* Daily Target Progress Bar */}
                        <View style={styles.targetSection}>
                            <View style={styles.targetLabelRow}>
                                <View style={styles.targetLeft}>
                                    <FontAwesomeIcon icon={faFlag} size={12} color="#10B981" style={{ marginRight: 6 }} />
                                    <Text style={styles.targetTitle}>Daily target</Text>
                                    <Text style={styles.targetValue}>₹{dashboardData?.dailyTargetGoal ?? 1000}</Text>
                                </View>
                                <Text style={styles.targetPercentText}>{dashboardData?.dailyTargetPercent ?? 0}% completed</Text>
                            </View>

                            <View style={styles.progressBarTrack}>
                                <View style={[styles.progressBarFill, { width: `${dashboardData?.dailyTargetPercent ?? 0}%` as any }]} />
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* 3 Grid Action Cards Row */}
                    <View style={styles.actionGrid}>
                        {/* Publish Trip */}
                        <TouchableOpacity
                            style={styles.gridCard}
                            onPress={() => navigation.navigate('DriverPublishTripMode' as never)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.gridIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                                <FontAwesomeIcon icon={faCalendarDays} size={20} color="#F87171" />
                            </View>
                            <Text style={styles.gridCardTitle}>Publish Trip</Text>
                            <Text style={styles.gridCardSub}>LOCAL / LONG</Text>
                        </TouchableOpacity>

                        {/* My Trips */}
                        <TouchableOpacity
                            style={styles.gridCard}
                            onPress={() => navigation.navigate('DriverMyTrips' as never)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.gridIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                                <FontAwesomeIcon icon={faFolderOpen} size={20} color="#F59E0B" />
                            </View>
                            <Text style={styles.gridCardTitle}>My Trips</Text>
                            <Text style={styles.gridCardSub}>MANAGE</Text>
                        </TouchableOpacity>

                        {/* Bonuses */}
                        <TouchableOpacity
                            style={styles.gridCard}
                            onPress={() => navigation.navigate('DriverEarnings' as never)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.badgeWrapper}>
                                <View style={[styles.gridIconBox, { backgroundColor: 'rgba(129, 140, 248, 0.12)' }]}>
                                    <FontAwesomeIcon icon={faStar} size={20} color="#818CF8" />
                                </View>
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.badgeCountText}>{dashboardData?.activeBonusesCount ?? 0}</Text>
                                </View>
                            </View>
                            <Text style={styles.gridCardTitle}>Bonuses</Text>
                            <Text style={styles.gridCardSub}>{dashboardData?.activeBonusesCount ?? 0} ACTIVE</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Live Demand Card */}
                    <View style={styles.demandCard}>
                        <View style={styles.demandTopRow}>
                            <View style={styles.pulseBox}>
                                <FontAwesomeIcon icon={faBolt} size={16} color="#10B981" />
                            </View>
                            <View style={styles.demandTextContainer}>
                                <Text style={styles.demandTitle}>
                                    Demand near you is <Text style={{ color: '#10B981' }}>{(demandData?.liveSearchingRiders ?? 0) > 5 ? 'High' : 'Active'}</Text>
                                </Text>
                                <Text style={styles.demandSub}>
                                    {demandData?.liveSearchingRiders ?? 3} riders searching · {demandData?.rateEstimate ?? '~₹450/hr'} right now
                                </Text>
                            </View>
                            <View style={styles.liveTag}>
                                <View style={[styles.statusDot, { backgroundColor: '#10B981', marginRight: 4 }]} />
                                <Text style={styles.liveTagText}>LIVE</Text>
                            </View>
                        </View>

                        {/* Location Hotspots */}
                        <View style={styles.hotspotsRow}>
                            {(demandData?.hotspots || [
                                { name: 'Kothapet', count: 12 },
                                { name: 'LB Nagar', count: 8 },
                                { name: 'Dilsukh', count: 5 }
                            ]).slice(0, 3).map((item: any, idx: number) => (
                                <View key={idx} style={styles.hotspotItem}>
                                    <View style={[styles.dot, { backgroundColor: '#F97316' }]} />
                                    <Text style={styles.hotspotText}>{item.name}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Performance Quick Stats */}
                    <View style={styles.quickStatsRow}>
                        <View style={styles.quickStatCol}>
                            <Text style={styles.quickStatLabel}>ACCEPTANCE</Text>
                            <Text style={styles.quickStatValue}>
                                {dashboardData?.acceptanceRatePercent ?? 95} <Text style={styles.percentSymbol}>%</Text>
                            </Text>
                        </View>
                        <View style={styles.quickStatDivider} />
                        <View style={styles.quickStatCol}>
                            <Text style={styles.quickStatLabel}>CANCEL RATE</Text>
                            <Text style={[styles.quickStatValue, { color: '#10B981' }]}>
                                {dashboardData?.cancellationRatePercent ?? 2}<Text style={styles.percentSymbol}>%</Text>
                            </Text>
                        </View>
                        <View style={styles.quickStatDivider} />
                        <View style={styles.quickStatCol}>
                            <Text style={styles.quickStatLabel}>THIS WEEK</Text>
                            <Text style={styles.quickStatValue}>₹{dashboardData?.weeklyEarnings ?? 0}</Text>
                        </View>
                    </View>

                    {/* Neon GO Drive Toggle Button Section */}
                    <View style={styles.goSection}>
                        <TouchableOpacity
                            style={styles.goOuterCircle}
                            onPress={() => navigation.navigate('DriverOnline' as never)}
                            activeOpacity={0.85}
                        >
                            <View style={styles.goMiddleCircle}>
                                <View style={styles.goInnerCircle}>
                                    <Text style={styles.goText}>GO</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <Text style={styles.readyTitle}>
                            {isOnline ? 'You are online' : 'Ready to drive?'}
                        </Text>
                        <Text style={styles.readySub}>
                            {isOnline
                                ? 'Waiting for ride requests...'
                                : 'Go online to start receiving ride requests'}
                        </Text>
                    </View>

                </ScrollView>
            </SafeAreaView>

            {/* Bottom Navigation */}
            <DriverBottomNavBar activeTab="RIDES" />

            {/* Emergency SOS Modal */}
            <SosModal visible={sosVisible} onClose={() => setSosVisible(false)} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#080C14',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 90,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
        marginTop: 6,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarRing: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2,
        borderColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarInner: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    avatarText: {
        color: '#94A3B8',
        fontSize: 16,
        fontWeight: '700',
    },
    driverMeta: {
        flex: 1,
    },
    greetingText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    driverName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 1,
        marginBottom: 3,
    },
    badgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        marginLeft: 4,
    },
    metaDot: {
        fontSize: 12,
        color: '#475569',
        marginHorizontal: 5,
    },
    tripsText: {
        fontSize: 12,
        color: '#94A3B8',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    verifiedText: {
        fontSize: 11,
        color: '#10B981',
        fontWeight: '600',
        marginLeft: 3,
    },
    topRightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shieldBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#1E293B',
        marginRight: 8,
    },
    statusTogglePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#334155',
    },
    statusTogglePillOnline: {
        backgroundColor: '#064E3B',
        borderColor: '#10B981',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusPillText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    earningsCard: {
        backgroundColor: '#0A1412',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#153E35',
    },
    earningsTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    earningsCategoryText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#10B981',
        letterSpacing: 1,
        marginBottom: 4,
    },
    earningsAmount: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    earningsSubText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    earningsGraphSide: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    graphContainer: {
        marginTop: 4,
    },
    peakHoursRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    peakText: {
        fontSize: 11,
        color: '#64748B',
        marginLeft: 4,
    },
    targetSection: {
        borderTopWidth: 1,
        borderTopColor: '#132B25',
        paddingTop: 14,
    },
    targetLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    targetLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    targetTitle: {
        fontSize: 12,
        color: '#94A3B8',
        marginRight: 6,
    },
    targetValue: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    targetPercentText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10B981',
    },
    progressBarTrack: {
        height: 6,
        backgroundColor: '#162E27',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: 6,
        backgroundColor: '#10B981',
        borderRadius: 3,
    },
    actionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    gridCard: {
        flex: 1,
        backgroundColor: '#0F172A',
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    badgeWrapper: {
        position: 'relative',
    },
    gridIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    notificationBadge: {
        position: 'absolute',
        top: -2,
        right: -4,
        backgroundColor: '#EF4444',
        borderRadius: 9,
        width: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#0F172A',
    },
    badgeCountText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
    },
    gridCardTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    gridCardSub: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    demandCard: {
        backgroundColor: '#091512',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#13362E',
    },
    demandTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    pulseBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#0B2922',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    demandTextContainer: {
        flex: 1,
    },
    demandTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    demandSub: {
        fontSize: 11,
        color: '#64748B',
    },
    liveTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#08251E',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    liveTagText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#10B981',
        letterSpacing: 0.5,
    },
    hotspotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#102B24',
    },
    hotspotItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    hotspotText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
    },
    quickStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0F172A',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    quickStatCol: {
        flex: 1,
        alignItems: 'center',
    },
    quickStatLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    quickStatValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    percentSymbol: {
        fontSize: 12,
        fontWeight: '700',
    },
    quickStatDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#1E293B',
    },
    goSection: {
        alignItems: 'center',
        marginVertical: 10,
    },
    goOuterCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        marginBottom: 16,
    },
    goMiddleCircle: {
        width: 132,
        height: 132,
        borderRadius: 66,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    goInnerCircle: {
        width: 104,
        height: 104,
        borderRadius: 52,
        backgroundColor: '#080C14',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#10B981',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 8,
    },
    goText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    readyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    readySub: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
    },
});

export default DriverHomeScreen;

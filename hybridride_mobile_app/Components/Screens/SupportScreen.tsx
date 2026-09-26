import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Dimensions,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faMagnifyingGlass,
    faCar,
    faTriangleExclamation,
    faCommentDots,
    faChevronRight,
    faFileInvoice,
    faShieldHalved,
    faCircleQuestion,
    faMessage
} from '@fortawesome/free-solid-svg-icons';
import BottomNavBar from '../Navigation/BottomNavBar';
import DriverBottomNavBar from '../Navigation/DriverBottomNavBar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../Context/AuthContext';
import poolService, { PoolRide } from '../../Services/poolService';
import { CONFIG } from '../../Constants/Config';

const { width } = Dimensions.get('window');

const SupportScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();
    const isDriver = (route.params as any)?.mode === 'driver' || user?.role === 'driver';

    const [recentTrips, setRecentTrips] = React.useState<PoolRide[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchHistory = async () => {
            try {
                setIsLoading(true);
                const res = isDriver
                    ? await poolService.getDriverHistory()
                    : await poolService.getPassengerHistory();

                if (res.success && res.data) {
                    const sorted = res.data.sort((a: PoolRide, b: PoolRide) =>
                        new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()
                    );
                    setRecentTrips(sorted.slice(0, 2));
                }
            } catch (error) {
                console.error('Failed to fetch support history:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [isDriver]);

    const formatSupportDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
        const day = date.getDate();
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${month} ${day}, ${hours}:${minutes} ${ampm}`;
    };

    const handleSOS = () => {
        Linking.openURL(`tel:${CONFIG.CALL_CENTER_PHONE}`);
    };

    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Spacer for Fixed Header */}
                    <View style={{ height: 110 }} />

                    {/* SOS Button */}
                    <View style={styles.sosButtonContainer}>
                        <TouchableOpacity style={styles.sosButton} activeOpacity={0.8} onPress={handleSOS}>
                            <View style={styles.sosIconCircle}>
                                <FontAwesomeIcon icon={faTriangleExclamation} size={28} color="#FFFFFF" />
                            </View>
                            <View style={styles.sosTextContainer}>
                                <Text style={styles.sosTitle}>SOS Emergency</Text>
                                <Text style={styles.sosSubtitle}>24/7 Priority Safety Assistance</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Recent Trips Help */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionHeader, isDriver && styles.darkSubtext]}>RECENT RIDES HELP</Text>
                        {recentTrips.length > 0 && (
                            <TouchableOpacity onPress={() => (navigation as any).navigate(isDriver ? 'DriverMyTrips' : 'PassengerMyTrips')}>
                                <Text style={styles.viewAllText}>VIEW ALL</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {isLoading ? (
                        <View style={[styles.tripCard, isDriver && styles.darkCard]}>
                            <Text style={[styles.tripRoute, isDriver && styles.darkText]}>Loading recent rides...</Text>
                        </View>
                    ) : recentTrips.length === 0 ? (
                        <View style={[styles.tripCard, isDriver && styles.darkCard]}>
                            <Text style={[styles.tripRoute, { fontSize: 14, marginBottom: 4 }, isDriver && styles.darkText]}>No recent rides found</Text>
                            <Text style={[styles.tripDate, isDriver && styles.darkSubtext]}>Your completed rides will appear here for easy help requests.</Text>
                        </View>
                    ) : (
                        recentTrips.map((trip) => (
                            <View key={trip._id} style={[styles.tripCard, isDriver && styles.darkCard]}>
                                <View style={styles.tripHeader}>
                                    <Text style={[styles.tripDate, isDriver && styles.darkSubtext]}>{formatSupportDate(trip.scheduledTime)}</Text>
                                    <View style={[styles.tripStatusBadge, isDriver && { backgroundColor: '#1E293B' }]}>
                                        <Text style={[styles.tripStatusText, isDriver && { color: '#94A3B8' }]}>{trip.status.toUpperCase()}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.tripRoute, isDriver && styles.darkText]} numberOfLines={1}>
                                    {trip.origin.name.split(',')[0]} → {trip.destination.name.split(',')[0]}
                                </Text>
                                <View style={styles.tripFooter}>
                                    <View style={styles.tripCarInfo}>
                                        <View style={[styles.carIconBox, isDriver && { backgroundColor: '#1E293B' }]}>
                                            <Text style={[styles.carIconText, isDriver && { color: '#94A3B8' }]}>
                                                {trip.host?.name ? trip.host.name.charAt(0).toUpperCase() : 'H'}
                                            </Text>
                                        </View>
                                        <Text style={[styles.carDetails, isDriver && styles.darkSubtext]} numberOfLines={1}>
                                            {trip.host?.name || 'Driver'} • {trip.host?.driverDetails?.vehicle?.make || 'Vehicle'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}

                    {/* General Support */}
                    <Text style={[styles.sectionHeader, { marginTop: 24, marginBottom: 12 }, isDriver && styles.darkSubtext]}>GENERAL SUPPORT</Text>

                    <View style={[styles.menuCard, isDriver && styles.darkCard]}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => Linking.openURL(isDriver ? 'https://sanchari.io/?view=partner-terms' : 'https://www.sanchari.io/?view=customer-terms')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuIconBox}>
                                <FontAwesomeIcon icon={faShieldHalved} size={20} color="#DC2626" />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={[styles.menuTitle, isDriver && styles.darkText]}>Safety Center</Text>
                                <Text style={[styles.menuSubtitle, isDriver && styles.darkSubtext]}>Community guidelines &amp; safety tools</Text>
                            </View>
                            <FontAwesomeIcon icon={faChevronRight} size={14} color={isDriver ? "#475569" : "#D1D5DB"} />
                        </TouchableOpacity>
                        <View style={[styles.divider, isDriver && { backgroundColor: '#1E293B' }]} />

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => Linking.openURL('https://www.sanchari.io/?view=faq')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuIconBox}>
                                <FontAwesomeIcon icon={faCircleQuestion} size={20} color={isDriver ? "#10B981" : "#374151"} />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={[styles.menuTitle, isDriver && styles.darkText]}>FAQ &amp; Knowledge Base</Text>
                                <Text style={[styles.menuSubtitle, isDriver && styles.darkSubtext]}>Find quick answers</Text>
                            </View>
                            <FontAwesomeIcon icon={faChevronRight} size={14} color={isDriver ? "#475569" : "#D1D5DB"} />
                        </TouchableOpacity>
                    </View>

                    {/* App Feedback */}
                    <View style={[styles.menuCard, { marginTop: 24 }, isDriver && styles.darkCard]}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => (navigation as any).navigate('AppFeedback')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuIconBox}>
                                <FontAwesomeIcon icon={faMessage} size={20} color={isDriver ? "#10B981" : "#374151"} />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={[styles.menuTitle, isDriver && styles.darkText]}>App Feedback</Text>
                                <Text style={[styles.menuSubtitle, isDriver && styles.darkSubtext]}>Share your experience &amp; report issues</Text>
                            </View>
                            <FontAwesomeIcon icon={faChevronRight} size={14} color={isDriver ? "#475569" : "#D1D5DB"} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.versionText, isDriver && { color: '#475569' }]}>VERSION 2.4.0</Text>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </View>

            {/* Fixed Header */}
            <View style={[styles.fixedHeader, isDriver && { backgroundColor: '#080C14', borderBottomWidth: 1, borderBottomColor: '#1E293B' }]}>
                <SafeAreaView>
                    <View style={styles.headerTopRow}>
                        <View>
                            <Text style={styles.headerTitle}>Help &amp; Support</Text>
                            <Text style={styles.headerSubtitle}>How can we help you today?</Text>
                        </View>
                        <View style={[styles.activeRideBadge, isDriver && { backgroundColor: '#0F172A', borderColor: '#1E293B' }]}>
                            <Text style={styles.activeRideText}>NO ACTIVE RIDE</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            {isDriver ? (
                <DriverBottomNavBar activeTab="SUPPORT" />
            ) : (
                <BottomNavBar activeTab="SUPPORT" />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    darkContainer: {
        backgroundColor: '#080C14',
    },
    darkCard: {
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    darkText: {
        color: '#FFFFFF',
    },
    darkSubtext: {
        color: '#94A3B8',
    },
    contentContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#111827',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingHorizontal: 20,
        paddingBottom: 24,
        zIndex: 100,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: 10,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    activeRideBadge: {
        backgroundColor: '#1F2937',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    activeRideText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    sosButtonContainer: {
        marginBottom: 24,
        marginTop: 0,
    },
    sosButton: {
        backgroundColor: '#DC2626',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    sosIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    sosTextContainer: {
        flex: 1,
    },
    sosTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
        marginBottom: 2,
    },
    sosSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    viewAllText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10B981',
        textTransform: 'uppercase',
    },
    tripCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    tripDate: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    tripStatusBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tripStatusText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#4B5563',
    },
    tripRoute: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
    tripFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tripCarInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    carIconBox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    carIconText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#6B7280',
    },
    carDetails: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    menuCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 72,
    },
    versionText: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 10,
        fontWeight: '800',
        color: '#D1D5DB',
        letterSpacing: 1,
    }
});

export default SupportScreen;

import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronLeft,
    faMotorcycle,
    faCar,
    faArrowRight,
    faCheckCircle,
    faLock,
    faExclamation,
    faBolt,
    faGasPump,
    faChartLine,
    faUmbrella,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../Context/AuthContext';

const DriverCityPoolVehicleScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();

    // Derive vehicle details
    const vehicleType = (user?.driverDetails?.vehicle?.type || '').toUpperCase();
    const vehicleMake = user?.driverDetails?.vehicle?.make || 'Honda';
    const vehicleModel = user?.driverDetails?.vehicle?.model || 'Activa 6G';
    const plateNumber = user?.driverDetails?.vehicle?.plateNumber || 'TS09 AB 4521';

    const hasBike = vehicleType === 'BIKE' || vehicleType === 'AUTO' || true; // Default true for demo
    const hasCar = vehicleType === 'CAR' || vehicleType === 'TRAVELLER';

    const handleCarPress = () => {
        (navigation as any).navigate('DriverCarCreateRide');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.breadcrumbText}>CITY POOL › VEHICLE</Text>
                    <Text style={styles.headerTitleText}>Pick your vehicle</Text>
                </View>
            </View>

            {/* Subtitle & Demand Callout */}
            <View style={styles.subtitleContainer}>
                <Text style={styles.subtitleText}>Choose what you'll drive for City Pool today</Text>
                <View style={styles.demandCalloutRow}>
                    <FontAwesomeIcon icon={faBolt} size={13} color="#10B981" style={{ marginRight: 6 }} />
                    <Text style={styles.demandCalloutText}>
                        Right now · <Text style={styles.highlightText}>Bike Pool is in higher demand</Text>
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* 1. Bike Pool Card */}
                <TouchableOpacity
                    style={[styles.card, { borderColor: '#1E293B' }]}
                    activeOpacity={0.85}
                    onPress={() => (navigation as any).navigate('DriverBikeCreateRide')}
                >
                    {/* Recommended Tag */}
                    <View style={styles.recommendedBadge}>
                        <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.recommendedText}>RECOMMENDED</Text>
                    </View>

                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: '#10B981' }]}>
                            <FontAwesomeIcon icon={faMotorcycle} size={22} color="#000000" />
                        </View>
                        <View style={styles.titleContainer}>
                            <Text style={styles.cardTitle}>Bike Pool</Text>
                            <Text style={styles.cardSubtitle}>2-wheeler · 1 pillion rider · Beat traffic</Text>

                            {/* Verified vehicle text */}
                            <View style={styles.verifiedRow}>
                                <FontAwesomeIcon icon={faCheckCircle} size={11} color="#10B981" style={{ marginRight: 4 }} />
                                <Text style={styles.verifiedText}>
                                    Verified: {vehicleMake} {vehicleModel} · {plateNumber}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>EARN / TRIP</Text>
                            <Text style={styles.statValue}>₹80-₹180</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>TIME</Text>
                            <Text style={styles.statValue}>~25 min</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>DEMAND</Text>
                            <Text style={[styles.statValue, { color: '#10B981' }]}>● 18 riders</Text>
                        </View>
                    </View>

                    {/* Feature Pills */}
                    <View style={styles.featurePillsRow}>
                        <View style={styles.featurePill}>
                            <FontAwesomeIcon icon={faBolt} size={10} color="#F59E0B" style={{ marginRight: 4 }} />
                            <Text style={styles.featurePillText}>Traffic-proof</Text>
                        </View>
                        <View style={styles.featurePill}>
                            <FontAwesomeIcon icon={faGasPump} size={10} color="#10B981" style={{ marginRight: 4 }} />
                            <Text style={styles.featurePillText}>Low fuel cost</Text>
                        </View>
                        <View style={styles.featurePill}>
                            <FontAwesomeIcon icon={faChartLine} size={10} color="#3B82F6" style={{ marginRight: 4 }} />
                            <Text style={styles.featurePillText}>More trips/day</Text>
                        </View>
                    </View>

                    {/* Footer Tag & Action Button */}
                    <View style={styles.cardFooter}>
                        <View style={[styles.tagBadge, { borderColor: '#10B981' }]}>
                            <Text style={[styles.tagText, { color: '#10B981' }]}>2-WHEELER POOL</Text>
                        </View>
                        <View style={[styles.actionBtn, { backgroundColor: '#10B981' }]}>
                            <FontAwesomeIcon icon={faArrowRight} size={14} color="#000000" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* 2. Car Pool Card */}
                <TouchableOpacity
                    style={[styles.card, !hasCar && styles.cardLocked]}
                    activeOpacity={0.85}
                    onPress={handleCarPress}
                >
                    {/* Lock / Verify Badge */}
                    <View style={styles.lockBadge}>
                        <FontAwesomeIcon icon={faLock} size={10} color="#F59E0B" style={{ marginRight: 4 }} />
                        <Text style={styles.lockBadgeText}>VERIFY TO UNLOCK</Text>
                    </View>

                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: '#3B82F6' }]}>
                            <FontAwesomeIcon icon={faCar} size={20} color="#FFFFFF" />
                        </View>
                        <View style={styles.titleContainer}>
                            <Text style={styles.cardTitle}>Car Pool</Text>
                            <Text style={styles.cardSubtitle}>4-wheeler · 3 pooled riders · Premium comfort</Text>
                            <Text style={styles.addCarNotice}>Add a car to start earning here</Text>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>EARN / TRIP</Text>
                            <Text style={styles.statValue}>₹150-₹300</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>TIME</Text>
                            <Text style={styles.statValue}>~45 min</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>DEMAND</Text>
                            <Text style={[styles.statValue, { color: '#3B82F6' }]}>● 9 riders</Text>
                        </View>
                    </View>

                    {/* Feature Pills */}
                    <View style={styles.featurePillsRow}>
                        <View style={styles.featurePill}>
                            <FontAwesomeIcon icon={faChartLine} size={10} color="#3B82F6" style={{ marginRight: 4 }} />
                            <Text style={styles.featurePillText}>Higher fares</Text>
                        </View>
                        <View style={styles.featurePill}>
                            <FontAwesomeIcon icon={faUmbrella} size={10} color="#94A3B8" style={{ marginRight: 4 }} />
                            <Text style={styles.featurePillText}>All-weather</Text>
                        </View>
                        <View style={styles.featurePill}>
                            <FontAwesomeIcon icon={faUsers} size={10} color="#A855F7" style={{ marginRight: 4 }} />
                            <Text style={styles.featurePillText}>Family rides</Text>
                        </View>
                    </View>

                    {/* Footer Tag & Action Button */}
                    <View style={styles.cardFooter}>
                        <View style={[styles.tagBadge, { borderColor: '#F59E0B' }]}>
                            <Text style={[styles.tagText, { color: '#F59E0B' }]}>VERIFY YOUR CAR</Text>
                        </View>
                        <View style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}>
                            <FontAwesomeIcon icon={faCheckCircle} size={16} color="#000000" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Why 2 Riders Info Box */}
                <View style={styles.infoNoticeCard}>
                    <View style={styles.infoIconBox}>
                        <FontAwesomeIcon icon={faExclamation} size={14} color="#3B82F6" />
                    </View>
                    <View style={styles.infoTextContent}>
                        <Text style={styles.infoNoticeTitle}>Why two riders on a bike?</Text>
                        <Text style={styles.infoNoticeSub}>
                            Sanchari pools 1 pillion rider per bike trip · Both share the fare
                        </Text>
                    </View>
                </View>

                {/* Footer Notice */}
                <Text style={styles.footerNotice}>
                    You can change vehicle anytime in Profile · Insurance covered
                </Text>

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
        paddingTop: 12,
        paddingBottom: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#131B2A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    headerTextContainer: {
        flex: 1,
    },
    breadcrumbText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#10B981',
        letterSpacing: 1.2,
        marginBottom: 2,
    },
    headerTitleText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    subtitleContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
        marginTop: 4,
    },
    subtitleText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 6,
    },
    demandCalloutRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    demandCalloutText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
    },
    highlightText: {
        color: '#10B981',
        fontWeight: '700',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    card: {
        backgroundColor: '#0F172A',
        borderRadius: 20,
        padding: 20,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#1E293B',
        position: 'relative',
    },
    cardLocked: {
        backgroundColor: '#0D1322',
        borderColor: '#1E293B',
    },
    recommendedBadge: {
        position: 'absolute',
        top: 18,
        right: 18,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#10B981',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    recommendedText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    lockBadge: {
        position: 'absolute',
        top: 18,
        right: 18,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#B45309',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    lockBadgeText: {
        color: '#F59E0B',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    titleContainer: {
        flex: 1,
        paddingRight: 90,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        lineHeight: 16,
        marginBottom: 4,
    },
    verifiedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    verifiedText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#10B981',
    },
    addCarNotice: {
        fontSize: 11,
        fontWeight: '700',
        color: '#F59E0B',
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0B101D',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    statCol: {
        flex: 1,
        alignItems: 'flex-start',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#1E293B',
        marginHorizontal: 10,
    },
    featurePillsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    featurePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0B101D',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    featurePillText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tagBadge: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    tagText: {
        fontWeight: '800',
        fontSize: 10,
        letterSpacing: 0.8,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoNoticeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0D1527',
        borderRadius: 16,
        padding: 16,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    infoIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    infoTextContent: {
        flex: 1,
    },
    infoNoticeTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    infoNoticeSub: {
        fontSize: 11,
        color: '#64748B',
        lineHeight: 16,
    },
    footerNotice: {
        textAlign: 'center',
        color: '#475569',
        fontSize: 12,
        fontWeight: '500',
    },
});

export default DriverCityPoolVehicleScreen;

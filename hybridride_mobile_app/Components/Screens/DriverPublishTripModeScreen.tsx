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
    faBuilding,
    faCar,
    faArrowRight,
    faLock,
    faMotorcycle,
    faTruckPickup,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../Context/AuthContext';

const DriverPublishTripModeScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();

    // Derive vehicle type from driver profile
    const vehicleType = (user?.driverDetails?.vehicle?.type || '').toUpperCase();
    const isBikeOrAuto = vehicleType === 'BIKE' || vehicleType === 'AUTO';
    const vehicleLabel = vehicleType === 'BIKE' ? 'Bike' : vehicleType === 'AUTO' ? 'Auto' : null;

    const handleLockedPress = () => {
        Alert.alert(
            `${vehicleLabel} — City Only`,
            `${vehicleLabel} drivers can only offer City Pools (local routes under 100 km).\n\nOutstation and Rental pools require a Car or Traveller vehicle.`,
            [{ text: 'OK' }]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header / Top Bar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerCategoryText}>CHOOSE MODE</Text>
                    <Text style={styles.headerTitleText}>How do you want to earn?</Text>
                </View>
            </View>

            {/* Subtitle banner */}
            <View style={styles.subtitleContainer}>
                <Text style={styles.subtitleText}>
                    Based on demand right now · <Text style={styles.highlightText}>City Pool recommended</Text>
                </Text>
            </View>

            {/* Amber banner for bike/auto drivers */}
            {isBikeOrAuto && (
                <View style={styles.vehicleBanner}>
                    <FontAwesomeIcon
                        icon={vehicleType === 'BIKE' ? faMotorcycle : faTruckPickup}
                        size={16}
                        color="#F59E0B"
                        style={{ marginRight: 8 }}
                    />
                    <Text style={styles.vehicleBannerText}>
                        {vehicleLabel} drivers can only publish City Pools (under 100 km)
                    </Text>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* 1. City Pool Card (Green Accent) */}
                <TouchableOpacity
                    style={[styles.card, { borderColor: '#1E293B' }]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('DriverCityPoolVehicle' as never)}
                >
                    {/* Top Recommendation Badge */}
                    <View style={styles.recommendedBadge}>
                        <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.recommendedText}>RECOMMENDED</Text>
                    </View>

                    <View style={styles.cardHeader}>
                        {/* Icon Box */}
                        <View style={[styles.iconBox, { backgroundColor: '#10B981' }]}>
                            <FontAwesomeIcon icon={faBuilding} size={22} color="#000000" />
                        </View>
                        <View style={styles.titleContainer}>
                            <Text style={styles.cardTitle}>City Pool</Text>
                            <Text style={styles.cardSubtitle}>Intra-city pooled routes · Daily commutes</Text>
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
                            <Text style={[styles.statValue, { color: '#10B981' }]}>● 12 riders</Text>
                        </View>
                    </View>

                    {/* Footer Tag & Action Button */}
                    <View style={styles.cardFooter}>
                        <View style={[styles.tagBadge, { borderColor: '#10B981' }]}>
                            <Text style={[styles.tagText, { color: '#10B981' }]}>LOCAL MATCHING</Text>
                        </View>
                        <View style={[styles.actionBtn, { backgroundColor: '#10B981' }]}>
                            <FontAwesomeIcon icon={faArrowRight} size={14} color="#000000" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* 2. Outstation Pool Card (Indigo Accent) */}
                <TouchableOpacity
                    style={[styles.card, isBikeOrAuto && styles.cardLocked]}
                    activeOpacity={0.8}
                    onPress={() =>
                        isBikeOrAuto
                            ? handleLockedPress()
                            : navigation.navigate('DriverPublishOutstationPool' as never)
                    }
                >
                    {isBikeOrAuto && (
                        <View style={styles.lockBadge}>
                            <FontAwesomeIcon icon={faLock} size={11} color="#9CA3AF" />
                            <Text style={styles.lockBadgeText}>Car only</Text>
                        </View>
                    )}

                    <View style={styles.cardHeader}>
                        {/* Icon Box */}
                        <View
                            style={[
                                styles.iconBox,
                                { backgroundColor: isBikeOrAuto ? '#1F2937' : '#6366F1' },
                            ]}
                        >
                            <FontAwesomeIcon
                                icon={faCar}
                                size={20}
                                color={isBikeOrAuto ? '#4B5563' : '#FFFFFF'}
                            />
                        </View>
                        <View style={styles.titleContainer}>
                            <Text style={[styles.cardTitle, isBikeOrAuto && styles.textMuted]}>
                                Outstation Pool
                            </Text>
                            <Text style={[styles.cardSubtitle, isBikeOrAuto && { color: '#4B5563' }]}>
                                Long-distance · Per-seat pricing
                            </Text>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>EARN / TRIP</Text>
                            <Text style={[styles.statValue, isBikeOrAuto && styles.textMuted]}>
                                ₹1,200-₹2,500
                            </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>TIME</Text>
                            <Text style={[styles.statValue, isBikeOrAuto && styles.textMuted]}>
                                3-5 hrs
                            </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>DEMAND</Text>
                            <Text style={[styles.statValue, { color: isBikeOrAuto ? '#6B7280' : '#F59E0B' }]}>
                                ● 5 riders
                            </Text>
                        </View>
                    </View>

                    {/* Footer Tag & Action Button */}
                    <View style={styles.cardFooter}>
                        <View
                            style={[
                                styles.tagBadge,
                                { borderColor: isBikeOrAuto ? '#374151' : '#6366F1' },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tagText,
                                    { color: isBikeOrAuto ? '#6B7280' : '#818CF8' },
                                ]}
                            >
                                {isBikeOrAuto ? 'NOT AVAILABLE FOR YOUR VEHICLE' : 'INTER-CITY TRAVEL'}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.actionBtn,
                                { backgroundColor: isBikeOrAuto ? '#374151' : '#6366F1' },
                            ]}
                        >
                            <FontAwesomeIcon icon={faArrowRight} size={14} color="#FFFFFF" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* 3. Outstation Rental Card (Amber/Orange Accent) */}
                <TouchableOpacity
                    style={[styles.card, isBikeOrAuto && styles.cardLocked]}
                    activeOpacity={0.8}
                    onPress={() =>
                        isBikeOrAuto
                            ? handleLockedPress()
                            : navigation.navigate('DriverPublishOutstationRental' as never)
                    }
                >
                    {isBikeOrAuto && (
                        <View style={styles.lockBadge}>
                            <FontAwesomeIcon icon={faLock} size={11} color="#9CA3AF" />
                            <Text style={styles.lockBadgeText}>Car only</Text>
                        </View>
                    )}

                    <View style={styles.cardHeader}>
                        {/* Icon Box */}
                        <View
                            style={[
                                styles.iconBox,
                                { backgroundColor: isBikeOrAuto ? '#1F2937' : '#F59E0B' },
                            ]}
                        >
                            <FontAwesomeIcon
                                icon={faCar}
                                size={20}
                                color={isBikeOrAuto ? '#4B5563' : '#000000'}
                            />
                        </View>
                        <View style={styles.titleContainer}>
                            <Text style={[styles.cardTitle, isBikeOrAuto && styles.textMuted]}>
                                Outstation Rental
                            </Text>
                            <Text style={[styles.cardSubtitle, isBikeOrAuto && { color: '#4B5563' }]}>
                                Full vehicle · Per KM + night charges
                            </Text>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>EARN / TRIP</Text>
                            <Text style={[styles.statValue, isBikeOrAuto && styles.textMuted]}>
                                ₹3,500-₹8K+
                            </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>TIME</Text>
                            <Text style={[styles.statValue, isBikeOrAuto && styles.textMuted]}>
                                Full day
                            </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>DEMAND</Text>
                            <Text style={[styles.statValue, { color: isBikeOrAuto ? '#6B7280' : '#F59E0B' }]}>
                                ● 2 riders
                            </Text>
                        </View>
                    </View>

                    {/* Footer Tag & Action Button */}
                    <View style={styles.cardFooter}>
                        <View
                            style={[
                                styles.tagBadge,
                                { borderColor: isBikeOrAuto ? '#374151' : '#F59E0B' },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tagText,
                                    { color: isBikeOrAuto ? '#6B7280' : '#F59E0B' },
                                ]}
                            >
                                {isBikeOrAuto ? 'NOT AVAILABLE FOR YOUR VEHICLE' : 'FULL TRIP · PER KM'}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.actionBtn,
                                { backgroundColor: isBikeOrAuto ? '#374151' : '#F59E0B' },
                            ]}
                        >
                            <FontAwesomeIcon icon={faArrowRight} size={14} color="#000000" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Footer Notice */}
                <Text style={styles.footerNotice}>
                    You can switch modes anytime · Rates may vary by route & time
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
    headerCategoryText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#10B981',
        letterSpacing: 1.5,
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
    },
    highlightText: {
        color: '#10B981',
        fontWeight: '700',
    },
    vehicleBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 12,
        backgroundColor: '#1C1407',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#78350F',
    },
    vehicleBannerText: {
        color: '#F59E0B',
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
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
        backgroundColor: '#0B0F17',
        borderColor: '#1E293B',
        opacity: 0.6,
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
        backgroundColor: '#1E293B',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    lockBadgeText: {
        color: '#9CA3AF',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
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
        paddingRight: 80,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    textMuted: {
        color: '#6B7280',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0B101D',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 16,
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
    footerNotice: {
        textAlign: 'center',
        color: '#475569',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 8,
    },
});

export default DriverPublishTripModeScreen;

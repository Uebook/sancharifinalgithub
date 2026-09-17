
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronLeft,
    faChevronRight,
    faRotateLeft,
    faCar,
    faCircleCheck,
    faSnowflake,
    faSuitcase,
    faMoon,
    faEllipsis,
    faIndianRupeeSign,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../Context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import poolService from '../../Services/poolService';

// ─── Rate row component ───────────────────────────────────
const RateRow = ({
    label,
    desc,
    value,
    unit,
    onDecrement,
    onIncrement,
}: {
    label: string;
    desc: string;
    value: number;
    unit: string;
    onDecrement: () => void;
    onIncrement: () => void;
}) => (
    <View style={styles.rateRow}>
        <View style={styles.rateInfo}>
            <Text style={styles.rateLabel}>{label}</Text>
            <Text style={styles.rateDesc}>{desc}</Text>
        </View>
        <View style={styles.rateControls}>
            <TouchableOpacity style={styles.rateBtn} onPress={onDecrement}>
                <Text style={styles.rateBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.rateValue}>
                {unit === '₹' ? `₹${value}` : `${value} km`}
            </Text>
            <TouchableOpacity style={styles.rateBtn} onPress={onIncrement}>
                <Text style={styles.rateBtnText}>+</Text>
            </TouchableOpacity>
        </View>
    </View>
);

// ─── Main Screen ──────────────────────────────────────────
const DriverPublishOutstationRentalScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();

    // ── Trip type ──────────────────────────────────────────
    const [tripType, setTripType] = useState<'ROUND' | 'ONEWAY'>('ROUND');

    // ── Route ──────────────────────────────────────────────
    const [origin, setOrigin] = useState('Hyderabad');
    const [destination, setDestination] = useState('Anywhere in Telangana');
    const [originCoords, setOriginCoords] = useState<number[] | null>(null);
    const [destinationCoords, setDestinationCoords] = useState<number[] | null>(null);

    // ── Rate card ──────────────────────────────────────────
    const [pricePerKm, setPricePerKm] = useState(13);
    const [minKmPerDay, setMinKmPerDay] = useState(250);
    const [driverAllowance, setDriverAllowance] = useState(400);

    // ── Trip includes ──────────────────────────────────────
    const [hasAC, setHasAC] = useState(true);
    const [hasLuggage, setHasLuggage] = useState(true);
    const [hasNightDriving, setHasNightDriving] = useState(true);

    // ── Available toggle ───────────────────────────────────
    const [isAvailable, setIsAvailable] = useState(true);

    // ── Vehicle info ───────────────────────────────────────
    const vehicleModel = user?.driverDetails?.vehicle?.model || 'Maruti Swift DZire';
    const vehicleType = user?.driverDetails?.vehicle?.type || 'Sedan';
    const vehicleSeats = (user?.driverDetails?.vehicle as any)?.seatingCapacity || 4;

    // ── Derived estimate ───────────────────────────────────
    const sampleKm = 296;
    const estimatedTotal = Math.round(sampleKm * pricePerKm + driverAllowance * 2);
    const driverKeeps = Math.round(estimatedTotal * 0.85);

    const isFormValid = !!(origin && destination);

    // ── Publish ────────────────────────────────────────────
    const handleGoLive = async () => {
        try {
            await AsyncStorage.getItem('userToken');
            const response = await poolService.publishRide({
                type: 'rental',
                poolCategory: 'OUTSTATION_RENTAL',
                originName: origin,
                originCoords: originCoords || [78.4867, 17.3850], // Fallback default coords
                destinationName: destination,
                destinationCoords: destinationCoords || [79.5941, 17.9689], // Fallback default coords
                scheduledTime: new Date().toISOString(),
                vehicle: vehicleModel,
                vehicleType,
                totalSeats: vehicleSeats,
                pricePerSeat: pricePerKm,
                preferences: {
                    ac: hasAC,
                    luggage: hasLuggage,
                    nightDriving: hasNightDriving,
                },
                rentalDetails: {
                    pricePerKm,
                    minKmPerDay,
                    driverAllowance,
                    tripType
                }
            });
            if (response.success) {
                navigation.navigate('DriverMyTrips' as never);
            } else {
                Alert.alert('Publish Failed', response.message);
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to go live.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Outstation rental</Text>
                    <Text style={styles.headerSubtitle}>Offer your car & driving for a full trip</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Trip Type Tabs ── */}
                <View style={styles.tripTypeTabs}>
                    <TouchableOpacity
                        style={[styles.tripTypeTab, tripType === 'ROUND' && styles.tripTypeTabActive]}
                        onPress={() => setTripType('ROUND')}
                    >
                        <FontAwesomeIcon
                            icon={faRotateLeft}
                            size={13}
                            color={tripType === 'ROUND' ? '#F59E0B' : '#6B7280'}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.tripTypeText, tripType === 'ROUND' && styles.tripTypeTextActive]}>
                            Round trip
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tripTypeTab, tripType === 'ONEWAY' && styles.tripTypeTabActive]}
                        onPress={() => setTripType('ONEWAY')}
                    >
                        <Text style={[styles.tripTypeText, tripType === 'ONEWAY' && styles.tripTypeTextActive]}>
                            One-way drop
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ── Route Card ── */}
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.8}
                    onPress={() => (navigation as any).navigate('DriverOutstationLocationSearch', {
                        type: 'ORIGIN',
                        onSelect: (r: any) => setOrigin(r.name),
                    })}
                >
                    <View style={styles.routeRow}>
                        {/* Timeline */}
                        <View style={styles.routeTimeline}>
                            <View style={styles.originDot} />
                            <View style={styles.routeLine} />
                            <View style={styles.destSquare} />
                        </View>

                        <View style={styles.routeDetails}>
                            <View style={styles.routeBlock}>
                                <Text style={styles.routeBlockLabel}>AVAILABLE FROM</Text>
                                <Text style={styles.routeBlockValue}>{origin || 'Your city'}</Text>
                            </View>
                            <View style={styles.routeDivider} />
                            <View style={styles.routeBlock}>
                                <Text style={styles.routeBlockLabel}>WILLING TO DRIVE TO</Text>
                                <Text style={styles.routeBlockValue}>{destination || 'Destination region'}</Text>
                            </View>
                        </View>

                        <FontAwesomeIcon icon={faChevronRight} size={14} color="#4B5563" />
                    </View>
                </TouchableOpacity>

                {/* ── Car Card ── */}
                <View style={styles.card}>
                    <View style={styles.carRow}>
                        <View style={styles.carIconCircle}>
                            <FontAwesomeIcon icon={faCar} size={20} color="#F59E0B" />
                        </View>
                        <View style={styles.carInfo}>
                            <Text style={styles.carLabel}>YOUR CAR · {vehicleType.toUpperCase()}</Text>
                            <Text style={styles.carName}>{vehicleModel}  <Text style={styles.carSeats}>{vehicleSeats} seats</Text></Text>
                        </View>
                        <View style={styles.carVerifiedBadge}>
                            <FontAwesomeIcon icon={faCircleCheck} size={18} color="#10B981" />
                        </View>
                    </View>
                </View>

                {/* ── Rate Card ── */}
                <View style={styles.card}>
                    <View style={styles.rateCardHeader}>
                        <Text style={styles.cardSectionTitle}>YOUR RATE CARD</Text>
                        <Text style={styles.rateCardSub}>Riders see this upfront</Text>
                    </View>

                    <View style={styles.divider} />
                    <RateRow
                        label="Per km rate"
                        desc="Charged on total distance driven"
                        value={pricePerKm}
                        unit="₹"
                        onDecrement={() => setPricePerKm(p => Math.max(5, p - 1))}
                        onIncrement={() => setPricePerKm(p => p + 1)}
                    />
                    <View style={styles.divider} />
                    <RateRow
                        label="Minimum km / day"
                        desc="Fair floor even on short days"
                        value={minKmPerDay}
                        unit="km"
                        onDecrement={() => setMinKmPerDay(p => Math.max(50, p - 10))}
                        onIncrement={() => setMinKmPerDay(p => p + 10)}
                    />
                    <View style={styles.divider} />
                    <RateRow
                        label="Driver allowance / day"
                        desc="Your meals & stay (bata)"
                        value={driverAllowance}
                        unit="₹"
                        onDecrement={() => setDriverAllowance(p => Math.max(100, p - 50))}
                        onIncrement={() => setDriverAllowance(p => p + 50)}
                    />
                    <Text style={styles.rateTaxNote}>
                        Tolls, parking & state taxes billed at actuals to the rider
                    </Text>
                </View>

                {/* ── Trip Includes ── */}
                <View style={styles.sectionLabel}>
                    <Text style={styles.sectionLabelText}>TRIP INCLUDES</Text>
                </View>
                <View style={styles.chipsRow}>
                    <TouchableOpacity
                        style={[styles.chip, hasAC && styles.chipActive]}
                        onPress={() => setHasAC(v => !v)}
                    >
                        <FontAwesomeIcon icon={faSnowflake} size={12} color={hasAC ? '#F59E0B' : '#4B5563'} style={{ marginRight: 5 }} />
                        <Text style={[styles.chipText, hasAC && styles.chipTextActive]}>AC</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.chip, hasLuggage && styles.chipActive]}
                        onPress={() => setHasLuggage(v => !v)}
                    >
                        <FontAwesomeIcon icon={faSuitcase} size={12} color={hasLuggage ? '#F59E0B' : '#4B5563'} style={{ marginRight: 5 }} />
                        <Text style={[styles.chipText, hasLuggage && styles.chipTextActive]}>Luggage</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.chip, hasNightDriving && styles.chipActive]}
                        onPress={() => setHasNightDriving(v => !v)}
                    >
                        <FontAwesomeIcon icon={faMoon} size={12} color={hasNightDriving ? '#F59E0B' : '#4B5563'} style={{ marginRight: 5 }} />
                        <Text style={[styles.chipText, hasNightDriving && styles.chipTextActive]}>Night driving</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chip}>
                        <FontAwesomeIcon icon={faEllipsis} size={12} color="#4B5563" style={{ marginRight: 5 }} />
                        <Text style={styles.chipText}>More</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Estimate preview ── */}
                <View style={[styles.card, styles.estimateCard]}>
                    <View style={styles.estimateRupeeCircle}>
                        <FontAwesomeIcon icon={faIndianRupeeSign} size={14} color="#F59E0B" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.estimateRoute}>
                            {origin.split(',')[0]} → Warangal {tripType === 'ROUND' ? 'round trip' : 'one-way'} ({sampleKm} km)
                        </Text>
                        <Text style={styles.estimateValue}>
                            ≈ ₹{estimatedTotal.toLocaleString('en-IN')}{' '}
                            <Text style={styles.estimateKeep}>· you keep ₹{driverKeeps.toLocaleString('en-IN')}</Text>
                        </Text>
                    </View>
                </View>

                {/* ── Available for rentals toggle ── */}
                <View style={[styles.card, styles.availableCard]}>
                    <View style={styles.availableLeft}>
                        <FontAwesomeIcon icon={faCircleCheck} size={18} color="#10B981" style={{ marginRight: 10 }} />
                        <View>
                            <Text style={styles.availableTitle}>Available for rentals</Text>
                            <Text style={styles.availableSub}>Riders can request your car for trips</Text>
                        </View>
                    </View>
                    <Switch
                        trackColor={{ false: '#2D2D45', true: '#F59E0B' }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="#2D2D45"
                        onValueChange={setIsAvailable}
                        value={isAvailable}
                    />
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* ── Footer ── */}
            <View style={styles.footer}>
                <View style={styles.readyRow}>
                    <View style={styles.readyDot} />
                    <Text style={styles.readyText}>RATE CARD READY</Text>
                    <Text style={styles.readySummary} numberOfLines={1}>
                        {'  '}{vehicleType} · ₹{pricePerKm}/km · {minKmPerDay} km min · ₹{driverAllowance}/day · {tripType === 'ROUND' ? 'Round trip' : 'One-way'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.goLiveBtn, !isFormValid && { opacity: 0.5 }]}
                    onPress={handleGoLive}
                    disabled={!isFormValid}
                    activeOpacity={0.85}
                >
                    <Text style={styles.goLiveBtnText}>Go live for rentals</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A14' },

    // ── Header ──────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 12,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1A1A24',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2D2D3A',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
    headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },

    // ── Content ─────────────────────────────────────────────
    content: { paddingHorizontal: 16 },

    // ── Trip Type Tabs ──────────────────────────────────────
    tripTypeTabs: {
        flexDirection: 'row',
        backgroundColor: '#1A1A24',
        borderRadius: 30,
        padding: 4,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#2D2D3A',
    },
    tripTypeTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 26,
    },
    tripTypeTabActive: {
        borderWidth: 1,
        borderColor: '#F59E0B',
        backgroundColor: 'transparent',
    },
    tripTypeText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
    tripTypeTextActive: { color: '#F59E0B' },

    // ── Card ────────────────────────────────────────────────
    card: {
        backgroundColor: '#1A1A24',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2D2D3A',
    },

    // ── Route ───────────────────────────────────────────────
    routeRow: { flexDirection: 'row', alignItems: 'center' },
    routeTimeline: {
        alignItems: 'center',
        marginRight: 14,
        paddingVertical: 4,
    },
    originDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#F59E0B',
        borderWidth: 2,
        borderColor: '#FCD34D',
    },
    routeLine: {
        width: 2,
        height: 28,
        backgroundColor: '#2D2D3A',
        borderStyle: 'dashed',
        marginVertical: 4,
    },
    destSquare: {
        width: 8,
        height: 8,
        backgroundColor: '#F97316',
        borderRadius: 2,
    },
    routeDetails: { flex: 1 },
    routeBlock: { paddingVertical: 4 },
    routeBlockLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#4B5563',
        letterSpacing: 1,
        marginBottom: 3,
    },
    routeBlockValue: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
    routeDivider: { height: 1, backgroundColor: '#2D2D3A', marginVertical: 6 },

    // ── Car ─────────────────────────────────────────────────
    carRow: { flexDirection: 'row', alignItems: 'center' },
    carIconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(245,158,11,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.3)',
    },
    carInfo: { flex: 1 },
    carLabel: { fontSize: 9, fontWeight: '800', color: '#4B5563', letterSpacing: 1, marginBottom: 3 },
    carName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    carSeats: { color: '#6B7280', fontWeight: '600' },
    carVerifiedBadge: {},

    // ── Rate Card ───────────────────────────────────────────
    rateCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    cardSectionTitle: { fontSize: 10, fontWeight: '800', color: '#4B5563', letterSpacing: 1 },
    rateCardSub: { fontSize: 11, color: '#4B5563' },
    divider: { height: 1, backgroundColor: '#12121E', marginVertical: 12 },
    rateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
    rateInfo: { flex: 1 },
    rateLabel: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
    rateDesc: { fontSize: 11, color: '#4B5563', marginTop: 2 },
    rateControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rateBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#12121E',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2D2D3A',
    },
    rateBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '300', lineHeight: 22 },
    rateValue: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', minWidth: 60, textAlign: 'center' },
    rateTaxNote: { fontSize: 11, color: '#4B5563', marginTop: 14, lineHeight: 16 },

    // ── Section label ───────────────────────────────────────
    sectionLabel: { marginBottom: 10 },
    sectionLabelText: { fontSize: 10, fontWeight: '800', color: '#4B5563', letterSpacing: 1.2 },

    // ── Chips ───────────────────────────────────────────────
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1A1A24',
        borderWidth: 1,
        borderColor: '#2D2D3A',
    },
    chipActive: { borderColor: '#F59E0B' },
    chipText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
    chipTextActive: { color: '#F59E0B' },

    // ── Estimate ─────────────────────────────────────────────
    estimateCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    estimateRupeeCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(245,158,11,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.3)',
    },
    estimateRoute: { fontSize: 12, color: '#9CA3AF', marginBottom: 3 },
    estimateValue: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    estimateKeep: { fontSize: 13, color: '#4B5563', fontWeight: '600' },

    // ── Available ────────────────────────────────────────────
    availableCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    availableLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    availableTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
    availableSub: { fontSize: 11, color: '#4B5563', marginTop: 2 },

    // ── Footer ───────────────────────────────────────────────
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0A0A14',
        borderTopWidth: 1,
        borderTopColor: '#1A1A24',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 28,
    },
    readyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    readyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B', marginRight: 6 },
    readyText: { fontSize: 10, fontWeight: '800', color: '#F59E0B', letterSpacing: 1 },
    readySummary: { fontSize: 11, color: '#4B5563', flex: 1 },
    goLiveBtn: {
        backgroundColor: '#10B981',
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
    },
    goLiveBtnText: { fontSize: 16, fontWeight: '800', color: '#0A0A14', letterSpacing: 0.2 },
});

export default DriverPublishOutstationRentalScreen;

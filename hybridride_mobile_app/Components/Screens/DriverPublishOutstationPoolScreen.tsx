
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronLeft,
    faArrowsUpDown,
    faCalendarDays,
    faClock,
    faSuitcase,
    faRotateLeft,
    faVenus,
    faLocationDot,
    faChevronRight,
    faCar,
} from '@fortawesome/free-solid-svg-icons';
import CalendarModal from '../Common/CalendarModal';
import TimePickerModal from '../Common/TimePickerModal';
import DriverSeatPreferenceModal, { SeatPricingConfig, SeatDistributionConfig } from '../Common/DriverSeatPreferenceModal';
import { useAuth } from '../Context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import poolService from '../../Services/poolService';

const { width } = Dimensions.get('window');

const POPULAR_DESTINATIONS = ['Warangal', 'Karimnagar', 'Vijayawada', 'Nizamabad'];

// ─────────────────────────────────────────────────────────
// Sub-component: Toggle Row
// ─────────────────────────────────────────────────────────
const ToggleRow = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
}: {
    icon: any;
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
}) => (
    <View style={styles.toggleRow}>
        <View style={styles.toggleIcon}>
            <FontAwesomeIcon icon={icon} size={16} color="#A78BFA" />
        </View>
        <View style={styles.toggleTextCol}>
            <Text style={styles.toggleTitle}>{title}</Text>
            <Text style={styles.toggleSubtitle}>{subtitle}</Text>
        </View>
        <Switch
            trackColor={{ false: '#2D2D45', true: '#7C3AED' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#2D2D45"
            onValueChange={onValueChange}
            value={value}
        />
    </View>
);

// ─────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────
const DriverPublishOutstationPoolScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();

    // ── Route ──────────────────────────────────────────────
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [originCoords, setOriginCoords] = useState<number[] | null>(null);
    const [destinationCoords, setDestinationCoords] = useState<number[] | null>(null);

    // Navigate to location search screen
    const openLocationSearch = (type: 'ORIGIN' | 'DESTINATION') => {
        (navigation as any).navigate('DriverOutstationLocationSearch', {
            type,
            onSelect: (result: { name: string; coords?: number[] }) => {
                if (type === 'ORIGIN') {
                    setOrigin(result.name);
                    if (result.coords) setOriginCoords(result.coords);
                } else {
                    setDestination(result.name);
                    if (result.coords) setDestinationCoords(result.coords);
                }
            },
        });
    };

    // ── Vehicle ────────────────────────────────────────────
    const vehicleType = user?.driverDetails?.vehicle?.type || 'CAR';
    const maxCapacity = (user?.driverDetails?.vehicle as any)?.seatingCapacity || 4;

    // ── Seats ──────────────────────────────────────────────
    const [selectedSeats, setSelectedSeats] = useState(3);

    // ── Fare ───────────────────────────────────────────────
    const [farePerSeat, setFarePerSeat] = useState(450);

    // ── Seat Pricing & Distribution ────────────────────────
    const [seatPricing, setSeatPricing] = useState<SeatPricingConfig>({
        front: 520,
        middle: 450,
        back: 400,
    });
    const [seatDistribution, setSeatDistribution] = useState<SeatDistributionConfig>({
        front: 1,
        middle: 2,
        back: 0,
    });
    const [showSeatModal, setShowSeatModal] = useState(false);

    // ── Date / Time ────────────────────────────────────────
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState('Sat, 26 July');
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedTime, setSelectedTime] = useState('6:00 AM');

    // ── Trip Details ───────────────────────────────────────
    const [hasLuggage, setHasLuggage] = useState(true);
    const [hasReturnTrip, setHasReturnTrip] = useState(false);
    const [hasLadiesSeat, setHasLadiesSeat] = useState(true);

    // ── Popular destination chip ───────────────────────────
    const [selectedPopular, setSelectedPopular] = useState('Warangal');

    // ── Location fetch ─────────────────────────────────────
    // ── Swap route ─────────────────────────────────────────
    const handleSwap = () => {
        const tmpOrigin = origin;
        const tmpOriginCoords = originCoords;
        setOrigin(destination);
        setOriginCoords(destinationCoords);
        setDestination(tmpOrigin);
        setDestinationCoords(tmpOriginCoords);
    };

    // ── Derived values ─────────────────────────────────────
    const earningsPerSeat = Math.round(farePerSeat * 0.85);
    const totalEarnings = earningsPerSeat * selectedSeats;
    const isFormValid = !!(origin && destination && selectedDate && selectedTime);

    // ── Publish ────────────────────────────────────────────
    const handlePublish = async () => {
        try {
            await AsyncStorage.getItem('userToken');

            // Parse '04-Feb-2026' / 'Sat, 26 July' style dates
            const now = new Date();
            const isoDateString = now.toISOString(); // fallback; real parsing in production

            const response = await poolService.publishRide({
                type: 'outstation',
                originName: origin,
                originCoords,
                destinationName: destination,
                destinationCoords,
                scheduledTime: isoDateString,
                vehicle: user?.driverDetails?.vehicle?.model || 'Outstation SUV',
                vehicleType,
                totalSeats: selectedSeats,
                pricePerSeat: farePerSeat,
                seatPricing: {
                    front: seatPricing.front,
                    middle: seatPricing.middle,
                    back: seatPricing.back,
                },
                preferences: {
                    womenOnly: hasLadiesSeat,
                    luggage: hasLuggage,
                    returnTrip: hasReturnTrip,
                },
            });

            if (response.success) {
                navigation.navigate('DriverMyTrips' as never);
            } else {
                Alert.alert('Publish Failed', response.message);
            }
        } catch (error: any) {
            console.error('Publish pool error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to publish. Ensure you are logged in.');
        }
    };

    const originCity = origin ? origin.split(',')[0] : '';
    const destCity = destination ? destination.split(',')[0] : '';

    // ──────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Outstation pool</Text>
                    <Text style={styles.headerSubtitle}>Share an intercity trip and split the cost</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ── Route Card ── */}
                <View style={styles.card}>
                    <View style={styles.routeRow}>

                        {/* Timeline dots */}
                        <View style={styles.timelineCol}>
                            <View style={styles.originDot} />
                            <View style={styles.dashedLine} />
                            <View style={styles.destSquare} />
                        </View>

                        {/* Tappable location fields */}
                        <View style={styles.routeInputsCol}>
                            {/* Origin */}
                            <TouchableOpacity
                                style={styles.locationBlock}
                                onPress={() => openLocationSearch('ORIGIN')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.locationLabelRow}>
                                    <Text style={styles.locationLabel}>LEAVING FROM</Text>
                                    <FontAwesomeIcon icon={faLocationDot} size={12} color="#A78BFA" />
                                </View>
                                <Text
                                    style={[styles.locationValue, !origin && styles.locationPlaceholder]}
                                    numberOfLines={1}
                                >
                                    {originCity || 'Your city'}
                                </Text>
                                <Text style={styles.locationSub} numberOfLines={1}>
                                    {origin ? origin.split(',').slice(1, 3).join(',').trim() : 'Tap to search'}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.routeDivider} />

                            {/* Destination */}
                            <TouchableOpacity
                                style={styles.locationBlock}
                                onPress={() => openLocationSearch('DESTINATION')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.locationLabel}>GOING TO</Text>
                                <Text
                                    style={[styles.locationValue, !destination && styles.locationPlaceholder]}
                                    numberOfLines={1}
                                >
                                    {destCity || 'Destination city'}
                                </Text>
                                <Text style={styles.locationSub}>
                                    {destination ? destination.split(',').slice(1, 3).join(',').trim() : '148 km · ~3h 10m'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Swap button */}
                        <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
                            <FontAwesomeIcon icon={faArrowsUpDown} size={15} color="#A78BFA" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Popular Destinations ── */}
                <Text style={styles.sectionLabel}>
                    POPULAR FROM {originCity.toUpperCase() || 'HYDERABAD'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    {POPULAR_DESTINATIONS.map((city) => (
                        <TouchableOpacity
                            key={city}
                            style={[styles.chip, selectedPopular === city && styles.chipSelected]}
                            onPress={() => {
                                setSelectedPopular(city);
                                setDestination(city);
                            }}
                        >
                            <Text style={[styles.chipText, selectedPopular === city && styles.chipTextSelected]}>
                                {city}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* ── Date & Time ── */}
                <View style={styles.dateTimeRow}>
                    <TouchableOpacity style={styles.dateTimeCard} onPress={() => setShowCalendar(true)}>
                        <FontAwesomeIcon icon={faCalendarDays} size={14} color="#A78BFA" style={{ marginBottom: 8 }} />
                        <Text style={styles.dateTimeLabel}>TRAVEL DATE</Text>
                        <Text style={styles.dateTimeValue}>{selectedDate}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dateTimeCard} onPress={() => setShowTimePicker(true)}>
                        <FontAwesomeIcon icon={faClock} size={14} color="#A78BFA" style={{ marginBottom: 8 }} />
                        <Text style={styles.dateTimeLabel}>DEPART</Text>
                        <Text style={styles.dateTimeValue}>{selectedTime}</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Seats ── */}
                <View style={styles.card}>
                    <View style={styles.seatsTitleRow}>
                        <Text style={styles.cardSectionTitle}>SEATS YOU'RE OFFERING</Text>
                        <Text style={styles.seatsCounter}>{selectedSeats} of {maxCapacity}</Text>
                    </View>
                    <View style={styles.seatsRow}>
                        {Array.from({ length: maxCapacity }, (_, i) => i + 1).map((n) => (
                            <TouchableOpacity
                                key={n}
                                style={[styles.seatBox, selectedSeats >= n && styles.seatBoxSelected]}
                                onPress={() => setSelectedSeats(n)}
                            >
                                <Text style={[styles.seatBoxText, selectedSeats >= n && styles.seatBoxTextSelected]}>
                                    {n}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── Fare Per Seat ── */}
                <View style={styles.card}>
                    <View style={styles.fareRow}>
                        <View style={styles.fareRupeeCircle}>
                            <Text style={styles.fareRupee}>₹</Text>
                        </View>
                        <View style={styles.fareInfo}>
                            <Text style={styles.fareLabel}>BASE FARE PER SEAT</Text>
                            <Text style={styles.fareValue}>
                                ₹{farePerSeat}{' '}
                                <Text style={styles.fareSuggested}>Sanchari suggested</Text>
                            </Text>
                            <Text style={styles.fareEarnings}>
                                You earn ₹{earningsPerSeat} per seat · ₹{totalEarnings} full car
                            </Text>
                        </View>
                        <View style={styles.fareControls}>
                            <TouchableOpacity
                                style={styles.fareBtn}
                                onPress={() => {
                                    const next = Math.max(50, farePerSeat - 10);
                                    setFarePerSeat(next);
                                    setSeatPricing(p => ({
                                        front: Math.round(next * 1.15),
                                        middle: next,
                                        back: Math.max(50, Math.round(next * 0.9)),
                                    }));
                                }}
                            >
                                <Text style={styles.fareBtnText}>−</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.fareBtn}
                                onPress={() => {
                                    const next = farePerSeat + 10;
                                    setFarePerSeat(next);
                                    setSeatPricing(p => ({
                                        front: Math.round(next * 1.15),
                                        middle: next,
                                        back: Math.max(50, Math.round(next * 0.9)),
                                    }));
                                }}
                            >
                                <Text style={styles.fareBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* ── Seat Preferences & Row Pricing ── */}
                <View style={styles.card}>
                    <View style={styles.seatPrefHeaderRow}>
                        <View>
                            <Text style={styles.cardSectionTitle}>SEAT PREFERENCES & ROW PRICING</Text>
                            <Text style={styles.seatPrefSubtitle}>
                                Car layout pricing · Front, Middle & Back rows
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowSeatModal(true)}
                            style={styles.seatPrefCustomizeBtn}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.seatPrefCustomizeText}>Customize ›</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.seatPrefPillRow}>
                        <TouchableOpacity
                            style={styles.outstationSeatPill}
                            onPress={() => setShowSeatModal(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.outstationSeatRowTitle}>FRONT ROW</Text>
                            <Text style={styles.outstationSeatRowPrice}>₹{seatPricing.front}</Text>
                            <Text style={styles.outstationSeatRowCount}>{seatDistribution.front} seat</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.outstationSeatPill}
                            onPress={() => setShowSeatModal(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.outstationSeatRowTitle}>MIDDLE ROW</Text>
                            <Text style={styles.outstationSeatRowPrice}>₹{seatPricing.middle}</Text>
                            <Text style={styles.outstationSeatRowCount}>{seatDistribution.middle} seats</Text>
                        </TouchableOpacity>

                        {seatDistribution.back > 0 && (
                            <TouchableOpacity
                                style={styles.outstationSeatPill}
                                onPress={() => setShowSeatModal(true)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.outstationSeatRowTitle}>BACK ROW</Text>
                                <Text style={styles.outstationSeatRowPrice}>₹{seatPricing.back}</Text>
                                <Text style={styles.outstationSeatRowCount}>{seatDistribution.back} seats</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ── Trip Details ── */}
                <View style={styles.card}>
                    <View style={styles.tripDetailsHeader}>
                        <Text style={styles.cardSectionTitle}>TRIP DETAILS</Text>
                        <Text style={styles.tripDetailsTag}>Set for outstation</Text>
                    </View>

                    <ToggleRow
                        icon={faSuitcase}
                        title="Luggage space"
                        subtitle="Suitcase & trolley room in the boot"
                        value={hasLuggage}
                        onValueChange={setHasLuggage}
                    />
                    <View style={styles.toggleDivider} />

                    <ToggleRow
                        icon={faRotateLeft}
                        title="Return trip"
                        subtitle={`${destCity || 'Destination'} · Sun evening`}
                        value={hasReturnTrip}
                        onValueChange={setHasReturnTrip}
                    />
                    <View style={styles.toggleDivider} />

                    <ToggleRow
                        icon={faVenus}
                        title="Reserve 1 ladies seat"
                        subtitle="1 of 3 seats women-only for the journey"
                        value={hasLadiesSeat}
                        onValueChange={setHasLadiesSeat}
                    />
                    <View style={styles.toggleDivider} />

                    {/* Boarding points row */}
                    <TouchableOpacity
                        style={styles.boardingRow}
                        onPress={() => (navigation as any).navigate('DriverOutstationBoardingPoints', {
                            origin: originCity || 'Hyderabad',
                            destination: destCity || 'Destination',
                            onSave: (savedStops: any[]) => {
                                console.log('Boarding points saved:', savedStops);
                            },
                        })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.toggleIcon}>
                            <FontAwesomeIcon icon={faLocationDot} size={16} color="#A78BFA" />
                        </View>
                        <View style={styles.toggleTextCol}>
                            <Text style={styles.toggleTitle}>Add boarding & drop points</Text>
                            <Text style={styles.toggleSubtitle}>Pick highway stops riders can join at</Text>
                        </View>
                        <FontAwesomeIcon icon={faChevronRight} size={14} color="#4B5563" />
                    </TouchableOpacity>
                </View>

                {/* Spacer for footer */}
                <View style={{ height: 130 }} />
            </ScrollView>

            {/* ── Footer ── */}
            <View style={styles.footer}>
                {isFormValid && (
                    <View style={styles.readyRow}>
                        <View style={styles.readyDot} />
                        <Text style={styles.readyText}>READY TO PUBLISH</Text>
                        <Text style={styles.readySummary} numberOfLines={1}>
                            {'  '}{originCity || 'Origin'} → {destCity || 'Destination'} · {selectedDate} · {selectedSeats} seats · ₹{farePerSeat}
                        </Text>
                    </View>
                )}
                <TouchableOpacity
                    style={[styles.publishBtn, !isFormValid && styles.publishBtnDisabled]}
                    disabled={!isFormValid}
                    onPress={handlePublish}
                    activeOpacity={0.85}
                >
                    <Text style={styles.publishBtnText}>Publish outstation ride</Text>
                </TouchableOpacity>
            </View>

            {/* ── Modals ── */}
            <CalendarModal
                visible={showCalendar}
                onClose={() => setShowCalendar(false)}
                onSelectDate={(date: string) => {
                    setSelectedDate(date);
                    setShowCalendar(false);
                }}
                selectedDate={selectedDate}
                disablePastDates={true}
            />
            <TimePickerModal
                visible={showTimePicker}
                onClose={() => setShowTimePicker(false)}
                onSelectTime={(time: string) => {
                    setSelectedTime(time);
                    setShowTimePicker(false);
                }}
                selectedTime={selectedTime}
            />

            {/* ── Seat Preference Modal ── */}
            <DriverSeatPreferenceModal
                visible={showSeatModal}
                onClose={() => setShowSeatModal(false)}
                basePrice={farePerSeat}
                initialTotalSeats={selectedSeats}
                maxCapacity={Number(maxCapacity) || 4}
                initialPricing={seatPricing}
                initialDistribution={seatDistribution}
                onConfirm={(data) => {
                    setSeatPricing(data.pricing);
                    setSeatDistribution(data.distribution);
                    setSelectedSeats(data.totalSeats);
                }}
            />
        </SafeAreaView>
    );
};

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D1A',
    },

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
        backgroundColor: '#1A1A2E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },

    // ── Content ─────────────────────────────────────────────
    content: {
        paddingHorizontal: 16,
    },

    // ── Card ────────────────────────────────────────────────
    card: {
        backgroundColor: '#13132A',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1E1E38',
    },

    // ── Section Labels ──────────────────────────────────────
    sectionLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#4B5563',
        letterSpacing: 1.2,
        marginBottom: 10,
    },

    // ── Route Card ──────────────────────────────────────────
    routeRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    timelineCol: {
        alignItems: 'center',
        marginRight: 14,
        paddingTop: 24,
        paddingBottom: 10,
    },
    originDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#7C3AED',
        borderWidth: 2,
        borderColor: '#A78BFA',
    },
    dashedLine: {
        width: 2,
        flex: 1,
        borderLeftWidth: 2,
        borderLeftColor: '#2D2D45',
        borderStyle: 'dashed',
        minHeight: 28,
        marginVertical: 5,
    },
    destSquare: {
        width: 10,
        height: 10,
        backgroundColor: '#F97316',
        borderRadius: 2,
    },
    routeInputsCol: {
        flex: 1,
    },
    locationBlock: {
        paddingVertical: 6,
    },
    locationLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    locationLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#4B5563',
        letterSpacing: 1,
    },
    locationInput: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        backgroundColor: 'transparent',
        padding: 0,
        height: 28,
        borderWidth: 0,
    },
    locationValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 2,
        marginBottom: 2,
    },
    locationPlaceholder: {
        color: '#4B5563',
    },
    locationSub: {
        fontSize: 11,
        color: '#4B5563',
        marginTop: 2,
    },
    routeDivider: {
        height: 1,
        backgroundColor: '#1E1E38',
        marginVertical: 8,
    },
    swapButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#0D0D1A',
        borderWidth: 1,
        borderColor: '#2D2D45',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginLeft: 10,
    },

    // ── Chips ───────────────────────────────────────────────
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#13132A',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#2D2D45',
    },
    chipSelected: {
        borderColor: '#A78BFA',
        backgroundColor: 'transparent',
    },
    chipText: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '600',
    },
    chipTextSelected: {
        color: '#A78BFA',
    },

    // ── Date/Time ───────────────────────────────────────────
    dateTimeRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    dateTimeCard: {
        flex: 1,
        backgroundColor: '#13132A',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#1E1E38',
    },
    dateTimeLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#4B5563',
        letterSpacing: 1,
        marginBottom: 4,
    },
    dateTimeValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // ── Seats ───────────────────────────────────────────────
    cardSectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#4B5563',
        letterSpacing: 1,
    },
    seatsTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    seatsCounter: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '600',
    },
    seatsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    seatBox: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 14,
        backgroundColor: '#0D0D1A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2D2D45',
    },
    seatBoxSelected: {
        backgroundColor: '#7C3AED',
        borderColor: '#7C3AED',
    },
    seatBoxText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#4B5563',
    },
    seatBoxTextSelected: {
        color: '#FFFFFF',
    },

    // ── Fare ────────────────────────────────────────────────
    fareRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fareRupeeCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#0D0D1A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#2D2D45',
    },
    fareRupee: {
        color: '#A78BFA',
        fontSize: 18,
        fontWeight: '700',
    },
    fareInfo: {
        flex: 1,
    },
    fareLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#4B5563',
        letterSpacing: 1,
    },
    fareValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 2,
    },
    fareSuggested: {
        fontSize: 11,
        color: '#F59E0B',
        fontWeight: '600',
    },
    fareEarnings: {
        fontSize: 11,
        color: '#4B5563',
        marginTop: 3,
    },
    fareControls: {
        flexDirection: 'row',
        gap: 8,
    },
    fareBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#0D0D1A',
        borderWidth: 1,
        borderColor: '#2D2D45',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fareBtnText: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '300',
        lineHeight: 26,
    },

    // ── Trip Details ────────────────────────────────────────
    tripDetailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    tripDetailsTag: {
        fontSize: 10,
        color: '#4B5563',
        fontWeight: '600',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleIcon: {
        width: 30,
        alignItems: 'center',
        marginRight: 12,
    },
    toggleTextCol: {
        flex: 1,
    },
    toggleTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    toggleSubtitle: {
        fontSize: 11,
        color: '#4B5563',
        marginTop: 2,
    },
    toggleDivider: {
        height: 1,
        backgroundColor: '#0D0D1A',
        marginVertical: 14,
        marginLeft: 42,
    },
    boardingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // ── Footer ──────────────────────────────────────────────
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0D0D1A',
        borderTopWidth: 1,
        borderTopColor: '#1A1A2E',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 28,
    },
    readyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    readyDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#A78BFA',
        marginRight: 6,
    },
    readyText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#A78BFA',
        letterSpacing: 1,
    },
    readySummary: {
        fontSize: 11,
        color: '#4B5563',
        flex: 1,
    },
    publishBtn: {
        backgroundColor: '#10B981',
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
    },
    publishBtnDisabled: {
        opacity: 0.4,
    },
    publishBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0D0D1A',
        letterSpacing: 0.2,
    },
    seatPrefHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    seatPrefSubtitle: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    seatPrefCustomizeBtn: {
        backgroundColor: '#7C3AED20',
        borderColor: '#7C3AED',
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    seatPrefCustomizeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#A78BFA',
    },
    seatPrefPillRow: {
        flexDirection: 'row',
        gap: 8,
    },
    outstationSeatPill: {
        flex: 1,
        backgroundColor: '#131326',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#2D2D45',
        alignItems: 'center',
    },
    outstationSeatRowTitle: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.8,
        marginBottom: 3,
    },
    outstationSeatRowPrice: {
        fontSize: 15,
        fontWeight: '800',
        color: '#10B981',
        marginBottom: 2,
    },
    outstationSeatRowCount: {
        fontSize: 11,
        fontWeight: '600',
        color: '#CBD5E1',
    },
});

export default DriverPublishOutstationPoolScreen;

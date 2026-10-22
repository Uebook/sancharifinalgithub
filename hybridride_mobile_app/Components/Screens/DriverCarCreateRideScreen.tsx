import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronLeft,
    faBolt,
    faCalendarDays,
    faCrosshairs,
    faClock,
    faCar,
    faCheckCircle,
    faChair,
    faInfoCircle,
    faSnowflake,
    faSuitcase,
    faVenus,
    faMinus,
    faPlus,
    faArrowRight,
    faCircleDot,
    faSquare,
} from '@fortawesome/free-solid-svg-icons';
import CalendarModal from '../Common/CalendarModal';
import TimePickerModal from '../Common/TimePickerModal';
import DriverSeatPreferenceModal, { SeatPricingConfig, SeatDistributionConfig } from '../Common/DriverSeatPreferenceModal';
import { Alert } from 'react-native';
import { useAuth } from '../Context/AuthContext';
import { driverService } from '../../Services/driverService';

const DriverCarCreateRideScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [tab, setTab] = useState<'ONETIME' | 'PLANNED'>('ONETIME');

    const [pickup, setPickup] = useState('Set pickup location');
    const [destination, setDestination] = useState('Set drop-off location');
    const [selectedDate, setSelectedDate] = useState('Today, 25 Jul');
    const [selectedTime, setSelectedTime] = useState('09:15 AM');

    const [seatsOffering, setSeatsOffering] = useState(3);

    // Comfort & Preferences
    const [acRide, setAcRide] = useState(true);
    const [luggageSpace, setLuggageSpace] = useState(false);
    const [ladiesSeat, setLadiesSeat] = useState(true);

    // Fare & Seat Preference Pricing
    const [baseFare, setBaseFare] = useState(90);
    const [showSeatModal, setShowSeatModal] = useState(false);
    const [seatPricing, setSeatPricing] = useState<SeatPricingConfig>({
        front: 105,
        middle: 90,
        back: 80,
    });
    const [seatDistribution, setSeatDistribution] = useState<SeatDistributionConfig>({
        front: 1,
        middle: 2,
        back: 0,
    });

    const [showCalendar, setShowCalendar] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [vehicleModel, setVehicleModel] = useState(
        user?.driverDetails?.vehicle?.model ? `${user?.driverDetails?.vehicle?.make || ''} ${user?.driverDetails?.vehicle?.model}`.trim() : 'Car Pool Vehicle'
    );
    const [vehiclePlate, setVehiclePlate] = useState(
        user?.driverDetails?.vehicle?.plateNumber || (user?.driverDetails?.vehicle as any)?.number || 'TS Vehicle'
    );

    useEffect(() => {
        const fetchLiveVehicle = async () => {
            try {
                const res = await driverService.getProfile();
                if (res?.success && res?.data?.driverDetails?.vehicle) {
                    const v = res.data.driverDetails.vehicle;
                    const modelName = `${v.make || ''} ${v.model || ''}`.trim();
                    const plateNum = v.plateNumber || v.number || v.registrationNumber;
                    if (modelName) setVehicleModel(modelName);
                    if (plateNum) setVehiclePlate(plateNum);
                }
            } catch (e) {
                console.log('Error loading live vehicle profile:', e);
            }
        };
        fetchLiveVehicle();
    }, []);

    const totalFarePerSeat = baseFare + (acRide ? 10 : 0);
    const totalEarningsEst = Math.round(totalFarePerSeat * 0.85 * seatsOffering);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitleText}>Create car pool ride</Text>
                    <Text style={styles.headerSubText}>Publish a car pool trip for riders to book</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Segmented Toggle Tabs */}
                <View style={styles.segmentContainer}>
                    <TouchableOpacity
                        style={[styles.segmentTab, tab === 'ONETIME' && styles.segmentTabActive]}
                        onPress={() => setTab('ONETIME')}
                        activeOpacity={0.8}
                    >
                        <FontAwesomeIcon icon={faBolt} size={14} color={tab === 'ONETIME' ? '#3B82F6' : '#64748B'} style={{ marginRight: 8 }} />
                        <Text style={[styles.segmentText, tab === 'ONETIME' && styles.segmentTextActive]}>
                            One-time ride
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.segmentTab, tab === 'PLANNED' && styles.segmentTabActive]}
                        onPress={() => (navigation as any).navigate('DriverCarPlannedRides')}
                        activeOpacity={0.8}
                    >
                        <FontAwesomeIcon icon={faCalendarDays} size={14} color={tab === 'PLANNED' ? '#3B82F6' : '#64748B'} style={{ marginRight: 8 }} />
                        <Text style={[styles.segmentText, tab === 'PLANNED' && styles.segmentTextActive]}>
                            Planned ride
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Pick-up Location Field */}
                <TouchableOpacity
                    style={styles.inputCard}
                    onPress={() => (navigation as any).navigate('DriverBikeDropoffSearch', {
                        type: 'PICKUP',
                        onSelect: (loc: string) => setPickup(loc)
                    })}
                    activeOpacity={0.85}
                >
                    <Text style={styles.fieldLabel}>PICK-UP LOCATION</Text>
                    <View style={styles.fieldRow}>
                        <FontAwesomeIcon icon={faCircleDot} size={16} color="#10B981" style={{ marginRight: 12 }} />
                        <Text style={styles.fieldValueText}>{pickup}</Text>
                        <TouchableOpacity style={styles.targetBtn}>
                            <FontAwesomeIcon icon={faCrosshairs} size={16} color="#3B82F6" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>

                {/* Drop-off Location Field */}
                <TouchableOpacity
                    style={styles.inputCard}
                    onPress={() => (navigation as any).navigate('DriverBikeDropoffSearch', {
                        onSelect: (dest: string) => setDestination(dest)
                    })}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.fieldLabel, { color: '#F87171' }]}>DROP-OFF LOCATION</Text>
                    <View style={styles.fieldRow}>
                        <FontAwesomeIcon icon={faSquare} size={14} color="#F87171" style={{ marginRight: 14 }} />
                        <Text style={styles.fieldValueText}>{destination}</Text>
                    </View>
                </TouchableOpacity>

                {/* Date & Time Row */}
                <View style={styles.dateTimeRow}>
                    <TouchableOpacity
                        style={[styles.inputCard, { flex: 1, marginRight: 6 }]}
                        onPress={() => setShowCalendar(true)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.fieldLabel}>DATE</Text>
                        <View style={styles.fieldRow}>
                            <FontAwesomeIcon icon={faCalendarDays} size={16} color="#3B82F6" style={{ marginRight: 8 }} />
                            <Text style={styles.dateTimeValueText}>{selectedDate}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.inputCard, { flex: 1, marginLeft: 6 }]}
                        onPress={() => setShowTimePicker(true)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.fieldLabel}>TIME</Text>
                        <View style={styles.fieldRow}>
                            <FontAwesomeIcon icon={faClock} size={16} color="#3B82F6" style={{ marginRight: 8 }} />
                            <Text style={styles.dateTimeValueText}>{selectedTime}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Your Car Card */}
                <View style={styles.carCard}>
                    <View style={styles.carIconBox}>
                        <FontAwesomeIcon icon={faCar} size={18} color="#3B82F6" />
                    </View>
                    <View style={styles.carMeta}>
                        <Text style={styles.carLabelText}>YOUR CAR</Text>
                        <Text style={styles.carTitleText}>
                            {vehicleModel} <Text style={styles.plateText}>{vehiclePlate}</Text>
                        </Text>
                    </View>
                    <FontAwesomeIcon icon={faCheckCircle} size={18} color="#10B981" />
                </View>

                {/* Seats You're Offering */}
                <View style={styles.seatsCard}>
                    <View style={styles.seatsHeader}>
                        <Text style={styles.seatsTitleText}>SEATS YOU'RE OFFERING</Text>
                        <Text style={styles.seatsCountBadgeText}>{seatsOffering} seats</Text>
                    </View>

                    <View style={styles.seatGrid}>
                        {[1, 2, 3, 4].map((num) => {
                            const isSelected = num <= seatsOffering;
                            return (
                                <TouchableOpacity
                                    key={num}
                                    style={[styles.seatBox, isSelected && styles.seatBoxSelected]}
                                    onPress={() => setSeatsOffering(num)}
                                    activeOpacity={0.8}
                                >
                                    <FontAwesomeIcon icon={faChair} size={16} color={isSelected ? '#3B82F6' : '#64748B'} style={{ marginBottom: 4 }} />
                                    <Text style={[styles.seatNumText, isSelected && styles.seatNumTextSelected]}>{num}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={styles.seatsNoteRow}>
                        <FontAwesomeIcon icon={faInfoCircle} size={12} color="#64748B" style={{ marginRight: 6 }} />
                        <Text style={styles.seatsNoteText}>Most drivers offer 2-3 seats. Max 4 for comfort.</Text>
                    </View>
                </View>

                {/* Comfort & Preferences Card */}
                <View style={styles.prefsCard}>
                    <View style={styles.prefsHeader}>
                        <View style={styles.prefsTitleRow}>
                            <FontAwesomeIcon icon={faSnowflake} size={14} color="#3B82F6" style={{ marginRight: 6 }} />
                            <Text style={styles.prefsTitleText}>COMFORT & PREFERENCES</Text>
                        </View>
                        <Text style={styles.optionalText}>Optional</Text>
                    </View>

                    {/* AC */}
                    <View style={styles.prefItemRow}>
                        <View style={styles.prefIconBox}>
                            <FontAwesomeIcon icon={faSnowflake} size={16} color="#3B82F6" />
                        </View>
                        <View style={styles.prefMeta}>
                            <Text style={styles.prefTitle}>Air-conditioned ride</Text>
                            <Text style={styles.prefSub}>Riders pay a small AC premium - +₹10/seat</Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#334155', true: '#3B82F6' }}
                            thumbColor="#FFFFFF"
                            onValueChange={setAcRide}
                            value={acRide}
                        />
                    </View>

                    <View style={styles.prefDivider} />

                    {/* Luggage */}
                    <View style={styles.prefItemRow}>
                        <View style={styles.prefIconBox}>
                            <FontAwesomeIcon icon={faSuitcase} size={16} color="#64748B" />
                        </View>
                        <View style={styles.prefMeta}>
                            <Text style={styles.prefTitle}>Luggage space</Text>
                            <Text style={styles.prefSub}>Boot room for bags & trolleys</Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#334155', true: '#3B82F6' }}
                            thumbColor="#FFFFFF"
                            onValueChange={setLuggageSpace}
                            value={luggageSpace}
                        />
                    </View>

                    <View style={styles.prefDivider} />

                    {/* Reserve 1 Ladies Seat */}
                    <View style={styles.prefItemRow}>
                        <View style={[styles.prefIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.12)' }]}>
                            <FontAwesomeIcon icon={faVenus} size={16} color="#EC4899" />
                        </View>
                        <View style={styles.prefMeta}>
                            <Text style={styles.prefTitle}>Reserve 1 ladies seat</Text>
                            <Text style={styles.prefSub}>1 of {seatsOffering} seats kept women-only for safety</Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#334155', true: '#EC4899' }}
                            thumbColor="#FFFFFF"
                            onValueChange={setLadiesSeat}
                            value={ladiesSeat}
                        />
                    </View>
                </View>

                {/* Fare Per Seat Card */}
                <View style={styles.fareCard}>
                    <View style={styles.fareLeft}>
                        <View style={styles.fareIconCircle}>
                            <Text style={styles.fareCurrencySymbol}>₹</Text>
                        </View>
                        <View>
                            <Text style={styles.fareLabelText}>FARE PER SEAT</Text>
                            <View style={styles.fareValueRow}>
                                <Text style={styles.fareAmountText}>₹{baseFare}</Text>
                                {acRide && <Text style={styles.acExtraText}>+ ₹10 AC</Text>}
                            </View>
                            <Text style={styles.fareEarningsSub}>
                                You earn ₹{Math.round(totalFarePerSeat * 0.85)} per seat · ₹{totalEarningsEst} full car
                            </Text>
                        </View>
                    </View>

                    <View style={styles.stepperContainer}>
                        <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => setBaseFare(Math.max(30, baseFare - 10))}
                            activeOpacity={0.8}
                        >
                            <FontAwesomeIcon icon={faMinus} size={14} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => setBaseFare(baseFare + 10)}
                            activeOpacity={0.8}
                        >
                            <FontAwesomeIcon icon={faPlus} size={14} color="#3B82F6" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Seat Preference & Row Pricing Card */}
                <TouchableOpacity
                    style={styles.seatPricingCard}
                    onPress={() => setShowSeatModal(true)}
                    activeOpacity={0.85}
                >
                    <View style={styles.seatPricingHeader}>
                        <View style={styles.seatPricingTitleRow}>
                            <FontAwesomeIcon icon={faCar} size={15} color="#10B981" style={{ marginRight: 8 }} />
                            <Text style={styles.seatPricingTitleText}>SEAT PREFERENCES & ROW PRICING</Text>
                        </View>
                        <Text style={styles.seatPricingCustomizeText}>CUSTOMIZE ›</Text>
                    </View>

                    <View style={styles.rowPricingBadges}>
                        <View style={styles.rowBadge}>
                            <Text style={styles.rowBadgeLabel}>FRONT ROW</Text>
                            <Text style={styles.rowBadgePrice}>₹{seatPricing.front}</Text>
                            <Text style={styles.rowBadgeSeats}>{seatDistribution.front} seat</Text>
                        </View>
                        <View style={styles.rowBadge}>
                            <Text style={styles.rowBadgeLabel}>MIDDLE ROW</Text>
                            <Text style={styles.rowBadgePrice}>₹{seatPricing.middle}</Text>
                            <Text style={styles.rowBadgeSeats}>{seatDistribution.middle} seats</Text>
                        </View>
                        {seatDistribution.back > 0 && (
                            <View style={styles.rowBadge}>
                                <Text style={styles.rowBadgeLabel}>BACK ROW</Text>
                                <Text style={styles.rowBadgePrice}>₹{seatPricing.back}</Text>
                                <Text style={styles.rowBadgeSeats}>{seatDistribution.back} seats</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.seatPricingSubNote}>
                        Tap to change per-row pricing or vehicle interior layout
                    </Text>
                </TouchableOpacity>

                {/* Commute Prompt Card */}
                <View style={styles.plannedPromptCard}>
                    <Text style={styles.plannedPromptTitle}>Daily office commute?</Text>
                    <TouchableOpacity
                        style={styles.plannedPromptBtn}
                        onPress={() => (navigation as any).navigate('DriverCarPlannedRides')}
                        activeOpacity={0.8}
                    >
                        <FontAwesomeIcon icon={faCalendarDays} size={14} color="#3B82F6" style={{ marginRight: 8 }} />
                        <Text style={styles.plannedPromptBtnText}>Create planned rides</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Bottom Creation Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.statusLabelRow}>
                    <View style={styles.blueDot} />
                    <Text style={styles.statusLabelText}>READY TO CREATE</Text>
                </View>

                <Text style={styles.summaryText}>
                    {seatsOffering} seats · Front ₹{seatPricing.front} · Mid ₹{seatPricing.middle} · {acRide ? 'AC' : 'Non-AC'}
                </Text>

                <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => {
                        if (pickup === 'Set pickup location' || destination === 'Set drop-off location') {
                            Alert.alert('Locations Required', 'Please set both your pickup and drop-off locations first.');
                            return;
                        }
                        setShowSeatModal(true);
                    }}
                    activeOpacity={0.85}
                >
                    <Text style={styles.createBtnText}>Set Seat Prices & Create</Text>
                    <FontAwesomeIcon icon={faArrowRight} size={16} color="#000000" />
                </TouchableOpacity>
            </View>

            {/* Seat Preference Pricing Modal */}
            <DriverSeatPreferenceModal
                visible={showSeatModal}
                onClose={() => setShowSeatModal(false)}
                basePrice={totalFarePerSeat}
                initialTotalSeats={seatsOffering}
                maxCapacity={4}
                initialPricing={seatPricing}
                initialDistribution={seatDistribution}
                onConfirm={(data) => {
                    setSeatPricing(data.pricing);
                    setSeatDistribution(data.distribution);
                    setSeatsOffering(data.totalSeats);
                    (navigation as any).navigate('DriverCarChooseRoute', {
                        pickup: pickup,
                        destination: destination,
                        seats: data.totalSeats,
                        pricePerSeat: data.pricing.middle,
                        seatPricing: data.pricing,
                        seatDistribution: data.distribution,
                        estimatedEarnings: data.totalEarnings,
                    });
                }}
            />

            <CalendarModal
                visible={showCalendar}
                onClose={() => setShowCalendar(false)}
                onSelectDate={(date) => setSelectedDate(date)}
                selectedDate={selectedDate}
                disablePastDates={true}
            />

            <TimePickerModal
                visible={showTimePicker}
                onClose={() => setShowTimePicker(false)}
                onSelectTime={(time) => setSelectedTime(time)}
                selectedTime={selectedTime}
            />
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
        paddingBottom: 10,
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
    headerTitleText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    headerSubText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 160,
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 4,
        marginVertical: 14,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    segmentTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    segmentTabActive: {
        backgroundColor: '#0B1527',
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },
    segmentTextActive: {
        color: '#3B82F6',
    },
    inputCard: {
        backgroundColor: '#0F172A',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    fieldLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10B981',
        letterSpacing: 1,
        marginBottom: 8,
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fieldValueText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    dateTimeRow: {
        flexDirection: 'row',
    },
    dateTimeValueText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    targetBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0B1527',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    carCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0B1527',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    carIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    carMeta: {
        flex: 1,
    },
    carLabelText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#3B82F6',
        letterSpacing: 1,
        marginBottom: 2,
    },
    carTitleText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    plateText: {
        color: '#64748B',
        fontSize: 12,
    },
    seatsCard: {
        backgroundColor: '#0F172A',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    seatsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    seatsTitleText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#3B82F6',
        letterSpacing: 1,
    },
    seatsCountBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#3B82F6',
    },
    seatGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    seatBox: {
        width: 64,
        flex: 1,
        marginHorizontal: 4,
        height: 60,
        borderRadius: 14,
        backgroundColor: '#070B14',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    seatBoxSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#60A5FA',
    },
    seatNumText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#64748B',
    },
    seatNumTextSelected: {
        color: '#FFFFFF',
    },
    seatsNoteRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    seatsNoteText: {
        fontSize: 11,
        color: '#64748B',
    },
    prefsCard: {
        backgroundColor: '#0F172A',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    prefsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    prefsTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prefsTitleText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#3B82F6',
        letterSpacing: 1,
    },
    optionalText: {
        fontSize: 11,
        color: '#64748B',
    },
    prefItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    prefIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    prefMeta: {
        flex: 1,
    },
    prefTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    prefSub: {
        fontSize: 11,
        color: '#64748B',
    },
    prefDivider: {
        height: 1,
        backgroundColor: '#1E293B',
        marginVertical: 12,
    },
    fareCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0F172A',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    fareLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    fareIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    fareCurrencySymbol: {
        fontSize: 16,
        fontWeight: '900',
        color: '#3B82F6',
    },
    fareLabelText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#3B82F6',
        letterSpacing: 1,
        marginBottom: 2,
    },
    fareValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fareAmountText: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        marginRight: 8,
    },
    acExtraText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#3B82F6',
    },
    fareEarningsSub: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepperBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0B1527',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#3B82F6',
        marginLeft: 8,
    },
    plannedPromptCard: {
        backgroundColor: '#0F172A',
        borderRadius: 18,
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    plannedPromptTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94A3B8',
        marginBottom: 12,
    },
    plannedPromptBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#3B82F6',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#0B1527',
    },
    plannedPromptBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#3B82F6',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#080C14',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
    },
    statusLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    blueDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3B82F6',
        marginRight: 6,
    },
    statusLabelText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#3B82F6',
        letterSpacing: 1,
    },
    summaryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    createBtn: {
        flexDirection: 'row',
        backgroundColor: '#10B981',
        borderRadius: 24,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000000',
        marginRight: 8,
    },
    seatPricingCard: {
        backgroundColor: '#1E293B',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    seatPricingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    seatPricingTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    seatPricingTitleText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    seatPricingCustomizeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#10B981',
    },
    rowPricingBadges: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8,
    },
    rowBadge: {
        flex: 1,
        backgroundColor: '#0F172A',
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    rowBadgeLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94A3B8',
        marginBottom: 2,
    },
    rowBadgePrice: {
        fontSize: 15,
        fontWeight: '900',
        color: '#2DD4BF',
    },
    rowBadgeSeats: {
        fontSize: 10,
        fontWeight: '600',
        color: '#CBD5E1',
        marginTop: 2,
    },
    seatPricingSubNote: {
        fontSize: 11,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 4,
    },
});

export default DriverCarCreateRideScreen;

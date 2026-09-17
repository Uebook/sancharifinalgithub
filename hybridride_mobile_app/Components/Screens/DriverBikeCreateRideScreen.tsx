import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronLeft,
    faBolt,
    faCalendarDays,
    faCrosshairs,
    faChevronDown,
    faMotorcycle,
    faLock,
    faArrowRight,
    faCircleDot,
    faSquare,
    faMinus,
    faPlus,
    faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import CalendarModal from '../Common/CalendarModal';
import TimePickerModal from '../Common/TimePickerModal';
import { useAuth } from '../Context/AuthContext';
import { driverService } from '../../Services/driverService';

const DriverBikeCreateRideScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [tab, setTab] = useState<'ONETIME' | 'PLANNED'>('ONETIME');

    const [pickup, setPickup] = useState('Set pickup location');
    const [destination, setDestination] = useState('Set drop-off location');
    const [selectedDate, setSelectedDate] = useState('Today, 25 July');
    const [selectedTime, setSelectedTime] = useState('09:15 AM');

    // Dynamic Bike & Price State
    const [pricePerSeat, setPricePerSeat] = useState(50);
    const [vehicleModel, setVehicleModel] = useState(
        user?.driverDetails?.vehicle?.model ? `${user?.driverDetails?.vehicle?.make || ''} ${user?.driverDetails?.vehicle?.model}`.trim() : 'Bike Pool Vehicle'
    );
    const [vehiclePlate, setVehiclePlate] = useState(
        user?.driverDetails?.vehicle?.plateNumber || user?.driverDetails?.vehicle?.number || 'TS Bike'
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

    const [showCalendar, setShowCalendar] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const driverEarningsEst = Math.round(pricePerSeat * 0.85);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitleText}>Create new bike pool ride</Text>
                    <Text style={styles.headerSubText}>Publish a bike pool trip for riders to book</Text>
                </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Segmented Toggle Tabs */}
                <View style={styles.segmentContainer}>
                    <TouchableOpacity
                        style={[styles.segmentTab, tab === 'ONETIME' && styles.segmentTabActive]}
                        onPress={() => setTab('ONETIME')}
                        activeOpacity={0.8}
                    >
                        <FontAwesomeIcon icon={faBolt} size={14} color={tab === 'ONETIME' ? '#10B981' : '#64748B'} style={{ marginRight: 8 }} />
                        <Text style={[styles.segmentText, tab === 'ONETIME' && styles.segmentTextActive]}>
                            One-time ride
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.segmentTab, tab === 'PLANNED' && styles.segmentTabActive]}
                        onPress={() => (navigation as any).navigate('DriverBikePlannedRides')}
                        activeOpacity={0.8}
                    >
                        <FontAwesomeIcon icon={faCalendarDays} size={14} color={tab === 'PLANNED' ? '#10B981' : '#64748B'} style={{ marginRight: 8 }} />
                        <Text style={[styles.segmentText, tab === 'PLANNED' && styles.segmentTextActive]}>
                            Planned ride
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Pickup Input Card */}
                <TouchableOpacity
                    style={styles.inputCard}
                    onPress={() => (navigation as any).navigate('DriverBikeDropoffSearch', {
                        type: 'PICKUP',
                        onSelect: (addr: string) => setPickup(addr)
                    })}
                    activeOpacity={0.85}
                >
                    <Text style={styles.fieldLabel}>PICKUP LOCATION</Text>
                    <View style={styles.fieldRow}>
                        <FontAwesomeIcon icon={faCircleDot} size={16} color="#10B981" style={{ marginRight: 12 }} />
                        <Text style={[styles.fieldValueText, pickup === 'Set pickup location' && { color: '#64748B' }]}>{pickup}</Text>
                        <FontAwesomeIcon icon={faCrosshairs} size={16} color="#10B981" />
                    </View>
                </TouchableOpacity>

                {/* Destination Dropoff Input Card */}
                <TouchableOpacity
                    style={styles.inputCard}
                    onPress={() => (navigation as any).navigate('DriverBikeDropoffSearch', {
                        type: 'DROPOFF',
                        onSelect: (addr: string) => setDestination(addr)
                    })}
                    activeOpacity={0.85}
                >
                    <Text style={styles.fieldLabel}>DESTINATION</Text>
                    <View style={styles.fieldRow}>
                        <FontAwesomeIcon icon={faSquare} size={14} color="#818CF8" style={{ marginRight: 12 }} />
                        <Text style={[styles.fieldValueText, destination === 'Set drop-off location' && { color: '#64748B' }]}>
                            {destination}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Choose Date */}
                <TouchableOpacity
                    style={styles.inputCard}
                    onPress={() => setShowCalendar(true)}
                    activeOpacity={0.85}
                >
                    <Text style={styles.fieldLabel}>CHOOSE DATE</Text>
                    <View style={styles.fieldRow}>
                        <FontAwesomeIcon icon={faCalendarDays} size={18} color="#10B981" style={{ marginRight: 12 }} />
                        <Text style={styles.fieldValueText}>{selectedDate}</Text>
                        <FontAwesomeIcon icon={faChevronDown} size={14} color="#64748B" />
                    </View>
                </TouchableOpacity>

                {/* Select Time Picker */}
                <View style={styles.inputCard}>
                    <Text style={styles.fieldLabel}>SELECT TIME</Text>
                    <TouchableOpacity
                        style={styles.timePickerBox}
                        onPress={() => setShowTimePicker(true)}
                        activeOpacity={0.85}
                    >
                        <View style={styles.timeWheelRow}>
                            <Text style={styles.wheelSubText}>01</Text>
                            <Text style={styles.wheelSubText}>45</Text>
                        </View>
                        <View style={styles.timeSelectedRow}>
                            <Text style={styles.timeValueText}>
                                {selectedTime.split(' ')[0]}
                            </Text>
                            <Text style={styles.timeColon}>:</Text>
                            <Text style={styles.timeValueText}>
                                {selectedTime.split(' ')[1] || '15'}
                            </Text>
                            <Text style={styles.timeAmpmText}>
                                {selectedTime.split(' ')[2] || 'AM'}
                            </Text>
                        </View>
                        <View style={styles.timeWheelRow}>
                            <Text style={styles.wheelSubText}>10</Text>
                            <Text style={styles.wheelSubText}>30</Text>
                            <Text style={styles.wheelSubText}>PM</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Fare Per Seat Card */}
                <View style={styles.fareCard}>
                    <View style={styles.fareLeft}>
                        <View style={styles.fareIconCircle}>
                            <Text style={styles.fareCurrencySymbol}>₹</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fareLabelText}>FARE PER SEAT</Text>
                            <Text style={styles.fareAmountText}>₹{pricePerSeat}</Text>
                            <Text style={styles.fareEarningsSub}>
                                Driver payout ~85% (₹{driverEarningsEst} per seat)
                            </Text>
                        </View>
                    </View>

                    <View style={styles.stepperContainer}>
                        <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => setPricePerSeat(Math.max(20, pricePerSeat - 10))}
                            activeOpacity={0.8}
                        >
                            <FontAwesomeIcon icon={faMinus} size={14} color="#10B981" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => setPricePerSeat(pricePerSeat + 10)}
                            activeOpacity={0.8}
                        >
                            <FontAwesomeIcon icon={faPlus} size={14} color="#10B981" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Dynamic Bike Seat Card */}
                <View style={styles.bikeSeatCard}>
                    <View style={styles.bikeIconBox}>
                        <FontAwesomeIcon icon={faMotorcycle} size={20} color="#10B981" />
                    </View>
                    <View style={styles.bikeSeatMeta}>
                        <Text style={styles.bikeSeatTitle}>{vehicleModel} · 1 pillion seat</Text>
                        <Text style={styles.bikeSeatSub}>{vehiclePlate} · ₹{pricePerSeat} / Seat</Text>
                    </View>
                    <View style={styles.lockIconBox}>
                        <FontAwesomeIcon icon={faLock} size={14} color="#10B981" />
                    </View>
                </View>

                {/* Planned Commute Prompt Card */}
                <View style={styles.plannedPromptCard}>
                    <Text style={styles.plannedPromptTitle}>Have a regular commute to work?</Text>
                    <TouchableOpacity
                        style={styles.plannedPromptBtn}
                        onPress={() => (navigation as any).navigate('DriverBikePlannedRides')}
                        activeOpacity={0.8}
                    >
                        <FontAwesomeIcon icon={faCalendarDays} size={14} color="#10B981" style={{ marginRight: 8 }} />
                        <Text style={styles.plannedPromptBtnText}>Create planned rides</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Bottom Creation Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.statusLabelRow}>
                    <View style={styles.greenDot} />
                    <Text style={styles.statusLabelText}>READY TO CREATE</Text>
                </View>

                <Text style={styles.summaryText} numberOfLines={1}>
                    {pickup.split(',')[0]} → {destination.split(',')[0]} · {selectedDate.includes('Today') ? 'Today' : selectedDate} · ₹{pricePerSeat}/seat
                </Text>

                <TouchableOpacity
                    style={[styles.createBtn, (pickup === 'Set pickup location' || destination === 'Set drop-off location') && styles.createBtnDisabled]}
                    onPress={() => {
                        (navigation as any).navigate('DriverBikeChooseRoute', {
                            pickup: pickup,
                            destination: destination,
                            pricePerSeat: pricePerSeat,
                        });
                    }}
                    disabled={pickup === 'Set pickup location' || destination === 'Set drop-off location'}
                    activeOpacity={0.85}
                >
                    <Text style={styles.createBtnText}>Create new bike ride</Text>
                </TouchableOpacity>
            </View>

            {/* Calendar Modal */}
            <CalendarModal
                visible={showCalendar}
                onClose={() => setShowCalendar(false)}
                onSelectDate={(formatted) => {
                    setSelectedDate(formatted);
                    setShowCalendar(false);
                }}
            />

            {/* Time Picker Modal */}
            <TimePickerModal
                visible={showTimePicker}
                onClose={() => setShowTimePicker(false)}
                onSelectTime={(formattedTime) => {
                    setSelectedTime(formattedTime);
                    setShowTimePicker(false);
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitleText: {
        fontSize: 20,
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
        paddingBottom: 30,
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 4,
        marginBottom: 20,
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
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#334155',
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },
    segmentTextActive: {
        color: '#FFFFFF',
    },
    inputCard: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#334155',
    },
    fieldLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10B981',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fieldValueText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#F8FAFC',
    },
    timePickerBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    timeWheelRow: {
        flexDirection: 'row',
        gap: 16,
        opacity: 0.3,
    },
    wheelSubText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
    },
    timeSelectedRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginVertical: 4,
    },
    timeValueText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    timeColon: {
        fontSize: 28,
        fontWeight: '900',
        color: '#10B981',
        marginHorizontal: 4,
    },
    timeAmpmText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#10B981',
        marginLeft: 8,
    },
    fareCard: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#334155',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fareLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    fareIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    fareCurrencySymbol: {
        color: '#10B981',
        fontSize: 18,
        fontWeight: '900',
    },
    fareLabelText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10B981',
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    fareAmountText: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    fareEarningsSub: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepperBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    bikeSeatCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#334155',
    },
    bikeIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    bikeSeatMeta: {
        flex: 1,
    },
    bikeSeatTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    bikeSeatSub: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    lockIconBox: {
        padding: 4,
    },
    plannedPromptCard: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
        marginTop: 6,
    },
    plannedPromptTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94A3B8',
        marginBottom: 10,
    },
    plannedPromptBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    plannedPromptBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#10B981',
    },
    bottomBar: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    statusLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    greenDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginRight: 6,
    },
    statusLabelText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#10B981',
        letterSpacing: 0.8,
    },
    summaryText: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 12,
    },
    createBtn: {
        backgroundColor: '#10B981',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createBtnDisabled: {
        opacity: 0.5,
    },
    createBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});

export default DriverBikeCreateRideScreen;

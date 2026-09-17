import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronLeft,
    faHome,
    faBriefcase,
    faClock,
    faRoute,
    faChevronRight,
    faCheck,
    faPlus,
    faMinus,
    faTimes,
    faSnowflake,
    faVenus,
    faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { driverService } from '../../Services/driverService';

const DriverCarPlannedRidesScreen = () => {
    const navigation = useNavigation();

    const [homeLocation, setHomeLocation] = useState('Madhapur, Hyderabad');
    const [officeLocation, setOfficeLocation] = useState('Gachibowli ORR, Hyderabad');

    const [homeToOfficeTime, setHomeToOfficeTime] = useState('09:00 AM');
    const [officeToHomeTime, setOfficeToHomeTime] = useState('06:00 PM');
    const [homeToOfficeEnabled, setHomeToOfficeEnabled] = useState(true);
    const [officeToHomeEnabled, setOfficeToHomeEnabled] = useState(true);

    const [pricePerSeat, setPricePerSeat] = useState(90);
    const [seats, setSeats] = useState(3);
    const [isAc, setIsAc] = useState(true);
    const [isLadiesOnly, setIsLadiesOnly] = useState(true);
    const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchCommute = async () => {
            try {
                const res = await driverService.getPlannedCommute();
                if (res?.success && res?.data) {
                    const data = res.data;
                    if (data.homeLocation?.address) setHomeLocation(data.homeLocation.address);
                    if (data.officeLocation?.address) setOfficeLocation(data.officeLocation.address);
                    if (data.homeToOfficeTime?.time) setHomeToOfficeTime(data.homeToOfficeTime.time);
                    if (data.officeToHomeTime?.time) setOfficeToHomeTime(data.officeToHomeTime.time);
                    if (data.pricePerSeat) setPricePerSeat(data.pricePerSeat);
                    if (data.seatPreferences?.seatsCount) setSeats(data.seatPreferences.seatsCount);
                    if (typeof data.seatPreferences?.isAC !== 'undefined') setIsAc(data.seatPreferences.isAC);
                    if (typeof data.seatPreferences?.isLadiesOnly !== 'undefined') setIsLadiesOnly(data.seatPreferences.isLadiesOnly);
                    if (data.activeDays?.length) setSelectedDays(data.activeDays);
                }
            } catch (err) {
                console.error('Failed to load planned commute:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCommute();
    }, []);

    const handleSavePlannedCommute = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const payload = {
                vehicleType: 'CAR',
                homeLocation: { address: homeLocation },
                officeLocation: { address: officeLocation },
                homeToOfficeTime,
                officeToHomeTime,
                pricePerSeat,
                seatPreferences: {
                    seatsCount: seats,
                    isAC: isAc,
                    isLadiesOnly
                },
                activeDays: selectedDays,
            };

            const response = await driverService.savePlannedCommute(payload);
            if (response?.success) {
                Alert.alert('Success', 'Planned car commute updated and saved in DB!');
                navigation.goBack();
            } else {
                Alert.alert('Error', response?.message || 'Failed to save planned commute');
            }
        } catch (error: any) {
            console.error('Save planned commute error:', error);
            Alert.alert('Error', error?.response?.data?.message || 'Failed to save planned commute');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleDay = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter((d) => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitleText}>Planned car pool</Text>
                    <Text style={styles.headerSubText}>Set your daily commute once</Text>
                </View>
                <View style={styles.statusPill}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusPillText}>Active</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Home Location */}
                <TouchableOpacity
                    style={styles.inputCard}
                    onPress={() => {
                        (navigation as any).navigate('DriverBikeDropoffSearch', {
                            type: 'PICKUP',
                            onSelect: (selectedAddr: string) => setHomeLocation(selectedAddr)
                        });
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={styles.fieldLabel}>HOME LOCATION (TAP TO CHANGE)</Text>
                    <View style={styles.fieldRow}>
                        <View style={styles.iconCircleHome}>
                            <FontAwesomeIcon icon={faHome} size={14} color="#10B981" />
                        </View>
                        <Text style={styles.fieldValueText}>{homeLocation || 'Set Home Address'}</Text>
                        {homeLocation ? (
                            <TouchableOpacity onPress={() => setHomeLocation('')}>
                                <FontAwesomeIcon icon={faTimes} size={14} color="#64748B" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </TouchableOpacity>

                {/* Office Location */}
                <TouchableOpacity
                    style={styles.inputCard}
                    onPress={() => {
                        (navigation as any).navigate('DriverBikeDropoffSearch', {
                            type: 'DROPOFF',
                            onSelect: (selectedAddr: string) => setOfficeLocation(selectedAddr)
                        });
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.fieldLabel, { color: '#F87171' }]}>OFFICE LOCATION (TAP TO CHANGE)</Text>
                    <View style={styles.fieldRow}>
                        <View style={styles.iconCircleOffice}>
                            <FontAwesomeIcon icon={faBriefcase} size={14} color="#F87171" />
                        </View>
                        <Text style={styles.fieldValueText}>{officeLocation || 'Set Office Address'}</Text>
                        {officeLocation ? (
                            <TouchableOpacity onPress={() => setOfficeLocation('')}>
                                <FontAwesomeIcon icon={faTimes} size={14} color="#64748B" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </TouchableOpacity>

                {/* Home -> Office Schedule */}
                <View style={styles.inputCard}>
                    <View style={styles.toggleRow}>
                        <View style={styles.toggleLeft}>
                            <View style={styles.iconCircleTime}>
                                <FontAwesomeIcon icon={faClock} size={14} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.scheduleLabel}>HOME → OFFICE</Text>
                                <Text style={styles.scheduleTime}>09:00 AM</Text>
                            </View>
                        </View>
                        <Switch
                            trackColor={{ false: '#334155', true: '#3B82F6' }}
                            thumbColor="#FFFFFF"
                            onValueChange={setHomeToOfficeEnabled}
                            value={homeToOfficeEnabled}
                        />
                    </View>
                </View>

                {/* Office -> Home Schedule */}
                <View style={styles.inputCard}>
                    <View style={styles.toggleRow}>
                        <View style={styles.toggleLeft}>
                            <View style={styles.iconCircleTime}>
                                <FontAwesomeIcon icon={faClock} size={14} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.scheduleLabel}>OFFICE → HOME</Text>
                                <Text style={styles.scheduleTime}>06:00 PM</Text>
                            </View>
                        </View>
                        <Switch
                            trackColor={{ false: '#334155', true: '#3B82F6' }}
                            thumbColor="#FFFFFF"
                            onValueChange={setOfficeToHomeEnabled}
                            value={officeToHomeEnabled}
                        />
                    </View>
                </View>

                {/* Fare Per Seat Card */}
                <View style={styles.inputCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(59, 130, 246, 0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#3B82F6' }}>
                                <Text style={{ color: '#3B82F6', fontSize: 16, fontWeight: '900' }}>₹</Text>
                            </View>
                            <View>
                                <Text style={styles.fieldLabel}>PLANNED COMMUTE FARE PER SEAT</Text>
                                <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF' }}>₹{pricePerSeat} / seat</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity
                                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' }}
                                onPress={() => setPricePerSeat(Math.max(30, pricePerSeat - 10))}
                                activeOpacity={0.8}
                            >
                                <FontAwesomeIcon icon={faMinus} size={12} color="#3B82F6" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' }}
                                onPress={() => setPricePerSeat(pricePerSeat + 10)}
                                activeOpacity={0.8}
                            >
                                <FontAwesomeIcon icon={faPlus} size={12} color="#3B82F6" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Seats / Ride + AC & Ladies Preferences Row */}
                <View style={styles.seatsPrefsRow}>
                    {/* Stepper */}
                    <View style={styles.seatsStepperCard}>
                        <Text style={styles.stepperLabel}>SEATS / RIDE</Text>
                        <View style={styles.stepperControls}>
                            <TouchableOpacity
                                style={styles.stepperCircleBtn}
                                onPress={() => setSeats(Math.max(1, seats - 1))}
                                activeOpacity={0.8}
                            >
                                <FontAwesomeIcon icon={faMinus} size={12} color="#3B82F6" />
                            </TouchableOpacity>
                            <Text style={styles.stepperNumText}>{seats}</Text>
                            <TouchableOpacity
                                style={styles.stepperCircleBtn}
                                onPress={() => setSeats(Math.min(4, seats + 1))}
                                activeOpacity={0.8}
                            >
                                <FontAwesomeIcon icon={faPlus} size={12} color="#3B82F6" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* AC Badge */}
                    <TouchableOpacity
                        style={[styles.prefBadge, isAc && styles.prefBadgeAcActive]}
                        onPress={() => setIsAc(!isAc)}
                        activeOpacity={0.8}
                    >
                        <FontAwesomeIcon icon={faSnowflake} size={14} color={isAc ? '#3B82F6' : '#64748B'} style={{ marginRight: 6 }} />
                        <Text style={[styles.prefBadgeText, isAc && { color: '#3B82F6' }]}>AC</Text>
                    </TouchableOpacity>

                    {/* Ladies Badge */}
                    <TouchableOpacity
                        style={[styles.prefBadge, isLadiesOnly && styles.prefBadgeLadiesActive]}
                        onPress={() => setIsLadiesOnly(!isLadiesOnly)}
                        activeOpacity={0.8}
                    >
                        <FontAwesomeIcon icon={faVenus} size={14} color={isLadiesOnly ? '#EC4899' : '#64748B'} style={{ marginRight: 6 }} />
                        <Text style={[styles.prefBadgeText, isLadiesOnly && { color: '#EC4899' }]}>Ladies</Text>
                    </TouchableOpacity>
                </View>

                {/* Preferred Route Card */}
                <TouchableOpacity
                    style={styles.routePromptCard}
                    onPress={() => (navigation as any).navigate('DriverCarChooseRoute', {
                        pickup: homeLocation,
                        destination: officeLocation,
                    })}
                    activeOpacity={0.8}
                >
                    <View style={styles.iconCircleRoute}>
                        <FontAwesomeIcon icon={faRoute} size={14} color="#6366F1" />
                    </View>
                    <View style={styles.routePromptMeta}>
                        <Text style={styles.routePromptTitle}>Going on a different route?</Text>
                        <Text style={styles.routePromptSub}>Change your preferred route</Text>
                    </View>
                    <FontAwesomeIcon icon={faChevronRight} size={14} color="#64748B" />
                </TouchableOpacity>

                {/* Days Section */}
                <View style={styles.daysSection}>
                    <Text style={styles.daysTitle}>Days you'll be travelling</Text>
                    <View style={styles.daysGrid}>
                        {daysList.map((day) => {
                            const isSelected = selectedDays.includes(day);
                            return (
                                <View key={day} style={styles.dayCol}>
                                    <TouchableOpacity
                                        style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
                                        onPress={() => toggleDay(day)}
                                        activeOpacity={0.8}
                                    >
                                        <FontAwesomeIcon
                                            icon={isSelected ? faCheck : faPlus}
                                            size={14}
                                            color={isSelected ? '#FFFFFF' : '#64748B'}
                                        />
                                    </TouchableOpacity>
                                    <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                                        {day}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Notice */}
                <View style={styles.noticeRow}>
                    <FontAwesomeIcon icon={faInfoCircle} size={12} color="#3B82F6" style={{ marginRight: 6 }} />
                    <Text style={styles.noticeText}>
                        {seats} seats · {isAc ? 'AC' : 'Non-AC'} · {isLadiesOnly ? 'ladies seat' : 'all seats'} · applies to {selectedDays.length} days
                    </Text>
                </View>

            </ScrollView>

            {/* Bottom Confirm Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleSavePlannedCommute}
                    disabled={isSaving}
                    activeOpacity={0.85}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#000000" size="small" />
                    ) : (
                        <Text style={styles.confirmBtnText}>Confirm planned rides</Text>
                    )}
                </TouchableOpacity>
            </View>
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
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0B251E',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginRight: 6,
    },
    statusPillText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10B981',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    inputCard: {
        backgroundColor: '#0F172A',
        borderRadius: 18,
        padding: 16,
        marginTop: 14,
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
    iconCircleHome: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconCircleOffice: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(248, 113, 113, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconCircleTime: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    fieldValueText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scheduleLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    scheduleTime: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    seatsPrefsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
    },
    seatsStepperCard: {
        flex: 1.4,
        backgroundColor: '#0F172A',
        borderRadius: 18,
        padding: 12,
        borderWidth: 1,
        borderColor: '#1E293B',
        marginRight: 8,
    },
    stepperLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    stepperControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepperCircleBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#0B1527',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    stepperNumText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    prefBadge: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        backgroundColor: '#0F172A',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#1E293B',
        marginHorizontal: 4,
    },
    prefBadgeAcActive: {
        backgroundColor: '#0B1527',
        borderColor: '#3B82F6',
    },
    prefBadgeLadiesActive: {
        backgroundColor: '#270B1A',
        borderColor: '#EC4899',
    },
    prefBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748B',
    },
    routePromptCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 18,
        padding: 16,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    iconCircleRoute: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    routePromptMeta: {
        flex: 1,
    },
    routePromptTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    routePromptSub: {
        fontSize: 12,
        fontWeight: '700',
        color: '#818CF8',
    },
    daysSection: {
        marginTop: 20,
    },
    daysTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 14,
    },
    daysGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayCol: {
        alignItems: 'center',
    },
    dayBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    dayBtnSelected: {
        backgroundColor: '#3B82F6',
    },
    dayLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
    },
    dayLabelSelected: {
        color: '#3B82F6',
    },
    noticeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    noticeText: {
        fontSize: 12,
        color: '#64748B',
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
    confirmBtn: {
        backgroundColor: '#10B981',
        borderRadius: 24,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000000',
    },
});

export default DriverCarPlannedRidesScreen;

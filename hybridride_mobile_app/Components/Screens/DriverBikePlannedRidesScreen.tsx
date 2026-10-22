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
    faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { driverService } from '../../Services/driverService';

const DriverBikePlannedRidesScreen = () => {
    const navigation = useNavigation();

    const [homeLocation, setHomeLocation] = useState('Madhapur, Hyderabad');
    const [officeLocation, setOfficeLocation] = useState('Gachibowli ORR, Hyderabad');
    const [homeToOfficeTime, setHomeToOfficeTime] = useState('09:00 AM');
    const [officeToHomeTime, setOfficeToHomeTime] = useState('06:00 PM');

    const [homeToOfficeEnabled, setHomeToOfficeEnabled] = useState(true);
    const [officeToHomeEnabled, setOfficeToHomeEnabled] = useState(true);

    const [pricePerSeat, setPricePerSeat] = useState(50);
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
                    if (data.activeDays?.length) setSelectedDays(data.activeDays);
                }
            } catch (err) {
                console.error('Failed to load planned bike commute:', err);
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
                vehicleType: 'BIKE',
                homeLocation: { address: homeLocation },
                officeLocation: { address: officeLocation },
                homeToOfficeTime,
                officeToHomeTime,
                pricePerSeat,
                activeDays: selectedDays,
            };

            const response = await driverService.savePlannedCommute(payload);
            if (response?.success) {
                Alert.alert('Success', 'Planned bike commute updated and saved in DB!');
                navigation.goBack();
            } else {
                Alert.alert('Error', response?.message || 'Failed to save planned commute');
            }
        } catch (error: any) {
            console.error('Save planned bike commute error:', error);
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
                    <Text style={styles.headerTitleText}>Planned rides</Text>
                    <Text style={styles.headerSubText}>Set your daily commute once</Text>
                </View>
                <View style={styles.statusPill}>
                    <View style={[styles.statusDot, { backgroundColor: homeToOfficeEnabled ? '#10B981' : '#64748B' }]} />
                    <Text style={styles.statusPillText}>{homeToOfficeEnabled ? 'Active' : 'Inactive'}</Text>
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

                {/* Home -> Office Time Schedule */}
                <View style={styles.inputCard}>
                    <View style={styles.toggleRow}>
                        <View style={styles.toggleLeft}>
                            <View style={styles.iconCircleTime}>
                                <FontAwesomeIcon icon={faClock} size={14} color="#10B981" />
                            </View>
                            <View>
                                <Text style={styles.scheduleLabel}>HOME → OFFICE</Text>
                                <Text style={styles.scheduleTime}>09:00 AM</Text>
                            </View>
                        </View>
                        <Switch
                            trackColor={{ false: '#334155', true: '#10B981' }}
                            thumbColor="#FFFFFF"
                            onValueChange={setHomeToOfficeEnabled}
                            value={homeToOfficeEnabled}
                        />
                    </View>
                </View>

                {/* Office -> Home Time Schedule */}
                <View style={styles.inputCard}>
                    <View style={styles.toggleRow}>
                        <View style={styles.toggleLeft}>
                            <View style={styles.iconCircleTime}>
                                <FontAwesomeIcon icon={faClock} size={14} color="#10B981" />
                            </View>
                            <View>
                                <Text style={styles.scheduleLabel}>OFFICE → HOME</Text>
                                <Text style={styles.scheduleTime}>06:00 PM</Text>
                            </View>
                        </View>
                        <Switch
                            trackColor={{ false: '#334155', true: '#10B981' }}
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
                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(16, 185, 129, 0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#10B981' }}>
                                <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '900' }}>₹</Text>
                            </View>
                            <View>
                                <Text style={styles.fieldLabel}>PLANNED COMMUTE FARE PER SEAT</Text>
                                <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF' }}>₹{pricePerSeat} / seat</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity
                                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' }}
                                onPress={() => setPricePerSeat(Math.max(20, pricePerSeat - 10))}
                                activeOpacity={0.8}
                            >
                                <FontAwesomeIcon icon={faMinus} size={12} color="#10B981" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' }}
                                onPress={() => setPricePerSeat(pricePerSeat + 10)}
                                activeOpacity={0.8}
                            >
                                <FontAwesomeIcon icon={faPlus} size={12} color="#10B981" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Different Route Prompt */}
                <TouchableOpacity
                    style={styles.routePromptCard}
                    onPress={() => (navigation as any).navigate('DriverBikeChooseRoute', {
                        pickup: homeLocation,
                        destination: officeLocation
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

                {/* Days You'll Be Travelling */}
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
                                            color={isSelected ? '#000000' : '#64748B'}
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
                        Changes apply to all {selectedDays.length} selected days
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
        backgroundColor: '#1E293B',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#334155',
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
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
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
        backgroundColor: '#10B981',
    },
    dayLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
    },
    dayLabelSelected: {
        color: '#10B981',
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

export default DriverBikePlannedRidesScreen;

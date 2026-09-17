import React, { useState, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    Dimensions,
    Modal,
    ScrollView,
    Image,
    PermissionsAndroid,
    Platform,
    Alert
} from 'react-native';
import axios from 'axios';
import GetLocation from 'react-native-get-location';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft,
    faLocationDot,
    faArrowsUpDown,
    faCalendar,
    faUser,
    faLightbulb,
    faMinus,
    faPlus,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '../../Config/maps';
import { useRef } from 'react';

import BottomNavBar from '../Navigation/BottomNavBar';
import TrendingRoutesSection, { TrendingRouteItem } from '../Common/TrendingRoutesSection';

const { width, height } = Dimensions.get('window');

const OutstationScreen = () => {
    const navigation = useNavigation();
    const [fromLocation, setFromLocation] = useState('');
    const [toLocation, setToLocation] = useState('');
    const [fromCoords, setFromCoords] = useState('');
    const [toCoords, setToCoords] = useState('');
    const [date, setDate] = useState('');
    const [seats, setSeats] = useState(1);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const fromRef = useRef<GooglePlacesAutocompleteRef>(null);
    const toRef = useRef<GooglePlacesAutocompleteRef>(null);

    const incrementSeats = () => {
        if (seats < 20) setSeats(seats + 1);
    };

    const decrementSeats = () => {
        if (seats > 1) setSeats(seats - 1);
    };

    const fetchCurrentLocation = async () => {
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                ]);

                if (
                    granted['android.permission.ACCESS_FINE_LOCATION'] !== PermissionsAndroid.RESULTS.GRANTED ||
                    granted['android.permission.ACCESS_COARSE_LOCATION'] !== PermissionsAndroid.RESULTS.GRANTED
                ) {
                    Alert.alert("Permission Denied", "Please grant location permissions to use this feature.");
                    return;
                }

                try {
                    await promptForEnableLocationIfNeeded({
                        interval: 10000,
                    });
                } catch (err) {
                    console.log("GPS Enable Prompt Error/Cancel:", err);
                }
            }

            const location = await GetLocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 30000,
            });

            const { latitude, longitude } = location;
            setFromCoords(`${longitude},${latitude}`);

            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
            );

            if (response.data.status === 'OK') {
                const address = response.data.results[0].formatted_address;
                setFromLocation(address);
                fromRef.current?.setAddressText(address);
            } else {
                console.error("Geocoding failed:", response.data.status);
            }
        } catch (error: any) {
            console.error("Location Fetch Error:", error);
            Alert.alert("Error", "Could not determine location. Please check your GPS settings.");
        }
    };

    const isFormValid = fromLocation.trim() !== '' && toLocation.trim() !== '' && date !== '';

    const handleSearch = () => {
        if (isFormValid) {
            (navigation as any).navigate('OutstationModes', {
                fromLocation,
                toLocation,
                fromCoords,
                toCoords,
                date,
                seats
            });
        }
    };

    const handleSelectTrendingRoute = (route: TrendingRouteItem) => {
        const pickup = route.pickup || (route.name.includes('to') ? route.name.split(/to|-/i)[0].trim() : 'Hyderabad');
        const destination = route.destination || (route.name.includes('to') ? route.name.split(/to|-/i)[1]?.trim() : 'Warangal');
        setFromLocation(pickup);
        setToLocation(destination);
        fromRef.current?.setAddressText(pickup);
        toRef.current?.setAddressText(destination);

        const activeDate = date || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        if (!date) setDate(activeDate);

        (navigation as any).navigate('OutstationModes', {
            fromLocation: pickup,
            toLocation: destination,
            fromCoords,
            toCoords,
            date: activeDate,
            seats: Number(route.seats) || seats || 1
        });
    };

    const generateCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before start of month
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const calendarDays = useMemo(() => generateCalendar(), [currentMonth]);

    const changeMonth = (increment: number) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + increment);
        setCurrentMonth(newMonth);
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const handleDateSelect = (dateObj: Date) => {
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        setDate(formattedDate);
        setShowDatePicker(false);
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <FontAwesomeIcon icon={faArrowLeft} size={20} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Find Outstation Ride</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    {/* Location Card */}
                    <View style={[styles.card, { zIndex: 1000, elevation: 100, overflow: 'visible' }]}>
                        <View style={styles.locationRow}>
                            <View style={styles.timelineContainer}>
                                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                                <View style={styles.dottedLine} />
                                <View style={[styles.square, { backgroundColor: '#111827' }]} />
                            </View>

                            <View style={styles.inputsContainer}>
                                <View style={[styles.inputGroup, { zIndex: 100, overflow: 'visible' }]}>
                                    <Text style={styles.label}>FROM</Text>
                                    <View style={styles.inputWithIcon}>
                                        <GooglePlacesAutocomplete
                                            ref={fromRef}
                                            placeholder="Enter start location"
                                            onPress={(data, details = null) => {
                                                setFromLocation(data.description);
                                                if (details) {
                                                    const { lat, lng } = details.geometry.location;
                                                    setFromCoords(`${lng},${lat}`);
                                                }
                                            }}
                                            query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
                                            fetchDetails={true}
                                            enablePoweredByContainer={false}
                                            minLength={2}
                                            debounce={400}
                                            keyboardShouldPersistTaps="handled"
                                            textInputProps={{
                                                placeholderTextColor: "#9CA3AF"
                                            }}
                                            styles={{
                                                container: { flex: 1, overflow: 'visible' },
                                                textInput: { ...styles.input, paddingVertical: 0, height: 40 },
                                                listView: { position: 'absolute', top: 45, left: 0, right: 0, zIndex: 1000, backgroundColor: '#FFF', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, borderRadius: 12 }
                                            }}
                                            renderRightButton={() => (
                                                <TouchableOpacity onPress={fetchCurrentLocation} style={{ justifyContent: 'center', paddingRight: 0 }}>
                                                    <FontAwesomeIcon icon={faLocationDot} size={18} color="#10B981" />
                                                </TouchableOpacity>
                                            )}
                                        />
                                    </View>
                                </View>
                                <View style={[styles.divider, { zIndex: 1 }]} />
                                <View style={[styles.inputGroup, { zIndex: 99, overflow: 'visible' }]}>
                                    <Text style={styles.label}>TO</Text>
                                    <View style={styles.inputWithIcon}>
                                        <GooglePlacesAutocomplete
                                            ref={toRef}
                                            placeholder="Select Destination"
                                            onPress={(data, details = null) => {
                                                setToLocation(data.description);
                                                if (details) {
                                                    const { lat, lng } = details.geometry.location;
                                                    setToCoords(`${lng},${lat}`);
                                                }
                                            }}
                                            query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
                                            fetchDetails={true}
                                            enablePoweredByContainer={false}
                                            minLength={2}
                                            debounce={400}
                                            keyboardShouldPersistTaps="handled"
                                            textInputProps={{
                                                placeholderTextColor: "#9CA3AF"
                                            }}
                                            styles={{
                                                container: { flex: 1, overflow: 'visible' },
                                                textInput: { ...styles.input, paddingVertical: 0, height: 40 },
                                                listView: { position: 'absolute', top: 45, left: 0, right: 0, zIndex: 1000, backgroundColor: '#FFF', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, borderRadius: 12 }
                                            }}
                                        />
                                    </View>
                                </View>
                            </View>

                            <View style={styles.swapButtonContainer}>
                                <TouchableOpacity style={styles.swapButton}>
                                    <FontAwesomeIcon icon={faArrowsUpDown} size={14} color="#10B981" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Date and Seats Card */}
                    <View style={[styles.card, { marginTop: 16 }]}>
                        <View style={styles.row}>
                            {/* Date Selection */}
                            <TouchableOpacity
                                style={[styles.inputGroup, { flex: 1 }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.label}>DATE</Text>
                                <View style={styles.iconInput}>
                                    <FontAwesomeIcon icon={faCalendar} size={16} color="#10B981" style={{ marginRight: 8 }} />
                                    <Text style={[styles.inputText, !date && styles.placeholderText]}>
                                        {date || "Select Date"}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <View style={{ width: 16 }} />

                            {/* Seat Selector */}
                            <View style={[styles.inputGroup, { flex: 0.6 }]}>
                                <Text style={styles.label}>SEATS</Text>
                                <View style={styles.seatsInput}>
                                    <TouchableOpacity onPress={decrementSeats} style={styles.seatButton}>
                                        <FontAwesomeIcon icon={faMinus} size={12} color="#111827" />
                                    </TouchableOpacity>
                                    <Text style={styles.seatsText}>{seats}</Text>
                                    <TouchableOpacity onPress={incrementSeats} style={styles.seatButton}>
                                        <FontAwesomeIcon icon={faPlus} size={12} color="#111827" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                        style={[styles.searchButton, !isFormValid && styles.searchButtonDisabled]}
                        onPress={handleSearch}
                        disabled={!isFormValid}
                    >
                        <Text style={[styles.searchButtonText, !isFormValid && styles.searchButtonTextDisabled]}>
                            Search & Book Ride
                        </Text>
                    </TouchableOpacity>

                    {/* Trending Routes Section (Connected to Admin Panel) */}
                    <TrendingRoutesSection onSelectRoute={handleSelectTrendingRoute} />
                </ScrollView>

            </SafeAreaView>
            <BottomNavBar activeTab="RIDES" />

            {/* Calendar Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Date</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <FontAwesomeIcon icon={faTimes} size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>

                        {/* Calendar Header */}
                        <View style={styles.calendarHeader}>
                            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavButton}>
                                <FontAwesomeIcon icon={faArrowLeft} size={16} color="#4B5563" />
                            </TouchableOpacity>
                            <Text style={styles.monthTitle}>
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </Text>
                            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavButton}>
                                <FontAwesomeIcon icon={faArrowLeft} size={16} color="#4B5563" style={{ transform: [{ rotate: '180deg' }] }} />
                            </TouchableOpacity>
                        </View>

                        {/* Days Header */}
                        <View style={styles.daysHeader}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <Text key={day} style={styles.dayLabel}>{day}</Text>
                            ))}
                        </View>

                        {/* Days Grid */}
                        <View style={styles.daysGrid}>
                            {calendarDays.map((day, index) => {
                                if (!day) return <View key={index} style={styles.dayCell} />;

                                const isSelected = date === day.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                                const isToday = isSameDay(day, new Date());
                                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.dayCell,
                                            isSelected && styles.selectedDayCell,
                                            isToday && !isSelected && styles.todayCell
                                        ]}
                                        onPress={() => !isPast && handleDateSelect(day)}
                                        disabled={isPast}
                                    >
                                        <Text style={[
                                            styles.dayText,
                                            isSelected && styles.selectedDayText,
                                            isPast && styles.disabledDayText
                                        ]}>
                                            {day.getDate()}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    locationRow: {
        flexDirection: 'row',
    },
    timelineContainer: {
        alignItems: 'center',
        paddingTop: 24, // Align with first input text baselineish
        marginRight: 16,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    dottedLine: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
        borderStyle: 'dotted',
        borderWidth: 1,
        borderColor: '#E5E7EB', // fallback if dotted not supported well on View
    },
    square: {
        width: 10,
        height: 10,
        borderRadius: 2,
    },
    inputsContainer: {
        flex: 1,
        overflow: 'visible',
    },
    inputGroup: {
        marginBottom: 4,
        overflow: 'visible',
    },
    inputWithIcon:{
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'visible',
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    input: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        paddingVertical: 8,
        paddingHorizontal: 0,
    },
    inputText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    placeholderText: {
        color: '#9CA3AF'
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    swapButtonContainer: {
        justifyContent: 'center',
        paddingLeft: 12,
    },
    swapButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12, // More padding since it's a touchable now
    },
    seatsInput: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
        paddingHorizontal: 6,
    },
    seatButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    seatsText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
        marginHorizontal: 8,
    },
    infoTip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB', // Light yellow
        padding: 12,
        borderRadius: 12,
        marginTop: 20,
    },
    infoText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
    },
    searchButton: {
        backgroundColor: '#111827', // Enabled: Dark
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 40,
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    searchButtonDisabled: {
        backgroundColor: '#E5E7EB', // Disabled: Gray
        shadowOpacity: 0,
        elevation: 0,
    },
    searchButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    searchButtonTextDisabled: {
        color: '#9CA3AF',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        height: '65%', // Slightly taller for calendar
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    // Calendar Styles
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    monthNavButton: {
        padding: 8,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    daysHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    dayLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        width: width / 7 - 10,
        textAlign: 'center',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    dayCell: {
        width: width / 7 - 10,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        marginBottom: 8,
    },
    selectedDayCell: {
        backgroundColor: '#10B981',
    },
    todayCell: {
        borderWidth: 1,
        borderColor: '#10B981',
    },
    dayText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    selectedDayText: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
    disabledDayText: {
        color: '#E5E7EB',
    },
});

export default OutstationScreen;

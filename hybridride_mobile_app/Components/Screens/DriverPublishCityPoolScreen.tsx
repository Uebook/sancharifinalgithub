
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Switch,
    Platform,
    PermissionsAndroid
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faChair, faSuitcase, faUserFriends, faCalendarDays, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import CalendarModal from '../Common/CalendarModal';
import TimePickerModal from '../Common/TimePickerModal';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '../../Config/maps';
import { useAuth } from '../Context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import poolService from '../../Services/poolService';
import GetLocation from 'react-native-get-location';
import { getCurrentLocationAddress } from '../../Services/directionsService';


const DriverPublishCityPoolScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();

    // Seat Counters
    const [frontSeatCount, setFrontSeatCount] = useState(1);
    const [middleRowCount, setMiddleRowCount] = useState(2);
    const [backRowCount, setBackRowCount] = useState(0);

    // Route State
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [originCoords, setOriginCoords] = useState<number[] | null>(null);
    const [destinationCoords, setDestinationCoords] = useState<number[] | null>(null);
    const originRef = React.useRef<any>(null);

    // Vehicle Context
    const vehicleType = user?.driverDetails?.vehicle?.type || 'CAR';
    const maxCapacity = (user?.driverDetails?.vehicle as any)?.seatingCapacity || 4;

    // Initial counts based on vehicleType
    React.useEffect(() => {
        if (vehicleType === 'BIKE') {
            setFrontSeatCount(1);
            setMiddleRowCount(0);
            setBackRowCount(0);
        } else if (vehicleType === 'AUTO') {
            setFrontSeatCount(0);
            setMiddleRowCount(3);
            setBackRowCount(0);
        }
    }, [vehicleType, maxCapacity]);

    // Toggle
    const [isWomenOnly, setIsWomenOnly] = useState(false);

    // Price per Row
    const [frontPrice, setFrontPrice] = useState('15');
    const [middlePrice, setMiddlePrice] = useState('12');
    const [backPrice, setBackPrice] = useState('10');

    // Calendar
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState('dd-mm-yyyy');

    // Time Picker
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedTime, setSelectedTime] = useState('hh:mm');

    const increment = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, rowMax: number) => {
        const currentTotal = frontSeatCount + middleRowCount + backRowCount;
        if (currentTotal < maxCapacity && value < rowMax) {
            setter(value + 1);
        } else if (currentTotal >= maxCapacity) {
            Alert.alert("Capacity Reached", `Your vehicle can only take ${maxCapacity} passengers.`);
        }
    };

    const decrement = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
        if (value > 0) setter(value - 1);
    };

    const handleGetCurrentLocation = async () => {
        try {
            const res = await getCurrentLocationAddress();
            if (res) {
                setOrigin(res.address);
                originRef.current?.setAddressText(res.address);
                setOriginCoords([res.longitude, res.latitude]);
            }
        } catch (error: any) {
            console.error("Location Fetch Error:", error);
            Alert.alert("Error", "Could not determine location. Please check your GPS settings.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Publish City Pool</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {/* Route Section */}
                <View style={[styles.card, { zIndex: 1000, elevation: 10, overflow: 'visible' }]}>
                    <View style={[styles.routeContainer, { zIndex: 1000, overflow: 'visible' }]}>
                        <View style={styles.timeline}>
                            <View style={[styles.dot, { backgroundColor: '#2DD4BF' }]} />
                            <View style={styles.line} />
                            <View style={[styles.dot, { backgroundColor: '#1E293B', borderRadius: 2 }]} />
                        </View>
                        <View style={[styles.routeInputs, { zIndex: 1000, overflow: 'visible' }]}>
                            <View style={[styles.inputWrapper, { zIndex: 2000, elevation: 20, overflow: 'visible' }]}>
                                <Text style={styles.inputLabel}>FROM</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                        <GooglePlacesAutocomplete
                                            ref={originRef}
                                            placeholder="Select Origin"
                                            fetchDetails={true}
                                            onPress={(data, details = null) => {
                                                setOrigin(data.description);
                                                if (details) {
                                                    setOriginCoords([details.geometry.location.lng, details.geometry.location.lat]);
                                                }
                                            }}
                                            query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
                                            enablePoweredByContainer={false}
                                            minLength={2}
                                            debounce={400}
                                            keyboardShouldPersistTaps="handled"
                                            textInputProps={{
                                                placeholderTextColor: '#94A3B8',
                                            }}
                                            styles={{
                                                container: { flex: 0, overflow: 'visible' },
                                                textInput: { ...styles.textInput, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 },
                                                listView: { position: 'absolute', top: 58, left: 0, right: 0, zIndex: 9999, elevation: 99, backgroundColor: '#FFF', borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 } }
                                            }}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.textInput, { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, paddingHorizontal: 16, borderLeftWidth: 1, borderColor: '#E5E7EB', borderStyle: 'solid', justifyContent: 'center' }]}
                                        onPress={fetchCurrentLocation}
                                    >
                                        <FontAwesomeIcon icon={faLocationDot} size={18} color="#2DD4BF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={[styles.inputWrapper, { zIndex: 1000, elevation: 10, overflow: 'visible' }]}>
                                <Text style={styles.inputLabel}>TO</Text>
                                <GooglePlacesAutocomplete
                                    placeholder="Select Destination"
                                    fetchDetails={true}
                                    onPress={(data, details = null) => {
                                        setDestination(data.description);
                                        if (details) {
                                            setDestinationCoords([details.geometry.location.lng, details.geometry.location.lat]);
                                        }
                                    }}
                                    query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
                                    enablePoweredByContainer={false}
                                    minLength={2}
                                    debounce={400}
                                    keyboardShouldPersistTaps="handled"
                                    textInputProps={{
                                        placeholderTextColor: '#94A3B8',
                                    }}
                                    styles={{
                                        container: { flex: 0, overflow: 'visible' },
                                        textInput: styles.textInput,
                                        listView: { position: 'absolute', top: 58, left: 0, right: 0, zIndex: 9999, elevation: 99, backgroundColor: '#FFF', borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 } }
                                    }}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Schedule Section */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>SCHEDULE</Text>
                    <View style={styles.row}>
                        <TouchableOpacity style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]} onPress={() => setShowCalendar(true)}>
                            <Text style={styles.inputLabel}>DATE</Text>
                            <View style={styles.pickerInput}>
                                <Text style={[styles.pickerText, selectedDate !== 'dd-mm-yyyy' && { color: '#111827' }]}>{selectedDate}</Text>
                                <FontAwesomeIcon icon={faCalendarDays} size={14} color="#9CA3AF" />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.inputWrapper, { flex: 1, marginLeft: 8 }]} onPress={() => setShowTimePicker(true)}>
                            <Text style={styles.inputLabel}>TIME</Text>
                            <View style={styles.pickerInput}>
                                <Text style={[styles.pickerText, selectedTime !== 'hh:mm' && { color: '#111827' }]}>{selectedTime}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Pricing Section */}
                <View style={styles.card}>
                    <View style={styles.pricingHeader}>
                        <Text style={styles.sectionTitle}>PRICING</Text>
                        <View style={styles.vehicleTag}>
                            <Text style={styles.vehicleTagText}>CURRENT VEHICLE</Text>
                        </View>
                    </View>

                    {/* Dynamic Seat Sections based on VehicleType */}
                    {vehicleType === 'BIKE' ? (
                        <View style={styles.seatRow}>
                            <View style={styles.seatIcon}>
                                <FontAwesomeIcon icon={faChair} size={20} color="#111827" />
                            </View>
                            <View style={styles.seatInfo}>
                                <Text style={styles.seatTitle}>Single Passenger</Text>
                                <Text style={styles.seatLimit}>FIXED 1</Text>
                            </View>
                            <View style={styles.priceInputRow}>
                                <Text style={styles.currency}>₹</Text>
                                <TextInput
                                    style={[styles.priceValue, { minWidth: 60, height: 40, paddingHorizontal: 10, padding: 0 }]}
                                    value={frontPrice}
                                    onChangeText={setFrontPrice}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    ) : (
                        <>
                            {/* Front Seat */}
                            <View style={styles.seatRow}>
                                <View style={styles.seatIcon}>
                                    <FontAwesomeIcon icon={faChair} size={20} color="#111827" />
                                </View>
                                <View style={styles.seatInfo}>
                                    <Text style={styles.seatTitle}>{vehicleType === 'AUTO' ? 'Driver Only Front' : 'Front Seat'}</Text>
                                    <Text style={styles.seatLimit}>{vehicleType === 'AUTO' ? 'UNAVAILABLE' : 'MAX 1'}</Text>
                                </View>
                                <View style={styles.counter}>
                                    <TouchableOpacity onPress={() => decrement(setFrontSeatCount, frontSeatCount)} disabled={vehicleType === 'AUTO'} style={[styles.counterBtn, vehicleType === 'AUTO' && { opacity: 0.5 }]}>
                                        <Text style={styles.counterText}>-</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.countValue}>{frontSeatCount}</Text>
                                    <TouchableOpacity onPress={() => increment(setFrontSeatCount, frontSeatCount, 1)} disabled={vehicleType === 'AUTO'} style={[styles.counterBtn, vehicleType === 'AUTO' && { opacity: 0.5 }]}>
                                        <Text style={styles.counterText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.priceInputRow}>
                                <Text style={styles.currency}>₹</Text>
                                <TextInput
                                    style={[styles.priceValue, { minWidth: 60, height: 40, paddingHorizontal: 10, padding: 0 }]}
                                    value={frontPrice}
                                    onChangeText={setFrontPrice}
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Middle Row */}
                            <View style={styles.divider} />
                            <View style={styles.seatRow}>
                                <View style={styles.seatIcon}>
                                    <FontAwesomeIcon icon={faUserFriends} size={20} color="#EF4444" />
                                </View>
                                <View style={styles.seatInfo}>
                                    <Text style={styles.seatTitle}>{vehicleType === 'AUTO' ? 'Rear Bench' : 'Middle Row'}</Text>
                                    <Text style={styles.seatLimit}>MAX {vehicleType === 'AUTO' ? 3 : ((vehicleType as any) === 'TRAVELER' ? 10 : 3)}</Text>
                                </View>
                                <View style={styles.counter}>
                                    <TouchableOpacity onPress={() => decrement(setMiddleRowCount, middleRowCount)} style={styles.counterBtn}>
                                        <Text style={styles.counterText}>-</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.countValue}>{middleRowCount}</Text>
                                    <TouchableOpacity onPress={() => increment(setMiddleRowCount, middleRowCount, (vehicleType === 'AUTO' ? 3 : ((vehicleType as any) === 'TRAVELER' ? 10 : 3)))} style={styles.counterBtn}>
                                        <Text style={styles.counterText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.priceInputRow}>
                                <Text style={styles.currency}>₹</Text>
                                <TextInput
                                    style={[styles.priceValue, { minWidth: 60, height: 40, paddingHorizontal: 10, padding: 0 }]}
                                    value={middlePrice}
                                    onChangeText={setMiddlePrice}
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Back Row - Hidden for AUTO */}
                            {maxCapacity > 4 && vehicleType !== 'AUTO' && (
                                <>
                                    {/* Back Row */}
                                    <View style={styles.divider} />
                                    <View style={styles.seatRow}>
                                        <View style={styles.seatIcon}>
                                            <FontAwesomeIcon icon={faSuitcase} size={20} color="#D97706" />
                                        </View>
                                        <View style={styles.seatInfo}>
                                            <Text style={styles.seatTitle}>Back Row</Text>
                                            <Text style={styles.seatLimit}>MAX {maxCapacity - 4}</Text>
                                        </View>
                                        <View style={styles.counter}>
                                            <TouchableOpacity onPress={() => decrement(setBackRowCount, backRowCount)} style={styles.counterBtn}>
                                                <Text style={styles.counterText}>-</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.countValue}>{backRowCount}</Text>
                                            <TouchableOpacity onPress={() => increment(setBackRowCount, backRowCount, (vehicleType as any) === 'TRAVELER' ? 15 : 3)} style={styles.counterBtn}>
                                                <Text style={styles.counterText}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={styles.priceInputRow}>
                                        <Text style={styles.currency}>₹</Text>
                                        <TextInput
                                            style={[styles.priceValue, { minWidth: 60, height: 40, paddingHorizontal: 10, padding: 0 }]}
                                            value={backPrice}
                                            onChangeText={setBackPrice}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </>
                            )}
                        </>
                    )}
                </View>

                {/* Women Only */}
                <View style={styles.toggleCard}>
                    <View style={styles.toggleInfo}>
                        <Text style={styles.toggleTitle}>Women Only Ride</Text>
                        <Text style={styles.toggleDesc}>Visible only to female passengers</Text>
                    </View>
                    <Switch
                        trackColor={{ false: "#E5E7EB", true: "#2DD4BF" }}
                        thumbColor={"#FFFFFF"}
                        onValueChange={setIsWomenOnly}
                        value={isWomenOnly}
                    />
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.publishButton,
                        (origin && destination && selectedDate !== 'dd-mm-yyyy' && selectedTime !== 'hh:mm')
                            ? { backgroundColor: '#0F172A' }
                            : { backgroundColor: '#CBD5E1' }
                    ]}
                    disabled={!(origin && destination && originCoords && destinationCoords && selectedDate !== 'dd-mm-yyyy' && selectedTime !== 'hh:mm')}
                    onPress={async () => {
                        try {
                            const [day, monthStr, year] = selectedDate.split('-');
                            const [time, period] = selectedTime.split(' ');
                            let [hour, minute] = time.split(':');

                            const monthMap: { [key: string]: number } = {
                                Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
                                Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
                            };

                            let h = parseInt(hour);
                            if (period === 'PM' && h < 12) h += 12;
                            if (period === 'AM' && h === 12) h = 0;

                            const scheduledDateObj = new Date(parseInt(year), monthMap[monthStr], parseInt(day), h, parseInt(minute));
                            const isoDateString = scheduledDateObj.toISOString();

                            const payload = {
                                type: 'local',
                                originName: origin,
                                originCoords: originCoords,
                                destinationName: destination,
                                destinationCoords: destinationCoords,
                                scheduledTime: isoDateString,
                                vehicle: user?.driverDetails?.vehicle?.model || "City Pool Vehicle",
                                vehicleType: vehicleType,
                                totalSeats: vehicleType === 'BIKE' ? 1 : (vehicleType === 'AUTO' ? 3 : (frontSeatCount + middleRowCount + backRowCount)),
                                pricePerSeat: (() => {
                                    const activePrices = [];
                                    if (vehicleType === 'BIKE') {
                                        activePrices.push(parseFloat(frontPrice) || 15);
                                    } else if (vehicleType === 'AUTO') {
                                        activePrices.push(parseFloat(middlePrice) || 12);
                                    } else {
                                        if (frontSeatCount > 0) activePrices.push(parseFloat(frontPrice) || 15);
                                        if (middleRowCount > 0) activePrices.push(parseFloat(middlePrice) || 12);
                                        if (backRowCount > 0) activePrices.push(parseFloat(backPrice) || 10);
                                    }
                                    return activePrices.length > 0 ? Math.min(...activePrices) : 15;
                                })(),
                                seatPricing: {
                                    front: parseFloat(frontPrice) || 15,
                                    middle: parseFloat(middlePrice) || 12,
                                    back: parseFloat(backPrice) || 10
                                },
                                preferences: {
                                    womenOnly: isWomenOnly
                                }
                            };

                            const response = await poolService.publishRide(payload);

                            if (response.success) {
                                navigation.navigate('DriverMyTrips' as never);
                            } else {
                                Alert.alert('Publish Failed', response.message);
                            }
                        } catch (error: any) {
                            console.error('Publish pool error:', error);
                            Alert.alert('Error', error.response?.data?.message || 'Failed to publish. Ensure you are logged in.');
                        }
                    }}
                >
                    <Text style={[
                        styles.publishButtonText,
                        (origin && destination && selectedDate !== 'dd-mm-yyyy' && selectedTime !== 'hh:mm')
                            ? { color: '#FFFFFF' }
                            : { color: '#64748B' }
                    ]}>Publish City Pool</Text>
                </TouchableOpacity>
            </View>

            <CalendarModal
                visible={showCalendar}
                onClose={() => setShowCalendar(false)}
                onSelectDate={setSelectedDate}
                selectedDate={selectedDate === 'dd-mm-yyyy' ? '04-Feb-2026' : selectedDate}
                disablePastDates={true}
            />
            <TimePickerModal
                visible={showTimePicker}
                onClose={() => setShowTimePicker(false)}
                onSelectTime={setSelectedTime}
                selectedTime={selectedTime === 'hh:mm' ? '12:00 PM' : selectedTime}
            />

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    // Route Styles
    routeContainer: {
        flexDirection: 'row',
    },
    timeline: {
        alignItems: 'center',
        marginRight: 16,
        marginTop: 30, // Align with input text
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    line: {
        width: 2,
        height: 40,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
    },
    routeInputs: {
        flex: 1,
    },
    inputWrapper: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    textInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    // Schedule Styles
    row: {
        flexDirection: 'row',
    },
    pickerInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pickerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    // Pricing Styles
    pricingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    vehicleTag: {
        backgroundColor: '#E0F2F1',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    vehicleTagText: {
        color: '#0D9488',
        fontSize: 10,
        fontWeight: '800',
    },
    seatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    seatIcon: {
        width: 40,
        alignItems: 'center',
    },
    seatInfo: {
        flex: 1,
    },
    seatTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    seatLimit: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '700',
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 4,
    },
    counterBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    counterText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    countValue: {
        width: 30,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    priceInputRow: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    currency: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
        marginRight: 8,
    },
    priceValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
    },
    // Toggle Styles
    toggleCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleInfo: {
        flex: 1,
    },
    toggleTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    toggleDesc: {
        fontSize: 12,
        color: '#6B7280',
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    publishButton: {
        backgroundColor: '#CBD5E1',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    publishButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#64748B',
    }
});

export default DriverPublishCityPoolScreen;

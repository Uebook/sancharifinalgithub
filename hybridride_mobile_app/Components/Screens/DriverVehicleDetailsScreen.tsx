import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../Context/AuthContext';
import { driverOnboardingStorage } from '../../Services/driverOnboardingStorage';

const DriverVehicleDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();
    const { existingDocs = [], vehicleType = 'CAR', userData, capturedDocs = {} } = route.params as any || {};
    const isReupload = route.name === 'ReuploadVehicleDetails';
    const targetScreen = isReupload ? 'ReuploadRegistration' : 'DriverRegistration';

    const vehicleFallback = userData?.vehicle || user?.driverDetails?.vehicle || {};

    const [make, setMake] = useState(vehicleFallback?.make || '');
    const [model, setModel] = useState(vehicleFallback?.model || '');
    const [year, setYear] = useState(vehicleFallback?.year || '');
    const [plateNumber, setPlateNumber] = useState(vehicleFallback?.plateNumber || '');
    const [color, setColor] = useState(vehicleFallback?.color || '');
    const [fuelType, setFuelType] = useState(vehicleFallback?.fuelType || 'Petrol');
    const [seatingCapacity, setSeatingCapacity] = useState(
        vehicleFallback?.seatingCapacity || (vehicleType === 'BIKE' ? 1 : 4)
    );
    const [bootSpace, setBootSpace] = useState(vehicleFallback?.bootSpace || '');

    useEffect(() => {
        const loadInitialDraft = async () => {
            const draft = await driverOnboardingStorage.getDraft();
            if (draft?.userData?.vehicle) {
                const v = draft.userData.vehicle;
                if (!make && v.make) setMake(v.make);
                if (!model && v.model) setModel(v.model);
                if (!year && v.year) setYear(v.year);
                if (!plateNumber && v.plateNumber) setPlateNumber(v.plateNumber);
                if (!color && v.color) setColor(v.color);
                if (v.fuelType) setFuelType(v.fuelType);
                if (v.seatingCapacity) setSeatingCapacity(v.seatingCapacity);
                if (!bootSpace && v.bootSpace) setBootSpace(v.bootSpace);
            }
        };
        loadInitialDraft();
    }, []);

    const handleBack = React.useCallback(async () => {
        const vehicleDetails = {
            make,
            model,
            year,
            plateNumber,
            color,
            type: vehicleType,
            fuelType,
            seatingCapacity: vehicleType === 'BIKE' ? 1 : Number(seatingCapacity),
            bootSpace: vehicleType === 'BIKE' ? '0' : bootSpace
        };

        const updatedUserData = {
            ...userData,
            vehicle: vehicleDetails
        };

        let currentDocs = [...existingDocs];
        const isComplete = !!(make && model && year && plateNumber && color);
        if (isComplete && !currentDocs.includes('Vehicle Details')) {
            currentDocs.push('Vehicle Details');
        }

        await driverOnboardingStorage.saveDraft({
            userData: updatedUserData,
            vehicleType,
            capturedDocs,
            uploadedDocuments: currentDocs
        });

        (navigation as any).navigate(targetScreen, {
            userData: updatedUserData,
            vehicleType,
            capturedDocs,
            updatedDocList: currentDocs
        });
        return true;
    }, [navigation, make, model, year, plateNumber, color, vehicleType, fuelType, seatingCapacity, bootSpace, userData, existingDocs, capturedDocs, targetScreen]);

    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                handleBack();
                return true;
            };
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [handleBack])
    );

    const handleSubmit = async () => {
        if (!make || !model || !year || !plateNumber || !color) {
            Alert.alert("Missing Details", "Please fill in all vehicle details.");
            return;
        }

        const vehicleDetails = {
            make,
            model,
            year,
            plateNumber,
            color,
            type: vehicleType, // Important: Include vehicle type (CAR, BIKE, TRAVELER)
            fuelType,
            seatingCapacity: vehicleType === 'BIKE' ? 1 : Number(seatingCapacity),
            bootSpace: vehicleType === 'BIKE' ? '0' : bootSpace
        };

        const updatedUserData = {
            ...userData,
            vehicle: vehicleDetails
        };

        const updatedList = Array.from(new Set([...existingDocs, 'Vehicle Details']));

        await driverOnboardingStorage.saveDraft({
            userData: updatedUserData,
            vehicleType,
            capturedDocs,
            uploadedDocuments: updatedList
        });

        Alert.alert("Success", "Vehicle details saved successfully!");

        (navigation as any).navigate(targetScreen, {
            completedDocument: 'Vehicle Details',
            updatedDocList: updatedList,
            vehicleType,
            userData: updatedUserData,
            capturedDocs: capturedDocs // Pass back the docs
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <FontAwesomeIcon icon={faArrowLeft} size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Vehicle Details</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.label}>Vehicle Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Toyota Civic, Hero Splendor"
                    value={make}
                    onChangeText={setMake}
                />

                <Text style={styles.label}>Model / Variant</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. VXI, ZXI, ABS"
                    value={model}
                    onChangeText={setModel}
                />

                <Text style={styles.label}>Year</Text>
                <TextInput
                    style={styles.input}
                    placeholder="YYYY"
                    keyboardType="numeric"
                    maxLength={4}
                    value={year}
                    onChangeText={setYear}
                />

                <Text style={styles.label}>License Plate Number</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. MH 02 AB 1234"
                    value={plateNumber}
                    onChangeText={setPlateNumber}
                    autoCapitalize="characters"
                />

                <Text style={styles.label}>Vehicle Color</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. White, Silver"
                    value={color}
                    onChangeText={setColor}
                />

                <Text style={styles.label}>FUEL TYPE</Text>
                <View style={styles.fuelContainer}>
                    {['Petrol', 'Diesel', 'CNG', 'EV'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.fuelButton, fuelType === type && styles.fuelButtonActive]}
                            onPress={() => setFuelType(type)}
                        >
                            <Text style={[styles.fuelText, fuelType === type && styles.fuelTextActive]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {vehicleType !== 'BIKE' && (
                    <>
                        <Text style={styles.label}>MAX PASSENGERS (TOTAL SEATS)</Text>
                        <View style={styles.counterContainer}>
                            <TouchableOpacity
                                style={styles.counterButton}
                                onPress={() => setSeatingCapacity(Math.max(1, seatingCapacity-1))}
                            >
                                <Text style={styles.counterText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.counterValue}>{seatingCapacity}</Text>
                            <TouchableOpacity
                                style={styles.counterButtonActive}
                                onPress={() => setSeatingCapacity(seatingCapacity + 1)}
                            >
                                <Text style={styles.counterTextActive}>+</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>BOOT SPACE (LITERS)</Text>
                        <View style={styles.bootInputContainer}>
                            <TextInput
                                style={styles.bootInput}
                                placeholder="e.g. 209"
                                keyboardType="numeric"
                                value={bootSpace}
                                onChangeText={setBootSpace}
                            />
                            <Text style={styles.unitText}>Liters</Text>
                        </View>
                        <Text style={styles.helperText}>Number of passengers you can take (Excluding yourself). E.g., if you want to take 6 people, enter 6.</Text>
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>Save Details</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 10,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    content: {
        padding: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    submitButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    fuelContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    fuelButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        marginRight: 10,
        marginBottom: 10,
    },
    fuelButtonActive: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#2DD4BF',
    },
    fuelText: {
        color: '#6B7280',
        fontWeight: '600',
    },
    fuelTextActive: {
        color: '#0D9488', // Teal Dark
        fontWeight: '700',
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 10,
    },
    counterButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    counterButtonActive: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#111827',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterText: {
        fontSize: 20,
        color: '#374151',
    },
    counterTextActive: {
        fontSize: 20,
        color: '#FFFFFF',
    },
    counterValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginHorizontal: 20,
        color: '#111827',
    },
    bootInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    bootInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
    },
    unitText: {
        color: '#9CA3AF',
        fontWeight: '700',
    },
    helperText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 6,
        fontStyle: 'italic',
    },
});

export default DriverVehicleDetailsScreen;


import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft,
    faCar,
    faMotorcycle,
    faTaxi,
    faVanShuttle,
    faLightbulb,
    faArrowRight
} from '@fortawesome/free-solid-svg-icons';

const { width } = Dimensions.get('window');

const DriverVehicleSelectionScreen = ({ route }: any) => {
    const navigation = useNavigation();
    const { userData } = route.params || {}; // Receive userData from ProfileSetup

    console.log('DriverVehicleSelection - userData:', userData ? 'Present' : 'Missing', userData);

    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(userData?.vehicle?.type || null);

    const handleBack = React.useCallback(() => {
        (navigation as any).navigate('ProfileSetup', {
            userType: 'DRIVER',
            userData: userData
        });
        return true;
    }, [navigation, userData]);

    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => handleBack();
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [handleBack])
    );

    const vehicles = [
        { id: 'CAR', name: 'Car', subtext: 'SEDAN, SUV,\nHATCHBACK', icon: faCar, color: '#EF4444' }, // Red car
        { id: 'BIKE', name: 'Bike', subtext: 'SCOOTER,\nMOTORCYCLE', icon: faMotorcycle, color: '#F97316' }, // Orange bike
        { id: 'AUTO', name: 'Auto', subtext: 'RICKSHAW, TUK-TUK', icon: faTaxi, color: '#EAB308' }, // Yellow auto (taxi icon)
        { id: 'TRAVELER', name: 'Traveler', subtext: 'MINI BUS, TOOFAN,\nTEMPO', icon: faVanShuttle, color: '#3B82F6' }, // Blue van
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <FontAwesomeIcon icon={faArrowLeft} size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>What will you drive?</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.subtitle}>
                    Select your primary vehicle type. This determines the documents we need from you.
                </Text>

                {/* Grid */}
                <View style={styles.gridContainer}>
                    {vehicles.map((vehicle) => (
                        <TouchableOpacity
                            key={vehicle.id}
                            style={[
                                styles.card,
                                selectedVehicle === vehicle.id && styles.selectedCard
                            ]}
                            onPress={() => setSelectedVehicle(vehicle.id)}
                        >
                            <View style={styles.iconContainer}>
                                <FontAwesomeIcon
                                    icon={vehicle.icon}
                                    size={32}
                                    color={selectedVehicle === vehicle.id ? '#111827' : vehicle.color}
                                />
                            </View>
                            <Text style={styles.vehicleName}>{vehicle.name}</Text>
                            <Text style={styles.vehicleSubtext}>{vehicle.subtext}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <FontAwesomeIcon icon={faLightbulb} size={24} color="#F59E0B" style={styles.bulbIcon} />
                    <Text style={styles.infoText}>
                        You can add more vehicles to your profile later from the settings menu after approval.
                    </Text>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        !selectedVehicle && styles.disabledButton
                    ]}
                    disabled={!selectedVehicle}
                    onPress={() => {
                        (navigation as any).navigate('DriverRegistration', {
                            vehicleType: selectedVehicle,
                            userData: userData // Pass userData forward to Registration
                        });
                    }}
                >
                    <Text style={[
                        styles.continueButtonText,
                        !selectedVehicle && styles.disabledButtonText
                    ]}>Continue Registration</Text>
                    <FontAwesomeIcon
                        icon={faArrowRight}
                        size={20}
                        color={selectedVehicle ? "#FFFFFF" : "#9CA3AF"}
                        style={{ marginLeft: 10 }}
                    />
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
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 22,
        marginBottom: 30,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    card: {
        width: '47%',
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        paddingVertical: 30,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedCard: {
        backgroundColor: '#F0FDFA', // Light Teal
        borderColor: '#111827', // Dark Border as per selected state usually
    },
    iconContainer: {
        marginBottom: 16,
        height: 50,
        justifyContent: 'center',
    },
    vehicleName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    vehicleSubtext: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 14,
        letterSpacing: 0.5,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F0F9FF', // Light Blue
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    bulbIcon: {
        marginRight: 16,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: '#1E40AF', // Dark Blue text
        lineHeight: 18,
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    continueButton: {
        backgroundColor: '#111827',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
    },
    disabledButton: {
        backgroundColor: '#E5E7EB',
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    disabledButtonText: {
        color: '#9CA3AF',
    },
});

export default DriverVehicleSelectionScreen;

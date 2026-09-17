import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Image,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft,
    faCalendar,
    faComment,
    faPhone,
    faLocationDot
} from '@fortawesome/free-solid-svg-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DriverChatModal from './DriverChatModal'; // Reusing chat modal
import { getImageUrl } from '../../Services/apiClient';

const { width, height } = Dimensions.get('window');

const OutstationScheduledScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { rideData, date, fromLocation } = route.params as any || {};
    const [isChatVisible, setChatVisible] = React.useState(false);

    const ride = rideData?.fullData || {};
    // Mock/Default data if missing
    const driverName = ride.host?.name || rideData?.provider || rideData?.driver?.name || rideData?.driver || 'Driver';
    const vehicleType = ride.host?.driverDetails?.vehicle?.model || rideData?.type || 'Vehicle';
    const plateNumber = ride.host?.driverDetails?.vehicle?.plateNumber || 'TBD';
    const scheduledDate = date || (ride.scheduledTime ? new Date(ride.scheduledTime).toLocaleDateString([], { day: 'numeric', month: 'short' }) : '24 Feb');
    const pickupLocation = ride.origin?.name || fromLocation?.split(',')[0] || 'Meeting point';
    const profileImage = ride.host?.profileImage;

    const handleCall = () => {
        Linking.openURL('tel:1234567890');
    };

    return (
        <View style={styles.container}>
            {/* Map Placeholder Background */}
            <View style={styles.mapBackground}>
                {/*  Ideally this would be a MapView. Using a placeholder color and marker for now. */}
                <View style={styles.mapMarkerContainer}>
                    <View style={styles.tooltip}>
                        <Text style={styles.tooltipText}>Meeting Point</Text>
                    </View>
                    <View style={styles.markerCircle}>
                        <FontAwesomeIcon icon={faLocationDot} size={24} color="#0EA5E9" />
                    </View>
                </View>
            </View>

            {/* Header Floating Button */}
            <SafeAreaView style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('PassengerHome' as never)} style={styles.backButton}>
                    <FontAwesomeIcon icon={faArrowLeft} size={20} color="#111827" />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Bottom Sheet Card */}
            <View style={styles.bottomSheet}>
                <View style={styles.dragHandle} />

                {/* Title Row */}
                <View style={styles.titleRow}>
                    <View>
                        <Text style={styles.title}>Upcoming Trip</Text>
                        <Text style={styles.subtitle}>Scheduled for {scheduledDate} | Flexible</Text>
                    </View>
                    <View style={styles.calendarIcon}>
                        <FontAwesomeIcon icon={faCalendar} size={20} color="#111827" />
                    </View>
                </View>

                {/* Driver Card */}
                <View style={styles.driverCard}>
                    <View style={styles.avatar}>
                        {profileImage ? (
                            <Image source={{ uri: getImageUrl(profileImage) || '' }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{driverName.charAt(0)}</Text>
                        )}
                    </View>
                    <View style={styles.driverInfo}>
                        <Text style={styles.driverName}>{driverName}</Text>
                        <Text style={styles.vehicleInfo}>{vehicleType} • {plateNumber}</Text>
                    </View>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => setChatVisible(true)}>
                            <FontAwesomeIcon icon={faComment} size={16} color="#111827" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.iconButton, styles.callButton]} onPress={handleCall}>
                            <FontAwesomeIcon icon={faPhone} size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Instructions */}
                <Text style={styles.instructionsTitle}>MEETING INSTRUCTIONS</Text>
                <Text style={styles.instructionsText}>
                    Please arrive 15 minutes early at {pickupLocation}. The driver will be waiting in a {vehicleType} with hazard lights on.
                </Text>

                {/* Footer Button */}
                <TouchableOpacity
                    style={styles.footerButton}
                    onPress={() => navigation.navigate('PassengerHome' as never)}
                >
                    <Text style={styles.footerButtonText}>Close & View in My Rides</Text>
                </TouchableOpacity>
            </View>

            <DriverChatModal
                visible={isChatVisible}
                onClose={() => setChatVisible(false)}
                driverName={driverName}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    mapBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#E5E7EB', // Map gray placeholder
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapMarkerContainer: {
        alignItems: 'center',
        marginBottom: 100, // Push it up a bit
    },
    tooltip: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 8,
    },
    tooltipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#111827',
    },
    markerCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        borderWidth: 4,
        borderColor: '#E0F2FE', // Lighter ring
    },
    headerContainer: {
        marginLeft: 20,
        marginTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 24,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#059669', // Greenish teal
    },
    calendarIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    driverCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    vehicleInfo: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginLeft: 8,
    },
    callButton: {
        backgroundColor: '#10B981', // Green call button
        borderColor: '#10B981',
    },
    instructionsTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    instructionsText: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 24,
    },
    footerButton: {
        backgroundColor: '#E5E7EB', // Light gray button
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    footerButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#4B5563', // Dark gray text
    },
});

export default OutstationScheduledScreen;

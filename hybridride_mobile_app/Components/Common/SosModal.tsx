import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    Modal,
    TouchableOpacity,
    Alert,
    Share,
    Linking,
    Platform,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faShieldHalved,
    faPhoneVolume,
    faShareNodes,
    faTimes,
    faTriangleExclamation,
    faUserGroup,
    faPhone,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../Context/AuthContext';

interface SosModalProps {
    visible: boolean;
    onClose: () => void;
    currentLocation?: string;
}

const SosModal: React.FC<SosModalProps> = ({ visible, onClose, currentLocation }) => {
    const { user } = useAuth();
    const emergencyContact = user?.emergencyContact;

    const handleEmergencyCall = (number: string) => {
        Linking.openURL(`tel:${number}`).catch(() => {
            Alert.alert('Error', 'Unable to initiate call from this device');
        });
    };

    const handleShareLiveLocation = async () => {
        try {
            const locationMsg = currentLocation
                ? `EMERGENCY ALERT: I need assistance! My current location is: ${currentLocation}`
                : `EMERGENCY ALERT: I need assistance! Please check on me immediately.`;

            await Share.share({
                title: 'EMERGENCY SOS ALERT',
                message: locationMsg,
            });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to share location');
        }
    };

    const handleNotifyContacts = () => {
        const locationMsg = currentLocation
            ? `EMERGENCY SOS: Please help me! My live location is: ${currentLocation}`
            : `EMERGENCY SOS: I need immediate assistance!`;

        if (emergencyContact?.phone) {
            const smsUrl = Platform.OS === 'ios'
                ? `sms:${emergencyContact.phone}&body=${encodeURIComponent(locationMsg)}`
                : `sms:${emergencyContact.phone}?body=${encodeURIComponent(locationMsg)}`;

            Linking.openURL(smsUrl).catch(() => {
                Alert.alert(
                    'Emergency Contact Alerted',
                    `Alert dispatched for ${emergencyContact.name || 'Emergency Contact'} (${emergencyContact.phone}).`
                );
            });
        } else {
            Alert.alert(
                'No Emergency Contact Configured',
                'Please set up an Emergency Contact in your Profile settings for one-tap SMS alerts.',
                [{ text: 'OK' }]
            );
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <View style={styles.shieldBox}>
                                <FontAwesomeIcon icon={faShieldHalved} size={22} color="#EF4444" />
                            </View>
                            <View>
                                <Text style={styles.title}>EMERGENCY SOS</Text>
                                <Text style={styles.subtitle}>Safety & Emergency Assistance</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <FontAwesomeIcon icon={faTimes} size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    {/* Alert Banner */}
                    <View style={styles.alertBanner}>
                        <FontAwesomeIcon icon={faTriangleExclamation} size={16} color="#F59E0B" style={{ marginRight: 8 }} />
                        <Text style={styles.alertText}>
                            Use these actions only if you are in immediate danger or require emergency help.
                        </Text>
                    </View>

                    {/* Actions List */}
                    <View style={styles.actionsContainer}>
                        {/* Call Police 112 */}
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.callPoliceBtn]}
                            onPress={() => handleEmergencyCall('112')}
                            activeOpacity={0.8}
                        >
                            <FontAwesomeIcon icon={faPhoneVolume} size={18} color="#FFFFFF" />
                            <Text style={styles.callPoliceText}>Call Police (112)</Text>
                        </TouchableOpacity>

                        {/* Call Medical / Ambulance 108 */}
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.callMedicalBtn]}
                            onPress={() => handleEmergencyCall('108')}
                            activeOpacity={0.8}
                        >
                            <FontAwesomeIcon icon={faPhoneVolume} size={18} color="#EF4444" />
                            <Text style={styles.callMedicalText}>Call Ambulance (108)</Text>
                        </TouchableOpacity>

                        {/* Call Personal Emergency Contact if configured */}
                        {emergencyContact?.phone ? (
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.callEmergencyContactBtn]}
                                onPress={() => handleEmergencyCall(emergencyContact.phone)}
                                activeOpacity={0.8}
                            >
                                <FontAwesomeIcon icon={faPhone} size={16} color="#FFFFFF" />
                                <Text style={styles.callEmergencyContactText} numberOfLines={1}>
                                    Call {emergencyContact.name || 'SOS Contact'} ({emergencyContact.phone})
                                </Text>
                            </TouchableOpacity>
                        ) : null}

                        {/* Share Location */}
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.secondaryBtn]}
                            onPress={handleShareLiveLocation}
                            activeOpacity={0.8}
                        >
                            <FontAwesomeIcon icon={faShareNodes} size={18} color="#38BDF8" />
                            <Text style={styles.secondaryBtnText}>Share Live Location</Text>
                        </TouchableOpacity>

                        {/* Broadcast Emergency Alert */}
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.secondaryBtn]}
                            onPress={handleNotifyContacts}
                            activeOpacity={0.8}
                        >
                            <FontAwesomeIcon icon={faUserGroup} size={18} color="#10B981" />
                            <Text style={styles.secondaryBtnText}>Alert Trusted Contacts</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    container: {
        width: '100%',
        backgroundColor: '#0F172A',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shieldBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '900',
        color: '#EF4444',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    closeBtn: {
        padding: 6,
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    alertText: {
        flex: 1,
        fontSize: 12,
        color: '#FCD34D',
        fontWeight: '500',
        lineHeight: 16,
    },
    actionsContainer: {
        gap: 12,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 10,
    },
    callPoliceBtn: {
        backgroundColor: '#EF4444',
    },
    callPoliceText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
    },
    callMedicalBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    callMedicalText: {
        color: '#EF4444',
        fontWeight: '800',
        fontSize: 15,
    },
    callEmergencyContactBtn: {
        backgroundColor: '#059669',
        borderWidth: 1,
        borderColor: '#10B981',
    },
    callEmergencyContactText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
        paddingHorizontal: 12,
    },
    secondaryBtn: {
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
    },
    secondaryBtnText: {
        color: '#F8FAFC',
        fontWeight: '700',
        fontSize: 14,
    },
});

export default SosModal;

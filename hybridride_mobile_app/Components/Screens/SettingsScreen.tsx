import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Switch,
    Linking,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft,
    faBell,
    faGlobe,
    faChevronRight,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import BottomNavBar from '../Navigation/BottomNavBar';
import DriverBottomNavBar from '../Navigation/DriverBottomNavBar';
import { useAuth } from '../Context/AuthContext';

const SettingsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user, deleteAccount, isLoading } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const toggleSwitch = () => setNotificationsEnabled(previousState => !previousState);

    const { mode } = (route.params as { mode?: string }) || {};
    const isDriver = mode === 'driver' || user?.role === 'driver';

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account & Data",
            "Are you sure you want to permanently delete your account? All your personal data, rides, and profile information will be deleted immediately and cannot be recovered.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete My Account",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteAccount();
                            Alert.alert("Account Deleted", "Your account and associated data have been permanently deleted.");
                        } catch (error: any) {
                            Alert.alert(
                                "Error",
                                error?.response?.data?.message || "Failed to delete account. Please check your connection or contact support@sanchari.io"
                            );
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, isDriver && styles.darkContainer]}>
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.header, isDriver && styles.darkHeader]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <FontAwesomeIcon icon={faArrowLeft} size={20} color={isDriver ? "#FFFFFF" : "#111827"} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, isDriver && styles.darkText]}>Settings</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Preferences */}
                    <Text style={[styles.sectionTitle, isDriver && styles.darkSubtext]}>PREFERENCES</Text>
                    <View style={[styles.card, isDriver && styles.darkCard]}>
                        <View style={styles.row}>
                            <View style={[styles.iconCircle, isDriver && { backgroundColor: '#3B0764' }]}>
                                <FontAwesomeIcon icon={faBell} size={18} color="#C084FC" />
                            </View>
                            <Text style={[styles.rowText, isDriver && styles.darkText]}>Notifications</Text>
                            <Switch
                                trackColor={{ false: '#767577', true: '#10B981' }}
                                thumbColor={'#FFFFFF'}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={toggleSwitch}
                                value={notificationsEnabled}
                            />
                        </View>
                        <View style={[styles.divider, isDriver && { backgroundColor: '#1E293B' }]} />
                        <TouchableOpacity style={styles.row}>
                            <View style={[styles.iconCircle, { backgroundColor: isDriver ? '#1E3A8A' : '#EFF6FF' }]}>
                                <FontAwesomeIcon icon={faGlobe} size={18} color={isDriver ? '#60A5FA' : '#2563EB'} />
                            </View>
                            <Text style={[styles.rowText, isDriver && styles.darkText]}>Language</Text>
                            <View style={styles.valueContainer}>
                                <Text style={[styles.valueText, isDriver && styles.darkSubtext]}>English (US)</Text>
                                <FontAwesomeIcon icon={faChevronRight} size={12} color={isDriver ? "#64748B" : "#D1D5DB"} style={{ marginLeft: 8 }} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Support & Legal */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }, isDriver && styles.darkSubtext]}>SUPPORT & LEGAL</Text>
                    <View style={[styles.card, isDriver && styles.darkCard]}>
                        <TouchableOpacity
                            style={styles.simpleRow}
                            onPress={() => Linking.openURL('https://www.sanchari.io/?view=faq')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.simpleRowText, isDriver && styles.darkText]}>Help Center &amp; FAQ</Text>
                            <FontAwesomeIcon icon={faChevronRight} size={12} color={isDriver ? "#64748B" : "#D1D5DB"} />
                        </TouchableOpacity>
                        <View style={[styles.dividerFull, isDriver && { backgroundColor: '#1E293B' }]} />
                        <TouchableOpacity
                            style={styles.simpleRow}
                            onPress={() => Linking.openURL('https://sanchari.io/?view=privacy-policy')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.simpleRowText, isDriver && styles.darkText]}>Privacy Policy</Text>
                            <FontAwesomeIcon icon={faChevronRight} size={12} color={isDriver ? "#64748B" : "#D1D5DB"} />
                        </TouchableOpacity>
                        <View style={[styles.dividerFull, isDriver && { backgroundColor: '#1E293B' }]} />
                        <TouchableOpacity
                            style={styles.simpleRow}
                            onPress={() => Linking.openURL(isDriver ? 'https://sanchari.io/?view=partner-terms' : 'https://sanchari.io/?view=customer-terms')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.simpleRowText, isDriver && styles.darkText]}>Terms of Service</Text>
                            <FontAwesomeIcon icon={faChevronRight} size={12} color={isDriver ? "#64748B" : "#D1D5DB"} />
                        </TouchableOpacity>
                    </View>

                    {/* Account Deletion */}
                    <Text style={[styles.sectionTitle, { marginTop: 24, color: '#EF4444' }]}>ACCOUNT ACTIONS</Text>
                    <View style={[styles.card, isDriver && styles.darkCard, { borderColor: isDriver ? '#7F1D1D' : '#FEE2E2' }]}>
                        <TouchableOpacity
                            style={styles.simpleRow}
                            onPress={handleDeleteAccount}
                            disabled={isLoading}
                            activeOpacity={0.7}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <FontAwesomeIcon icon={faTrash} size={16} color="#DC2626" style={{ marginRight: 12 }} />
                                <Text style={[styles.simpleRowText, { color: '#DC2626' }]}>
                                    {isLoading ? 'Processing...' : 'Delete Account & Data'}
                                </Text>
                            </View>
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#DC2626" />
                            ) : (
                                <FontAwesomeIcon icon={faChevronRight} size={12} color="#DC2626" />
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.versionText, isDriver && { color: '#64748B' }]}>Version 2.4.0 (Build 390)</Text>

                </ScrollView>
            </SafeAreaView>

            {isDriver ? (
                <DriverBottomNavBar activeTab="PROFILE" />
            ) : (
                <BottomNavBar activeTab="PROFILE" />
            )}
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    darkContainer: {
        backgroundColor: '#080C14',
    },
    darkCard: {
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    darkHeader: {
        backgroundColor: '#0F172A',
        borderBottomColor: '#1E293B',
    },
    darkText: {
        color: '#FFFFFF',
    },
    darkSubtext: {
        color: '#94A3B8',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 12,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3E8FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rowText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    valueText: {
        fontSize: 14,
        color: '#6B7280',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 60,
    },
    dividerFull: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 16,
    },
    simpleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    simpleRowText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    logoutButton: {
        marginTop: 32,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#DC2626',
    },
    versionText: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 12,
        color: '#9CA3AF',
    },
});

export default SettingsScreen;

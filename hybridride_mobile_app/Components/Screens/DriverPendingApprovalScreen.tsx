import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faHourglassHalf,
    faShieldHalved,
    faFileLines,
    faCheckCircle,
    faArrowRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../Context/AuthContext';

const { width } = Dimensions.get('window');

const DriverPendingApprovalScreen = () => {
    const { logout, user } = useAuth();
    const navigation = useNavigation();

    // Pulsing animation for hourglass
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in on mount
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        // Pulsing loop for pending icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 900,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const isRejected = user?.driverApprovalStatus === 'rejected';

    const steps = [
        { icon: faFileLines, label: 'Documents Submitted', done: true },
        { icon: faShieldHalved, label: 'Admin Review', done: false, active: !isRejected },
        { icon: faCheckCircle, label: 'Account Activated', done: false },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>

                    {/* Icon */}
                    <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }, isRejected && styles.iconContainerRejected]}>
                        <FontAwesomeIcon
                            icon={faHourglassHalf}
                            size={40}
                            color={isRejected ? '#EF4444' : '#F59E0B'}
                        />
                    </Animated.View>

                    {/* Title */}
                    <Text style={[styles.title, isRejected && styles.titleRejected]}>
                        {isRejected ? 'Application Rejected' : 'Under Review'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {isRejected
                            ? user?.rejectionReason || 'Your application did not meet our requirements. Please re-upload your documents.'
                            : 'Your documents are being verified by our team. This usually takes 24–48 hours.'}
                    </Text>

                    {isRejected && (
                        <TouchableOpacity 
                            style={styles.reuploadButton} 
                            onPress={() => (navigation as any).navigate('ReuploadRegistration', { 
                                userData: user,
                                vehicleType: user?.driverDetails?.vehicle?.type || 'CAR'
                            })}
                        >
                            <Text style={styles.reuploadButtonText}>Re-upload Documents</Text>
                        </TouchableOpacity>
                    )}

                    {/* Progress Steps */}
                    <View style={styles.stepsContainer}>
                        {steps.map((step, i) => (
                            <View key={i} style={styles.stepRow}>
                                <View style={[
                                    styles.stepDot,
                                    step.done ? styles.stepDotDone :
                                        step.active ? styles.stepDotActive :
                                            styles.stepDotPending
                                ]}>
                                    <FontAwesomeIcon
                                        icon={step.icon}
                                        size={14}
                                        color={step.done ? '#FFFFFF' : (step.active ? '#F59E0B' : '#9CA3AF')}
                                    />
                                </View>
                                <Text style={[
                                    styles.stepLabel,
                                    step.done ? styles.stepLabelDone :
                                        step.active ? styles.stepLabelActive :
                                            styles.stepLabelPending
                                ]}>
                                    {step.label}
                                </Text>
                                {i < steps.length - 1 && (
                                    <View style={[styles.stepLine, step.done && styles.stepLineDone]} />
                                )}
                            </View>
                        ))}
                    </View>

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>What happens next?</Text>
                        <Text style={styles.infoText}>
                            Our team reviews your Aadhaar, Driving License, {'\n'}
                            and Vehicle Registration documents.
                        </Text>
                        <Text style={styles.infoText}>
                            You will receive an <Text style={styles.infoHighlight}>email notification</Text> once your account is approved.
                        </Text>
                    </View>

                    {/* Actions Row */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                            <FontAwesomeIcon icon={faArrowRightFromBracket} size={16} color="#6B7280" />
                            <Text style={styles.logoutText}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>

                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    inner: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    scrollContent: {
        flexGrow: 1,
    },
    iconContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderWidth: 2,
        borderColor: 'rgba(245, 158, 11, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    iconContainerRejected: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#F59E0B',
        marginBottom: 10,
        textAlign: 'center',
    },
    titleRejected: {
        color: '#EF4444',
    },
    subtitle: {
        fontSize: 15,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 10,
    },
    stepsContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
        paddingHorizontal: 10,
    },
    stepRow: {
        alignItems: 'center',
        flex: 1,
        position: 'relative',
    },
    stepDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    stepDotDone: {
        backgroundColor: '#10B981',
    },
    stepDotActive: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    stepDotPending: {
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
    },
    stepLabel: {
        fontSize: 10,
        textAlign: 'center',
        fontWeight: '600',
        paddingHorizontal: 4,
    },
    stepLabelDone: {
        color: '#10B981',
    },
    stepLabelActive: {
        color: '#F59E0B',
    },
    stepLabelPending: {
        color: '#475569',
    },
    stepLine: {
        position: 'absolute',
        top: 18,
        left: '55%',
        right: '-45%',
        height: 2,
        backgroundColor: '#1E293B',
        zIndex: -1,
    },
    stepLineDone: {
        backgroundColor: '#10B981',
    },
    infoCard: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        marginBottom: 28,
        borderWidth: 1,
        borderColor: '#334155',
    },
    infoTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
    },
    infoText: {
        color: '#94A3B8',
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 6,
    },
    infoHighlight: {
        color: '#2DD4BF',
        fontWeight: '700',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#1E293B',
    },
    logoutText: {
        color: '#6B7280',
        fontWeight: '700',
        fontSize: 15,
    },
    reuploadButton: {
        backgroundColor: '#10B981',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 32,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    reuploadButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 16,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
});

export default DriverPendingApprovalScreen;

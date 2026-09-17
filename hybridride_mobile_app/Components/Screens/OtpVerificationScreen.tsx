import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faPen } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../Context/AuthContext';

const OtpVerificationScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { sendOTP, verifyOTP, isLoading } = useAuth();
    const { phoneNumber = '', userType = 'PASSENGER', channel = 'sms' } = (route.params as any) || {};

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(30);
    const [activeChannel, setActiveChannel] = useState<'sms' | 'whatsapp'>(channel);
    const inputs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleResend = async (targetChannel: 'sms' | 'whatsapp') => {
        if (timer > 0) return;
        try {
            await sendOTP(phoneNumber, targetChannel, userType.toLowerCase());
            setActiveChannel(targetChannel);
            setTimer(30);
            Alert.alert("OTP Sent", `A new verification code was sent via ${targetChannel.toUpperCase()}.`);
        } catch (error: any) {
            Alert.alert("Resend Failed", error.response?.data?.message || "Failed to resend OTP.");
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length === 6) {
            try {
                await verifyOTP(phoneNumber, otpString, userType.toLowerCase());
                Alert.alert("Success", "Logged in successfully");
            } catch (error: any) {
                console.error(error);
                Alert.alert("Verification Failed", error.response?.data?.message || "Invalid OTP. Please try again.");
            }
        } else {
            Alert.alert("Invalid OTP", "Please enter a 6-digit code.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <FontAwesomeIcon icon={faArrowLeft} size={24} color="#111827" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.content}>
                        <Text style={styles.title}>Enter verification code</Text>
                        <View style={styles.subtitleContainer}>
                            <Text style={styles.subtitle}>
                                We've sent a 6-digit code via <Text style={styles.boldText}>{activeChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}</Text> to <Text style={styles.boldText}>{phoneNumber}</Text>
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.editContainer} onPress={() => navigation.goBack()}>
                            <FontAwesomeIcon icon={faPen} size={12} color="#0F766E" />
                            <Text style={styles.editText}>Change phone number</Text>
                        </TouchableOpacity>

                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={ref => { (inputs.current as any)[index] = ref; }}
                                    style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    value={digit}
                                    onChangeText={(value) => handleOtpChange(value, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    autoFocus={index === 0}
                                />
                            ))}
                        </View>

                        <View style={styles.resendSection}>
                            {timer > 0 ? (
                                <Text style={styles.timerText}>Resend code in {timer}s</Text>
                            ) : (
                                <View style={styles.resendOptions}>
                                    <TouchableOpacity style={styles.resendOptionBtn} onPress={() => handleResend('sms')}>
                                        <Text style={styles.resendText}>Resend via SMS</Text>
                                    </TouchableOpacity>
                                    <Text style={{ color: '#9CA3AF', marginHorizontal: 8 }}>|</Text>
                                    <TouchableOpacity style={styles.resendOptionBtn} onPress={() => handleResend('whatsapp')}>
                                        <FontAwesomeIcon icon={faWhatsapp} size={14} color="#25D366" style={{ marginRight: 4 }} />
                                        <Text style={[styles.resendText, { color: '#25D366' }]}>Resend via WhatsApp</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.verifyButton, isLoading && { opacity: 0.7 }]} 
                        onPress={handleVerify}
                        disabled={isLoading}
                    >
                        <Text style={styles.verifyButtonText}>{isLoading ? 'Verifying...' : 'Verify'}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 20,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        paddingHorizontal: 24,
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
    },
    subtitleContainer: {
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        lineHeight: 24,
    },
    boldText: {
        fontWeight: 'bold',
        color: '#111827',
    },
    editContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
    },
    editText: {
        color: '#0F766E', // Teal
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 8,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    otpInput: {
        width: 45,
        height: 55,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    otpInputFilled: {
        borderColor: '#111827',
        borderWidth: 1.5,
    },
    resendSection: {
        alignItems: 'center',
        marginTop: 10,
    },
    timerText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    resendOptions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    resendOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    resendText: {
        color: '#0F766E',
        fontWeight: '700',
        fontSize: 14,
    },
    footer: {
        padding: 24,
    },
    verifyButton: {
        backgroundColor: '#111827',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default OtpVerificationScreen;

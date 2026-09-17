
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../Context/AuthContext';

const PassengerLoginScreen = ({ route }: any) => {
    const navigation = useNavigation();
    const { login, loginWithGoogle, whatsappLogin, isLoading } = useAuth();
    const { userType } = route.params || { userType: 'PASSENGER' };
    const isDriver = userType === 'DRIVER';

    const [activeTab, setActiveTab] = useState('MOBILE');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<any>({});

    // Validation function
    const validateForm = () => {
        const newErrors: any = {};
        const trimmedIdentifier = identifier.trim();
        const trimmedPassword = password.trim();

        if (!trimmedIdentifier) {
            newErrors.identifier = 'Email or phone number is required';
        } else {
            const isEmail = trimmedIdentifier.includes('@');
            if (isEmail) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(trimmedIdentifier)) {
                    newErrors.identifier = 'Please enter a valid email address';
                }
            } else {
                if (!/^\d{10}$/.test(trimmedIdentifier)) {
                    newErrors.identifier = 'Please enter a valid 10-digit phone number';
                }
            }
        }

        if (!trimmedPassword) {
            newErrors.password = 'Password is required';
        } else if (trimmedPassword.length < 6) {
            newErrors.password = 'Password must be at least 6 characters long';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Check if form is valid for button enable
    const isFormValid = () => {
        const id = identifier.trim();
        const pwd = password.trim();
        if (!id || !pwd || pwd.length < 6) return false;
        if (id.includes('@')) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(id);
        } else {
            return /^\d{10}$/.test(id);
        }
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        console.log(";;;;;")

        try {
            const isEmail = identifier.trim().includes('@');

            const response = await login({
                ...(isEmail ? { email: identifier.trim() } : { phone: identifier.trim() }),
                password: password.trim(),
            });

            if (response?.data?.otpRequired) {
                (navigation as any).navigate('OtpVerification', {
                    phoneNumber: response.data.phone || identifier.trim(),
                    userType: userType
                });
            }
            // If token was returned, AuthContext sets user and AppNavigator redirects
        } catch (error: any) {
            console.error(error);
            Alert.alert('Login Failed', error.response?.data?.message || 'Please check your credentials');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <FontAwesomeIcon icon={faArrowLeft} size={20} color="#111827" />
                </TouchableOpacity>
                <View style={[styles.badge, isDriver && styles.badgeDriver]}>
                    <Text style={[styles.badgeText, isDriver && styles.badgeTextDriver]}>
                        {isDriver ? 'DRIVER ACCOUNT' : 'PASSENGER ACCOUNT'}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.content}>
                        {/* Title Section */}
                        <Text style={styles.title}>
                            {isDriver ? 'Welcome back, Captain' : 'Get moving with\nSanchari'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isDriver
                                ? 'Sign in or create your driver account.'
                                : 'Sign in or create your passenger account.'}
                        </Text>

                        {/* Space instead of Tabs */}
                        <View style={{ height: 20 }} />

                        {/* Input Section */}
                        <View>
                            <View style={styles.inputRow}>
                                <TouchableOpacity style={styles.countryCodeContainer}>
                                    <Text style={styles.countryText}>+91</Text>
                                    <FontAwesomeIcon icon={faChevronDown} size={10} color="#6B7280" />
                                </TouchableOpacity>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email or Phone Number"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="email-address"
                                    value={identifier}
                                    onChangeText={setIdentifier}
                                    autoCapitalize="none"
                                />
                                {errors.identifier && <Text style={styles.errorText}>{errors.identifier}</Text>}
                            </View>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={[styles.input, { marginLeft: 0 }]}
                                    placeholder="Password"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                            </View>
                        </View>

                        {/* Continue Button */}
                        <TouchableOpacity
                            style={[styles.continueButton, isFormValid() && styles.continueButtonActive]}
                            disabled={!isFormValid() || isLoading}
                            onPress={handleLogin}
                        >
                            <Text style={[styles.continueButtonText, isFormValid() && styles.continueButtonTextActive]}>
                                {isLoading ? 'Logging in...' : 'Login'}
                            </Text>
                        </TouchableOpacity>

                        {/* Security Check Divider */}
                        <View style={styles.securityContainer}>
                            <View style={styles.line} />
                            <Text style={styles.securityText}>SECURITY CHECK</Text>
                            <View style={styles.line} />
                        </View>

                        {/* Social Buttons */}
                        <TouchableOpacity
                            style={styles.socialButton}
                            disabled={isLoading}
                            onPress={async () => {
                                if (!identifier || identifier.length < 10) {
                                    Alert.alert('Phone Required', 'Please enter your mobile number first.');
                                    return;
                                }
                                try {
                                    await whatsappLogin(identifier);
                                    (navigation as any).navigate('OtpVerification', { phoneNumber: identifier });
                                } catch (error: any) {
                                    console.error(error);
                                    Alert.alert('Login Failed', error.response?.data?.message || 'Check your internet or if the number is registered');
                                }
                            }}
                        >
                            <FontAwesomeIcon icon={faWhatsapp} size={24} color="#25D366" style={{ marginRight: 10 }} />
                            <Text style={styles.socialButtonText}>Login with WhatsApp</Text>
                        </TouchableOpacity>

                        {!isDriver && (
                            <TouchableOpacity
                                style={styles.socialButton}
                                disabled={isLoading}
                                onPress={async () => {
                                    try {
                                        await loginWithGoogle(userType.toLowerCase());
                                    } catch (error: any) {
                                        console.error('Google login catch block:', error);
                                        // Check if user needs to register
                                        if (error.response?.status === 404 && error.response?.data?.isRegistered === false) {
                                            (navigation as any).navigate('ProfileSetup', {
                                                userType,
                                                googleData: error.response.data.googleData
                                            });
                                        } else {
                                            Alert.alert('Google Login Failed', 'Could not sign in with Google or server error');
                                        }
                                    }
                                }}
                            >
                                <FontAwesomeIcon icon={faGoogle} size={24} color="#EA4335" style={{ marginRight: 10 }} />
                                <Text style={styles.socialButtonText}>{isLoading ? 'Signing in...' : 'Google'}</Text>
                            </TouchableOpacity>
                        )}

                        {/* Footer */}
                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>
                                Don't have an account?{' '}
                                <Text
                                    style={styles.signupText}
                                    onPress={() => (navigation as any).navigate('ProfileSetup', { userType, phoneNumber: identifier })}
                                >
                                    Sign Up
                                </Text>
                            </Text>

                            <Text style={styles.footerTerms}>
                                By clicking continue, you agree to our <Text style={styles.linkText}>Terms</Text> and <Text style={styles.linkText}>Privacy</Text>.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Light gray background
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 30,
    },
    backButton: {
        padding: 10,
    },
    badge: {
        backgroundColor: '#E5E7EB',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    badgeText: {
        color: '#374151',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    badgeDriver: {
        backgroundColor: '#F0FDFA', // Light Teal background
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    badgeTextDriver: {
        color: '#0F766E', // Dark Teal text
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    content: {
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 30,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 1,
    },
    activeTabText: {
        color: '#111827',
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    countryCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        width: 100,
        justifyContent: 'space-between',
    },
    countryText: {
        color: '#111827',
        fontWeight: '600',
        fontSize: 16,
    },
    input: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        fontSize: 18,
        color: '#111827',
        fontWeight: '600',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
        marginLeft: 10,
    },
    continueButton: {
        backgroundColor: '#E5E7EB', // Disabled looking state
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 30,
    },
    continueButtonText: {
        color: '#9CA3AF',
        fontSize: 16,
        fontWeight: '800',
    },
    continueButtonActive: {
        backgroundColor: '#111827', // dark/active color
    },
    continueButtonTextActive: {
        color: '#FFFFFF',
    },
    securityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        justifyContent: 'center',
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    securityText: {
        marginHorizontal: 10,
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 1.5,
    },
    socialButton: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    footerContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    footerText: {
        color: '#6B7280',
        fontSize: 14,
        marginBottom: 10,
    },
    signupText: {
        color: '#10B981', // Green
        fontWeight: 'bold',
    },
    footerTerms: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 12,
    },
    linkText: {
        color: '#111827',
        fontWeight: '800',
        textDecorationLine: 'underline',
    },
});

export default PassengerLoginScreen;

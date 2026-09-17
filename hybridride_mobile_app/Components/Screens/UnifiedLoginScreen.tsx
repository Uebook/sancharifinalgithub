
import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    BackHandler,
    Modal,
    StatusBar,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronDown, faArrowLeft, faArrowRight, faCheck, faUser, faClock } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp, faGoogle, faApple } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../Context/AuthContext';

const { width } = Dimensions.get('window');

const UnifiedLoginScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { loginWithGoogle, sendOTP, isLoading } = useAuth();
    const phoneInputRef = useRef<TextInput>(null);

    const { userType = 'PASSENGER' } = route.params || {};
    const isDriver = userType === 'DRIVER';

    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [showNotRegisteredModal, setShowNotRegisteredModal] = useState(false);

    const languages = ['English', 'हिंदी (Hindi)', 'മലയാളം (Malayalam)', 'ಕನ್ನಡ (Kannada)', 'தமிழ் (Tamil)', 'తెలుగు (Telugu)'];

    const handleBack = React.useCallback(() => {
        (navigation as any).navigate('Entry');
        return true;
    }, [navigation]);

    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => handleBack();
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [handleBack])
    );

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const isPhoneValid = cleanPhone.length === 10;

    const handleSendOTP = async (targetChannel: 'sms' | 'whatsapp' = 'sms') => {
        if (!isPhoneValid) {
            phoneInputRef.current?.focus();
            Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
            return;
        }

        try {
            await sendOTP(cleanPhone, targetChannel, userType.toLowerCase(), true);

            (navigation as any).navigate('OtpVerification', {
                phoneNumber: cleanPhone,
                userType,
                channel: targetChannel,
                isLogin: true
            });
        } catch (error: any) {
            console.error('SendOTP Error:', error);
            const status = error.response?.status;
            const resData = error.response?.data;
            if (status === 404 || resData?.isRegistered === false || resData?.message?.toLowerCase().includes('not registered')) {
                setShowNotRegisteredModal(true);
            } else {
                Alert.alert('OTP Request Failed', resData?.message || 'Something went wrong. Please try again.');
            }
        }
    };

    const handleWhatsAppLogin = async () => {
        if (isPhoneValid) {
            handleSendOTP('whatsapp');
        } else {
            phoneInputRef.current?.focus();
            Alert.alert(
                'WhatsApp Sign-In',
                'Please enter your 10-digit mobile number in the box above to receive your OTP via WhatsApp.'
            );
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle(userType.toLowerCase());
        } catch (error: any) {
            console.error('Google login error:', error);
            if (error.response?.status === 404 && error.response?.data?.isRegistered === false) {
                (navigation as any).navigate('ProfileSetup', {
                    userType,
                    phoneNumber,
                    googleData: error.response.data.googleData
                });
            } else {
                Alert.alert('Google Login Failed', 'Could not sign in with Google.');
            }
        }
    };

    const handleAppleLogin = () => {
        Alert.alert('Apple Sign-In', 'Apple authentication will be available in the production build.');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor="#00897B" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Top Navigation Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
                        <FontAwesomeIcon icon={faArrowLeft} size={22} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={styles.headerRight}>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>{isDriver ? 'DRIVER ACCOUNT' : 'PASSENGER ACCOUNT'}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.languageSelector}
                            onPress={() => setShowLanguageModal(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.languageText}>{selectedLanguage.split(' ')[0]}</Text>
                            <FontAwesomeIcon icon={faChevronDown} size={11} color="#FFFFFF" style={{ marginLeft: 5 }} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Content Card */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.cardWrapper}
                >
                    <View style={styles.card}>
                        <Text style={styles.brandTitle}>Sanchari</Text>
                        <Text style={styles.tagline}>Moving together, every journey.</Text>

                        {/* Phone Number Input */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                ref={phoneInputRef}
                                style={[
                                    styles.input,
                                    isPhoneValid && styles.inputValid,
                                ]}
                                placeholder="Phone Number"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="phone-pad"
                                value={phoneNumber}
                                onChangeText={(text) => {
                                    const digitsOnly = text.replace(/\D/g, '').slice(0, 10);
                                    setPhoneNumber(digitsOnly);
                                }}
                                maxLength={10}
                            />
                        </View>

                        {/* Send OTP Button */}
                        <TouchableOpacity
                            style={[
                                styles.sendOtpButton,
                                isPhoneValid ? styles.sendOtpButtonActive : styles.sendOtpButtonDisabled,
                            ]}
                            onPress={() => handleSendOTP('sms')}
                            disabled={!isPhoneValid || isLoading}
                            activeOpacity={0.85}
                        >
                            <Text
                                style={[
                                    styles.sendOtpText,
                                    isPhoneValid ? styles.sendOtpTextActive : styles.sendOtpTextDisabled,
                                ]}
                            >
                                {isLoading ? 'Sending...' : 'Send OTP'}
                            </Text>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or sign in with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Sign-in Icons (WhatsApp, Google, Apple) */}
                        <View style={styles.socialContainer}>
                            <TouchableOpacity
                                style={styles.socialIconCircle}
                                onPress={handleWhatsAppLogin}
                                activeOpacity={0.8}
                            >
                                <FontAwesomeIcon icon={faWhatsapp} size={28} color="#25D366" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.socialIconCircle}
                                onPress={handleGoogleLogin}
                                activeOpacity={0.8}
                            >
                                <FontAwesomeIcon icon={faGoogle} size={24} color="#EA4335" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.socialIconCircle}
                                onPress={handleAppleLogin}
                                activeOpacity={0.8}
                            >
                                <FontAwesomeIcon icon={faApple} size={26} color="#000000" />
                            </TouchableOpacity>
                        </View>

                        {/* Don't have an account? Sign Up */}
                        <Text style={styles.signUpText}>
                            Don't have an account?{' '}
                            <Text
                                style={styles.signUpLink}
                                onPress={() => (navigation as any).navigate('ProfileSetup', { userType, phoneNumber })}
                            >
                                Sign Up
                            </Text>
                        </Text>

                        {/* Terms & Privacy */}
                        <Text style={styles.termsText}>
                            By clicking continue, you agree to our{' '}
                            <Text style={styles.termsLink}>Terms</Text> and <Text style={styles.termsLink}>Privacy</Text>
                        </Text>
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>

            {/* Language Selector Modal */}
            <Modal
                visible={showLanguageModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLanguageModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setShowLanguageModal(false)}
                >
                    <View style={styles.langModalCard}>
                        <Text style={styles.langModalTitle}>Select Language</Text>
                        {languages.map((lang) => {
                            const isSelected = selectedLanguage.startsWith(lang.split(' ')[0]);
                            return (
                                <TouchableOpacity
                                    key={lang}
                                    style={[styles.langOption, isSelected && styles.langOptionSelected]}
                                    onPress={() => {
                                        setSelectedLanguage(lang);
                                        setShowLanguageModal(false);
                                    }}
                                >
                                    <Text style={[styles.langOptionText, isSelected && styles.langOptionTextSelected]}>
                                        {lang}
                                    </Text>
                                    {isSelected && <FontAwesomeIcon icon={faCheck} size={16} color="#00897B" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Custom Not Registered Popup Modal */}
            <Modal
                visible={showNotRegisteredModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowNotRegisteredModal(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.notRegCard}>
                        {/* Top Banner Graphic */}
                        <Image
                            source={isDriver ? require('../../assets/images/Partner.png') : require('../../assets/images/Customer.png')}
                            style={styles.notRegImage}
                            resizeMode="cover"
                        />

                        {/* Bottom Actions Section */}
                        <View style={styles.notRegBottomContainer}>
                            {/* Create Account Button */}
                            <TouchableOpacity
                                style={styles.createAccountBtn}
                                activeOpacity={0.85}
                                onPress={() => {
                                    setShowNotRegisteredModal(false);
                                    (navigation as any).navigate('ProfileSetup', {
                                        userType,
                                        phoneNumber: phoneNumber.replace(/\D/g, '')
                                    });
                                }}
                            >
                                <View style={styles.createAccountBtnLeft}>
                                    <FontAwesomeIcon icon={faUser} size={17} color="#FFFFFF" style={{ marginRight: 10 }} />
                                    <Text style={styles.createAccountBtnText}>Create Account</Text>
                                </View>
                                <FontAwesomeIcon icon={faArrowRight} size={16} color="#FFFFFF" />
                            </TouchableOpacity>

                            {/* Maybe Later Button */}
                            <TouchableOpacity
                                style={styles.maybeLaterBtn}
                                activeOpacity={0.7}
                                onPress={() => setShowNotRegisteredModal(false)}
                            >
                                <FontAwesomeIcon icon={faClock} size={17} color="#00796B" style={{ marginRight: 8 }} />
                                <Text style={styles.maybeLaterBtnText}>Maybe Later</Text>
                            </TouchableOpacity>

                            {/* Divider Line */}
                            <View style={styles.notRegDivider} />

                            {/* Trust Footer */}
                            <Text style={styles.notRegTrustText}>Safe. Secure. Trusted by thousands.</Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#00897B', // Rich emerald / dark teal green
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 10,
    },
    backButton: {
        padding: 6,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 14,
    },
    roleText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    languageSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    languageText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    cardWrapper: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingBottom: 20,
        width: '100%',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 36,
        paddingBottom: 28,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    brandTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 6,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    tagline: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 28,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 16,
    },
    input: {
        width: '100%',
        height: 56,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        paddingHorizontal: 18,
        fontSize: 16,
        color: '#111827',
        backgroundColor: '#F8FAFC',
    },
    inputValid: {
        borderColor: '#00897B',
        backgroundColor: '#FFFFFF',
    },
    sendOtpButton: {
        width: '100%',
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    sendOtpButtonDisabled: {
        backgroundColor: '#E5E7EB',
    },
    sendOtpButtonActive: {
        backgroundColor: '#00897B',
        shadowColor: '#00897B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    sendOtpText: {
        fontSize: 16,
        fontWeight: '700',
    },
    sendOtpTextDisabled: {
        color: '#9CA3AF',
    },
    sendOtpTextActive: {
        color: '#FFFFFF',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        paddingHorizontal: 12,
        color: '#9CA3AF',
        fontSize: 13,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 18,
        marginBottom: 26,
    },
    socialIconCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    activeSocialCircleWhatsApp: {
        borderColor: '#25D366',
        borderWidth: 2,
        backgroundColor: '#F0FDF4',
    },
    signUpText: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 22,
        textAlign: 'center',
    },
    signUpLink: {
        color: '#00897B',
        fontWeight: '700',
    },
    termsText: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 16,
        paddingHorizontal: 8,
    },
    termsLink: {
        color: '#111827',
        fontWeight: '700',
    },
    // Modal Styles
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    langModalCard: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    langModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'center',
    },
    langOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginBottom: 4,
    },
    langOptionSelected: {
        backgroundColor: '#E6F5F3',
    },
    langOptionText: {
        fontSize: 15,
        color: '#374151',
    },
    langOptionTextSelected: {
        color: '#00897B',
        fontWeight: '700',
    },
    notRegCard: {
        width: '90%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: 26,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 16,
    },
    notRegImage: {
        width: '100%',
        height: 385,
    },
    notRegBottomContainer: {
        width: '100%',
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 16,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    createAccountBtn: {
        width: '100%',
        height: 52,
        backgroundColor: '#00796B',
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 18,
        marginBottom: 6,
        shadowColor: '#00796B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    createAccountBtnLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    createAccountBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    maybeLaterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        marginBottom: 10,
    },
    maybeLaterBtnText: {
        color: '#00796B',
        fontSize: 16,
        fontWeight: '700',
    },
    notRegDivider: {
        width: '100%',
        height: 1,
        backgroundColor: '#E5E7EB',
        marginBottom: 12,
    },
    notRegTrustText: {
        color: '#9CA3AF',
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
    },
});

export default UnifiedLoginScreen;

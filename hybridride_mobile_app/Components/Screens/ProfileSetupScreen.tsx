
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Dimensions,
    Alert,
    Image,
    BackHandler,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCamera, faHome, faBriefcase, faPlus, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../Context/AuthContext';
import { driverService } from '../../Services/driverService';

const { width } = Dimensions.get('window');

const ProfileSetupScreen = ({ route }: any) => {
    const navigation = useNavigation();
    const { register, refetchUser, isLoading } = useAuth();
    const { userType, phoneNumber, googleData, userData } = route.params || { userType: 'PASSENGER', phoneNumber: '', googleData: null, userData: null };
    const isDriver = userType === 'DRIVER' || userData?.role?.toLowerCase() === 'driver';

    const handleBack = React.useCallback(() => {
        (navigation as any).navigate('UnifiedLogin', { userType: isDriver ? 'DRIVER' : 'PASSENGER' });
        return true;
    }, [navigation, isDriver]);

    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => handleBack();
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [handleBack])
    );

    const [fullName, setFullName] = useState(userData?.name || googleData?.name || '');
    const [email, setEmail] = useState(userData?.email || googleData?.email || '');
    const [password, setPassword] = useState(userData?.password || '');

    // Store phone in state to allow editing if missing or incorrect
    const [phone, setPhone] = useState(userData?.phone || phoneNumber || '');
    const [isEditingPhone, setIsEditingPhone] = useState(!(userData?.phone || phoneNumber));
    const [profileImage, setProfileImage] = useState<string | null>(userData?.profileImage || googleData?.picture || null);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors: any = {};
        const trimmedName = fullName.trim();
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        const trimmedPhone = phone.trim();

        if (!trimmedName) {
            newErrors.fullName = 'Full name is required';
        } else if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
            newErrors.fullName = 'Full name can only contain letters and spaces';
        }

        if (!trimmedEmail) {
            newErrors.email = 'Email is required';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                newErrors.email = 'Please enter a valid email address';
            }
        }

        if (!trimmedPhone) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(trimmedPhone)) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
        }

        if (!trimmedPassword) {
            newErrors.password = 'Password is required';
        } else if (trimmedPassword.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        }

        setErrors(newErrors);
        console.log("DEBUG: validateForm result:", Object.keys(newErrors).length === 0, "Errors:", newErrors);
        if (Object.keys(newErrors).length > 0) {
            const firstError = Object.values(newErrors)[0];
            Alert.alert("Validation Error", firstError as string);
        }
        return Object.keys(newErrors).length === 0;
    };

    const handlePickProfileImage = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
        });

        if (result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            if (uri) {
                setProfileImage(uri);
            }
        }
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        const trimmedName = fullName.trim();
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        const trimmedPhone = phone.trim();

        console.log("DEBUG: handleSave called. isDriver:", isDriver, "userType:", userType, "userDataRole:", userData?.role);

        if (isDriver) {
            // Pass data to next screen for drivers
            console.log("Navigating to DriverVehicleSelection with googleIdToken:", !!googleData?.idToken);
            (navigation as any).navigate('DriverVehicleSelection', {
                userData: { ...route.params?.userData, name: trimmedName, email: trimmedEmail, phone: trimmedPhone, password: trimmedPassword, role: 'driver', profileImage, googleIdToken: googleData?.idToken } // Pass image URI & Google token
            });
        } else {
            try {
                // Register immediately for passengers
                await register({
                    name: trimmedName,
                    email: trimmedEmail,
                    phone: trimmedPhone, // Use phone state
                    password: trimmedPassword,
                    role: 'passenger',
                    googleIdToken: googleData?.idToken, // If coming from Google
                    profileImage: googleData?.picture === profileImage ? profileImage : undefined // Send if it's the google URL
                });

                // If there's a new profile image picked from device, upload it now
                if (profileImage && !profileImage.startsWith('http')) {
                    console.log("Uploading passenger profile image...");
                    const formData = new FormData();
                    formData.append('docType', 'profileImage');
                    formData.append('document', {
                        uri: profileImage,
                        type: 'image/jpeg',
                        name: 'profile.jpg',
                    } as any);

                    try {
                        await driverService.uploadDocument(formData);
                        console.log("Profile image uploaded successfully");
                        // Refresh user data to get the updated profileImage from backend
                        await refetchUser();
                    } catch (err: any) {
                        console.error("Failed to upload profile image:", err);
                    }
                }
                // Navigation handled by AppNavigator automatically
            } catch (error: any) {
                console.error("Registration Error Detail:", error.response?.data || error.message);
                const errorMessage = error.response?.data?.message || (error.response?.status === 409 ? "This email or phone is already registered." : "Something went wrong. Please try again.");
                Alert.alert('Registration Failed', errorMessage);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack}>
                    <FontAwesomeIcon icon={faArrowLeft} size={24} color="#111827" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Profile Setup</Text>
                    <Text style={styles.headerSubtitle}>Let's personalize your experience.</Text>
                </View>
                {/* Spacer for alignment since Skip is removed */}
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Profile Image Placeholer */}
                    <View style={styles.profileImageContainer}>
                        <TouchableOpacity style={styles.profileImageCircle} onPress={handlePickProfileImage}>
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.profileImage} />
                            ) : (
                                <FontAwesomeIcon icon={faCamera} size={40} color="#9CA3AF" style={{ opacity: 0.5 }} />
                            )}
                            <View style={styles.addButton}>
                                <FontAwesomeIcon icon={faPlus} size={12} color="#FFFFFF" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <Text style={styles.label}>MOBILE NUMBER</Text>

                        {isEditingPhone ? (
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Enter Mobile Number"
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                        ) : (
                            <View style={styles.readOnlyInputContainer}>
                                <Text style={styles.readOnlyText}>{phone || 'Enter Phone Number'}</Text>
                                <TouchableOpacity onPress={() => setIsEditingPhone(true)}>
                                    <Text style={styles.changeText}>CHANGE</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {((errors as any).phone) && <Text style={styles.errorText}>{(errors as any).phone}</Text>}

                        <Text style={styles.helperText}>Used for ride updates and security.</Text>

                        <Text style={styles.label}>FULL NAME</Text>
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Ex. John Doe"
                        />

                        {((errors as any).fullName) && <Text style={styles.errorText}>{(errors as any).fullName}</Text>}

                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="name@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        {((errors as any).email) && <Text style={styles.errorText}>{(errors as any).email}</Text>}



                        <Text style={styles.label}>PASSWORD</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Create a password"
                            secureTextEntry
                        />

                        {((errors as any).password) && <Text style={styles.errorText}>{(errors as any).password}</Text>}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer Button - Fixed at bottom */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    <Text style={styles.saveButtonText}>
                        {isLoading ? 'Creating Account...' : (isDriver ? 'Next: Vehicle Details' : 'Save & Continue')}
                    </Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'// Very light background
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 20,
        backgroundColor: '#F9FAFB',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6B7280',
    },
    skipText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#9CA3AF',
        paddingTop: 10,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 100, // Space for footer
        paddingTop: 10,
    },
    profileImageContainer: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    profileImageCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    addButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#10B981', // Green
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    formContainer: {
        marginBottom: 30,
    },
    label: {
        fontSize: 12,
        fontWeight: '800', // Extra bold
        color: '#9CA3AF', // Light gray text
        marginBottom: 8,
        letterSpacing: 0.5,
        marginTop: 10,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 10,
    },
    optionalLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#D1D5DB',
        letterSpacing: 0.5,
    },
    readOnlyInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB', // Slightly distinct background?
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 8,
    },
    readOnlyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    changeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10B981', // Green
    },
    helperText: {
        fontSize: 11, // Small helper text
        color: '#9CA3AF',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB', // Light border
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 18,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 10,
    },    errorText: {
        color: 'red',
        fontSize: 12,
        marginBottom: 10,
    },    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 16,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginTop: 20,
    },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        // Subtle shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    iconCircleLight: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    addressTextContainer: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    addressValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#9CA3AF', // Gray until set
    },
    addLink: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#059669',
    },
    favoritesContainer: {
        backgroundColor: '#F3F4F6', // Dashed border area background
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        marginTop: 10,
        marginBottom: 40,
    },
    heartCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    heartIcon: {
        fontSize: 20,
        color: '#D1D5DB', // Light gray heart
    },
    favoritesText: {
        textAlign: 'center',
        color: '#6B7280',
        fontSize: 14,
        lineHeight: 20,
        paddingHorizontal: 40,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    saveButton: {
        backgroundColor: '#111827', // Dark blue/black
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
});

export default ProfileSetupScreen;

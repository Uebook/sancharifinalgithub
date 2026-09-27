
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Alert,
    Modal,
    BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft,
    faIdCard,
    faCreditCard,
    faLock,
    faUnlock,
    faFileLines,
    faCar,
    faTriangleExclamation,
    faChevronRight,
    faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../Context/AuthContext';
import { authService } from '../../Services/authService';
import { driverService } from '../../Services/driverService';

import { driverOnboardingStorage } from '../../Services/driverOnboardingStorage';

const { width } = Dimensions.get('window');

const DriverRegistrationScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const isReupload = route.name === 'ReuploadRegistration';
    const { register, refetchUser, logout, user, isLoading: authLoading } = useAuth();

    // Params
    const params = route.params as {
        vehicleType?: string,
        completedDocument?: string,
        updatedDocList?: string[],
        userData?: any,
        capturedDocs?: Record<string, string>
    } || {};

    const initialVehicleType = params.vehicleType || user?.driverDetails?.vehicle?.type || 'CAR';
    const initialUserData = params.userData || (user ? {
        name: user.name,
        email: user.email,
        phone: user.phone,
        vehicle: user.driverDetails?.vehicle || {},
    } : {});
    const initialCapturedDocs = params.capturedDocs || user?.driverDetails?.documents || {};
    const initialUploadedDocs = params.updatedDocList || Object.keys(user?.driverDetails?.documents || {});

    const [vehicleType, setVehicleType] = useState<string>(initialVehicleType);
    // State to hold merged user data across navigation
    const [mergedUserData, setMergedUserData] = useState(initialUserData);

    const getDocLabel = (baseLabel: string) => {
        const type = (vehicleType || 'CAR').toUpperCase();
        if (baseLabel === 'RC') return type === 'BIKE' ? 'Bike RC' : (type === 'AUTO' ? 'Auto RC' : 'Car RC');
        if (baseLabel === 'Insurance') return type === 'BIKE' ? 'Bike Insurance' : (type === 'AUTO' ? 'Auto Insurance' : 'Car Insurance');
        if (baseLabel === 'Permit') return type === 'BIKE' ? 'Bike Permit' : (type === 'AUTO' ? 'Auto Permit' : 'Car Permit');
        if (baseLabel === 'Fitness') return type === 'BIKE' ? 'Bike Fitness' : (type === 'AUTO' ? 'Auto Fitness' : 'Car Fitness');
        return baseLabel;
    };

    const rcLabel = getDocLabel('RC');
    const insuranceLabel = getDocLabel('Insurance');
    const permitLabel = getDocLabel('Permit');
    const fitnessLabel = getDocLabel('Fitness');

    const [uploadedDocuments, setUploadedDocuments] = useState<string[]>(initialUploadedDocs);
    const [documentUris, setDocumentUris] = useState<Record<string, string>>(initialCapturedDocs);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load initial draft from persistent storage on mount
    useEffect(() => {
        const loadInitialDraft = async () => {
            const draft = await driverOnboardingStorage.getDraft();
            if (draft) {
                if (draft.vehicleType && !params.vehicleType) {
                    setVehicleType(draft.vehicleType);
                }
                if (draft.userData) {
                    setMergedUserData((prev: any) => ({
                        ...draft.userData,
                        ...prev,
                        ...(params.userData || {})
                    }));
                }
                if (draft.capturedDocs) {
                    setDocumentUris((prev: any) => ({
                        ...draft.capturedDocs,
                        ...prev,
                        ...(params.capturedDocs || {})
                    }));
                }
                if (draft.uploadedDocuments) {
                    setUploadedDocuments((prev: any) => {
                        const merged = Array.from(new Set([
                            ...draft.uploadedDocuments!,
                            ...prev,
                            ...(params.updatedDocList || []),
                            ...(params.completedDocument ? [params.completedDocument] : [])
                        ]));
                        return merged;
                    });
                }
            }
        };
        loadInitialDraft();
    }, []);

    const handleBack = React.useCallback(async () => {
        await driverOnboardingStorage.saveDraft({
            userData: mergedUserData,
            capturedDocs: documentUris,
            uploadedDocuments,
            vehicleType
        });

        if (isReupload) {
            (navigation as any).navigate('DriverPendingApproval');
        } else if (user && user.role === 'driver' && user.driverApprovalStatus === 'approved') {
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                (navigation as any).navigate('DriverProfile');
            }
        } else {
            (navigation as any).navigate('DriverVehicleSelection', {
                userData: mergedUserData,
                vehicleType,
                capturedDocs: documentUris,
                updatedDocList: uploadedDocuments
            });
        }
        return true;
    }, [navigation, mergedUserData, documentUris, uploadedDocuments, vehicleType, isReupload, user]);

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
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const isLoading = authLoading || isSubmitting;

    useEffect(() => {
        if (params.vehicleType) {
            setVehicleType(params.vehicleType);
        }

        let updatedData = { ...mergedUserData };
        let updatedDocs = { ...documentUris };
        let updatedList = [...uploadedDocuments];

        // Merge userData if present
        if (params.userData) {
            updatedData = {
                ...updatedData,
                ...params.userData
            };
            setMergedUserData(updatedData);
        }

        // Handle captured documents from Upload Screen
        if (params.capturedDocs) {
            updatedDocs = {
                ...updatedDocs,
                ...params.capturedDocs
            };
            setDocumentUris(updatedDocs);
        }

        // Handle visual state of "Uploaded" keys
        if (params.updatedDocList) {
            updatedList = Array.from(new Set([...updatedList, ...params.updatedDocList]));
            setUploadedDocuments(updatedList);
        } else if (params.completedDocument) {
            if (!updatedList.includes(params.completedDocument)) {
                updatedList = [...updatedList, params.completedDocument];
                setUploadedDocuments(updatedList);
            }
        }

        // Auto-save any incoming updates into storage
        driverOnboardingStorage.saveDraft({
            userData: updatedData,
            capturedDocs: updatedDocs,
            uploadedDocuments: updatedList,
            vehicleType: params.vehicleType || vehicleType
        });
    }, [params.completedDocument, params.updatedDocList, params.capturedDocs, params.userData, params.vehicleType]);

    const checkIsCompleted = (title: string) => {
        if (uploadedDocuments.includes(title)) return true;
        if (title === 'Aadhaar Card') return !!(documentUris.aadharFront);
        if (title === 'PAN Card') return !!documentUris.panCard;
        if (title === 'Driving License') return !!(documentUris.licenseFront);
        if (title.includes('RC')) return !!documentUris.rc;
        if (title.includes('Insurance')) return !!documentUris.insurance;
        if (title.includes('Permit')) return !!documentUris.permit;
        if (title.includes('Fitness')) return !!documentUris.fitness;
        if (title === 'Vehicle Details') return !!(mergedUserData?.vehicle?.make && mergedUserData?.vehicle?.plateNumber);
        return false;
    };

    const hasRC =
        uploadedDocuments.includes(rcLabel) ||
        uploadedDocuments.includes('RC') ||
        uploadedDocuments.includes('Bike RC') ||
        uploadedDocuments.includes('Car RC') ||
        uploadedDocuments.includes('Auto RC') ||
        uploadedDocuments.includes('Traveler RC') ||
        !!documentUris.rc;

    const hasInsurance =
        uploadedDocuments.includes(insuranceLabel) ||
        uploadedDocuments.includes('Insurance') ||
        uploadedDocuments.includes('Bike Insurance') ||
        uploadedDocuments.includes('Car Insurance') ||
        uploadedDocuments.includes('Auto Insurance') ||
        uploadedDocuments.includes('Traveler Insurance') ||
        !!documentUris.insurance;

    const isIdentityVerified = checkIsCompleted('Aadhaar Card');
    const isMandatoryComplete = isIdentityVerified &&
        checkIsCompleted('Driving License') &&
        hasRC &&
        hasInsurance &&
        checkIsCompleted('Vehicle Details');

    const handleRegistration = async () => {
        // Relax check: Google users might not have a password yet if we didn't force one in ProfileSetup
        const isExistingUser = !!user;

        if (!isExistingUser && (!mergedUserData || (!mergedUserData.password && !mergedUserData.googleIdToken))) {
            Alert.alert('Error', 'Missing user information. Please restart registration.');
            return;
        }

        setIsSubmitting(true);

        try {
            if (!isExistingUser) {
                // 1. Register User (Gets Token & Saves to AsyncStorage via authService)
                console.log("Registering new user...");

                // Explicitly construct payload to ensure no property loss
                const registerPayload = {
                    name: mergedUserData.name,
                    email: mergedUserData.email,
                    phone: mergedUserData.phone,
                    password: mergedUserData.password,
                    role: 'driver', // Force driver role on this screen
                    googleIdToken: mergedUserData.googleIdToken, // Pass Google Token
                    driverDetails: {
                        vehicle: {
                            ...mergedUserData.vehicle,
                            type: vehicleType // Ensure vehicle type (CAR, BIKE, etc.) is included
                        }
                    }
                };

                console.log("DEBUG: Sending Register Payload:", JSON.stringify(registerPayload, null, 2));
                await authService.register(registerPayload);

                // Wait a moment for AsyncStorage to persist the token
                await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
            } else {
                console.log("Existing user detected. Proceeding to document uploads...");

                // Optionally update vehicle details if they were changed
                if (mergedUserData.vehicle) {
                    console.log("Updating vehicle details for existing driver...");
                }
            }

            console.log("Starting uploads...");

            // 2. Upload Profile Image (if exists)
            if (mergedUserData.profileImage && !mergedUserData.profileImage.startsWith('http')) {
                console.log("Uploading profile image...");
                const profileFormData = new FormData();
                profileFormData.append('document', {
                    uri: mergedUserData.profileImage,
                    type: 'image/jpeg',
                    name: 'profile.jpg',
                } as any);
                profileFormData.append('docType', 'profileImage');

                try {
                    await driverService.uploadDocument(profileFormData);
                    console.log("Profile image uploaded successfully.");
                } catch (err: any) {
                    const serverError = err.response?.data?.error || err.message;
                    console.error("Failed to upload profile image:", serverError);
                }
            }

            // 2. Upload Other Documents (Sequential to avoid race conditions)
            for (const [docType, uri] of Object.entries(documentUris)) {
                if (uri.startsWith('http')) continue; // Skip already uploaded/server-side URLs

                console.log(`Uploading ${docType}...`);
                const formData = new FormData();
                formData.append('document', {
                    uri: uri,
                    type: 'image/jpeg',
                    name: `${docType}.jpg`,
                } as any);
                formData.append('docType', docType);

                try {
                    await driverService.uploadDocument(formData);
                    console.log(`Uploaded ${docType} successfully.`);
                } catch (err: any) {
                    const serverError = err.response?.data?.error || err.message;
                    console.error(`Failed to upload ${docType}:`, serverError);
                }
            }

            // If it's a re-upload, we might need to tell the backend to reset status to pending
            if (isExistingUser) {
                console.log("Re-upload complete. Status will be checked by admin.");
            }

            console.log("All documents uploaded.");

            // Clear draft upon successful account creation / submission
            await driverOnboardingStorage.clearDraft();

            // 3. Update Auth Context to trigger navigation
            setIsSubmitting(false);
            setShowSuccessModal(true);

            setTimeout(async () => {
                setShowSuccessModal(false);
                await refetchUser();

                // Navigate to Under Review screen
                (navigation as any).navigate('DriverPendingApproval');
            }, 5000);

        } catch (error: any) {
            console.error("Registration/Upload Error", error);
            setIsSubmitting(false);

            if (error.response?.status === 409) {
                Alert.alert(
                    'Account Already Exists',
                    'An account with this email/phone is already registered.\n\nIf your application was rejected, please sign in to re-upload your documents.',
                    [{ text: 'Go to Sign In', onPress: () => (navigation as any).navigate('UnifiedLogin', { userType: 'DRIVER' }) }]
                );
            }
            else {
                Alert.alert(
                    'Registration Failed',
                    error.response?.data?.message || error.message || 'Please try again.'
                );
            }
        }
    };

    const renderStep = (title: string, subtitle: string, icon: any, isLocked: boolean = false, isOptional: boolean = false, onPress?: () => void) => {
        const isCompleted = checkIsCompleted(title);

        return (
            <TouchableOpacity
                style={[styles.stepCard, isLocked && styles.stepCardLocked, isCompleted && styles.stepCardCompleted]}
                disabled={isLocked}
                onPress={onPress}
            >
                <View style={[styles.iconBox, isLocked ? styles.iconBoxLocked : (isCompleted ? styles.iconBoxCompleted : styles.iconBoxActive)]}>
                    <FontAwesomeIcon icon={isCompleted ? faCheckCircle : (isLocked ? faLock : icon)} size={20} color={isLocked ? "#9CA3AF" : (isCompleted ? "#10B981" : "#374151")} />
                </View>
                <View style={styles.stepTextContainer}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.stepTitle, isLocked && styles.textLocked, isCompleted && styles.textCompleted]}>{title}</Text>
                        {isOptional && !isCompleted && <View style={styles.optionalBadge}><Text style={styles.optionalText}>OPTIONAL</Text></View>}
                    </View>
                    <Text style={[styles.stepSubtitle, isLocked && styles.textLocked]}>
                        {isCompleted ? "Verified & Uploaded" : subtitle}
                    </Text>
                </View>
                <View style={styles.actionIcon}>
                    {isCompleted ? (
                        <FontAwesomeIcon icon={faCheckCircle} size={20} color="#10B981" />
                    ) : (
                        isLocked ? (
                            <View style={styles.lockedCircle} />
                        ) : (
                            <FontAwesomeIcon icon={faChevronRight} size={14} color="#9CA3AF" />
                        )
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Fixed Header */}
            <View style={styles.headerContainer}>
                <SafeAreaView edges={['top', 'left', 'right']}>
                    <View style={styles.navBar}>
                        <Text style={styles.screenTitle}>Driver Registration</Text>
                        <TouchableOpacity onPress={handleBack}>
                            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.logoutHeaderButton}
                            onPress={async () => {
                                await logout();
                                (navigation as any).navigate('Entry');
                            }}
                        >
                            <Text style={styles.logoutHeaderText}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.vehicleTag}>
                        <Text style={styles.vehicleTagText}>PRIMARY: {vehicleType}</Text>
                    </View>

                    <View style={styles.statusCard}>
                        <View style={styles.warningIconCircle}>
                            <FontAwesomeIcon icon={faTriangleExclamation} size={20} color="#FFFFFF" />
                        </View>
                        <View style={styles.statusTextContainer}>
                            <Text style={styles.statusTitle}>Registration Progress</Text>
                            <Text style={styles.statusSubtitle}>Finish identity to unlock vehicle steps.</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            {/* Scrollable Content */}
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <Text style={styles.sectionHeader}>IDENTITY VERIFICATION</Text>
                {renderStep("Aadhaar Card", "Government Identity (Mandatory)", faIdCard, false, false, () => (navigation as any).navigate(isReupload ? 'ReuploadDocumentUpload' : 'DriverDocumentUpload', {
                    documentName: 'Aadhaar Card',
                    description: 'Upload a clear photo of your Aadhaar card (Front & Back).',
                    existingDocs: uploadedDocuments,
                    vehicleType,
                    userData: mergedUserData,
                    capturedDocs: documentUris
                }))}
                {renderStep("PAN Card", "For Tax Compliance (Optional)", faCreditCard, !isIdentityVerified, true, () => (navigation as any).navigate(isReupload ? 'ReuploadDocumentUpload' : 'DriverDocumentUpload', {
                    documentName: 'PAN Card',
                    description: 'Upload a clear photo of your PAN card (Front).',
                    existingDocs: uploadedDocuments,
                    vehicleType,
                    userData: mergedUserData,
                    capturedDocs: documentUris
                }))}

                <Text style={styles.sectionHeader}>VEHICLE VERIFICATION</Text>
                {renderStep("Driving License", "Valid government DL (Mandatory)", faFileLines, !isIdentityVerified, false, () => (navigation as any).navigate(isReupload ? 'ReuploadDocumentUpload' : 'DriverDocumentUpload', {
                    documentName: 'Driving License',
                    description: 'Upload a clear photo of your Driving License (Front & Back).',
                    existingDocs: uploadedDocuments,
                    vehicleType,
                    userData: mergedUserData,
                    capturedDocs: documentUris
                }))}

                {renderStep(rcLabel, "Registration Certificate (Mandatory)", faFileLines, !isIdentityVerified, false, () => (navigation as any).navigate(isReupload ? 'ReuploadDocumentUpload' : 'DriverDocumentUpload', {
                    documentName: rcLabel,
                    description: `Upload a clear photo of your ${vehicleType} Registration Certificate.`,
                    existingDocs: uploadedDocuments,
                    vehicleType,
                    userData: mergedUserData,
                    capturedDocs: documentUris
                }))}

                {renderStep(insuranceLabel, "Commercial policy (Mandatory)", faFileLines, !isIdentityVerified, false, () => (navigation as any).navigate(isReupload ? 'ReuploadDocumentUpload' : 'DriverDocumentUpload', {
                    documentName: insuranceLabel,
                    description: `Upload ${vehicleType} Insurance Policy.`,
                    existingDocs: uploadedDocuments,
                    vehicleType,
                    userData: mergedUserData,
                    capturedDocs: documentUris
                }))}

                {renderStep(permitLabel, "State transport permit (Optional)", faFileLines, !isIdentityVerified, true, () => (navigation as any).navigate(isReupload ? 'ReuploadDocumentUpload' : 'DriverDocumentUpload', {
                    documentName: permitLabel,
                    description: `Upload ${vehicleType} Permit.`,
                    existingDocs: uploadedDocuments,
                    vehicleType,
                    userData: mergedUserData,
                    capturedDocs: documentUris
                }))}

                {renderStep(fitnessLabel, "Vehicle fitness cert (Optional)", faFileLines, !isIdentityVerified, true, () => (navigation as any).navigate(isReupload ? 'ReuploadDocumentUpload' : 'DriverDocumentUpload', {
                    documentName: fitnessLabel,
                    description: `Upload ${vehicleType} Fitness Certificate.`,
                    existingDocs: uploadedDocuments,
                    vehicleType,
                    userData: mergedUserData,
                    capturedDocs: documentUris
                }))}

                {renderStep("Vehicle Details", "Make, Model & Plate (Mandatory)", faCar, !isIdentityVerified, false, () => (navigation as any).navigate(isReupload ? 'ReuploadVehicleDetails' : 'DriverVehicleDetails', {
                    existingDocs: uploadedDocuments,
                    vehicleType,
                    userData: mergedUserData, // Pass merged data
                    capturedDocs: documentUris
                }))}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Fixed Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.completeButton, isMandatoryComplete && styles.completeButtonActive]}
                    disabled={!isMandatoryComplete || isLoading}
                    onPress={handleRegistration}
                >
                    <Text style={[styles.completeButtonText, isMandatoryComplete && styles.completeButtonTextActive]}>
                        {isLoading
                            ? (!!user ? "Uploading Documents..." : "Creating Account...")
                            : "Submit Documents"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.successIconCircle}>
                            <FontAwesomeIcon icon={faCheckCircle} size={40} color="#10B981" />
                        </View>
                        <Text style={styles.modalTitle}>Documents Sent!</Text>
                        <Text style={styles.modalMessage}>
                            Your documents have been uploaded for verification.
                            You will be notified via email once your profile is approved.
                        </Text>
                        <Text style={styles.modalRedirect}>Redirecting to Under Review...</Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    logoutHeaderButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    logoutHeaderText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: 'bold',
    },
    headerContainer: {
        backgroundColor: '#0F172A', // Dark Blue
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        zIndex: 10,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        marginTop: 10,
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    skipText: {
        color: '#94A3B8',
        fontWeight: '700',
        fontSize: 14,
    },
    vehicleTag: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 5,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    vehicleTagText: {
        color: '#2DD4BF', // Teal
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statusCard: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    warningIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F59E0B', // Amber
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    statusTextContainer: {
        flex: 1,
    },
    statusTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statusSubtitle: {
        color: '#94A3B8',
        fontSize: 12,
    },
    scrollContent: {
        paddingTop: 30,
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 16,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    stepCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    stepCardLocked: {
        backgroundColor: '#FFFFFF', // Or slightly darker?
        opacity: 0.7,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    iconBoxActive: {
        backgroundColor: '#F3F4F6',
    },
    iconBoxLocked: {
        backgroundColor: '#F3F4F6',
    },
    stepTextContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginRight: 8,
    },
    textLocked: {
        color: '#9CA3AF',
    },
    textCompleted: {
        color: '#065F46', // Dark Green
    },
    stepCardCompleted: {
        backgroundColor: '#ECFDF5', // Light Green bg
        borderColor: '#10B981',
        borderWidth: 1,
    },
    iconBoxCompleted: {
        backgroundColor: '#D1FAE5',
    },
    optionalBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    optionalText: {
        fontSize: 8,
        fontWeight: '800',
        color: '#6B7280',
    },
    stepSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    actionIcon: {
        paddingLeft: 10,
    },
    lockedCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    completeButton: {
        backgroundColor: '#E2E8F0', // Disabled look
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    completeButtonText: {
        color: '#94A3B8',
        fontWeight: '800',
        fontSize: 16,
    },
    completeButtonActive: {
        backgroundColor: '#10B981', // Green
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    completeButtonTextActive: {
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        width: '90%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    successIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    modalRedirect: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10B981',
    },
});

export default DriverRegistrationScreen;

import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    BackHandler,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft,
    faPlus,
    faCircleInfo
} from '@fortawesome/free-solid-svg-icons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../Context/AuthContext';
import { driverService } from '../../Services/driverService';
import { driverOnboardingStorage } from '../../Services/driverOnboardingStorage';

const DriverDocumentUploadScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user, refetchUser } = useAuth();
    const { documentName = 'Document', description = 'Upload a clear photo.', existingDocs = [], vehicleType = 'CAR', userData, capturedDocs = {} } = route.params as any || {};
    const isReupload = route.name === 'ReuploadDocumentUpload';
    const targetScreen = isReupload ? 'ReuploadRegistration' : 'DriverRegistration';

    const getDocTypeKey = (uiName: string, side: 'FRONT' | 'BACK') => {
        const lowerName = uiName.toLowerCase();

        if (lowerName.includes('driving license')) return side === 'FRONT' ? 'licenseFront' : 'licenseBack';
        if (lowerName.includes('aadhaar')) return side === 'FRONT' ? 'aadharFront' : 'aadharBack';

        if (lowerName.includes('pan')) return 'panCard';
        if (lowerName.includes('rc') || lowerName.includes('registration')) return 'rc';
        if (lowerName.includes('insurance')) return 'insurance';
        if (lowerName.includes('permit')) return 'permit';
        if (lowerName.includes('fitness')) return 'fitness';

        return 'other';
    };

    const frontDocTypeKey = getDocTypeKey(documentName, 'FRONT');
    const backDocTypeKey = getDocTypeKey(documentName, 'BACK');

    const [frontImage, setFrontImage] = useState<string | null>(capturedDocs[frontDocTypeKey] || null);
    const [backImage, setBackImage] = useState<string | null>(capturedDocs[backDocTypeKey] || null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const loadInitialDraft = async () => {
            const draft = await driverOnboardingStorage.getDraft();
            const initialFront = capturedDocs[frontDocTypeKey] || draft?.capturedDocs?.[frontDocTypeKey] || (user?.driverDetails as any)?.documents?.[frontDocTypeKey] || null;
            const initialBack = capturedDocs[backDocTypeKey] || draft?.capturedDocs?.[backDocTypeKey] || (user?.driverDetails as any)?.documents?.[backDocTypeKey] || null;
            if (initialFront) setFrontImage(initialFront);
            if (initialBack) setBackImage(initialBack);
        };
        loadInitialDraft();
    }, [frontDocTypeKey, backDocTypeKey, capturedDocs, user]);

    const isBothSidesRequired = documentName.toLowerCase().includes('aadhaar') || documentName.toLowerCase().includes('license');
    const isSubmitEnabled = isBothSidesRequired ? (!!frontImage && !!backImage) : !!frontImage;

    const handleImagePick = async (side: 'FRONT' | 'BACK') => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
        });

        if (result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            if (uri) {
                const updatedFront = side === 'FRONT' ? uri : frontImage;
                const updatedBack = side === 'BACK' ? uri : backImage;

                if (side === 'FRONT') {
                    setFrontImage(uri);
                } else {
                    setBackImage(uri);
                }

                // Auto-save immediately to AsyncStorage
                const draft = await driverOnboardingStorage.getDraft();
                const newDocs: Record<string, string> = {};
                if (updatedFront) newDocs[frontDocTypeKey] = updatedFront;
                if (updatedBack) newDocs[backDocTypeKey] = updatedBack;

                const finalCapturedDocs = {
                    ...(draft?.capturedDocs || {}),
                    ...capturedDocs,
                    ...newDocs
                };

                const isComplete = isBothSidesRequired ? (!!updatedFront && !!updatedBack) : !!updatedFront;
                let currentDocs = Array.from(new Set([
                    ...(draft?.uploadedDocuments || []),
                    ...existingDocs
                ]));
                if (isComplete && !currentDocs.includes(documentName)) {
                    currentDocs.push(documentName);
                }

                await driverOnboardingStorage.saveDraft({
                    capturedDocs: finalCapturedDocs,
                    uploadedDocuments: currentDocs,
                    userData,
                    vehicleType
                });
            }
        }
    };

    // Auto-save draft on any navigation exit (gesture swipe back, hardware back, etc.)
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', async () => {
            if (frontImage || backImage) {
                const draft = await driverOnboardingStorage.getDraft();
                const newDocs: Record<string, string> = {};
                if (frontImage) newDocs[frontDocTypeKey] = frontImage;
                if (backImage) newDocs[backDocTypeKey] = backImage;

                const finalCapturedDocs = {
                    ...(draft?.capturedDocs || {}),
                    ...capturedDocs,
                    ...newDocs
                };

                const isComplete = isBothSidesRequired ? (!!frontImage && !!backImage) : !!frontImage;
                let currentDocs = Array.from(new Set([
                    ...(draft?.uploadedDocuments || []),
                    ...existingDocs
                ]));
                if (isComplete && !currentDocs.includes(documentName)) {
                    currentDocs.push(documentName);
                }

                await driverOnboardingStorage.saveDraft({
                    capturedDocs: finalCapturedDocs,
                    uploadedDocuments: currentDocs,
                    userData,
                    vehicleType
                });
            }
        });
        return unsubscribe;
    }, [navigation, frontImage, backImage, frontDocTypeKey, backDocTypeKey, isBothSidesRequired, capturedDocs, existingDocs, documentName, userData, vehicleType]);

    const handleBack = React.useCallback(async () => {
        const draft = await driverOnboardingStorage.getDraft();
        const newDocs: Record<string, string> = {};
        if (frontImage) newDocs[frontDocTypeKey] = frontImage;
        if (backImage) newDocs[backDocTypeKey] = backImage;

        const finalCapturedDocs = {
            ...(draft?.capturedDocs || {}),
            ...capturedDocs,
            ...newDocs
        };

        let currentDocs = Array.from(new Set([
            ...(draft?.uploadedDocuments || []),
            ...existingDocs
        ]));
        const isNowComplete = isBothSidesRequired ? (!!frontImage && !!backImage) : !!frontImage;
        if (isNowComplete && !currentDocs.includes(documentName)) {
            currentDocs.push(documentName);
        }

        await driverOnboardingStorage.saveDraft({
            capturedDocs: finalCapturedDocs,
            uploadedDocuments: currentDocs,
            userData,
            vehicleType
        });

        (navigation as any).navigate(targetScreen, {
            userData,
            vehicleType,
            capturedDocs: finalCapturedDocs,
            updatedDocList: currentDocs,
            fromProfile: (route.params as any)?.fromProfile
        });
        return true;
    }, [navigation, frontImage, backImage, frontDocTypeKey, backDocTypeKey, isBothSidesRequired, capturedDocs, existingDocs, documentName, userData, vehicleType, targetScreen, route.params]);

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

    const handleSubmit = async () => {
        if (!frontImage) return;

        const draft = await driverOnboardingStorage.getDraft();
        const newDocs: Record<string, string> = {
            [frontDocTypeKey]: frontImage,
        };

        if (backImage) {
            newDocs[backDocTypeKey] = backImage;
        }

        const finalCapturedDocs = {
            ...(draft?.capturedDocs || {}),
            ...capturedDocs,
            ...newDocs
        };

        const updatedList = Array.from(new Set([
            ...(draft?.uploadedDocuments || []),
            ...existingDocs,
            documentName
        ]));

        // If user is already authenticated/existing, upload directly to server!
        if (user) {
            setIsUploading(true);
            try {
                if (frontImage && !frontImage.startsWith('http') && !frontImage.startsWith('data:')) {
                    const frontFormData = new FormData();
                    frontFormData.append('docType', frontDocTypeKey);
                    frontFormData.append('document', {
                        uri: Platform.OS === 'android' ? frontImage : frontImage.replace('file://', ''),
                        type: 'image/jpeg',
                        name: `${frontDocTypeKey}.jpg`,
                    } as any);
                    const res = await driverService.uploadDocument(frontFormData);
                    if (res?.filePath) {
                        finalCapturedDocs[frontDocTypeKey] = res.filePath;
                    }
                }

                if (backImage && isBothSidesRequired && !backImage.startsWith('http') && !backImage.startsWith('data:')) {
                    const backFormData = new FormData();
                    backFormData.append('docType', backDocTypeKey);
                    backFormData.append('document', {
                        uri: Platform.OS === 'android' ? backImage : backImage.replace('file://', ''),
                        type: 'image/jpeg',
                        name: `${backDocTypeKey}.jpg`,
                    } as any);
                    const res = await driverService.uploadDocument(backFormData);
                    if (res?.filePath) {
                        finalCapturedDocs[backDocTypeKey] = res.filePath;
                    }
                }

                await refetchUser();
                Alert.alert("Success", `${documentName} uploaded successfully!`);
            } catch (uploadErr: any) {
                console.error("Failed to upload document to server:", uploadErr);
                const errMsg = uploadErr.response?.data?.message || uploadErr.message || 'Upload failed';
                Alert.alert("Upload Notice", `Saved locally: ${errMsg}`);
            } finally {
                setIsUploading(false);
            }
        } else {
            Alert.alert("Success", "Document saved pending registration!");
        }

        await driverOnboardingStorage.saveDraft({
            capturedDocs: finalCapturedDocs,
            uploadedDocuments: updatedList,
            userData,
            vehicleType
        });

        (navigation as any).navigate(targetScreen, {
            completedDocument: documentName,
            updatedDocList: updatedList,
            vehicleType,
            userData,
            capturedDocs: finalCapturedDocs, // Pass the FULL set back
            fromProfile: (route.params as any)?.fromProfile
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <FontAwesomeIcon icon={faArrowLeft} size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{documentName}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.description}>{description}</Text>

                {/* Front Side */}
                <Text style={styles.sectionLabel}>FRONT SIDE PHOTO</Text>
                <TouchableOpacity
                    style={styles.uploadBox}
                    onPress={() => handleImagePick('FRONT')}
                >
                    {frontImage ? (
                        <Image source={{ uri: frontImage }} style={styles.uploadedImage} />
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <View style={styles.addIconCircle}>
                                <FontAwesomeIcon icon={faPlus} size={20} color="#2DD4BF" />
                            </View>
                            <Text style={styles.addPhotoText}>Add Front Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Back Side */}
                <Text style={styles.sectionLabel}>BACK SIDE PHOTO (Optional if not applicable)</Text>
                <TouchableOpacity
                    style={styles.uploadBox}
                    onPress={() => handleImagePick('BACK')}
                >
                    {backImage ? (
                        <Image source={{ uri: backImage }} style={styles.uploadedImage} />
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <View style={styles.addIconCircle}>
                                <FontAwesomeIcon icon={faPlus} size={20} color="#2DD4BF" />
                            </View>
                            <Text style={styles.addPhotoText}>Add Back Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Tips */}
                <View style={styles.tipsContainer}>
                    <View style={styles.tipsHeaderRow}>
                        <FontAwesomeIcon icon={faCircleInfo} size={16} color="#6B7280" style={{ marginRight: 8 }} />
                        <Text style={styles.tipsTitle}>HELPFUL TIPS</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>Ensure your document details are visible</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>Make sure text is readable and not blurry.</Text>
                    </View>
                </View>

            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitEnabled && !isUploading && styles.submitButtonActive]}
                    disabled={!isSubmitEnabled || isUploading}
                    onPress={handleSubmit}
                >
                    {isUploading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <Text style={[styles.submitButtonText, isSubmitEnabled && styles.submitButtonTextActive]}>
                            {user ? 'Upload Document' : 'Submit Document'}
                        </Text>
                    )}
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
    description: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 24,
        lineHeight: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        marginBottom: 30,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    toggleButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    toggleTextActive: {
        color: '#111827',
        fontWeight: '700',
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        marginBottom: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    uploadBox: {
        height: 180,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    placeholderContainer: {
        alignItems: 'center',
    },
    addIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        marginBottom: 12,
        elevation: 1,
    },
    addPhotoText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    tipsContainer: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    tipsHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    tipsTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
        letterSpacing: 0.5,
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    bulletDot: {
        color: '#6B7280',
        marginRight: 8,
        fontWeight: 'bold',
    },
    bulletText: {
        fontSize: 12,
        color: '#6B7280',
        flex: 1,
        lineHeight: 18,
    },
    digiLockerContainer: {
        alignItems: 'center',
        padding: 40,
    },
    digiLockerText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
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
    submitButton: {
        backgroundColor: '#E2E8F0', // Inactive by default
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    submitButtonActive: {
        backgroundColor: '#10B981',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonDisabled: {
        backgroundColor: '#E2E8F0',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#94A3B8',
    },
    submitButtonTextActive: {
        color: '#FFFFFF',
    },
    submitButtonTextDisabled: {
        color: '#94A3B8',
    },
});

export default DriverDocumentUploadScreen;

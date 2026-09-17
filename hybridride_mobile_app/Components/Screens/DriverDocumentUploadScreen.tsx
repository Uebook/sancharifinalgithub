
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft,
    faPlus,
    faCircleInfo
} from '@fortawesome/free-solid-svg-icons';
import { launchImageLibrary } from 'react-native-image-picker';

const DriverDocumentUploadScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { documentName = 'Document', description = 'Upload a clear photo.', enableDigiLocker = false, existingDocs = [], vehicleType = 'CAR', userData } = route.params as any || {};
    const isReupload = route.name === 'ReuploadDocumentUpload';
    const targetScreen = isReupload ? 'ReuploadRegistration' : 'DriverRegistration';

    const [activeTab, setActiveTab] = useState<'MANUAL' | 'DIGILOCKER'>('MANUAL');
    const [frontImage, setFrontImage] = useState<string | null>(null);
    const [backImage, setBackImage] = useState<string | null>(null);

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
                if (side === 'FRONT') setFrontImage(uri);
                else setBackImage(uri);
            }
        }
    };

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

    // uploadFile function removed as we are deferring upload

    const handleBack = () => {
        // Collect current images but DON'T mark as complete
        const frontDocType = getDocTypeKey(documentName, 'FRONT');
        const backDocType = backImage ? getDocTypeKey(documentName, 'BACK') : null;

        const newDocs: Record<string, string> = {};
        if (frontImage) newDocs[frontDocType] = frontImage;
        if (backImage && backDocType) newDocs[backDocType] = backImage;

        const existingCapturedDocs = (route.params as any)?.capturedDocs || {};
        const finalCapturedDocs = {
            ...existingCapturedDocs,
            ...newDocs
        };

        (navigation as any).navigate(targetScreen, {
            userData,
            vehicleType,
            capturedDocs: finalCapturedDocs
        });
    };


    const handleSubmit = () => {
        if (!frontImage) return;

        // Identify docTypes
        const frontDocType = getDocTypeKey(documentName, 'FRONT');
        const backDocType = backImage ? getDocTypeKey(documentName, 'BACK') : null;

        const newDocs = {
            [frontDocType]: frontImage,
        };

        if (backImage && backDocType) {
            newDocs[backDocType] = backImage;
        }

        // Merge with existing docs passed from previous screen
        const params = route.params as any || {};
        const existingCapturedDocs = params.capturedDocs || {};
        const finalCapturedDocs = {
            ...existingCapturedDocs,
            ...newDocs
        };

        Alert.alert("Success", "Document saved pending registration!");

        const updatedList = Array.from(new Set([...existingDocs, documentName]));

        (navigation as any).navigate(targetScreen, {
            completedDocument: documentName,
            updatedDocList: updatedList,
            vehicleType,
            userData,
            capturedDocs: finalCapturedDocs // Pass the FULL set back
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

                {/* Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, activeTab === 'MANUAL' && styles.toggleButtonActive]}
                        onPress={() => setActiveTab('MANUAL')}
                    >
                        <Text style={[styles.toggleText, activeTab === 'MANUAL' && styles.toggleTextActive]}>Manual Upload</Text>
                    </TouchableOpacity>
                    {enableDigiLocker && (
                        <TouchableOpacity
                            style={[styles.toggleButton, activeTab === 'DIGILOCKER' && styles.toggleButtonActive]}
                            onPress={() => setActiveTab('DIGILOCKER')}
                        >
                            <Text style={[styles.toggleText, activeTab === 'DIGILOCKER' && styles.toggleTextActive]}>DigiLocker</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {activeTab === 'MANUAL' ? (
                    <>
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
                    </>
                ) : (
                    <View style={styles.digiLockerContainer}>
                        <Text style={styles.digiLockerText}>Connect securely with DigiLocker to fetch your documents instantly.</Text>
                    </View>
                )}

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
                    style={[styles.submitButton, isSubmitEnabled && styles.submitButtonActive]}
                    disabled={!isSubmitEnabled}
                    onPress={handleSubmit}
                >
                    <Text style={[styles.submitButtonText, isSubmitEnabled && styles.submitButtonTextActive]}>
                        Submit Document
                    </Text>
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

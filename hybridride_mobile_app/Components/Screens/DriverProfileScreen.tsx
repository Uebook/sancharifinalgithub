
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faCog,
    faCheck,
    faChevronRight,
    faShieldHalved,
    faUserCheck,
    faHeadphones,
    faWind, // Calm/Meditate replacement? Or simplify. Let's use Spa or similar if available, else Leaf/Wind.
    faSnowflake,
    faClock,
    faWallet,
    faHouse,
    faBriefcase,
    faPlus,
    faCar,
    faHeadset,
    faUser,
    faLeaf, // For CO2
    faSeedling,
    faPen,
    faCamera,
    faUniversity,
    faRightFromBracket,
    faIdCard
} from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../Context/AuthContext';
import { driverService } from '../../Services/driverService';
import { getImageUrl } from '../../Services/apiClient';
import SettingsScreen from './SettingsScreen';
import DriverBottomNavBar from '../Navigation/DriverBottomNavBar';

const { width } = Dimensions.get('window');

const DriverProfileScreen = () => {
    const navigation = useNavigation();
    const { user, refetchUser, updateUser, logout } = useAuth();
    const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

    const handleLogout = () => {
        Alert.alert(
            "Logout Confirmation",
            "Are you sure you want to log out of Sanchari?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        (navigation as any).reset({
                            index: 0,
                            routes: [{ name: 'RoleSelection' }]
                        });
                    }
                }
            ]
        );
    };

    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const handleImagePick = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.7,
                maxWidth: 800,
                maxHeight: 800,
                includeBase64: true,
            });

            if (result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const uri = asset.uri;
                const fullDataUri = asset.base64
                    ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`
                    : uri;

                if (uri) {
                    const previewUri = fullDataUri || uri;
                    setLocalAvatarUri(previewUri);
                    if (updateUser) {
                        updateUser({ profileImage: previewUri });
                    }
                    setIsUploadingImage(true);

                    // Upload immediately
                    const formData = new FormData();
                    formData.append('docType', 'profileImage');
                    formData.append('document', {
                        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                        type: asset.type || 'image/jpeg',
                        name: asset.fileName || 'profile.jpg',
                    } as any);

                    try {
                        const uploadRes = await driverService.uploadDocument(formData);
                        const savedPath = uploadRes?.filePath;
                        if (savedPath && updateUser) {
                            const finalPath = (savedPath.startsWith('http') || savedPath.startsWith('data:'))
                                ? savedPath
                                : previewUri;
                            updateUser({ profileImage: finalPath });
                            setLocalAvatarUri(finalPath);
                        }
                        await refetchUser();
                        Alert.alert('Success', 'Profile image updated successfully');
                    } catch (err: any) {
                        console.error("Failed to upload profile image:", err);
                        const errorMsg = err.response?.data?.message || err.message || 'Failed to update profile image';
                        Alert.alert('Error', errorMsg);
                    } finally {
                        setIsUploadingImage(false);
                    }
                }
            }
        } catch (error: any) {
            console.error("Image pick error:", error);
            setIsUploadingImage(false);
        }
    };

    // Calculate years dynamically
    const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();
    const yearsActive = new Date().getFullYear() - memberSince + (new Date().getFullYear() === memberSince ? 0.5 : 0);
    const yearsDisplay = yearsActive < 1 ? '<1' : yearsActive.toString();

    // Profile Strength Calculation
    const calculateStrength = () => {
        let score = 0;
        if (user?.name) score += 20;
        if (user?.phone) score += 20;
        if (user?.email) score += 10;
        if (user?.profileImage) score += 10;
        if (user?.driverDetails?.vehicle) score += 20;
        if (user?.verificationStatus?.idCard) score += 10;
        if (user?.savedPlaces && user.savedPlaces.length > 0) score += 10;
        return Math.min(score, 100);
    };
    const profileStrength = calculateStrength();

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.content}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.settingsButton} onPress={() => (navigation as any).navigate('Settings', { mode: 'driver' })}>
                            <FontAwesomeIcon icon={faCog} size={24} color="#6B7280" />
                        </TouchableOpacity>

                        <View style={styles.profileImageContainer}>
                            <View style={styles.profileImagePlaceholder}>
                                {isUploadingImage ? (
                                    <ActivityIndicator size="small" color="#059669" />
                                ) : (localAvatarUri || getImageUrl(user?.profileImage)) ? (
                                    <Image
                                        source={{ uri: localAvatarUri || getImageUrl(user?.profileImage)! }}
                                        style={{ width: 100, height: 100, borderRadius: 50 }}
                                        resizeMode="cover"
                                        onError={() => setLocalAvatarUri(null)}
                                    />
                                ) : (
                                    <FontAwesomeIcon icon={faUser} size={40} color="#9CA3AF" />
                                )}
                            </View>
                            <TouchableOpacity style={styles.cameraIconContainer} onPress={handleImagePick} disabled={isUploadingImage}>
                                <FontAwesomeIcon icon={faCamera} size={12} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={styles.name}>{user?.name || 'Driver'}</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('DriverEditProfile' as never)} style={{ marginLeft: 8 }}>
                                <FontAwesomeIcon icon={faPen} size={14} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.phone}>{user?.phone || ''}</Text>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{user?.driverDetails?.ratings?.average || '5.0'}</Text>
                                <Text style={styles.statLabel}>RATING</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{user?.driverDetails?.ratings?.count || 0}</Text>
                                <Text style={styles.statLabel}>RIDES</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{yearsDisplay}</Text>
                                <Text style={styles.statLabel}>YEARS</Text>
                            </View>
                        </View>
                    </View>

                    {/* Profile Strength */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Profile Strength</Text>
                            <Text style={styles.percentageText}>{profileStrength}%</Text>
                        </View>

                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${profileStrength}%` }]} />
                        </View>

                        <View style={styles.strengthItem}>
                            <View style={[styles.checkCircle, { backgroundColor: user?.phone ? '#10B981' : '#E5E7EB' }]}>
                                <FontAwesomeIcon icon={faCheck} size={10} color="#FFFFFF" />
                            </View>
                            <Text style={styles.strengthText}>Phone {user?.phone ? 'Verified' : 'Pending'}</Text>
                        </View>

                        <View style={styles.strengthItem}>
                            <View style={[styles.checkCircle, { backgroundColor: user?.verificationStatus?.idCard ? '#10B981' : 'transparent', borderWidth: user?.verificationStatus?.idCard ? 0 : 1, borderColor: '#D1D5DB' }]}>
                                {user?.verificationStatus?.idCard && <FontAwesomeIcon icon={faCheck} size={10} color="#FFFFFF" />}
                            </View>
                            <Text style={styles.strengthText}>ID Verification</Text>
                            {!user?.verificationStatus?.idCard && (
                                <View style={styles.bonusBadge}>
                                    <Text style={styles.bonusText}>+10%</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Trust & Safety Center */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Trust & Safety Center</Text>
                            <TouchableOpacity onPress={() => (navigation as any).navigate('DriverRegistration')}>
                                <Text style={styles.editText}>VIEW DOCUMENTS</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.trustCard}
                            onPress={() => (navigation as any).navigate('DriverRegistration')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.trustHeader}>
                                <View style={styles.shieldIconContainer}>
                                    <FontAwesomeIcon icon={faShieldHalved} size={20} color="#059669" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.trustTitle}>Driver Verification</Text>
                                    <Text style={styles.trustSubtitle}>View & update your KYC and vehicle documents</Text>
                                </View>
                                <FontAwesomeIcon icon={faChevronRight} size={14} color="#9CA3AF" />
                            </View>

                            <View style={styles.badgesRow}>
                                {user?.phone && (
                                    <View style={styles.verifiedBadge}>
                                        <FontAwesomeIcon icon={faCheck} size={10} color="#059669" style={{ marginRight: 2 }} />
                                        <Text style={styles.verifiedText}>Phone Verified</Text>
                                    </View>
                                )}
                                {user?.verificationStatus?.idCard && (
                                    <View style={styles.verifiedBadge}>
                                        <FontAwesomeIcon icon={faCheck} size={10} color="#059669" style={{ marginRight: 2 }} />
                                        <Text style={styles.verifiedText}>ID Verified</Text>
                                    </View>
                                )}
                                {user?.verificationStatus?.email && (
                                    <View style={styles.verifiedBadge}>
                                        <FontAwesomeIcon icon={faCheck} size={10} color="#059669" style={{ marginRight: 2}} />
                                        <Text style={styles.verifiedText}>Email Verified</Text>
                                    </View>
                                )}
                            </View>

                            {user?.verificationStatus?.communityTrusted && (
                                <View style={[styles.verifiedBadge, { alignSelf: 'flex-start', backgroundColor: '#DBEAFE', marginTop: 8 }]}>
                                    <FontAwesomeIcon icon={faUserCheck} size={10} color="#2563EB" style={{ marginRight: 4 }} />
                                    <Text style={[styles.verifiedText, { color: '#2563EB' }]}>Community Trusted</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Menu Links */}
                    <View style={styles.menuContainer}>
                        {/* 1. Driver Registration & KYC Documents */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => (navigation as any).navigate('DriverRegistration')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                                <FontAwesomeIcon icon={faIdCard} size={18} color="#2563EB" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.menuText}>Driver Registration</Text>
                                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                                    Identity & Vehicle Verification
                                </Text>
                            </View>
                            <View style={{
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 12,
                                backgroundColor: user?.driverApprovalStatus === 'approved' ? '#ECFDF5' : user?.driverApprovalStatus === 'rejected' ? '#FEF2F2' : '#FFFBEB',
                                marginRight: 6
                            }}>
                                <Text style={{
                                    fontSize: 10,
                                    fontWeight: '800',
                                    color: user?.driverApprovalStatus === 'approved' ? '#059669' : user?.driverApprovalStatus === 'rejected' ? '#DC2626' : '#D97706',
                                    textTransform: 'uppercase'
                                }}>
                                    {user?.driverApprovalStatus === 'approved' ? 'Verified' : user?.driverApprovalStatus === 'rejected' ? 'Action Req' : 'Pending'}
                                </Text>
                            </View>
                            <FontAwesomeIcon icon={faChevronRight} size={14} color="#D1D5DB" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* 2. Bank & UPI Settlement */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => (navigation as any).navigate('DriverBankDetails')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIconBox, { backgroundColor: '#F0FDF4' }]}>
                                <FontAwesomeIcon icon={faUniversity} size={18} color="#059669" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.menuText}>Bank & UPI Details</Text>
                                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                                    Payout Account for Earnings
                                </Text>
                            </View>
                            <FontAwesomeIcon icon={faChevronRight} size={14} color="#D1D5DB" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* 3. My Rides */}
                        <TouchableOpacity style={styles.menuItem} onPress={() => (navigation as any).navigate('DriverProfileMyTrips')}>
                            <View style={styles.menuIconBox}>
                                <FontAwesomeIcon icon={faClock} size={18} color="#2563EB" />
                            </View>
                            <Text style={styles.menuText}>My Rides</Text>
                            <FontAwesomeIcon icon={faChevronRight} size={14} color="#D1D5DB" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* 4. Wallet */}
                        <TouchableOpacity style={styles.menuItem} onPress={() => (navigation as any).navigate('Wallet')}>
                            <View style={styles.menuIconBox}>
                                <FontAwesomeIcon icon={faWallet} size={18} color="#059669" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.menuText}>Payment Methods</Text>
                            </View>
                            <Text style={styles.menuSideText}>Hybrid Wallet</Text>
                            <FontAwesomeIcon icon={faChevronRight} size={14} color="#D1D5DB" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* 5. Logout */}
                        <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.8}>
                            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                                <FontAwesomeIcon icon={faRightFromBracket} size={18} color="#EF4444" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.menuText, { color: '#EF4444', fontWeight: '800' }]}>Log Out</Text>
                            </View>
                            <FontAwesomeIcon icon={faChevronRight} size={14} color="#EF4444" />
                        </TouchableOpacity>
                    </View>

                    {/* Travel Summary */}
                    {/* <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Your Travel Summary</Text>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryCard}>
                                <FontAwesomeIcon icon={faLeaf} size={24} color="#10B981" style={{ marginBottom: 8 }} />
                                <Text style={styles.summaryValue}>₹{user?.travelStats?.totalSavings || 0}</Text>
                                <Text style={styles.summaryLabel}>SHARED SAVINGS</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <FontAwesomeIcon icon={faSeedling} size={24} color="#65A30D" style={{ marginBottom: 8 }} />
                                <Text style={styles.summaryValue}>{user?.travelStats?.co2Saved || 0} kg</Text>
                                <Text style={styles.summaryLabel}>CO₂ SAVED</Text>
                            </View> */}
                        {/* </View> */}
                    {/* </View> */}

                    {/* Saved Places */}
                    {/* <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Saved Places</Text>
                        <View style={styles.savedPlacesContainer}>
                            {user?.savedPlaces && user.savedPlaces.length > 0 ? (
                                user.savedPlaces.map((place, index) => (
                                    <TouchableOpacity key={index} style={styles.placeItem}>
                                        <View style={styles.placeIconBox}>
                                            <FontAwesomeIcon icon={place.type === 'Home' ? faHouse : faBriefcase} size={16} color="#4B5563" />
                                        </View>
                                        <View style={styles.placeContent}>
                                            <Text style={styles.placeTitle}>{place.label}</Text>
                                            <Text style={styles.placeSubtitle}>{place.address}</Text>
                                        </View>
                                        <FontAwesomeIcon icon={faCog} size={14} color="#D1D5DB" />
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={{ color: '#9CA3AF', marginBottom: 16, textAlign: 'center' }}>No saved places</Text>
                            )}

                            <TouchableOpacity style={styles.addPlaceButton}>
                                <Text style={styles.addPlaceText}>+ Add New Place</Text>
                            </TouchableOpacity>
                        </View>
                    </View> */}

                    <View style={{ height: 100 }} />

                </ScrollView>
            </SafeAreaView>

            {/* Bottom Navigation */}
            <DriverBottomNavBar activeTab="PROFILE" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#080C14',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 90,
    },
    header: {
        backgroundColor: '#0F172A',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        alignItems: 'center',
        paddingBottom: 30,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    settingsButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 8,
        zIndex: 10,
    },
    profileImageContainer: {
        marginTop: 20,
        marginBottom: 16,
        padding: 4,
        backgroundColor: '#1E293B',
        borderRadius: 60,
        borderWidth: 2,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        position: 'relative',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#10B981',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#0F172A',
    },
    profileImagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#334155',
    },
    name: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    phone: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#1E293B',
    },
    sectionContainer: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    percentageText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#10B981',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#1E293B',
        borderRadius: 4,
        marginBottom: 16,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 4,
    },
    strengthItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    circleOutline: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#475569',
        marginRight: 12,
    },
    strengthText: {
        fontSize: 14,
        color: '#94A3B8',
        flex: 1,
    },
    bonusBadge: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    bonusText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
    },
    trustCard: {
        backgroundColor: '#0F172A',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    trustHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    shieldIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#064E3B',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    trustTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    trustSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 8,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#064E3B',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
    },
    verifiedText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#10B981',
    },
    editText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10B981',
    },
    subSectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    tagText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    menuContainer: {
        backgroundColor: '#0F172A',
        borderRadius: 20,
        marginHorizontal: 20,
        marginBottom: 24,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#1E293B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    menuIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        flex: 1,
    },
    menuSideText: {
        fontSize: 12,
        color: '#94A3B8',
        marginRight: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#1E293B',
        marginLeft: 68,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        width: (width - 56) / 2,
        borderRadius: 20,
        padding: 20,
        paddingVertical: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 0.5,
    },
    savedPlacesContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    placeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    placeIconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    placeContent: {
        flex: 1,
    },
    placeTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    placeSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    addPlaceButton: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    addPlaceText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10B981',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    navItem: {
        alignItems: 'center',
    },
    navText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        marginTop: 4,
        letterSpacing: 0.5,
    },
});

export default DriverProfileScreen;



import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '../../Config/maps';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faGear,
    faUser,
    faCheck,
    faChevronRight,
    faShieldHalved,
    faCircleCheck,
    faHeadphones,
    faLeaf,
    faClock,
    faWallet,
    faHouse,
    faBriefcase,
    faPlus,
    faPen,
    faHeart,
    faCamera,
    faRightFromBracket,
    faTrash,
    faTimes,
    faLocationDot,
    faPhone,
    faShieldHeart,
    faEnvelope,
    faLocationCrosshairs,
} from '@fortawesome/free-solid-svg-icons';
import { launchImageLibrary } from 'react-native-image-picker';
import BottomNavBar from '../Navigation/BottomNavBar';
import { useNavigation } from '@react-navigation/native';
import SettingsScreen from './SettingsScreen';
import { useAuth } from '../Context/AuthContext';
import { driverService } from '../../Services/driverService';
import apiClient, { getImageUrl } from '../../Services/apiClient';
import poolService, { PoolRide } from '../../Services/poolService';
import * as rideService from '../../Services/rideService';
import { getCurrentLocationAddress } from '../../Services/directionsService';
import {
    getHomeAddress,
    setHomeAddress,
    getWorkAddress,
    setWorkAddress,
    getFavorites,
    addFavoritePlace,
    removeFavorite,
    SavedLocation,
} from '../../Services/locationStorageService';

export interface ProfileRideItem {
    _id: string;
    type: string;
    status: string;
    fromName: string;
    toName: string;
    fare: number;
    scheduledTime: string;
    createdAt?: string;
}

const PERSONALITY_OPTIONS = [
    'Quiet Ride',
    'AC On',
    'Music Lover',
    'Chat Friendly',
    'Pet Friendly',
    'Luggage Space',
    'Eco Friendly',
    'Fast Route',
];

const { width } = Dimensions.get('window');

const PassengerProfileScreen = () => {
    const navigation = useNavigation();
    const { user, refetchUser, updateUser, logout } = useAuth();
    const [rides, setRides] = useState<ProfileRideItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeRideTab, setActiveRideTab] = useState<'Upcoming' | 'Completed' | 'Cancelled'>('Upcoming');
    const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

    // Saved Addresses State
    const [homePlace, setHomePlace] = useState<SavedLocation | null>(null);
    const [workPlace, setWorkPlace] = useState<SavedLocation | null>(null);
    const [favoritesList, setFavoritesList] = useState<SavedLocation[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'home' | 'work' | 'favorite'>('home');
    const [customFavName, setCustomFavName] = useState('');

    // Emergency Contact State
    const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [isSavingEmergency, setIsSavingEmergency] = useState(false);

    // Edit Profile Details State
    const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editPersonality, setEditPersonality] = useState<string[]>([]);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const loadSavedAddresses = async () => {
        try {
            const [home, work, favs] = await Promise.all([
                getHomeAddress(),
                getWorkAddress(),
                getFavorites(),
            ]);
            setHomePlace(home);
            setWorkPlace(work);
            setFavoritesList(favs);
        } catch (e) {
            console.error('Error loading saved addresses:', e);
        }
    };

    const handleOpenEmergencyModal = () => {
        setEmergencyName(user?.emergencyContact?.name || '');
        setEmergencyPhone(user?.emergencyContact?.phone || '');
        setEmergencyModalVisible(true);
    };

    const handleSaveEmergencyContact = async () => {
        const cleanPhone = emergencyPhone.replace(/[^0-9]/g, '');
        if (!cleanPhone || cleanPhone.length < 10) {
            Alert.alert('Invalid Number', 'Please enter a valid 10-digit emergency contact phone number.');
            return;
        }

        setIsSavingEmergency(true);
        try {
            await apiClient.put('/auth/profile', {
                emergencyContact: {
                    name: emergencyName.trim() || 'Emergency Contact',
                    phone: cleanPhone,
                }
            });
            await refetchUser();
            setEmergencyModalVisible(false);
            Alert.alert('Success', 'Emergency contact saved successfully! It will be used in case of SOS or emergency alerts.');
        } catch (error: any) {
            console.error('Failed to save emergency contact:', error);
            const msg = error.response?.data?.message || error.message || 'Could not save emergency contact';
            Alert.alert('Error', msg);
        } finally {
            setIsSavingEmergency(false);
        }
    };

    const handleRemoveEmergencyContact = () => {
        Alert.alert(
            'Remove Contact',
            'Are you sure you want to remove your emergency contact?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiClient.put('/auth/profile', {
                                emergencyContact: { name: '', phone: '' }
                            });
                            await refetchUser();
                            setEmergencyModalVisible(false);
                            Alert.alert('Removed', 'Emergency contact removed.');
                        } catch (e: any) {
                            Alert.alert('Error', 'Failed to remove contact');
                        }
                    }
                }
            ]
        );
    };

    const handleOpenSaveModal = (type: 'home' | 'work' | 'favorite') => {
        setModalType(type);
        setCustomFavName('');
        setModalVisible(true);
    };

    const [isLocatingCurrent, setIsLocatingCurrent] = useState(false);

    const handleSaveAddressFromModal = async (address: string, details?: any) => {
        if (!address) return;
        let coords: [number, number] | undefined = undefined;
        if (details?.geometry?.location) {
            coords = [details.geometry.location.lng, details.geometry.location.lat];
        }

        if (modalType === 'home') {
            const saved = await setHomeAddress(address, coords);
            setHomePlace(saved);
        } else if (modalType === 'work') {
            const saved = await setWorkAddress(address, coords);
            setWorkPlace(saved);
        } else if (modalType === 'favorite') {
            const title = customFavName.trim() || 'Favorite Place';
            const updated = await addFavoritePlace(title, address, coords);
            setFavoritesList(updated);
        }

        setModalVisible(false);
    };

    const handleUseCurrentLocationForSavedAddress = async () => {
        setIsLocatingCurrent(true);
        try {
            const loc = await getCurrentLocationAddress();
            if (loc && loc.address) {
                await handleSaveAddressFromModal(loc.address, {
                    geometry: {
                        location: {
                            lat: loc.latitude,
                            lng: loc.longitude,
                        }
                    }
                });
                const placeLabel = modalType === 'home' ? 'Home' : modalType === 'work' ? 'Work' : customFavName.trim() || 'Favorite';
                Alert.alert(
                    'Location Saved',
                    `Successfully set ${placeLabel} address to your current location.`
                );
            }
        } catch (err: any) {
            console.error('Failed to get current location for saved address:', err);
            Alert.alert('Location Error', err.message || 'Could not fetch current location.');
        } finally {
            setIsLocatingCurrent(false);
        }
    };

    const handleRemoveFavoriteItem = async (id: string) => {
        Alert.alert(
            'Remove Favorite',
            'Remove this place from your saved favorites?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        const updated = await removeFavorite(id);
                        setFavoritesList(updated);
                    }
                }
            ]
        );
    };

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

    const handleOpenEditProfile = () => {
        setEditName(user?.name || '');
        setEditEmail(user?.email || '');
        setEditPhone(user?.phone || '');
        setEditPersonality(
            Array.isArray(user?.ridePersonality) && user.ridePersonality.length > 0
                ? [...user.ridePersonality]
                : ['Quiet Ride', 'AC On']
        );
        setEditProfileModalVisible(true);
    };

    const togglePersonalityTag = (tag: string) => {
        setEditPersonality(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSaveProfileDetails = async () => {
        if (!editName.trim()) {
            Alert.alert('Required', 'Please enter your full name.');
            return;
        }

        setIsSavingProfile(true);
        try {
            const cleanPhone = editPhone.replace(/[^0-9]/g, '');
            const payload: any = {
                name: editName.trim(),
                email: editEmail.trim(),
                ridePersonality: editPersonality,
            };
            if (cleanPhone && cleanPhone.length >= 10) {
                payload.phone = cleanPhone;
            }

            await apiClient.put('/auth/profile', payload);
            await refetchUser();
            setEditProfileModalVisible(false);
            Alert.alert('Success', 'Profile details updated successfully!');
        } catch (error: any) {
            console.error('Failed to update profile details:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to update profile';
            Alert.alert('Error', msg);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const [poolRes, bookingRes] = await Promise.all([
                poolService.getPassengerHistory().catch(() => ({ success: false, data: [] })),
                rideService.getRideHistory().catch(() => ({ success: false, data: [] })),
            ]);

            let combined: ProfileRideItem[] = [];

            // 1. Process Carpool Rides
            if (poolRes?.success && Array.isArray(poolRes.data)) {
                combined = [...combined, ...poolRes.data.map((r: any) => ({
                    _id: r._id,
                    type: r.type ? `${r.type.toUpperCase()} Pool` : 'Pool',
                    status: r.status || 'completed',
                    fromName: r.origin?.name || 'Pickup Point',
                    toName: r.destination?.name || 'Destination Point',
                    fare: r.pricePerSeat || 0,
                    scheduledTime: r.scheduledTime || r.createdAt || new Date().toISOString(),
                    createdAt: r.createdAt,
                }))];
            }

            // 2. Process On-Demand / Cab Bookings
            const rawBookings = bookingRes?.data?.rides || bookingRes?.data || [];
            if (Array.isArray(rawBookings)) {
                combined = [...combined, ...rawBookings.map((r: any) => ({
                    _id: r._id,
                    type: r.rideType || r.vehicleType || 'Ride',
                    status: r.status || 'completed',
                    fromName: r.pickupAddress || (typeof r.pickup === 'object' ? r.pickup?.address : '') || 'Pickup',
                    toName: r.dropoffAddress || (typeof r.dropoff === 'object' ? r.dropoff?.address : '') || 'Dropoff',
                    fare: r.finalFare || r.fare || r.offeredFare || 0,
                    scheduledTime: r.scheduledTime || r.createdAt || new Date().toISOString(),
                    createdAt: r.createdAt,
                }))];
            }

            // Sort newest first
            combined.sort((a, b) => {
                const dateA = new Date(a.scheduledTime || a.createdAt || 0).getTime();
                const dateB = new Date(b.scheduledTime || b.createdAt || 0).getTime();
                return dateB - dateA;
            });

            setRides(combined);
        } catch (error) {
            console.error("Error fetching unified ride history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        loadSavedAddresses();
    }, []);

    const mapStatus = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'scheduled':
            case 'pending':
            case 'accepted':
            case 'arrived':
                return 'Upcoming';
            case 'ongoing':
                return 'Upcoming';
            case 'completed':
                return 'Completed';
            case 'cancelled':
                return 'Cancelled';
            default:
                return 'Completed';
        }
    };

    const categorizedRides = {
        Upcoming: rides.filter(r => mapStatus(r.status) === 'Upcoming'),
        Completed: rides.filter(r => mapStatus(r.status) === 'Completed'),
        Cancelled: rides.filter(r => mapStatus(r.status) === 'Cancelled'),
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
                            // If backend returned a valid Cloudinary/Data URI, use it; otherwise retain self-contained base64
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
        if (user?.emergencyContact?.phone) score += 20;
        if (homePlace?.subtitle || workPlace?.subtitle || favoritesList.length > 0) score += 20;
        if (user?.email || user?.profileImage || user?.verificationStatus?.idCard) score += 20;
        return Math.min(score, 100);
    };
    const profileStrength = calculateStrength();

    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Spacer for Fixed Header */}
                    <View style={{ height: 335 }} />

                    {/* Saved Places Section */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Saved Addresses</Text>
                        <TouchableOpacity onPress={() => handleOpenSaveModal('favorite')}>
                            <Text style={styles.editText}>+ ADD PLACE</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        {/* Home Address Row */}
                        <TouchableOpacity
                            style={styles.placeItem}
                            onPress={() => handleOpenSaveModal('home')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.placeIconBox, { backgroundColor: '#ECFDF5' }]}>
                                <FontAwesomeIcon icon={faHouse} size={16} color="#059669" />
                            </View>
                            <View style={styles.placeDetails}>
                                <Text style={styles.placeTitle}>Home</Text>
                                <Text style={styles.placeAddress} numberOfLines={1}>
                                    {homePlace?.subtitle || 'Add your home address'}
                                </Text>
                            </View>
                            <View style={styles.placeActionBtn}>
                                <FontAwesomeIcon icon={homePlace?.subtitle ? faPen : faPlus} size={12} color="#059669" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.dividerSimple} />

                        {/* Work Address Row */}
                        <TouchableOpacity
                            style={styles.placeItem}
                            onPress={() => handleOpenSaveModal('work')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.placeIconBox, { backgroundColor: '#EFF6FF' }]}>
                                <FontAwesomeIcon icon={faBriefcase} size={16} color="#2563EB" />
                            </View>
                            <View style={styles.placeDetails}>
                                <Text style={styles.placeTitle}>Work</Text>
                                <Text style={styles.placeAddress} numberOfLines={1}>
                                    {workPlace?.subtitle || 'Add your work / office address'}
                                </Text>
                            </View>
                            <View style={styles.placeActionBtn}>
                                <FontAwesomeIcon icon={workPlace?.subtitle ? faPen : faPlus} size={12} color="#2563EB" />
                            </View>
                        </TouchableOpacity>

                        {/* Custom Favorite Places */}
                        {favoritesList.map((fav) => (
                            <View key={fav.id}>
                                <View style={styles.dividerSimple} />
                                <View style={styles.placeItem}>
                                    <View style={[styles.placeIconBox, { backgroundColor: '#FFF1F2' }]}>
                                        <FontAwesomeIcon icon={faHeart} size={15} color="#E11D48" />
                                    </View>
                                    <View style={styles.placeDetails}>
                                        <Text style={styles.placeTitle}>{fav.title}</Text>
                                        <Text style={styles.placeAddress} numberOfLines={1}>
                                            {fav.subtitle}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.placeActionBtn}
                                        onPress={() => handleRemoveFavoriteItem(fav.id)}
                                    >
                                        <FontAwesomeIcon icon={faTrash} size={12} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity
                            style={styles.addPlaceButton}
                            onPress={() => handleOpenSaveModal('favorite')}
                            activeOpacity={0.8}
                        >
                            <FontAwesomeIcon icon={faPlus} size={12} color="#10B981" style={{ marginRight: 6 }} />
                            <Text style={styles.addPlaceText}>Add Another Favourite Place</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Profile Strength */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Profile Strength</Text>
                        <Text style={styles.percentageText}>{profileStrength}%</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBarFill, { width: `${profileStrength}%` }]} />
                        </View>

                        {/* Phone Verified Row */}
                        <View style={styles.strengthItem}>
                            <View style={[styles.checkCircle, { backgroundColor: user?.phone ? '#D1FAE5' : '#F3F4F6' }]}>
                                <FontAwesomeIcon icon={faCheck} size={10} color={user?.phone ? "#10B981" : "#9CA3AF"} />
                            </View>
                            <Text style={styles.strengthText}>Phone {user?.phone ? 'Verified' : 'Pending'}</Text>
                        </View>

                        {/* Emergency Contact Row (Interactive!) */}
                        <TouchableOpacity
                            style={styles.strengthItem}
                            onPress={handleOpenEmergencyModal}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.checkCircle,
                                {
                                    backgroundColor: user?.emergencyContact?.phone ? '#D1FAE5' : '#FFFFFF',
                                    borderColor: user?.emergencyContact?.phone ? 'transparent' : '#E5E7EB',
                                    borderWidth: user?.emergencyContact?.phone ? 0 : 1,
                                }
                            ]}>
                                {user?.emergencyContact?.phone ? (
                                    <FontAwesomeIcon icon={faCheck} size={10} color="#10B981" />
                                ) : (
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB' }} />
                                )}
                            </View>
                            <View style={{ flex: 1, marginRight: 6 }}>
                                <Text style={styles.strengthText}>
                                    {user?.emergencyContact?.phone
                                        ? `Emergency Contact: ${user.emergencyContact.name || 'Contact'} (${user.emergencyContact.phone})`
                                        : 'Add emergency contact'}
                                </Text>
                            </View>
                            {user?.emergencyContact?.phone ? (
                                <FontAwesomeIcon icon={faPen} size={11} color="#059669" />
                            ) : (
                                <View style={styles.bonusBadge}>
                                    <Text style={styles.bonusText}>+20%</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Saved Addresses Row */}
                        <TouchableOpacity
                            style={styles.strengthItem}
                            onPress={() => handleOpenSaveModal('home')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkCircle, { backgroundColor: (homePlace || workPlace) ? '#D1FAE5' : '#F3F4F6' }]}>
                                <FontAwesomeIcon icon={faCheck} size={10} color={(homePlace || workPlace) ? "#10B981" : "#9CA3AF"} />
                            </View>
                            <Text style={styles.strengthText}>
                                {(homePlace || workPlace) ? 'Saved Addresses Configured' : 'Add Home / Work Address'}
                            </Text>
                            {!(homePlace || workPlace) && (
                                <View style={styles.bonusBadge}>
                                    <Text style={styles.bonusText}>+20%</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Trust & Safety Center */}
                    <Text style={styles.sectionTitle}>Trust & Safety Center</Text>
                    <View style={styles.card}>
                        <View style={styles.trustHeader}>
                            <View style={styles.shieldIconBox}>
                                <FontAwesomeIcon icon={faShieldHalved} size={20} color="#059669" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>Trust Profile</Text>
                                <Text style={styles.cardSubtitle}>Verified profiles build safer communities</Text>
                            </View>
                        </View>

                        <View style={[styles.badgesRow, { flexWrap: 'wrap', gap: 6 }]}>
                            {user?.verificationStatus?.idCard && (
                                <View style={styles.verifiedBadge}>
                                    <FontAwesomeIcon icon={faCircleCheck} size={12} color="#059669" style={{ marginRight: 4 }} />
                                    <Text style={styles.verifiedText}>ID Verified</Text>
                                </View>
                            )}
                            {user?.phone && (
                                <View style={styles.verifiedBadge}>
                                    <FontAwesomeIcon icon={faCircleCheck} size={12} color="#059669" style={{ marginRight: 4 }} />
                                    <Text style={styles.verifiedText}>Phone Verified</Text>
                                </View>
                            )}
                            {user?.emergencyContact?.phone ? (
                                <View style={[styles.verifiedBadge, { backgroundColor: '#ECFDF5' }]}>
                                    <FontAwesomeIcon icon={faShieldHeart} size={12} color="#059669" style={{ marginRight: 4 }} />
                                    <Text style={styles.verifiedText}>SOS Contact Active</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.verifiedBadge, { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }]}
                                    onPress={handleOpenEmergencyModal}
                                >
                                    <FontAwesomeIcon icon={faPlus} size={10} color="#2563EB" style={{ marginRight: 4 }} />
                                    <Text style={[styles.verifiedText, { color: '#2563EB' }]}>Add SOS Contact</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {user?.verificationStatus?.communityTrusted && (
                            <View style={[styles.verifiedBadge, { alignSelf: 'flex-start', backgroundColor: '#EFF6FF', marginTop: 4 }]}>
                                <FontAwesomeIcon icon={faCircleCheck} size={12} color="#2563EB" style={{ marginRight: 4 }} />
                                <Text style={[styles.verifiedText, { color: '#2563EB' }]}>Community Trusted</Text>
                            </View>
                        )}
                    </View>

                    {/* Ride Personality */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Ride Personality</Text>
                        <TouchableOpacity onPress={handleOpenEditProfile}>
                            <Text style={styles.editText}>EDIT</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.subSectionTitle}>MY RIDE STYLE</Text>
                        <View style={[styles.tagsRow, { flexWrap: 'wrap' }]}>
                            {user?.ridePersonality && user.ridePersonality.length > 0 ? (
                                user.ridePersonality.map((tag, index) => (
                                    <View key={index} style={[styles.tag, { marginBottom: 8 }]}>
                                        <FontAwesomeIcon icon={faLeaf} size={14} color="#111827" style={{ marginRight: 6 }} />
                                        <Text style={styles.tagText}>{tag}</Text>
                                    </View>
                                ))
                            ) : (
                                <TouchableOpacity onPress={handleOpenEditProfile}>
                                    <Text style={{ color: '#059669', fontSize: 13, fontWeight: '600' }}>+ Add ride style preferences</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Real Rides Dashboard */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>My Rides</Text>
                        <TouchableOpacity onPress={() => (navigation as any).navigate('PassengerMyTrips')}>
                            <Text style={styles.editText}>VIEW ALL ({rides.length})</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.rideTabs}>
                            {(['Upcoming', 'Completed', 'Cancelled'] as const).map(tab => (
                                <TouchableOpacity
                                    key={tab}
                                    onPress={() => setActiveRideTab(tab)}
                                    style={[styles.rideTab, activeRideTab === tab && styles.activeRideTab]}
                                >
                                    <Text style={[styles.rideTabText, activeRideTab === tab && styles.activeRideTabText]}>{tab}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.rideList}>
                            {categorizedRides[activeRideTab].length > 0 ? (
                                categorizedRides[activeRideTab].slice(0, 3).map((ride, idx) => (
                                    <View key={ride._id}>
                                        <TouchableOpacity
                                            style={styles.rideListItem}
                                            onPress={() => (navigation as any).navigate('PassengerMyTrips')}
                                        >
                                            <View style={styles.rideListInfo}>
                                                <Text style={styles.rideListRoute} numberOfLines={1}>
                                                    {(ride.fromName || 'Pickup').split(',')[0]} → {(ride.toName || 'Destination').split(',')[0]}
                                                </Text>
                                                <Text style={styles.rideListTime}>
                                                    {new Date(ride.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(ride.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ride.type}
                                                </Text>
                                            </View>
                                            <View style={styles.rideListPrice}>
                                                <Text style={styles.ridePriceText}>₹{ride.fare}</Text>
                                                <FontAwesomeIcon icon={faChevronRight} size={10} color="#D1D5DB" />
                                            </View>
                                        </TouchableOpacity>
                                        {idx < Math.min(categorizedRides[activeRideTab].length, 3) - 1 && <View style={styles.rideDivider} />}
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyRides}>
                                    <Text style={styles.emptyRidesText}>No {activeRideTab.toLowerCase()} rides found</Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={() => (navigation as any).navigate('PassengerMyTrips')}
                        >
                            <Text style={styles.viewAllText}>View All History</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Menu Items */}
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => (navigation as any).navigate('Wallet')}>
                            <View style={[styles.menuIconCircle, { backgroundColor: '#ECFDF5' }]}>
                                <FontAwesomeIcon icon={faWallet} size={16} color="#059669" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.menuText}>Payment Methods</Text>
                            </View>
                            <Text style={styles.menuValue}>Hybrid</Text>
                            <FontAwesomeIcon icon={faChevronRight} size={12} color="#D1D5DB" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>

                        <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 }} />

                        <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.8}>
                            <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
                                <FontAwesomeIcon icon={faRightFromBracket} size={16} color="#EF4444" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.menuText, { color: '#EF4444', fontWeight: '800' }]}>Log Out</Text>
                            </View>
                            <FontAwesomeIcon icon={faChevronRight} size={12} color="#EF4444" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </View>

            {/* SET / EDIT LOCATION MODAL */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderTitleRow}>
                                <FontAwesomeIcon
                                    icon={
                                        modalType === 'home'
                                            ? faHouse
                                            : modalType === 'work'
                                            ? faBriefcase
                                            : faHeart
                                    }
                                    size={18}
                                    color={
                                        modalType === 'home'
                                            ? '#059669'
                                            : modalType === 'work'
                                            ? '#2563EB'
                                            : '#E11D48'
                                    }
                                />
                                <Text style={styles.modalTitle}>
                                    {modalType === 'home'
                                        ? 'Set Home Address'
                                        : modalType === 'work'
                                        ? 'Set Work Address'
                                        : 'Add Favourite Place'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.modalCloseBtn}
                            >
                                <FontAwesomeIcon icon={faTimes} size={16} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        {/* Custom Name input for Favorites */}
                        {modalType === 'favorite' && (
                            <View style={styles.customNameContainer}>
                                <Text style={styles.inputLabel}>Place Name / Tag</Text>
                                <TextInput
                                    style={styles.customNameInput}
                                    placeholder="e.g. Gym, Mom's House, College"
                                    placeholderTextColor="#9CA3AF"
                                    value={customFavName}
                                    onChangeText={setCustomFavName}
                                />
                            </View>
                        )}

                        {/* 1-Tap Current Location Button */}
                        <TouchableOpacity
                            style={styles.currentLocationBtn}
                            onPress={handleUseCurrentLocationForSavedAddress}
                            disabled={isLocatingCurrent}
                            activeOpacity={0.7}
                        >
                            <View style={styles.currentLocationIconCircle}>
                                {isLocatingCurrent ? (
                                    <ActivityIndicator size="small" color="#059669" />
                                ) : (
                                    <FontAwesomeIcon icon={faLocationCrosshairs} size={15} color="#059669" />
                                )}
                            </View>
                            <View style={styles.currentLocationTextWrap}>
                                <Text style={styles.currentLocationTitle}>
                                    {isLocatingCurrent ? 'Detecting GPS location...' : 'Use Current Location'}
                                </Text>
                                <Text style={styles.currentLocationSubtitle}>
                                    Auto-detect and save your live GPS location
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.orDividerContainer}>
                            <View style={styles.orDividerLine} />
                            <Text style={styles.orDividerText}>OR SEARCH MANUALLY</Text>
                            <View style={styles.orDividerLine} />
                        </View>

                        <Text style={styles.inputLabel}>Search Address</Text>
                        
                        {/* Autocomplete inside Modal */}
                        <GooglePlacesAutocomplete
                            placeholder="Search location..."
                            fetchDetails={true}
                            enablePoweredByContainer={false}
                            minLength={2}
                            debounce={300}
                            keyboardShouldPersistTaps="handled"
                            onPress={(data, details = null) => {
                                handleSaveAddressFromModal(data.description, details);
                            }}
                            query={{
                                key: GOOGLE_MAPS_API_KEY,
                                language: 'en',
                                components: 'country:in',
                            }}
                            onFail={(error) => console.error('Modal Autocomplete Error:', error)}
                            textInputProps={{
                                placeholderTextColor: '#9CA3AF',
                                clearButtonMode: 'while-editing',
                                autoFocus: true,
                            }}
                            styles={{
                                container: {
                                    flex: 0,
                                    zIndex: 9999,
                                },
                                textInputContainer: {
                                    backgroundColor: '#F9FAFB',
                                    borderRadius: 12,
                                    paddingHorizontal: 12,
                                    paddingVertical: 2,
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                },
                                textInput: {
                                    flex: 1,
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: '#111827',
                                    backgroundColor: 'transparent',
                                    height: 42,
                                    paddingVertical: 0,
                                },
                                listView: {
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB',
                                    marginTop: 6,
                                    maxHeight: 220,
                                    elevation: 6,
                                    zIndex: 9999,
                                },
                                row: {
                                    backgroundColor: '#FFFFFF',
                                    paddingVertical: 12,
                                    paddingHorizontal: 14,
                                },
                                description: {
                                    color: '#111827',
                                    fontSize: 13,
                                    fontWeight: '500',
                                },
                                separator: {
                                    backgroundColor: '#F3F4F6',
                                    height: 1,
                                },
                            }}
                        />
                    </View>
                </View>
            </Modal>

            {/* EMERGENCY CONTACT MODAL */}
            <Modal
                visible={emergencyModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEmergencyModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderTitleRow}>
                                <FontAwesomeIcon icon={faShieldHeart} size={20} color="#059669" />
                                <Text style={styles.modalTitle}>Emergency Contact</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setEmergencyModalVisible(false)}
                                style={styles.modalCloseBtn}
                            >
                                <FontAwesomeIcon icon={faTimes} size={16} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubDesc}>
                            This contact will be immediately notified during SOS emergency alerts and live ride sharing.
                        </Text>

                        {/* Contact Name */}
                        <Text style={styles.inputLabel}>Contact Person Name / Relation</Text>
                        <TextInput
                            style={styles.customNameInput}
                            placeholder="e.g. Brother, Mom, Spouse, Friend"
                            placeholderTextColor="#9CA3AF"
                            value={emergencyName}
                            onChangeText={setEmergencyName}
                        />

                        {/* Phone Number */}
                        <Text style={[styles.inputLabel, { marginTop: 14 }]}>Emergency Phone Number</Text>
                        <View style={styles.phoneInputContainer}>
                            <FontAwesomeIcon icon={faPhone} size={14} color="#059669" style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="10-digit mobile number"
                                placeholderTextColor="#9CA3AF"
                                value={emergencyPhone}
                                onChangeText={setEmergencyPhone}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                        </View>

                        {/* Action Buttons */}
                        <TouchableOpacity
                            style={[styles.saveEmergencyBtn, isSavingEmergency && { opacity: 0.7 }]}
                            onPress={handleSaveEmergencyContact}
                            disabled={isSavingEmergency}
                            activeOpacity={0.8}
                        >
                            {isSavingEmergency ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveEmergencyBtnText}>Save Emergency Contact</Text>
                            )}
                        </TouchableOpacity>

                        {user?.emergencyContact?.phone ? (
                            <TouchableOpacity
                                style={styles.removeEmergencyBtn}
                                onPress={handleRemoveEmergencyContact}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.removeEmergencyBtnText}>Remove Emergency Contact</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            </Modal>

            {/* EDIT PROFILE DETAILS MODAL */}
            <Modal
                visible={editProfileModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditProfileModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalBackdrop}
                >
                    <View style={[styles.modalContent, { maxHeight: '92%' }]}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderTitleRow}>
                                <FontAwesomeIcon icon={faUser} size={18} color="#059669" />
                                <Text style={styles.modalTitle}>Edit Profile Details</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setEditProfileModalVisible(false)}
                                style={styles.modalCloseBtn}
                            >
                                <FontAwesomeIcon icon={faTimes} size={16} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {/* Full Name */}
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput
                                style={styles.customNameInput}
                                placeholder="Enter your name"
                                placeholderTextColor="#9CA3AF"
                                value={editName}
                                onChangeText={setEditName}
                            />

                            {/* Email */}
                            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Email Address</Text>
                            <TextInput
                                style={styles.customNameInput}
                                placeholder="e.g. name@domain.com"
                                placeholderTextColor="#9CA3AF"
                                value={editEmail}
                                onChangeText={setEditEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            {/* Phone */}
                            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Phone Number</Text>
                            <View style={styles.phoneInputContainer}>
                                <FontAwesomeIcon icon={faPhone} size={14} color="#059669" style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.phoneInput}
                                    placeholder="10-digit mobile number"
                                    placeholderTextColor="#9CA3AF"
                                    value={editPhone}
                                    onChangeText={setEditPhone}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                />
                            </View>

                            {/* Ride Personality Chips */}
                            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Ride Style & Personality</Text>
                            <View style={styles.personalityChipsContainer}>
                                {PERSONALITY_OPTIONS.map(opt => {
                                    const isSelected = editPersonality.includes(opt);
                                    return (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.personalityChip, isSelected && styles.personalityChipActive]}
                                            onPress={() => togglePersonalityTag(opt)}
                                            activeOpacity={0.7}
                                        >
                                            <FontAwesomeIcon
                                                icon={faLeaf}
                                                size={11}
                                                color={isSelected ? '#FFFFFF' : '#4B5563'}
                                                style={{ marginRight: 5 }}
                                            />
                                            <Text style={[styles.personalityChipText, isSelected && styles.personalityChipTextActive]}>
                                                {opt}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Save Button */}
                            <TouchableOpacity
                                style={[styles.saveEmergencyBtn, isSavingProfile && { opacity: 0.7 }]}
                                onPress={handleSaveProfileDetails}
                                disabled={isSavingProfile}
                                activeOpacity={0.8}
                            >
                                {isSavingProfile ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.saveEmergencyBtnText}>Save Profile Details</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Fixed Header */}
            <View style={styles.fixedHeader}>
                <SafeAreaView>
                    <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                        <FontAwesomeIcon icon={faRightFromBracket} size={20} color="#EF4444" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingsButton} onPress={() => (navigation as any).navigate('Settings')}>
                        <FontAwesomeIcon icon={faGear} size={20} color="#4B5563" />
                    </TouchableOpacity>

                    <View style={styles.profileHeaderContent}>
                        <View style={styles.avatarContainer}>
                            {isUploadingImage ? (
                                <ActivityIndicator size="small" color="#059669" />
                            ) : (localAvatarUri || getImageUrl(user?.profileImage)) ? (
                                <Image
                                    source={{ uri: localAvatarUri || getImageUrl(user?.profileImage)! }}
                                    style={{ width: 92, height: 92, borderRadius: 46 }}
                                    resizeMode="cover"
                                    onError={() => {
                                        setLocalAvatarUri(null);
                                    }}
                                />
                            ) : (
                                <FontAwesomeIcon icon={faUser} size={36} color="#9CA3AF" />
                            )}
                            <TouchableOpacity style={styles.cameraIconContainer} onPress={handleImagePick} disabled={isUploadingImage}>
                                <FontAwesomeIcon icon={faCamera} size={12} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
                        <Text style={styles.userPhone}>{user?.phone || ''}</Text>

                        {/* Edit Profile Action Pill */}
                        <TouchableOpacity
                            style={styles.editProfilePill}
                            onPress={handleOpenEditProfile}
                            activeOpacity={0.8}
                        >
                            <FontAwesomeIcon icon={faPen} size={10} color="#059669" style={{ marginRight: 5 }} />
                            <Text style={styles.editProfilePillText}>Edit Profile</Text>
                        </TouchableOpacity>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>5.0</Text>
                                <Text style={styles.statLabel}>RATING</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <TouchableOpacity
                                style={styles.statItem}
                                onPress={() => (navigation as any).navigate('PassengerMyTrips')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.statValue}>{rides.length}</Text>
                                <Text style={styles.statLabel}>RIDES</Text>
                            </TouchableOpacity>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{yearsDisplay}</Text>
                                <Text style={styles.statLabel}>YEARS</Text>
                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            <BottomNavBar activeTab="PROFILE" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    contentContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        paddingBottom: 30,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    settingsButton: {
        position: 'absolute',
        right: 20,
        top: 40, // Adjust based on safe area
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        zIndex: 10,
    },
    logoutButton: {
        position: 'absolute',
        left: 20,
        top: 40,
        padding: 8,
        backgroundColor: '#FEF2F2',
        borderRadius: 20,
        zIndex: 10,
    },
    profileHeaderContent: {
        alignItems: 'center',
        paddingTop: 10,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 4,
        borderColor: '#ECFDF5', // Mint ring 
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
        borderColor: '#FFFFFF',
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
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
        backgroundColor: '#E5E7EB',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 38,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',

    },
    percentageText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#10B981',
    },
    editText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#10B981',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 12,
        marginTop: 12, // tight spacing
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        marginBottom: 16,
        overflow: 'hidden',
    },
    progressBarFill: {
        width: '80%',
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
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    strengthText: {
        fontSize: 14,
        color: '#4B5563',
        flex: 1,
    },
    bonusBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    bonusText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#6B7280',
    },
    trustHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    shieldIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    badgesRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    verifiedText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#059669',
    },
    subSectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 12,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 12,
    },
    tagText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    menuIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    menuValue: {
        fontSize: 14,
        color: '#9CA3AF',
        marginRight: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
        marginLeft: 48,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        marginBottom: 24,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 6, // Gap
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#10B981',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9CA3AF',
    },
    placeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    placeIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    placeDetails: {
        flex: 1,
        marginRight: 8,
    },
    placeTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    placeAddress: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    placeActionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dividerSimple: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 6,
    },
    addPlaceButton: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: '#ECFDF5',
        borderRadius: 12,
    },
    addPlaceText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#059669',
    },
    // Modal Styles
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalHeaderTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111827',
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 6,
        marginTop: 8,
    },
    customNameContainer: {
        marginBottom: 10,
    },
    customNameInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    modalSubDesc: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
        marginBottom: 14,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 14,
        paddingVertical: 2,
    },
    phoneInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        height: 44,
        paddingVertical: 0,
    },
    editProfilePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        marginTop: 6,
        marginBottom: 2,
    },
    editProfilePillText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#059669',
    },
    personalityChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    personalityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    personalityChipActive: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },
    personalityChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    personalityChipTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    saveEmergencyBtn: {
        backgroundColor: '#059669',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    saveEmergencyBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    removeEmergencyBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 8,
    },
    removeEmergencyBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#EF4444',
    },
    rideTabs: {
        flexDirection: 'row',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    rideTab: {
        marginRight: 20,
        paddingBottom: 8,
    },
    activeRideTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#10B981',
    },
    rideTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    activeRideTabText: {
        color: '#10B981',
    },
    rideList: {
        marginBottom: 12,
    },
    rideListItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    rideListInfo: {
        flex: 1,
    },
    rideListRoute: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    rideListTime: {
        fontSize: 12,
        color: '#6B7280',
    },
    rideListPrice: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ridePriceText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111827',
        marginRight: 8,
    },
    rideDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
    },
    viewAllButton: {
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2563EB',
    },
    emptyRides: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyRidesText: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    currentLocationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderRadius: 14,
        padding: 12,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    currentLocationIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    currentLocationTextWrap: {
        flex: 1,
    },
    currentLocationTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#065F46',
        marginBottom: 2,
    },
    currentLocationSubtitle: {
        fontSize: 11,
        color: '#047857',
        fontWeight: '500',
    },
    orDividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    orDividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    orDividerText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        marginHorizontal: 10,
        letterSpacing: 0.5,
    },
});

export default PassengerProfileScreen;

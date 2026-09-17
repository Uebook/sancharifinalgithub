import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '../../Config/maps';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft,
    faClock,
    faLocationCrosshairs,
    faTimes,
    faHome,
    faBriefcase,
    faHeart,
    faPlus,
    faPen,
    faTrash,
    faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';
import {
    getRecentLocations,
    addRecentLocation,
    removeRecentLocation,
    clearRecentHistory,
    getHomeAddress,
    setHomeAddress,
    getWorkAddress,
    setWorkAddress,
    getFavorites,
    addFavoritePlace,
    removeFavorite,
    SavedLocation,
} from '../../Services/locationStorageService';
import { getCurrentLocationAddress } from '../../Services/directionsService';

const { width } = Dimensions.get('window');

const DropLocationScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { pickupAddress, pickupCoords, mode = 'DROPOFF', onSelectPickup } = (route.params as any) || {};

    const isPickupMode = mode === 'PICKUP';
    const [recentPlaces, setRecentPlaces] = useState<SavedLocation[]>([]);
    const [homePlace, setHomePlace] = useState<SavedLocation | null>(null);
    const [workPlace, setWorkPlace] = useState<SavedLocation | null>(null);
    const [favoritesList, setFavoritesList] = useState<SavedLocation[]>([]);
    const [isLocating, setIsLocating] = useState(false);

    // Modal state for Setting Home / Work / Favorites
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'home' | 'work' | 'favorite'>('home');
    const [customFavName, setCustomFavName] = useState('');

    const loadAllSavedData = async () => {
        try {
            const [recents, home, work, favs] = await Promise.all([
                getRecentLocations(),
                getHomeAddress(),
                getWorkAddress(),
                getFavorites(),
            ]);
            setRecentPlaces(recents);
            setHomePlace(home);
            setWorkPlace(work);
            setFavoritesList(favs);
        } catch (e) {
            console.error('Error loading saved location data:', e);
        }
    };

    useEffect(() => {
        loadAllSavedData();
    }, []);

    const handleSelectLocation = async (address: string, details?: any, coordsInput?: [number, number]) => {
        if (!address) return;
        
        let coords: [number, number] | null = coordsInput || null;
        if (!coords && details?.geometry?.location) {
            coords = [details.geometry.location.lng, details.geometry.location.lat];
        }

        await addRecentLocation(address, address, coords || undefined);

        if (isPickupMode) {
            if (onSelectPickup) {
                onSelectPickup(address, coords);
            }
            navigation.goBack();
        } else {
            (navigation as any).navigate('RideSelection', {
                pickupAddress: pickupAddress || 'Current Location',
                pickupCoords: pickupCoords || null,
                dropoffAddress: address,
                dropoffCoords: coords,
            });
        }
    };

    const handleCurrentLocationClick = async () => {
        setIsLocating(true);
        try {
            const loc = await getCurrentLocationAddress();
            if (loc) {
                handleSelectLocation(loc.address, {
                    geometry: { location: { lat: loc.latitude, lng: loc.longitude } }
                });
            }
        } catch (e: any) {
            Alert.alert('Location Issue', e.message || 'Could not fetch current location');
        } finally {
            setIsLocating(false);
        }
    };

    const handleOpenSaveModal = (type: 'home' | 'work' | 'favorite') => {
        setModalType(type);
        setCustomFavName('');
        setModalVisible(true);
    };

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
        setIsLocating(true);
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
                Alert.alert('Location Saved', `Successfully set ${placeLabel} address to your current location.`);
            }
        } catch (e: any) {
            Alert.alert('Location Error', e.message || 'Could not fetch current location');
        } finally {
            setIsLocating(false);
        }
    };

    const handleClearRecents = () => {
        Alert.alert(
            'Clear History',
            'Are you sure you want to clear your recent location searches?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        await clearRecentHistory();
                        setRecentPlaces([]);
                    }
                }
            ]
        );
    };

    const handleRemoveRecentItem = async (id: string) => {
        const updated = await removeRecentLocation(id);
        setRecentPlaces(updated);
    };

    const handleRemoveFavoriteItem = async (id: string) => {
        Alert.alert(
            'Remove Favorite',
            'Remove this place from your favorites?',
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

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faArrowLeft} size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isPickupMode ? 'Select Pickup Location' : 'Select Destination'}
                </Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Google Places Autocomplete Search Box */}
            <View style={styles.searchContainer}>
                <GooglePlacesAutocomplete
                    placeholder={isPickupMode ? "Search pickup location..." : "Where are you going?"}
                    fetchDetails={true}
                    enablePoweredByContainer={false}
                    minLength={2}
                    debounce={300}
                    keyboardShouldPersistTaps="handled"
                    onPress={(data, details = null) => {
                        handleSelectLocation(data.description, details);
                    }}
                    query={{
                        key: GOOGLE_MAPS_API_KEY,
                        language: 'en',
                        components: 'country:in',
                    }}
                    onFail={(error) => console.error('Autocomplete Error:', error)}
                    textInputProps={{
                        placeholderTextColor: '#64748B',
                        clearButtonMode: 'while-editing',
                        autoFocus: true,
                    }}
                    styles={{
                        container: {
                            flex: 0,
                            zIndex: 9999,
                        },
                        textInputContainer: {
                            backgroundColor: '#1E293B',
                            borderRadius: 14,
                            paddingHorizontal: 12,
                            paddingVertical: 2,
                            borderWidth: 1,
                            borderColor: '#334155',
                            flexDirection: 'row',
                            alignItems: 'center',
                        },
                        textInput: {
                            flex: 1,
                            fontSize: 15,
                            fontWeight: '700',
                            color: '#FFFFFF',
                            backgroundColor: 'transparent',
                            height: 44,
                            paddingVertical: 0,
                        },
                        listView: {
                            backgroundColor: '#1E293B',
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: '#334155',
                            marginTop: 6,
                            elevation: 10,
                            zIndex: 9999,
                        },
                        row: {
                            backgroundColor: '#1E293B',
                            paddingVertical: 14,
                            paddingHorizontal: 16,
                        },
                        description: {
                            color: '#FFFFFF',
                            fontSize: 14,
                            fontWeight: '600',
                        },
                        separator: {
                            backgroundColor: '#334155',
                            height: 1,
                        },
                    }}
                />

                {/* Current Location Quick Option */}
                <TouchableOpacity
                    style={styles.locationOption}
                    onPress={handleCurrentLocationClick}
                    activeOpacity={0.8}
                >
                    <View style={styles.iconCircleGreen}>
                        {isLocating ? (
                            <ActivityIndicator size="small" color="#10B981" />
                        ) : (
                            <FontAwesomeIcon icon={faLocationCrosshairs} size={16} color="#10B981" />
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.optionTitle}>Use Current GPS Location</Text>
                        <Text style={styles.optionSub}>Set your position to current GPS location</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Scrollable Saved Places & Recent Searches */}
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* SAVED PLACES SECTION */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>SAVED PLACES</Text>
                    
                    {/* Home Card */}
                    <View style={styles.savedCard}>
                        <TouchableOpacity
                            style={styles.savedCardContent}
                            onPress={() => {
                                if (homePlace?.subtitle) {
                                    handleSelectLocation(homePlace.subtitle, undefined, homePlace.coords);
                                } else {
                                    handleOpenSaveModal('home');
                                }
                            }}
                            activeOpacity={0.8}
                        >
                            <View style={styles.iconCircleEmerald}>
                                <FontAwesomeIcon icon={faHome} size={16} color="#10B981" />
                            </View>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.savedTitle}>Home</Text>
                                <Text style={styles.savedSub} numberOfLines={1}>
                                    {homePlace?.subtitle || 'Add your home address'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleOpenSaveModal('home')}
                        >
                            <FontAwesomeIcon icon={faPen} size={13} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    {/* Work Card */}
                    <View style={styles.savedCard}>
                        <TouchableOpacity
                            style={styles.savedCardContent}
                            onPress={() => {
                                if (workPlace?.subtitle) {
                                    handleSelectLocation(workPlace.subtitle, undefined, workPlace.coords);
                                } else {
                                    handleOpenSaveModal('work');
                                }
                            }}
                            activeOpacity={0.8}
                        >
                            <View style={styles.iconCircleBlue}>
                                <FontAwesomeIcon icon={faBriefcase} size={16} color="#3B82F6" />
                            </View>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.savedTitle}>Work</Text>
                                <Text style={styles.savedSub} numberOfLines={1}>
                                    {workPlace?.subtitle || 'Add your work / office address'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleOpenSaveModal('work')}
                        >
                            <FontAwesomeIcon icon={faPen} size={13} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    {/* Favorite Places List */}
                    {favoritesList.map((fav) => (
                        <View key={fav.id} style={styles.savedCard}>
                            <TouchableOpacity
                                style={styles.savedCardContent}
                                onPress={() => handleSelectLocation(fav.subtitle, undefined, fav.coords)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.iconCircleRose}>
                                    <FontAwesomeIcon icon={faHeart} size={15} color="#F43F5E" />
                                </View>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.savedTitle}>{fav.title}</Text>
                                    <Text style={styles.savedSub} numberOfLines={1}>
                                        {fav.subtitle}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => handleRemoveFavoriteItem(fav.id)}
                            >
                                <FontAwesomeIcon icon={faTrash} size={13} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Add Favorite Place Button */}
                    <TouchableOpacity
                        style={styles.addFavoriteBtn}
                        onPress={() => handleOpenSaveModal('favorite')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.iconCircleDark}>
                            <FontAwesomeIcon icon={faPlus} size={13} color="#10B981" />
                        </View>
                        <Text style={styles.addFavoriteText}>+ Add Favourite Place</Text>
                    </TouchableOpacity>
                </View>

                {/* RECENT SEARCHES SECTION */}
                {recentPlaces.length > 0 && (
                    <View style={[styles.sectionContainer, { marginTop: 24 }]}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionHeader}>RECENT SEARCHES</Text>
                            <TouchableOpacity onPress={handleClearRecents}>
                                <Text style={styles.clearAllText}>Clear All</Text>
                            </TouchableOpacity>
                        </View>
                        {recentPlaces.map((place) => (
                            <View key={place.id} style={styles.recentRow}>
                                <TouchableOpacity
                                    style={styles.recentRowContent}
                                    onPress={() => handleSelectLocation(place.title, undefined, place.coords)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.iconCircleGray}>
                                        <FontAwesomeIcon icon={faClock} size={14} color="#64748B" />
                                    </View>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={styles.recentTitle} numberOfLines={1}>{place.title}</Text>
                                        <Text style={styles.recentSub} numberOfLines={1}>{place.subtitle}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteRecentBtn}
                                    onPress={() => handleRemoveRecentItem(place.id)}
                                >
                                    <FontAwesomeIcon icon={faTimes} size={12} color="#64748B" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

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
                                            ? faHome
                                            : modalType === 'work'
                                            ? faBriefcase
                                            : faHeart
                                    }
                                    size={18}
                                    color={
                                        modalType === 'home'
                                            ? '#10B981'
                                            : modalType === 'work'
                                            ? '#3B82F6'
                                            : '#F43F5E'
                                    }
                                />
                                <Text style={styles.modalTitle}>
                                    {modalType === 'home'
                                        ? 'Set Home Location'
                                        : modalType === 'work'
                                        ? 'Set Work Location'
                                        : 'Add Favourite Place'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.modalCloseBtn}
                            >
                                <FontAwesomeIcon icon={faTimes} size={16} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        {/* Custom Name input for Favorites */}
                        {modalType === 'favorite' && (
                            <View style={styles.customNameContainer}>
                                <Text style={styles.inputLabel}>Place Name / Tag</Text>
                                <TextInput
                                    style={styles.customNameInput}
                                    placeholder="e.g. Gym, Mom's House, College"
                                    placeholderTextColor="#64748B"
                                    value={customFavName}
                                    onChangeText={setCustomFavName}
                                />
                            </View>
                        )}

                        {/* 1-Tap Current Location Button */}
                        <TouchableOpacity
                            style={styles.currentLocationModalBtn}
                            onPress={handleUseCurrentLocationForSavedAddress}
                            disabled={isLocating}
                            activeOpacity={0.7}
                        >
                            <View style={styles.currentLocationModalIcon}>
                                {isLocating ? (
                                    <ActivityIndicator size="small" color="#10B981" />
                                ) : (
                                    <FontAwesomeIcon icon={faLocationCrosshairs} size={15} color="#10B981" />
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.currentLocationModalTitle}>
                                    {isLocating ? 'Detecting current GPS location...' : 'Use Current Location'}
                                </Text>
                                <Text style={styles.currentLocationModalSub}>
                                    Auto-fill with your present live location
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.orDividerRow}>
                            <View style={styles.orDividerLine} />
                            <Text style={styles.orDividerText}>OR SEARCH MANUALLY</Text>
                            <View style={styles.orDividerLine} />
                        </View>

                        <Text style={styles.inputLabel}>Search & Select Address</Text>
                        
                        {/* Autocomplete inside Modal */}
                        <GooglePlacesAutocomplete
                            placeholder="Type address..."
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
                                placeholderTextColor: '#64748B',
                                clearButtonMode: 'while-editing',
                                autoFocus: true,
                            }}
                            styles={{
                                container: {
                                    flex: 0,
                                    zIndex: 9999,
                                },
                                textInputContainer: {
                                    backgroundColor: '#0F172A',
                                    borderRadius: 12,
                                    paddingHorizontal: 12,
                                    paddingVertical: 2,
                                    borderWidth: 1,
                                    borderColor: '#334155',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                },
                                textInput: {
                                    flex: 1,
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: '#FFFFFF',
                                    backgroundColor: 'transparent',
                                    height: 42,
                                    paddingVertical: 0,
                                },
                                listView: {
                                    backgroundColor: '#0F172A',
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: '#334155',
                                    marginTop: 6,
                                    maxHeight: 220,
                                    zIndex: 9999,
                                },
                                row: {
                                    backgroundColor: '#0F172A',
                                    paddingVertical: 12,
                                    paddingHorizontal: 14,
                                },
                                description: {
                                    color: '#E2E8F0',
                                    fontSize: 13,
                                    fontWeight: '500',
                                },
                                separator: {
                                    backgroundColor: '#1E293B',
                                    height: 1,
                                },
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        zIndex: 9999,
    },
    locationOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 14,
        padding: 14,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    iconCircleGreen: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    optionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    optionSub: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },
    sectionContainer: {
        marginTop: 6,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    clearAllText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#EF4444',
        marginBottom: 10,
    },
    savedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 14,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    savedCardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircleEmerald: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconCircleBlue: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconCircleRose: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(244, 63, 94, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconCircleDark: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    savedTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    savedSub: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    editButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    addFavoriteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 4,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#334155',
    },
    addFavoriteText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#10B981',
    },
    recentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 14,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    recentRowContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircleGray: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    recentTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    recentSub: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    deleteRecentBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F172A',
    },
    // Modal Styles
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '85%',
        borderWidth: 1,
        borderColor: '#334155',
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
        color: '#FFFFFF',
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        marginBottom: 6,
        marginTop: 8,
    },
    customNameContainer: {
        marginBottom: 10,
    },
    customNameInput: {
        backgroundColor: '#0F172A',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    currentLocationModalBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 14,
        padding: 12,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    currentLocationModalIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    currentLocationModalTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10B981',
        marginBottom: 2,
    },
    currentLocationModalSub: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
    orDividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    orDividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#334155',
    },
    orDividerText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        marginHorizontal: 10,
        letterSpacing: 0.5,
    },
});

export default DropLocationScreen;

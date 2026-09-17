import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronLeft,
    faSearch,
    faLocationDot,
    faHome,
    faBriefcase,
    faPlus,
    faClock,
    faHeart,
} from '@fortawesome/free-solid-svg-icons';

import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '../../Config/maps';
import {
    getHomeAddress,
    setHomeAddress,
    getWorkAddress,
    setWorkAddress,
    getRecentHistory,
    addRecentLocation,
    getFavorites,
    SavedLocation
} from '../../Services/locationStorageService';

const DriverBikeDropoffSearchScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const searchType = (route.params as any)?.type || 'DROPOFF';
    const isPickup = searchType === 'PICKUP';

    const headerTitle = isPickup ? 'Pick-up location' : 'Drop-off location';
    const headerSub = isPickup ? 'Where are you starting from?' : 'Where are you headed?';
    const placeholderText = isPickup ? 'Search pick-up location...' : 'Where are you going?';

    // Dynamic local storage states
    const [homeItem, setHomeItem] = useState<SavedLocation | null>(null);
    const [workItem, setWorkItem] = useState<SavedLocation | null>(null);
    const [recentList, setRecentList] = useState<SavedLocation[]>([]);
    const [mostVisitedList, setMostVisitedList] = useState<SavedLocation[]>([]);
    const [favoritesList, setFavoritesList] = useState<SavedLocation[]>([]);

    const loadLocalLocations = async () => {
        const home = await getHomeAddress();
        const work = await getWorkAddress();
        const recents = await getRecentHistory();
        const favs = await getFavorites();

        setHomeItem(home);
        setWorkItem(work);
        setRecentList(recents);

        // Sort by search frequency count for Most Visited
        const sortedByCount = [...recents].sort((a, b) => (b.count || 1) - (a.count || 1));
        setMostVisitedList(sortedByCount.slice(0, 3));
        setFavoritesList(favs);
    };

    useEffect(() => {
        loadLocalLocations();
    }, []);

    const handleSelectLocation = async (locationName: string, subtitle: string = '') => {
        if (!locationName) return;
        // Save to dynamic local storage
        await addRecentLocation(locationName, subtitle || locationName);
        
        const onSelect = (route.params as any)?.onSelect;
        if (onSelect) {
            onSelect(locationName);
            navigation.goBack();
        } else {
            (navigation as any).navigate('DriverBikeChooseRoute', {
                pickup: isPickup ? locationName : ((route.params as any)?.pickup || 'Pick-up location'),
                destination: isPickup ? ((route.params as any)?.destination || 'Drop-off location') : locationName
            });
        }
    };

    const handleAddHomeAddress = () => {
        Alert.prompt(
            "Set Home Address",
            "Enter your home address:",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Save Home Address",
                    onPress: async (text?: string) => {
                        if (text && text.trim()) {
                            const saved = await setHomeAddress(text.trim());
                            setHomeItem(saved);
                            Alert.alert("Success", "Home address saved locally!");
                        }
                    }
                }
            ],
            "plain-text"
        );
    };

    const handleAddWorkAddress = () => {
        Alert.prompt(
            "Set Work Address",
            "Enter your office or work location address:",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Save Work Address",
                    onPress: async (text?: string) => {
                        if (text && text.trim()) {
                            const saved = await setWorkAddress(text.trim());
                            setWorkItem(saved);
                            Alert.alert("Success", "Work address saved locally!");
                        }
                    }
                }
            ],
            "plain-text"
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitleText}>{headerTitle}</Text>
                    <Text style={styles.headerSubText}>{headerSub}</Text>
                </View>
            </View>

            {/* Search Box Container with Dynamic Overlay Dropdown */}
            <View style={styles.searchBoxContainer}>
                <View style={styles.searchBox}>
                    <FontAwesomeIcon icon={faSearch} size={16} color="#64748B" style={{ marginRight: 10 }} />
                    <GooglePlacesAutocomplete
                        placeholder={placeholderText}
                        fetchDetails={true}
                        enablePoweredByContainer={false}
                        minLength={1}
                        debounce={200}
                        keyboardShouldPersistTaps="handled"
                        onPress={(data, details = null) => {
                            handleSelectLocation(data.structured_formatting?.main_text || data.description, data.description);
                        }}
                        query={{
                            key: GOOGLE_MAPS_API_KEY,
                            language: 'en',
                        }}
                        textInputProps={{
                            placeholderTextColor: "#64748B",
                            clearButtonMode: "while-editing",
                            autoFocus: true,
                        }}
                        styles={{
                            container: {
                                flex: 1,
                                overflow: 'visible',
                                zIndex: 99999,
                            },
                            textInputContainer: {
                                backgroundColor: 'transparent',
                                borderTopWidth: 0,
                                borderBottomWidth: 0,
                                padding: 0,
                            },
                            textInput: {
                                backgroundColor: 'transparent',
                                color: '#FFFFFF',
                                fontSize: 16,
                                fontWeight: '600',
                                height: 44,
                                paddingVertical: 0,
                                marginBottom: 0,
                                flex: 1,
                            },
                            listView: {
                                position: 'absolute',
                                top: 50,
                                left: -26,
                                right: -26,
                                backgroundColor: '#0F172A',
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: '#334155',
                                maxHeight: 280,
                                elevation: 100,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 8 },
                                shadowOpacity: 0.4,
                                shadowRadius: 12,
                                zIndex: 99999,
                            },
                            row: {
                                backgroundColor: '#0F172A',
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                            },
                            description: {
                                color: '#F8FAFC',
                                fontSize: 15,
                                fontWeight: '600',
                            },
                            predefinedPlacesDescription: {
                                color: '#10B981',
                            },
                            separator: {
                                backgroundColor: '#1E293B',
                                height: 1,
                            },
                        }}
                    />
                </View>

                <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => handleSelectLocation('Select location on map', 'Interactive Map Selection')}
                    activeOpacity={0.8}
                >
                    <FontAwesomeIcon icon={faLocationDot} size={14} color="#10B981" style={{ marginRight: 8 }} />
                    <Text style={styles.mapBtnText}>Set destination on map</Text>
                </TouchableOpacity>
            </View>

            {/* Dynamic Local Storage Content (SAVED, MOST VISITED, RECENT) */}
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* SAVED PLACES */}
                <Text style={styles.sectionHeader}>SAVED PLACES</Text>

                {/* Home Option */}
                <TouchableOpacity
                    style={styles.itemRow}
                    onPress={() => {
                        if (homeItem) {
                            handleSelectLocation(homeItem.subtitle, homeItem.subtitle);
                        } else {
                            handleAddHomeAddress();
                        }
                    }}
                    activeOpacity={0.8}
                >
                    <View style={[styles.itemIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                        <FontAwesomeIcon icon={faHome} size={16} color="#10B981" />
                    </View>
                    <View style={styles.itemMeta}>
                        <Text style={styles.itemTitle}>{homeItem ? 'Home' : 'Add home address'}</Text>
                        <Text style={styles.itemSubtitle}>{homeItem ? homeItem.subtitle : 'Set your home location for easy booking'}</Text>
                    </View>
                    {!homeItem && (
                        <TouchableOpacity style={styles.addIconCircle} onPress={handleAddHomeAddress}>
                            <FontAwesomeIcon icon={faPlus} size={12} color="#10B981" />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>

                {/* Work Option */}
                <TouchableOpacity
                    style={styles.itemRow}
                    onPress={() => {
                        if (workItem) {
                            handleSelectLocation(workItem.subtitle, workItem.subtitle);
                        } else {
                            handleAddWorkAddress();
                        }
                    }}
                    activeOpacity={0.8}
                >
                    <View style={[styles.itemIconCircle, { backgroundColor: 'rgba(100, 116, 139, 0.15)' }]}>
                        <FontAwesomeIcon icon={faBriefcase} size={14} color="#64748B" />
                    </View>
                    <View style={styles.itemMeta}>
                        <Text style={styles.itemTitle}>{workItem ? 'Work' : 'Add work address'}</Text>
                        <Text style={styles.itemSubtitle}>{workItem ? workItem.subtitle : 'Set for one-tap commute rides'}</Text>
                    </View>
                    {!workItem && (
                        <TouchableOpacity style={styles.addIconCircle} onPress={handleAddWorkAddress}>
                            <FontAwesomeIcon icon={faPlus} size={12} color="#10B981" />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* DYNAMIC MOST VISITED */}
                {mostVisitedList.length > 0 && (
                    <>
                        <Text style={styles.sectionHeader}>MOST VISITED SEARCH HISTORY</Text>
                        {mostVisitedList.map((item) => (
                            <TouchableOpacity
                                key={'mv_' + item.id}
                                style={styles.itemRow}
                                onPress={() => handleSelectLocation(item.title, item.subtitle)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.itemIconCircle}>
                                    <FontAwesomeIcon icon={faClock} size={14} color="#64748B" />
                                </View>
                                <View style={styles.itemMeta}>
                                    <Text style={styles.itemTitle}>{item.title}</Text>
                                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        <View style={styles.divider} />
                    </>
                )}

                {/* DYNAMIC RECENT SEARCH HISTORY */}
                <Text style={styles.sectionHeader}>RECENT SEARCH HISTORY</Text>

                {recentList.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <FontAwesomeIcon icon={faSearch} size={20} color="#475569" style={{ marginBottom: 6 }} />
                        <Text style={styles.emptyText}>No recent searches yet</Text>
                        <Text style={styles.emptySubText}>Search any location above to save it dynamically to history.</Text>
                    </View>
                ) : (
                    recentList.map((rec) => (
                        <TouchableOpacity
                            key={'rec_' + rec.id}
                            style={styles.itemRow}
                            onPress={() => handleSelectLocation(rec.title, rec.subtitle)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.itemIconCircle}>
                                <FontAwesomeIcon icon={faLocationDot} size={14} color="#64748B" />
                            </View>
                            <View style={styles.itemMeta}>
                                <Text style={styles.itemTitle}>{rec.title}</Text>
                                <Text style={styles.itemSubtitle}>{rec.subtitle}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#070B14', // Deep Dark Navy/Black
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
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
        marginRight: 14,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitleText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    headerSubText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    searchBoxContainer: {
        paddingHorizontal: 20,
        marginVertical: 10,
        zIndex: 99999,
        elevation: 100,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#1E293B',
        marginBottom: 10,
        overflow: 'visible',
        zIndex: 99999,
    },
    mapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    mapBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#10B981',
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },
    sectionHeader: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 8,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    itemIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    itemMeta: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    itemSubtitle: {
        fontSize: 12,
        color: '#64748B',
    },
    addIconCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#0B231D',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#10B981',
    },
    divider: {
        height: 1,
        backgroundColor: '#1E293B',
        marginVertical: 12,
    },
    emptyBox: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1E293B',
        marginBottom: 14,
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    emptySubText: {
        color: '#64748B',
        fontSize: 12,
        textAlign: 'center',
    },
});

export default DriverBikeDropoffSearchScreen;

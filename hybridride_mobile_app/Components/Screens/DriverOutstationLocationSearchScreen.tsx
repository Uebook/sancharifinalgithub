import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronLeft,
    faMagnifyingGlass,
    faLocationDot,
    faClockRotateLeft,
    faMapPin,
} from '@fortawesome/free-solid-svg-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '../../Config/maps';

// Popular outstation cities
const POPULAR_CITIES = [
    { name: 'Warangal', sub: 'Telangana, India' },
    { name: 'Karimnagar', sub: 'Telangana, India' },
    { name: 'Vijayawada', sub: 'Andhra Pradesh, India' },
    { name: 'Nizamabad', sub: 'Telangana, India' },
    { name: 'Nalgonda', sub: 'Telangana, India' },
    { name: 'Khammam', sub: 'Telangana, India' },
    { name: 'Kurnool', sub: 'Andhra Pradesh, India' },
];

const RECENT_SEARCHES = [
    { name: 'Warangal Bus Stand', sub: 'Warangal, Telangana, India' },
    { name: 'Vijayawada Railway Station', sub: 'Vijayawada, Andhra Pradesh' },
];

const DriverOutstationLocationSearchScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const { type = 'ORIGIN', onSelect } = (route.params as any) || {};
    const isOrigin = type === 'ORIGIN';

    const headerTitle = isOrigin ? 'Leaving from' : 'Going to';
    const headerSubtitle = isOrigin
        ? 'Where are you starting your trip?'
        : 'Which city are you headed to?';
    const placeholder = isOrigin ? 'Search your city...' : 'Search destination city...';

    const handleSelect = (name: string, coords?: number[]) => {
        if (onSelect) {
            onSelect({ name, coords });
        }
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>{headerTitle}</Text>
                    <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
                </View>
            </View>

            {/* Google Places Autocomplete search bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <FontAwesomeIcon
                        icon={faMagnifyingGlass}
                        size={16}
                        color="#6B7280"
                        style={{ marginRight: 10 }}
                    />
                    <GooglePlacesAutocomplete
                        placeholder={placeholder}
                        fetchDetails={true}
                        onPress={(data, details = null) => {
                            const name = data.description;
                            const coords = details
                                ? [details.geometry.location.lng, details.geometry.location.lat]
                                : undefined;
                            handleSelect(name, coords);
                        }}
                        query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
                        enablePoweredByContainer={false}
                        minLength={2}
                        debounce={300}
                        keyboardShouldPersistTaps="handled"
                        textInputProps={{ placeholderTextColor: '#4B5563', autoFocus: true }}
                        styles={{
                            container: {
                                flex: 1,
                                overflow: 'visible' as const,
                            },
                            textInput: styles.searchInput,
                            listView: {
                                backgroundColor: '#13132A',
                                borderRadius: 16,
                                marginTop: 8,
                                borderWidth: 1,
                                borderColor: '#1E1E38',
                                overflow: 'hidden' as const,
                            },
                            row: {
                                backgroundColor: '#13132A',
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                            },
                            description: {
                                color: '#FFFFFF',
                                fontSize: 14,
                                fontWeight: '600' as const,
                            },
                            predefinedPlacesDescription: {
                                color: '#A78BFA',
                            },
                            separator: {
                                backgroundColor: '#1E1E38',
                                height: 1,
                            },
                        }}
                    />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Recent searches */}
                {RECENT_SEARCHES.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>RECENT</Text>
                        {RECENT_SEARCHES.map((item, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.itemRow}
                                onPress={() => handleSelect(`${item.name}, ${item.sub}`)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.itemIconCircle}>
                                    <FontAwesomeIcon icon={faClockRotateLeft} size={14} color="#6B7280" />
                                </View>
                                <View style={styles.itemMeta}>
                                    <Text style={styles.itemTitle}>{item.name}</Text>
                                    <Text style={styles.itemSub}>{item.sub}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        <View style={styles.divider} />
                    </>
                )}

                {/* Popular cities */}
                <Text style={styles.sectionLabel}>POPULAR DESTINATIONS</Text>
                {POPULAR_CITIES.map((city, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={styles.itemRow}
                        onPress={() => handleSelect(`${city.name}, ${city.sub}`)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.itemIconCircle, { backgroundColor: 'rgba(124, 58, 237, 0.12)' }]}>
                            <FontAwesomeIcon icon={faMapPin} size={14} color="#A78BFA" />
                        </View>
                        <View style={styles.itemMeta}>
                            <Text style={styles.itemTitle}>{city.name}</Text>
                            <Text style={styles.itemSub}>{city.sub}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D1A',
    },
    // ── Header ──────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#13132A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#1E1E38',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    // ── Search ───────────────────────────────────────────────
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 8,
        zIndex: 100,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#13132A',
        borderRadius: 16,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#2D2D45',
        overflow: 'visible',
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        backgroundColor: 'transparent',
        borderWidth: 0,
        height: 50,
    },
    // ── Content ──────────────────────────────────────────────
    content: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 40,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#4B5563',
        letterSpacing: 1.2,
        marginBottom: 12,
        marginTop: 8,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    itemIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#13132A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: '#1E1E38',
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
    itemSub: {
        fontSize: 12,
        color: '#4B5563',
    },
    divider: {
        height: 1,
        backgroundColor: '#1E1E38',
        marginVertical: 12,
    },
});

export default DriverOutstationLocationSearchScreen;

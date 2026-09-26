import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronLeft,
    faLocationDot,
    faCircleDot,
    faMotorcycle,
    faRoute
} from '@fortawesome/free-solid-svg-icons';
import { fetchGoogleRoutes, getCoordsFromAddress, RouteOption } from '../../Services/directionsService';
import poolService from '../../Services/poolService';

const DriverBikeChooseRouteScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const mapRef = useRef<MapView | null>(null);

    const pickup = (route.params as any)?.pickup || 'Pick-up location';
    const destination = (route.params as any)?.destination || 'Drop-off location';
    const pricePerSeat = (route.params as any)?.pricePerSeat || 50;

    const [originCoords, setOriginCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [destCoords, setDestCoords] = useState<{ latitude: number; longitude: number } | null>(null);

    const [routesList, setRoutesList] = useState<RouteOption[]>([]);
    const [selectedRouteId, setSelectedRouteId] = useState<'PREFERRED' | 'ALT1'>('PREFERRED');
    const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);

    // Geocode pickup & destination names dynamically & fetch Google Directions API routes
    useEffect(() => {
        const loadDynamicRoutes = async () => {
            setIsLoadingRoutes(true);
            let origin = await getCoordsFromAddress(pickup);
            if (!origin) {
                const curr = await getCurrentLocationAddress();
                if (curr) origin = { latitude: curr.latitude, longitude: curr.longitude };
            }
            const dest = await getCoordsFromAddress(destination);

            if (origin) setOriginCoords(origin);
            if (dest) setDestCoords(dest);

            if (origin && dest) {
                const fetched = await fetchGoogleRoutes(origin, dest, 'bicycling');
                setRoutesList(fetched);
            }
            setIsLoadingRoutes(false);
        };
        loadDynamicRoutes();
    }, [pickup, destination]);

    const activeRoute = routesList.find(r => r.id === selectedRouteId) || routesList[0];
    const activeColor = selectedRouteId === 'PREFERRED' ? '#10B981' : '#6366F1';

    // Auto-fit map camera when route selection changes
    useEffect(() => {
        if (mapRef.current && activeRoute?.coordinates) {
            setTimeout(() => {
                mapRef.current?.fitToCoordinates(activeRoute.coordinates, {
                    edgePadding: { top: 70, right: 60, bottom: 70, left: 60 },
                    animated: true,
                });
            }, 300);
        }
    }, [selectedRouteId, activeRoute]);

    const handleConfirmRoute = async () => {
        if (isPublishing || !activeRoute) return;
        if (!originCoords || !destCoords) {
            Alert.alert("Location Missing", "Could not determine pickup and drop-off coordinates.");
            return;
        }
        setIsPublishing(true);

        try {
            const scheduledTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
            const payload = {
                type: 'local',
                poolCategory: 'CITY_POOL',
                originName: pickup,
                originCoords: [originCoords.longitude, originCoords.latitude],
                destinationName: destination,
                destinationCoords: [destCoords.longitude, destCoords.latitude],
                scheduledTime,
                vehicle: 'Bike Pool',
                vehicleType: 'BIKE',
                totalSeats: 1,
                pricePerSeat: Number(pricePerSeat),
                route: {
                    distance: activeRoute.distanceKm,
                    duration: activeRoute.durationMin,
                }
            };

            const response = await poolService.publishRide(payload);
            if (response?.success) {
                Alert.alert('Bike Route Published', `Your bike route (${activeRoute.distanceKm} km, ~${activeRoute.durationMin} min) has been published live in DB!`);
                (navigation as any).navigate('DriverMyTrips');
            } else {
                Alert.alert('Publish Failed', response?.message || 'Failed to publish bike ride');
            }
        } catch (error: any) {
            console.error('Publish error:', error);
            Alert.alert('Error', error?.response?.data?.message || 'Failed to publish bike ride');
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitleText}>
                        {pickup.split(',')[0]} → {destination.split(',')[0]}
                    </Text>
                    <Text style={styles.headerSubText}>
                        {isLoadingRoutes ? 'Geocoding location & loading routes...' : `Bike pool · 1 seat · Live Map Routes`}
                    </Text>
                </View>
            </View>

            {/* Live Google Map Canvas */}
            <View style={styles.mapArea}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    showsUserLocation={true}
                    initialRegion={originCoords && destCoords ? {
                        latitude: (originCoords.latitude + destCoords.latitude) / 2,
                        longitude: (originCoords.longitude + destCoords.longitude) / 2,
                        latitudeDelta: 0.08,
                        longitudeDelta: 0.08,
                    } : originCoords ? {
                        latitude: originCoords.latitude,
                        longitude: originCoords.longitude,
                        latitudeDelta: 0.08,
                        longitudeDelta: 0.08,
                    } : undefined}
                >
                    {/* Pickup Marker */}
                    {originCoords && (
                        <Marker coordinate={originCoords} title="Pickup Location" description={pickup}>
                            <View style={styles.originMarker}>
                                <FontAwesomeIcon icon={faCircleDot} size={14} color="#10B981" />
                            </View>
                        </Marker>
                    )}

                    {/* Destination Marker */}
                    {destCoords && (
                        <Marker coordinate={destCoords} title="Destination" description={destination}>
                            <View style={styles.destMarker}>
                                <FontAwesomeIcon icon={faLocationDot} size={22} color="#EF4444" />
                            </View>
                        </Marker>
                    )}

                    {/* Dynamic Google Maps Route Polyline Direction Line */}
                    {activeRoute?.coordinates && activeRoute.coordinates.length > 0 ? (
                        <Polyline
                            coordinates={activeRoute.coordinates}
                            strokeColor={activeColor}
                            strokeWidth={6}
                        />
                    ) : originCoords && destCoords ? (
                        <Polyline
                            coordinates={[originCoords, destCoords]}
                            strokeColor={activeColor}
                            strokeWidth={6}
                        />
                    ) : null}
                </MapView>

                {/* Floating "Create Custom Waypoints" Button */}
                <TouchableOpacity
                    style={styles.floatingCreateRouteBtn}
                    onPress={() => (navigation as any).navigate('DriverBikeCreateRoute', { pickup, destination })}
                    activeOpacity={0.85}
                >
                    <FontAwesomeIcon icon={faRoute} size={14} color="#10B981" style={{ marginRight: 8 }} />
                    <Text style={styles.floatingBtnText}>Create Custom Waypoints</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Dynamic Route Options Sheet */}
            <View style={styles.panel}>
                <Text style={styles.panelTitle}>GOOGLE MAPS CALCULATED BIKE ROUTES</Text>

                {isLoadingRoutes ? (
                    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                        <ActivityIndicator color="#10B981" size="large" />
                        <Text style={{ color: '#94A3B8', marginTop: 10, fontSize: 13 }}>Fetching dynamic Google Maps bike routes...</Text>
                    </View>
                ) : (
                    routesList.map((r) => {
                        const isSelected = r.id === selectedRouteId;
                        const badgeColor = r.id === 'PREFERRED' ? '#10B981' : '#6366F1';

                        return (
                            <TouchableOpacity
                                key={r.id}
                                style={[
                                    styles.routeCard,
                                    isSelected && (r.id === 'PREFERRED' ? styles.routeCardSelected : styles.routeCardSelectedAlt)
                                ]}
                                onPress={() => setSelectedRouteId(r.id)}
                                activeOpacity={0.85}
                            >
                                <View style={styles.routeHeader}>
                                    <Text style={[styles.routeBadgeText, { color: badgeColor }]}>{r.badge}</Text>
                                    <Text style={[styles.routeEta, { color: isSelected ? badgeColor : '#F8FAFC' }]}>
                                        {r.durationMin} min
                                    </Text>
                                </View>
                                <Text style={styles.routeName}>{r.title}</Text>
                                <Text style={styles.routeDetails}>
                                    {r.distanceKm} km · {r.summary}
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}

                {/* Confirm & Publish Button */}
                <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: activeColor }]}
                    onPress={handleConfirmRoute}
                    disabled={isPublishing || isLoadingRoutes}
                    activeOpacity={0.85}
                >
                    {isPublishing ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faMotorcycle} size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text style={styles.confirmBtnText} numberOfLines={1} adjustsFontSizeToFit>
                                Confirm & Publish Bike Route
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#1E293B',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    backButton: {
        padding: 6,
        marginRight: 10,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitleText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    headerSubText: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    mapArea: {
        flex: 1,
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    originMarker: {
        backgroundColor: '#FFFFFF',
        padding: 6,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    destMarker: {
        backgroundColor: '#FFFFFF',
        padding: 4,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    floatingCreateRouteBtn: {
        position: 'absolute',
        top: 16,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#334155',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    floatingBtnText: {
        color: '#F8FAFC',
        fontWeight: '700',
        fontSize: 13,
    },
    panel: {
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderColor: '#334155',
    },
    panelTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1.2,
        marginBottom: 12,
    },
    routeCard: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: '#334155',
    },
    routeCardSelected: {
        borderColor: '#10B981',
        backgroundColor: '#064E3B20',
    },
    routeCardSelectedAlt: {
        borderColor: '#6366F1',
        backgroundColor: '#312E8120',
    },
    routeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    routeBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10B981',
        letterSpacing: 0.8,
    },
    routeEta: {
        fontSize: 15,
        fontWeight: '800',
        color: '#F8FAFC',
    },
    routeName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 2,
    },
    routeDetails: {
        fontSize: 12,
        color: '#94A3B8',
    },
    confirmBtn: {
        backgroundColor: '#10B981',
        paddingVertical: 14,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
    },
    confirmBtnText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
    },
});

export default DriverBikeChooseRouteScreen;

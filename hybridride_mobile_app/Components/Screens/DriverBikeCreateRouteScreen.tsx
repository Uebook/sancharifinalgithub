import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronLeft,
    faCircleDot,
    faSquare,
    faPlus,
    faTimes,
    faLocationDot,
    faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '../../Config/maps';
import { getCoordsFromAddress, calculateTotalPathDistance } from '../../Services/directionsService';
import { driverService } from '../../Services/driverService';

interface WaypointItem {
    id: string;
    name: string;
    coords: { latitude: number; longitude: number };
}

const DriverBikeCreateRouteScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const mapRef = useRef<MapView | null>(null);

    const initialPickupName = (route.params as any)?.pickup || 'Select pick-up location';
    const initialDropoffName = (route.params as any)?.destination || 'Select drop-off location';

    const [pickup, setPickup] = useState({
        name: initialPickupName,
        coords: { latitude: 17.4486, longitude: 78.3808 }
    });

    const [dropoff, setDropoff] = useState({
        name: initialDropoffName,
        coords: { latitude: 17.4401, longitude: 78.3489 }
    });

    // Dynamic Waypoints & Edit Target Mode
    const [stops, setStops] = useState<WaypointItem[]>([]);
    const [showAddStopModal, setShowAddStopModal] = useState(false);
    const [editTargetMode, setEditTargetMode] = useState<'PICKUP' | 'DROPOFF' | 'WAYPOINT'>('WAYPOINT');

    const [isSaving, setIsSaving] = useState(false);
    const [routeInfo, setRouteInfo] = useState({ distance: 8.2, duration: 22 });

    // Geocode pickup and dropoff on mount
    useEffect(() => {
        const geocodeLocations = async () => {
            const pickupCoords = await getCoordsFromAddress(initialPickupName);
            const dropoffCoords = await getCoordsFromAddress(initialDropoffName);
            if (pickupCoords) setPickup(p => ({ ...p, coords: pickupCoords }));
            if (dropoffCoords) setDropoff(d => ({ ...d, coords: dropoffCoords }));
        };
        geocodeLocations();
    }, [initialPickupName, initialDropoffName]);

    // Compute all coordinates along custom path
    const allWaypoints = [
        pickup.coords,
        ...stops.map(s => s.coords),
        dropoff.coords,
    ];

    // Auto-fit map camera & recalculate route distance metrics whenever waypoints change
    useEffect(() => {
        if (allWaypoints.length >= 2) {
            const metrics = calculateTotalPathDistance(allWaypoints);
            setRouteInfo({
                distance: metrics.distanceKm,
                duration: metrics.durationMin
            });
        }

        if (mapRef.current && allWaypoints.length > 0) {
            setTimeout(() => {
                mapRef.current?.fitToCoordinates(allWaypoints, {
                    edgePadding: { top: 70, right: 60, bottom: 70, left: 60 },
                    animated: true,
                });
            }, 300);
        }
    }, [stops, pickup, dropoff]);

    const removeStop = (id: string) => {
        setStops(stops.filter(s => s.id !== id));
    };

    const handleAddWaypoint = async (locationName: string) => {
        if (!locationName || !locationName.trim()) return;
        const name = locationName.trim();
        const coords = await getCoordsFromAddress(name);

        if (editTargetMode === 'PICKUP') {
            setPickup({ name, coords: coords || pickup.coords });
        } else if (editTargetMode === 'DROPOFF') {
            setDropoff({ name, coords: coords || dropoff.coords });
        } else {
            const nextId = Date.now().toString();
            const newStop: WaypointItem = {
                id: nextId,
                name,
                coords: coords || {
                    latitude: pickup.coords.latitude + (Math.random() - 0.5) * 0.02,
                    longitude: pickup.coords.longitude + (Math.random() - 0.5) * 0.02,
                }
            };
            setStops(prev => [...prev, newStop]);
        }
        setShowAddStopModal(false);
    };

    const handleConfirmRoute = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const waypointsPayload = stops.map(s => ({
                name: s.name,
                coords: [s.coords.longitude, s.coords.latitude]
            }));

            const payload = {
                vehicleType: 'BIKE',
                homeLocation: pickup.name,
                officeLocation: dropoff.name,
                pickup: pickup.name,
                dropoff: dropoff.name,
                waypoints: waypointsPayload,
                routeDistance: `${routeInfo.distance} km`,
                routeDuration: `~${routeInfo.duration} min`,
            };

            const response = await driverService.savePlannedCommute(payload);
            if (response?.success) {
                Alert.alert('Custom Bike Route Saved', 'Your custom bike route with waypoints has been published live!');
                (navigation as any).navigate('DriverMyTrips');
            } else {
                Alert.alert('Error', response?.message || 'Failed to save custom bike route');
            }
        } catch (error: any) {
            console.error('Save route error:', error);
            Alert.alert('Error', error?.response?.data?.message || 'Failed to save custom bike route to backend');
        } finally {
            setIsSaving(false);
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
                    <Text style={styles.headerTitleText}>Create Bike Custom Route</Text>
                    <Text style={styles.headerSubText}>{stops.length} intermediate stops added</Text>
                </View>
            </View>

            {/* Live Interactive Map Canvas */}
            <View style={styles.mapArea}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={{
                        latitude: pickup.coords.latitude,
                        longitude: pickup.coords.longitude,
                        latitudeDelta: 0.08,
                        longitudeDelta: 0.08,
                    }}
                >
                    {/* Pickup Marker */}
                    <Marker coordinate={pickup.coords} title="Pickup Location" description={pickup.name}>
                        <View style={styles.originMarker}>
                            <FontAwesomeIcon icon={faCircleDot} size={14} color="#10B981" />
                        </View>
                    </Marker>

                    {/* Intermediate Waypoints Markers */}
                    {stops.map((stop, idx) => (
                        <Marker key={stop.id} coordinate={stop.coords} title={`Stop ${idx + 1}`} description={stop.name}>
                            <View style={styles.waypointMarker}>
                                <Text style={styles.waypointText}>{idx + 1}</Text>
                            </View>
                        </Marker>
                    ))}

                    {/* Drop-off Marker */}
                    <Marker coordinate={dropoff.coords} title="Drop-off Location" description={dropoff.name}>
                        <View style={styles.destMarker}>
                            <FontAwesomeIcon icon={faLocationDot} size={22} color="#818CF8" />
                        </View>
                    </Marker>

                    {/* Route Polyline Line connecting all waypoints */}
                    <Polyline
                        coordinates={allWaypoints}
                        strokeColor="#10B981"
                        strokeWidth={6}
                    />

                    {/* Google Map Directions Line with Waypoints */}
                    <MapViewDirections
                        origin={pickup.coords}
                        destination={dropoff.coords}
                        waypoints={stops.map(s => s.coords)}
                        apikey={GOOGLE_MAPS_API_KEY}
                        strokeWidth={4}
                        strokeColor="#10B981"
                        mode="BICYCLING"
                        onReady={(result) => {
                            setRouteInfo({
                                distance: parseFloat(result.distance.toFixed(1)),
                                duration: Math.round(result.duration)
                            });
                        }}
                        onError={(err) => console.log('MapViewDirections Waypoints Error:', err)}
                    />
                </MapView>
            </View>

            {/* Bottom Config Sheet with Waypoints Controls */}
            <View style={styles.bottomCard}>
                <View style={styles.dragHandle} />

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {/* Pick-up Location Row (Clickable) */}
                    <TouchableOpacity
                        style={styles.stopRow}
                        onPress={() => {
                            setEditTargetMode('PICKUP');
                            setShowAddStopModal(true);
                        }}
                        activeOpacity={0.8}
                    >
                        <FontAwesomeIcon icon={faCircleDot} size={14} color="#10B981" style={{ marginRight: 14 }} />
                        <View style={styles.stopMeta}>
                            <Text style={styles.stopLabel}>PICK-UP LOCATION (TAP TO CHANGE)</Text>
                            <Text style={styles.stopValueText}>{pickup.name}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Dynamic Intermediate Waypoints */}
                    {stops.map((stopItem, idx) => (
                        <View key={stopItem.id} style={styles.stopRow}>
                            <View style={styles.amberDotIcon}>
                                <Text style={styles.amberDotText}>{idx + 1}</Text>
                            </View>
                            <View style={styles.stopMeta}>
                                <Text style={[styles.stopLabel, { color: '#F59E0B' }]}>
                                    WAYPOINT STOP {idx + 1}
                                </Text>
                                <Text style={styles.stopValueText}>{stopItem.name}</Text>
                            </View>
                            <TouchableOpacity onPress={() => removeStop(stopItem.id)} style={styles.removeBtn}>
                                <FontAwesomeIcon icon={faTimes} size={14} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Drop-off Location Row (Clickable) */}
                    <TouchableOpacity
                        style={styles.stopRow}
                        onPress={() => {
                            setEditTargetMode('DROPOFF');
                            setShowAddStopModal(true);
                        }}
                        activeOpacity={0.8}
                    >
                        <FontAwesomeIcon icon={faSquare} size={12} color="#818CF8" style={{ marginRight: 14 }} />
                        <View style={styles.stopMeta}>
                            <Text style={[styles.stopLabel, { color: '#818CF8' }]}>DROP-OFF LOCATION (TAP TO CHANGE)</Text>
                            <Text style={styles.stopValueText}>{dropoff.name}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Add Waypoint Stop Button */}
                    <TouchableOpacity
                        style={styles.addStopDashedBtn}
                        onPress={() => {
                            setEditTargetMode('WAYPOINT');
                            setShowAddStopModal(true);
                        }}
                        activeOpacity={0.8}
                    >
                        <FontAwesomeIcon icon={faPlus} size={14} color="#10B981" style={{ marginRight: 8 }} />
                        <Text style={styles.addStopText}>Add Waypoint Stop</Text>
                    </TouchableOpacity>

                    {/* Total Summary */}
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total Route Metrics</Text>
                        <Text style={styles.totalValue}>{routeInfo.distance} km · ~{routeInfo.duration} min</Text>
                    </View>

                    {/* Confirm & Save Route Button */}
                    <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={handleConfirmRoute}
                        disabled={isSaving}
                        activeOpacity={0.85}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#FFFFFF" size="large" />
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faCheck} size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                                <Text style={styles.confirmBtnText}>Save Custom Bike Route</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Android Compatible Google Places Autocomplete Add Stop Modal */}
            <Modal visible={showAddStopModal} animationType="slide" transparent onRequestClose={() => setShowAddStopModal(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Waypoint Stop</Text>
                            <TouchableOpacity onPress={() => setShowAddStopModal(false)}>
                                <FontAwesomeIcon icon={faTimes} size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: 260, zIndex: 9999, marginTop: 10 }}>
                            <GooglePlacesAutocomplete
                                placeholder="Search location or landmark..."
                                fetchDetails={true}
                                enablePoweredByContainer={false}
                                minLength={1}
                                debounce={200}
                                keyboardShouldPersistTaps="handled"
                                onPress={(data) => {
                                    handleAddWaypoint(data.structured_formatting?.main_text || data.description);
                                }}
                                query={{
                                    key: GOOGLE_MAPS_API_KEY,
                                    language: 'en',
                                }}
                                textInputProps={{
                                    placeholderTextColor: '#64748B',
                                    autoFocus: true,
                                }}
                                styles={{
                                    container: { flex: 1, overflow: 'visible' },
                                    textInputContainer: {
                                        backgroundColor: '#0F172A',
                                        borderRadius: 14,
                                        borderWidth: 1,
                                        borderColor: '#334155',
                                        paddingHorizontal: 12,
                                        height: 48,
                                    },
                                    textInput: {
                                        backgroundColor: 'transparent',
                                        color: '#FFFFFF',
                                        fontSize: 15,
                                        fontWeight: '600',
                                        height: 44,
                                    },
                                    listView: {
                                        backgroundColor: '#0F172A',
                                        borderRadius: 14,
                                        marginTop: 8,
                                        borderWidth: 1,
                                        borderColor: '#334155',
                                        elevation: 20,
                                        zIndex: 9999,
                                    },
                                    row: {
                                        backgroundColor: '#0F172A',
                                        paddingVertical: 14,
                                        paddingHorizontal: 16,
                                    },
                                    description: {
                                        color: '#F8FAFC',
                                        fontSize: 14,
                                        fontWeight: '600',
                                    },
                                }}
                            />
                        </View>
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
    },
    destMarker: {
        backgroundColor: '#FFFFFF',
        padding: 4,
        borderRadius: 16,
        elevation: 4,
    },
    waypointMarker: {
        backgroundColor: '#F59E0B',
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        elevation: 4,
    },
    waypointText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
    },
    bottomCard: {
        maxHeight: 340,
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderColor: '#334155',
    },
    dragHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#475569',
        alignSelf: 'center',
        marginBottom: 16,
    },
    stopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    amberDotIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    amberDotText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
    },
    stopMeta: {
        flex: 1,
    },
    stopLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10B981',
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    stopValueText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F8FAFC',
    },
    removeBtn: {
        padding: 6,
    },
    addStopDashedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#10B981',
        borderStyle: 'dashed',
        borderRadius: 14,
        paddingVertical: 12,
        marginBottom: 14,
    },
    addStopText: {
        color: '#10B981',
        fontWeight: '700',
        fontSize: 14,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#334155',
        marginBottom: 10,
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
    },
    totalValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#10B981',
    },
    confirmBtn: {
        backgroundColor: '#10B981',
        paddingVertical: 14,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        height: 380,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});

export default DriverBikeCreateRouteScreen;

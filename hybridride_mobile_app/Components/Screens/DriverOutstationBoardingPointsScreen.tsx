import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Alert,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronLeft,
    faCircle,
    faLocationDot,
    faSquare,
    faPlus,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';

const { width, height } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────
type StopType = 'START' | 'BOARDING' | 'DROP';

interface BoardingStop {
    id: string;
    type: StopType;
    name: string;
    time: string;
    seatsInfo?: string;
    removable: boolean;
}

// ─── Mock map waypoint positions (relative % of map area) ─
const MAP_WAYPOINTS = [
    { label: 'Hyderabad', top: '10%', left: '22%', color: '#7C3AED' },
    { label: 'Ghatkesar', top: '38%', left: '52%', color: '#F59E0B' },
    { label: 'Jangaon', top: '58%', left: '68%', color: '#F59E0B' },
    { label: 'Warangal', top: '76%', left: '72%', color: '#EF4444' },
];

// ─── Main Screen ──────────────────────────────────────────
const DriverOutstationBoardingPointsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const { origin = 'Hyderabad', destination = 'Warangal', onSave } = (route.params as any) || {};

    const [stops, setStops] = useState<BoardingStop[]>([
        {
            id: '1',
            type: 'START',
            name: 'Madhapur, Hyderabad',
            time: '6:00 AM',
            removable: false,
        },
        {
            id: '2',
            type: 'BOARDING',
            name: 'Ghatkesar Toll Plaza',
            time: '~6:40 AM',
            seatsInfo: '2 seats free',
            removable: true,
        },
        {
            id: '3',
            type: 'BOARDING',
            name: 'Jangaon Bus Stand',
            time: '~7:50 AM',
            seatsInfo: '1 seat free',
            removable: true,
        },
        {
            id: '4',
            type: 'DROP',
            name: `Hanamkonda, ${destination}`,
            time: '~9:10 AM',
            removable: false,
        },
    ]);

    const removeStop = (id: string) => {
        setStops(prev => prev.filter(s => s.id !== id));
    };

    const addBoardingPoint = () => {
        Alert.alert(
            'Add Boarding Point',
            'Search for a highway stop where riders can join your trip.',
            [{ text: 'OK' }]
        );
    };

    const handleSave = () => {
        if (onSave) {
            onSave(stops);
        }
        navigation.goBack();
    };

    const getStopDotColor = (type: StopType) => {
        if (type === 'START') return '#7C3AED';
        if (type === 'DROP') return '#F97316';
        return '#F59E0B';
    };

    const getStopLabel = (type: StopType) => {
        if (type === 'START') return 'START';
        if (type === 'DROP') return 'DROP';
        return 'BOARDING';
    };

    return (
        <View style={styles.container}>
            {/* ── Map Area (dark mock map) ── */}
            <View style={styles.mapArea}>
                {/* Dark grid lines for map feel */}
                <View style={styles.mapGrid} />

                {/* Route curve line (SVG-like using Views) */}
                <View style={styles.routeLineContainer}>
                    <View style={styles.routeCurveLine} />
                </View>

                {/* Waypoint labels on map */}
                {MAP_WAYPOINTS.map((wp, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.waypointContainer,
                            { top: wp.top as any, left: wp.left as any },
                        ]}
                    >
                        <View style={[styles.waypointDot, { backgroundColor: wp.color }]} />
                        <View style={[styles.waypointLabel, idx === MAP_WAYPOINTS.length - 1 && styles.waypointLabelDest]}>
                            <Text style={[
                                styles.waypointText,
                                idx === MAP_WAYPOINTS.length - 1 && styles.waypointTextDest,
                            ]}>
                                {wp.label}
                            </Text>
                        </View>
                    </View>
                ))}

                {/* Floating header on map */}
                <SafeAreaView style={styles.floatingHeader}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <FontAwesomeIcon icon={faChevronLeft} size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Boarding points</Text>
                        <Text style={styles.headerSubtitle}>Highway stops riders can join & leave at</Text>
                    </View>
                </SafeAreaView>
            </View>

            {/* ── Bottom Sheet ── */}
            <View style={styles.bottomSheet}>
                <View style={styles.dragHandle} />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                    {stops.map((stop, index) => (
                        <View key={stop.id}>
                            {/* Stop row */}
                            <View style={styles.stopRow}>
                                {/* Timeline column */}
                                <View style={styles.stopTimelineCol}>
                                    <View style={[styles.stopDot, { backgroundColor: getStopDotColor(stop.type) }]}>
                                        {stop.type === 'DROP' && (
                                            <View style={styles.stopDotInner} />
                                        )}
                                    </View>
                                    {index < stops.length - 1 && (
                                        <View style={styles.stopConnectorLine} />
                                    )}
                                </View>

                                {/* Stop info */}
                                <View style={styles.stopInfo}>
                                    <View style={styles.stopTopRow}>
                                        <Text style={styles.stopLabel}>
                                            {getStopLabel(stop.type)}
                                            {stop.time ? <Text style={styles.stopTime}> · {stop.time}</Text> : null}
                                            {stop.seatsInfo ? <Text style={styles.stopSeats}> · {stop.seatsInfo}</Text> : null}
                                        </Text>
                                    </View>
                                    <Text style={styles.stopName}>{stop.name}</Text>
                                </View>

                                {/* Remove button */}
                                {stop.removable && (
                                    <TouchableOpacity
                                        style={styles.removeBtn}
                                        onPress={() => removeStop(stop.id)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <FontAwesomeIcon icon={faTimes} size={14} color="#4B5563" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}

                    {/* Add boarding point row */}
                    <View style={styles.addStopFooterRow}>
                        <TouchableOpacity style={styles.addStopBtn} onPress={addBoardingPoint}>
                            <FontAwesomeIcon icon={faPlus} size={13} color="#A78BFA" style={{ marginRight: 8 }} />
                            <Text style={styles.addStopText}>Add boarding point</Text>
                        </TouchableOpacity>

                        <View style={styles.distanceInfo}>
                            <Text style={styles.distanceLabel}>More stops = more riders</Text>
                            <Text style={styles.distanceValue}>148 km · ~3h 10m</Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Save button */}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                    <Text style={styles.saveBtnText}>Save boarding points</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D1A',
    },

    // ── Map ──────────────────────────────────────────────────
    mapArea: {
        flex: 1,
        backgroundColor: '#0A0E18',
        position: 'relative',
        overflow: 'hidden',
    },
    mapGrid: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 0,
    },
    routeLineContainer: {
        position: 'absolute',
        top: '12%',
        left: '27%',
        width: 4,
        height: '68%',
        borderRadius: 2,
        transform: [{ rotate: '25deg' }, { scaleY: 1.4 }],
    },
    routeCurveLine: {
        flex: 1,
        backgroundColor: '#7C3AED',
        borderRadius: 4,
        opacity: 0.9,
    },
    waypointContainer: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
    },
    waypointDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    waypointLabel: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    waypointLabelDest: {
        backgroundColor: '#EF4444',
    },
    waypointText: {
        color: '#000000',
        fontSize: 11,
        fontWeight: '800',
    },
    waypointTextDest: {
        color: '#FFFFFF',
    },

    // ── Floating Header ──────────────────────────────────────
    floatingHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10,
        gap: 12,
        backgroundColor: 'rgba(10,14,24,0.6)',
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(30,30,60,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2D2D45',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 1,
    },

    // ── Bottom Sheet ─────────────────────────────────────────
    bottomSheet: {
        backgroundColor: '#0D0D1A',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 28,
        maxHeight: height * 0.55,
        borderTopWidth: 1,
        borderTopColor: '#1E1E38',
    },
    dragHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#2D2D45',
        alignSelf: 'center',
        marginBottom: 16,
    },

    // ── Stop rows ────────────────────────────────────────────
    stopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 0,
    },
    stopTimelineCol: {
        alignItems: 'center',
        width: 24,
        marginRight: 14,
        paddingTop: 4,
    },
    stopDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopDotInner: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#0D0D1A',
    },
    stopConnectorLine: {
        width: 2,
        height: 36,
        backgroundColor: '#2D2D45',
        borderStyle: 'dashed',
        marginTop: 2,
    },
    stopInfo: {
        flex: 1,
        paddingBottom: 22,
    },
    stopTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    stopLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#6B7280',
        letterSpacing: 0.5,
    },
    stopTime: {
        fontWeight: '600',
        color: '#6B7280',
    },
    stopSeats: {
        color: '#A78BFA',
        fontWeight: '700',
    },
    stopName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 3,
    },
    removeBtn: {
        paddingTop: 4,
        paddingLeft: 8,
    },

    // ── Add stop / footer ────────────────────────────────────
    addStopFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        marginBottom: 16,
    },
    addStopBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#A78BFA',
        borderStyle: 'dashed',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    addStopText: {
        color: '#A78BFA',
        fontSize: 13,
        fontWeight: '700',
    },
    distanceInfo: {
        alignItems: 'flex-end',
    },
    distanceLabel: {
        fontSize: 10,
        color: '#4B5563',
        fontWeight: '600',
    },
    distanceValue: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '700',
        marginTop: 2,
    },

    // ── Save button ──────────────────────────────────────────
    saveBtn: {
        backgroundColor: '#10B981',
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0D0D1A',
        letterSpacing: 0.2,
    },
});

export default DriverOutstationBoardingPointsScreen;

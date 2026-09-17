import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronLeft,
    faPhone,
    faCompass,
} from '@fortawesome/free-solid-svg-icons';

const { width } = Dimensions.get('window');

const DriverRentalInProgressScreen = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            {/* Map Area */}
            <View style={styles.mapArea}>
                {/* Fake Map Grid */}
                <View style={styles.gridLineHorizontal} />
                <View style={styles.gridLineVertical} />

                {/* Simulated route path */}
                <View style={styles.routePathContainer}>
                    <View style={styles.originDot} />
                    <View style={styles.routeLine} />
                    <View style={styles.carMarker}>
                        <View style={styles.carMarkerInner} />
                    </View>
                    <View style={styles.destDot} />
                </View>

                {/* Floating Header */}
                <SafeAreaView style={styles.floatingHeader}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <FontAwesomeIcon icon={faChevronLeft} size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Rental in progress</Text>
                        <Text style={styles.headerSubtitle}>Day 1 of 2 · with Anil Kumar</Text>
                    </View>
                    <View style={styles.radarIcon}>
                        <FontAwesomeIcon icon={faCompass} size={18} color="#F59E0B" />
                    </View>
                </SafeAreaView>
            </View>

            {/* Bottom info section */}
            <View style={styles.bottomSection}>
                {/* Live location share alert */}
                <View style={styles.liveAlertRow}>
                    <View style={styles.liveGreenDot} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.liveAlertTitle}>Live location shared with rider & family</Text>
                        <Text style={styles.liveAlertSubtitle}>Route auto-shared · SOS active</Text>
                    </View>
                    <View style={styles.sosBadge}>
                        <Text style={styles.sosText}>sos</Text>
                    </View>
                </View>

                {/* Progress Stats Card */}
                <View style={styles.statsCard}>
                    <View style={styles.statsRow}>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>KM DRIVEN</Text>
                            <Text style={styles.statValue}>148<Text style={styles.statUnit}>/ 250 min</Text></Text>
                        </View>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>EARNING SO FAR</Text>
                            <Text style={[styles.statValue, { color: '#10B981' }]}>₹1,924</Text>
                        </View>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>TODAY</Text>
                            <Text style={styles.statValue}>Day 1</Text>
                        </View>
                    </View>
                    
                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar} />
                    </View>
                </View>

                {/* Today's plan section */}
                <ScrollView style={styles.planSection} showsVerticalScrollIndicator={false}>
                    <Text style={styles.planTitle}>TODAY'S PLAN</Text>
                    
                    {/* Plan step 1 */}
                    <View style={styles.planStepRow}>
                        <View style={styles.stepDotContainer}>
                            <View style={[styles.stepCheckDot, { backgroundColor: '#10B981' }]}>
                                <Text style={styles.checkMark}>✓</Text>
                            </View>
                            <View style={styles.stepConnector} />
                        </View>
                        <Text style={styles.stepText}>
                            Pickup · <Text style={styles.boldPlanText}>Madhapur</Text> · 6:00 AM
                        </Text>
                    </View>

                    {/* Plan step 2 */}
                    <View style={styles.planStepRow}>
                        <View style={styles.stepDotContainer}>
                            <View style={[styles.stepCircleDot, { borderColor: '#F59E0B' }]}>
                                <View style={[styles.stepInnerDot, { backgroundColor: '#F59E0B' }]} />
                            </View>
                            <View style={styles.stepConnector} />
                        </View>
                        <Text style={styles.stepText}>
                            En route to <Text style={styles.boldPlanText}>Bhadrachalam</Text> · <Text style={styles.etaText}>ETA 9:40 AM</Text>
                        </Text>
                    </View>

                    {/* Plan step 3 */}
                    <View style={[styles.planStepRow, { marginBottom: 20 }]}>
                        <View style={styles.stepDotContainer}>
                            <View style={[styles.stepCircleDot, { borderColor: '#4B5563' }]} />
                        </View>
                        <Text style={[styles.stepText, { color: '#6B7280' }]}>
                            Temple darshan · overnight halt
                        </Text>
                    </View>
                </ScrollView>

                {/* Action buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.callBtn}>
                        <FontAwesomeIcon icon={faPhone} size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.callBtnText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.endDayBtn}>
                        <Text style={styles.endDayBtnText}>End day 1</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.billNote}>Tolls you paid are added to the rider's final bill</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A14',
    },
    // Map area styling
    mapArea: {
        flex: 1,
        backgroundColor: '#07080F',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridLineHorizontal: {
        position: 'absolute',
        width: '100%',
        height: 1,
        backgroundColor: '#161925',
        top: '40%',
    },
    gridLineVertical: {
        position: 'absolute',
        height: '100%',
        width: 1,
        backgroundColor: '#161925',
        left: '50%',
    },
    routePathContainer: {
        width: 260,
        height: 260,
        position: 'relative',
    },
    originDot: {
        position: 'absolute',
        top: 20,
        left: 20,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#F59E0B',
    },
    routeLine: {
        position: 'absolute',
        top: 26,
        left: 26,
        width: 180,
        height: 180,
        borderColor: '#F59E0B',
        borderLeftWidth: 4,
        borderBottomWidth: 4,
        borderBottomLeftRadius: 120,
    },
    carMarker: {
        position: 'absolute',
        bottom: 50,
        right: 80,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#1E140A',
    },
    carMarkerInner: {
        width: 10,
        height: 10,
        backgroundColor: '#000000',
        borderRadius: 5,
    },
    destDot: {
        position: 'absolute',
        bottom: 50,
        right: 40,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#EF4444',
    },

    // Floating Header
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
        backgroundColor: 'rgba(10,10,20,0.7)',
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(26,26,36,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2D2D3A',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    radarIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(26,26,36,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2D2D3A',
    },

    // Bottom Section
    bottomSection: {
        backgroundColor: '#0A0A14',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 28,
        borderTopWidth: 1,
        borderTopColor: '#1A1A24',
    },
    liveAlertRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.15)',
        marginBottom: 12,
    },
    liveGreenDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
        marginRight: 10,
    },
    liveAlertTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    liveAlertSubtitle: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 2,
    },
    sosBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    sosText: {
        color: '#EF4444',
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
    },

    // Stats Card
    statsCard: {
        backgroundColor: '#1E140A',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#3D2A18',
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCol: {
        flex: 1,
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#8B6E52',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    statUnit: {
        fontSize: 11,
        color: '#8B6E52',
        fontWeight: '600',
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#3D2A18',
        borderRadius: 2,
        marginTop: 14,
        overflow: 'hidden',
    },
    progressBar: {
        width: '60%',
        height: '100%',
        backgroundColor: '#F59E0B',
        borderRadius: 2,
    },

    // Plan Section
    planSection: {
        maxHeight: 120,
        marginBottom: 16,
    },
    planTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#4B5563',
        letterSpacing: 1,
        marginBottom: 12,
    },
    planStepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    stepDotContainer: {
        width: 20,
        alignItems: 'center',
        marginRight: 10,
    },
    stepCheckDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkMark: {
        color: '#000000',
        fontSize: 9,
        fontWeight: '800',
    },
    stepCircleDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0A0A14',
    },
    stepInnerDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    stepConnector: {
        width: 2,
        height: 24,
        backgroundColor: '#2D2D3A',
        marginVertical: 2,
    },
    stepText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
        flex: 1,
    },
    boldPlanText: {
        fontWeight: '800',
    },
    etaText: {
        color: '#F59E0B',
        fontWeight: '700',
    },

    // Action buttons
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 10,
    },
    callBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1A1A24',
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 28,
        borderWidth: 1,
        borderColor: '#2D2D3A',
    },
    callBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    endDayBtn: {
        flex: 1,
        backgroundColor: 'transparent',
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    endDayBtnText: {
        color: '#F59E0B',
        fontSize: 16,
        fontWeight: '800',
    },
    billNote: {
        fontSize: 11,
        color: '#4B5563',
        textAlign: 'center',
    },
});

export default DriverRentalInProgressScreen;

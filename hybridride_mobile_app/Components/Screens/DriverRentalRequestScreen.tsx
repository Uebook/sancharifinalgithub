import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronLeft,
    faPhone,
    faStar,
    faCircleCheck,
    faPen,
    faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

const { width } = Dimensions.get('window');

const DriverRentalRequestScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const [timeLeft, setTimeLeft] = useState(292); // 4 minutes 52 seconds in seconds

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleAccept = () => {
        (navigation as any).navigate('DriverRentalInProgress');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Rental request</Text>
                    <Text style={styles.headerSubtitle}>Review the trip & confirm your quote</Text>
                </View>
                <View style={styles.timerBadge}>
                    <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Rider Info Card */}
                <View style={styles.card}>
                    <View style={styles.riderRow}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>A</Text>
                        </View>
                        <View style={styles.riderInfo}>
                            <View style={styles.riderNameRow}>
                                <Text style={styles.riderName}>Anil Kumar</Text>
                                <View style={styles.ratingBadge}>
                                    <FontAwesomeIcon icon={faStar} size={10} color="#F59E0B" style={{ marginRight: 2 }} />
                                    <Text style={styles.ratingText}>4.8</Text>
                                </View>
                                <View style={styles.verifiedBadge}>
                                    <Text style={styles.verifiedText}>Verified ID</Text>
                                </View>
                            </View>
                            <Text style={styles.riderSub}>Booking for 3 passengers · family trip</Text>
                        </View>
                        <TouchableOpacity style={styles.phoneButton}>
                            <FontAwesomeIcon icon={faPhone} size={14} color="#10B981" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Route Details Card */}
                <View style={[styles.card, styles.routeCard]}>
                    <View style={styles.badgeRow}>
                        <View style={styles.tripTypeBadge}>
                            <Text style={styles.tripTypeBadgeText}>ROUND TRIP</Text>
                        </View>
                        <Text style={styles.dateRangeText}>Sat 26 - Sun 27 Jul</Text>
                    </View>

                    <View style={styles.routeRow}>
                        <View style={styles.routeTimeline}>
                            <View style={styles.originDot} />
                            <View style={styles.routeLine} />
                            <View style={styles.destSquare} />
                        </View>

                        <View style={styles.routeTextCol}>
                            <View style={styles.locationBlock}>
                                <Text style={styles.locationTitle}>Madhapur, Hyderabad</Text>
                                <Text style={styles.locationSubtitle}>Pickup · Sat 6:00 AM</Text>
                            </View>
                            <View style={styles.locationBlock}>
                                <Text style={styles.locationTitle}>Bhadrachalam Temple</Text>
                                <Text style={styles.locationSubtitle}>Drop & return · ~312 km each way</Text>
                            </View>
                        </View>

                        <View style={styles.distanceBadge}>
                            <Text style={styles.distanceBadgeTitle}>TOTAL</Text>
                            <Text style={styles.distanceBadgeValue}>624 km</Text>
                        </View>
                    </View>
                </View>

                {/* Fare Breakdown Card */}
                <View style={styles.card}>
                    <Text style={styles.cardSectionTitle}>FARE BREAKDOWN</Text>
                    
                    <View style={styles.fareRow}>
                        <Text style={styles.fareLabel}>624 km × ₹13/km</Text>
                        <Text style={styles.fareValue}>₹8,112</Text>
                    </View>
                    <View style={styles.fareRow}>
                        <Text style={styles.fareLabel}>Driver allowance · 2 days × ₹400</Text>
                        <Text style={styles.fareValue}>₹800</Text>
                    </View>
                    <View style={styles.fareRow}>
                        <Text style={styles.fareLabel}>Night driving allowance</Text>
                        <Text style={styles.fareValue}>₹300</Text>
                    </View>
                    <View style={styles.fareRow}>
                        <Text style={styles.fareLabel}>Tolls & state taxes</Text>
                        <Text style={[styles.fareValue, { color: '#9CA3AF' }]}>At actuals</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Trip total (excl. tolls)</Text>
                        <Text style={styles.totalValue}>₹9,212</Text>
                    </View>
                </View>

                {/* Earnings Highlight */}
                <View style={styles.earningsHighlight}>
                    <View style={styles.rupeeIconCircle}>
                        <Text style={styles.rupeeIconText}>₹</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.earningsTitle}>You keep ₹7,830</Text>
                        <Text style={styles.earningsSubtitle}>After 15% Sanchari fee · tolls reimbursed separately</Text>
                    </View>
                </View>

                {/* Adjust Quote Button */}
                <TouchableOpacity style={styles.adjustQuoteButton} activeOpacity={0.8}>
                    <FontAwesomeIcon icon={faPen} size={14} color="#F59E0B" style={{ marginRight: 10 }} />
                    <Text style={styles.adjustQuoteText}>Want to adjust this quote before accepting?</Text>
                    <FontAwesomeIcon icon={faChevronRight} size={14} color="#4B5563" />
                </TouchableOpacity>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.warningRow}>
                    <View style={styles.warningDot} />
                    <Text style={styles.warningText}>RESPOND WITHIN 5 MIN</Text>
                </View>
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.declineBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                        <Text style={styles.acceptBtnText}>Accept · ₹9,212 trip</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.footerNote}>Rider pays a deposit now, balance after the trip</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A14',
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 12,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1A1A24',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2D2D3A',
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
    timerBadge: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    timerText: {
        color: '#F59E0B',
        fontWeight: '800',
        fontSize: 13,
    },

    // Content
    content: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },

    // Cards
    card: {
        backgroundColor: '#1A1A24',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2D2D3A',
    },

    // Rider Row
    riderRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#000000',
    },
    riderInfo: {
        flex: 1,
    },
    riderNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    riderName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    verifiedBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    verifiedText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#10B981',
    },
    riderSub: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 4,
    },
    phoneButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },

    // Route details
    routeCard: {
        backgroundColor: '#1E140A', // Warm dark gold background tint
        borderColor: '#3D2A18',
    },
    badgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    tripTypeBadge: {
        borderWidth: 1,
        borderColor: '#F59E0B',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    tripTypeBadgeText: {
        color: '#F59E0B',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    dateRangeText: {
        color: '#F59E0B',
        fontSize: 13,
        fontWeight: '700',
    },
    routeRow: {
        flexDirection: 'row',
    },
    routeTimeline: {
        alignItems: 'center',
        marginRight: 14,
        paddingVertical: 6,
    },
    originDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#1E140A',
        borderWidth: 3,
        borderColor: '#F59E0B',
    },
    routeLine: {
        width: 2,
        height: 48,
        backgroundColor: '#3D2A18',
        borderStyle: 'dashed',
        marginVertical: 4,
    },
    destSquare: {
        width: 10,
        height: 10,
        backgroundColor: '#EF4444',
        borderRadius: 2,
        borderWidth: 2,
        borderColor: '#FCA5A5',
    },
    routeTextCol: {
        flex: 1,
        justifyContent: 'space-between',
    },
    locationBlock: {
        paddingVertical: 2,
    },
    locationTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    locationSubtitle: {
        fontSize: 11,
        color: '#8B6E52',
        marginTop: 2,
    },
    distanceBadge: {
        alignSelf: 'center',
        backgroundColor: '#2E1E10',
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4D361F',
    },
    distanceBadgeTitle: {
        fontSize: 8,
        fontWeight: '800',
        color: '#8B6E52',
        letterSpacing: 0.5,
    },
    distanceBadgeValue: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 3,
    },

    // Fare Breakdown
    cardSectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#4B5563',
        letterSpacing: 1.2,
        marginBottom: 14,
    },
    fareRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    fareLabel: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    fareValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#2D2D3A',
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    totalValue: {
        fontSize: 18,
        color: '#10B981',
        fontWeight: '800',
    },

    // Earnings Highlight
    earningsHighlight: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.15)',
        marginBottom: 12,
    },
    rupeeIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    rupeeIconText: {
        color: '#10B981',
        fontWeight: '800',
        fontSize: 14,
    },
    earningsTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    earningsSubtitle: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 2,
    },

    // Adjust Quote Button
    adjustQuoteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A24',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2D2D3A',
    },
    adjustQuoteText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0A0A14',
        borderTopWidth: 1,
        borderTopColor: '#1A1A24',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 28,
    },
    warningRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    warningDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F59E0B',
        marginRight: 6,
    },
    warningText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#F59E0B',
        letterSpacing: 1,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    declineBtn: {
        flex: 1,
        backgroundColor: '#1A1A24',
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2D2D3A',
    },
    declineBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    acceptBtn: {
        flex: 2,
        backgroundColor: '#10B981',
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
    },
    acceptBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0A0A14',
    },
    footerNote: {
        fontSize: 11,
        color: '#4B5563',
        textAlign: 'center',
    },
});

export default DriverRentalRequestScreen;

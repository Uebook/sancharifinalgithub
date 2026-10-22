import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Modal,
    Pressable,
    ScrollView,
    Dimensions,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronLeft,
    faCar,
    faMinus,
    faPlus,
    faIndianRupeeSign,
    faChair,
    faCheck,
} from '@fortawesome/free-solid-svg-icons';

const { width } = Dimensions.get('window');

export interface SeatPricingConfig {
    front: number;
    middle: number;
    back: number;
}

export interface SeatDistributionConfig {
    front: number;
    middle: number;
    back: number;
}

interface DriverSeatPreferenceModalProps {
    visible: boolean;
    onClose: () => void;
    basePrice?: number;
    initialTotalSeats?: number;
    maxCapacity?: number;
    initialPricing?: SeatPricingConfig;
    initialDistribution?: SeatDistributionConfig;
    onConfirm: (data: {
        totalSeats: number;
        pricing: SeatPricingConfig;
        distribution: SeatDistributionConfig;
        totalEarnings: number;
    }) => void;
}

const DriverSeatPreferenceModal = ({
    visible,
    onClose,
    basePrice = 90,
    initialTotalSeats = 3,
    maxCapacity = 4,
    initialPricing,
    initialDistribution,
    onConfirm,
}: DriverSeatPreferenceModalProps) => {
    // Row Seat Pricing (defaults calculated based on basePrice)
    const [frontPrice, setFrontPrice] = useState(
        initialPricing?.front || Math.round(basePrice * 1.15)
    );
    const [middlePrice, setMiddlePrice] = useState(
        initialPricing?.middle || basePrice
    );
    const [backPrice, setBackPrice] = useState(
        initialPricing?.back || Math.round(basePrice * 0.9)
    );

    // Row Seat Counts Offered
    const [frontSeats, setFrontSeats] = useState(
        initialDistribution?.front !== undefined ? initialDistribution.front : 1
    );
    const [middleSeats, setMiddleSeats] = useState(
        initialDistribution?.middle !== undefined
            ? initialDistribution.middle
            : Math.max(1, initialTotalSeats - 1)
    );
    const [backSeats, setBackSeats] = useState(
        initialDistribution?.back !== undefined ? initialDistribution.back : 0
    );

    useEffect(() => {
        if (visible) {
            if (initialPricing) {
                setFrontPrice(initialPricing.front);
                setMiddlePrice(initialPricing.middle);
                setBackPrice(initialPricing.back);
            } else {
                setFrontPrice(Math.round(basePrice * 1.15));
                setMiddlePrice(basePrice);
                setBackPrice(Math.round(basePrice * 0.9));
            }
            if (initialDistribution) {
                setFrontSeats(initialDistribution.front);
                setMiddleSeats(initialDistribution.middle);
                setBackSeats(initialDistribution.back);
            }
        }
    }, [visible, basePrice]);

    const totalSeatsOffered = frontSeats + middleSeats + backSeats;
    const totalEarnings =
        frontSeats * frontPrice + middleSeats * middlePrice + backSeats * backPrice;

    const handleConfirm = () => {
        onConfirm({
            totalSeats: totalSeatsOffered,
            pricing: {
                front: frontPrice,
                middle: middlePrice,
                back: backPrice,
            },
            distribution: {
                front: frontSeats,
                middle: middleSeats,
                back: backSeats,
            },
            totalEarnings,
        });
        onClose();
    };

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.backButton} activeOpacity={0.7}>
                            <FontAwesomeIcon icon={faChevronLeft} size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle}>Select Seat Preference</Text>
                            <Text style={styles.headerSub}>
                                {totalSeatsOffered > 0
                                    ? `${totalSeatsOffered} SEATS CONFIGURED FOR RIDERS`
                                    : 'CONFIGURE SEATS & ROW PRICING BELOW'}
                            </Text>
                        </View>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Summary Pill Card */}
                        <View style={styles.passengersCard}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.passengersLabel}>PASSENGERS OFFERED</Text>
                                <Text style={styles.passengersCount}>
                                    {totalSeatsOffered} {totalSeatsOffered === 1 ? 'Seat' : 'Seats'}
                                </Text>
                                <Text style={styles.passengersMax}>
                                    Max {maxCapacity} seats available in vehicle
                                </Text>
                            </View>

                            <View style={styles.stepperBox}>
                                <TouchableOpacity
                                    style={styles.stepperBtn}
                                    onPress={() => {
                                        if (middleSeats > 1) setMiddleSeats((p) => p - 1);
                                        else if (frontSeats > 0) setFrontSeats(0);
                                    }}
                                    disabled={totalSeatsOffered <= 1}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.stepperBtnText,
                                            totalSeatsOffered <= 1 && styles.stepperDisabled,
                                        ]}
                                    >
                                        −
                                    </Text>
                                </TouchableOpacity>

                                <Text style={styles.stepperValText}>{totalSeatsOffered}</Text>

                                <TouchableOpacity
                                    style={styles.stepperBtn}
                                    onPress={() => {
                                        if (totalSeatsOffered < maxCapacity) {
                                            if (frontSeats === 0) setFrontSeats(1);
                                            else if (middleSeats < 3) setMiddleSeats((p) => p + 1);
                                            else if (maxCapacity > 4) setBackSeats((p) => p + 1);
                                        }
                                    }}
                                    disabled={totalSeatsOffered >= maxCapacity}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.stepperBtnText,
                                            totalSeatsOffered >= maxCapacity && styles.stepperDisabled,
                                        ]}
                                    >
                                        +
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Vehicle Interior Visual Container */}
                        <View style={styles.interiorVisualContainer}>
                            <View style={styles.interiorHeaderRow}>
                                <FontAwesomeIcon icon={faCar} size={16} color="#60A5FA" style={{ marginRight: 8 }} />
                                <Text style={styles.interiorLabel}>VEHICLE INTERIOR (CAR)</Text>
                            </View>

                            {/* Driver + Front Passenger Layout Row */}
                            <View style={styles.cabinTopRow}>
                                <View style={[styles.miniSeat, frontSeats > 0 ? styles.miniSeatActive : styles.miniSeatEmpty]}>
                                    <FontAwesomeIcon
                                        icon={faChair}
                                        size={14}
                                        color={frontSeats > 0 ? '#10B981' : '#64748B'}
                                    />
                                    <Text
                                        style={[
                                            styles.miniSeatLabel,
                                            frontSeats > 0 ? { color: '#10B981' } : { color: '#64748B' },
                                        ]}
                                    >
                                        {frontSeats > 0 ? 'FRONT' : 'EMPTY'}
                                    </Text>
                                </View>

                                <View style={[styles.miniSeat, styles.miniSeatDriver]}>
                                    <Text style={styles.driverSeatText}>DRIVER</Text>
                                </View>
                            </View>

                            {/* 1. FRONT ROW CARD */}
                            <View style={[styles.rowCard, frontSeats > 0 && styles.rowCardActive]}>
                                <View style={styles.rowInfoCol}>
                                    <Text style={[styles.rowTitle, frontSeats > 0 && styles.rowTitleActive]}>
                                        FRONT ROW
                                    </Text>
                                    <Text style={styles.rowPriceTag}>
                                        ₹{frontPrice}/seat · {frontSeats > 0 ? '1 Seat Offered' : 'No Seats'}
                                    </Text>
                                </View>

                                {/* Steppers: Seat & Price */}
                                <View style={styles.rowControls}>
                                    {/* Seat count toggle */}
                                    <View style={styles.counterGroup}>
                                        <Text style={styles.groupLabel}>SEATS</Text>
                                        <View style={styles.miniCounter}>
                                            <TouchableOpacity
                                                style={styles.miniCountBtn}
                                                onPress={() => setFrontSeats(0)}
                                                disabled={frontSeats === 0}
                                            >
                                                <Text style={styles.miniCountBtnText}>−</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.miniCountValue}>{frontSeats}</Text>
                                            <TouchableOpacity
                                                style={styles.miniCountBtn}
                                                onPress={() => {
                                                    if (totalSeatsOffered < maxCapacity) setFrontSeats(1);
                                                }}
                                                disabled={frontSeats >= 1 || totalSeatsOffered >= maxCapacity}
                                            >
                                                <Text style={styles.miniCountBtnText}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Price Stepper */}
                                    <View style={styles.counterGroup}>
                                        <Text style={styles.groupLabel}>PRICE / SEAT</Text>
                                        <View style={styles.miniCounter}>
                                            <TouchableOpacity
                                                style={styles.miniCountBtn}
                                                onPress={() => setFrontPrice((p) => Math.max(20, p - 5))}
                                            >
                                                <Text style={styles.miniCountBtnText}>−</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.miniPriceValue}>₹{frontPrice}</Text>
                                            <TouchableOpacity
                                                style={styles.miniCountBtn}
                                                onPress={() => setFrontPrice((p) => p + 5)}
                                            >
                                                <Text style={styles.miniCountBtnText}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* 2. MIDDLE ROW CARD */}
                            <View style={[styles.rowCard, middleSeats > 0 && styles.rowCardActive]}>
                                <View style={styles.rowInfoCol}>
                                    <Text style={[styles.rowTitle, middleSeats > 0 && styles.rowTitleActive]}>
                                        MIDDLE ROW
                                    </Text>
                                    <Text style={styles.rowPriceTag}>
                                        ₹{middlePrice}/seat · {middleSeats} {middleSeats === 1 ? 'Seat' : 'Seats'}
                                    </Text>
                                </View>

                                <View style={styles.rowControls}>
                                    <View style={styles.counterGroup}>
                                        <Text style={styles.groupLabel}>SEATS</Text>
                                        <View style={styles.miniCounter}>
                                            <TouchableOpacity
                                                style={styles.miniCountBtn}
                                                onPress={() => setMiddleSeats((p) => Math.max(0, p - 1))}
                                                disabled={middleSeats === 0}
                                            >
                                                <Text style={styles.miniCountBtnText}>−</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.miniCountValue}>{middleSeats}</Text>
                                            <TouchableOpacity
                                                style={styles.miniCountBtn}
                                                onPress={() => {
                                                    if (totalSeatsOffered < maxCapacity && middleSeats < 3) {
                                                        setMiddleSeats((p) => p + 1);
                                                    }
                                                }}
                                                disabled={middleSeats >= 3 || totalSeatsOffered >= maxCapacity}
                                            >
                                                <Text style={styles.miniCountBtnText}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.counterGroup}>
                                        <Text style={styles.groupLabel}>PRICE / SEAT</Text>
                                        <View style={styles.miniCounter}>
                                            <TouchableOpacity
                                                style={styles.miniCountBtn}
                                                onPress={() => setMiddlePrice((p) => Math.max(15, p - 5))}
                                            >
                                                <Text style={styles.miniCountBtnText}>−</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.miniPriceValue}>₹{middlePrice}</Text>
                                            <TouchableOpacity
                                                style={styles.miniCountBtn}
                                                onPress={() => setMiddlePrice((p) => p + 5)}
                                            >
                                                <Text style={styles.miniCountBtnText}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* 3. BACK ROW CARD (Available for XL/7-seater or optional) */}
                            {maxCapacity > 4 && (
                                <View style={[styles.rowCard, backSeats > 0 && styles.rowCardActive]}>
                                    <View style={styles.rowInfoCol}>
                                        <Text style={[styles.rowTitle, backSeats > 0 && styles.rowTitleActive]}>
                                            BACK ROW
                                        </Text>
                                        <Text style={styles.rowPriceTag}>
                                            ₹{backPrice}/seat · {backSeats} {backSeats === 1 ? 'Seat' : 'Seats'}
                                        </Text>
                                    </View>

                                    <View style={styles.rowControls}>
                                        <View style={styles.counterGroup}>
                                            <Text style={styles.groupLabel}>SEATS</Text>
                                            <View style={styles.miniCounter}>
                                                <TouchableOpacity
                                                    style={styles.miniCountBtn}
                                                    onPress={() => setBackSeats((p) => Math.max(0, p - 1))}
                                                    disabled={backSeats === 0}
                                                >
                                                    <Text style={styles.miniCountBtnText}>−</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.miniCountValue}>{backSeats}</Text>
                                                <TouchableOpacity
                                                    style={styles.miniCountBtn}
                                                    onPress={() => {
                                                        if (totalSeatsOffered < maxCapacity && backSeats < (maxCapacity - 4)) {
                                                            setBackSeats((p) => p + 1);
                                                        }
                                                    }}
                                                    disabled={totalSeatsOffered >= maxCapacity}
                                                >
                                                    <Text style={styles.miniCountBtnText}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={styles.counterGroup}>
                                            <Text style={styles.groupLabel}>PRICE / SEAT</Text>
                                            <View style={styles.miniCounter}>
                                                <TouchableOpacity
                                                    style={styles.miniCountBtn}
                                                    onPress={() => setBackPrice((p) => Math.max(10, p - 5))}
                                                >
                                                    <Text style={styles.miniCountBtnText}>−</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.miniPriceValue}>₹{backPrice}</Text>
                                                <TouchableOpacity
                                                    style={styles.miniCountBtn}
                                                    onPress={() => setBackPrice((p) => p + 5)}
                                                >
                                                    <Text style={styles.miniCountBtnText}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Bottom Sticky Action Bar */}
                    <View style={styles.bottomBar}>
                        <View style={styles.earningsSummaryCol}>
                            <Text style={styles.earningsLabel}>ESTIMATED TRIP EARNINGS</Text>
                            <Text style={styles.earningsAmount}>₹{totalEarnings}</Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.confirmBtn,
                                totalSeatsOffered === 0 && styles.confirmBtnDisabled,
                            ]}
                            onPress={handleConfirm}
                            disabled={totalSeatsOffered === 0}
                            activeOpacity={0.85}
                        >
                            <FontAwesomeIcon icon={faCheck} size={15} color="#000000" style={{ marginRight: 8 }} />
                            <Text style={styles.confirmBtnText}>Save Seat Preferences</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#0F172A',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '92%',
        paddingTop: 16,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    headerSub: {
        fontSize: 11,
        fontWeight: '700',
        color: '#F59E0B',
        marginTop: 2,
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 20,
    },
    passengersCard: {
        backgroundColor: '#1E293B',
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    passengersLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.8,
    },
    passengersCount: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        marginVertical: 2,
    },
    passengersMax: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
    },
    stepperBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: '#334155',
    },
    stepperBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperBtnText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    stepperDisabled: {
        color: '#475569',
    },
    stepperValText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        marginHorizontal: 12,
    },
    interiorVisualContainer: {
        backgroundColor: '#111827',
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    interiorHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    interiorLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
    },
    cabinTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
        gap: 12,
    },
    miniSeat: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    miniSeatActive: {
        backgroundColor: '#064E3B',
        borderColor: '#10B981',
    },
    miniSeatEmpty: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
    },
    miniSeatDriver: {
        backgroundColor: '#1E293B',
        borderColor: '#3B82F6',
    },
    miniSeatLabel: {
        fontSize: 10,
        fontWeight: '800',
        marginTop: 2,
    },
    driverSeatText: {
        color: '#3B82F6',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    rowCard: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    rowCardActive: {
        borderColor: '#0D9488',
        backgroundColor: '#1E293B',
    },
    rowInfoCol: {
        marginBottom: 10,
    },
    rowTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    rowTitleActive: {
        color: '#FFFFFF',
    },
    rowPriceTag: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2DD4BF',
        marginTop: 2,
    },
    rowControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    counterGroup: {
        flex: 1,
    },
    groupLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    miniCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 10,
        padding: 3,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#334155',
    },
    miniCountBtn: {
        width: 30,
        height: 30,
        borderRadius: 6,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniCountBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    miniCountValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        paddingHorizontal: 8,
    },
    miniPriceValue: {
        color: '#2DD4BF',
        fontSize: 14,
        fontWeight: '900',
        paddingHorizontal: 6,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
    },
    earningsSummaryCol: {
        flex: 1,
    },
    earningsLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    earningsAmount: {
        fontSize: 22,
        fontWeight: '900',
        color: '#10B981',
    },
    confirmBtn: {
        backgroundColor: '#10B981',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 12,
    },
    confirmBtnDisabled: {
        opacity: 0.4,
    },
    confirmBtnText: {
        color: '#000000',
        fontSize: 14,
        fontWeight: '800',
    },
});

export default DriverSeatPreferenceModal;

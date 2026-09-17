import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Alert,
    ActivityIndicator,
    TextInput,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheck, faStar, faLock, faCreditCard, faMoneyBill, faCircleCheck, faCircle } from '@fortawesome/free-solid-svg-icons';
import { rateRide, updateRideStatus } from '../../Services/rideService';
import { createCashfreeRideOrder, verifyCashfreeRidePayment } from '../../Services/paymentService';
import { CONFIG } from '../../Constants/Config';
import PaymentFailedModal from '../Common/PaymentFailedModal';

const { width } = Dimensions.get('window');

const RideCompletedScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'GATEWAY'>('WALLET');
    const [step, setStep] = useState<'PAYMENT' | 'RATING' | 'SUCCESS'>('PAYMENT');
    const { bookingId, driver, price } = route.params as any || {};

    // Payment Failed Custom Modal State
    const [failedModalVisible, setFailedModalVisible] = useState(false);
    const [failedModalInfo, setFailedModalInfo] = useState<{
        title?: string;
        message?: string;
        amount?: number;
        orderId?: string;
    }>({});

    const showPaymentFailure = (msg: string, amt?: number, oId?: string, title?: string) => {
        setFailedModalInfo({
            title: title || 'Payment Failed',
            message: msg || 'Your payment could not be processed. Please try again.',
            amount: amt,
            orderId: oId,
        });
        setFailedModalVisible(true);
    };

    const driverName = driver?.name || "Michael";
    const finalPrice = price || "13.00";

    const handlePayment = async () => {
        if (submitting) return;

        setSubmitting(true);
        try {
            const amt = parseFloat(finalPrice) || 0;
            if (paymentMethod === 'GATEWAY') {
                // Cashfree Online Native Payment Flow
                const cfRes = await createCashfreeRideOrder(amt, bookingId, 1);
                if (!cfRes.success || !cfRes.orderId || !cfRes.paymentSessionId) {
                    showPaymentFailure(cfRes.message || "Failed to initialize payment gateway.", amt);
                    setSubmitting(false);
                    return;
                }

                // Navigate to WebView-based payment (bypasses INSTALLER_PACKAGE_NOT_APPROVED)
                (navigation as any).navigate('CashfreeWebPayment', {
                    paymentSessionId: cfRes.paymentSessionId,
                    orderId: cfRes.orderId,
                    environment: cfRes.environment || 'SANDBOX',
                    onSuccess: async (orderID: string) => {
                        console.log('[RidePayment] Payment success, verifying orderId:', orderID);
                        try {
                            setSubmitting(true);
                            const verifyRes = await verifyCashfreeRidePayment(orderID, bookingId, 1, amt);
                            if (verifyRes.success) {
                                if (bookingId) await updateRideStatus(bookingId, 'completed');
                                setStep('RATING');
                            } else {
                                showPaymentFailure(verifyRes.message || 'Payment verification failed.', amt, orderID, 'Verification Incomplete');
                            }
                        } catch (vErr: any) {
                            showPaymentFailure(vErr.response?.data?.message || vErr.message || 'Could not verify payment.', amt, orderID, 'Verification Error');
                        } finally {
                            setSubmitting(false);
                        }
                    },
                    onError: (message: string) => {
                        if (message !== 'cancelled') {
                            showPaymentFailure(message, amt, cfRes.orderId);
                        }
                        setSubmitting(false);
                    },
                });
                return;
            } else {
                // Wallet Payment logic
            }

            // Mark booking as paid in backend
            if (bookingId) {
                await updateRideStatus(bookingId, 'completed');
            }

            // Move to Rating Step
            setStep('RATING');
        } catch (error: any) {
            console.error('Payment failed:', error);
            Alert.alert("Payment Cancelled", error.response?.data?.message || error.message || "Could not complete payment.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRateAndFinish = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            if (rating > 0 && bookingId) {
                await rateRide(bookingId, rating, comment || "Great ride!");
            }
            setStep('SUCCESS');
            // Auto-redirect after 2 seconds
            setTimeout(() => {
                navigation.navigate('PassengerHome' as never);
            }, 2000);
        } catch (error) {
            console.error('Rating failed:', error);
            // Even if rating fails, we can go home
            navigation.navigate('PassengerHome' as never);
        } finally {
            setSubmitting(false);
        }
    };

    const getPayButtonText = () => {
        if (paymentMethod === 'WALLET') return `Pay ₹${finalPrice} from Wallet`;
        return `Pay ₹${finalPrice} via Online`;
    };

    return (
        <SafeAreaView style={styles.container}>
            {step === 'PAYMENT' && (
                <View style={styles.fullWidth}>
                    <View style={styles.content}>
                        <View style={styles.successIconContainer}>
                            <FontAwesomeIcon icon={faMoneyBill} size={32} color="#10B981" />
                        </View>
                        <Text style={styles.title}>Payment Required</Text>
                        <Text style={styles.subtitle}>Please complete the payment to end the ride.</Text>

                        <View style={styles.paymentCard}>
                            <Text style={styles.amountLabel}>TOTAL PAYABLE AMOUNT</Text>
                            <Text style={styles.amountValue}>₹{finalPrice}</Text>
                        </View>

                        <View style={styles.paymentSelection}>
                            <Text style={styles.sectionTitle}>SELECT PAYMENT METHOD</Text>
                            <TouchableOpacity
                                style={[styles.paymentOption, paymentMethod === 'WALLET' && styles.paymentOptionSelected]}
                                onPress={() => setPaymentMethod('WALLET')}
                            >
                                <View style={styles.paymentOptionLeft}>
                                    <FontAwesomeIcon icon={faMoneyBill} size={20} color={paymentMethod === 'WALLET' ? "#10B981" : "#6B7280"} />
                                    <Text style={[styles.paymentOptionText, paymentMethod === 'WALLET' && styles.paymentOptionTextSelected]}>Sanchari Wallet</Text>
                                </View>
                                <FontAwesomeIcon icon={paymentMethod === 'WALLET' ? faCircleCheck : faCircle} size={20} color={paymentMethod === 'WALLET' ? "#10B981" : "#D1D5DB"} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.paymentOption, paymentMethod === 'GATEWAY' && styles.paymentOptionSelected]}
                                onPress={() => setPaymentMethod('GATEWAY')}
                            >
                                <View style={styles.paymentOptionLeft}>
                                    <FontAwesomeIcon icon={faCreditCard} size={20} color={paymentMethod === 'GATEWAY' ? "#10B981" : "#6B7280"} />
                                    <Text style={[styles.paymentOptionText, paymentMethod === 'GATEWAY' && styles.paymentOptionTextSelected]}>Online (Cashfree / UPI / Cards)</Text>
                                </View>
                                <FontAwesomeIcon icon={paymentMethod === 'GATEWAY' ? faCircleCheck : faCircle} size={20} color={paymentMethod === 'GATEWAY' ? "#10B981" : "#D1D5DB"} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.payButton, submitting && { opacity: 0.7 }]}
                            onPress={handlePayment}
                            disabled={submitting}
                        >
                            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.payButtonText}>{getPayButtonText()}</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {step === 'RATING' && (
                <View style={styles.fullWidth}>
                    <View style={styles.content}>
                        <View style={styles.successIconContainer}>
                            <FontAwesomeIcon icon={faCheck} size={32} color="#10B981" />
                        </View>
                        <Text style={styles.title}>Payment Successful!</Text>
                        <Text style={styles.subtitle}>How was your ride with {driverName}?</Text>

                        <View style={styles.ratingSection}>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                        <FontAwesomeIcon
                                            icon={faStar}
                                            size={48}
                                            color={star <= rating ? "#FBBF24" : "#E5E7EB"}
                                            style={styles.starIcon}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Add a comment (optional)..."
                                placeholderTextColor="#9CA3AF"
                                value={comment}
                                onChangeText={setComment}
                                multiline
                            />
                        </View>
                    </View>
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.payButton, submitting && { opacity: 0.7 }]}
                            onPress={handleRateAndFinish}
                            disabled={submitting}
                        >
                            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.payButtonText}>Submit Rating & Finish</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('PassengerHome' as never)} style={styles.skipButton}>
                            <Text style={styles.skipText}>Skip & Go Home</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {step === 'SUCCESS' && (
                <View style={[styles.content, { justifyContent: 'center' }]}>
                    <View style={styles.successIconContainer}>
                        <FontAwesomeIcon icon={faCheck} size={40} color="#10B981" />
                    </View>
                    <Text style={styles.title}>All Set!</Text>
                    <Text style={styles.subtitle}>Thank you for riding with Hybrid Ride.</Text>
                    <ActivityIndicator color="#10B981" style={{ marginTop: 20 }} />
                </View>
            )}

            {/* Custom Payment Failed Popup Modal */}
            <PaymentFailedModal
                visible={failedModalVisible}
                title={failedModalInfo.title}
                message={failedModalInfo.message}
                amount={failedModalInfo.amount}
                orderId={failedModalInfo.orderId}
                onClose={() => setFailedModalVisible(false)}
                onRetry={() => {
                    setFailedModalVisible(false);
                    handlePayment();
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    fullWidth: {
        width: '100%',
        flex: 1,
    },
    successIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ECFDF5', // Light green bg
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
    },
    paymentCard: {
        width: '100%',
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    amountLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 1,
        marginBottom: 10,
    },
    amountValue: {
        fontSize: 48,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 20,
    },
    separator: {
        width: '100%',
        height: 1,
        backgroundColor: '#E5E7EB',
        marginBottom: 20,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
    },
    pendingBadge: {
        backgroundColor: '#FFF7ED', // Light Orange
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    pendingText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#C2410C', // Dark Orange
    },
    paymentSelection: {
        width: '100%',
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 1,
        marginBottom: 12,
        alignSelf: 'center',
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 10,
        backgroundColor: '#FFFFFF',
    },
    paymentOptionSelected: {
        borderColor: '#10B981',
        backgroundColor: '#ECFDF5',
    },
    paymentOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentOptionText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4B5563',
        marginLeft: 12,
    },
    paymentOptionTextSelected: {
        color: '#10B981',
    },
    ratingSection: {
        alignItems: 'center',
    },
    ratingTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF', // Blue-ish gray similar to image
        letterSpacing: 1,
        marginBottom: 20,
    },
    starsRow: {
        flexDirection: 'row',
    },
    starIcon: {
        marginHorizontal: 8,
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
    },
    payButton: {
        backgroundColor: '#111827', // Dark navy
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    payButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    securityText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 0.5,
    },
    commentInput: {
        width: width - 40,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
        fontSize: 14,
        color: '#111827',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    skipButton: {
        marginTop: 10,
        alignItems: 'center',
        paddingVertical: 10,
    },
    skipText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default RideCompletedScreen;

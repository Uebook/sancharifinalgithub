import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faPlus,
    faArrowRight,
    faBolt,
    faWallet,
    faHeart,
    faUniversity,
    faIdCard,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
import BottomNavBar from '../Navigation/BottomNavBar';
import DriverBottomNavBar from '../Navigation/DriverBottomNavBar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../Context/AuthContext';
import {
    createCashfreeOrder,
    verifyCashfreePayment,
} from '../../Services/paymentService';
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import {
    CFDropCheckoutPayment,
    CFEnvironment,
    CFSession,
} from 'cashfree-pg-api-contract';
import { getMyWalletData, requestWithdrawal } from '../../Services/walletService';
import { CONFIG } from '../../Constants/Config';
import PaymentFailedModal from '../Common/PaymentFailedModal';

const WalletScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { user, refetchUser } = useAuth();
    const isDriver = route.params?.mode === 'driver' || user?.role === 'driver';

    const [balance, setBalance] = React.useState('0.00');
    const [transactions, setTransactions] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [hasPending, setHasPending] = React.useState(false);
    const [amountToAdd, setAmountToAdd] = React.useState('500');

    // Payment Failed Custom Modal State
    const [failedModalVisible, setFailedModalVisible] = React.useState(false);
    const [failedModalInfo, setFailedModalInfo] = React.useState<{
        title?: string;
        message?: string;
        amount?: number;
        orderId?: string;
    }>({});

    // Payment Verifying / Updating Balance Loader State
    const [isVerifying, setIsVerifying] = React.useState(false);
    const [verifyingText, setVerifyingText] = React.useState('Verifying payment & updating wallet...');

    const showPaymentFailure = (msg: string, amt?: number, oId?: string, title?: string) => {
        setFailedModalInfo({
            title: title || 'Payment Failed',
            message: msg || 'Your transaction could not be processed. Please try again.',
            amount: amt,
            orderId: oId,
        });
        setFailedModalVisible(true);
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchWalletData(), refetchUser()]);
        setRefreshing(false);
    }, []);

    const formatActivityDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const fetchWalletData = async () => {
        try {
            setIsLoading(true);
            const res = await getMyWalletData();
            if (res.success) {
                setBalance(parseFloat(res.balance || 0).toFixed(2));
                setTransactions(res.transactions || []);
                setHasPending(res.hasPending || false);
            }
        } catch (error) {
            console.error('Failed to fetch wallet data', error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchWalletData();
    }, [isDriver]);

    const handleAddMoney = async (amount: number = 500) => {
        if (!amount || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount to add.');
            return;
        }

        try {
            // 1. Create Cashfree Order on Backend
            const cfOrderRes = await createCashfreeOrder(amount);
            console.log('[Wallet] Cashfree order response:', cfOrderRes);

            if (!cfOrderRes.success || !cfOrderRes.orderId || !cfOrderRes.paymentSessionId) {
                showPaymentFailure(cfOrderRes.message || 'Failed to initialize Cashfree payment order.', amount);
                return;
            }

            // 2. Navigate to WebView-based payment screen (bypasses INSTALLER_PACKAGE_NOT_APPROVED)
            (navigation as any).navigate('CashfreeWebPayment', {
                paymentSessionId: cfOrderRes.paymentSessionId,
                orderId: cfOrderRes.orderId,
                environment: cfOrderRes.environment || 'SANDBOX',
                onSuccess: async (orderID: string) => {
                    console.log('[Wallet] Payment success, verifying orderId:', orderID);
                    setIsVerifying(true);
                    setVerifyingText('Verifying payment with gateway...');
                    try {
                        const verifyRes = await verifyCashfreePayment(orderID, amount);
                        if (verifyRes.success) {
                            setVerifyingText('Updating wallet balance...');
                            await Promise.all([
                                fetchWalletData(),
                                refetchUser(),
                            ]);
                            setIsVerifying(false);
                            Alert.alert('Success', `₹${amount} added to wallet successfully!`);
                        } else {
                            setIsVerifying(false);
                            showPaymentFailure(verifyRes.message || 'Payment could not be verified by the bank.', amount, orderID, 'Verification Incomplete');
                        }
                    } catch (vErr: any) {
                        console.error('[Wallet] Verify error:', vErr);
                        setIsVerifying(false);
                        showPaymentFailure(vErr.message || 'Could not verify payment with payment gateway.', amount, orderID, 'Verification Error');
                    }
                },
                onError: (message: string) => {
                    setIsVerifying(false);
                    if (message !== 'cancelled') {
                        showPaymentFailure(message, amount, cfOrderRes.orderId);
                    }
                },
            });

        } catch (e: any) {
            console.log('===== CASHFREE WALLET CATCH ERROR =====');
            console.log('Error:', e);
            console.log('Error JSON:', JSON.stringify(e, null, 2));
            console.log('Error message:', e?.message);
            console.log('Response data:', e?.response?.data);
            console.log('=======================================');
            showPaymentFailure(e.response?.data?.message || e.message || 'Payment could not be completed.', amount);
        }
    };

    const handleRequestWithdrawal = async () => {
        const netAmount = parseFloat(balance) * 0.98;
        if (netAmount < 100) {
            Alert.alert('Minimum Balance', 'You need at least ₹100 net balance to withdraw.');
            return;
        }

        const isBankComplete = user?.driverDetails?.bankDetails?.accountNumber && user?.driverDetails?.bankDetails?.ifscCode && user?.driverDetails?.bankDetails?.bankName && user?.driverDetails?.bankDetails?.accountHolderName;
        
        if (!isBankComplete) {
            Alert.alert('Bank Details Missing', 'Please provide your bank account details before withdrawing.', [
                { text: 'Add Details', onPress: () => navigation.navigate('DriverBankDetails' as never) },
                { text: 'Cancel', style: 'cancel' }
            ]);
            return;
        }

        const maskedAcc = user?.driverDetails?.bankDetails?.accountNumber 
            ? `****${user.driverDetails.bankDetails.accountNumber.slice(-4)}`
            : '';

        Alert.alert(
            'Confirm Withdrawal',
            `Withdraw ₹${netAmount.toFixed(2)} to your linked account (${user?.driverDetails?.bankDetails?.bankName} ${maskedAcc})? (2% platform fee already deducted)`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Confirm', 
                    onPress: async () => {
                        const res = await requestWithdrawal(netAmount, 'bank');
                        if (res.success) {
                            Alert.alert('Request Submitted', 'Your withdrawal request has been sent for admin approval.');
                            fetchWalletData();
                        } else {
                            Alert.alert('Error', res.message || 'Failed to request withdrawal');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.header, { paddingHorizontal: 20 }]}>
                    <Text style={styles.headerTitle}>Wallet</Text>
                    <Text style={styles.headerSubtitle}>{isDriver ? 'Your Earnings & Payouts' : 'Manage your Sanchari Cash'}</Text>
                </View>

                <ScrollView 
                    contentContainerStyle={styles.scrollContent} 
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
                    }
                >

                    {/* Balance Cards for Driver */}
                    {isDriver ? (
                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                            <View style={[styles.miniCard, { backgroundColor: '#1F2937' }]}>
                                <Text style={styles.miniCardLabel}>TOTAL RECEIVED</Text>
                                <Text style={styles.miniCardAmount}>₹{(user?.driverDetails?.earnings || 0).toFixed(2)}</Text>
                                <Text style={styles.miniCardSub}>Full Payment (Gross)</Text>
                            </View>
                            <View style={[styles.miniCard, { backgroundColor: '#059669' }]}>
                                <Text style={styles.miniCardLabel}>WITHDRAWABLE</Text>
                                <Text style={styles.miniCardAmount}>₹{(parseFloat(balance) * 0.98).toFixed(2)}</Text>
                                <Text style={[styles.miniCardSub, { color: '#D1FAE5', marginBottom: 8 }]}>After 2% Platform Fee</Text>
                                <TouchableOpacity 
                                    style={[styles.withdrawBtn, (hasPending || parseFloat(balance) < 100) && { opacity: 0.6 }]} 
                                    onPress={handleRequestWithdrawal}
                                    disabled={hasPending}
                                >
                                    <Text style={styles.withdrawBtnText}>
                                        {hasPending ? 'PENDING...' : 'Request Withdrawal'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        /* Standard Balance Card for Passenger */
                        <View style={styles.balanceCard}>
                            <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
                            <Text style={styles.balanceAmount}>₹{balance}</Text>
                            
                            <View style={styles.topupInputContainer}>
                                <View style={styles.topupInner}>
                                    <Text style={styles.currencyPrefix}>₹</Text>
                                    <TextInput
                                        style={styles.topupInput}
                                        value={amountToAdd}
                                        onChangeText={setAmountToAdd}
                                        keyboardType="numeric"
                                        placeholder="500"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                                <TouchableOpacity 
                                    style={styles.addMoneyButton} 
                                    onPress={() => handleAddMoney(Number(amountToAdd) || 0)}
                                >
                                    <FontAwesomeIcon icon={faPlus} size={12} color="#111827" style={{ marginRight: 8 }} />
                                    <Text style={styles.addMoneyText}>Add Cash</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Quick Top-up for Passengers */}
                    {!isDriver && (
                        <View style={{ marginBottom: 24 }}>
                            <Text style={styles.sectionHeaderSmall}>QUICK TOP-UP</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                {[100, 200, 1000].map(amt => (
                                    <TouchableOpacity 
                                        key={amt} 
                                        style={[
                                            styles.quickAmtBtn,
                                            amountToAdd === amt.toString() && styles.quickAmtBtnActive
                                        ]}
                                        onPress={() => setAmountToAdd(amt.toString())}
                                    >
                                        <Text style={[
                                            styles.quickAmtText,
                                            amountToAdd === amt.toString() && styles.quickAmtTextActive
                                        ]}>₹{amt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Offers Section */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionHeader}>{isDriver ? 'Earner Benefits' : 'Wallet Offers'}</Text>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.offersScroll}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
                    >
                        <View style={styles.offerCard}>
                            <View style={styles.offerIconContainer}>
                                <FontAwesomeIcon icon={faBolt} size={20} color="#92400E" />
                            </View>
                            <Text style={styles.offerType}>{isDriver ? 'INSTANT' : 'PROMO'}</Text>
                            <Text style={styles.offerTitle}>{isDriver ? 'Instant Payouts' : 'Top-up Bonus'}</Text>
                            <Text style={styles.offerDesc}>{isDriver ? 'Withdraw your earnings anytime with a small 2% flat fee.' : 'Add ₹1000 or more and get ₹50 extra Sanchari Cash.'}</Text>
                        </View>

                        <View style={styles.offerCard}>
                            <View style={[styles.offerIconContainer, { backgroundColor: '#ECFDF5' }]}>
                                <FontAwesomeIcon icon={faHeart} size={20} color="#059669" />
                            </View>
                            <Text style={styles.offerType}>REWARDS</Text>
                            <Text style={styles.offerTitle}>Loyalty Points</Text>
                            <Text style={styles.offerDesc}>Every transaction earns you points redeemable for future rides.</Text>
                        </View>
                    </ScrollView>

                    {/* Recent Transactions */}
                    <Text style={[styles.sectionHeader, { marginBottom: 16 }]}>Recent Transactions</Text>
                    
                    {isLoading ? (
                        <Text style={{ textAlign: 'center', color: '#6B7280' }}>Loading transactions...</Text>
                    ) : transactions.length === 0 ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <FontAwesomeIcon icon={faWallet} size={40} color="#E5E7EB" />
                            <Text style={{ color: '#9CA3AF', marginTop: 12 }}>No transactions yet</Text>
                        </View>
                    ) : (
                        transactions.map((tx: any, index: number) => (
                            <View key={tx._id || index} style={styles.activityRow}>
                                <View style={[styles.activityIconBox, { backgroundColor: tx.type === 'credit' ? '#ECFDF5' : '#FEF2F2' }]}>
                                    <FontAwesomeIcon 
                                        icon={tx.type === 'credit' ? faPlus : faArrowRight} 
                                        size={14} 
                                        color={tx.type === 'credit' ? '#059669' : '#DC2626'} 
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.activityTitle}>{tx.description || (tx.type === 'credit' ? 'Wallet Top-up' : 'Withdrawal')}</Text>
                                    <Text style={styles.activityDate}>{formatActivityDate(tx.timestamp)}</Text>
                                </View>
                                <Text style={tx.type === 'credit' ? styles.activityAmountPositive : styles.activityAmountNegative}>
                                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                                </Text>
                            </View>
                        ))
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>

                {isDriver ? <DriverBottomNavBar activeTab="PAYMENTS" /> : <BottomNavBar activeTab="PAYMENTS" />}
            </SafeAreaView>

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
                    if (failedModalInfo.amount) {
                        handleAddMoney(failedModalInfo.amount);
                    }
                }}
            />

            {/* Full-Screen Verifying / Updating Balance Loader Overlay */}
            {isVerifying && (
                <View style={styles.verifyingOverlay}>
                    <View style={styles.verifyingCard}>
                        <ActivityIndicator size="large" color="#10B981" />
                        <Text style={styles.verifyingTitle}>Processing Payment</Text>
                        <Text style={styles.verifyingSubtitle}>{verifyingText}</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#080C14',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 90,
    },
    header: {
        marginBottom: 10,
        backgroundColor: '#080C14',
        paddingTop: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#94A3B8',
    },
    balanceCard: {
        backgroundColor: '#0F172A',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#1E293B',
        elevation: 8,
    },
    balanceLabel: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    balanceAmount: {
        color: '#FFFFFF',
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 20,
    },
    addMoneyButton: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        paddingHorizontal: 20,
    },
    addMoneyText: {
        color: '#111827',
        fontWeight: '800',
        fontSize: 14,
    },
    topupInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    topupInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: '#334155',
    },
    currencyPrefix: {
        color: '#9CA3AF',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 4,
    },
    topupInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        padding: 0,
    },
    quickAmtBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1E293B',
        alignItems: 'center',
        backgroundColor: '#0F172A',
    },
    quickAmtBtnActive: {
        borderColor: '#10B981',
        backgroundColor: '#064E3B',
    },
    quickAmtText: {
        fontWeight: '700',
        color: '#94A3B8',
    },
    quickAmtTextActive: {
        color: '#10B981',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    offersScroll: {
        marginBottom: 32,
    },
    offerCard: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 16,
        width: 260,
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    offerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    offerType: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    offerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    offerDesc: {
        fontSize: 12,
        color: '#94A3B8',
        lineHeight: 16,
    },
    sectionHeaderSmall: {
        fontSize: 11,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 0.5,
    },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    activityIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    activityDate: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    activityAmountNegative: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    activityAmountPositive: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10B981',
    },
    miniCard: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        justifyContent: 'space-between',
        height: 140,
        elevation: 4,
    },
    miniCardLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#E5E7EB',
        letterSpacing: 0.5,
    },
    miniCardAmount: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    miniCardSub: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    withdrawBtn: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
    },
    withdrawBtnText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: '800',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#0F172A',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    modalSub: {
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#E2E8F0',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1E293B',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        backgroundColor: '#1E293B',
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    saveBtn: {
        backgroundColor: '#10B981',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    cancelBtn: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    cancelBtnText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '700',
    },
    verifyingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        elevation: 20,
    },
    verifyingCard: {
        backgroundColor: '#0F172A',
        borderRadius: 20,
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1E293B',
        width: '80%',
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 25,
    },
    verifyingTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 16,
        marginBottom: 6,
    },
    verifyingSubtitle: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default WalletScreen;

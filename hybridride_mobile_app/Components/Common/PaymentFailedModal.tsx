import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    Modal,
    TouchableOpacity,
    Platform,
    Dimensions,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faCircleExclamation,
    faRotateRight,
    faXmark,
    faReceipt,
    faShieldHeart,
} from '@fortawesome/free-solid-svg-icons';

const { width } = Dimensions.get('window');

export interface PaymentFailedModalProps {
    visible: boolean;
    title?: string;
    message?: string;
    amount?: number | string;
    orderId?: string;
    onClose: () => void;
    onRetry?: () => void;
    retryText?: string;
}

const PaymentFailedModal: React.FC<PaymentFailedModalProps> = ({
    visible,
    title = 'Payment Failed',
    message = 'Your transaction could not be processed. If any money was deducted, it will be automatically refunded to your bank account within 24-48 hours.',
    amount,
    orderId,
    onClose,
    onRetry,
    retryText = 'Try Again',
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Top Close Button */}
                    <TouchableOpacity
                        style={styles.closeIconButton}
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <FontAwesomeIcon icon={faXmark} size={18} color="#64748B" />
                    </TouchableOpacity>

                    {/* Animated Icon Circle */}
                    <View style={styles.iconOuterCircle}>
                        <View style={styles.iconInnerCircle}>
                            <FontAwesomeIcon icon={faCircleExclamation} size={36} color="#EF4444" />
                        </View>
                    </View>

                    {/* Header Texts */}
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    {/* Details Box (if amount or orderId present) */}
                    {(amount !== undefined || orderId) && (
                        <View style={styles.detailsCard}>
                            {amount !== undefined && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Amount Attempted</Text>
                                    <Text style={styles.detailValueAmount}>
                                        ₹{typeof amount === 'number' ? amount.toFixed(2) : amount}
                                    </Text>
                                </View>
                            )}
                            {orderId && (
                                <View style={[styles.detailRow, { marginTop: 6 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <FontAwesomeIcon icon={faReceipt} size={12} color="#94A3B8" style={{ marginRight: 6 }} />
                                        <Text style={styles.detailLabel}>Reference ID</Text>
                                    </View>
                                    <Text style={styles.detailValueRef} numberOfLines={1} ellipsizeMode="middle">
                                        {orderId}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Security / Safe Guarantee Note */}
                    <View style={styles.safeGuaranteeBox}>
                        <FontAwesomeIcon icon={faShieldHeart} size={14} color="#059669" style={{ marginRight: 8 }} />
                        <Text style={styles.safeGuaranteeText}>
                            100% Safe: No extra or duplicate charges apply.
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionsContainer}>
                        {onRetry && (
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={onRetry}
                                activeOpacity={0.85}
                            >
                                <FontAwesomeIcon icon={faRotateRight} size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                                <Text style={styles.retryButtonText}>{retryText}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.cancelButtonText}>Cancel & Go Back</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    container: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 12,
        position: 'relative',
    },
    closeIconButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    iconOuterCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },
    iconInnerCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 2,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 18,
        paddingHorizontal: 4,
    },
    detailsCard: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    detailValueAmount: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    detailValueRef: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        maxWidth: 160,
    },
    safeGuaranteeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 22,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    safeGuaranteeText: {
        fontSize: 11,
        color: '#065F46',
        fontWeight: '600',
    },
    actionsContainer: {
        width: '100%',
        gap: 10,
    },
    retryButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#EF4444',
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    cancelButton: {
        width: '100%',
        height: 46,
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#475569',
        fontSize: 14,
        fontWeight: '700',
    },
});

export default PaymentFailedModal;

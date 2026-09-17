import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CancellationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

const REASONS = [
    "Driver is too far away",
    "Driver is not moving",
    "Driver requested to cancel",
    "Changed my mind",
    "Found another ride",
    "Other"
];

const CancellationModal: React.FC<CancellationModalProps> = ({ visible, onClose, onConfirm }) => {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [otherReason, setOtherReason] = useState('');

    const handleConfirm = () => {
        const finalReason = selectedReason === 'Other' ? otherReason : (selectedReason || '');
        if (!finalReason.trim()) return;
        onConfirm(finalReason);
        // Reset state for next time
        setSelectedReason(null);
        setOtherReason('');
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Cancel Ride</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <FontAwesomeIcon icon={faTimes} size={20} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <Text style={styles.subtitle}>Please select a reason for cancelling</Text>
                        
                        {REASONS.map((reason, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.reasonOption,
                                    selectedReason === reason && styles.selectedReasonOption
                                ]}
                                onPress={() => setSelectedReason(reason)}
                            >
                                <Text style={[
                                    styles.reasonText,
                                    selectedReason === reason && styles.selectedReasonText
                                ]}>
                                    {reason}
                                </Text>
                                {selectedReason === reason && (
                                    <FontAwesomeIcon icon={faChevronRight} size={14} color="#10B981" />
                                )}
                            </TouchableOpacity>
                        ))}

                        {selectedReason === 'Other' && (
                            <TextInput
                                style={styles.otherInput}
                                placeholder="Tell us more..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={3}
                                value={otherReason}
                                onChangeText={setOtherReason}
                                autoFocus
                            />
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.confirmButton, !selectedReason && styles.disabledButton]}
                            onPress={handleConfirm}
                            disabled={!selectedReason}
                        >
                            <Text style={styles.confirmButtonText}>Confirm Cancellation</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    closeButton: {
        padding: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
        paddingHorizontal: 24,
        marginTop: 10,
    },
    content: {
        paddingHorizontal: 24,
    },
    reasonOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    selectedReasonOption: {
        borderBottomColor: '#10B981',
    },
    reasonText: {
        fontSize: 16,
        color: '#374151',
    },
    selectedReasonText: {
        color: '#10B981',
        fontWeight: '600',
    },
    otherInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#111827',
        marginTop: 12,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    footer: {
        padding: 24,
    },
    confirmButton: {
        backgroundColor: '#EF4444', // Red for cancellation
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: '#FCA5A5',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default CancellationModal;

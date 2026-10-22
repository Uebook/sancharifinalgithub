import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Modal,
    Pressable,
    ScrollView,
} from 'react-native';

interface TimePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectTime: (time: string) => void;
    selectedTime?: string; // Format: "hh:mm AM/PM"
}

const ITEM_HEIGHT = 44;

const TimePickerModal = ({ visible, onClose, onSelectTime, selectedTime }: TimePickerModalProps) => {
    const [selectedHour, setSelectedHour] = useState('12');
    const [selectedMinute, setSelectedMinute] = useState('00');
    const [selectedPeriod, setSelectedPeriod] = useState('AM');

    const hourScrollRef = useRef<ScrollView>(null);
    const minuteScrollRef = useRef<ScrollView>(null);

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    const periods = ['AM', 'PM'];

    useEffect(() => {
        if (selectedTime && selectedTime.includes(':')) {
            const [timePart, period] = selectedTime.split(' ');
            const [hour, minute] = (timePart || '').split(':');
            if (hour) setSelectedHour(hour.padStart(2, '0'));
            if (minute) setSelectedMinute(minute.padStart(2, '0'));
            if (period) setSelectedPeriod(period.toUpperCase());
        }
    }, [selectedTime, visible]);

    // Auto-scroll to selected hour and minute when modal opens
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                const hourIndex = hours.indexOf(selectedHour);
                if (hourIndex > 0 && hourScrollRef.current) {
                    hourScrollRef.current.scrollTo({
                        y: Math.max(0, (hourIndex - 1) * ITEM_HEIGHT),
                        animated: true,
                    });
                }
                const minuteIndex = minutes.indexOf(selectedMinute);
                if (minuteIndex > 0 && minuteScrollRef.current) {
                    minuteScrollRef.current.scrollTo({
                        y: Math.max(0, (minuteIndex - 1) * ITEM_HEIGHT),
                        animated: true,
                    });
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    const handleConfirm = () => {
        onSelectTime(`${selectedHour}:${selectedMinute} ${selectedPeriod}`);
        onClose();
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                    <Text style={styles.headerTitle}>Select Time</Text>

                    {/* Live Preview Display */}
                    <View style={styles.timePreviewCard}>
                        <Text style={styles.timePreviewText}>
                            {selectedHour}:{selectedMinute}{' '}
                            <Text style={styles.timePreviewPeriod}>{selectedPeriod}</Text>
                        </Text>
                    </View>

                    <View style={styles.pickerContainer}>
                        {/* Hours Column */}
                        <View style={styles.columnContainer}>
                            <Text style={styles.columnLabel}>HOUR</Text>
                            <ScrollView
                                ref={hourScrollRef}
                                style={styles.scrollColumn}
                                contentContainerStyle={styles.scrollContent}
                                showsVerticalScrollIndicator={false}
                            >
                                {hours.map((hour) => {
                                    const isSelected = selectedHour === hour;
                                    return (
                                        <TouchableOpacity
                                            key={hour}
                                            style={[styles.item, isSelected && styles.selectedItem]}
                                            onPress={() => setSelectedHour(hour)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.itemText,
                                                    isSelected && styles.selectedItemText,
                                                ]}
                                            >
                                                {hour}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* Separator */}
                        <View style={styles.separatorContainer}>
                            <Text style={styles.separator}>:</Text>
                        </View>

                        {/* Minutes Column */}
                        <View style={styles.columnContainer}>
                            <Text style={styles.columnLabel}>MINUTE</Text>
                            <ScrollView
                                ref={minuteScrollRef}
                                style={styles.scrollColumn}
                                contentContainerStyle={styles.scrollContent}
                                showsVerticalScrollIndicator={false}
                            >
                                {minutes.map((minute) => {
                                    const isSelected = selectedMinute === minute;
                                    return (
                                        <TouchableOpacity
                                            key={minute}
                                            style={[styles.item, isSelected && styles.selectedItem]}
                                            onPress={() => setSelectedMinute(minute)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.itemText,
                                                    isSelected && styles.selectedItemText,
                                                ]}
                                            >
                                                {minute}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* Period Column */}
                        <View style={[styles.columnContainer, { flex: 0.85 }]}>
                            <Text style={styles.columnLabel}>AM/PM</Text>
                            <View style={styles.periodContainer}>
                                {periods.map((period) => {
                                    const isSelected = selectedPeriod === period;
                                    return (
                                        <TouchableOpacity
                                            key={period}
                                            style={[styles.periodItem, isSelected && styles.selectedPeriodItem]}
                                            onPress={() => setSelectedPeriod(period)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.periodText,
                                                    isSelected && styles.selectedPeriodText,
                                                ]}
                                            >
                                                {period}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={onClose} style={styles.cancelButton} activeOpacity={0.7}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton} activeOpacity={0.85}>
                            <Text style={styles.confirmText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 22,
        width: '88%',
        maxWidth: 380,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    timePreviewCard: {
        backgroundColor: '#F0FDFA',
        borderWidth: 1,
        borderColor: '#CCFBF1',
        borderRadius: 14,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    timePreviewText: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0D9488',
        letterSpacing: 1,
    },
    timePreviewPeriod: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F766E',
    },
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 210,
    },
    columnContainer: {
        flex: 1,
        alignItems: 'center',
        height: '100%',
    },
    columnLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        marginBottom: 8,
        letterSpacing: 0.8,
    },
    scrollColumn: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
    },
    scrollContent: {
        alignItems: 'center',
        paddingVertical: 6,
    },
    item: {
        width: 52,
        height: ITEM_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        marginVertical: 2,
    },
    selectedItem: {
        backgroundColor: '#0D9488',
        shadowColor: '#0D9488',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    itemText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
    },
    selectedItemText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 20,
    },
    separatorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        paddingTop: 18,
    },
    separator: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
    },
    periodContainer: {
        width: '100%',
        paddingTop: 24,
        alignItems: 'center',
    },
    periodItem: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedPeriodItem: {
        backgroundColor: '#0D9488',
        shadowColor: '#0D9488',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    periodText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#475569',
    },
    selectedPeriodText: {
        color: '#FFFFFF',
        fontWeight: '900',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 18,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 14,
        gap: 12,
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    confirmButton: {
        backgroundColor: '#0D9488',
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 10,
        shadowColor: '#0D9488',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    },
    confirmText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});

export default TimePickerModal;

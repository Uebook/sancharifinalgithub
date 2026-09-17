
import React, { useState, useEffect } from 'react';
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

const TimePickerModal = ({ visible, onClose, onSelectTime, selectedTime }: TimePickerModalProps) => {
    const [selectedHour, setSelectedHour] = useState('12');
    const [selectedMinute, setSelectedMinute] = useState('00');
    const [selectedPeriod, setSelectedPeriod] = useState('AM');

    useEffect(() => {
        if (selectedTime && selectedTime.includes(':')) {
            const [timePart, period] = selectedTime.split(' ');
            const [hour, minute] = timePart.split(':');
            if (hour) setSelectedHour(hour);
            if (minute) setSelectedMinute(minute);
            if (period) setSelectedPeriod(period);
        }
    }, [selectedTime, visible]);

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    const periods = ['AM', 'PM'];

    const handleConfirm = () => {
        onSelectTime(`${selectedHour}:${selectedMinute} ${selectedPeriod}`);
        onClose();
    };

    return (
        <Modal transparent visible={visible} animationType="fade">
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                    <Text style={styles.headerTitle}>Select Time</Text>

                    <View style={styles.pickerContainer}>
                        {/* Hours Column */}
                        <View style={styles.columnContainer}>
                            <Text style={styles.columnLabel}>Hour</Text>
                            <ScrollView style={styles.scrollColumn} showsVerticalScrollIndicator={false}>
                                {hours.map((hour) => (
                                    <TouchableOpacity
                                        key={hour}
                                        style={[styles.item, selectedHour === hour && styles.selectedItem]}
                                        onPress={() => setSelectedHour(hour)}
                                    >
                                        <Text style={[styles.itemText, selectedHour === hour && styles.selectedItemText]}>
                                            {hour}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Separator */}
                        <Text style={styles.separator}>:</Text>

                        {/* Minutes Column */}
                        <View style={styles.columnContainer}>
                            <Text style={styles.columnLabel}>Minute</Text>
                            <ScrollView style={styles.scrollColumn} showsVerticalScrollIndicator={false}>
                                {minutes.map((minute) => (
                                    <TouchableOpacity
                                        key={minute}
                                        style={[styles.item, selectedMinute === minute && styles.selectedItem]}
                                        onPress={() => setSelectedMinute(minute)}
                                    >
                                        <Text style={[styles.itemText, selectedMinute === minute && styles.selectedItemText]}>
                                            {minute}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Period Column */}
                        <View style={[styles.columnContainer, { flex: 0.6 }]}>
                            <Text style={styles.columnLabel}>AM/PM</Text>
                            <View style={styles.periodContainer}>
                                {periods.map((period) => (
                                    <TouchableOpacity
                                        key={period}
                                        style={[styles.periodItem, selectedPeriod === period && styles.selectedPeriodItem]}
                                        onPress={() => setSelectedPeriod(period)}
                                    >
                                        <Text style={[styles.periodText, selectedPeriod === period && styles.selectedPeriodText]}>
                                            {period}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={onClose} style={styles.button}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirm} style={styles.button}>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '85%',
        maxHeight: '60%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 20,
    },
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        height: 200,
    },
    columnContainer: {
        flex: 1,
        alignItems: 'center',
        height: '100%',
    },
    columnLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    scrollColumn: {
        width: '100%',
    },
    item: {
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    selectedItem: {
        backgroundColor: '#E0F2F1',
    },
    itemText: {
        fontSize: 16,
        color: '#374151',
    },
    selectedItemText: {
        color: '#0D9488',
        fontWeight: '800',
        fontSize: 18,
    },
    separator: {
        fontSize: 24,
        fontWeight: '800',
        color: '#374151',
        marginTop: 40,
        marginHorizontal: 10,
    },
    periodContainer: {
        marginTop: 30,
    },
    periodItem: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#F3F4F6',
    },
    selectedPeriodItem: {
        backgroundColor: '#2DD4BF',
    },
    periodText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    selectedPeriodText: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
    },
    button: {
        marginLeft: 24,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    confirmText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2DD4BF',
    },
});

export default TimePickerModal;

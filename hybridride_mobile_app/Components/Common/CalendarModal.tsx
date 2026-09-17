import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Modal,
    Pressable,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faChevronRight, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';

interface CalendarModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectDate: (date: string) => void;
    selectedDate: string;
    disablePastDates?: boolean;
}

const CalendarModal = ({ visible, onClose, onSelectDate, selectedDate, disablePastDates = false }: CalendarModalProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    // Auto-sync calendar view to selected date or today's date when modal becomes visible
    useEffect(() => {
        if (visible) {
            if (selectedDate && selectedDate.includes('-')) {
                const parts = selectedDate.split('-');
                const dayNum = parseInt(parts[0]);
                const monthIdx = months.findIndex(m => m.toLowerCase().startsWith(parts[1].toLowerCase()));
                const yearNum = parseInt(parts[2]);
                if (monthIdx !== -1 && !isNaN(yearNum)) {
                    setCurrentDate(new Date(yearNum, monthIdx, dayNum || 1));
                    return;
                }
            }
            setCurrentDate(new Date());
        }
    }, [visible, selectedDate]);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const changeMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };

    const handleDateSelect = (day: number) => {
        const month = months[currentDate.getMonth()];
        const year = currentDate.getFullYear();
        // Format: DD-Mon-YYYY (e.g., 04-Feb-2026)
        const formattedDate = `${day.toString().padStart(2, '0')}-${month.substring(0, 3)}-${year}`;
        onSelectDate(formattedDate);
        onClose();
    };

    const handleSelectToday = () => {
        const today = new Date();
        setCurrentDate(today);
        const day = today.getDate();
        const month = months[today.getMonth()];
        const year = today.getFullYear();
        const formattedDate = `${day.toString().padStart(2, '0')}-${month.substring(0, 3)}-${year}`;
        onSelectDate(formattedDate);
        onClose();
    };

    const renderCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];
        // Empty slots for previous month padding
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        const currentMonthShort = months[month].substring(0, 3);
        const selectedParts = selectedDate ? selectedDate.split('-') : [];
        const isSelectedMonth = selectedParts.length === 3 && selectedParts[1]?.toLowerCase() === currentMonthShort.toLowerCase() && parseInt(selectedParts[2]) === year;
        const selectedDayNum = isSelectedMonth ? parseInt(selectedParts[0]) : -1;

        const realToday = new Date();
        const isTodayMonth = realToday.getMonth() === month && realToday.getFullYear() === year;
        const realTodayDay = realToday.getDate();

        const todayStart = new Date(realToday.getFullYear(), realToday.getMonth(), realToday.getDate());

        for (let i = 1; i <= daysInMonth; i++) {
            const isSelected = i === selectedDayNum;
            const isToday = isTodayMonth && i === realTodayDay;
            const cellDate = new Date(year, month, i);
            const isPast = disablePastDates && cellDate < todayStart;

            days.push(
                <TouchableOpacity
                    key={i}
                    style={[
                        styles.dayCell,
                        isToday && !isSelected && styles.todayDayCell,
                        isSelected && styles.selectedDayCell,
                        isPast && styles.disabledDayCell
                    ]}
                    onPress={() => !isPast && handleDateSelect(i)}
                    disabled={isPast}
                    activeOpacity={0.7}
                >
                    <Text style={[
                        styles.dayText,
                        isToday && !isSelected && styles.todayDayText,
                        isSelected && styles.selectedDayText,
                        isPast && styles.disabledDayText
                    ]}>
                        {i}
                    </Text>
                    {isToday && !isSelected && (
                        <View style={styles.todayIndicatorDot} />
                    )}
                </TouchableOpacity>
            );
        }

        return days;
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <View style={styles.calendarHeader}>
                        <View style={styles.titleContainer}>
                            <FontAwesomeIcon icon={faCalendarCheck} size={18} color="#10B981" style={{ marginRight: 8 }} />
                            <Text style={styles.monthYearText}>
                                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </Text>
                        </View>
                        <View style={styles.calendarNav}>
                            <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.navArrow}>
                                <FontAwesomeIcon icon={faChevronLeft} size={14} color="#374151" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => changeMonth('next')} style={styles.navArrow}>
                                <FontAwesomeIcon icon={faChevronRight} size={14} color="#374151" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Week Days */}
                    <View style={styles.weekRow}>
                        {weekDays.map(day => (
                            <Text key={day} style={styles.weekDayText}>{day}</Text>
                        ))}
                    </View>

                    {/* Days Grid */}
                    <View style={styles.daysGrid}>
                        {renderCalendarDays()}
                    </View>

                    {/* Footer Actions */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                            <Text style={styles.footerActionText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSelectToday} style={styles.todayBtn} activeOpacity={0.8}>
                            <Text style={styles.todayBtnText}>Select Today</Text>
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
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        width: '88%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 12,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    monthYearText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    calendarNav: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navArrow: {
        padding: 8,
        marginLeft: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    weekDayText: {
        width: '14.28%',
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    dayCell: {
        width: '14.28%', // 100% / 7 days
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
        borderRadius: 14,
        position: 'relative',
    },
    dayText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    todayDayCell: {
        borderWidth: 2,
        borderColor: '#10B981', // Highlight Today with Emerald Border
        backgroundColor: '#ECFDF5', // Light Emerald Tint
    },
    todayDayText: {
        color: '#047857',
        fontWeight: '900',
    },
    todayIndicatorDot: {
        position: 'absolute',
        bottom: 4,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#10B981',
    },
    selectedDayCell: {
        backgroundColor: '#10B981', // Solid Emerald Fill for Selected Date
        borderWidth: 0,
    },
    selectedDayText: {
        color: '#FFFFFF',
        fontWeight: '900',
    },
    disabledDayCell: {
        opacity: 0.25,
    },
    disabledDayText: {
        color: '#94A3B8',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    cancelBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    footerActionText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    todayBtn: {
        backgroundColor: '#10B981',
        paddingVertical: 9,
        paddingHorizontal: 18,
        borderRadius: 10,
    },
    todayBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});

export default CalendarModal;

import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft,
    faStar,
    faPaperPlane,
    faCheckCircle,
    faMobileScreen,
    faUser,
    faEnvelope,
    faPhone,
    faTag,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../Context/AuthContext';
import apiClient from '../../Services/apiClient';

const CATEGORIES = [
    { key: 'ui_ux', label: 'UI / UX Design' },
    { key: 'app_performance', label: 'Performance & Speed' },
    { key: 'driver_experience', label: 'Ride & Booking' },
    { key: 'safety', label: 'Safety & Trust' },
    { key: 'suggestion', label: 'Feature Request' },
    { key: 'other', label: 'General Feedback' },
];

const RATING_LABELS: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent!',
};

const AppFeedbackScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();

    const [rating, setRating] = useState<number>(5);
    const [category, setCategory] = useState<string>('ui_ux');
    const [comment, setComment] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (!comment.trim()) {
            Alert.alert('Feedback Required', 'Please enter your comments or feedback before submitting.');
            return;
        }

        setIsSubmitting(true);
        try {
            const deviceInfo = {
                platform: Platform.OS,
                version: String(Platform.Version),
                model: Platform.OS === 'android' ? 'Android Device' : 'iOS Device',
            };

            const payload = {
                rating,
                category,
                comment: comment.trim(),
                deviceInfo,
            };

            const response = await apiClient.post('/feedback/submit', payload);
            if (response.data.success) {
                setIsSubmitted(true);
            } else {
                Alert.alert('Submission Error', response.data.message || 'Could not submit feedback.');
            }
        } catch (error: any) {
            console.error('Feedback submit error:', error);
            const msg = error.response?.data?.message || error.message || 'Network error submitting feedback';
            Alert.alert('Error', msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.successContainer}>
                    <View style={styles.successIconCircle}>
                        <FontAwesomeIcon icon={faCheckCircle} size={50} color="#10B981" />
                    </View>
                    <Text style={styles.successTitle}>Thank You!</Text>
                    <Text style={styles.successSub}>
                        Your feedback has been submitted successfully. Our engineering and support team reviews every response to improve your Sanchari experience.
                    </Text>
                    <TouchableOpacity
                        style={styles.doneBtn}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.doneBtnText}>Back to Support</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <FontAwesomeIcon icon={faArrowLeft} size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>App Feedback</Text>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Star Rating Box */}
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel}>HOW WOULD YOU RATE YOUR EXPERIENCE?</Text>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setRating(star)}
                                    style={styles.starBtn}
                                    activeOpacity={0.7}
                                >
                                    <FontAwesomeIcon
                                        icon={faStar}
                                        size={32}
                                        color={star <= rating ? '#F59E0B' : '#334155'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.ratingLabelText}>{RATING_LABELS[rating] || ''}</Text>
                    </View>

                    {/* Category Selection */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <FontAwesomeIcon icon={faTag} size={14} color="#10B981" style={{ marginRight: 6 }} />
                            <Text style={styles.sectionLabel}>FEEDBACK CATEGORY</Text>
                        </View>
                        <View style={styles.chipsWrap}>
                            {CATEGORIES.map((cat) => {
                                const selected = category === cat.key;
                                return (
                                    <TouchableOpacity
                                        key={cat.key}
                                        style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                                        onPress={() => setCategory(cat.key)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Comments Text Area */}
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel}>YOUR COMMENTS & SUGGESTIONS</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Tell us what you liked, report a bug, or suggest a new feature..."
                            placeholderTextColor="#64748B"
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* User & Device Details Preview */}
                    <View style={styles.infoBox}>
                        <View style={styles.infoRow}>
                            <FontAwesomeIcon icon={faUser} size={12} color="#64748B" style={{ marginRight: 8 }} />
                            <Text style={styles.infoText}>Submitting as: <Text style={{ color: '#E2E8F0', fontWeight: '700' }}>{user?.name || (user?.role === 'driver' ? 'Partner' : 'Customer')}</Text> ({user?.phone || user?.email || 'Registered User'})</Text>
                        </View>
                        <View style={[styles.infoRow, { marginTop: 4 }]}>
                            <FontAwesomeIcon icon={faMobileScreen} size={12} color="#64748B" style={{ marginRight: 8 }} />
                            <Text style={styles.infoText}>Device: {Platform.OS} {Platform.Version}</Text>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        activeOpacity={0.8}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faPaperPlane} size={16} color="#FFFFFF" style={{ marginRight: 10 }} />
                                <Text style={styles.submitBtnText}>Submit Feedback</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#1E293B',
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    starsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        marginVertical: 8,
    },
    starBtn: {
        padding: 4,
    },
    ratingLabelText: {
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '800',
        color: '#F59E0B',
        marginTop: 4,
    },
    chipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 12,
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#334155',
    },
    categoryChipSelected: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: '#10B981',
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
    },
    categoryChipTextSelected: {
        color: '#10B981',
        fontWeight: '700',
    },
    textArea: {
        backgroundColor: '#0F172A',
        borderRadius: 14,
        padding: 14,
        color: '#FFFFFF',
        fontSize: 14,
        lineHeight: 20,
        borderWidth: 1,
        borderColor: '#334155',
        minHeight: 120,
    },
    infoBox: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        fontSize: 11,
        color: '#94A3B8',
    },
    submitBtn: {
        backgroundColor: '#10B981',
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    successIconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 10,
    },
    successSub: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    doneBtn: {
        backgroundColor: '#10B981',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 32,
    },
    doneBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});

export default AppFeedbackScreen;

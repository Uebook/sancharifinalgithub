import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { rateRide } from '../../Services/rideService';

const DriverRatingScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const tags = [
        "Polite", "On Time", "Clean", "Tipped",
        "Friendly", "Masked", "Quiet", "Cooperative"
    ];

    const { bookingId, passengerName = "Passenger" } = route.params as any || {};

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleSkip = () => {
        navigation.navigate('DriverHome' as never);
    };

    const handleSubmit = async () => {
        if (rating === 0 || submitting) return;

        setSubmitting(true);
        try {
            const finalComment = selectedTags.length > 0
                ? `${selectedTags.join(', ')}. ${comment}`
                : comment;

            await rateRide(bookingId, rating, finalComment);

            Alert.alert(
                "Thank You!",
                "Thank you for your feedback.",
                [
                    { text: "OK", onPress: () => navigation.navigate('DriverHome' as never) }
                ]
            );
        } catch (error: any) {
            console.error('Rating failed:', error);
            Alert.alert("Error", error?.response?.data?.message || "Failed to submit rating. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header (Blue Background) */}
                <View style={styles.header}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{passengerName.charAt(0)}</Text>
                    </View>
                    <Text style={styles.ratingTitle}>Rate {passengerName}</Text>
                    <View style={styles.subtitleBadge}>
                        <Text style={styles.subtitleText}>Trip Completed • Today</Text>
                    </View>
                </View>

                {/* Rating Card */}
                <View style={styles.ratingCard}>
                    <Text style={styles.cardTitle}>HOW WAS THE PASSENGER?</Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <FontAwesomeIcon
                                    icon={star <= rating ? faStar : faStarRegular}
                                    size={40}
                                    color={star <= rating ? "#FBBF24" : "#D1D5DB"} // Yellow or Gray
                                    style={styles.starIcon}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Tags Section */}
                <View style={styles.tagsContainer}>
                    {tags.map((tag) => (
                        <TouchableOpacity
                            key={tag}
                            style={[
                                styles.tagButton,
                                selectedTags.includes(tag) && styles.tagButtonSelected
                            ]}
                            onPress={() => toggleTag(tag)}
                        >
                            <Text style={[
                                styles.tagText,
                                selectedTags.includes(tag) && styles.tagTextSelected
                            ]}>
                                {tag}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Comment Input */}
                <TextInput
                    style={styles.commentInput}
                    placeholder="Add a note about the passenger (optional)..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={comment}
                    onChangeText={setComment}
                />

                {/* Bottom Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                        <Text style={styles.skipButtonText}>Skip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            rating > 0 && styles.submitButtonActive,
                            submitting && { opacity: 0.7 }
                        ]}
                        onPress={handleSubmit}
                        disabled={rating === 0 || submitting}
                    >
                        {submitting
                            ? <ActivityIndicator color="#111827" />
                            : <Text style={styles.submitButtonText}>Submit</Text>
                        }
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingBottom: 40,
    },
    header: {
        width: '100%',
        backgroundColor: '#111827',
        paddingVertical: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: -60, // Overlap effect
        paddingBottom: 80,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#4B5563',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    ratingTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitleBadge: {
        backgroundColor: '#1F2937',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    subtitleText: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '600',
    },
    ratingCard: {
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    starIcon: {
        marginHorizontal: 4,
    },
    tagsContainer: {
        width: '90%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 24,
    },
    tagButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tagButtonSelected: {
        borderColor: '#10B981', // Green border
        backgroundColor: '#ECFDF5', // Light green bg
    },
    tagText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    tagTextSelected: {
        color: '#059669', // Darker green text
    },
    commentInput: {
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        height: 120,
        marginBottom: 30,
        fontSize: 16,
        color: '#111827',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    buttonRow: {
        flexDirection: 'row',
        width: '90%',
        justifyContent: 'space-between',
        gap: 16,
    },
    skipButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    skipButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
    },
    submitButton: {
        flex: 1,
        backgroundColor: '#D1D5DB', // Default disabled gray
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    submitButtonActive: {
        backgroundColor: '#10B981', // Active green
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#374151', // Dark text on gray
    },
    // We can conditionally style text too but for now simple
});

export default DriverRatingScreen;

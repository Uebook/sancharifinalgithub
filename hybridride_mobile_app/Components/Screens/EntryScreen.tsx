import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    Image,
    ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_RATIO = 1870 / 841;
const CALCULATED_IMAGE_HEIGHT = Math.max(SCREEN_HEIGHT, SCREEN_WIDTH * IMAGE_RATIO);

const EntryScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [userType, setUserType] = useState<'PASSENGER' | 'DRIVER'>('PASSENGER');

    const isDriver = userType === 'DRIVER';

    const handleContinue = () => {
        (navigation as any).navigate('UnifiedLogin', {
            userType: isDriver ? 'DRIVER' : 'PASSENGER',
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Scrollable full-poster image */}
            <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <TouchableOpacity
                    activeOpacity={0.95}
                    onPress={handleContinue}
                    style={styles.imageTouchable}
                >
                    <Image
                        source={require('../../assets/images/homel.png')}
                        style={styles.posterImage}
                        resizeMode="cover"
                    />
                </TouchableOpacity>
            </ScrollView>

            {/* Top Right Toggle Button (Floating Overlay) */}
            <SafeAreaView edges={['top']} style={styles.topOverlay} pointerEvents="box-none">
                <View style={styles.headerRow} pointerEvents="box-none">
                    <View style={{ flex: 1 }} />
                    <View style={styles.togglePillContainer}>
                        <TouchableOpacity
                            style={[
                                styles.toggleOption,
                                !isDriver && styles.toggleOptionActive,
                            ]}
                            activeOpacity={0.8}
                            onPress={() => setUserType('PASSENGER')}
                        >
                            <Text
                                style={[
                                    styles.toggleOptionText,
                                    !isDriver ? styles.toggleOptionTextActive : styles.toggleOptionTextInactive,
                                ]}
                            >
                                Customer
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.toggleOption,
                                isDriver && styles.toggleOptionActive,
                            ]}
                            activeOpacity={0.8}
                            onPress={() => setUserType('DRIVER')}
                        >
                            <Text
                                style={[
                                    styles.toggleOptionText,
                                    isDriver ? styles.toggleOptionTextActive : styles.toggleOptionTextInactive,
                                ]}
                            >
                                Partner
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            {/* Bottom Floating Action Button */}
            <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={[styles.continueButton, isDriver && styles.continueButtonDriver]}
                    activeOpacity={0.88}
                    onPress={handleContinue}
                >
                    <Text style={styles.continueButtonText}>
                        {isDriver ? 'Go to Partner Portal' : 'Start Your Journey'}
                    </Text>
                    <View style={styles.arrowCircle}>
                        <FontAwesomeIcon icon={faArrowRight} size={15} color={isDriver ? "#0F766E" : "#00897B"} />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#051937',
    },
    scrollContent: {
        flexGrow: 1,
    },
    imageTouchable: {
        width: SCREEN_WIDTH,
        height: CALCULATED_IMAGE_HEIGHT,
    },
    posterImage: {
        width: SCREEN_WIDTH,
        height: CALCULATED_IMAGE_HEIGHT,
    },
    topOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    togglePillContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000000',
        borderRadius: 26,
        padding: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    toggleOption: {
        paddingVertical: 7,
        paddingHorizontal: 16,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleOptionActive: {
        backgroundColor: '#FFFFFF',
    },
    toggleOptionText: {
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 0.2,
    },
    toggleOptionTextActive: {
        color: '#000000',
    },
    toggleOptionTextInactive: {
        color: '#FFFFFF',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 12,
        alignItems: 'center',
        zIndex: 40,
    },
    continueButton: {
        width: '100%',
        maxWidth: 380,
        height: 56,
        backgroundColor: '#00897B',
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    continueButtonDriver: {
        backgroundColor: '#0F766E',
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.3,
        marginRight: 10,
    },
    arrowCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default EntryScreen;

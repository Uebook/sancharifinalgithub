import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Animated,
    Easing,
    Dimensions,
    Image,
    StatusBar,
} from 'react-native';

const { width } = Dimensions.get('window');

const SplashScreen = () => {
    const progressAnimation = useRef(new Animated.Value(0)).current;
    const fadeAnimation = useRef(new Animated.Value(0)).current;
    const scaleAnimation = useRef(new Animated.Value(0.92)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnimation, {
                toValue: 1,
                duration: 900,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnimation, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Progress bar animation
        Animated.timing(progressAnimation, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
        }).start();
    }, []);

    const progressWidth = progressAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#060B14" translucent />

            <Animated.View
                style={[
                    styles.centerContent,
                    {
                        opacity: fadeAnimation,
                        transform: [{ scale: scaleAnimation }],
                    },
                ]}
            >
                {/* Custom Sanchari Pin Logo */}
                <View style={styles.logoWrapper}>
                    <Image
                        source={require('../../assets/images/sanchari_logo_pin.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>

                {/* Brand Name with TM */}
                <View style={styles.brandRow}>
                    <Text style={styles.brandTitle}>SANCHARI</Text>
                    <Text style={styles.trademark}>TM</Text>
                </View>

                {/* Tagline with Left and Right Accent Lines */}
                <View style={styles.taglineSection}>
                    <View style={styles.accentLine} />
                    <Text style={styles.taglineText}>MOVING TOGETHER, EVERY JOURNEY</Text>
                    <View style={styles.accentLine} />
                </View>

                {/* Sleek Golden Progress Indicator */}
                <View style={styles.progressBarWrapper}>
                    <View style={styles.progressTrack}>
                        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                    </View>
                </View>
            </Animated.View>

            {/* Ecosystem Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>SHIVAKSHINI ECOSYSTEM</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#060B14',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        width: '100%',
        paddingHorizontal: 24,
    },
    logoWrapper: {
        width: 240,
        height: 270,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginTop: 6,
        marginBottom: 14,
    },
    brandTitle: {
        fontSize: 38,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 4,
        textAlign: 'center',
    },
    trademark: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        marginLeft: 3,
        marginTop: 4,
    },
    taglineSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '88%',
        marginBottom: 32,
    },
    accentLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#1E293B',
    },
    taglineText: {
        fontSize: 10.5,
        fontWeight: '800',
        color: '#F59E0B',
        marginHorizontal: 12,
        letterSpacing: 1.8,
        textAlign: 'center',
    },
    progressBarWrapper: {
        width: 140,
        marginTop: 4,
    },
    progressTrack: {
        height: 2.5,
        backgroundColor: '#131B28',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#F59E0B',
        borderRadius: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 38,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#475569',
        letterSpacing: 4.5,
        textAlign: 'center',
    },
});

export default SplashScreen;

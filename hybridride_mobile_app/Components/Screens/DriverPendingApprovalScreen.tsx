import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    ScrollView,
    RefreshControl,
    Linking,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faHourglassHalf,
    faExclamation,
    faCheck,
    faTimes,
    faCar,
    faComments,
    faLayerGroup,
    faPlay,
    faIndianRupeeSign,
    faStar,
    faFolderOpen,
    faChevronRight,
    faShieldHalved,
    faArrowRightFromBracket,
    faClock,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../Context/AuthContext';
import { driverService } from '../../Services/driverService';

const { width } = Dimensions.get('window');

const DriverPendingApprovalScreen = () => {
    const { logout, user, refetchUser } = useAuth();
    const navigation = useNavigation();
    const route = useRoute();

    // Check status from user object or route params override (useful for demo/preview)
    const paramStatus = (route.params as any)?.status;
    const approvalStatus: 'pending' | 'rejected' | 'approved' = 
        paramStatus || user?.driverApprovalStatus || 'pending';

    const [refreshing, setRefreshing] = useState(false);
    const [selectedServiceModes, setSelectedServiceModes] = useState(false);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        if (approvalStatus === 'pending') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [approvalStatus]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await refetchUser();
        } catch (e) {
            console.error('Refresh error:', e);
        } finally {
            setRefreshing(false);
        }
    };

    const handleChatSupport = () => {
        // Open WhatsApp or support screen
        const supportUrl = 'https://wa.me/919999999999?text=Hi%20Sanchari%20Support,%20I%20need%20help%20with%20my%20driver%20onboarding%20verification.';
        Linking.openURL(supportUrl).catch(() => {
            (navigation as any).navigate('Support');
        });
    };

    const handleReuploadDoc = (docType: string = 'rc') => {
        (navigation as any).navigate('ReuploadRegistration', {
            userData: user,
            vehicleType: user?.driverDetails?.vehicle?.type || 'CAR',
            targetDoc: docType,
        });
    };

    const handleGoOnline = async () => {
        try {
            await driverService.toggleStatus(true);
            await refetchUser();
            (navigation as any).navigate('DriverHome');
        } catch (e) {
            (navigation as any).navigate('DriverHome');
        }
    };

    // Calculate dynamic submission and expected dates
    const createdAt = user?.createdAt ? new Date(user.createdAt) : new Date();
    const submittedStr = createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' +
        createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    const expectedDate = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);
    const expectedStr = expectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    // ==========================================
    // RENDER STATE A: UNDER REVIEW / IN PROGRESS
    // ==========================================
    const renderUnderReviewState = () => (
        <View style={styles.stateWrapper}>
            {/* Header with Icon */}
            <View style={styles.topHeader}>
                <Animated.View style={[styles.statusIconCircle, styles.pendingIconCircle, { transform: [{ scale: pulseAnim }] }]}>
                    <FontAwesomeIcon icon={faHourglassHalf} size={24} color="#F59E0B" />
                </Animated.View>
                <View style={styles.headerTextCol}>
                    <Text style={styles.pendingTitle}>Verification in progress</Text>
                    <Text style={styles.pendingSubtitle}>
                        Submitted {submittedStr} · <Text style={styles.expectedText}>Expected by {expectedStr}</Text>
                    </Text>
                </View>
            </View>

            {/* Stepper */}
            <View style={styles.stepperContainer}>
                {/* Step 1 */}
                <View style={styles.stepperNode}>
                    <View style={[styles.stepCircle, styles.stepCircleGreen]}>
                        <FontAwesomeIcon icon={faCheck} size={11} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.stepText, styles.stepTextGreen]}>Documents{'\n'}submitted</Text>
                </View>

                {/* Line 1 */}
                <View style={[styles.stepBar, styles.stepBarGreen]} />

                {/* Step 2 */}
                <View style={styles.stepperNode}>
                    <View style={[styles.stepCircle, styles.stepCircleYellow]}>
                        <View style={styles.stepDotInnerYellow} />
                    </View>
                    <Text style={[styles.stepText, styles.stepTextYellow]}>Verification{'\n'}in progress</Text>
                </View>

                {/* Line 2 */}
                <View style={[styles.stepBar, styles.stepBarGray]} />

                {/* Step 3 */}
                <View style={styles.stepperNode}>
                    <View style={[styles.stepCircle, styles.stepCircleGray]}>
                        <FontAwesomeIcon icon={faCar} size={11} color="#64748B" />
                    </View>
                    <Text style={[styles.stepText, styles.stepTextGray]}>Ready{'\n'}to drive</Text>
                </View>
            </View>

            {/* Document Verification Checklist Card */}
            <View style={styles.docChecklistCard}>
                {/* Aadhaar */}
                <View style={styles.docRow}>
                    <View style={styles.docLeft}>
                        <View style={styles.docIconCheck}>
                            <FontAwesomeIcon icon={faCheck} size={10} color="#10B981" />
                        </View>
                        <Text style={styles.docName}>Aadhaar</Text>
                    </View>
                    <View style={styles.badgeVerified}>
                        <Text style={styles.badgeVerifiedText}>Verified</Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Driving Licence */}
                <View style={styles.docRow}>
                    <View style={styles.docLeft}>
                        <View style={styles.docIconCheck}>
                            <FontAwesomeIcon icon={faCheck} size={10} color="#10B981" />
                        </View>
                        <Text style={styles.docName}>Driving licence</Text>
                    </View>
                    <View style={styles.badgeVerified}>
                        <Text style={styles.badgeVerifiedText}>Verified</Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Vehicle RC */}
                <View style={styles.docRow}>
                    <View style={styles.docLeft}>
                        <View style={styles.docIconReviewing}>
                            <FontAwesomeIcon icon={faClock} size={10} color="#F59E0B" />
                        </View>
                        <Text style={styles.docName}>Vehicle RC</Text>
                    </View>
                    <View style={styles.badgeReviewing}>
                        <Text style={styles.badgeReviewingText}>Reviewing</Text>
                    </View>
                </View>
            </View>

            {/* While You Wait Section */}
            <View style={styles.whileWaitHeader}>
                <Text style={styles.whileWaitTitle}>While you wait</Text>
                <Text style={styles.whileWaitProgress}>1 of 3 done</Text>
            </View>

            <View style={styles.tasksContainer}>
                {/* Task 1: Add UPI (Completed) */}
                <TouchableOpacity 
                    style={[styles.taskCard, styles.taskCardCompleted]}
                    activeOpacity={0.8}
                    onPress={() => (navigation as any).navigate('DriverBankDetails')}
                >
                    <View style={styles.taskIconCompleted}>
                        <FontAwesomeIcon icon={faCheck} size={10} color="#10B981" />
                    </View>
                    <Text style={styles.taskTextCompleted}>Add UPI for payouts</Text>
                </TouchableOpacity>

                {/* Task 2: Choose service modes */}
                <TouchableOpacity 
                    style={styles.taskCard}
                    activeOpacity={0.8}
                    onPress={() => {
                        setSelectedServiceModes(true);
                        Alert.alert("Service Modes", "Your active vehicle supports City Pool, Instant Rides & Outstation.");
                    }}
                >
                    <View style={styles.taskIconSquare}>
                        <FontAwesomeIcon icon={faLayerGroup} size={12} color="#94A3B8" />
                    </View>
                    <View style={styles.taskTextCol}>
                        <Text style={styles.taskTitle}>Choose your service modes</Text>
                        <Text style={styles.taskSubtitle}>Pool, Instant, Outstation</Text>
                    </View>
                    <FontAwesomeIcon icon={faChevronRight} size={12} color="#64748B" />
                </TouchableOpacity>

                {/* Task 3: How earnings work */}
                <TouchableOpacity 
                    style={styles.taskCard}
                    activeOpacity={0.8}
                    onPress={() => {
                        Alert.alert("Partner Earnings Guide", "1. Instant Rides: Earn 85% per trip\n2. Pool Rides: Fill up to 3 seats\n3. Daily Payouts via UPI at 11 PM");
                    }}
                >
                    <View style={styles.taskIconSquare}>
                        <FontAwesomeIcon icon={faPlay} size={11} color="#94A3B8" />
                    </View>
                    <View style={styles.taskTextCol}>
                        <Text style={styles.taskTitle}>How earnings work</Text>
                        <Text style={styles.taskSubtitle}>2 min video</Text>
                    </View>
                    <FontAwesomeIcon icon={faChevronRight} size={12} color="#64748B" />
                </TouchableOpacity>
            </View>

            {/* Bottom Actions */}
            <TouchableOpacity style={styles.greenSupportButton} onPress={handleChatSupport} activeOpacity={0.85}>
                <FontAwesomeIcon icon={faComments} size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.greenSupportButtonText}>Chat with support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signOutLink} onPress={logout}>
                <Text style={styles.signOutLinkText}>Sign out</Text>
            </TouchableOpacity>
        </View>
    );

    // ==========================================
    // RENDER STATE B: REJECTED / ACTION NEEDED
    // ==========================================
    const renderRejectedState = () => {
        const rejectionMsg = user?.rejectionReason || 
            "Photo is blurred — the registration number is not readable. Please re-upload in daylight.";

        return (
            <View style={styles.stateWrapper}>
                {/* Header with Icon */}
                <View style={styles.topHeader}>
                    <View style={[styles.statusIconCircle, styles.rejectedIconCircle]}>
                        <FontAwesomeIcon icon={faExclamation} size={22} color="#EF4444" />
                    </View>
                    <View style={styles.headerTextCol}>
                        <Text style={styles.rejectedTitle}>Action needed</Text>
                        <Text style={styles.rejectedSubtitle}>1 document needs to be re-uploaded</Text>
                    </View>
                </View>

                {/* Stepper */}
                <View style={styles.stepperContainer}>
                    {/* Step 1 */}
                    <View style={styles.stepperNode}>
                        <View style={[styles.stepCircle, styles.stepCircleGreen]}>
                            <FontAwesomeIcon icon={faCheck} size={11} color="#FFFFFF" />
                        </View>
                        <Text style={[styles.stepText, styles.stepTextGreen]}>Documents{'\n'}submitted</Text>
                    </View>

                    {/* Line 1 */}
                    <View style={[styles.stepBar, styles.stepBarRed]} />

                    {/* Step 2 */}
                    <View style={styles.stepperNode}>
                        <View style={[styles.stepCircle, styles.stepCircleRed]}>
                            <FontAwesomeIcon icon={faExclamation} size={11} color="#FFFFFF" />
                        </View>
                        <Text style={[styles.stepText, styles.stepTextRed]}>Verification{'\n'}on hold</Text>
                    </View>

                    {/* Line 2 */}
                    <View style={[styles.stepBar, styles.stepBarGray]} />

                    {/* Step 3 */}
                    <View style={styles.stepperNode}>
                        <View style={[styles.stepCircle, styles.stepCircleGray]}>
                            <FontAwesomeIcon icon={faCar} size={11} color="#64748B" />
                        </View>
                        <Text style={[styles.stepText, styles.stepTextGray]}>Ready{'\n'}to drive</Text>
                    </View>
                </View>

                {/* Verified Documents */}
                <View style={styles.docChecklistCard}>
                    {/* Aadhaar */}
                    <View style={styles.docRow}>
                        <View style={styles.docLeft}>
                            <View style={styles.docIconCheck}>
                                <FontAwesomeIcon icon={faCheck} size={10} color="#10B981" />
                            </View>
                            <Text style={styles.docName}>Aadhaar</Text>
                        </View>
                        <View style={styles.badgeVerified}>
                            <Text style={styles.badgeVerifiedText}>Verified</Text>
                        </View>
                    </View>

                    <View style={styles.cardDivider} />

                    {/* Driving Licence */}
                    <View style={styles.docRow}>
                        <View style={styles.docLeft}>
                            <View style={styles.docIconCheck}>
                                <FontAwesomeIcon icon={faCheck} size={10} color="#10B981" />
                            </View>
                            <Text style={styles.docName}>Driving licence</Text>
                        </View>
                        <View style={styles.badgeVerified}>
                            <Text style={styles.badgeVerifiedText}>Verified</Text>
                        </View>
                    </View>
                </View>

                {/* Rejected Card */}
                <View style={styles.rejectedCardBox}>
                    <View style={styles.rejectedHeaderRow}>
                        <View style={styles.docLeft}>
                            <FontAwesomeIcon icon={faTimes} size={14} color="#EF4444" style={{ marginRight: 8 }} />
                            <Text style={styles.rejectedDocTitle}>Vehicle RC</Text>
                        </View>
                        <View style={styles.badgeRejected}>
                            <Text style={styles.badgeRejectedText}>Rejected</Text>
                        </View>
                    </View>

                    <Text style={styles.reasonText}>
                        <Text style={styles.reasonLabel}>Reason: </Text>
                        {rejectionMsg}
                    </Text>

                    <TouchableOpacity 
                        style={styles.yellowReuploadButton}
                        onPress={() => handleReuploadDoc('rc')}
                        activeOpacity={0.85}
                    >
                        <FontAwesomeIcon icon={faFolderOpen} size={15} color="#0F172A" style={{ marginRight: 8 }} />
                        <Text style={styles.yellowReuploadButtonText}>Re-upload Vehicle RC</Text>
                    </TouchableOpacity>
                </View>

                {/* Outlined Chat Support Button */}
                <TouchableOpacity style={styles.outlinedSupportButton} onPress={handleChatSupport} activeOpacity={0.85}>
                    <FontAwesomeIcon icon={faComments} size={16} color="#10B981" style={{ marginRight: 8 }} />
                    <Text style={styles.outlinedSupportButtonText}>Chat with support</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.signOutLink} onPress={logout}>
                    <Text style={styles.signOutLinkText}>Sign out</Text>
                </TouchableOpacity>
            </View>
        );
    };

    // ==========================================
    // RENDER STATE C: APPROVED
    // ==========================================
    const renderApprovedState = () => (
        <View style={styles.stateWrapperApproved}>
            {/* Giant Green Checkmark Badge */}
            <View style={styles.approvedIconCircle}>
                <FontAwesomeIcon icon={faCheck} size={40} color="#FFFFFF" />
            </View>

            <Text style={styles.approvedMainTitle}>You're approved</Text>
            <Text style={styles.approvedSubtitle}>
                All documents verified.{'\n'}Your Sanchari partner account is live.
            </Text>

            {/* "Your first week" Card */}
            <View style={styles.firstWeekCard}>
                <Text style={styles.firstWeekHeader}>Your first week</Text>

                {/* Zero commission perk */}
                <View style={styles.perkRow}>
                    <View style={styles.perkIconCircle}>
                        <FontAwesomeIcon icon={faIndianRupeeSign} size={14} color="#F59E0B" />
                    </View>
                    <Text style={styles.perkText}>Zero commission for 30 days</Text>
                </View>

                {/* Priority perk */}
                <View style={[styles.perkRow, { marginTop: 14 }]}>
                    <View style={styles.perkIconCircle}>
                        <FontAwesomeIcon icon={faStar} size={13} color="#F59E0B" />
                    </View>
                    <Text style={styles.perkText}>Priority on Hyderabad–Karimnagar pool</Text>
                </View>
            </View>

            <View style={{ flex: 1, minHeight: 40 }} />

            {/* Go Online Yellow Button */}
            <TouchableOpacity style={styles.yellowGoOnlineButton} onPress={handleGoOnline} activeOpacity={0.85}>
                <Text style={styles.yellowGoOnlineButtonText}>Go online and start earning</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.tourLink}
                onPress={() => (navigation as any).navigate('DriverHome')}
            >
                <Text style={styles.tourLinkText}>Take a quick app tour</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
                }
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    {approvalStatus === 'approved' && renderApprovedState()}
                    {approvalStatus === 'rejected' && renderRejectedState()}
                    {approvalStatus === 'pending' && renderUnderReviewState()}
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B111D',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32,
    },
    stateWrapper: {
        width: '100%',
    },
    stateWrapperApproved: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 40,
    },

    // --- Header ---
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    statusIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    pendingIconCircle: {
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        borderWidth: 1.5,
        borderColor: '#F59E0B',
    },
    rejectedIconCircle: {
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderWidth: 1.5,
        borderColor: '#EF4444',
    },
    headerTextCol: {
        flex: 1,
    },
    pendingTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#F59E0B',
        marginBottom: 3,
    },
    pendingSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    expectedText: {
        color: '#10B981',
        fontWeight: '600',
    },
    rejectedTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#EF4444',
        marginBottom: 3,
    },
    rejectedSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },

    // --- Stepper ---
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingHorizontal: 12,
    },
    stepperNode: {
        alignItems: 'center',
        width: 80,
    },
    stepCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    stepCircleGreen: {
        backgroundColor: '#10B981',
    },
    stepCircleYellow: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    stepDotInnerYellow: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F59E0B',
    },
    stepCircleRed: {
        backgroundColor: '#EF4444',
    },
    stepCircleGray: {
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
    },
    stepBar: {
        flex: 1,
        height: 2,
        marginTop: 12,
        marginHorizontal: -10,
        zIndex: -1,
    },
    stepBarGreen: {
        backgroundColor: '#10B981',
    },
    stepBarRed: {
        backgroundColor: '#EF4444',
    },
    stepBarGray: {
        backgroundColor: '#334155',
    },
    stepText: {
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 13,
        fontWeight: '600',
    },
    stepTextGreen: {
        color: '#10B981',
    },
    stepTextYellow: {
        color: '#F59E0B',
    },
    stepTextRed: {
        color: '#EF4444',
    },
    stepTextGray: {
        color: '#64748B',
    },

    // --- Doc Checklist Card ---
    docChecklistCard: {
        backgroundColor: '#131B2A',
        borderRadius: 14,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
        marginBottom: 20,
    },
    docRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    docLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    docIconCheck: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    docIconReviewing: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    docName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F8FAFC',
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#1E293B',
    },
    badgeVerified: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    badgeVerifiedText: {
        color: '#10B981',
        fontSize: 11,
        fontWeight: '700',
    },
    badgeReviewing: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    badgeReviewingText: {
        color: '#F59E0B',
        fontSize: 11,
        fontWeight: '700',
    },

    // --- While You Wait ---
    whileWaitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        marginTop: 4,
    },
    whileWaitTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#F8FAFC',
    },
    whileWaitProgress: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    tasksContainer: {
        gap: 10,
        marginBottom: 24,
    },
    taskCard: {
        backgroundColor: '#131B2A',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    taskCardCompleted: {
        opacity: 0.6,
    },
    taskIconCompleted: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    taskTextCompleted: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
        textDecorationLine: 'line-through',
    },
    taskIconSquare: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    taskTextCol: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 2,
    },
    taskSubtitle: {
        fontSize: 11,
        color: '#64748B',
    },

    // --- Buttons ---
    greenSupportButton: {
        backgroundColor: '#10B981',
        height: 48,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    greenSupportButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
    },
    outlinedSupportButton: {
        height: 48,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#10B981',
        backgroundColor: '#131B2A',
        marginBottom: 12,
        marginTop: 10,
    },
    outlinedSupportButtonText: {
        color: '#10B981',
        fontWeight: '800',
        fontSize: 14,
    },
    signOutLink: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    signOutLinkText: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },

    // --- Rejected State Box ---
    rejectedCardBox: {
        backgroundColor: '#151E2E',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#EF4444',
        marginBottom: 16,
    },
    rejectedHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    rejectedDocTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#F8FAFC',
    },
    badgeRejected: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    badgeRejectedText: {
        color: '#EF4444',
        fontSize: 11,
        fontWeight: '700',
    },
    reasonText: {
        fontSize: 12,
        color: '#94A3B8',
        lineHeight: 18,
        marginBottom: 14,
    },
    reasonLabel: {
        fontWeight: '700',
        color: '#E2E8F0',
    },
    yellowReuploadButton: {
        backgroundColor: '#FBBF24',
        height: 44,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FBBF24',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    yellowReuploadButtonText: {
        color: '#0F172A',
        fontWeight: '800',
        fontSize: 13,
    },

    // --- Approved State ---
    approvedIconCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 8,
    },
    approvedMainTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#10B981',
        marginBottom: 8,
        textAlign: 'center',
    },
    approvedSubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
    },
    firstWeekCard: {
        width: '100%',
        backgroundColor: '#131B2A',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    firstWeekHeader: {
        fontSize: 14,
        fontWeight: '800',
        color: '#F8FAFC',
        marginBottom: 14,
    },
    perkRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    perkIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    perkText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#F1F5F9',
        flex: 1,
    },
    yellowGoOnlineButton: {
        width: '100%',
        backgroundColor: '#FBBF24',
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        shadowColor: '#FBBF24',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    yellowGoOnlineButtonText: {
        color: '#0F172A',
        fontSize: 15,
        fontWeight: '800',
    },
    tourLink: {
        alignItems: 'center',
        paddingVertical: 6,
    },
    tourLinkText: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default DriverPendingApprovalScreen;

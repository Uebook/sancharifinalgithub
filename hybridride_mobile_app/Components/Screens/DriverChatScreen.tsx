import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    FlatList,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft,
    faPhone,
    faPaperPlane,
    faCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getMessages, sendMessage } from '../../Services/rideService';
import { useAuth } from '../Context/AuthContext';

interface Message {
    _id: string;
    text: string;
    sender: string;
    createdAt: string;
}

const DriverChatScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();

    // Fallback parsing for driver side route params
    const bookingId = (route.params as any)?.bookingId || null;
    const passengerName = (route.params as any)?.passengerName || "Bob";

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const quickReplies = [
        "I'm here",
        "Coming in 2 mins",
        "Wait at the gate",
    ];

    const fetchChat = async () => {
        if (!bookingId) return;
        try {
            const res = await getMessages(bookingId);
            if (res.success && res.data) {
                setMessages(res.data);
            }
        } catch (error) {
            console.log('Error fetching chat:', error);
        }
    };

    useEffect(() => {
        fetchChat();
        let interval: ReturnType<typeof setInterval>;
        if (bookingId) {
            interval = setInterval(fetchChat, 3000); // Poll every 3 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [bookingId]);

    const handleSendMessage = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || !bookingId || sending) return;

        setSending(true);
        // Optimistic UI update
        const tempMsg: Message = {
            _id: Date.now().toString(),
            text: trimmed,
            sender: (user as any)?._id || 'temp', // Assumed driver's ID
            createdAt: new Date().toISOString()
        };

        setMessages((prev) => [...prev, tempMsg]);
        setInputText('');

        try {
            await sendMessage(bookingId, trimmed);
            await fetchChat();
        } catch (error) {
            console.log('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.sender === (user as any)?._id;
        return (
            <View style={[
                styles.messageBubble,
                isMe ? styles.driverBubble : styles.passengerBubble
            ]}>
                <Text style={[
                    styles.messageText,
                    isMe ? styles.driverMessageText : styles.passengerMessageText
                ]}>
                    {item.text}
                </Text>
                <Text style={[
                    styles.timestamp,
                    isMe ? styles.driverTimestamp : styles.passengerTimestamp
                ]}>
                    {formatTime(item.createdAt)}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <FontAwesomeIcon icon={faArrowLeft} size={20} color="#111827" />
                    </TouchableOpacity>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{passengerName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text style={styles.headerName}>{passengerName}</Text>
                        <View style={styles.statusRow}>
                            <FontAwesomeIcon icon={faCircle} size={6} color="#10B981" />
                            <Text style={styles.statusText}>ONLINE</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.callButton}>
                    <FontAwesomeIcon icon={faPhone} size={20} color="#059669" />
                </TouchableOpacity>
            </View>

            {/* Chat Area */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.messagesContainer}
                style={styles.messagesList}
            />

            {/* Bottom Section: Quick Replies & Input */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Quick Replies */}
                <View style={styles.quickRepliesContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRepliesContent}>
                        {quickReplies.map((reply, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.quickReplyChip}
                                onPress={() => handleSendMessage(reply)}
                            >
                                <Text style={styles.quickReplyText}>{reply}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Input Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#9CA3AF"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={() => handleSendMessage(inputText)}
                        disabled={!inputText.trim()}
                    >
                        <FontAwesomeIcon icon={faPaperPlane} size={20} color={inputText.trim() ? '#FFFFFF' : '#9CA3AF'} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
    },
    headerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
        marginLeft: 4,
    },
    callButton: {
        padding: 8,
    },
    messagesList: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    messagesContainer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
    },
    passengerBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    driverBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#111827',
        borderTopRightRadius: 4,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    passengerMessageText: {
        color: '#111827',
    },
    driverMessageText: {
        color: '#FFFFFF',
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    passengerTimestamp: {
        color: '#9CA3AF',
    },
    driverTimestamp: {
        color: '#9CA3AF',
    },
    quickRepliesContainer: {
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    quickRepliesContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    quickReplyChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    quickReplyText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1F2937',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 8,
        backgroundColor: '#FFFFFF',
    },
    input: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        maxHeight: 100,
        fontSize: 14,
        color: '#111827',
        marginRight: 12,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#111827',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#E5E7EB',
    },
});

export default DriverChatScreen;

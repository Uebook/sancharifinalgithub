import React, { useState, useEffect, useRef } from 'react';
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
import { faChevronLeft, faPhone, faPaperPlane, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMessages, sendMessage } from '../../Services/rideService';
import { useAuth } from '../Context/AuthContext';

interface DriverChatModalProps {
    visible: boolean;
    onClose: () => void;
    onCallPress?: () => void;
    driverName?: string;
    bookingId?: string;
}

interface Message {
    _id: string;
    text: string;
    sender: string;
    createdAt: string;
}

const DriverChatModal: React.FC<DriverChatModalProps> = ({ visible, onClose, onCallPress, driverName = "Driver", bookingId }) => {
    const { user } = useAuth();
    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    // Quick replies based on screenshot
    const quickReplies = ["I'm here", "Coming in 2 mins", "Wait at the gate"];

    const fetchChat = async () => {
        if (!bookingId || !visible) return;
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
        if (visible && bookingId) {
            interval = setInterval(fetchChat, 3000); // short-polling every 3s
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [visible, bookingId]);

    const handleSend = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || !bookingId || sending) return;

        setSending(true);
        // Optimistic UI update
        const tempMsg: Message = {
            _id: Date.now().toString(),
            text: trimmed,
            sender: (user as any)?._id || 'temp', // assume our id
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);
        setMessageText('');

        try {
            await sendMessage(bookingId, trimmed);
            await fetchChat(); // update real data
        } catch (error) {
            console.log('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <FontAwesomeIcon icon={faChevronLeft} size={20} color="#374151" />
                    </TouchableOpacity>

                    <View style={styles.headerProfile}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{driverName.charAt(0)}</Text>
                        </View>
                        <View>
                            <Text style={styles.headerName}>{driverName}</Text>
                            <View style={styles.onlineContainer}>
                                <View style={styles.onlineDot} />
                                <Text style={styles.onlineText}>ONLINE</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity onPress={onCallPress} style={styles.headerCallButton}>
                        <FontAwesomeIcon icon={faPhone} size={20} color="#0F766E" />
                    </TouchableOpacity>
                </View>

                {/* Chat Area */}
                <ScrollView
                    ref={scrollRef}
                    style={styles.chatContainer}
                    contentContainerStyle={styles.chatContent}
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map((msg) => {
                        const isMe = msg.sender === (user as any)?._id;
                        return (
                            <View
                                key={msg._id}
                                style={isMe ? styles.messageRowRight : styles.messageRowLeft}
                            >
                                <View style={[styles.messageBubble, isMe ? styles.messageBubbleRight : styles.messageBubbleLeft]}>
                                    <Text style={isMe ? styles.messageTextRight : styles.messageTextLeft}>{msg.text}</Text>
                                    <Text style={isMe ? styles.timestampRight : styles.timestampLeft}>{formatTime(msg.createdAt)}</Text>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Quick Replies */}
                <View style={styles.quickReplyContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickReplyContent}>
                        {quickReplies.map((reply, index) => (
                            <TouchableOpacity key={index} style={styles.quickReplyChip} onPress={() => handleSend(reply)}>
                                <Text style={styles.quickReplyText}>{reply}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Divider Line */}
                <View style={styles.divider} />

                {/* Input Area */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
                >
                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Type a message..."
                                placeholderTextColor="#9CA3AF"
                                value={messageText}
                                onChangeText={setMessageText}
                            />
                            <TouchableOpacity style={styles.sendButton} onPress={() => handleSend(messageText)}>
                                <FontAwesomeIcon icon={faArrowRight} size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.sendButtonOuter} onPress={() => handleSend(messageText)}>
                            <FontAwesomeIcon icon={faPaperPlane} size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

// Custom arrow for input field used in screenshot if needed, but using standard icons mostly.
// Actually, looking at the screenshot, the send button is separate.
// I will adjust the input container style in the stylesheet below.

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
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 5,
    },
    headerProfile: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 15,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
    },
    headerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    onlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginRight: 4,
    },
    onlineText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9CA3AF',
        letterSpacing: 0.5,
    },
    headerCallButton: {
        padding: 10,
    },
    chatContainer: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    chatContent: {
        padding: 20,
    },
    messageRowLeft: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 20,
    },
    messageRowRight: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 20,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 16,
        borderRadius: 16,
    },
    messageBubbleLeft: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    messageBubbleRight: {
        backgroundColor: '#111827',
        borderTopRightRadius: 4,
    },
    messageTextLeft: {
        fontSize: 15,
        color: '#111827',
        lineHeight: 22,
    },
    messageTextRight: {
        fontSize: 15,
        color: '#FFFFFF',
        lineHeight: 22,
    },
    timestampLeft: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 8,
        alignSelf: 'flex-start'
    },
    timestampRight: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 8,
        alignSelf: 'flex-end'
    },
    quickReplyContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
    },
    quickReplyContent: {
        paddingHorizontal: 20,
        gap: 10,
    },
    quickReplyChip: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    quickReplyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        gap: 12,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        paddingHorizontal: 16,
        height: 48,
        justifyContent: 'space-between'
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        height: '100%',
    },
    sendButton: {
        padding: 4,
    },
    sendButtonOuter: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
});



export default DriverChatModal;

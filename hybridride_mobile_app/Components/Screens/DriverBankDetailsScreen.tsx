import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faUniversity } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../Context/AuthContext';
import { driverService } from '../../Services/driverService';

const DriverBankDetailsScreen = () => {
    const navigation = useNavigation();
    const { user, refetchUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [accountHolderName, setAccountHolderName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [bankName, setBankName] = useState('');

    useEffect(() => {
        if (user?.driverDetails?.bankDetails) {
            const { bankDetails } = user.driverDetails;
            setAccountHolderName(bankDetails.accountHolderName || '');
            setAccountNumber(bankDetails.accountNumber || '');
            setIfscCode(bankDetails.ifscCode || '');
            setBankName(bankDetails.bankName || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const updateData = {
                bankDetails: {
                    accountHolderName,
                    accountNumber,
                    ifscCode,
                    bankName
                }
            };

            await driverService.updateProfile(updateData);
            await refetchUser(); 
            Alert.alert('Success', 'Bank details updated successfully');
            navigation.goBack();
        } catch (error) {
            console.error('Update failed:', error);
            Alert.alert('Error', 'Failed to update bank details');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faChevronLeft} size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bank Account Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {user?.driverDetails?.bankDetails?.accountNumber ? (
                        <View style={styles.savedCard}>
                            <Text style={styles.savedTitle}>LINKED ACCOUNT</Text>
                            <Text style={styles.savedValue}>{user.driverDetails.bankDetails.bankName}</Text>
                            <Text style={styles.savedSubText}>{user.driverDetails.bankDetails.accountHolderName}</Text>
                            <Text style={styles.savedSubText}>A/C: ****{user.driverDetails.bankDetails.accountNumber.slice(-4)}</Text>
                        </View>
                    ) : (
                        <View style={styles.infoBox}>
                            <FontAwesomeIcon icon={faUniversity} size={20} color="#10B981" />
                            <Text style={styles.infoText}>
                                Please ensure your bank details are correct to avoid any payment delays or failures.
                            </Text>
                        </View>
                    )}

                    <Text style={styles.sectionTitle}>EDIT ACCOUNT INFORMATION</Text>

                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Account Holder Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter full name"
                                placeholderTextColor="#64748B"
                                value={accountHolderName}
                                onChangeText={setAccountHolderName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Account Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter account number"
                                placeholderTextColor="#64748B"
                                keyboardType="number-pad"
                                value={accountNumber}
                                onChangeText={setAccountNumber}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>IFSC Code</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. SBIN0001234"
                                placeholderTextColor="#64748B"
                                autoCapitalize="characters"
                                value={ifscCode}
                                onChangeText={setIfscCode}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Bank Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. State Bank of India"
                                placeholderTextColor="#64748B"
                                value={bankName}
                                onChangeText={setBankName}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Account Details</Text>
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
        backgroundColor: '#080C14',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#0F172A',
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    content: {
        padding: 20,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#064E3B',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#10B98133',
    },
    infoText: {
        fontSize: 13,
        color: '#A7F3D0',
        marginLeft: 12,
        flex: 1,
        lineHeight: 18,
    },
    savedCard: {
        backgroundColor: '#0F172A',
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
        borderWidth: 1,
        borderColor: '#1E293B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    savedTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#10B981',
        letterSpacing: 2,
        marginBottom: 8,
    },
    savedValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    savedSubText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        marginBottom: 8,
        marginTop: 8,
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#1E293B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#E2E8F0',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#1E293B',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#FFFFFF',
        backgroundColor: '#1E293B',
    },
    saveButton: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        backgroundColor: '#064E3B',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    }
});

export default DriverBankDetailsScreen;

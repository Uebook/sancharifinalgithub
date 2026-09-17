import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCar, faFileInvoiceDollar, faHeadset, faUser } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BottomNavBarProps = {
    activeTab: 'RIDES' | 'PAYMENTS' | 'SUPPORT' | 'PROFILE';
};

const BottomNavBar = ({ activeTab }: BottomNavBarProps) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const handlePress = (tab: 'RIDES' | 'PAYMENTS' | 'SUPPORT' | 'PROFILE') => {
        if (tab === activeTab) return;

        switch (tab) {
            case 'RIDES':
                navigation.navigate('PassengerHome' as never);
                break;
            case 'PAYMENTS':
                navigation.navigate('Wallet' as never);
                break;
            case 'SUPPORT':
                navigation.navigate('Support' as never);
                break;
            case 'PROFILE':
                navigation.navigate('PassengerProfile' as never);
                break;
        }
    };

    return (
        <View style={[styles.bottomNav, { paddingBottom: insets.bottom || 12 }]}>
            <TouchableOpacity style={styles.navItem} onPress={() => handlePress('RIDES')}>
                <FontAwesomeIcon
                    icon={faCar}
                    size={24}
                    color={activeTab === 'RIDES' ? "#111827" : "#9CA3AF"}
                    style={{ marginBottom: 4 }}
                />
                <Text style={[styles.navText, activeTab === 'RIDES' && styles.activeNavText]}>RIDES</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => handlePress('PAYMENTS')}>
                <FontAwesomeIcon
                    icon={faFileInvoiceDollar}
                    size={24}
                    color={activeTab === 'PAYMENTS' ? "#111827" : "#9CA3AF"}
                    style={{ marginBottom: 4 }}
                />
                <Text style={[styles.navText, activeTab === 'PAYMENTS' && styles.activeNavText]}>PAYMENTS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => handlePress('SUPPORT')}>
                <FontAwesomeIcon
                    icon={faHeadset}
                    size={24}
                    color={activeTab === 'SUPPORT' ? "#111827" : "#9CA3AF"}
                    style={{ marginBottom: 4 }}
                />
                <Text style={[styles.navText, activeTab === 'SUPPORT' && styles.activeNavText]}>SUPPORT</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => handlePress('PROFILE')}>
                <FontAwesomeIcon
                    icon={faUser}
                    size={24}
                    color={activeTab === 'PROFILE' ? "#111827" : "#9CA3AF"}
                    style={{ marginBottom: 4 }}
                />
                <Text style={[styles.navText, activeTab === 'PROFILE' && styles.activeNavText]}>PROFILE</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    navItem: {
        alignItems: 'center',
    },
    navText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9CA3AF',
    },
    activeNavText: {
        color: '#111827',
    },
});

export default BottomNavBar;

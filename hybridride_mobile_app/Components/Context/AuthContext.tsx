import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authService } from '../../Services/authService';

try {
    GoogleSignin.configure({
        webClientId: '909296510785-e3a279afthh5br10j180ie4lidh9ucp2.apps.googleusercontent.com',
        iosClientId: '909296510785-e3a279afthh5br10j180ie4lidh9ucp2.apps.googleusercontent.com',
    });
} catch (error) {
    console.warn('[GoogleSignin] configure error:', error);
}
interface User {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: 'passenger' | 'driver' | 'admin';
    driverApprovalStatus?: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    token?: string;
    profileImage?: string;
    walletBalance?: number;
    driverDetails?: {
        licenseNumber?: string;
        vehicle?: {
            make?: string;
            model?: string;
            plateNumber?: string;
            type?: 'CAR' | 'BIKE' | 'AUTO' | 'TRUCK';
        };
        ratings?: {
            average: number;
            count: number;
        };
        earnings?: number;
        isOnline?: boolean;
        bankDetails?: {
            accountNumber?: string;
            ifscCode?: string;
            bankName?: string;
            accountHolderName?: string;
        };
    };
    verificationStatus?: {
        email: boolean;
        phone: boolean;
        idCard: boolean;
        communityTrusted: boolean;
    };
    ridePersonality?: string[];
    savedPlaces?: {
        type: 'Home' | 'Work' | 'Other';
        label: string;
        address: string;
        coordinates?: number[];
    }[];
    travelStats?: {
        totalSavings: number;
        co2Saved: number;
    };
    emergencyContact?: {
        name?: string;
        phone?: string;
    };
    createdAt?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAppLoading: boolean;
    login: (credentials: any) => Promise<any>;
    loginWithGoogle: (role: string) => Promise<void>;
    register: (userData: any) => Promise<any>;
    sendOTP: (phone: string, channel?: 'sms' | 'whatsapp', role?: string, isLogin?: boolean) => Promise<any>;
    verifyOTP: (phone: string, otp: string, role?: string) => Promise<void>;
    whatsappLogin: (phone: string, role?: string) => Promise<void>;

    logout: () => Promise<void>;
    deleteAccount: () => Promise<any>;
    refetchUser: () => Promise<void>;
    updateUser: (partialData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAppLoading, setIsAppLoading] = useState(true);

    // Check for logged-in user on app launch
    useEffect(() => {
        const loadUser = async () => {
            const minSplashTime = new Promise((resolve) => setTimeout(() => resolve(true), 2000));
            try {
                const storedUser = await AsyncStorage.getItem('userInfo');
                const token = await AsyncStorage.getItem('userToken');

                if (storedUser && token) {
                    // 1. Optimistically restore user immediately from local storage
                    try {
                        const parsed = JSON.parse(storedUser);
                        setUser({ ...parsed, token });
                    } catch (parseErr) {
                        console.error('Failed to parse cached user info:', parseErr);
                    }

                    // 2. Fetch fresh profile data in the background
                    try {
                        const response = await authService.getMe();
                        if (response.success && response.data) {
                            const freshUser = { ...response.data, token };
                            setUser(freshUser);
                            await AsyncStorage.setItem('userInfo', JSON.stringify(freshUser));
                        }
                    } catch (apiError: any) {
                        console.warn('Background token refresh warning:', apiError?.message);
                        // Only log out if backend explicitly rejected the token as 401 Unauthorized
                        if (apiError?.response?.status === 401) {
                            await logout();
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to load user on startup:', e);
            } finally {
                await minSplashTime;
                setIsAppLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (credentials: any) => {
        setIsLoading(true);
        try {
            const data = await authService.login(credentials);
            if (data.data.token) {
                setUser(data.data);
            }
            return data;
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const sendOTP = async (phone: string, channel: 'sms' | 'whatsapp' = 'sms', role?: string, isLogin: boolean = false) => {
        setIsLoading(true);
        try {
            console.log("sendOTP requesting:", phone, channel, role, isLogin);
            const response = await authService.sendOTP(phone, channel, role, isLogin);
            return response;
        } catch (error: any) {
            console.error('sendOTP error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const whatsappLogin = async (phone: string, role?: string) => {
        return sendOTP(phone, 'whatsapp', role);
    };

    const verifyOTP = async (phone: string, otp: string, role?: string) => {
        setIsLoading(true);
        try {
            const data = await authService.verifyOTP(phone, otp, role);
            if (data.data.token) {
                setUser(data.data);
            }
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };


    const loginWithGoogle = async (role: string = 'passenger') => {
        setIsLoading(true);
        try {
            await GoogleSignin.hasPlayServices();
            // Force account picker by signing out first if previously signed in
            if (GoogleSignin.hasPreviousSignIn()) {
                await GoogleSignin.signOut();
            }
            const userInfo = await GoogleSignin.signIn();

            console.log('Google Sign-In raw response:', JSON.stringify(userInfo));

            if (userInfo.type === 'cancelled') {
                console.log('Google Sign-In was cancelled');
                return;
            }

            if (userInfo.type !== 'success' || !userInfo.data) {
                throw new Error('Google Sign-In failed or cancelled');
            }

            const idToken = userInfo.data.idToken;
            console.log(";;;;", idToken)

            if (!idToken) throw new Error('No ID token found in Google response. Check your webClientId configuration or SHA-1 hashes.');

            const data = await authService.loginWithGoogle(idToken, role);
            setUser(data.data);
            return data;
        } catch (error: any) {
            console.error('Google sign-in error:', error);
            // Re-throw so the component can handle specific codes like 404
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (userData: any) => {
        setIsLoading(true);
        try {
            const data = await authService.register(userData);
            if (data.data.token) {
                setUser(data.data);
            }
            return data;
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await authService.logout();

            // Try to sign out of Google if the user was signed in with Google
            const isSignedIn = GoogleSignin.hasPreviousSignIn();
            if (isSignedIn) {
                await GoogleSignin.revokeAccess();
                await GoogleSignin.signOut();
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setIsLoading(false);
        }
    };

    const deleteAccount = async () => {
        setIsLoading(true);
        try {
            const res = await authService.deleteAccount();

            const isSignedIn = GoogleSignin.hasPreviousSignIn();
            if (isSignedIn) {
                await GoogleSignin.revokeAccess();
                await GoogleSignin.signOut();
            }
            setUser(null);
            return res;
        } catch (error) {
            console.error('Delete account error:', error);
            throw error;
        } finally {
            setUser(null);
            setIsLoading(false);
        }
    };

    const refetchUser = async () => {
        try {
            const response = await authService.getMe();
            if (response.success && response.data) {
                const token = await AsyncStorage.getItem('userToken');
                setUser({ ...response.data, token });
                await AsyncStorage.setItem('userInfo', JSON.stringify({ ...response.data, token }));
            }
        } catch (error) {
            console.error('Failed to refetch user:', error);
        }
    };

    const updateUser = async (partialData: Partial<User>) => {
        setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...partialData };
            AsyncStorage.setItem('userInfo', JSON.stringify(updated)).catch(console.error);
            return updated;
        });
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isAppLoading, login, loginWithGoogle, sendOTP, whatsappLogin, register, verifyOTP, logout, deleteAccount, refetchUser, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

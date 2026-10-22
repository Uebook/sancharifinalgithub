import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, Lock, Key, ShieldCheck, CheckCircle2,
    AlertCircle, Loader2, Save, Eye, EyeOff, RefreshCw, Sparkles,
    Shield, Calendar, Clock
} from 'lucide-react';

const AdminProfile = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    const storedAdmin = JSON.parse(localStorage.getItem('adminUser') || '{}');

    // Profile form state
    const [profile, setProfile] = useState({
        name: storedAdmin.name || '',
        email: storedAdmin.email || '',
        phone: storedAdmin.phone || '',
        role: storedAdmin.role || 'admin',
        createdAt: storedAdmin.createdAt || null
    });

    // Password form state (Notice: strictly empty, zero prefilled values)
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Password visibility toggles
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Loading & feedback states
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [profileFeedback, setProfileFeedback] = useState(null); // { type: 'success' | 'error', message: '' }
    const [passwordFeedback, setPasswordFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

    // Fetch fresh profile data from backend
    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) return;

            const res = await axios.get(`${API_BASE_URL}/api/admin/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success && res.data.data) {
                const data = res.data.data;
                setProfile({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    role: data.role || 'admin',
                    createdAt: data.createdAt || null
                });

                // Sync with localStorage
                const updatedAdmin = { ...storedAdmin, ...data };
                localStorage.setItem('adminUser', JSON.stringify(updatedAdmin));
                window.dispatchEvent(new Event('adminUserUpdated'));
            }
        } catch (err) {
            console.error('Failed to fetch admin profile:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // Handle Profile / Email Update
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        setProfileFeedback(null);

        const trimmedName = profile.name.trim();
        const trimmedEmail = profile.email.trim();
        const trimmedPhone = profile.phone.trim();

        if (!trimmedName) {
            setProfileFeedback({ type: 'error', message: 'Name cannot be empty' });
            setIsSavingProfile(false);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
            setProfileFeedback({ type: 'error', message: 'Please enter a valid email address' });
            setIsSavingProfile(false);
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.put(`${API_BASE_URL}/api/admin/profile`, {
                name: trimmedName,
                email: trimmedEmail,
                phone: trimmedPhone
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                const updatedUser = res.data.data;
                setProfile(prev => ({
                    ...prev,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    phone: updatedUser.phone
                }));

                // Update localStorage and trigger navbar update
                const currentStored = JSON.parse(localStorage.getItem('adminUser') || '{}');
                const merged = { ...currentStored, ...updatedUser };
                localStorage.setItem('adminUser', JSON.stringify(merged));
                window.dispatchEvent(new Event('adminUserUpdated'));

                setProfileFeedback({
                    type: 'success',
                    message: 'Admin profile and email updated successfully!'
                });
            } else {
                setProfileFeedback({
                    type: 'error',
                    message: res.data.message || 'Failed to update profile'
                });
            }
        } catch (err) {
            console.error('Error updating admin profile:', err);
            setProfileFeedback({
                type: 'error',
                message: err.response?.data?.message || err.message || 'Server error updating profile'
            });
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Handle Password Change
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setIsSavingPassword(true);
        setPasswordFeedback(null);

        const { currentPassword, newPassword, confirmPassword } = passwordData;

        if (!currentPassword) {
            setPasswordFeedback({ type: 'error', message: 'Please enter your current password' });
            setIsSavingPassword(false);
            return;
        }

        if (!newPassword) {
            setPasswordFeedback({ type: 'error', message: 'Please enter a new password' });
            setIsSavingPassword(false);
            return;
        }

        if (newPassword.length < 6) {
            setPasswordFeedback({ type: 'error', message: 'New password must be at least 6 characters long' });
            setIsSavingPassword(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordFeedback({ type: 'error', message: 'New password and confirm password do not match' });
            setIsSavingPassword(false);
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.put(`${API_BASE_URL}/api/admin/profile`, {
                currentPassword,
                newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setPasswordFeedback({
                    type: 'success',
                    message: 'Password changed successfully! Keep your new credentials safe.'
                });
                // Reset password form fields
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                setPasswordFeedback({
                    type: 'error',
                    message: res.data.message || 'Failed to update password'
                });
            }
        } catch (err) {
            console.error('Error updating password:', err);
            setPasswordFeedback({
                type: 'error',
                message: err.response?.data?.message || err.message || 'Server error updating password'
            });
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 p-8 shadow-2xl">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-32 -mb-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20">
                                <div className="h-full w-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white text-2xl font-black">
                                    {profile.name?.charAt(0)?.toUpperCase() || 'A'}
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-slate-950" title="Active Account">
                                <ShieldCheck size={14} strokeWidth={3} />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-black text-white tracking-tight">{profile.name || 'Admin User'}</h1>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                                    {profile.role || 'Super Admin'}
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                                <Mail size={14} className="text-slate-500" />
                                {profile.email || 'admin@sanchari.com'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchProfile}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                            Refresh Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Section 1: Profile & Email Details */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
                            <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                                <User size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-tight">Admin Profile & Email</h2>
                                <p className="text-xs text-slate-400">Update your primary identity and login email</p>
                            </div>
                        </div>

                        {profileFeedback && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mt-5 p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                                    profileFeedback.type === 'success'
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                }`}
                            >
                                {profileFeedback.type === 'success' ? (
                                    <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                                ) : (
                                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                                )}
                                <span>{profileFeedback.message}</span>
                            </motion.div>
                        )}

                        <form id="profile-form" onSubmit={handleProfileSubmit} className="space-y-5 mt-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 placeholder-slate-600 text-white transition-all text-sm font-medium"
                                        placeholder="Admin Name"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Email Address
                                    </label>
                                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                                        Login Username
                                    </span>
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                                    <input
                                        type="email"
                                        required
                                        autoComplete="email"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 placeholder-slate-600 text-white transition-all text-sm font-medium"
                                        placeholder="admin@sanchari.com"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1.5">
                                    Changing this email will update the username you use to log into this admin portal.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Phone Number (Optional)
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                                    <input
                                        type="tel"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 placeholder-slate-600 text-white transition-all text-sm font-medium"
                                        placeholder="+91 9876543210"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Assigned System Role
                                </label>
                                <div className="relative">
                                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                                    <input
                                        type="text"
                                        disabled
                                        className="w-full pl-11 pr-4 py-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-slate-400 cursor-not-allowed text-sm uppercase tracking-wider font-semibold"
                                        value={profile.role}
                                    />
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-800/80">
                        <button
                            type="submit"
                            form="profile-form"
                            disabled={isSavingProfile}
                            className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-sky-500/20 active:scale-[0.99] text-xs uppercase tracking-wider"
                        >
                            {isSavingProfile ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Saving Profile...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Save Profile & Email
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Section 2: Security & Password Change */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Key size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-tight">Security & Password</h2>
                                <p className="text-xs text-slate-400">Update your secret credentials to keep your portal secure</p>
                            </div>
                        </div>

                        {passwordFeedback && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mt-5 p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                                    passwordFeedback.type === 'success'
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                }`}
                            >
                                {passwordFeedback.type === 'success' ? (
                                    <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                                ) : (
                                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                                )}
                                <span>{passwordFeedback.message}</span>
                            </motion.div>
                        )}

                        <form id="password-form" onSubmit={handlePasswordSubmit} className="space-y-5 mt-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        required
                                        autoComplete="current-password"
                                        className="w-full pl-11 pr-11 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 placeholder-slate-600 text-white transition-all text-sm font-medium"
                                        placeholder="Enter current password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        required
                                        autoComplete="new-password"
                                        className="w-full pl-11 pr-11 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 placeholder-slate-600 text-white transition-all text-sm font-medium"
                                        placeholder="Minimum 6 characters"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1.5">
                                    Must contain at least 6 characters. Use letters, numbers & symbols for maximum strength.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        autoComplete="new-password"
                                        className="w-full pl-11 pr-11 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 placeholder-slate-600 text-white transition-all text-sm font-medium"
                                        placeholder="Re-enter new password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-800/80">
                        <button
                            type="submit"
                            form="password-form"
                            disabled={isSavingPassword}
                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-emerald-500/20 active:scale-[0.99] text-xs uppercase tracking-wider"
                        >
                            {isSavingPassword ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Updating Password...
                                </>
                            ) : (
                                <>
                                    <Key size={16} />
                                    Change Password
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;

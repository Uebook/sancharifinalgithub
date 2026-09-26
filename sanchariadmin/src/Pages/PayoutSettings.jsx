import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, ShieldCheck, ShieldAlert, Key, Zap, CheckCircle2,
    AlertTriangle, RefreshCw, Eye, EyeOff, Save, ExternalLink,
    HelpCircle, ArrowRight, Building, Smartphone
} from 'lucide-react';

const PayoutSettings = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [showSecret, setShowSecret] = useState(false);

    // Form State
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [hasSecret, setHasSecret] = useState(false);
    const [environment, setEnvironment] = useState('SANDBOX');
    const [isEnabled, setIsEnabled] = useState(true);
    const [transferModePreference, setTransferModePreference] = useState('auto');

    // Feedback State
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'warning', message: '' }
    const [testResult, setTestResult] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

    const fetchSettings = async () => {
        setIsLoading(true);
        setFeedback(null);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${API_BASE_URL}/api/admin/settings/payout`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success && res.data.data) {
                const data = res.data.data;
                setClientId(data.clientId || '');
                setClientSecret(data.clientSecret || '');
                setHasSecret(data.hasSecret || false);
                setEnvironment(data.environment || 'SANDBOX');
                setIsEnabled(data.isEnabled !== false);
                setTransferModePreference(data.transferModePreference || 'auto');
            }
        } catch (err) {
            console.error('Failed to fetch payout settings:', err);
            setFeedback({
                type: 'error',
                message: err.response?.data?.message || 'Failed to load payout settings from server.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        setFeedback(null);
        setTestResult(null);

        // Client-side strict validation for Production
        if (environment === 'PRODUCTION') {
            const lowerId = clientId.toLowerCase();
            const lowerSec = clientSecret.toLowerCase();
            if (
                !clientId.trim() ||
                !clientSecret.trim() ||
                lowerId.includes('dummy') ||
                lowerId.includes('placeholder') ||
                lowerSec.includes('dummy') ||
                lowerSec.includes('placeholder')
            ) {
                setIsSaving(false);
                setFeedback({
                    type: 'error',
                    message: 'Production / Live mode requires valid Cashfree Live Payout credentials. Placeholder or dummy keys are not permitted in Live mode.'
                });
                return;
            }
        }

        try {
            const token = localStorage.getItem('adminToken');
            const payload = {
                clientId: clientId.trim(),
                clientSecret: clientSecret.trim(),
                environment,
                isEnabled,
                transferModePreference
            };

            const res = await axios.put(`${API_BASE_URL}/api/admin/settings/payout`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setFeedback({
                    type: 'success',
                    message: `Payout configuration successfully updated and saved in database (${environment} Mode).`
                });
                fetchSettings();
            } else {
                setFeedback({
                    type: 'error',
                    message: res.data.message || 'Failed to update settings.'
                });
            }
        } catch (err) {
            console.error('Update payout settings error:', err);
            setFeedback({
                type: 'error',
                message: err.response?.data?.message || 'Failed to save settings to server.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestResult(null);
        setFeedback(null);

        try {
            const token = localStorage.getItem('adminToken');
            const payload = {
                clientId: clientId.trim(),
                clientSecret: clientSecret.trim(),
                environment
            };

            const res = await axios.post(`${API_BASE_URL}/api/admin/settings/payout/test-connection`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setTestResult({
                    success: true,
                    message: res.data.message || 'Cashfree Payouts API connected & authenticated successfully!'
                });
            } else {
                setTestResult({
                    success: false,
                    message: res.data.message || 'Connection test returned an error.'
                });
            }
        } catch (err) {
            console.error('Test connection error:', err);
            setTestResult({
                success: false,
                message: err.response?.data?.message || 'Connection test failed. Please verify credentials.'
            });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto min-h-screen text-slate-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                            <CreditCard size={22} />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                            Cashfree Payout Settings
                        </h1>
                    </div>
                    <p className="text-sm text-slate-400">
                        Configure Cashfree Disbursements API credentials to automate instant bank (IMPS) & UPI payouts for drivers.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchSettings}
                        disabled={isLoading}
                        className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 font-semibold text-xs transition-all flex items-center gap-2"
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <a
                        href="https://merchant.cashfree.com/merchants/payouts"
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs transition-all flex items-center gap-2"
                    >
                        <ExternalLink size={14} />
                        Cashfree Dashboard
                    </a>
                </div>
            </div>

            {/* Alert / Feedback */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-2xl border flex items-start gap-3.5 text-sm ${
                            feedback.type === 'success'
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                : feedback.type === 'warning'
                                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                        }`}
                    >
                        {feedback.type === 'success' ? (
                            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 font-medium">{feedback.message}</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Form */}
            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left 2 Cols: Key Configuration */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Environment Selection */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-emerald-400" />
                                    Execution Environment
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Select whether payouts execute in test Sandbox mode or live Production.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEnvironment('SANDBOX')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                        environment === 'SANDBOX'
                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    🧪 Sandbox (Test)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEnvironment('PRODUCTION')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                        environment === 'PRODUCTION'
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    🚀 Live Production
                                </button>
                            </div>
                        </div>

                        {environment === 'PRODUCTION' ? (
                            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
                                <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold">Live Mode Active:</span> All driver settlement payouts will execute real IMPS/UPI bank transfers from your Cashfree Virtual Account. Placeholder or dummy credentials are strictly blocked.
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
                                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold">Sandbox Mode Active:</span> Payouts run against Cashfree's Gamma sandbox environment. Real money is not deducted.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* API Credentials */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Key size={18} className="text-indigo-400" />
                                    Cashfree Payout Credentials
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Stored securely in database. Enter your Payout Client ID & Client Secret.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-medium">Payout Service:</span>
                                <button
                                    type="button"
                                    onClick={() => setIsEnabled(!isEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        isEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            isEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Client ID */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                Cashfree Payout Client ID (App ID)
                            </label>
                            <input
                                type="text"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                placeholder="CF_PAYOUT_APP_xxxxxxxx"
                                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all font-mono text-xs"
                                required
                            />
                        </div>

                        {/* Client Secret */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    Cashfree Payout Client Secret (Secret Key)
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                                    {showSecret ? 'Hide Secret' : 'Show Secret'}
                                </button>
                            </div>
                            <input
                                type={showSecret ? 'text' : 'password'}
                                value={clientSecret}
                                onChange={(e) => setClientSecret(e.target.value)}
                                placeholder={hasSecret ? '••••••••••••••••' : 'Enter Secret Key'}
                                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all font-mono text-xs"
                                required
                            />
                        </div>

                        {/* Transfer Mode Preference */}
                        <div className="space-y-3 pt-2">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                Transfer Mode Preference
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div
                                    onClick={() => setTransferModePreference('auto')}
                                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                        transferModePreference === 'auto'
                                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 font-bold text-xs text-white">
                                        <Zap size={14} className="text-emerald-400" /> Auto-Select
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">UPI if available, else IMPS Bank transfer</p>
                                </div>

                                <div
                                    onClick={() => setTransferModePreference('bank')}
                                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                        transferModePreference === 'bank'
                                            ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 font-bold text-xs text-white">
                                        <Building size={14} className="text-indigo-400" /> Bank Transfer
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">Always use Account Number + IFSC</p>
                                </div>

                                <div
                                    onClick={() => setTransferModePreference('upi')}
                                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                        transferModePreference === 'upi'
                                            ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 font-bold text-xs text-white">
                                        <Smartphone size={14} className="text-purple-400" /> UPI VPA
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">Prioritize Driver UPI ID transfers</p>
                                </div>
                            </div>
                        </div>

                        {/* Test Connection Output */}
                        {testResult && (
                            <div className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                                testResult.success
                                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                            }`}>
                                {testResult.success ? (
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                    <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p className="font-bold">{testResult.success ? 'Authentication Verified' : 'Authentication Failed'}</p>
                                    <p className="mt-0.5 opacity-90">{testResult.message}</p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleTestConnection}
                                disabled={isTesting || !clientId || !clientSecret}
                                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Zap size={14} className={isTesting ? 'animate-pulse text-amber-400' : 'text-amber-400'} />
                                {isTesting ? 'Testing Connection...' : 'Test API Connection'}
                            </button>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full sm:w-auto flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save size={14} />
                                {isSaving ? 'Saving to Database...' : 'Save Payout Configuration'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right 1 Col: Quick Help & Instructions */}
                <div className="space-y-6">
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <HelpCircle size={16} className="text-emerald-400" />
                            How to Get Credentials
                        </h3>
                        <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside">
                            <li>Log in to your <a href="https://merchant.cashfree.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">Cashfree Merchant Dashboard</a>.</li>
                            <li>Navigate to <strong>Payouts</strong> &rarr; <strong>Developers</strong> &rarr; <strong>API Keys</strong>.</li>
                            <li>Copy your <strong>App ID (Client ID)</strong> and generate your <strong>Secret Key</strong>.</li>
                            <li>Paste them into the fields on this screen and click <strong>Test Connection</strong>.</li>
                            <li>Ensure your Cashfree Payout Virtual Account has sufficient balance before enabling live payouts.</li>
                        </ol>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl space-y-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <ShieldCheck size={16} className="text-indigo-400" />
                            Live Settlement Safeguards
                        </h3>
                        <ul className="space-y-2 text-xs text-slate-300">
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                <span><strong>Strict Live Validation:</strong> No fake or placeholder keys are permitted in Production.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                <span><strong>Idempotent Transfers:</strong> Prevents duplicate transactions with unique Sanchari transfer hashes.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                <span><strong>Balance Safeguard:</strong> Automatically verifies driver wallet balances prior to dispatching payout funds.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PayoutSettings;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: 'admin@hybridride.com', password: 'admin123' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Trim inputs
        const trimmedEmail = formData.email.trim();
        const trimmedPassword = formData.password.trim();

        // Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedEmail) {
            setError('Email is required');
            setIsLoading(false);
            return;
        }
        if (!emailRegex.test(trimmedEmail)) {
            setError('Please enter a valid email address');
            setIsLoading(false);
            return;
        }
        if (!trimmedPassword) {
            setError('Password is required');
            setIsLoading(false);
            return;
        }
        if (trimmedPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            setIsLoading(false);
            return;
        }

        try {
            if (!import.meta.env.VITE_API_BASE_URL) {
                setError('API Base URL is not configured. Please check environment variables.');
                setIsLoading(false);
                return;
            }
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
                email: trimmedEmail,
                password: trimmedPassword,
                role: 'admin'
            });

            const data = res.data; // Axios automatically parses JSON

            if (res.status === 200) { // Check for successful status code
                if (data.data.role !== 'admin') {
                    setError('Access denied. Admin privileges required.');
                    return;
                }

                localStorage.setItem('adminToken', data.data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.data));
                navigate('/');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                setError('API endpoint not found (404). Please verify VITE_API_BASE_URL.');
            } else {
                setError('Network error. Is the server running?');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-8 bg-gradient-to-br from-emerald-600 to-teal-700 text-center relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-inner border border-white/20">
                        <Car className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-wide">SANCHARI ADMIN</h1>
                    <p className="text-emerald-100 text-sm mt-1">Sign in to manage your platform</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-sm">
                            <AlertCircle size={18} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 placeholder-slate-600 text-white transition-all text-sm"
                                    placeholder="admin@hybridride.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 placeholder-slate-600 text-white transition-all text-sm"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-emerald-500 text-slate-950 rounded-xl font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-emerald-500/20 active:scale-[0.99] text-sm uppercase tracking-wider"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;

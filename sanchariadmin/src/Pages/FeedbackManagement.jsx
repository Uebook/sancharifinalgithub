import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    MessageSquare, Star, Calendar, User, 
    Smartphone, Info, Loader2, Search,
    Filter, MoreVertical, X, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FeedbackManagement = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('adminToken');
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/feedback`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.success) {
                    setFeedbacks(res.data.data);
                }
            } catch (err) {
                console.error('Fetch Feedbacks Error:', err);
                setError(err.response?.data?.message || 'Failed to connect to server');
            } finally {
                setLoading(false);
            }
        };

        fetchFeedbacks();
    }, []);

    const filteredFeedbacks = feedbacks.filter(fb => {
        const matchesFilter = filter === 'all' || fb.category === filter;
        const matchesSearch = fb.comment.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             fb.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getRatingColor = (rating) => {
        if (rating >= 4) return 'text-emerald-500 bg-emerald-500/10';
        if (rating >= 3) return 'text-amber-500 bg-amber-500/10';
        return 'text-rose-500 bg-rose-500/10';
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-white">App Feedback</h1>
                    <p className="text-white/60 text-sm font-medium uppercase tracking-widest">Monitor user satisfaction and feature requests</p>
                </div>
            </div>

            {/* Filter/Search Bar */}
            <div className="glass-panel p-4 rounded-[32px] border border-white/5 flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search feedback or users..." 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={18} className="text-white/20" />
                    <select 
                        className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer pr-10 font-bold"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all" className="bg-slate-900 text-white">All Categories</option>
                        <option value="bug" className="bg-slate-900 text-white">Bugs</option>
                        <option value="feature" className="bg-slate-900 text-white">Feature Request</option>
                        <option value="ui" className="bg-slate-900 text-white">UI/UX</option>
                        <option value="general" className="bg-slate-900 text-white">General</option>
                    </select>
                </div>
            </div>

            {/* Content List */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center gap-4 text-white/40">
                        <Loader2 size={48} className="animate-spin text-emerald-500" />
                        <p className="font-bold uppercase tracking-[0.2em] text-xs">Fetching Feedbacks...</p>
                    </div>
                ) : filteredFeedbacks.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center gap-4 text-white/20">
                        <MessageSquare size={64} />
                        <p className="font-bold uppercase tracking-[0.2em] text-xs">No feedback matches your criteria</p>
                    </div>
                ) : (
                    filteredFeedbacks.map((feedback) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={feedback._id}
                            className="glass-card rounded-[32px] p-6 border border-white/5 hover:border-emerald-500/20 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl grad-indigo flex items-center justify-center text-white font-black text-xl shadow-lg">
                                        {feedback.user?.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold group-hover:text-emerald-400 transition-colors">{feedback.user?.name || 'Unknown User'}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                feedback.user?.role === 'driver' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                                            }`}>
                                                {feedback.user?.role || 'user'}
                                            </span>
                                            <span className="text-[10px] text-white/20 font-bold">•</span>
                                            <div className="flex items-center gap-1 text-[10px] text-white/40 font-bold uppercase tracking-wider">
                                                <Calendar size={10} />
                                                {new Date(feedback.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-black text-sm ${getRatingColor(feedback.rating)}`}>
                                    <Star size={14} fill="currentColor" />
                                    {feedback.rating}.0
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-4 italic text-white/80 text-sm leading-relaxed">
                                "{feedback.comment}"
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                        {feedback.category || 'General'}
                                    </span>
                                    {feedback.deviceInfo?.model && (
                                        <div className="flex items-center gap-1.5 text-white/20">
                                            <Smartphone size={12} />
                                            <span className="text-[10px] font-bold truncate max-w-[100px]">{feedback.deviceInfo.model}</span>
                                        </div>
                                    )}
                                </div>
                                <button className="p-2 text-white/20 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FeedbackManagement;

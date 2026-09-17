import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Plus, Tag, Trash2, AlertCircle,
    Sparkles, Percent, Loader2, X, FileText, Edit2,
    Image as ImageIcon, Calendar, CheckCircle, Ban, Clock,
    Download, Power, Gift, BarChart2, DollarSign
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, children }) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-100"
                >
                    <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {children}
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

const Offers = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        badge: 'CITY POOLING',
        promoCode: '',
        discountType: 'flat',
        flatDiscountAmount: 0,
        discountPercentage: 0,
        maxDiscount: 0,
        minOrderAmount: 0,
        startDate: '',
        endDate: '',
        actionText: 'Explore',
        targetScreen: 'PassengerHome',
        pillText: '',
        isActive: true
    });

    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const fetchOffers = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/offers`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setOffers(res.data.data);
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            console.error('Failed to fetch customer offers:', err);
            setError(err.response?.data?.message || 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            badge: 'CITY POOLING',
            promoCode: '',
            discountType: 'flat',
            flatDiscountAmount: 0,
            discountPercentage: 0,
            maxDiscount: 0,
            minOrderAmount: 0,
            startDate: '',
            endDate: '',
            actionText: 'Explore',
            targetScreen: 'PassengerHome',
            pillText: '',
            isActive: true
        });
        setImageFile(null);
        setPreviewUrl(null);
        setEditingId(null);
    };

    const handleOpenCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (offer) => {
        setEditingId(offer._id);
        setFormData({
            title: offer.title || '',
            description: offer.description || '',
            badge: offer.badge || 'CITY POOLING',
            promoCode: offer.promoCode || '',
            discountType: offer.discountType || 'flat',
            flatDiscountAmount: offer.flatDiscountAmount || 0,
            discountPercentage: offer.discountPercentage || 0,
            maxDiscount: offer.maxDiscount || 0,
            minOrderAmount: offer.minOrderAmount || 0,
            startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 16) : '',
            endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 16) : '',
            actionText: offer.actionText || 'Explore',
            targetScreen: offer.targetScreen || 'PassengerHome',
            pillText: offer.pillText || '',
            isActive: offer.isActive !== undefined ? offer.isActive : true
        });

        if (offer.image) {
            const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
            const imgPath = offer.image.startsWith('http') ? offer.image : `${baseUrl}${offer.image.startsWith('/') ? '' : '/'}${offer.image}`;
            setPreviewUrl(imgPath);
        } else {
            setPreviewUrl(null);
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleSubmitOffer = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const token = localStorage.getItem('adminToken');

            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('badge', formData.badge);
            data.append('promoCode', formData.promoCode);
            data.append('discountType', formData.discountType);
            data.append('flatDiscountAmount', formData.flatDiscountAmount);
            data.append('discountPercentage', formData.discountPercentage);
            data.append('maxDiscount', formData.maxDiscount);
            data.append('minOrderAmount', formData.minOrderAmount);
            data.append('startDate', formData.startDate);
            data.append('endDate', formData.endDate);
            data.append('actionText', formData.actionText);
            data.append('targetScreen', formData.targetScreen);

            // Auto generate pill text if empty
            const generatedPill = formData.pillText || (formData.discountType === 'flat' 
                ? `Flat ₹${formData.flatDiscountAmount} OFF` 
                : `${formData.discountPercentage}% OFF (Up to ₹${formData.maxDiscount || '∞'})`);
            data.append('pillText', generatedPill);
            data.append('isActive', formData.isActive);

            if (imageFile) {
                data.append('image', imageFile);
            } else if (editingId && previewUrl && !previewUrl.startsWith('blob:')) {
                data.append('image', previewUrl);
            }

            const url = editingId
                ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/offers/${editingId}`
                : `${import.meta.env.VITE_API_BASE_URL}/api/admin/offers`;
            const method = editingId ? 'put' : 'post';

            const res = await axios[method](url, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success) {
                if (editingId) {
                    setOffers(offers.map(o => o._id === editingId ? res.data.data : o));
                } else {
                    setOffers([res.data.data, ...offers]);
                }
                setIsModalOpen(false);
                resetForm();
            } else {
                alert(res.data.message || 'Failed to save offer');
            }
        } catch (err) {
            console.error('Error saving offer:', err);
            alert(err.response?.data?.message || 'Failed to save offer');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (id) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/offers/${id}/toggle-active`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setOffers(offers.map(o => o._id === id ? res.data.data : o));
            } else {
                alert(res.data.message || 'Failed to toggle offer state');
            }
        } catch (err) {
            console.error('Error toggling offer:', err);
            alert(err.response?.data?.message || 'Server error while toggling offer');
        }
    };

    const handleDeleteOffer = async () => {
        if (!deletingId) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/offers/${deletingId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setOffers(offers.filter(o => o._id !== deletingId));
                setDeletingId(null);
            } else {
                alert(res.data.message || 'Failed to delete offer');
            }
        } catch (err) {
            console.error('Error deleting offer:', err);
            alert(err.response?.data?.message || 'Failed to delete offer');
        }
    };

    const exportCSV = () => {
        const headers = ['S.No,Offer ID,Title,Discount Type,Flat Discount (₹),Percentage (%),Max Discount (₹),Min Order Amount (₹),Badge,Promo Code,Pill Text,Status,Start Date,End Date,Redemptions'];
        const rows = offers.map((o, idx) => [
            idx + 1,
            `"${o._id}"`,
            `"${o.title || ''}"`,
            `"${o.discountType || 'flat'}"`,
            o.flatDiscountAmount || 0,
            o.discountPercentage || 0,
            o.maxDiscount || 0,
            o.minOrderAmount || 0,
            `"${o.badge || ''}"`,
            `"${o.promoCode || ''}"`,
            `"${o.pillText || ''}"`,
            `"${o.isActive ? 'Active' : 'Inactive'}"`,
            `"${o.startDate ? new Date(o.startDate).toLocaleDateString() : 'N/A'}"`,
            `"${o.endDate ? new Date(o.endDate).toLocaleDateString() : 'N/A'}"`,
            o.redemptionCount || 0
        ].join(','));

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `customer_offers_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter Logic
    const filteredOffers = offers.filter(o => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (o.title || '').toLowerCase().includes(query) ||
            (o.promoCode || '').toLowerCase().includes(query) ||
            (o.badge || '').toLowerCase().includes(query);

        const now = new Date();
        const isScheduled = o.startDate && new Date(o.startDate) > now;
        const isExpired = o.endDate && new Date(o.endDate) < now;

        if (filterStatus === 'active') return o.isActive && !isScheduled && !isExpired && matchesSearch;
        if (filterStatus === 'scheduled') return isScheduled && matchesSearch;
        if (filterStatus === 'inactive') return (!o.isActive || isExpired) && matchesSearch;
        return matchesSearch;
    });

    const activeCount = offers.filter(o => o.isActive && (!o.endDate || new Date(o.endDate) >= new Date())).length;
    const scheduledCount = offers.filter(o => o.startDate && new Date(o.startDate) > new Date()).length;
    const totalRedemptions = offers.reduce((acc, curr) => acc + (curr.redemptionCount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Gift className="text-emerald-400" size={28} /> Customer Offers Management
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Create, edit, activate, schedule, and track promotional offers applicable to Sanchari customers.</p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
                >
                    <Plus size={18} /> Create New Customer Offer
                </button>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                        Total Offers
                        <Tag size={16} className="text-blue-400" />
                    </div>
                    <div className="text-2xl font-black text-white mt-2">{offers.length}</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                        Active Offers
                        <CheckCircle size={16} className="text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mt-2">{activeCount}</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                        Scheduled Offers
                        <Clock size={16} className="text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-amber-400 mt-2">{scheduledCount}</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                        Total Redemptions
                        <BarChart2 size={16} className="text-purple-400" />
                    </div>
                    <div className="text-2xl font-black text-purple-400 mt-2">{totalRedemptions}</div>
                </div>
            </div>

            {/* Controls: Search, Filter, Export */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search offers by title, promo code, badge..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-800/80 text-white placeholder:text-slate-500 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <select
                            className="appearance-none bg-slate-800/80 border border-slate-700 pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Offers</option>
                            <option value="active">Active Now</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="inactive">Inactive / Expired</option>
                        </select>
                    </div>

                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl text-sm transition-all"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Offers Grid */}
            {loading ? (
                <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} /> Loading customer promotional offers...
                </div>
            ) : error ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex items-center gap-2 text-sm">
                    <AlertCircle size={18} /> {error}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOffers.map((offer) => {
                        const now = new Date();
                        const isScheduled = offer.startDate && new Date(offer.startDate) > now;
                        const isExpired = offer.endDate && new Date(offer.endDate) < now;

                        return (
                            <div key={offer._id} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all">
                                <div>
                                    {/* Image / Header */}
                                    <div className="h-40 bg-slate-800 relative overflow-hidden">
                                        {offer.image ? (
                                            <img
                                                src={offer.image.startsWith('http') ? offer.image : `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}${offer.image.startsWith('/') ? '' : '/'}${offer.image}`}
                                                alt={offer.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900/30 to-slate-900 text-slate-500">
                                                <Sparkles size={32} />
                                                <span className="text-xs font-semibold mt-1">Sanchari Promo</span>
                                            </div>
                                        )}

                                        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                                            <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black uppercase text-emerald-400 border border-emerald-500/30">
                                                {offer.badge}
                                            </span>
                                            {offer.promoCode && (
                                                <span className="px-2.5 py-1 bg-purple-500/80 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-purple-400/30">
                                                    {offer.promoCode}
                                                </span>
                                            )}
                                        </div>

                                        <div className="absolute top-3 right-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-md
                                                ${offer.isActive && !isScheduled && !isExpired
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    : isScheduled
                                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                }`}>
                                                {offer.isActive && !isScheduled && !isExpired ? 'Active' : isScheduled ? 'Scheduled' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Body Content */}
                                    <div className="p-5 space-y-3">
                                        <h3 className="text-lg font-bold text-white leading-tight">{offer.title}</h3>
                                        <p className="text-xs text-slate-400 line-clamp-2">{offer.description}</p>

                                        {/* Offer Type & Value Display */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">
                                                {offer.discountType === 'percentage' 
                                                    ? `${offer.discountPercentage}% OFF${offer.maxDiscount > 0 ? ` (Up to ₹${offer.maxDiscount})` : ''}`
                                                    : `Flat ₹${offer.flatDiscountAmount || 0} OFF`}
                                            </span>
                                            {offer.minOrderAmount > 0 && (
                                                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-700">
                                                    Min Ride: ₹{offer.minOrderAmount}
                                                </span>
                                            )}
                                        </div>

                                        {offer.pillText && (
                                            <div className="text-[11px] text-slate-400">
                                                Badge text: <span className="text-slate-200 font-semibold">{offer.pillText}</span>
                                            </div>
                                        )}

                                        <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                                            {offer.startDate && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-slate-500" />
                                                    <span>Starts: {new Date(offer.startDate).toLocaleString()}</span>
                                                </div>
                                            )}
                                            {offer.endDate && (
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={12} className="text-slate-500" />
                                                    <span>Expires: {new Date(offer.endDate).toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between text-slate-400 font-medium pt-1">
                                                <span>Redemptions:</span>
                                                <span className="text-white font-bold">{offer.redemptionCount || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Action Controls */}
                                <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
                                    <button
                                        onClick={() => handleToggleActive(offer._id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${offer.isActive
                                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                            }`}
                                    >
                                        <Power size={14} /> {offer.isActive ? 'Deactivate' : 'Activate'}
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenEditModal(offer)}
                                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            title="Edit Offer"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeletingId(offer._id)}
                                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                            title="Delete Offer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {filteredOffers.length === 0 && !loading && !error && (
                <div className="p-12 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl">
                    No customer offers found matching your criteria.
                </div>
            )}

            {/* Create / Edit Offer Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Edit Customer Offer' : 'Create Customer Offer'}
            >
                <form onSubmit={handleSubmitOffer} className="space-y-4">
                    {/* Offer Type Selector: Flat vs Percentage */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Offer Discount Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, discountType: 'flat' })}
                                className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-sm transition-all ${formData.discountType === 'flat'
                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                                }`}
                            >
                                <DollarSign size={18} /> Flat Amount (₹)
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, discountType: 'percentage' })}
                                className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-sm transition-all ${formData.discountType === 'percentage'
                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                                }`}
                            >
                                <Percent size={18} /> Percentage (%)
                            </button>
                        </div>
                    </div>

                    {/* Basic Offer Info */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Offer Title</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. Flat ₹50 Off First Ride"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                        <textarea
                            rows="2"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Offer terms or summary details..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    {/* Dynamic Discount Value & Minimum Ride Amount */}
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-4">
                        {formData.discountType === 'flat' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-emerald-400 mb-1">Flat Discount Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g. 50"
                                        value={formData.flatDiscountAmount}
                                        onChange={(e) => setFormData({ ...formData, flatDiscountAmount: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Minimum Ride / Order Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g. 150 (0 = No minimum)"
                                        value={formData.minOrderAmount}
                                        onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-emerald-400 mb-1">Discount Percentage (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="1"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g. 20"
                                        value={formData.discountPercentage}
                                        onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Max Discount Limit (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g. 100 (0 = No limit)"
                                        value={formData.maxDiscount}
                                        onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Min Ride Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g. 200 (0 = No minimum)"
                                        value={formData.minOrderAmount}
                                        onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Start Date & Time (Schedule)</label>
                            <input
                                type="datetime-local"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">End Date & Time (Expiration)</label>
                            <input
                                type="datetime-local"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                            {submitting && <Loader2 className="animate-spin" size={16} />}
                            {editingId ? 'Save Offer Changes' : 'Create Offer'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Offer Modal */}
            <Modal
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                title="Delete Offer"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-300">
                        Are you sure you want to delete this customer offer? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setDeletingId(null)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteOffer}
                            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-rose-500/20"
                        >
                            Delete Offer
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Offers;


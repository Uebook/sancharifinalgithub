import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Plus, Tag, Trash2, AlertCircle, 
    Sparkles, Percent, Loader2, X, FileText, Edit2, CheckCircle, XCircle
} from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import Pagination from '../Components/Pagination';

const DriverOffers = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        targetRides: 10,
        bonusAmount: 100,
        isActive: true
    });
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const fetchOffers = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/driver-offers`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setOffers(res.data.data);
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            console.error('Failed to fetch driver offers:', err);
            setError(err.response?.data?.message || 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    const handleAddOffer = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const token = localStorage.getItem('adminToken');
            
            const payload = {
                title: formData.title,
                description: formData.description,
                targetRides: Number(formData.targetRides),
                bonusAmount: Number(formData.bonusAmount),
                isActive: formData.isActive
            };

            const url = editingId 
                ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/driver-offers/${editingId}`
                : `${import.meta.env.VITE_API_BASE_URL}/api/admin/driver-offers`;
            const method = editingId ? 'put' : 'post';

            const res = await axios[method](url, payload, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.data.success) {
                if (editingId) {
                    setOffers(offers.map(o => o._id === editingId ? res.data.data : o));
                } else {
                    setOffers([res.data.data, ...offers]);
                }
                
                setIsModalOpen(false);
                setEditingId(null);
                setFormData({
                    title: '',
                    description: '',
                    targetRides: 10,
                    bonusAmount: 100,
                    isActive: true
                });
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save driver offer');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (offer) => {
        setEditingId(offer._id);
        setFormData({
            title: offer.title || '',
            description: offer.description || '',
            targetRides: offer.targetRides || 10,
            bonusAmount: offer.bonusAmount || 100,
            isActive: offer.isActive !== undefined ? offer.isActive : true
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this driver offer?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/driver-offers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOffers(offers.filter(o => o._id !== id));
        } catch (err) {
            alert('Failed to delete offer');
        }
    };

    const toggleStatus = async (offer) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/driver-offers/${offer._id}`, 
            { isActive: !offer.isActive },
            {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setOffers(offers.map(o => o._id === offer._id ? res.data.data : o));
            }
        } catch (err) {
            alert('Failed to update status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-white">Driver Bonus Trips</h1>
                    <p className="text-white/60 text-sm">Manage recurring offers and bonus trips for drivers based on rides completed.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            title: '',
                            description: '',
                            targetRides: 10,
                            bonusAmount: 100,
                            isActive: true
                        });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                    <Plus size={18} />
                    <span>Add Driver Offer</span>
                </button>
            </div>
            
            <div className="glass-card rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
                {error && (
                    <div className="m-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center gap-3">
                        <AlertCircle size={20} />
                        <span className="font-bold">{error}</span>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Offer Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Bonus Conditions</th>
                                <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-white/40">
                                            <Loader2 size={40} className="animate-spin text-emerald-500" />
                                            <p className="font-bold uppercase tracking-widest text-xs">Loading Offers...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : offers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-white/20">
                                            <Sparkles size={40} />
                                            <p className="font-bold uppercase tracking-widest text-xs">No Offers Found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : offers.slice((currentPage - 1) * limit, currentPage * limit).map(offer => (
                                <tr key={offer._id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">{offer.title}</div>
                                        <div className="text-xs font-bold text-white/50 mt-1 max-w-xs">{offer.description}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-xs font-bold text-white/70">
                                                Complete <span className="text-emerald-400 font-black">{offer.targetRides} rides</span>
                                            </div>
                                            <div className="text-xs font-bold text-white/70">
                                                Earn <span className="text-emerald-400 font-black">₹{offer.bonusAmount}</span> to Wallet
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <button 
                                            onClick={() => toggleStatus(offer)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors flex items-center gap-1 w-fit ${
                                            offer.isActive 
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                                        }`}>
                                            {offer.isActive ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                                            {offer.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-8 py-5 text-right space-x-2 whitespace-nowrap">
                                        <button 
                                            onClick={() => handleEditClick(offer)}
                                            className="p-2 text-white/20 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(offer._id)}
                                            className="p-2 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalEntries={offers.length}
                    limit={limit}
                    onPageChange={setCurrentPage}
                    onLimitChange={(l) => { setLimit(l); setCurrentPage(1); }}
                />
            </div>

            {/* Add Offer Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm overflow-y-auto">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="glass-card w-full max-w-lg rounded-[40px] p-8 border border-white/10 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto"
                    >
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-6 right-6 p-2 text-white/20 hover:text-white rounded-xl transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-white">{editingId ? 'Edit' : 'Add'} Driver Offer</h2>
                            <p className="text-white/40 text-sm font-bold uppercase tracking-widest mt-1">Configure ride bonus trips</p>
                        </div>

                        <form onSubmit={handleAddOffer} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4">Offer Title</label>
                                <div className="relative group">
                                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. 10 Rides Bonus"
                                        className="w-full bg-white/5 border border-white/10 rounded-[20px] pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all font-bold"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4">Description (Optional)</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-5 text-white/20 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                    <textarea
                                        rows="2"
                                        placeholder="e.g. Complete 10 rides to get a ₹100 bonus."
                                        className="w-full bg-white/5 border border-white/10 rounded-[20px] pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all font-bold resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4">Target Rides</label>
                                    <div className="relative group">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            placeholder="e.g. 10"
                                            className="w-full bg-white/5 border border-white/10 rounded-[20px] pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all font-bold"
                                            value={formData.targetRides}
                                            onChange={(e) => setFormData({...formData, targetRides: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4">Bonus Amount (₹)</label>
                                    <div className="relative group">
                                        <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                        <input
                                            required
                                            type="number"
                                            min="0"
                                            placeholder="e.g. 100"
                                            className="w-full bg-white/5 border border-white/10 rounded-[20px] pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all font-bold"
                                            value={formData.bonusAmount}
                                            onChange={(e) => setFormData({...formData, bonusAmount: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 ml-4 mt-2">
                                <label className="text-[12px] font-bold text-white cursor-pointer flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-white/10 border-white/20"
                                    />
                                    Active Offer
                                </label>
                            </div>

                            <button
                                disabled={submitting}
                                type="submit"
                                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white py-5 rounded-[24px] font-black text-lg transition-all shadow-xl shadow-emerald-500/20 active:scale-95 mt-4 flex items-center justify-center gap-3"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={24} />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>{editingId ? 'Save Changes' : 'Save Offer'}</span>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default DriverOffers;

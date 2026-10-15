import React, { useState, useEffect } from 'react';
import {
    Search, Filter, MoreVertical, Ban, CheckCircle, Clock,
    MapPin, IndianRupee, FileText, User, ChevronDown, Download, Eye, X,
    Edit, Trash2, ShieldAlert, UserCheck
} from 'lucide-react';
import axios from 'axios';
import Pagination from '../Components/Pagination';

const mockRides = [
    { id: 'R-101', passenger: 'Alice Johnson', driver: 'Mike Ross', date: '2025-02-10', time: '14:30', from: 'Central Station', to: 'Airport Terminal 1', amount: 25.50, status: 'completed' },
    { id: 'R-102', passenger: 'Bob Smith', driver: 'Harvey Specter', date: '2025-02-09', time: '09:15', from: 'Downtown', to: 'City Mall', amount: 12.00, status: 'cancelled' },
    { id: 'R-103', passenger: 'Alice Johnson', driver: 'Louis Litt', date: '2025-02-08', time: '18:45', from: 'Office Park', to: 'Home', amount: 18.75, status: 'completed' },
    { id: 'R-104', passenger: 'Diana Prince', driver: 'Donna Paulsen', date: '2025-02-08', time: '12:00', from: 'Museum', to: 'Cafe', amount: 8.50, status: 'completed' },
    { id: 'R-105', passenger: 'Alice Johnson', driver: 'Mike Ross', date: '2025-02-07', time: '08:00', from: 'Home', to: 'Office Park', amount: 19.00, status: 'completed' },
    { id: 'R-106', passenger: 'Alice Johnson', driver: 'Harvey Specter', date: '2025-02-05', time: '19:30', from: 'Airport', to: 'Home', amount: 28.00, status: 'cancelled' },
];

const mockTransactions = [
    { id: 'TX-501', passenger: 'Alice Johnson', type: 'Payment', amount: 25.50, date: '2025-02-10', method: 'Credit Card', status: 'success' },
    { id: 'TX-502', passenger: 'Bob Smith', type: 'Refund', amount: 12.00, date: '2025-02-09', method: 'Wallet', status: 'processed' },
    { id: 'TX-503', passenger: 'Charlie Brown', type: 'Payment', amount: 15.00, date: '2025-02-08', method: 'Cash', status: 'success' },
];

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-100">
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

const PassengerManagement = ({ view = 'directory' }) => {
    const [passengers, setPassengers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedPassenger, setSelectedPassenger] = useState(null);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [deletingCustomer, setDeletingCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewingImage, setViewingImage] = useState(null);

    // Pagination States
    const [dirPage, setDirPage] = useState(1);
    const [dirLimit, setDirLimit] = useState(10);
    const [ridesPage, setRidesPage] = useState(1);
    const [ridesLimit, setRidesLimit] = useState(10);
    const [txPage, setTxPage] = useState(1);
    const [txLimit, setTxLimit] = useState(10);

    useEffect(() => {
        fetchPassengers();
    }, []);

    const fetchPassengers = async () => {
        try {
            setError(null);
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setError('No admin token found. Please sign in again.');
                return;
            }
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/passengers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                const formatted = res.data.data.map(p => ({
                    id: p._id,
                    applicationId: p.applicationId || (p._id ? `SAN-C-${p._id.slice(-6).toUpperCase()}` : 'N/A'),
                    name: p.name || '',
                    phone: p.phone || '',
                    email: p.email || '',
                    role: p.role || 'passenger',
                    profileImage: p.profileImage || '',
                    isActive: p.isActive !== false,
                    isBlocked: Boolean(p.isBlocked),
                    status: p.isBlocked ? 'blocked' : (p.isActive === false ? 'inactive' : 'active'),
                    joinDate: new Date(p.createdAt).toLocaleDateString(),
                    rawJoinDate: p.createdAt,
                    updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleString() : 'N/A',
                    totalRides: p.totalRides || 0,
                    walletBalance: p.walletBalance || 0,
                    rating: p.ratings?.average || 5.0,
                    ratingCount: p.ratings?.count || 0,
                    address: p.address || 'Location Unavailable',
                    emergencyContact: p.emergencyContact || { name: 'N/A', phone: 'N/A' },
                    verificationStatus: p.verificationStatus || { email: false, phone: false, idCard: false, communityTrusted: false },
                    ridePersonality: p.ridePersonality || ['Quiet Ride', 'AC On'],
                    travelStats: p.travelStats || { totalSavings: 0, co2Saved: 0 },
                    savedPlaces: p.savedPlaces || [],
                    fcmToken: p.fcmToken || 'N/A',
                    avatar: (typeof p.profileImage === 'string' && p.profileImage) ? (() => {
                        if (p.profileImage.startsWith('http') || p.profileImage.startsWith('data:')) return p.profileImage;
                        const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
                        const filePath = p.profileImage.startsWith('/') ? p.profileImage : `/${p.profileImage}`;
                        return `${baseUrl}${filePath}`;
                    })() : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'User')}&background=random`
                }));
                setPassengers(formatted);
            } else {
                setError('Failed to fetch: ' + res.data.message);
            }
        } catch (err) {
            console.error('Failed to fetch passengers:', err);
            setError(err.response?.data?.message || err.message || 'Network Error or server unreachable');
        } finally {
            setLoading(false);
        }
    };

    // --- Search & Filter Logic ---
    const filteredPassengers = passengers.filter(p => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (p.name || '').toLowerCase().includes(query) ||
            (p.phone || '').includes(searchQuery) ||
            (p.email || '').toLowerCase().includes(query) ||
            (p.applicationId || '').toLowerCase().includes(query) ||
            (p.id || '').toLowerCase().includes(query);
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const sortedPassengers = [...filteredPassengers].sort((a, b) => {
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'rides') return (b.totalRides || 0) - (a.totalRides || 0);
        if (sortBy === 'oldest') return new Date(a.rawJoinDate || a.joinDate) - new Date(b.rawJoinDate || b.joinDate);
        return new Date(b.rawJoinDate || b.joinDate) - new Date(a.rawJoinDate || a.joinDate);
    });

    // --- Actions ---
    const toggleBlockStatus = async (id) => {
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                alert("Session expired. Please log in again.");
                return;
            }

            const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/passengers/${id}/block`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setPassengers(passengers.map(p =>
                    p.id === id ? { ...p, status: res.data.data.isBlocked ? 'blocked' : 'active', isBlocked: res.data.data.isBlocked } : p
                ));
            } else {
                alert(res.data.message || "Failed to toggle block status");
            }
        } catch (error) {
            console.error('Error toggling block status:', error);
            alert(error.response?.data?.message || 'Error communicating with server');
        }
    };

    const handleSaveCustomer = async (e) => {
        e.preventDefault();
        if (!editingCustomer) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/passengers/${editingCustomer.id}`, {
                name: editingCustomer.name,
                email: editingCustomer.email,
                phone: editingCustomer.phone,
                role: editingCustomer.role,
                profileImage: editingCustomer.profileImage,
                isActive: editingCustomer.isActive,
                isBlocked: editingCustomer.isBlocked,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setPassengers(passengers.map(p => p.id === editingCustomer.id ? {
                    ...p,
                    ...editingCustomer,
                    status: editingCustomer.isBlocked ? 'blocked' : (editingCustomer.isActive === false ? 'inactive' : 'active')
                } : p));
                setEditingCustomer(null);
            } else {
                alert(res.data.message || 'Failed to update customer details');
            }
        } catch (err) {
            console.error('Error updating customer:', err);
            alert(err.response?.data?.message || 'Failed to update customer');
        }
    };

    const handleDeleteCustomer = async () => {
        if (!deletingCustomer) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/passengers/${deletingCustomer.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setPassengers(passengers.filter(p => p.id !== deletingCustomer.id));
                setDeletingCustomer(null);
            } else {
                alert(res.data.message || 'Failed to delete customer');
            }
        } catch (err) {
            console.error('Error deleting customer:', err);
            alert(err.response?.data?.message || 'Failed to delete customer');
        }
    };

    const exportCSV = () => {
        const headers = ['S.No,Application ID,Customer ID,Name,Email,Phone,Status,Join Date,Total Rides,Wallet Balance (INR)'];
        const rows = sortedPassengers.map((p, idx) => [
            idx + 1,
            `"${p.applicationId || 'N/A'}"`,
            `"${p.id}"`,
            `"${p.name || ''}"`,
            `"${p.email || ''}"`,
            `"${p.phone || ''}"`,
            `"${p.status}"`,
            `"${p.joinDate}"`,
            p.totalRides || 0,
            p.walletBalance || 0
        ].join(','));

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `sanchari_customers_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [passengerRides, setPassengerRides] = useState([]);
    const [passengerTransactions, setPassengerTransactions] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        if (selectedPassenger) {
            fetchPassengerDetails(selectedPassenger.id);
        }
    }, [selectedPassenger]);

    const fetchPassengerDetails = async (id) => {
        try {
            setDetailsLoading(true);
            const token = localStorage.getItem('adminToken');

            const [ridesRes, txRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/passengers/${id}/rides`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/passengers/${id}/transactions`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (ridesRes.data.success) {
                setPassengerRides(ridesRes.data.data);
            }
            if (txRes.data.success) {
                setPassengerTransactions(txRes.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch customer details:', err);
        } finally {
            setDetailsLoading(false);
        }
    };

    // --- Render Helpers ---
    const StatusBadge = ({ status }) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center w-fit gap-1 capitalize
            ${status === 'active' || status === 'success' || status === 'completed' || status === 'processed'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : status === 'blocked' || status === 'cancelled'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
            {status === 'active' || status === 'success' || status === 'completed' || status === 'processed' ? <CheckCircle size={12} /> :
                status === 'blocked' || status === 'cancelled' ? <Ban size={12} /> : <Clock size={12} />}
            {status}
        </span>
    );

    // --- Views ---
    const renderPassengerDetails = () => {
        const p = selectedPassenger;
        const completedRides = passengerRides.filter(r => r.status === 'completed');

        return (
            <div className="space-y-6">
                <button
                    onClick={() => setSelectedPassenger(null)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium text-sm"
                >
                    <ChevronDown className="rotate-90" size={18} /> Back to Customer List
                </button>

                {/* Main Profile Header Card */}
                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="h-28 w-28 rounded-2xl border-2 border-slate-700 overflow-hidden flex-shrink-0 cursor-pointer hover:border-emerald-500 transition-colors" onClick={() => setViewingImage({ url: p.avatar, title: `${p.name}'s Profile` })}>
                            <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2 flex-wrap">
                                        {p.name}
                                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono uppercase">
                                            {p.role}
                                        </span>
                                        {p.applicationId && (
                                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                                                App ID: {p.applicationId}
                                            </span>
                                        )}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <StatusBadge status={p.status} />
                                        <span className="text-xs text-slate-400">• Joined {p.joinDate}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-amber-400">{p.rating} ⭐ <span className="text-xs text-slate-500">({p.ratingCount} ratings)</span></div>
                                    <div className="text-sm text-slate-400">{completedRides.length} Completed Rides</div>
                                    <div className="text-sm text-emerald-400 font-bold mt-1">Wallet Balance: ₹{p.walletBalance}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid of Profile Information Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* 1. Core Profile & Contact Details */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-3">
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                            <User size={16} className="text-sky-400" /> Core Identity & Contact
                        </h3>
                        <div className="space-y-2 text-xs divide-y divide-slate-800/60">
                            <div className="pt-1 flex justify-between"><span className="text-slate-400">Application ID:</span> <span className="text-emerald-400 font-mono font-bold">{p.applicationId || 'N/A'}</span></div>
                            <div className="pt-2 flex justify-between"><span className="text-slate-400">Customer ID:</span> <span className="text-slate-400 font-mono">{p.id}</span></div>
                            <div className="pt-2 flex justify-between"><span className="text-slate-400">Full Name:</span> <span className="text-slate-200 font-semibold">{p.name}</span></div>
                            <div className="pt-2 flex justify-between"><span className="text-slate-400">Email Address:</span> <span className="text-slate-200">{p.email || 'N/A'}</span></div>
                            <div className="pt-2 flex justify-between"><span className="text-slate-400">Phone Number:</span> <span className="text-slate-200 font-semibold">{p.phone || 'N/A'}</span></div>
                            <div className="pt-2 flex justify-between"><span className="text-slate-400">Role:</span> <span className="text-indigo-400 font-bold uppercase">{p.role}</span></div>
                            <div className="pt-2 flex justify-between"><span className="text-slate-400">Active Status (isActive):</span> <span className={p.isActive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{p.isActive ? 'True (Active)' : 'False (Deactivated)'}</span></div>
                            <div className="pt-2 flex justify-between"><span className="text-slate-400">Suspension (isBlocked):</span> <span className={p.isBlocked ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{p.isBlocked ? 'True (Blocked)' : 'False (Unblocked)'}</span></div>
                        </div>
                    </div>

                    {/* 2. Emergency Contact */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-3">
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                            <ShieldAlert size={16} className="text-rose-400" /> Emergency Contact
                        </h3>
                        <div className="space-y-2 text-xs divide-y divide-slate-800/60">
                            <div className="pt-1 flex justify-between"><span className="text-slate-400">Contact Person:</span> <span className="text-slate-200 font-bold">{p.emergencyContact?.name || 'N/A'}</span></div>
                            <div className="pt-2 flex justify-between"><span className="text-slate-400">Contact Phone:</span> <span className="text-slate-200 font-bold">{p.emergencyContact?.phone || 'N/A'}</span></div>
                        </div>
                    </div>

                    {/* 3. Verification Badges */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-3">
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle size={16} className="text-emerald-400" /> Verification Badges
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className={`p-2.5 rounded-xl border flex flex-col items-center ${p.verificationStatus?.email ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
                                <span className="font-bold">Email</span>
                                <span>{p.verificationStatus?.email ? 'Verified ✓' : 'Unverified ✗'}</span>
                            </div>
                            <div className={`p-2.5 rounded-xl border flex flex-col items-center ${p.verificationStatus?.phone ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
                                <span className="font-bold">Phone</span>
                                <span>{p.verificationStatus?.phone ? 'Verified ✓' : 'Unverified ✗'}</span>
                            </div>
                            <div className={`p-2.5 rounded-xl border flex flex-col items-center ${p.verificationStatus?.idCard ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
                                <span className="font-bold">ID Card</span>
                                <span>{p.verificationStatus?.idCard ? 'Verified ✓' : 'Unverified ✗'}</span>
                            </div>
                            <div className={`p-2.5 rounded-xl border flex flex-col items-center ${p.verificationStatus?.communityTrusted ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
                                <span className="font-bold">Trusted</span>
                                <span>{p.verificationStatus?.communityTrusted ? 'Badge ✓' : 'None ✗'}</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Ride Preferences & Personality Tags */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-3">
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={16} className="text-purple-400" /> Ride Personality & Tags
                        </h3>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {(p.ridePersonality || []).map((tag, idx) => (
                                <span key={idx} className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full text-xs font-semibold">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* 5. Travel Telemetry Stats */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-3">
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                            <IndianRupee size={16} className="text-emerald-400" /> Travel Telemetry & Savings
                        </h3>
                        <div className="space-y-2 text-xs divide-y divide-slate-800/60">
                            <div className="pt-1 flex justify-between"><span className="text-slate-400">Total Money Saved:</span> <span className="text-emerald-400 font-bold text-sm">₹{p.travelStats?.totalSavings || 0}</span></div>
                            <div className="pt-2 flex justify-between"><span className="text-slate-400">CO2 Emissions Saved:</span> <span className="text-sky-400 font-bold text-sm">{p.travelStats?.co2Saved || 0} kg</span></div>
                        </div>
                    </div>

                    {/* 6. System Audit Telemetry */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-3">
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                            <Clock size={16} className="text-amber-400" /> System Audit Telemetry
                        </h3>
                        <div className="space-y-2 text-xs divide-y divide-slate-800/60">
                            <div className="pt-1 flex justify-between"><span className="text-slate-400">Account Registered:</span> <span className="text-slate-300 font-mono">{p.joinDate}</span></div>
                            <div className="pt-2 flex justify-between"><span className="text-slate-400">Profile Updated:</span> <span className="text-slate-300 font-mono">{p.updatedAt}</span></div>
                            <div className="pt-2 flex justify-between"><span className="text-slate-400">Push FCM Token:</span> <span className="text-slate-500 font-mono text-[10px] truncate max-w-[140px]">{p.fcmToken}</span></div>
                        </div>
                    </div>
                </div>

                {detailsLoading ? (
                    <div className="p-8 text-center text-sm text-slate-400">Loading customer rides & transaction history...</div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Completed Rides */}
                        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/40">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <CheckCircle size={18} className="text-emerald-400" />
                                    Completed Rides ({completedRides.length})
                                </h3>
                            </div>
                            <div className="overflow-x-auto max-h-[400px]">
                                <table className="w-full">
                                    <thead className="bg-slate-800/60 border-b border-slate-800">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Route</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Details</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Fare</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {completedRides.length > 0 ? completedRides.map(ride => (
                                            <tr key={ride._id} className="hover:bg-slate-800/30">
                                                <td className="px-4 py-3 max-w-[200px] truncate">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs text-slate-300 flex items-center gap-1 truncate" title={ride.pickup?.address}><div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></div> {ride.pickup?.address}</span>
                                                        <span className="text-xs text-slate-300 flex items-center gap-1 truncate" title={ride.dropoff?.address}><div className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0"></div> {ride.dropoff?.address}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-xs font-medium text-slate-200">{new Date(ride.createdAt).toLocaleDateString()}</div>
                                                    <div className="text-xs text-slate-400">{ride.durationMins || 0}m • {ride.driver ? ride.driver.name : 'Driver Unassigned'}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-emerald-400 text-sm">
                                                    ₹{(ride.finalFare || ride.offeredFare || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="3" className="px-6 py-8 text-center text-sm text-slate-400">No completed rides recorded.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/40">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <IndianRupee size={18} className="text-blue-400" />
                                    Recent Transactions ({passengerTransactions.length})
                                </h3>
                            </div>
                            <div className="overflow-x-auto max-h-[400px]">
                                <table className="w-full">
                                    <thead className="bg-slate-800/60 border-b border-slate-800">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Type / Date</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Method</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Amt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {passengerTransactions.length > 0 ? passengerTransactions.map(tx => (
                                            <tr key={tx.id} className="hover:bg-slate-800/30">
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-medium text-slate-200">{tx.type}</span>
                                                        <span className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-xs text-slate-300 capitalize">{tx.method}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className={`font-semibold text-sm ${tx.type === 'Refund' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                        {tx.type === 'Refund' ? '-' : '+'}₹{(tx.amount || 0).toFixed(2)}
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="3" className="px-6 py-8 text-center text-sm text-slate-400">No transactions recorded.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderDirectory = () => (
        <div className="space-y-6">
            {/* Search, Filter & Controls */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search customers by name, phone, email, ID..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-slate-800/80 text-white placeholder:text-slate-500 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            className="appearance-none bg-slate-800/80 border border-slate-700 pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="blocked">Blocked</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    {/* Sort Selector */}
                    <div className="relative">
                        <select
                            className="appearance-none bg-slate-800/80 border border-slate-700 pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="newest">Sort: Newest First</option>
                            <option value="oldest">Sort: Oldest First</option>
                            <option value="name">Sort: Name (A-Z)</option>
                            <option value="rides">Sort: Most Rides</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    {/* Export CSV Button */}
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl text-sm transition-all"
                        title="Export Registered Customers to CSV"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                {error && (
                    <div className="p-4 m-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl flex items-center gap-2 text-sm">
                        <ShieldAlert size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {!error && (
                    <div className="overflow-x-auto w-full pb-2">
                        <table className="w-full min-w-[900px] whitespace-nowrap text-left">
                            <thead className="bg-slate-800/60 border-b border-slate-800">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">S.No.</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Info</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Join Date</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rides</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {sortedPassengers
                                    .slice((dirPage - 1) * dirLimit, dirPage * dirLimit)
                                    .map((passenger, index) => (
                                    <tr
                                        key={passenger.id}
                                        onClick={() => setSelectedPassenger(passenger)}
                                        className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">
                                            {(dirPage - 1) * dirLimit + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full border border-slate-700 overflow-hidden flex-shrink-0 bg-slate-800">
                                                    <img src={passenger.avatar} alt={passenger.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                                                        {passenger.name}
                                                        {passenger.applicationId && (
                                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-500/30">
                                                                {passenger.applicationId}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-400">Rating: {passenger.rating} ⭐</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-200">{passenger.phone}</div>
                                            <div className="text-xs text-slate-400">{passenger.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={passenger.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                            {passenger.joinDate}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-medium">
                                            {passenger.totalRides}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => setSelectedPassenger(passenger)}
                                                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                    title="View Profile Details"
                                                >
                                                    <Eye size={18} />
                                                </button>

                                                <button
                                                    onClick={() => setEditingCustomer(passenger)}
                                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Edit Customer Details"
                                                >
                                                    <Edit size={18} />
                                                </button>

                                                <button
                                                    onClick={() => toggleBlockStatus(passenger.id)}
                                                    className={`p-2 rounded-lg transition-colors
                                                            ${passenger.status === 'blocked'
                                                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                                                            : 'text-rose-400 hover:bg-rose-500/10'}`}
                                                    title={passenger.status === 'blocked' ? 'Unblock Customer' : 'Block Customer'}
                                                >
                                                    {passenger.status === 'blocked' ? <UserCheck size={18} /> : <Ban size={18} />}
                                                </button>

                                                <button
                                                    onClick={() => setDeletingCustomer(passenger)}
                                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                    title="Delete Customer Account"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {!error && sortedPassengers.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-400">
                        {loading ? 'Loading registered customers...' : 'No registered customers found matching your search.'}
                    </div>
                )}
                <Pagination
                    currentPage={dirPage}
                    totalItems={sortedPassengers.length}
                    itemsPerPage={dirLimit}
                    onPageChange={setDirPage}
                    onItemsPerPageChange={setDirLimit}
                />
            </div>
        </div>
    );

    const renderRideHistory = () => (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-800/60 border-b border-slate-800">
                        <tr>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Ride ID</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Customer</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Driver</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Route</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Date & Time</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Amount</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {mockRides.map((ride) => (
                            <tr key={ride.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">{ride.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{ride.passenger}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{ride.driver}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1 text-xs text-slate-400"><div className="w-2 h-2 rounded-full bg-blue-400"></div> {ride.from}</div>
                                        <div className="flex items-center gap-1 text-xs text-slate-400"><div className="w-2 h-2 rounded-full bg-rose-400"></div> {ride.to}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                    <div>{ride.date}</div>
                                    <div className="text-xs text-slate-500">{ride.time}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-400">₹{ride.amount.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={ride.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderTransactions = () => (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-800/60 border-b border-slate-800">
                        <tr>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Transaction ID</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Customer</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Type</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Method</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Date</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Amount</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {mockTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">{tx.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{tx.passenger}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{tx.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{tx.method}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{tx.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                    <span className={tx.type === 'Refund' ? 'text-rose-400' : 'text-emerald-400'}>
                                        {tx.type === 'Refund' ? '-' : '+'}₹{tx.amount.toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={tx.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {selectedPassenger ? (
                <div className="p-2">
                    {renderPassengerDetails()}
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">
                                {view === 'directory' && 'Customer Management'}
                                {view === 'ride_history' && 'Customer Ride History'}
                                {view === 'transactions' && 'Payment & Refund History'}
                            </h1>
                            <p className="text-xs text-slate-400 mt-1">
                                {view === 'directory' && 'View, search, filter, and manage registered Sanchari customers.'}
                                {view === 'ride_history' && 'Track all historical rides booked by customers.'}
                                {view === 'transactions' && 'Overview of customer wallet payments and refund logs.'}
                            </p>
                        </div>
                    </div>

                    {view === 'directory' && renderDirectory()}
                    {view === 'ride_history' && renderRideHistory()}
                    {view === 'transactions' && renderTransactions()}
                </>
            )}

            {/* Edit Customer Modal */}
            <Modal
                isOpen={!!editingCustomer}
                onClose={() => setEditingCustomer(null)}
                title="Edit Registered Customer"
            >
                {editingCustomer && (
                    <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
                        {/* 1. Customer Name & Phone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Full Name (name)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    value={editingCustomer.name || ''}
                                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Phone Number (phone)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    value={editingCustomer.phone || ''}
                                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* 3. Email Address & Role */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address (email)</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    value={editingCustomer.email || ''}
                                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Account Role (role)</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm cursor-pointer"
                                    value={editingCustomer.role || 'passenger'}
                                    onChange={(e) => setEditingCustomer({ ...editingCustomer, role: e.target.value })}
                                >
                                    <option value="passenger">Passenger</option>
                                    <option value="driver">Driver</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        {/* 4. Profile Picture URL */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Profile Picture / Avatar URL (profileImage)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                                value={editingCustomer.profileImage || ''}
                                onChange={(e) => setEditingCustomer({ ...editingCustomer, profileImage: e.target.value })}
                                placeholder="https://domain.com/avatar.jpg"
                            />
                        </div>

                        {/* 5. Active Status & Suspension Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Active Status (isActive)</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm cursor-pointer"
                                    value={editingCustomer.isActive ? 'true' : 'false'}
                                    onChange={(e) => setEditingCustomer({ ...editingCustomer, isActive: e.target.value === 'true' })}
                                >
                                    <option value="true">Active (true)</option>
                                    <option value="false">Deactivated (false)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Suspension Status (isBlocked)</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm cursor-pointer"
                                    value={editingCustomer.isBlocked ? 'true' : 'false'}
                                    onChange={(e) => setEditingCustomer({ ...editingCustomer, isBlocked: e.target.value === 'true' })}
                                >
                                    <option value="false">Unblocked (false)</option>
                                    <option value="true">Blocked / Suspended (true)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setEditingCustomer(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Delete Customer Confirmation Modal */}
            <Modal
                isOpen={!!deletingCustomer}
                onClose={() => setDeletingCustomer(null)}
                title="Delete Customer Account"
            >
                {deletingCustomer && (
                    <div className="space-y-4">
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                            <ShieldAlert className="text-rose-400" size={24} />
                            <div>
                                <h4 className="text-sm font-bold text-rose-400">Warning: Irreversible Action</h4>
                                <p className="text-xs text-slate-300 mt-0.5">
                                    Are you sure you want to permanently delete customer <span className="font-bold text-white">{deletingCustomer.name}</span> ({deletingCustomer.phone})?
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setDeletingCustomer(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteCustomer}
                                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-rose-500/20"
                            >
                                Delete Customer
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Image Viewer Modal */}
            <Modal
                isOpen={!!viewingImage}
                onClose={() => setViewingImage(null)}
                title={viewingImage?.title || 'Profile View'}
            >
                <div className="flex flex-col items-center">
                    <div className="w-full rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
                        <img
                            src={viewingImage?.url}
                            alt={viewingImage?.title}
                            className="w-full h-auto object-contain max-h-[70vh]"
                        />
                    </div>
                    <a
                        href={viewingImage?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors"
                    >
                        <Download size={16} /> Open Original Image
                    </a>
                </div>
            </Modal>
        </div>
    );
};

export default PassengerManagement;

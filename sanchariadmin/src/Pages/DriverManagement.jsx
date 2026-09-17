import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Search, Filter, MoreVertical, Ban, CheckCircle, Clock,
    MapPin, DollarSign, FileText, User, ChevronDown, Download,
    Plus, AlertTriangle, Star, X, Eye, ThumbsUp, ThumbsDown,
    Edit, Trash2, ShieldAlert, ShieldCheck, UserCheck, UserX, Car, Bike,
    CreditCard, Shield, Phone, Mail, Award, AlertCircle, Compass, Wifi, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Pagination from '../Components/Pagination';

const mockRides = [
    { id: 'R-201', passenger: 'Rachel Zane', driver: 'Mike Ross', date: '2025-02-10', time: '10:00', from: 'Court House', to: 'Firm', amount: 15.00, status: 'completed' },
    { id: 'R-202', passenger: 'Jessica Pearson', driver: 'Harvey Specter', date: '2025-02-09', time: '14:30', from: 'Firm', to: 'Restaurant', amount: 25.00, status: 'completed' },
    { id: 'R-203', passenger: 'Sheila Sazs', driver: 'Louis Litt', date: '2025-02-08', time: '18:00', from: 'Harvard', to: 'Hotel', amount: 10.00, status: 'cancelled' },
    { id: 'R-204', passenger: 'Trevor Evans', driver: 'Mike Ross', date: '2025-02-07', time: '09:00', from: 'Apartment', to: 'Office', amount: 12.00, status: 'completed' },
    { id: 'R-205', passenger: 'Scottie', driver: 'Harvey Specter', date: '2025-02-06', time: '20:00', from: 'Airport', to: 'Penthouse', amount: 45.00, status: 'cancelled' },
];

const earningsData = [
    { id: 1, driver: 'Mike Ross', daily: 150.00, weekly: 850.00, monthly: 3200.00, rating: 4.9, rides: 124 },
    { id: 2, driver: 'Harvey Specter', daily: 450.00, weekly: 2800.00, monthly: 11500.00, rating: 5.0, rides: 89 },
    { id: 3, driver: 'Louis Litt', daily: 45.00, weekly: 200.00, monthly: 800.00, rating: 4.1, rides: 22 },
];

const complaintsData = [
    { id: 'C-001', driver: 'Louis Litt', passenger: 'Alice Johnson', date: '2025-02-05', issue: 'Rude behavior', status: 'pending' },
    { id: 'C-002', driver: 'Mike Ross', passenger: 'Bob Brown', date: '2025-01-20', issue: 'Late arrival', status: 'resolved' },
];

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

const DriverManagement = ({ view = 'directory' }) => {
    const [drivers, setDrivers] = useState([]);
    const [allPartners, setAllPartners] = useState([]);
    const [onboardingList, setOnboardingList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterVehicleType, setFilterVehicleType] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    // Modals & Selection State
    const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState(null);
    const [deletingPartner, setDeletingPartner] = useState(null);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [driverRides, setDriverRides] = useState([]);
    const [viewingImage, setViewingImage] = useState(null);
    const [selectedDriverDocs, setSelectedDriverDocs] = useState({});
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);

    // Pagination States
    const [dirPage, setDirPage] = useState(1);
    const [dirLimit, setDirLimit] = useState(10);
    const [onbPage, setOnbPage] = useState(1);
    const [onbLimit, setOnbLimit] = useState(10);
    const [compPage, setCompPage] = useState(1);
    const [compLimit, setCompLimit] = useState(10);

    // Fetch Drivers / Partners
    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/drivers`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                const mappedPartners = res.data.data.map(d => ({
                    id: d._id,
                    name: d.name,
                    phone: d.phone || 'N/A',
                    email: d.email || 'N/A',
                    role: d.role || 'driver',
                    status: d.isBlocked ? 'suspended' : (d.driverApprovalStatus === 'approved' ? 'active' : (d.driverApprovalStatus === 'rejected' ? 'rejected' : 'pending')),
                    approvalStatus: d.driverApprovalStatus || 'pending',
                    isBlocked: d.isBlocked || false,
                    isActive: d.isActive !== undefined ? d.isActive : true,
                    rejectionReason: d.rejectionReason || '',
                    walletBalance: d.walletBalance || 0,
                    licenseNumber: d.driverDetails?.licenseNumber || 'N/A',
                    vehicleMake: d.driverDetails?.vehicle?.make || '',
                    vehicleModel: d.driverDetails?.vehicle?.model || 'Pending',
                    vehicle: `${d.driverDetails?.vehicle?.make || ''} ${d.driverDetails?.vehicle?.model || ''}`.trim() || 'Pending',
                    vehicleType: d.driverDetails?.vehicle?.type || 'CAR',
                    fuelType: d.driverDetails?.vehicle?.fuelType || 'Petrol',
                    vehicleColor: d.driverDetails?.vehicle?.color || 'N/A',
                    vehicleYear: d.driverDetails?.vehicle?.year || 'N/A',
                    seatingCapacity: d.driverDetails?.vehicle?.seatingCapacity || 4,
                    bootSpace: d.driverDetails?.vehicle?.bootSpace || 'N/A',
                    plateNumber: d.driverDetails?.vehicle?.plateNumber || 'N/A',
                    joinDate: new Date(d.createdAt).toLocaleDateString(),
                    rawJoinDate: d.createdAt,
                    address: d.address || 'Location Pending',
                    rating: d.ratings?.average || d.driverDetails?.ratings?.average || 5.0,
                    ratingCount: d.ratings?.count || d.driverDetails?.ratings?.count || 0,
                    totalEarnings: d.driverDetails?.earnings || 0,
                    totalRides: d.totalRides ?? d.driverDetails?.totalRides ?? 0,
                    isOnline: d.driverDetails?.isOnline || false,
                    isAvailable: d.driverDetails?.isAvailable || false,
                    bankDetails: d.driverDetails?.bankDetails || {},
                    preferences: d.driverDetails?.preferences || {},
                    verificationStatus: d.verificationStatus || {},
                    emergencyContact: d.emergencyContact || {},
                    avatar: d.profileImage ? (() => {
                        if (d.profileImage.startsWith('http') || d.profileImage.startsWith('data:image')) return d.profileImage;
                        const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
                        const filePath = d.profileImage.startsWith('/') ? d.profileImage : `/${d.profileImage}`;
                        return `${baseUrl}${filePath}`;
                    })() : `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=random`,
                    driverDetails: d.driverDetails,
                    documents: d.driverDetails?.documents ? Object.fromEntries(
                        Object.entries(d.driverDetails.documents).map(([k, v]) => {
                            if (!v) return [k, v];
                            if (v.startsWith('http') || v.startsWith('data:image')) return [k, v];
                            const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
                            const filePath = v.startsWith('/') ? v : `/${v}`;
                            return [k, `${baseUrl}${filePath}`];
                        })
                    ) : {}
                }));

                setAllPartners(mappedPartners);
                setDrivers(mappedPartners.filter(d => d.status === 'active' || d.status === 'suspended'));
                setOnboardingList(mappedPartners.filter(d => d.status === 'pending' || d.status === 'rejected'));
            }
        } catch (error) {
            console.error("Failed to fetch partners", error);
        }
    };

    const fetchDriverRides = async (driverId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/drivers/${driverId}/rides`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setDriverRides(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch partner rides", error);
            setDriverRides([]);
        }
    };

    const fetchDriverDocuments = async (driverId) => {
        setIsLoadingDocs(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/drivers/${driverId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                const rawDocs = res.data.data?.driverDetails?.documents || {};
                const mappedDocs = Object.fromEntries(
                    Object.entries(rawDocs).map(([k, v]) => {
                        if (!v) return [k, v];
                        if (v.startsWith('http')) return [k, v];
                        const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
                        const filePath = v.startsWith('/') ? v : `/${v}`;
                        return [k, `${baseUrl}${filePath}`];
                    })
                );
                setSelectedDriverDocs(mappedDocs);
            }
        } catch (error) {
            console.error("Failed to fetch partner documents", error);
            setSelectedDriverDocs({});
        } finally {
            setIsLoadingDocs(false);
        }
    };

    useEffect(() => {
        if (selectedDriver) {
            fetchDriverRides(selectedDriver.id);
            fetchDriverDocuments(selectedDriver.id);
        } else {
            setDriverRides([]);
            setSelectedDriverDocs({});
        }
    }, [selectedDriver]);

    // Filter & Sort Logic
    const targetPartnersList = view === 'onboarding' ? onboardingList : (filterStatus === 'all' ? allPartners : allPartners.filter(p => p.status === filterStatus));

    const filteredPartners = targetPartnersList.filter(d => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (d.name || '').toLowerCase().includes(query) ||
            (d.phone || '').includes(searchQuery) ||
            (d.email || '').toLowerCase().includes(query) ||
            (d.plateNumber || '').toLowerCase().includes(query) ||
            (d.licenseNumber || '').toLowerCase().includes(query) ||
            (d.id || '').toLowerCase().includes(query);
        const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
        const matchesVehicleType = filterVehicleType === 'all' || (d.vehicleType || '').toUpperCase() === filterVehicleType.toUpperCase();
        return matchesSearch && matchesStatus && matchesVehicleType;
    });

    const sortedPartners = [...filteredPartners].sort((a, b) => {
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'earnings') return (b.totalEarnings || 0) - (a.totalEarnings || 0);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'oldest') return new Date(a.rawJoinDate || a.joinDate) - new Date(b.rawJoinDate || b.joinDate);
        return new Date(b.rawJoinDate || b.joinDate) - new Date(a.rawJoinDate || a.joinDate);
    });

    // --- Action Handlers ---
    const handleToggleStatus = async (partner, newStatus) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/drivers/${partner.id}/status`, {
                status: newStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                fetchDrivers();
            } else {
                alert(res.data.message || 'Failed to update partner status');
            }
        } catch (error) {
            console.error('Error toggling partner status:', error);
            alert(error.response?.data?.message || 'Server error while updating partner status');
        }
    };

    const handleApprove = async (id) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/drivers/${id}/verify`, { action: 'approve' }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                fetchDrivers();
                setIsDocModalOpen(false);
            }
        } catch (error) {
            console.error(error);
            alert("Approval failed");
        }
    };

    const handleReject = async (id) => {
        const reason = prompt("Enter reason for rejection:", "Missing or unclear documents.");
        if (reason === null) return;

        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/drivers/${id}/verify`,
                { action: 'reject', rejectionReason: reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                fetchDrivers();
                setIsDocModalOpen(false);
            }
        } catch (error) {
            console.error(error);
            alert("Rejection failed");
        }
    };

    const handleSavePartner = async (e) => {
        e.preventDefault();
        if (!editingPartner) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/drivers/${editingPartner.id}`, {
                name: editingPartner.name,
                email: editingPartner.email,
                phone: editingPartner.phone,
                licenseNumber: editingPartner.licenseNumber,
                vehicle: {
                    make: editingPartner.vehicleMake,
                    model: editingPartner.vehicleModel,
                    plateNumber: editingPartner.plateNumber,
                    type: editingPartner.vehicleType,
                    fuelType: editingPartner.fuelType,
                    seatingCapacity: editingPartner.seatingCapacity
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                fetchDrivers();
                setEditingPartner(null);
            } else {
                alert(res.data.message || 'Failed to update partner details');
            }
        } catch (err) {
            console.error('Error updating partner:', err);
            alert(err.response?.data?.message || 'Failed to update partner');
        }
    };

    const handleDeletePartner = async () => {
        if (!deletingPartner) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/drivers/${deletingPartner.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                fetchDrivers();
                setDeletingPartner(null);
            } else {
                alert(res.data.message || 'Failed to delete partner');
            }
        } catch (err) {
            console.error('Error deleting partner:', err);
            alert(err.response?.data?.message || 'Failed to delete partner');
        }
    };

    const exportCSV = () => {
        const headers = ['S.No,Partner ID,Name,Phone,Email,Status,Vehicle Make,Vehicle Model,Vehicle Type,Plate Number,License Number,Rating,Total Earnings (INR),Join Date'];
        const rows = sortedPartners.map((p, idx) => [
            idx + 1,
            `"${p.id}"`,
            `"${p.name || ''}"`,
            `"${p.phone || ''}"`,
            `"${p.email || ''}"`,
            `"${p.status}"`,
            `"${p.vehicleMake || ''}"`,
            `"${p.vehicleModel || ''}"`,
            `"${p.vehicleType || ''}"`,
            `"${p.plateNumber || ''}"`,
            `"${p.licenseNumber || ''}"`,
            p.rating || 5.0,
            p.totalEarnings || 0,
            `"${p.joinDate}"`
        ].join(','));

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `sanchari_partners_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Render Helpers ---
    const StatusBadge = ({ status }) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center w-fit gap-1 capitalize
            ${status === 'active' || status === 'approved'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : status === 'pending'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
            {status === 'active' || status === 'approved' ? <CheckCircle size={12} /> :
                status === 'pending' ? <Clock size={12} /> : <Ban size={12} />}
            {status}
        </span>
    );

    const renderDriverDetails = () => {
        const d = selectedDriver;
        const completedRides = driverRides.filter(r => r.status === 'completed');
        const cancelledRides = driverRides.filter(r => r.status === 'cancelled');

        return (
            <div className="space-y-6">
                <button
                    onClick={() => setSelectedDriver(null)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium text-sm bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 w-fit"
                >
                    <ChevronDown className="rotate-90" size={18} /> Back to Partner Directory
                </button>

                {/* Profile Main Header Card */}
                <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="h-32 w-32 rounded-2xl border-2 border-slate-700 overflow-hidden flex-shrink-0 cursor-pointer hover:border-emerald-500 transition-all shadow-lg" onClick={() => setViewingImage({ url: d.avatar, title: `${d.name}'s Profile` })}>
                            <img src={d.avatar} alt={d.name} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 space-y-4 w-full">
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h2 className="text-2xl font-bold text-white">{d.name}</h2>
                                        <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-full uppercase">
                                            {d.role || 'DRIVER'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <StatusBadge status={d.status} />
                                        
                                        {/* Online & Availability Badges */}
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${d.isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                            {d.isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                                            {d.isOnline ? 'Online' : 'Offline'}
                                        </span>

                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${d.isAvailable ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                            {d.isAvailable ? 'Available for Rides' : 'Busy on Ride'}
                                        </span>

                                        <span className="text-xs text-slate-400">• Joined {d.joinDate}</span>
                                    </div>
                                    
                                    <div className="text-xs font-mono text-slate-400 mt-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 w-fit">
                                        Partner ID: <span className="text-slate-200 font-bold">{d.id}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                                    <div className="text-center px-2">
                                        <div className="text-xl font-black text-amber-400 flex items-center justify-center gap-1">
                                            {d.rating} <Star size={16} className="fill-amber-400" />
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium">({d.ratingCount} Ratings)</div>
                                    </div>
                                    <div className="h-8 w-px bg-slate-800"></div>
                                    <div className="text-center px-2">
                                        <div className="text-xl font-black text-emerald-400">₹{d.totalEarnings}</div>
                                        <div className="text-[11px] text-slate-400 font-medium">Total Earnings</div>
                                    </div>
                                    <div className="h-8 w-px bg-slate-800"></div>
                                    <div className="text-center px-2">
                                        <div className="text-xl font-black text-purple-400">₹{d.walletBalance}</div>
                                        <div className="text-[11px] text-slate-400 font-medium">Wallet Balance</div>
                                    </div>
                                </div>
                            </div>

                            {/* Rejection Alert if applicable */}
                            {d.approvalStatus === 'rejected' && d.rejectionReason && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                                    <AlertCircle size={16} /> Rejection Reason: {d.rejectionReason}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detailed Info Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
                        {/* Contact Information */}
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <User size={14} className="text-emerald-400" /> Contact Info
                            </h4>
                            <div className="text-xs space-y-1">
                                <div><span className="text-slate-500">Phone:</span> <span className="text-slate-200 font-medium">{d.phone}</span></div>
                                <div><span className="text-slate-500">Email:</span> <span className="text-slate-200 font-medium">{d.email}</span></div>
                                <div><span className="text-slate-500">Address:</span> <span className="text-slate-300">{d.address}</span></div>
                            </div>
                        </div>

                        {/* Vehicle Specifications */}
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Car size={14} className="text-blue-400" /> Vehicle Specs
                            </h4>
                            <div className="text-xs space-y-1">
                                <div><span className="text-slate-500">Vehicle:</span> <span className="text-slate-200 font-medium">{d.vehicle}</span></div>
                                <div><span className="text-slate-500">Plate No:</span> <span className="text-emerald-400 font-bold">{d.plateNumber}</span></div>
                                <div><span className="text-slate-500">Type / Fuel:</span> <span className="text-slate-300">{d.vehicleType} • {d.fuelType}</span></div>
                                <div><span className="text-slate-500">Capacity / Year:</span> <span className="text-slate-300">{d.seatingCapacity} Seats • {d.vehicleYear}</span></div>
                            </div>
                        </div>

                        {/* License & Bank Info */}
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <CreditCard size={14} className="text-purple-400" /> License & Bank Details
                            </h4>
                            <div className="text-xs space-y-1">
                                <div><span className="text-slate-500">Driving License:</span> <span className="text-slate-200 font-medium">{d.licenseNumber}</span></div>
                                <div><span className="text-slate-500">Bank Name:</span> <span className="text-slate-300">{d.bankDetails?.bankName || 'N/A'}</span></div>
                                <div><span className="text-slate-500">Account No:</span> <span className="text-slate-300">{d.bankDetails?.accountNumber || 'N/A'}</span></div>
                                <div><span className="text-slate-500">IFSC Code:</span> <span className="text-slate-300">{d.bankDetails?.ifscCode || 'N/A'}</span></div>
                            </div>
                        </div>

                        {/* Service Preferences & Emergency */}
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Shield size={14} className="text-amber-400" /> Rates & Emergency
                            </h4>
                            <div className="text-xs space-y-1">
                                <div><span className="text-slate-500">Outstation Rate:</span> <span className="text-emerald-400 font-bold">₹{d.preferences?.outstationRatePerKm || 15}/km</span></div>
                                <div><span className="text-slate-500">Night Charge:</span> <span className="text-slate-300">₹{d.preferences?.nightCharge || 250}</span></div>
                                <div><span className="text-slate-500">Emergency Name:</span> <span className="text-slate-300">{d.emergencyContact?.name || 'N/A'}</span></div>
                                <div><span className="text-slate-500">Emergency Phone:</span> <span className="text-slate-300">{d.emergencyContact?.phone || 'N/A'}</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Verified Documents Section */}
                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-400" /> Partner Uploaded Verification Documents</h3>
                    {isLoadingDocs ? (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            Loading partner verification documents...
                        </div>
                    ) : Object.keys(selectedDriverDocs).length === 0 ? (
                        <div className="text-center py-8 bg-slate-800/40 rounded-xl border border-dashed border-slate-700 text-slate-400 text-sm">
                            No verification documents uploaded yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {Object.entries(selectedDriverDocs).map(([key, url]) => (
                                <div key={key} className="group cursor-pointer" onClick={() => setViewingImage({ url, title: key.replace(/([A-Z])/g, ' $1').trim() })}>
                                    <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700 mb-2 relative">
                                        <img src={url} alt={key} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                            <Eye className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" size={24} />
                                        </div>
                                    </div>
                                    <p className="text-xs font-medium text-slate-300 capitalize text-center">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Ride History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/40">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <CheckCircle size={18} className="text-emerald-400" />
                                Completed Rides ({completedRides.length})
                            </h3>
                        </div>
                        <div className="overflow-x-auto max-h-[350px]">
                            <table className="w-full">
                                <thead className="bg-slate-800/60 border-b border-slate-800">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Route</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Details</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Earnings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {completedRides.length > 0 ? completedRides.map(ride => (
                                        <tr key={ride.id} className="hover:bg-slate-800/30">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-slate-300 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> {ride.from}</span>
                                                    <span className="text-xs text-slate-300 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div> {ride.to}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs font-medium text-slate-200">{ride.date}</div>
                                                <div className="text-xs text-slate-400">{ride.time} • {ride.passenger}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-emerald-400 text-sm">
                                                ₹{(ride.amount || 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="3" className="px-6 py-8 text-center text-sm text-slate-400">No completed rides recorded.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/40">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Ban size={18} className="text-rose-400" />
                                Cancelled Rides ({cancelledRides.length})
                            </h3>
                        </div>
                        <div className="overflow-x-auto max-h-[350px]">
                            <table className="w-full">
                                <thead className="bg-slate-800/60 border-b border-slate-800">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Route</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Details</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Fare</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {cancelledRides.length > 0 ? cancelledRides.map(ride => (
                                        <tr key={ride.id} className="hover:bg-slate-800/30">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-slate-300 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> {ride.from}</span>
                                                    <span className="text-xs text-slate-300 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div> {ride.to}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs font-medium text-slate-200">{ride.date}</div>
                                                <div className="text-xs text-slate-400">{ride.time} • {ride.passenger}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-500 text-sm line-through">
                                                ₹{(ride.amount || 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="3" className="px-6 py-8 text-center text-sm text-slate-400">No cancelled rides.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderDirectory = () => (
        <div className="space-y-6">
            {/* Controls, Filters & Export */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search partners by name, phone, email, vehicle plate, license..."
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
                            <option value="active">Active (Approved)</option>
                            <option value="pending">Pending Verification</option>
                            <option value="suspended">Suspended / Blocked</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    {/* Vehicle Type Filter */}
                    <div className="relative">
                        <select
                            className="appearance-none bg-slate-800/80 border border-slate-700 pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            value={filterVehicleType}
                            onChange={(e) => setFilterVehicleType(e.target.value)}
                        >
                            <option value="all">All Vehicles</option>
                            <option value="CAR">Car</option>
                            <option value="BIKE">Bike</option>
                            <option value="AUTO">Auto</option>
                            <option value="SUV">SUV</option>
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
                            <option value="earnings">Sort: Highest Earnings</option>
                            <option value="rating">Sort: Highest Rating</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    {/* Export CSV Button */}
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl text-sm transition-all"
                        title="Export Registered Partners to CSV"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Partners Directory Table */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800/60 border-b border-slate-800">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">S.No.</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sanchari Partner</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Info</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicle Specs</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Earnings</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {sortedPartners
                                .slice((dirPage - 1) * dirLimit, dirPage * dirLimit)
                                .map((driver, index) => (
                                <tr
                                    key={driver.id}
                                    onClick={() => setSelectedDriver(driver)}
                                    className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">
                                        {(dirPage - 1) * dirLimit + index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full border border-slate-700 overflow-hidden flex-shrink-0 bg-slate-800">
                                                <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                                                    {driver.name}
                                                    {driver.vehicleType === 'BIKE' ? <Bike size={14} className="text-sky-400" /> : <Car size={14} className="text-emerald-400" />}
                                                </div>
                                                <div className="text-xs text-slate-400">Rating: {driver.rating} ⭐ ({driver.totalRides} Rides)</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-200">{driver.phone}</div>
                                        <div className="text-xs text-slate-400">{driver.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-200">{driver.vehicle} ({driver.vehicleType})</div>
                                        <div className="text-xs font-semibold text-emerald-400">{driver.plateNumber}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={driver.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-400">
                                        ₹{driver.totalEarnings}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                onClick={() => setSelectedDriver(driver)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-xs font-semibold transition-all shadow-sm"
                                                title="View Full Partner Information"
                                            >
                                                <Eye size={14} /> View
                                            </button>

                                            <button
                                                onClick={() => setEditingPartner(driver)}
                                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                title="Edit Partner Profile"
                                            >
                                                <Edit size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleToggleStatus(driver, driver.status === 'suspended' ? 'approved' : 'suspended')}
                                                className={`p-2 rounded-lg transition-colors ${driver.status === 'suspended' ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-rose-400 hover:bg-rose-500/10'}`}
                                                title={driver.status === 'suspended' ? 'Activate Partner' : 'Suspend Partner'}
                                            >
                                                {driver.status === 'suspended' ? <UserCheck size={16} /> : <UserX size={16} />}
                                            </button>

                                            <button
                                                onClick={() => setDeletingPartner(driver)}
                                                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                title="Delete Partner Account"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {sortedPartners.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-400">
                        No partners found matching your search.
                    </div>
                )}
                <Pagination
                    currentPage={dirPage}
                    totalItems={sortedPartners.length}
                    itemsPerPage={dirLimit}
                    onPageChange={setDirPage}
                    onItemsPerPageChange={setDirLimit}
                />
            </div>
        </div>
    );

    const renderOnboarding = () => (
        <div className="space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white">Partner Onboarding Verification Requests</h2>
                    <p className="text-xs text-slate-400 mt-1">Verify submitted driving licenses, vehicle registrations, and identity documents before approving Sanchari partners.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800/60 border-b border-slate-800">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Partner Applicant</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Contact Info</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Vehicle Type</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Submitted Date</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Verification Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {onboardingList.map((applicant) => (
                                <tr key={applicant.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full border border-slate-700 overflow-hidden bg-slate-800">
                                                <img src={applicant.avatar} alt={applicant.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="text-sm font-semibold text-white">{applicant.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        <div>{applicant.phone}</div>
                                        <div className="text-xs text-slate-400">{applicant.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {applicant.vehicleType} ({applicant.vehicle})
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {applicant.joinDate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={applicant.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => { setSelectedApplicant(applicant); setIsDocModalOpen(true); }}
                                                className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-semibold hover:bg-blue-500/20 transition-all flex items-center gap-1"
                                            >
                                                <FileText size={14} /> Review Docs
                                            </button>
                                            <button
                                                onClick={() => handleApprove(applicant.id)}
                                                className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                title="Approve Partner"
                                            >
                                                <ThumbsUp size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleReject(applicant.id)}
                                                className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                title="Reject Partner"
                                            >
                                                <ThumbsDown size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {onboardingList.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-400">No pending partner onboarding requests.</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {selectedDriver ? (
                <div className="p-2">
                    {renderDriverDetails()}
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">
                                {view === 'directory' && 'Partner Management'}
                                {view === 'onboarding' && 'Onboarding Verification'}
                                {view === 'complaints' && 'Partner Complaints & Incidents'}
                            </h1>
                            <p className="text-xs text-slate-400 mt-1">
                                {view === 'directory' && 'View, search, filter, verify, activate, suspend, and manage Sanchari partners.'}
                                {view === 'onboarding' && 'Review uploaded partner IDs, vehicle registrations, and licenses.'}
                                {view === 'complaints' && 'Manage partner customer complaints and rating logs.'}
                            </p>
                        </div>
                    </div>

                    {view === 'directory' && renderDirectory()}
                    {view === 'onboarding' && renderOnboarding()}
                </>
            )}

            {/* Document Review Modal */}
            <Modal
                isOpen={isDocModalOpen}
                onClose={() => setIsDocModalOpen(false)}
                title={`Document Verification - ${selectedApplicant?.name}`}
            >
                {selectedApplicant && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(selectedApplicant.documents || {}).map(([docType, url]) => (
                                url && (
                                    <div key={docType} className="border border-slate-800 rounded-xl p-3 bg-slate-950">
                                        <p className="text-xs font-semibold text-slate-400 mb-2 capitalize">{docType.replace(/([A-Z])/g, ' $1').trim()}</p>
                                        <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative cursor-pointer" onClick={() => setViewingImage({ url, title: docType })}>
                                            <img src={url} alt={docType} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button
                                onClick={() => handleReject(selectedApplicant.id)}
                                className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl text-sm font-semibold transition-colors"
                            >
                                Reject Applicant
                            </button>
                            <button
                                onClick={() => handleApprove(selectedApplicant.id)}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                Approve Partner
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Partner Modal */}
            <Modal
                isOpen={!!editingPartner}
                onClose={() => setEditingPartner(null)}
                title="Edit Sanchari Partner Profile"
            >
                {editingPartner && (
                    <form onSubmit={handleSavePartner} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Partner Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={editingPartner.name}
                                    onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={editingPartner.phone}
                                    onChange={(e) => setEditingPartner({ ...editingPartner, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={editingPartner.email}
                                    onChange={(e) => setEditingPartner({ ...editingPartner, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Driving License Number</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={editingPartner.licenseNumber}
                                    onChange={(e) => setEditingPartner({ ...editingPartner, licenseNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Vehicle Make</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={editingPartner.vehicleMake}
                                    onChange={(e) => setEditingPartner({ ...editingPartner, vehicleMake: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Vehicle Model</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={editingPartner.vehicleModel}
                                    onChange={(e) => setEditingPartner({ ...editingPartner, vehicleModel: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Plate Number</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={editingPartner.plateNumber}
                                    onChange={(e) => setEditingPartner({ ...editingPartner, plateNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setEditingPartner(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                Save Partner Details
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Delete Partner Modal */}
            <Modal
                isOpen={!!deletingPartner}
                onClose={() => setDeletingPartner(null)}
                title="Delete Partner Account"
            >
                {deletingPartner && (
                    <div className="space-y-4">
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                            <ShieldAlert className="text-rose-400" size={24} />
                            <div>
                                <h4 className="text-sm font-bold text-rose-400">Warning: Irreversible Action</h4>
                                <p className="text-xs text-slate-300 mt-0.5">
                                    Are you sure you want to delete partner <span className="font-bold text-white">{deletingPartner.name}</span> ({deletingPartner.phone})?
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setDeletingPartner(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeletePartner}
                                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-rose-500/20"
                            >
                                Delete Partner
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

export default DriverManagement;

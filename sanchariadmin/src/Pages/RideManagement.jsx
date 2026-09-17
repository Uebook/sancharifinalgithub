import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    MapPin, Navigation, Clock, CreditCard, User, ShieldAlert,
    CheckCircle, XCircle, AlertTriangle, MoreVertical, Search,
    Filter, ChevronDown, Phone, Mail, Car, Calendar, DollarSign,
    Eye, Download, AlertCircle
} from 'lucide-react';
import Pagination from '../Components/Pagination';

const mockDisputes = [
    { id: 'D-201', rideId: 'R-HIST-099', passenger: 'Harry Potter', driver: 'Severus Snape', issue: 'Overcharged', status: 'open', amount: 15.00, date: '2025-02-07' },
    { id: 'D-202', rideId: 'R-HIST-098', passenger: 'Ron Weasley', driver: 'Minerva McGonagall', issue: 'Driver rude behavior', status: 'resolved', amount: 0.00, date: '2025-02-06' },
];

// --- Components ---

const StatusBadge = ({ status }) => {
    const styles = {
        ongoing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        arriving: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        upcoming: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        open: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        resolved: 'bg-slate-800 text-slate-400 border-slate-700',
    };

    const icons = {
        ongoing: <Navigation size={12} />,
        arriving: <Clock size={12} />,
        completed: <CheckCircle size={12} />,
        cancelled: <XCircle size={12} />,
        upcoming: <Calendar size={12} />,
        open: <AlertTriangle size={12} />,
        resolved: <CheckCircle size={12} />,
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit border ${styles[status] || styles.resolved}`}>
            {icons[status]}
            <span className="capitalize">{status}</span>
        </span>
    );
};

const RideManagement = ({ view = 'live' }) => {
    const navigate = useNavigate();
    // State
    const [activeTab, setActiveTab] = useState('all'); // for history
    const [selectedRide, setSelectedRide] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [disputesData, setDisputesData] = useState(mockDisputes);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const fetchRides = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/rides`, {
                params: { status: activeTab !== 'all' ? activeTab : undefined },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                const formattedRides = res.data.data.map(ride => ({
                    id: ride._id,
                    passenger: ride.passenger?.name || 'Unknown',
                    driver: ride.driver?.name || 'Not assigned',
                    status: ride.status,
                    date: new Date(ride.createdAt).toLocaleDateString(),
                    time: new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    amount: ride.finalFare || ride.offeredFare || 0,
                    pickup: ride.pickup?.address || 'N/A',
                    dropoff: ride.dropoff?.address || 'N/A',
                    fullData: ride
                }));
                setHistoryData(formattedRides);
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            console.error('Failed to fetch rides:', err);
            setError(err.response?.data?.message || 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        if (view === 'history' || view === 'live') {
            fetchRides();
        }
    }, [view, fetchRides]);

    // Filter Logic
    const filteredHistory = historyData.filter(ride => {
        const matchesTab = activeTab === 'all' || ride.status === activeTab;
        const matchesSearch = ride.passenger.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ride.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ride.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    // Actions
    const handleCancelRide = (rideId) => {
        if (window.confirm('Are you sure you want to cancel this ride?')) {
            setHistoryData(prev => prev.map(r => r.id === rideId ? { ...r, status: 'cancelled' } : r));
        }
    };

    const handleRefund = (disputeId) => {
        if (window.confirm('Process refund for this dispute?')) {
            setDisputesData(prev => prev.map(d => d.id === disputeId ? { ...d, status: 'resolved' } : d));
        }
    };

    // --- Views ---

    const renderLiveTracking = () => (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-md flex flex-col h-full overflow-hidden">
                <div className="p-6 border-b border-slate-800 bg-slate-800/40 flex justify-between items-center">
                    <h2 className="font-bold text-white flex items-center gap-2 text-lg">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20" />
                        Live Rides Monitoring ({historyData.filter(r => r.status === 'ongoing' || r.status === 'accepted' || r.status === 'arrived').length})
                    </h2>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        Real-time updates active
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/40">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {loading ? (
                            <div className="col-span-full py-12 text-center text-slate-400">
                                Loading live rides...
                            </div>
                        ) : historyData.filter(r => r.status === 'ongoing' || r.status === 'accepted' || r.status === 'arrived').length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-400">
                                No active rides at the moment.
                            </div>
                        ) : historyData.filter(r => r.status === 'ongoing' || r.status === 'accepted' || r.status === 'arrived').map(ride => (
                            <div
                                key={ride.id}
                                onClick={() => setSelectedRide(ride)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-slate-700
                                    ${selectedRide?.id === ride.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-900/80'}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs font-mono font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">{ride.id.slice(-6).toUpperCase()}</span>
                                    <StatusBadge status={ride.status} />
                                </div>

                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800">
                                    <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                                        <Car size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">{ride.passenger}</div>
                                        <div className="text-xs text-slate-400">Driver: <span className="font-medium text-slate-200">{ride.driver}</span></div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Pickup</p>
                                            <p className="text-slate-200 font-medium leading-snug truncate max-w-[150px]">{ride.pickup}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Dropoff</p>
                                            <p className="text-slate-200 font-medium leading-snug truncate max-w-[150px]">{ride.dropoff}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                                    <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                                        <Clock size={12} /> <span className="font-semibold text-slate-200">{ride.time}</span>
                                    </div>
                                    <button
                                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/rides/${ride.id}`);
                                        }}
                                    >
                                        View Details →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const exportToCSV = (data, filename) => {
        if (!data || !data.length) {
            alert('No data available to export');
            return;
        }
        const keys = Object.keys(data[0]);
        const csvRows = [
            keys.join(','),
            ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderHistory = () => (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md flex flex-col md:flex-row justify-between gap-4">
                <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
                    {['all', 'completed', 'cancelled'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap capitalize
                                ${activeTab === tab
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-bold'
                                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search rides..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-800/80 text-white placeholder:text-slate-500 text-sm"
                        />
                    </div>
                    <button
                        onClick={() => exportToCSV(filteredHistory.map(r => ({
                            RideID: r.id,
                            Date: r.date,
                            Time: r.time,
                            Passenger: r.passenger,
                            Driver: r.driver,
                            Pickup: r.pickup,
                            Dropoff: r.dropoff,
                            Status: r.status,
                            Fare: r.amount
                        })), 'Rides_History_Report')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold transition-all"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-md overflow-hidden shadow-xl">
                {error && (
                    <div className="p-4 m-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex items-center gap-2 text-sm">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800/60 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Ride Info</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Participants</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Route</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Status & Amount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        Loading rides...
                                    </td>
                                </tr>
                            ) : filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        No rides found.
                                    </td>
                                </tr>
                            ) : filteredHistory.slice((currentPage - 1) * limit, currentPage * limit).map(ride => (
                                <tr key={ride.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white text-sm">{ride.id}</div>
                                        <div className="text-xs text-slate-400">{ride.date} • {ride.time}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-sm text-slate-200">
                                                <User size={14} className="text-slate-400" /> {ride.passenger}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-200">
                                                <Car size={14} className="text-slate-400" /> {ride.driver}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs">
                                            <span className="flex items-center gap-1.5 text-slate-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> {ride.pickup}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-slate-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-400" /> {ride.dropoff}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <StatusBadge status={ride.status} />
                                            <span className="text-sm font-bold text-emerald-400">
                                                ₹{ride.amount.toFixed(2)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => navigate(`/rides/${ride.id}`)}
                                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                                            >
                                                <Eye size={14} /> Details
                                            </button>
                                            {(ride.status === 'upcoming' || ride.status === 'ongoing') && (
                                                <button
                                                    onClick={() => handleCancelRide(ride.id)}
                                                    className="text-xs font-medium text-rose-400 hover:bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredHistory.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        No rides found matching your filters.
                    </div>
                )}
                <Pagination
                    currentPage={currentPage}
                    totalEntries={filteredHistory.length}
                    limit={limit}
                    onPageChange={setCurrentPage}
                    onLimitChange={(l) => { setLimit(l); setCurrentPage(1); }}
                />
            </div>
        </div>
    );

    const renderDisputes = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {disputesData.map(dispute => (
                <div key={dispute.id} className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 flex flex-col gap-4 backdrop-blur-md">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Dispute #{dispute.id}</h3>
                                <p className="text-xs text-slate-400">{dispute.date}</p>
                            </div>
                        </div>
                        <StatusBadge status={dispute.status} />
                    </div>

                    <div className="bg-slate-950/80 rounded-xl p-3 text-xs text-slate-300 border border-slate-800">
                        <span className="font-semibold text-slate-400 block mb-1">Issue:</span>
                        "{dispute.issue}"
                    </div>

                    <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800 pt-3">
                        <div className="flex justify-between">
                            <span>Passenger:</span>
                            <span className="font-medium text-slate-200">{dispute.passenger}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Driver:</span>
                            <span className="font-medium text-slate-200">{dispute.driver}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Ride ID:</span>
                            <span className="font-mono text-slate-400">{dispute.rideId}</span>
                        </div>
                        <div className="flex justify-between text-rose-400 font-medium">
                            <span>Disputed Amount:</span>
                            <span className="font-bold">₹{dispute.amount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-auto pt-2">
                        {dispute.status === 'open' ? (
                            <>
                                <button
                                    onClick={() => handleRefund(dispute.id)}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                >
                                    <DollarSign size={16} /> Refund
                                </button>
                                <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-medium transition-all">
                                    Dismiss
                                </button>
                            </>
                        ) : (
                            <div className="w-full text-center text-xs text-emerald-400 font-semibold bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/20">
                                Dispute Resolved
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black text-white tracking-tight">
                    {view === 'live' && 'Live Ride Tracking'}
                    {view === 'history' && 'Ride History Management'}
                    {view === 'disputes' && 'Disputes & Refunds'}
                </h1>
                <p className="text-slate-400 text-xs">
                    {view === 'live' && 'Monitor active rides in real-time across the city.'}
                    {view === 'history' && 'View and manage past, upcoming, and cancelled rides.'}
                    {view === 'disputes' && 'Resolve passenger disputes and process refunds.'}
                </p>
            </div>

            {view === 'live' && renderLiveTracking()}
            {view === 'history' && renderHistory()}
            {view === 'disputes' && renderDisputes()}
        </div>
    );
};

export default RideManagement;


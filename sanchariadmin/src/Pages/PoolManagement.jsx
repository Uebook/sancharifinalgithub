import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Search, Filter, MapPin, Navigation, Clock, Users,
    CheckCircle, XCircle, AlertCircle, Eye, MoreVertical,
    Calendar, Car, DollarSign, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../Components/Pagination';

const PoolManagement = () => {
    const navigate = useNavigate();
    const [pools, setPools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterVehicle, setFilterVehicle] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const fetchPools = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/pools`, {
                params: { type: filterType !== 'all' ? filterType : undefined, status: filterStatus !== 'all' ? filterStatus : undefined },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setPools(res.data.data);
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            console.error('Failed to fetch pools:', err);
            setError(err.response?.data?.message || 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    }, [filterType, filterStatus]);

    useEffect(() => {
        fetchPools();
    }, [fetchPools]);

    const filteredPools = pools.filter(pool => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            (pool.origin?.name?.toLowerCase().includes(query)) ||
            (pool.destination?.name?.toLowerCase().includes(query)) ||
            (pool.host?.name?.toLowerCase().includes(query)) ||
            (pool.vehicle?.toLowerCase().includes(query));

        const matchesVehicle = filterVehicle === 'all' ||
            (pool.vehicleType && pool.vehicleType.toUpperCase() === filterVehicle.toUpperCase());

        const matchesCategory = filterType === 'all' ||
            pool.type === filterType ||
            pool.poolCategory === filterType;

        return matchesSearch && matchesVehicle && matchesCategory;
    });

    const StatusBadge = ({ status }) => {
        const styles = {
            scheduled: 'bg-amber-100 text-amber-700 border-amber-200',
            ongoing: 'bg-blue-100 text-blue-700 border-blue-200',
            completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
        };

        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit border ${styles[status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                <span className="capitalize">{status}</span>
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black text-white tracking-tight">Pool Management</h1>
                <p className="text-slate-400 text-xs">Monitor and filter City Pool, Outstation Pool, Outstation Rental, and Bike / Car rides.</p>
            </div>

            {/* Filters */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by city, vehicle, or host..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-800/80 text-white placeholder:text-slate-500 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-3">
                    <select
                        className="bg-slate-800/80 border border-slate-700 px-3 py-2.5 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all" className="bg-slate-900 text-white">All Ride Categories</option>
                        <option value="CITY_POOL" className="bg-slate-900 text-white">City Pool</option>
                        <option value="OUTSTATION_POOL" className="bg-slate-900 text-white">Outstation Pool</option>
                        <option value="OUTSTATION_RENTAL" className="bg-slate-900 text-white">Outstation Rental</option>
                        <option value="local" className="bg-slate-900 text-white">Local Rides</option>
                    </select>

                    <select
                        className="bg-slate-800/80 border border-slate-700 px-3 py-2.5 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        value={filterVehicle}
                        onChange={(e) => setFilterVehicle(e.target.value)}
                    >
                        <option value="all" className="bg-slate-900 text-white">All Vehicles</option>
                        <option value="BIKE" className="bg-slate-900 text-white">Bike Ride</option>
                        <option value="CAR" className="bg-slate-900 text-white">Car Ride</option>
                    </select>

                    <select
                        className="bg-slate-800/80 border border-slate-700 px-3 py-2.5 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all" className="bg-slate-900 text-white">All Status</option>
                        <option value="scheduled" className="bg-slate-900 text-white">Scheduled</option>
                        <option value="ongoing" className="bg-slate-900 text-white">Ongoing</option>
                        <option value="completed" className="bg-slate-900 text-white">Completed</option>
                        <option value="cancelled" className="bg-slate-900 text-white">Cancelled</option>
                    </select>
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
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Pool Info</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Host / Vehicle</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Route</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Seats & Price</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">
                                        Loading pools...
                                    </td>
                                </tr>
                            ) : filteredPools.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">
                                        No pools found.
                                    </td>
                                </tr>
                            ) : filteredPools.slice((currentPage - 1) * limit, currentPage * limit).map(pool => (
                                <tr key={pool._id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-white text-sm capitalize">
                                                {pool.poolCategory ? pool.poolCategory.replace('_', ' ') : `${pool.type} Pool`}
                                            </span>
                                            {pool.vehicleType && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                                                    pool.vehicleType === 'BIKE' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                }`}>
                                                    {pool.vehicleType}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                            <Calendar size={12} /> {new Date(pool.scheduledTime).toLocaleDateString()}
                                            <Clock size={12} className="ml-1" /> {new Date(pool.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
                                                <img src={pool.host?.profileImage || `https://ui-avatars.com/api/?name=${pool.host?.name}`} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-white">{pool.host?.name}</div>
                                                <div className="text-xs text-slate-400">{pool.vehicle || pool.vehicleType || 'Vehicle'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs">
                                            <span className="flex items-center gap-1.5 text-slate-300 truncate max-w-[200px]" title={pool.origin?.name}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" /> {pool.origin?.name}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-slate-300 truncate max-w-[200px]" title={pool.destination?.name}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" /> {pool.destination?.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-200">
                                            {pool.totalSeats - pool.availableSeats} / {pool.totalSeats} Seats
                                        </div>
                                        <div className="text-xs text-emerald-400 font-bold mt-0.5">₹{pool.pricePerSeat} / Seat</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={pool.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => navigate(`/rides/pools/${pool._id}`)}
                                            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ml-auto"
                                        >
                                            <Eye size={14} /> View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalEntries={filteredPools.length}
                    limit={limit}
                    onPageChange={setCurrentPage}
                    onLimitChange={(l) => { setLimit(l); setCurrentPage(1); }}
                />
            </div>
        </div>
    );
};

export default PoolManagement;

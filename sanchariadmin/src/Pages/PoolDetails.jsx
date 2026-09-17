import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, MapPin, Calendar, Clock, CreditCard, User,
    Phone, ShieldAlert, Check, Star, Car, AlertCircle, Users,
    TrendingUp, ShieldCheck
} from 'lucide-react';

const PoolDetails = () => {
    const { poolId } = useParams();
    const navigate = useNavigate();

    const [pool, setPool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPoolDetails = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/pools/${poolId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setPool(res.data.data);
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            console.error('Failed to fetch pool details:', err);
            setError(err.response?.data?.message || 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    }, [poolId]);

    useEffect(() => {
        fetchPoolDetails();
    }, [fetchPoolDetails]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-white">Pool Details</h1>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-12 text-center text-slate-400">
                    Loading pool details...
                </div>
            </div>
        );
    }

    if (error || !pool) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-white">Pool Details</h1>
                </div>
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl p-6 flex items-center gap-3">
                    <AlertCircle size={24} />
                    <div>
                        <h3 className="font-bold">Error</h3>
                        <p className="text-sm">{error || 'Pool details not found'}</p>
                    </div>
                </div>
            </div>
        );
    }

    const scheduledDate = new Date(pool.scheduledTime).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const scheduledTime = new Date(pool.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="space-y-6 relative text-white">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white capitalize">{pool.type} Pool Details</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="font-mono text-slate-300">{pool._id}</span>
                        <span>•</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border
                            ${pool.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                pool.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                    pool.status === 'ongoing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                        'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                            {pool.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Host & Vehicle */}
                <div className="space-y-6">
                    {/* Host Card */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Host Details</h3>
                        <div className="flex items-center gap-4 mb-4">
                            <img
                                src={pool.host?.profileImage || `https://ui-avatars.com/api/?name=${pool.host?.name}&background=1e293b&color=fff`}
                                alt={pool.host?.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-slate-700"
                            />
                            <div>
                                <div className="font-bold text-lg text-white">{pool.host?.name}</div>
                                <div className="flex items-center gap-1 text-sm text-slate-400">
                                    <Phone size={14} /> {pool.host?.phone}
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                            <Car className="text-slate-400" size={18} />
                            <div>
                                <div className="text-sm font-medium text-white">{pool.vehicle || 'Vehicle Info N/A'}</div>
                                <div className="text-xs text-slate-400">Host Vehicle</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Ride Economics</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Price per Seat</span>
                                <span className="text-lg font-bold text-emerald-400">₹{pool.pricePerSeat}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Occupancy</span>
                                <span className="text-sm font-semibold text-white">
                                    {pool.totalSeats - pool.availableSeats} / {pool.totalSeats} Seats Booked
                                </span>
                            </div>
                            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                                <span className="text-sm font-bold text-white">Estimated Revenue</span>
                                <span className="text-lg font-bold text-white">₹{(pool.totalSeats - pool.availableSeats) * pool.pricePerSeat}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Route, Passengers, Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Route & Schedule */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <MapPin size={16} className="text-blue-400" /> Route & Schedule
                            </h3>
                            <div className="text-right">
                                <div className="text-sm font-bold text-white">{scheduledDate}</div>
                                <div className="text-xs text-slate-400">{scheduledTime}</div>
                            </div>
                        </div>

                        <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                            <div>
                                <div className="absolute left-2 top-2 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-slate-900 shadow-sm" />
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Origin</h4>
                                <p className="text-white font-medium">{pool.origin?.name}</p>
                            </div>
                            <div>
                                <div className="absolute left-2 top-2 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-slate-900 shadow-sm" />
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Destination</h4>
                                <p className="text-white font-medium">{pool.destination?.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Passengers */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Users size={16} className="text-slate-400" /> Passengers ({pool.passengers?.length || 0})
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-800">
                            {pool.passengers?.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                    No passengers have joined this pool yet.
                                </div>
                            ) : (
                                pool.passengers.map((p, index) => (
                                    <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={p.user?.profileImage || `https://ui-avatars.com/api/?name=${p.user?.name}&background=1e293b&color=fff`}
                                                className="w-10 h-10 rounded-full border border-slate-700"
                                                alt=""
                                            />
                                            <div>
                                                <div className="text-sm font-bold text-white">{p.user?.name}</div>
                                                <div className="text-xs text-slate-400">{p.user?.phone}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-white">{p.seatsBooked} Seat(s)</div>
                                                <div className="text-xs text-slate-400">₹{p.seatsBooked * pool.pricePerSeat}</div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border
                                                ${p.bookingStatus === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    p.bookingStatus === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                        'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                                {p.bookingStatus}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PoolDetails;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
// motion removed to satisfy linter
import {
    ArrowLeft, MapPin, Calendar, Clock, CreditCard, User,
    Phone, Mail, ShieldAlert, Download, Star, Car, Ban, Check, Unlock,
    AlertCircle
} from 'lucide-react';

const RideDetails = () => {
    const { rideId } = useParams();
    const navigate = useNavigate();

    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);

    const fetchRideDetails = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/rides/${rideId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                const data = res.data.data;
                setRide({
                    id: data._id,
                    status: data.status,
                    date: new Date(data.createdAt).toLocaleDateString(),
                    time: new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    duration: data.durationMins ? `${data.durationMins} mins` : 'N/A',
                    distance: data.distanceKm ? `${data.distanceKm} km` : 'N/A',
                    totalFare: data.finalFare || data.offeredFare || 0,
                    paymentMethod: data.paymentMethod === 'cash' ? 'Cash' : 'Wallet',
                    passenger: {
                        id: data.passenger?._id,
                        name: data.passenger?.name || 'Unknown',
                        phone: data.passenger?.phone || 'N/A',
                        rating: 4.5, // Placeholder for actual rating
                        image: data.passenger?.profileImage || `https://ui-avatars.com/api/?name=${data.passenger?.name}`,
                        isBlocked: data.passenger?.isBlocked || false
                    },
                    driver: data.driver ? {
                        id: data.driver._id,
                        name: data.driver.name,
                        phone: data.driver.phone,
                        rating: 4.8, // Placeholder
                        car: `${data.driver.driverDetails?.vehicleInfo?.brand || ''} ${data.driver.driverDetails?.vehicleInfo?.model || ''}`,
                        plate: data.driver.driverDetails?.vehicleInfo?.plateNumber || 'N/A',
                        image: data.driver.profileImage || `https://ui-avatars.com/api/?name=${data.driver.name}`,
                        isBlocked: data.driver.isBlocked || false
                    } : null,
                    pickup: {
                        address: data.pickup?.address || 'N/A',
                        time: data.acceptedAt ? new Date(data.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'
                    },
                    dropoff: {
                        address: data.dropoff?.address || 'N/A',
                        time: data.completedAt ? new Date(data.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'
                    },
                    timeline: [
                        { time: data.createdAt ? new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A', event: 'Ride Requested' },
                        data.acceptedAt && { time: new Date(data.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), event: 'Driver Assigned' },
                        data.arrivedAt && { time: new Date(data.arrivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), event: 'Driver Arrived' },
                        data.startedAt && { time: new Date(data.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), event: 'Trip Started' },
                        data.completedAt && { time: new Date(data.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), event: 'Trip Completed' }
                    ].filter(Boolean),
                    fareBreakdown: [
                        { label: 'Booking Fare', amount: data.offeredFare || 0 },
                        { label: 'Platform Fee', amount: 0 }
                    ]
                });
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            console.error('Failed to fetch ride details:', err);
            setError(err.response?.data?.message || 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    }, [rideId]);

    useEffect(() => {
        fetchRideDetails();
    }, [fetchRideDetails]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleDownloadInvoice = () => {
        const btn = document.getElementById('download-invoice-btn');
        if (btn) {
            const originalContent = btn.innerHTML;
            btn.innerHTML = `<span class="flex items-center gap-2"><svg class="animate-spin h-4 w-4 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Downloading...</span>`;
            setTimeout(() => {
                btn.innerHTML = `<span class="flex items-center gap-2"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg> Downloaded</span>`;
                showNotification('Invoice downloaded successfully');
                setTimeout(() => {
                    btn.innerHTML = originalContent;
                }, 2000);
            }, 1500);
        }
    };

    const handleToggleBlock = (type, name, isBlocked) => {
        const action = isBlocked ? 'unblock' : 'block';
        if (window.confirm(`Are you sure you want to ${action} this ${type}: ${name}?`)) {
            // Update state to reflect blocked status
            setRide(prev => ({
                ...prev,
                [type.toLowerCase()]: {
                    ...prev[type.toLowerCase()],
                    isBlocked: !isBlocked
                }
            }));
            showNotification(`${type} ${name} has been ${action}ed successfully`);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 relative text-white">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-white">Ride Details</h1>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-12 text-center text-slate-400">
                    Loading ride details...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6 relative text-white">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-white">Ride Details</h1>
                </div>
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl p-6 flex items-center gap-3">
                    <AlertCircle size={24} />
                    <div>
                        <h3 className="font-bold">Error</h3>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!ride) {
        return (
            <div className="space-y-6 relative text-white">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-white">Ride Details</h1>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-12 text-center text-slate-400">
                    No ride details found.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative text-white">
            {/* Notification Toast */}
            <div className="fixed top-6 right-6 z-50">
                {notification && (
                    <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700">
                        <div className="p-1 bg-emerald-500/20 rounded-full">
                            <Check size={16} className="text-emerald-400" />
                        </div>
                        <span className="font-medium text-sm">{notification.message}</span>
                    </div>
                )}
            </div>

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Ride Details</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="font-mono text-slate-300">{ride.id}</span>
                        <span>•</span>
                        <span>{ride.date} at {ride.time}</span>
                        <span>•</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border
                            ${ride.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                ride.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                            {ride.status}
                        </span>
                    </div>
                </div>
                <div className="ml-auto flex gap-3">
                    <button
                        id="download-invoice-btn"
                        onClick={handleDownloadInvoice}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl hover:bg-slate-700 font-medium transition-all shadow-sm"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Invoice</span>
                    </button>
                </div>
            </div>

            <div className="lg:col-span-3">
                {loading ? (
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-12 text-center text-slate-400">
                        Loading ride details...
                    </div>
                ) : error ? (
                    <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl p-6 flex items-center gap-3">
                        <AlertCircle size={24} />
                        <div>
                            <h3 className="font-bold">Error</h3>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Column 1: Participants */}
                        <div className="space-y-6">
                            {/* Passenger Card */}
                            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Passenger</h3>
                                <div className="flex items-center gap-4 mb-4">
                                    <img src={ride.passenger.image} alt={ride.passenger.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-700" />
                                    <div>
                                        <div className="font-bold text-lg text-white">{ride.passenger.name}</div>
                                        <div className="flex items-center gap-1 text-sm text-amber-400 font-medium">
                                            <Star size={14} fill="currentColor" /> {ride.passenger.rating}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-4 border-t border-slate-800">
                                    <div className="flex items-center gap-3 text-sm text-slate-300">
                                        <Phone size={16} /> {ride.passenger.phone}
                                    </div>
                                    {ride.passenger.isBlocked ? (
                                        <button
                                            onClick={() => handleToggleBlock('Passenger', ride.passenger.name, true)}
                                            className="w-full py-2 border border-slate-700 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Unlock size={16} /> Unblock Passenger
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleToggleBlock('Passenger', ride.passenger.name, false)}
                                            className="w-full py-2 border border-rose-500/30 bg-rose-500/10 text-rose-400 rounded-xl text-sm font-medium hover:bg-rose-500/20 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Ban size={16} /> Block Passenger
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Driver Card */}
                            {ride.driver ? (
                                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Driver</h3>
                                    <div className="flex items-center gap-4 mb-4">
                                        <img src={ride.driver.image} alt={ride.driver.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-700" />
                                        <div>
                                            <div className="font-bold text-lg text-white">{ride.driver.name}</div>
                                            <div className="flex items-center gap-1 text-sm text-amber-400 font-medium">
                                                <Star size={14} fill="currentColor" /> {ride.driver.rating}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl mb-4">
                                        <div className="flex items-center gap-2 font-medium text-white">
                                            <Car size={16} /> {ride.driver.car || 'Vehicle Info N/A'}
                                        </div>
                                        <div className="text-sm text-slate-400 ml-6">{ride.driver.plate}</div>
                                    </div>
                                    <div className="space-y-3 pt-4 border-t border-slate-800">
                                        <div className="flex items-center gap-3 text-sm text-slate-300">
                                            <Phone size={16} /> {ride.driver.phone}
                                        </div>
                                        {ride.driver.isBlocked ? (
                                            <button
                                                onClick={() => handleToggleBlock('Driver', ride.driver.name, true)}
                                                className="w-full py-2 border border-slate-700 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Unlock size={16} /> Unblock Driver
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleToggleBlock('Driver', ride.driver.name, false)}
                                                className="w-full py-2 border border-rose-500/30 bg-rose-500/10 text-rose-400 rounded-xl text-sm font-medium hover:bg-rose-500/20 flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Ban size={16} /> Block Driver
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 text-center">
                                    <p className="text-sm text-slate-400">Driver not yet assigned.</p>
                                </div>
                            )}
                        </div>

                        {/* Column 2: Trip Visuals */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Route Details */}
                            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden p-6">
                                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                                    <MapPin size={16} className="text-blue-400" /> Route Details
                                </h3>
                                <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                                    <div>
                                        <div className="absolute left-2 top-2.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-slate-900"></div>
                                        <h4 className="font-semibold text-white">Pickup</h4>
                                        <p className="text-sm text-slate-300">{ride.pickup.address}</p>
                                        <p className="text-xs text-slate-400 mt-1">{ride.pickup.time}</p>
                                    </div>
                                    <div>
                                        <div className="absolute left-2 top-2.5 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-slate-900"></div>
                                        <h4 className="font-semibold text-white">Dropoff</h4>
                                        <p className="text-sm text-slate-300">{ride.dropoff.address}</p>
                                        <p className="text-xs text-slate-400 mt-1">{ride.dropoff.time}</p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center gap-6 text-sm text-slate-300">
                                    <div>
                                        <span className="font-medium text-slate-400">Distance:</span> {ride.distance}
                                    </div>
                                    <div>
                                        <span className="font-medium text-slate-400">Duration:</span> {ride.duration}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Timeline */}
                                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                        <Clock size={16} className="text-emerald-400" /> Trip Timeline
                                    </h3>
                                    <div className="space-y-4">
                                        {ride.timeline.length === 0 ? (
                                            <p className="text-xs text-slate-400">No timeline data available.</p>
                                        ) : ride.timeline.map((event, index) => (
                                            <div key={index} className="flex justify-between items-center text-sm">
                                                <span className="text-slate-300">{event.event}</span>
                                                <span className="font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">{event.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment & Breakdown */}
                                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6">
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                        <CreditCard size={16} className="text-purple-400" /> Payment Details
                                    </h3>
                                    <div className="space-y-2 mb-4">
                                        {ride.fareBreakdown.map((item, index) => (
                                            <div key={index} className="flex justify-between text-sm text-slate-300">
                                                <span>{item.label}</span>
                                                <span>₹{item.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-slate-800 pt-3 flex justify-between items-center font-bold text-white">
                                        <span>Total Fare</span>
                                        <span className="text-lg text-emerald-400">₹{ride.totalFare.toFixed(2)}</span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                                        <CreditCard size={12} />
                                        Paid via {ride.paymentMethod}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RideDetails;

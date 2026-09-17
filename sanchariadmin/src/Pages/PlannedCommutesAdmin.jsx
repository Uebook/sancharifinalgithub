import React, { useState } from 'react';
import { CalendarDays, MapPin, Clock, Bike, Car, CheckCircle, Search, Filter } from 'lucide-react';
import Pagination from '../Components/Pagination';

const PlannedCommutesAdmin = () => {
    const [search, setSearch] = useState('');
    const [vehicleFilter, setVehicleFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const sampleCommutes = [
        {
            id: 'PC-101',
            driverName: 'Ranjeet Kumar',
            phone: '+91 98765 43210',
            vehicleType: 'BIKE',
            homeLocation: 'Madhapur, Hyderabad',
            officeLocation: 'Gachibowli ORR, Hyderabad',
            homeToOfficeTime: '09:00 AM',
            officeToHomeTime: '06:00 PM',
            activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            seatsCount: 1,
            isAC: false,
            isLadiesOnly: false,
            status: 'ACTIVE',
        },
        {
            id: 'PC-102',
            driverName: 'Subham Dubey',
            phone: '+91 91234 56789',
            vehicleType: 'CAR',
            homeLocation: 'Madhapur Police Station',
            officeLocation: 'Gachibowli ORR Junction',
            homeToOfficeTime: '09:15 AM',
            officeToHomeTime: '06:30 PM',
            activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            seatsCount: 3,
            isAC: true,
            isLadiesOnly: true,
            status: 'ACTIVE',
        },
    ];

    const filtered = sampleCommutes.filter((item) => {
        const matchesSearch =
            item.driverName.toLowerCase().includes(search.toLowerCase()) ||
            item.homeLocation.toLowerCase().includes(search.toLowerCase()) ||
            item.officeLocation.toLowerCase().includes(search.toLowerCase());
        const matchesVehicle = vehicleFilter === 'ALL' || item.vehicleType === vehicleFilter;
        return matchesSearch && matchesVehicle;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto text-slate-100">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CalendarDays className="w-7 h-7 text-indigo-400" />
                        Scheduled Rides Monitor
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Monitor recurring daily home-to-office driver schedules and seat preferences.
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search driver name or location..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <div className="flex gap-2">
                    {['ALL', 'BIKE', 'CAR'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setVehicleFilter(type)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                                vehicleFilter === type
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                            }`}
                        >
                            {type === 'ALL' ? 'All Vehicles' : type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Driver</th>
                                <th className="px-6 py-4">Vehicle</th>
                                <th className="px-6 py-4">Home → Office Route</th>
                                <th className="px-6 py-4">Schedules</th>
                                <th className="px-6 py-4">Seats / Prefs</th>
                                <th className="px-6 py-4">Active Days</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filtered.slice((currentPage - 1) * limit, currentPage * limit).map((item) => (
                                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-white">
                                        {item.driverName}
                                        <div className="text-xs text-slate-500">{item.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                            item.vehicleType === 'BIKE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                        }`}>
                                            {item.vehicleType === 'BIKE' ? <Bike className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
                                            {item.vehicleType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                                            <MapPin className="w-3.5 h-3.5" /> {item.homeLocation}
                                        </div>
                                        <div className="flex items-center gap-1 text-rose-400 text-xs font-semibold mt-1">
                                            <MapPin className="w-3.5 h-3.5" /> {item.officeLocation}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-xs text-slate-300">
                                            <Clock className="w-3.5 h-3.5 text-blue-400" /> Morning: {item.homeToOfficeTime}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-slate-300 mt-1">
                                            <Clock className="w-3.5 h-3.5 text-blue-400" /> Evening: {item.officeToHomeTime}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        <span className="font-bold text-white">{item.seatsCount} seats</span>
                                        {item.isAC && <span className="ml-2 text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">AC</span>}
                                        {item.isLadiesOnly && <span className="ml-2 text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded">Ladies</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            {item.activeDays.map((d) => (
                                                <span key={d} className="px-1.5 py-0.5 bg-slate-800 text-indigo-400 rounded text-[10px] font-bold">
                                                    {d}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
                                            <CheckCircle className="w-3.5 h-3.5" /> {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalEntries={filtered.length}
                    limit={limit}
                    onPageChange={setCurrentPage}
                    onLimitChange={(l) => { setLimit(l); setCurrentPage(1); }}
                />
            </div>
        </div>
    );
};

export default PlannedCommutesAdmin;

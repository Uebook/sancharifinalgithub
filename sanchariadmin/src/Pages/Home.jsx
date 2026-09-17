import React, { useState, useEffect } from 'react';
import {
  Users, TrendingUp, TrendingDown, DollarSign, Activity,
  Car, UserPlus, Calendar, Clock, MapPin, AlertCircle, CheckCircle
} from 'lucide-react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

// --- Mock Data ---

const rideTrendsData = [
  { name: 'Mon', rides: 120 },
  { name: 'Tue', rides: 132 },
  { name: 'Wed', rides: 101 },
  { name: 'Thu', rides: 134 },
  { name: 'Fri', rides: 190 },
  { name: 'Sat', rides: 230 },
  { name: 'Sun', rides: 210 },
];

const revenueGrowthData = [
  { name: 'Week 1', revenue: 4000 },
  { name: 'Week 2', revenue: 3000 },
  { name: 'Week 3', revenue: 5000 },
  { name: 'Week 4', revenue: 4500 },
];

const userRegistrationData = [
  { name: 'Jan', passengers: 400, drivers: 240 },
  { name: 'Feb', passengers: 300, drivers: 139 },
  { name: 'Mar', passengers: 200, drivers: 980 },
  { name: 'Apr', passengers: 278, drivers: 390 },
  { name: 'May', passengers: 189, drivers: 480 },
  { name: 'Jun', passengers: 239, drivers: 380 },
];

// --- Components ---

const StatCard = ({ title, value, icon, color, trend, footer, subtitle }) => (
  <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md hover:border-slate-700 transition-all hover:scale-[1.01]">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-black text-white mt-2">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color} text-white shadow-lg`}>
        {icon}
      </div>
    </div>
    {footer && (
      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${trend.startsWith('+') ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
          {trend.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {trend}
        </span>
        <span className="text-slate-400 text-xs">{footer}</span>
      </div>
    )}
  </div>
);

function Home() {
  const [stats, setStats] = useState({
    totalPassengers: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    newRegistrationsToday: 0,
    dailyRevenue: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-400 text-xs mt-1">Real-time platform metrics and financial highlights.</p>
        </div>
      </div>

      {/* Stats Row 1: Users & Live Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Pools"
          value={stats.totalPools?.toLocaleString() || '0'}
          subtitle={`${stats.activePools || 0} Active`}
          icon={<Activity size={24} />}
          color="bg-amber-500"
          trend="+8%"
          footer="Live pooling"
        />
        <StatCard
          title="Total Passengers"
          value={stats.totalPassengers.toLocaleString()}
          icon={<Users size={24} />}
          color="bg-blue-600"
          trend="+12%"
          footer="vs last month"
        />
        <StatCard
          title="Total Drivers"
          value={stats.totalDrivers.toLocaleString()}
          subtitle={`${stats.activeDrivers} Active`}
          icon={<Car size={24} />}
          color="bg-purple-600"
          trend="+5%"
          footer="vs last month"
        />
      </div>

      {/* Stats Row 2: Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Total Collection (Gross)"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign size={24} />}
          color="bg-slate-800"
          trend="+12%"
          footer="Full passenger payments"
        />
        <StatCard
          title="Total Driver Payouts"
          value={`₹${(stats.totalPayouts || stats.totalRevenue || 0).toLocaleString()}`}
          subtitle={`Commission: ₹${(stats.totalCommission || 0).toLocaleString()}`}
          icon={<CheckCircle size={24} />}
          color="bg-emerald-600"
          trend="+12%"
          footer="Driver payouts (100%)"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ride Trends */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
          <h3 className="text-lg font-bold text-white mb-4">Ride Trends (Last 7 Days)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rideTrendsData}>
                <defs>
                  <linearGradient id="colorRides" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }} />
                <Area type="monotone" dataKey="rides" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRides)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Growth */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
          <h3 className="text-lg font-bold text-white mb-4">Revenue Growth (Monthly)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* User Growth */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
          <h3 className="text-lg font-bold text-white mb-4">User Registration Growth</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userRegistrationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }} />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                <Bar dataKey="passengers" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Passengers" />
                <Bar dataKey="drivers" fill="#10b981" radius={[4, 4, 0, 0]} name="Drivers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;


import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, UserCog, ShieldCheck, CreditCard,
    Gift, MapPin, Activity, List, Calendar, Tag, Banknote,
    CalendarCheck, Wallet, FileText, Bike, LogOut, X, Sparkles,
    ChevronRight, Layers, MessageSquare
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    const menuGroups = [
        {
            id: 'main',
            title: 'OVERVIEW',
            titleColor: 'text-sky-400',
            items: [
                { id: 'dashboard', title: 'Dashboard', path: '/', icon: LayoutDashboard }
            ]
        },
        {
            id: 'customers',
            title: 'CUSTOMER MANAGEMENT',
            titleColor: 'text-emerald-400',
            items: [
                { id: 'passengers', title: 'Customers Directory', path: '/passengers', icon: Users },
                { id: 'customer-offers', title: 'Customer Offers & Promos', path: '/rides/offers', icon: Sparkles }
            ]
        },
        {
            id: 'partners',
            title: 'PARTNER MANAGEMENT',
            titleColor: 'text-purple-400',
            items: [
                { id: 'drivers', title: 'Sanchari Partners', path: '/drivers', icon: UserCog },
                { id: 'onboarding', title: 'Onboarding Verification', path: '/drivers/onboarding', icon: ShieldCheck },
                { id: 'driver-offers', title: 'Partner Incentive Offers', path: '/drivers/offers', icon: Gift }
            ]
        },
        {
            id: 'rides',
            title: 'RIDE & POOL OPERATIONS',
            titleColor: 'text-amber-400',
            items: [
                { id: 'live-rides', title: 'Live Rides Track', path: '/rides/live', icon: Activity },
                { id: 'pools', title: 'City Pool Management', path: '/rides/pools', icon: List },
                { id: 'planned-commutes', title: 'Scheduled Rides', path: '/rides/planned-commutes', icon: Calendar },
                { id: 'promoted-routes', title: 'Promoted Routes', path: '/rides/promoted', icon: Tag },
                { id: 'pricing-config', title: 'Pricing & Surcharges', path: '/rides/pricing-config', icon: Banknote },
                { id: 'ride-history', title: 'Ride History', path: '/rides/history', icon: CalendarCheck }
            ]
        },
        {
            id: 'finance',
            title: 'FINANCE & PAYOUTS',
            titleColor: 'text-rose-400',
            items: [
                { id: 'withdrawals', title: 'Withdrawal Requests', path: '/payments/withdrawals', icon: CreditCard },
                { id: 'driver-wallets', title: 'Partner Wallets', path: '/payments/wallets/drivers', icon: Wallet },
                { id: 'passenger-wallets', title: 'Customer Wallets', path: '/payments/wallets/passengers', icon: Wallet },
                { id: 'transactions', title: 'Financial Transactions', path: '/payments/transactions', icon: FileText }
            ]
        },
        {
            id: 'support',
            title: 'SUPPORT & FEEDBACK',
            titleColor: 'text-indigo-400',
            items: [
                { id: 'feedback', title: 'App Feedback', path: '/feedback', icon: MessageSquare }
            ]
        }
    ];

    return (
        <motion.div
            initial={{ x: -280 }}
            animate={{ x: isOpen ? 0 : -280 }}
            transition={{ type: "spring", damping: 22, stiffness: 120 }}
            className="h-screen w-72 bg-slate-900/95 backdrop-blur-xl flex flex-col fixed left-0 top-0 z-50 rounded-r-3xl border-r border-slate-800 shadow-2xl"
        >
            {/* Header / Logo Section */}
            <div className="p-6 border-b border-slate-800/80">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="h-11 w-11 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 rotate-3">
                            <Bike size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tight leading-none">SANCHARI</h1>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Admin Portal</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
                {menuGroups.map((group) => (
                    <div key={group.id} className="space-y-2">
                        <p className={`px-3 text-[10px] font-black uppercase tracking-widest ${group.titleColor || 'text-slate-500'}`}>
                            {group.title}
                        </p>
                        <ul className="space-y-1">
                            {group.items.map((item) => {
                                const active = location.pathname === item.path;
                                const Icon = item.icon;

                                return (
                                    <li key={item.id}>
                                        <Link
                                            to={item.path}
                                            className={`
                                                group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden text-xs font-semibold
                                                ${active
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-500/5'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                                                }
                                            `}
                                        >
                                            {/* Active Left Indicator Glow */}
                                            {active && (
                                                <div className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full" />
                                            )}

                                            <Icon
                                                size={18}
                                                className={`transition-colors ${active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-200'}`}
                                                strokeWidth={active ? 2.5 : 2}
                                            />

                                            <span className="flex-1 truncate">{item.title}</span>

                                            {active && (
                                                <ChevronRight size={14} className="text-emerald-400/60" />
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Footer / Profile Section */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 rounded-br-3xl">
                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <div className="relative">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-inner">
                            {adminUser?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                            {adminUser?.name || 'Super Admin'}
                        </h4>
                        <p className="text-[10px] font-medium text-slate-400 truncate uppercase">
                            {adminUser?.role || 'Administrator'}
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Sign Out"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default Sidebar;

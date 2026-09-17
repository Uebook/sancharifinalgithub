import React, { useState, useEffect } from 'react';
import {
    DollarSign, TrendingUp, TrendingDown,
    CreditCard, Download, Search, Filter,
    CheckCircle, XCircle, Clock, AlertTriangle,
    Wallet, ChevronDown, FileText, ArrowUpRight, ArrowDownLeft,
    PieChart, Activity, Plus, Minus, X, Eye, ShieldAlert, Check,
    Users, RefreshCw, Gift
} from 'lucide-react';
import axios from 'axios';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Pagination from '../Components/Pagination';

const revenueData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 5000 },
    { name: 'Thu', revenue: 4500 },
    { name: 'Fri', revenue: 6000 },
    { name: 'Sat', revenue: 7500 },
    { name: 'Sun', revenue: 7000 },
];

const StatusBadge = ({ status }) => {
    const styles = {
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        suspended: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        failed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        refunded: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
            {status}
        </span>
    );
};

const TxTypeBadge = ({ type, description = '' }) => {
    const descLower = (description || '').toLowerCase();
    let badgeType = type;
    if (type === 'credit' && descLower.includes('refund')) {
        badgeType = 'refund';
    } else if (type === 'credit' && (descLower.includes('promo') || descLower.includes('bonus') || descLower.includes('offer'))) {
        badgeType = 'promo';
    }

    const config = {
        credit: { label: 'Credit', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        debit: { label: 'Debit', style: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
        refund: { label: 'Refund', style: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
        promo: { label: 'Promo Credit', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
    };

    const item = config[badgeType] || config.credit;

    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${item.style}`}>
            {item.label}
        </span>
    );
};

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

const PaymentManagement = ({ view = 'dashboard' }) => {
    // Partner State
    const [wallets, setWallets] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [driverTransactions, setDriverTransactions] = useState([]);

    // Customer State
    const [passengerWallets, setPassengerWallets] = useState([]);
    const [passengerMetrics, setPassengerMetrics] = useState({
        totalCapital: 0,
        totalRefunds: 0,
        totalPromoCredits: 0,
        activeWalletsCount: 0
    });
    const [customerTransactions, setCustomerTransactions] = useState([]);

    // Overview State
    const [financeData, setFinanceData] = useState({
        totalCollection: 0,
        totalCommission: 0,
        totalPayouts: 0,
        netProfit: 0
    });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [txTypeFilter, setTxTypeFilter] = useState('all');
    const [tierFilter, setTierFilter] = useState('all');
    const [roleTab, setRoleTab] = useState('all'); // 'all', 'passenger', 'driver'

    // Pagination States
    const [custWalletPage, setCustWalletPage] = useState(1);
    const [custWalletLimit, setCustWalletLimit] = useState(10);
    const [driverWalletPage, setDriverWalletPage] = useState(1);
    const [driverWalletLimit, setDriverWalletLimit] = useState(10);
    const [withdrawPage, setWithdrawPage] = useState(1);
    const [withdrawLimit, setWithdrawLimit] = useState(10);
    const [txPage, setTxPage] = useState(1);
    const [txLimit, setTxLimit] = useState(10);

    // Partner Modals & Adjust State
    const [adjustingWallet, setAdjustingWallet] = useState(null);
    const [selectedLedgerPartner, setSelectedLedgerPartner] = useState(null);
    const [adjustFormData, setAdjustFormData] = useState({
        type: 'credit',
        amount: '',
        description: ''
    });

    // Customer Modals & Adjust State
    const [adjustingPassengerWallet, setAdjustingPassengerWallet] = useState(null);
    const [selectedLedgerPassenger, setSelectedLedgerPassenger] = useState(null);
    const [adjustPassengerFormData, setAdjustPassengerFormData] = useState({
        type: 'credit',
        amount: '',
        description: ''
    });

    const [adjustSubmitting, setAdjustSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { Authorization: `Bearer ${token}` };

            const [finRes, driverWalletRes, passengerWalletRes, withdrawalRes, transRes, custTransRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/financial-overview`, { headers }),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/driver-wallets`, { headers }),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/passenger-wallets`, { headers }),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/withdrawals`, { headers }),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/transactions`, { headers }),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/customer-transactions`, { headers }).catch(() => ({ data: { success: false, data: [] } }))
            ]);

            if (finRes.data?.success) setFinanceData(finRes.data.data);
            if (driverWalletRes.data?.success) setWallets(driverWalletRes.data.data);
            if (passengerWalletRes.data?.success) {
                setPassengerWallets(passengerWalletRes.data.data || []);
                if (passengerWalletRes.data.metrics) {
                    setPassengerMetrics(passengerWalletRes.data.metrics);
                }
            }
            if (withdrawalRes.data?.success) setWithdrawals(withdrawalRes.data.data);
            if (transRes.data?.success) setDriverTransactions(transRes.data.data);
            if (custTransRes.data?.success) setCustomerTransactions(custTransRes.data.data);
        } catch (err) {
            console.error('Failed to fetch financial data:', err);
        }
    };

    // Payout / Withdrawal Approval Actions
    const handleWithdrawalAction = async (id, newStatus) => {
        if (window.confirm(`Are you sure you want to ${newStatus} this request?`)) {
            try {
                const token = localStorage.getItem('adminToken');
                const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/withdrawals/${id}`,
                    { status: newStatus === 'approved' ? 'approved' : 'rejected' },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (res.data.success) {
                    setWithdrawals(withdrawals.map(w => w._id === id ? { ...w, status: res.data.data.status } : w));
                    fetchData();
                }
            } catch (err) {
                console.error(err);
                alert(err.response?.data?.message || 'Failed to update request');
            }
        }
    };

    // Driver Wallet Adjustment Submit
    const handleAdjustWalletSubmit = async (e) => {
        e.preventDefault();
        if (!adjustingWallet) return;
        try {
            setAdjustSubmitting(true);
            const token = localStorage.getItem('adminToken');
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/driver-wallets/${adjustingWallet.driverId}/adjust`, {
                type: adjustFormData.type,
                amount: Number(adjustFormData.amount),
                description: adjustFormData.description
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setAdjustingWallet(null);
                setAdjustFormData({ type: 'credit', amount: '', description: '' });
                fetchData();
            } else {
                alert(res.data.message || 'Failed to adjust wallet balance');
            }
        } catch (err) {
            console.error('Error adjusting partner wallet:', err);
            alert(err.response?.data?.message || 'Failed to adjust wallet balance');
        } finally {
            setAdjustSubmitting(false);
        }
    };

    // Customer Wallet Adjustment Submit (PE-03)
    const handleAdjustPassengerWalletSubmit = async (e) => {
        e.preventDefault();
        if (!adjustingPassengerWallet) return;
        try {
            setAdjustSubmitting(true);
            const token = localStorage.getItem('adminToken');
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/passenger-wallets/${adjustingPassengerWallet.passengerId}/adjust`, {
                type: adjustPassengerFormData.type,
                amount: Number(adjustPassengerFormData.amount),
                description: adjustPassengerFormData.description
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setAdjustingPassengerWallet(null);
                setAdjustPassengerFormData({ type: 'credit', amount: '', description: '' });
                fetchData();
            } else {
                alert(res.data.message || 'Failed to adjust customer wallet balance');
            }
        } catch (err) {
            console.error('Error adjusting passenger wallet:', err);
            alert(err.response?.data?.message || 'Failed to adjust customer wallet balance');
        } finally {
            setAdjustSubmitting(false);
        }
    };

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

    // Filter Logic for Partner Wallets (PE-01)
    const filteredWallets = wallets.filter(w => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = (w.driverName || '').toLowerCase().includes(query) ||
            (w.phone || '').includes(searchTerm) ||
            (w.driverId || '').toLowerCase().includes(query);
        const matchesStatus = statusFilter === 'all' || w.walletStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPartnerCapital = wallets.reduce((acc, curr) => acc + (curr.balance || 0), 0);
    const totalPartnerEarnings = wallets.reduce((acc, curr) => acc + (curr.totalEarned || 0), 0);
    const totalPendingPayouts = wallets.reduce((acc, curr) => acc + (curr.pendingAmount || 0), 0);
    const activeWalletsCount = wallets.filter(w => w.walletStatus === 'active').length;

    // Filter Logic for Customer Wallets (PE-03)
    const filteredPassengerWallets = passengerWallets.filter(w => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = (w.passengerName || '').toLowerCase().includes(query) ||
            (w.phone || '').includes(searchTerm) ||
            (w.passengerId || '').toLowerCase().includes(query);

        let matchesTier = true;
        if (tierFilter === 'standard') matchesTier = (w.balance || 0) <= 1000;
        if (tierFilter === 'premium') matchesTier = (w.balance || 0) > 1000;

        return matchesSearch && matchesTier;
    });

    // Filter Logic for Financial Transactions (PE-02 & PE-04)
    const combinedAllTransactions = [...customerTransactions, ...driverTransactions].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    const activeTransactionPool = roleTab === 'passenger'
        ? customerTransactions
        : roleTab === 'driver'
            ? driverTransactions
            : combinedAllTransactions;

    const filteredTransactions = activeTransactionPool.filter(tx => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = (tx.description || '').toLowerCase().includes(query) ||
            (tx.userName || '').toLowerCase().includes(query) ||
            (tx.userPhone || '').includes(searchTerm) ||
            (tx.userRole || '').toLowerCase().includes(query) ||
            (tx.referenceId || '').toLowerCase().includes(query) ||
            (tx._id || '').toLowerCase().includes(query);

        const descLower = (tx.description || '').toLowerCase();
        let matchesType = true;
        if (txTypeFilter === 'credit') matchesType = tx.type === 'credit';
        else if (txTypeFilter === 'debit') matchesType = tx.type === 'debit';
        else if (txTypeFilter === 'refund') matchesType = tx.type === 'credit' && descLower.includes('refund');
        else if (txTypeFilter === 'promo') matchesType = tx.type === 'credit' && (descLower.includes('promo') || descLower.includes('bonus') || descLower.includes('offer'));

        return matchesSearch && matchesType;
    });

    const totalTxCredits = filteredTransactions.filter(t => t.type === 'credit').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalTxDebits = filteredTransactions.filter(t => t.type === 'debit').reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // PE-03: Customer Wallets View Render
    const renderPassengerWallets = () => (
        <div className="space-y-8">
            {/* KPI Metrics Cards for Customer Wallets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Platform Customer Capital</p>
                    <h3 className="text-3xl font-black text-emerald-400 mt-2">₹{(passengerMetrics.totalCapital || 0).toLocaleString()}</h3>
                    <p className="text-xs text-white/30 mt-1">Total liquid balance across customer wallets</p>
                </div>
                <div className="glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Total Customer Refunds</p>
                    <h3 className="text-3xl font-black text-purple-400 mt-2">₹{(passengerMetrics.totalRefunds || 0).toLocaleString()}</h3>
                    <p className="text-xs text-white/30 mt-1">Aggregated refund credits issued</p>
                </div>
                <div className="glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Active Promo Credits</p>
                    <h3 className="text-3xl font-black text-amber-400 mt-2">₹{(passengerMetrics.totalPromoCredits || 0).toLocaleString()}</h3>
                    <p className="text-xs text-white/30 mt-1">Promotional & offer bonuses in wallets</p>
                </div>
                <div className="glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Total Customer Accounts</p>
                    <h3 className="text-3xl font-black text-sky-400 mt-2">{passengerWallets.length}</h3>
                    <p className="text-xs text-white/30 mt-1">Active customer wallets in database</p>
                </div>
            </div>

            {/* Filter & Controls Bar */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search customer wallets by name, phone, customer ID..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-800/80 text-white placeholder:text-slate-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <select
                            className="appearance-none bg-slate-800/80 border border-slate-700 pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            value={tierFilter}
                            onChange={(e) => setTierFilter(e.target.value)}
                        >
                            <option value="all">All Account Tiers</option>
                            <option value="standard">Standard (≤ ₹1,000)</option>
                            <option value="premium">Premium (&gt; ₹1,000)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    <button
                        onClick={() => exportToCSV(filteredPassengerWallets.map(w => ({
                            CustomerName: w.passengerName,
                            CustomerID: w.passengerId,
                            Phone: w.phone,
                            Balance: w.balance,
                            LifetimeCredits: w.totalCredited || 0,
                            LifetimeDebits: w.totalDebited || 0,
                            Tier: w.balance > 1000 ? 'Premium' : 'Standard'
                        })), 'Customer_Wallets_Report')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl text-sm transition-all"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Passenger Wallets Table */}
            <div className="glass-panel rounded-[40px] overflow-hidden border-white/5 shadow-2xl">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Customer Wallets & Credits</h3>
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">Customer Balances, Refunds, Promo Credits & Ledger</p>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-xs font-black text-emerald-500 tracking-tighter uppercase">Total: {filteredPassengerWallets.length} Customers</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2 px-6 pb-6">
                        <thead>
                            <tr className="text-white/20">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Customer Details</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Contact</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Wallet Balance</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Tier</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="space-y-4">
                            {filteredPassengerWallets.slice((custWalletPage - 1) * custWalletLimit, custWalletPage * custWalletLimit).map((wallet, idx) => (
                                <tr key={wallet.passengerId || idx} className="glass-card">
                                    <td className="px-6 py-5 first:rounded-l-3xl">
                                        <div className="text-sm font-black text-white">{wallet.passengerName}</div>
                                        <div className="text-[10px] text-white/30 font-bold font-mono tracking-tighter mt-0.5 uppercase">{wallet.passengerId}</div>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-bold text-white/60">{wallet.phone || '—'}</td>
                                    <td className="px-6 py-5">
                                        <span className="text-lg font-black text-emerald-400">₹{parseFloat(wallet.balance || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${wallet.balance > 1000 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                                            {wallet.balance > 1000 ? 'Premium' : 'Standard'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 last:rounded-r-3xl text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedLedgerPassenger(wallet)}
                                                className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                                                title="View Customer Ledger"
                                            >
                                                <Eye size={14} /> Ledger
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setAdjustingPassengerWallet(wallet);
                                                    setAdjustPassengerFormData({ type: 'credit', amount: '', description: '' });
                                                }}
                                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                                                title="Credit / Refund / Debit Balance"
                                            >
                                                <DollarSign size={14} /> Adjust Balance
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredPassengerWallets.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-400">
                        No customer wallets found matching your search criteria.
                    </div>
                )}

                <Pagination
                    currentPage={custWalletPage}
                    totalEntries={filteredPassengerWallets.length}
                    limit={custWalletLimit}
                    onPageChange={setCustWalletPage}
                    onLimitChange={(l) => { setCustWalletLimit(l); setCustWalletPage(1); }}
                />
            </div>
        </div>
    );

    // PE-01: Partner Wallets View Render
    const renderDriverWalletsWithHistory = () => (
        <div className="space-y-8">
            {/* KPI Cards for PE-01 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Platform Partner Capital</p>
                    <h3 className="text-3xl font-black text-emerald-400 mt-2">₹{totalPartnerCapital.toLocaleString()}</h3>
                    <p className="text-xs text-white/30 mt-1">Liquid balances across all partner wallets</p>
                </div>
                <div className="glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Lifetime Partner Earnings</p>
                    <h3 className="text-3xl font-black text-sky-400 mt-2">₹{totalPartnerEarnings.toLocaleString()}</h3>
                    <p className="text-xs text-white/30 mt-1">Accumulated partner payouts</p>
                </div>
                <div className="glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Pending Withdrawal Queue</p>
                    <h3 className="text-3xl font-black text-amber-400 mt-2">₹{totalPendingPayouts.toLocaleString()}</h3>
                    <p className="text-xs text-white/30 mt-1">Settlement requests awaiting approval</p>
                </div>
                <div className="glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Active Partner Wallets</p>
                    <h3 className="text-3xl font-black text-purple-400 mt-2">{activeWalletsCount} / {wallets.length}</h3>
                    <p className="text-xs text-white/30 mt-1">Operational partner accounts</p>
                </div>
            </div>

            {/* Controls: Search, Filter, CSV Export */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search partner wallets by name, phone, partner ID..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-800/80 text-white placeholder:text-slate-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <select
                            className="appearance-none bg-slate-800/80 border border-slate-700 pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Wallet Statuses</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    <button
                        onClick={() => exportToCSV(filteredWallets.map(w => ({
                            PartnerName: w.driverName,
                            PartnerID: w.driverId,
                            Phone: w.phone,
                            Balance: w.balance,
                            LifetimeEarnings: w.totalEarned,
                            PendingAmount: w.pendingAmount,
                            Status: w.walletStatus
                        })), 'Partner_Wallets_Report')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl text-sm transition-all"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Partner Wallets Table (PE-01) */}
            <div className="glass-panel rounded-[40px] overflow-hidden border-white/5 shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Sanchari Partner Wallets</h3>
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">Platform Capital, Credits, Debits & Status</p>
                    </div>
                    <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        {filteredWallets.length} Partner Accounts
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2 px-6 pb-6">
                        <thead>
                            <tr className="text-white/20">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Partner Details</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Liquid Balance</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Lifetime Earnings</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Pending Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Wallet Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredWallets.slice((driverWalletPage - 1) * driverWalletLimit, driverWalletPage * driverWalletLimit).map((wallet, idx) => (
                                <tr key={wallet.driverId || idx} className="glass-card">
                                    <td className="px-6 py-5 first:rounded-l-3xl">
                                        <div className="text-sm font-black text-white">{wallet.driverName}</div>
                                        <div className="text-xs text-white/40">{wallet.phone}</div>
                                        <div className="text-[9px] text-white/20 font-mono tracking-tighter uppercase mt-0.5">{wallet.driverId}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                                            <span className="text-lg font-black text-sky-400">₹{parseFloat(wallet.balance || 0).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-black text-emerald-400 italic">₹{parseFloat(wallet.totalEarned || 0).toLocaleString()}</td>
                                    <td className="px-6 py-5">
                                        <span className={`text-sm font-bold ${wallet.pendingAmount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                                            ₹{parseFloat(wallet.pendingAmount || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <StatusBadge status={wallet.walletStatus} />
                                    </td>
                                    <td className="px-6 py-5 last:rounded-r-3xl text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedLedgerPartner(wallet)}
                                                className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                                                title="View Credit/Debit Ledger"
                                            >
                                                <Eye size={14} /> Ledger
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setAdjustingWallet(wallet);
                                                    setAdjustFormData({ type: 'credit', amount: '', description: '' });
                                                }}
                                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                                                title="Credit / Debit Adjust Balance"
                                            >
                                                <DollarSign size={14} /> Adjust Balance
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredWallets.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-400">
                        No partner wallets found matching your search.
                    </div>
                )}

                <Pagination
                    currentPage={driverWalletPage}
                    totalEntries={filteredWallets.length}
                    limit={driverWalletLimit}
                    onPageChange={setDriverWalletPage}
                    onLimitChange={(l) => { setDriverWalletLimit(l); setDriverWalletPage(1); }}
                />
            </div>

            {/* Withdrawal Settlements Section */}
            <div className="glass-panel rounded-[40px] overflow-hidden border-white/5 shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Withdrawal Vault</h3>
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">Provider Settlement Queue</p>
                    </div>
                    <button
                        onClick={() => exportToCSV(withdrawals.map(w => ({
                            ID: w._id,
                            Driver: w.driver?.name || 'N/A',
                            Amount: w.amount,
                            Status: w.status,
                            Bank: w.bankDetails?.bankName || 'N/A',
                            Account: w.bankDetails?.accountNumber || 'N/A',
                            Date: new Date(w.createdAt || Date.now()).toLocaleDateString()
                        })), 'Withdrawals_Settlement_Report')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2 px-6 pb-6">
                        <thead>
                            <tr className="text-white/20">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">REQ ID</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Provider</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Current Balance</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Payable Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Bank Details</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                                <th className="px-6 py-4 text-xs text-right uppercase tracking-[0.2em]">Operation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawals.slice((withdrawPage - 1) * withdrawLimit, withdrawPage * withdrawLimit).map(req => (
                                <tr key={req._id} className="glass-card">
                                    <td className="px-6 py-5 first:rounded-l-3xl font-mono text-[10px] font-black text-white/20">#{req._id.slice(-8).toUpperCase()}</td>
                                    <td className="px-6 py-5 text-sm font-black text-white">{req.driver?.name}</td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-black text-white/60">₹{parseFloat(req.driver?.walletBalance || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-5 font-black text-emerald-400 italic">₹{req.amount}</td>
                                    <td className="px-6 py-5">
                                        <div className="text-[10px] font-bold text-white/60">
                                            {req.bankDetails?.bankName || 'N/A'}<br />
                                            A/C: {req.bankDetails?.accountNumber || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <StatusBadge status={req.status} />
                                        {req.processedAt && (
                                            <div className="text-[9px] font-bold text-white/20 mt-1 uppercase">Settled: {new Date(req.processedAt).toLocaleDateString()}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 last:rounded-r-3xl text-right">
                                        {req.status === 'pending' && (
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => handleWithdrawalAction(req._id, 'approved')} className="px-4 py-2 grad-emerald text-white text-[10px] font-black rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">SETTLE</button>
                                                <button onClick={() => handleWithdrawalAction(req._id, 'rejected')} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/40 text-[10px] font-black rounded-xl border border-white/5 transition-all">DENY</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={withdrawPage}
                    totalEntries={withdrawals.length}
                    limit={withdrawLimit}
                    onPageChange={setWithdrawPage}
                    onLimitChange={(l) => { setWithdrawLimit(l); setWithdrawPage(1); }}
                />
            </div>
        </div>
    );

    const renderDashboard = () => (
        <div className="space-y-10">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Volume', value: financeData.totalCollection, icon: CreditCard, grad: 'grad-sky', color: 'text-sky-400' },
                    { label: 'Platform Revenue', value: financeData.totalCommission, icon: DollarSign, grad: 'grad-emerald', color: 'text-emerald-400' },
                    { label: 'Provider Payouts', value: financeData.totalPayouts, icon: Wallet, grad: 'grad-indigo', color: 'text-indigo-400' },
                    { label: 'Net Liquidity', value: financeData.netProfit, icon: Activity, grad: 'grad-sky', color: 'text-white' }
                ].map((kpi, i) => (
                    <div key={i} className="glass-panel p-8 rounded-[40px] border-white/5 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 ${kpi.grad}`} />
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl ${kpi.grad} text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-500`}>
                                <kpi.icon size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">{kpi.label}</p>
                        <h3 className={`text-3xl font-black italic tracking-tighter ${kpi.color}`}>
                            ₹{kpi.value.toLocaleString()}
                        </h3>
                    </div>
                ))}
            </div>

            {/* Revenue Analytics Curve */}
            <div className="glass-panel p-10 rounded-[48px] border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 grad-emerald opacity-20" />
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">Growth Velocity</h3>
                        <p className="text-xs font-bold text-white/30 uppercase tracking-[0.3em] mt-1">Real-time Revenue Telemetry</p>
                    </div>
                    <div className="flex gap-2">
                        {['1D', '1W', '1M', '1Y'].map(t => (
                            <button key={t} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${t === '1W' ? 'grad-emerald text-white' : 'bg-white/5 text-white/20 hover:text-white'}`}>{t}</button>
                        ))}
                    </div>
                </div>
                <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="rgba(255,255,255,0.03)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 900 }} />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                                itemStyle={{ color: '#10b981', fontWeight: 900 }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    // PE-02 & PE-04: Transactions View Render
    const renderTransactions = () => (
        <div className="space-y-8">
            {/* Audience / Role Filter Tabs */}
            <div className="flex gap-3 border-b border-slate-800 pb-4">
                <button
                    onClick={() => setRoleTab('all')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${roleTab === 'all' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800/80 text-slate-400 hover:text-white'}`}
                >
                    <Activity size={16} /> All Transactions
                </button>
                <button
                    onClick={() => setRoleTab('passenger')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${roleTab === 'passenger' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800/80 text-slate-400 hover:text-white'}`}
                >
                    <Users size={16} /> Customer Transactions
                </button>
                <button
                    onClick={() => setRoleTab('driver')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${roleTab === 'driver' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800/80 text-slate-400 hover:text-white'}`}
                >
                    <Wallet size={16} /> Partner Transactions
                </button>
            </div>

            {/* KPI Overview Cards for Transactions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Total Transactions Logged</p>
                    <h3 className="text-3xl font-black text-white mt-2">{filteredTransactions.length}</h3>
                    <p className="text-xs text-white/30 mt-1">Itemized wallet operations ({roleTab})</p>
                </div>

                <div className="glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Total Credited / Refunded Volume</p>
                    <h3 className="text-3xl font-black text-emerald-400 mt-2">₹{totalTxCredits.toLocaleString()}</h3>
                    <p className="text-xs text-white/30 mt-1">Incoming credits, refunds & bonuses</p>
                </div>

                <div className="glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Total Debited Volume</p>
                    <h3 className="text-3xl font-black text-rose-400 mt-2">₹{totalTxDebits.toLocaleString()}</h3>
                    <p className="text-xs text-white/30 mt-1">Payouts & ride payments</p>
                </div>
            </div>

            {/* Search, Filter & CSV Export */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search transactions by user, description, reference ID..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-800/80 text-white placeholder:text-slate-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <select
                            className="appearance-none bg-slate-800/80 border border-slate-700 pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            value={txTypeFilter}
                            onChange={(e) => setTxTypeFilter(e.target.value)}
                        >
                            <option value="all">All Transaction Types</option>
                            <option value="credit">Credits (+)</option>
                            <option value="debit">Debits (-)</option>
                            <option value="refund">Refunds Only</option>
                            <option value="promo">Promo Credits Only</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    <button
                        onClick={() => exportToCSV(filteredTransactions.map(tx => ({
                            TransactionID: tx._id,
                            ReferenceID: tx.referenceId || 'N/A',
                            UserName: tx.userName,
                            UserRole: tx.userRole,
                            UserPhone: tx.userPhone,
                            Type: tx.type,
                            Amount: tx.amount,
                            Description: tx.description,
                            Timestamp: new Date(tx.timestamp).toLocaleString()
                        })), `Financial_Transactions_${roleTab}_Report`)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl text-sm transition-all"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Financial Transactions Table */}
            <div className="glass-panel rounded-[40px] overflow-hidden border-white/5 shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">
                            {roleTab === 'passenger' ? 'Customer Financial Transactions' : roleTab === 'driver' ? 'Partner Financial Transactions' : 'All Platform Financial Transactions'}
                        </h3>
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">Itemized Wallet Audit & Payment History</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        {filteredTransactions.length} Logged Transactions
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2 px-6 pb-6">
                        <thead>
                            <tr className="text-white/20">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Description / Reference</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">User / Account</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Timestamp</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.slice((txPage - 1) * txLimit, txPage * txLimit).map((tx, idx) => (
                                <tr key={tx._id || idx} className="glass-card hover:border-emerald-500/30">
                                    <td className="px-6 py-5 first:rounded-l-3xl">
                                        <div className="text-sm font-black text-white">{tx.description || 'Wallet Transaction'}</div>
                                        <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5">Ref: {tx.referenceId || tx._id || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-bold text-white/90">{tx.userName}</div>
                                        <div className="text-[10px] text-emerald-400 font-semibold uppercase">{tx.userRole} {tx.userPhone ? `• ${tx.userPhone}` : ''}</div>
                                    </td>
                                    <td className="px-6 py-5 text-[11px] font-semibold text-white/50">{new Date(tx.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-5">
                                        <TxTypeBadge type={tx.type} description={tx.description} />
                                    </td>
                                    <td className={`px-6 py-5 last:rounded-r-3xl text-right font-black italic text-lg ${tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {tx.type === 'credit' ? '+' : '-'}₹{(tx.amount || 0).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredTransactions.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-400">
                        No transactions found matching your criteria.
                    </div>
                )}

                <Pagination
                    currentPage={txPage}
                    totalEntries={filteredTransactions.length}
                    limit={txLimit}
                    onPageChange={setTxPage}
                    onLimitChange={(l) => { setTxLimit(l); setTxPage(1); }}
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                    {view === 'dashboard' && 'Financial Overview & Revenue Engine'}
                    {view === 'transactions' && 'Financial Transactions Ledger'}
                    {view === 'driver-wallets' && 'Partner Wallets & Liquid Capital'}
                    {view === 'passenger-wallets' && 'Customer Wallets & Credits'}
                </h1>
                <div className="h-1.5 w-32 grad-emerald rounded-full" />
            </div>

            {view === 'dashboard' && renderDashboard()}
            {view === 'transactions' && renderTransactions()}
            {view === 'driver-wallets' && renderDriverWalletsWithHistory()}
            {view === 'passenger-wallets' && renderPassengerWallets()}

            {/* PE-01: Admin Partner Credit/Debit Adjustment Modal */}
            <Modal
                isOpen={!!adjustingWallet}
                onClose={() => setAdjustingWallet(null)}
                title={`Adjust Partner Wallet - ${adjustingWallet?.driverName}`}
            >
                {adjustingWallet && (
                    <form onSubmit={handleAdjustWalletSubmit} className="space-y-4">
                        <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-slate-400">Current Liquid Balance</p>
                                <p className="text-xl font-bold text-emerald-400">₹{adjustingWallet.balance}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Partner ID</p>
                                <p className="text-xs font-mono text-slate-300">{adjustingWallet.driverId}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Operation Type</label>
                            <select
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={adjustFormData.type}
                                onChange={(e) => setAdjustFormData({ ...adjustFormData, type: e.target.value })}
                            >
                                <option value="credit">Credit (+) - Add Funds to Partner</option>
                                <option value="debit">Debit (-) - Deduct Funds from Partner</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Adjustment Amount (₹)</label>
                            <input
                                type="number"
                                step="any"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Enter amount in INR"
                                value={adjustFormData.amount}
                                onChange={(e) => setAdjustFormData({ ...adjustFormData, amount: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Reference Reason / Description</label>
                            <textarea
                                rows="2"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="e.g. Incentive Bonus, Manual Correction, Penalty Deduction..."
                                value={adjustFormData.description}
                                onChange={(e) => setAdjustFormData({ ...adjustFormData, description: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setAdjustingWallet(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={adjustSubmitting}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                Confirm Adjustment
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* PE-01: Partner Itemized Ledger History Modal */}
            <Modal
                isOpen={!!selectedLedgerPartner}
                onClose={() => setSelectedLedgerPartner(null)}
                title={`Itemized Ledger History - ${selectedLedgerPartner?.driverName}`}
            >
                {selectedLedgerPartner && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs">
                            <span className="text-slate-400">Current Balance: <strong className="text-emerald-400 font-bold">₹{selectedLedgerPartner.balance}</strong></span>
                            <span className="text-slate-400">Partner ID: <strong className="text-slate-200">{selectedLedgerPartner.driverId}</strong></span>
                        </div>

                        <div className="overflow-y-auto max-h-[50vh] border border-slate-800 rounded-xl">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-800/80 text-slate-400 sticky top-0">
                                    <tr>
                                        <th className="p-3">Type</th>
                                        <th className="p-3">Amount</th>
                                        <th className="p-3">Description</th>
                                        <th className="p-3 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {(selectedLedgerPartner.transactions || []).length > 0 ? selectedLedgerPartner.transactions.map((tx, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/30">
                                            <td className="p-3">
                                                <TxTypeBadge type={tx.type} description={tx.description} />
                                            </td>
                                            <td className={`p-3 font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                                            </td>
                                            <td className="p-3 text-slate-300">
                                                <div>{tx.description || 'N/A'}</div>
                                                <div className="text-[9px] text-slate-500 font-mono">Ref: {tx.referenceId || tx._id || 'N/A'}</div>
                                            </td>
                                            <td className="p-3 text-right text-slate-500">
                                                {new Date(tx.timestamp).toLocaleString()}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="p-6 text-center text-slate-500">No transactions recorded for this partner.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Modal>

            {/* PE-03: Admin Customer Credit/Refund/Debit Adjustment Modal */}
            <Modal
                isOpen={!!adjustingPassengerWallet}
                onClose={() => setAdjustingPassengerWallet(null)}
                title={`Adjust Customer Wallet - ${adjustingPassengerWallet?.passengerName}`}
            >
                {adjustingPassengerWallet && (
                    <form onSubmit={handleAdjustPassengerWalletSubmit} className="space-y-4">
                        <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-slate-400">Current Customer Balance</p>
                                <p className="text-xl font-bold text-emerald-400">₹{adjustingPassengerWallet.balance}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Customer ID</p>
                                <p className="text-xs font-mono text-slate-300">{adjustingPassengerWallet.passengerId}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Adjustment Type</label>
                            <select
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={adjustPassengerFormData.type}
                                onChange={(e) => setAdjustPassengerFormData({ ...adjustPassengerFormData, type: e.target.value })}
                            >
                                <option value="credit">Credit (+) - Add Direct Wallet Balance</option>
                                <option value="refund">Refund (+) - Issue Customer Refund Credit</option>
                                <option value="promo">Promo Credit (+) - Add Promotional / Bonus Credit</option>
                                <option value="debit">Debit (-) - Deduct Funds from Customer</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Amount (₹)</label>
                            <input
                                type="number"
                                step="any"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Enter amount in INR"
                                value={adjustPassengerFormData.amount}
                                onChange={(e) => setAdjustPassengerFormData({ ...adjustPassengerFormData, amount: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Reason / Description</label>
                            <textarea
                                rows="2"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="e.g. Refund for cancelled ride #1042, Promotional Signup Bonus, Manual Adjustment..."
                                value={adjustPassengerFormData.description}
                                onChange={(e) => setAdjustPassengerFormData({ ...adjustPassengerFormData, description: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setAdjustingPassengerWallet(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={adjustSubmitting}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                Confirm Adjustment
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* PE-03: Customer Itemized Ledger History Modal */}
            <Modal
                isOpen={!!selectedLedgerPassenger}
                onClose={() => setSelectedLedgerPassenger(null)}
                title={`Customer Itemized Ledger - ${selectedLedgerPassenger?.passengerName}`}
            >
                {selectedLedgerPassenger && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs">
                            <span className="text-slate-400">Current Balance: <strong className="text-emerald-400 font-bold">₹{selectedLedgerPassenger.balance}</strong></span>
                            <span className="text-slate-400">Customer ID: <strong className="text-slate-200">{selectedLedgerPassenger.passengerId}</strong></span>
                        </div>

                        <div className="overflow-y-auto max-h-[50vh] border border-slate-800 rounded-xl">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-800/80 text-slate-400 sticky top-0">
                                    <tr>
                                        <th className="p-3">Type</th>
                                        <th className="p-3">Amount</th>
                                        <th className="p-3">Description</th>
                                        <th className="p-3 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {(selectedLedgerPassenger.transactions || []).length > 0 ? selectedLedgerPassenger.transactions.map((tx, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/30">
                                            <td className="p-3">
                                                <TxTypeBadge type={tx.type} description={tx.description} />
                                            </td>
                                            <td className={`p-3 font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                                            </td>
                                            <td className="p-3 text-slate-300">
                                                <div>{tx.description || 'N/A'}</div>
                                                <div className="text-[9px] text-slate-500 font-mono">Ref: {tx.referenceId || tx._id || 'N/A'}</div>
                                            </td>
                                            <td className="p-3 text-right text-slate-500">
                                                {new Date(tx.timestamp).toLocaleString()}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="p-6 text-center text-slate-500">No transactions recorded for this customer.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PaymentManagement;

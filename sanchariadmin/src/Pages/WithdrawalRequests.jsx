import React, { useState, useEffect, useCallback } from 'react';
import {
    CreditCard, Download, Search, Filter,
    CheckCircle, XCircle, Clock, AlertTriangle,
    Wallet, ChevronDown, RefreshCw, DollarSign,
    Building, AlertCircle, ArrowUpRight, Check, X
} from 'lucide-react';
import axios from 'axios';
import Pagination from '../Components/Pagination';

const StatusBadge = ({ status }) => {
    const styles = {
        approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
            {status}
        </span>
    );
};

const WithdrawalRequests = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const fetchWithdrawals = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/withdrawals`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setWithdrawals(res.data.data || []);
            } else {
                setError(res.data.message || 'Failed to load withdrawal requests');
            }
        } catch (err) {
            console.error('Error fetching withdrawal requests:', err);
            setError(err.response?.data?.message || 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWithdrawals();
    }, [fetchWithdrawals]);

    const handleWithdrawalAction = async (id, newStatus) => {
        const verb = newStatus === 'approved' ? 'approve and settle' : 'reject';
        if (window.confirm(`Are you sure you want to ${verb} this withdrawal request?`)) {
            try {
                setActionLoading(id);
                const token = localStorage.getItem('adminToken');
                const res = await axios.put(
                    `${import.meta.env.VITE_API_BASE_URL}/api/admin/withdrawals/${id}`,
                    { status: newStatus === 'approved' ? 'approved' : 'rejected' },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (res.data.success) {
                    setWithdrawals(prev => prev.map(w => w._id === id ? { ...w, status: res.data.data.status, processedAt: res.data.data.processedAt || new Date().toISOString() } : w));
                    fetchWithdrawals();
                } else {
                    alert(res.data.message || 'Failed to update withdrawal request');
                }
            } catch (err) {
                console.error(err);
                alert(err.response?.data?.message || 'Failed to update request');
            } finally {
                setActionLoading(null);
            }
        }
    };

    const exportToCSV = () => {
        if (!withdrawals || !withdrawals.length) {
            alert('No withdrawal request data available to export');
            return;
        }
        const csvRows = [
            ['Request ID', 'Driver Name', 'Driver Phone', 'Driver Wallet Balance', 'Requested Amount', 'Bank Name', 'Account Number', 'IFSC Code', 'UPI ID', 'Status', 'Requested At', 'Processed At'].join(','),
            ...withdrawals.map(w => [
                `"${w._id}"`,
                `"${w.driver?.name || 'N/A'}"`,
                `"${w.driver?.phone || 'N/A'}"`,
                w.driver?.walletBalance || 0,
                w.amount || 0,
                `"${w.bankDetails?.bankName || w.driver?.driverDetails?.bankDetails?.bankName || 'N/A'}"`,
                `"${w.bankDetails?.accountNumber || w.driver?.driverDetails?.bankDetails?.accountNumber || 'N/A'}"`,
                `"${w.bankDetails?.ifscCode || w.driver?.driverDetails?.bankDetails?.ifscCode || 'N/A'}"`,
                `"${w.bankDetails?.upiId || w.driver?.driverDetails?.bankDetails?.upiId || 'N/A'}"`,
                `"${w.status}"`,
                `"${new Date(w.createdAt || Date.now()).toLocaleString()}"`,
                `"${w.processedAt ? new Date(w.processedAt).toLocaleString() : 'N/A'}"`
            ].join(','))
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Driver_Withdrawal_Requests_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter Logic
    const filteredWithdrawals = withdrawals.filter(w => {
        const query = searchTerm.toLowerCase();
        const driverName = (w.driver?.name || '').toLowerCase();
        const driverPhone = (w.driver?.phone || '').toLowerCase();
        const reqId = (w._id || '').toLowerCase();
        const bankName = (w.bankDetails?.bankName || w.driver?.driverDetails?.bankDetails?.bankName || '').toLowerCase();
        const accountNumber = (w.bankDetails?.accountNumber || w.driver?.driverDetails?.bankDetails?.accountNumber || '').toLowerCase();

        const matchesSearch = driverName.includes(query) ||
            driverPhone.includes(query) ||
            reqId.includes(query) ||
            bankName.includes(query) ||
            accountNumber.includes(query);

        const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Metrics Calculations
    const totalCount = withdrawals.length;
    const pendingRequests = withdrawals.filter(w => w.status === 'pending');
    const pendingAmountSum = pendingRequests.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    
    const approvedRequests = withdrawals.filter(w => w.status === 'approved' || w.status === 'completed');
    const approvedAmountSum = approvedRequests.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const rejectedRequestsCount = withdrawals.filter(w => w.status === 'rejected').length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
                        <CreditCard className="text-emerald-400" size={32} /> Driver Withdrawal Requests
                    </h1>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        Review, Settle, or Reject Driver Wallet Payout Requests
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchWithdrawals}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-all border border-slate-700"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Total Payout Requests</p>
                    <h3 className="text-3xl font-black text-white mt-2">{totalCount}</h3>
                    <p className="text-xs text-white/30 mt-1">All-time driver settlement requests</p>
                </div>

                <div className="glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full" />
                    <p className="text-[10px] font-black text-amber-400/80 uppercase tracking-[0.2em]">Pending Queue ({pendingRequests.length})</p>
                    <h3 className="text-3xl font-black text-amber-400 mt-2">₹{pendingAmountSum.toLocaleString()}</h3>
                    <p className="text-xs text-white/30 mt-1">Awaiting admin review & bank payout</p>
                </div>

                <div className="glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full" />
                    <p className="text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.2em]">Settled & Approved</p>
                    <h3 className="text-3xl font-black text-emerald-400 mt-2">₹{approvedAmountSum.toLocaleString()}</h3>
                    <p className="text-xs text-white/30 mt-1">{approvedRequests.length} requests successfully paid out</p>
                </div>

                <div className="glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden">
                    <p className="text-[10px] font-black text-rose-400/80 uppercase tracking-[0.2em]">Rejected Requests</p>
                    <h3 className="text-3xl font-black text-rose-400 mt-2">{rejectedRequestsCount}</h3>
                    <p className="text-xs text-white/30 mt-1">Declined or invalid requests</p>
                </div>
            </div>

            {/* Filter & Control Bar */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by driver name, phone, bank name, account number..."
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
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="all">All Request Statuses</option>
                            <option value="pending">Pending Queue Only</option>
                            <option value="approved">Approved & Settled</option>
                            <option value="rejected">Rejected Only</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="glass-panel rounded-[40px] overflow-hidden border-white/5 shadow-2xl">
                {error && (
                    <div className="m-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-3 text-sm font-bold">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2 px-6 pb-6">
                        <thead>
                            <tr className="text-white/20">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Request ID</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Driver Info</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Wallet Balance</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Requested Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Bank Details</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Status & Timestamps</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                        Loading withdrawal requests...
                                    </td>
                                </tr>
                            ) : filteredWithdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                        No driver withdrawal requests found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredWithdrawals.slice((currentPage - 1) * limit, currentPage * limit).map(req => {
                                    const bank = req.bankDetails || req.driver?.driverDetails?.bankDetails || {};
                                    return (
                                        <tr key={req._id} className="glass-card hover:border-emerald-500/30 transition-all">
                                            <td className="px-6 py-5 first:rounded-l-3xl font-mono text-[10px] font-black text-white/30">
                                                #{req._id.slice(-8).toUpperCase()}
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="text-sm font-black text-white">{req.driver?.name || 'Unknown Driver'}</div>
                                                <div className="text-xs text-white/40">{req.driver?.phone || '—'}</div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <span className="text-sm font-black text-slate-300">
                                                    ₹{parseFloat(req.driver?.walletBalance || 0).toLocaleString()}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5">
                                                <span className="text-lg font-black text-emerald-400 italic">
                                                    ₹{parseFloat(req.amount || 0).toLocaleString()}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="text-xs text-slate-300 font-medium">
                                                    <div className="font-bold text-white">{bank.bankName || bank.accountHolderName || 'N/A'}</div>
                                                    <div className="text-[11px] text-slate-400 font-mono">A/C: {bank.accountNumber || 'N/A'}</div>
                                                    {bank.ifscCode && <div className="text-[10px] text-slate-500">IFSC: {bank.ifscCode}</div>}
                                                    {bank.upiId && <div className="text-[10px] text-emerald-400">UPI: {bank.upiId}</div>}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <StatusBadge status={req.status} />
                                                <div className="text-[10px] text-white/30 font-semibold mt-1">
                                                    Req: {new Date(req.createdAt || Date.now()).toLocaleDateString()}
                                                </div>
                                                {req.processedAt && (
                                                    <div className="text-[9px] text-emerald-400/70 font-semibold">
                                                        Settled: {new Date(req.processedAt).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-5 last:rounded-r-3xl text-right">
                                                {req.status === 'pending' ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            disabled={actionLoading === req._id}
                                                            onClick={() => handleWithdrawalAction(req._id, 'approved')}
                                                            className="px-4 py-2 grad-emerald text-white text-[10px] font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                                                        >
                                                            <Check size={14} /> SETTLE
                                                        </button>
                                                        <button
                                                            disabled={actionLoading === req._id}
                                                            onClick={() => handleWithdrawalAction(req._id, 'rejected')}
                                                            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-black rounded-xl transition-all flex items-center gap-1"
                                                        >
                                                            <X size={14} /> DENY
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500 font-semibold italic">
                                                        Processed
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalEntries={filteredWithdrawals.length}
                    limit={limit}
                    onPageChange={setCurrentPage}
                    onLimitChange={(l) => { setLimit(l); setCurrentPage(1); }}
                />
            </div>
        </div>
    );
};

export default WithdrawalRequests;

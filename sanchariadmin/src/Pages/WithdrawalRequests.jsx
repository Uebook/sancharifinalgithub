import React, { useState, useEffect, useCallback } from 'react';
import {
    CreditCard, Download, Search, Filter,
    CheckCircle, XCircle, Clock, AlertTriangle,
    Wallet, ChevronDown, RefreshCw, DollarSign,
    Building, AlertCircle, ArrowUpRight, Check, X,
    Zap, ExternalLink, ShieldCheck, Loader2, Copy
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
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
    
    // Modal States
    const [payoutModalReq, setPayoutModalReq] = useState(null);
    const [manualModalReq, setManualModalReq] = useState(null);
    const [rejectModalReq, setRejectModalReq] = useState(null);

    // Form inputs for modals
    const [manualUtr, setManualUtr] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [modalSuccess, setModalSuccess] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

    const fetchWithdrawals = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${API_BASE_URL}/api/admin/withdrawals`, {
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
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchWithdrawals();
    }, [fetchWithdrawals]);

    // Handle Direct Cashfree Payout Execution
    const executeCashfreePayout = async () => {
        if (!payoutModalReq) return;
        setModalLoading(true);
        setModalError(null);
        setModalSuccess(null);

        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.post(
                `${API_BASE_URL}/api/admin/withdrawals/${payoutModalReq._id}/payout`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setModalSuccess(res.data.message || `Payout disbursed successfully! UTR: ${res.data.utr}`);
                setTimeout(() => {
                    setPayoutModalReq(null);
                    setModalSuccess(null);
                    fetchWithdrawals();
                }, 2000);
            } else {
                setModalError(res.data.message || 'Cashfree Payout execution failed.');
            }
        } catch (err) {
            console.error('Cashfree Payout error:', err);
            setModalError(err.response?.data?.message || 'Failed to execute Cashfree Payout');
        } finally {
            setModalLoading(false);
        }
    };

    // Handle Manual Offline Settlement
    const executeManualSettlement = async () => {
        if (!manualModalReq) return;
        if (!manualUtr.trim()) {
            setModalError('Please enter a Transaction Reference ID / UTR');
            return;
        }

        setModalLoading(true);
        setModalError(null);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.put(
                `${API_BASE_URL}/api/admin/withdrawals/${manualModalReq._id}`,
                {
                    status: 'approved',
                    transactionId: manualUtr.trim(),
                    remark: 'Settled Manually by Admin'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setManualModalReq(null);
                setManualUtr('');
                fetchWithdrawals();
            } else {
                setModalError(res.data.message || 'Failed to update request');
            }
        } catch (err) {
            console.error(err);
            setModalError(err.response?.data?.message || 'Failed to settle request');
        } finally {
            setModalLoading(false);
        }
    };

    // Handle Request Rejection
    const executeRejection = async () => {
        if (!rejectModalReq) return;
        setModalLoading(true);
        setModalError(null);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.put(
                `${API_BASE_URL}/api/admin/withdrawals/${rejectModalReq._id}`,
                {
                    status: 'rejected',
                    remark: rejectReason.trim() || 'Declined by Admin'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setRejectModalReq(null);
                setRejectReason('');
                fetchWithdrawals();
            } else {
                setModalError(res.data.message || 'Failed to reject request');
            }
        } catch (err) {
            console.error(err);
            setModalError(err.response?.data?.message || 'Failed to reject request');
        } finally {
            setModalLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!withdrawals || !withdrawals.length) {
            alert('No withdrawal request data available to export');
            return;
        }
        const csvRows = [
            ['Request ID', 'Driver Name', 'Driver Phone', 'Driver Wallet Balance', 'Requested Amount', 'Bank Name', 'Account Number', 'IFSC Code', 'UPI ID', 'Status', 'Transaction ID / UTR', 'Requested At', 'Processed At'].join(','),
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
                `"${w.transactionId || 'N/A'}"`,
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
        const upi = (w.bankDetails?.upiId || w.driver?.driverDetails?.bankDetails?.upiId || '').toLowerCase();

        const matchesSearch = driverName.includes(query) ||
            driverPhone.includes(query) ||
            reqId.includes(query) ||
            bankName.includes(query) ||
            accountNumber.includes(query) ||
            upi.includes(query);

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
                        Review, Settle via Cashfree Payouts, or Reject Driver Wallet Requests
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
                        placeholder="Search by driver name, phone, bank name, account number, UPI..."
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
                            <option value="completed">Completed / Settled</option>
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
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Bank Details & UPI</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Status & Ref</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right">Settlement Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Loader2 size={32} className="animate-spin text-emerald-400" />
                                            <p className="text-sm font-semibold text-slate-200">Loading withdrawal requests...</p>
                                        </div>
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
                                    const upi = req.bankDetails?.upiId || req.driver?.driverDetails?.bankDetails?.upiId || '';

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
                                                <div className="text-[10px] text-slate-500">
                                                    Fee: ₹{req.fee || (req.amount * 0.02).toFixed(2)}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="text-xs text-slate-300 font-medium">
                                                    {bank.accountNumber ? (
                                                        <>
                                                            <div className="font-bold text-white">{bank.bankName || bank.accountHolderName || 'Bank Account'}</div>
                                                            <div className="text-[11px] text-slate-400 font-mono">A/C: {bank.accountNumber}</div>
                                                            <div className="text-[10px] text-slate-500">IFSC: {bank.ifscCode || 'N/A'}</div>
                                                        </>
                                                    ) : upi ? (
                                                        <>
                                                            <div className="font-bold text-emerald-400 flex items-center gap-1">
                                                                <Zap size={12} /> UPI VPA
                                                            </div>
                                                            <div className="text-[11px] text-white font-mono">{upi}</div>
                                                        </>
                                                    ) : (
                                                        <span className="text-rose-400 text-xs font-semibold">No bank/UPI added</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <StatusBadge status={req.status} />
                                                <div className="text-[10px] text-white/30 font-semibold mt-1">
                                                    Req: {new Date(req.createdAt || Date.now()).toLocaleDateString()}
                                                </div>
                                                {req.transactionId && (
                                                    <div className="text-[10px] text-emerald-400/90 font-mono mt-0.5 flex items-center gap-1">
                                                        UTR: {req.transactionId.slice(0, 16)}...
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-5 last:rounded-r-3xl text-right">
                                                {req.status === 'pending' ? (
                                                    <div className="flex items-center justify-end gap-2 flex-wrap">
                                                        <button
                                                            onClick={() => {
                                                                setPayoutModalReq(req);
                                                                setModalError(null);
                                                                setModalSuccess(null);
                                                            }}
                                                            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-[10px] font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                                                        >
                                                            <Zap size={13} className="text-amber-300" /> CASHFREE
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setManualModalReq(req);
                                                                setManualUtr('');
                                                                setModalError(null);
                                                            }}
                                                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-xl border border-slate-700 transition-all"
                                                        >
                                                            MANUAL
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setRejectModalReq(req);
                                                                setRejectReason('');
                                                                setModalError(null);
                                                            }}
                                                            className="px-2.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-black rounded-xl transition-all"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500 font-semibold italic">
                                                        {req.status === 'completed' ? '✓ Paid & Settled' : 'Declined'}
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
                    totalItems={filteredWithdrawals.length}
                    itemsPerPage={limit}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(l) => { setLimit(l); setCurrentPage(1); }}
                />
            </div>

            {/* ========================================================= */}
            {/* CASHFREE INSTANT PAYOUT CONFIRMATION MODAL */}
            {/* ========================================================= */}
            <AnimatePresence>
                {payoutModalReq && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                        <Zap size={22} className="text-amber-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white">Cashfree Instant Payout</h3>
                                        <p className="text-xs text-slate-400">Direct disbursement to driver bank / UPI</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setPayoutModalReq(null)}
                                    disabled={modalLoading}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Payout Details Card */}
                            <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800 space-y-3.5">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Driver:</span>
                                    <span className="font-bold text-white">{payoutModalReq.driver?.name} ({payoutModalReq.driver?.phone})</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Beneficiary Target:</span>
                                    <span className="font-mono font-bold text-emerald-400">
                                        {payoutModalReq.bankDetails?.accountNumber
                                            ? `A/C: ${payoutModalReq.bankDetails.accountNumber} (${payoutModalReq.bankDetails.ifscCode})`
                                            : payoutModalReq.bankDetails?.upiId
                                            ? `UPI: ${payoutModalReq.bankDetails.upiId}`
                                            : payoutModalReq.driver?.driverDetails?.bankDetails?.accountNumber
                                            ? `A/C: ${payoutModalReq.driver.driverDetails.bankDetails.accountNumber} (${payoutModalReq.driver.driverDetails.bankDetails.ifscCode})`
                                            : 'No Bank Details Found'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Requested Amount:</span>
                                    <span className="font-bold text-white">₹{payoutModalReq.amount}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Platform Fee (2%):</span>
                                    <span className="text-slate-400">₹{(payoutModalReq.amount * 0.02).toFixed(2)}</span>
                                </div>
                                <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                                    <span className="text-sm font-bold text-white">Net Disbursement Amount:</span>
                                    <span className="text-xl font-black text-emerald-400 italic">
                                        ₹{(payoutModalReq.amount - (payoutModalReq.amount * 0.02)).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Feedback Messages */}
                            {modalError && (
                                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{modalError}</span>
                                </div>
                            )}

                            {modalSuccess && (
                                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                                    <CheckCircle size={16} className="shrink-0" />
                                    <span>{modalSuccess}</span>
                                </div>
                            )}

                            {/* Modal Action Buttons */}
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={() => setPayoutModalReq(null)}
                                    disabled={modalLoading}
                                    className="w-1/2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeCashfreePayout}
                                    disabled={modalLoading || Boolean(modalSuccess)}
                                    className="w-1/2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {modalLoading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" /> Transferring...
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={15} className="text-amber-300" /> Execute Transfer
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ========================================================= */}
            {/* MANUAL OFFLINE SETTLEMENT MODAL */}
            {/* ========================================================= */}
            <AnimatePresence>
                {manualModalReq && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6"
                        >
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                <h3 className="text-lg font-black text-white">Manual Bank Settlement</h3>
                                <button onClick={() => setManualModalReq(null)} className="text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-xs text-slate-400">
                                Record an offline bank transfer or net banking settlement for driver <strong>{manualModalReq.driver?.name}</strong> (₹{manualModalReq.amount}).
                            </p>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    Bank Transaction Reference / UTR
                                </label>
                                <input
                                    type="text"
                                    value={manualUtr}
                                    onChange={(e) => setManualUtr(e.target.value)}
                                    placeholder="e.g. UTR1234567890 / IMPS Reference"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-emerald-400"
                                />
                            </div>

                            {modalError && (
                                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
                                    {modalError}
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setManualModalReq(null)}
                                    className="w-1/2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeManualSettlement}
                                    disabled={modalLoading}
                                    className="w-1/2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20"
                                >
                                    {modalLoading ? 'Saving...' : 'Confirm Settlement'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ========================================================= */}
            {/* REJECT REQUEST MODAL */}
            {/* ========================================================= */}
            <AnimatePresence>
                {rejectModalReq && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6"
                        >
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                <h3 className="text-lg font-black text-rose-400">Reject Withdrawal Request</h3>
                                <button onClick={() => setRejectModalReq(null)} className="text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-xs text-slate-400">
                                Decline withdrawal request of ₹{rejectModalReq.amount} for <strong>{rejectModalReq.driver?.name}</strong>. The amount will remain in their wallet.
                            </p>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    Rejection Reason (Sent to Driver)
                                </label>
                                <textarea
                                    rows={3}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="e.g. Invalid bank account number, please update bank details in profile."
                                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-400"
                                />
                            </div>

                            {modalError && (
                                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
                                    {modalError}
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setRejectModalReq(null)}
                                    className="w-1/2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeRejection}
                                    disabled={modalLoading}
                                    className="w-1/2 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20"
                                >
                                    {modalLoading ? 'Declining...' : 'Decline Request'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WithdrawalRequests;

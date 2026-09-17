import React, { useState } from 'react';
import { DollarSign, Car, Bike, Shield, Zap, CheckCircle, Save } from 'lucide-react';

const PoolPricingConfig = () => {
    const [config, setConfig] = useState({
        bikePoolBaseMin: 80,
        bikePoolBaseMax: 180,
        bikeSeatsLimit: 1,
        carPoolBaseMin: 150,
        carPoolBaseMax: 300,
        carSeatsLimit: 4,
        acPremiumRate: 10,
        platformCommissionPercent: 15,
        defaultDailyTargetGoal: 1000,
        reserveLadiesSeatEnabled: true,
    });

    const [savedMsg, setSavedMsg] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
    };

    return (
        <div className="p-6 max-w-6xl mx-auto text-slate-100">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <DollarSign className="w-7 h-7 text-emerald-400" />
                        Pool Pricing & Preference Rules Config
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Configure pricing boundaries, AC surcharges, seat caps, and driver targets across Bike & Car Pool modes.
                    </p>
                </div>
                {savedMsg && (
                    <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-lg text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" /> Config Saved Successfully!
                    </div>
                )}
            </div>

            <form onSubmit={handleSave} className="space-y-6">

                {/* Bike Pool Settings */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
                        <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                            <Bike className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Bike Pool Settings</h2>
                            <p className="text-xs text-slate-400">Intra-city 2-wheeler commute parameters (Local routes &lt; 100 km)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Min Base Fare (₹)</label>
                            <input
                                type="number"
                                value={config.bikePoolBaseMin}
                                onChange={(e) => setConfig({ ...config, bikePoolBaseMin: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Max Base Fare (₹)</label>
                            <input
                                type="number"
                                value={config.bikePoolBaseMax}
                                onChange={(e) => setConfig({ ...config, bikePoolBaseMax: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Fixed Seats Offered</label>
                            <input
                                type="number"
                                value={config.bikeSeatsLimit}
                                disabled
                                className="w-full bg-slate-950/60 border border-slate-800/60 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                            />
                            <span className="text-[10px] text-slate-500 mt-1 block">Fixed 1 pillion seat for 2-wheelers</span>
                        </div>
                    </div>
                </div>

                {/* Car Pool Settings */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
                        <div className="p-2.5 bg-blue-500/10 rounded-lg">
                            <Car className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Car Pool Settings</h2>
                            <p className="text-xs text-slate-400">4-wheeler pool parameters, comfort add-ons & seat capacity</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Min Base Fare (₹)</label>
                            <input
                                type="number"
                                value={config.carPoolBaseMin}
                                onChange={(e) => setConfig({ ...config, carPoolBaseMin: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Max Base Fare (₹)</label>
                            <input
                                type="number"
                                value={config.carPoolBaseMax}
                                onChange={(e) => setConfig({ ...config, carPoolBaseMax: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Max Seats Offered</label>
                            <input
                                type="number"
                                value={config.carSeatsLimit}
                                onChange={(e) => setConfig({ ...config, carSeatsLimit: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">AC Surcharge / Seat (₹)</label>
                            <input
                                type="number"
                                value={config.acPremiumRate}
                                onChange={(e) => setConfig({ ...config, acPremiumRate: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Platform Commission & Safety Rules */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
                        <div className="p-2.5 bg-indigo-500/10 rounded-lg">
                            <Shield className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Platform Rules & Safety Allocation</h2>
                            <p className="text-xs text-slate-400">Commission rates, women safety seat reservations & driver targets</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Platform Commission (%)</label>
                            <input
                                type="number"
                                value={config.platformCommissionPercent}
                                onChange={(e) => setConfig({ ...config, platformCommissionPercent: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Default Driver Target (₹)</label>
                            <input
                                type="number"
                                value={config.defaultDailyTargetGoal}
                                onChange={(e) => setConfig({ ...config, defaultDailyTargetGoal: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex items-center justify-between pt-5">
                            <span className="text-xs font-medium text-slate-300">Allow Ladies Reserved Seat</span>
                            <input
                                type="checkbox"
                                checked={config.reserveLadiesSeatEnabled}
                                onChange={(e) => setConfig({ ...config, reserveLadiesSeatEnabled: e.target.checked })}
                                className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Action */}
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        <Save className="w-4 h-4" /> Save Configuration
                    </button>
                </div>

            </form>
        </div>
    );
};

export default PoolPricingConfig;

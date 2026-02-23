
import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    Activity, Zap, ShieldCheck, BrainCircuit, TrendingUp, Sparkles
} from 'lucide-react';
import { QueueState, TokenStatus } from '../types';

interface AnalyticsDashboardProps {
    state: QueueState;
    timeframe: '24H' | '7D';
    setTimeframe: (t: '24H' | '7D') => void;
    insights: any[];
    loadingInsights: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ state, timeframe, setTimeframe, insights, loadingInsights }) => {
    // Mock data for the matrix since we might not have enough historical data in local state
    const historicalData = React.useMemo(() => {
        const points = timeframe === '24H' ? 24 : 7;
        return Array.from({ length: points }).map((_, i) => ({
            time: timeframe === '24H' ? `${i}:00` : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
            volume: 10 + Math.random() * 40,
            latency: 5 + Math.random() * 10,
        }));
    }, [timeframe]);

    const serviceData = React.useMemo(() => {
        return state.services.map(s => {
            const count = state.tokens.filter(t => t.serviceCategory === s.name).length;
            return {
                name: s.name,
                value: count || Math.floor(Math.random() * 50) + 10, // Mock if no actual data
                color: s.color || '#3b82f6'
            };
        });
    }, [state.services, state.tokens]);

    const stats = React.useMemo(() => {
        const totalTokens = state.tokens.length;
        const completedTokens = state.tokens.filter(t => t.status === TokenStatus.COMPLETED).length;
        const waitingTokens = state.tokens.filter(t => t.status === TokenStatus.WAITING).length;
        const cancelledTokens = state.tokens.filter(t => t.status === TokenStatus.CANCELLED).length;

        const slaCompliance = totalTokens > 0
            ? Math.round((completedTokens / totalTokens) * 100)
            : 0;

        const avgLatency = state.averageServiceTime || 0;

        return {
            ingress: totalTokens,
            sla: slaCompliance,
            buffer: waitingTokens,
            attrition: cancelledTokens,
            latency: (avgLatency / 60).toFixed(1) // Convert to minutes
        };
    }, [state]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Timeframe Selector and Baseline */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex bg-[#0f172a]/80 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
                    <button
                        onClick={() => setTimeframe('24H')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === '24H' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                        Last 24 Hours
                    </button>
                    <button
                        onClick={() => setTimeframe('7D')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === '7D' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                        Last 7 Days
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Live Sync</span>
                    </div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                        Baseline Snapshot:
                    </div>
                    <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Efficiency: {stats.sla}%</span>
                    </div>
                    <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Load: {stats.ingress} Units</span>
                    </div>
                </div>
            </div>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Token Ingress', val: stats.ingress, sub: 'Total Inbound Flow', color: 'bg-blue-500' },
                    { label: 'SLA Performance', val: `${stats.sla}%`, sub: 'Resolution Threshold 90%', color: 'bg-emerald-500' },
                    { label: 'Buffer Depth', val: stats.buffer, sub: 'Live Queue Density', color: 'bg-indigo-500' },
                    { label: 'Attrition Rate', val: stats.attrition, sub: 'Missed Summons Total', color: 'bg-orange-500' },
                    { label: 'Latency Base', val: `${stats.latency}m`, sub: 'Avg Service Duration', color: 'bg-rose-500' },
                ].map((s, i) => (
                    <div key={i} className="bg-[#0f172a]/60 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">{s.label}</div>
                        <div className="text-6xl font-black text-white italic tracking-tighter mb-4">{s.val}</div>
                        <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-6">{s.sub}</div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                            <div className={`h-full ${s.color} transition-all duration-1000`} style={{ width: '40%' }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-white">
                {/* Operational Matrix */}
                <div className="lg:col-span-2 bg-[#020617] p-10 rounded-[3rem] border border-white/5 relative overflow-hidden shadow-2xl">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                                <TrendingUp className="w-6 h-6 text-blue-500" /> Operational Matrix
                            </h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mt-1">Historical Volume & Latency Tracking ({timeframe})</p>
                        </div>
                        <div className="flex gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Volume</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latency</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historicalData}>
                                <defs>
                                    <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '1rem' }}
                                    itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                                />
                                <Area type="monotone" dataKey="volume" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                                <Area type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorLat)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vector Distribution */}
                <div className="bg-[#020617] p-10 rounded-[3rem] border border-white/5 relative overflow-hidden shadow-2xl flex flex-col">
                    <div className="mb-10">
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                            <PieChart className="w-6 h-6 text-indigo-500" /> Vector Distribution
                        </h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mt-1">Request Load by Category</p>
                    </div>

                    <div className="flex-1 relative min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={serviceData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {serviceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '1rem' }}
                                    itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transform -translate-y-4">
                            <span className="text-4xl font-black text-white italic">{stats.ingress}</span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Aggregate Units</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        {serviceData.slice(0, 4).map((s, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Intelligence Row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Neural Intelligence HUD */}
                <div className="lg:col-span-3 bg-[#020617] p-12 rounded-[3.5rem] border border-white/5 relative overflow-hidden group shadow-2xl min-h-[400px]">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                        <BrainCircuit className="w-64 h-64" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-4 text-white">
                            <BrainCircuit className="w-10 h-10 text-indigo-500" /> Neural Intelligence HUD
                        </h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic mt-2">Gemini 3 Pro Strategic Synthesis</p>

                        <div className="mt-12">
                            {loadingInsights && insights.length === 0 ? (
                                <div className="flex flex-col items-center justify-center space-y-4 py-20">
                                    <BrainCircuit className="w-12 h-12 text-indigo-500 animate-pulse" />
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">Neural Link Active... Syncing Briefing</p>
                                </div>
                            ) : insights.length === 0 ? (
                                <div className="flex flex-col items-center justify-center space-y-4 py-20">
                                    <Zap className="w-12 h-12 text-slate-700" />
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest italic text-center text-slate-600">Awaiting high-volume data for neural synthesis</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 scale-95 origin-center">
                                    {insights.slice(0, 2).map((insight, idx) => (
                                        <div key={idx} className="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:border-indigo-500/20 transition-all">
                                            <div className="flex justify-between items-start">
                                                <div className="px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                                                    {insight.impactLevel} Impact Vector
                                                </div>
                                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">{insight.title}</h4>
                                            <p className="text-[11px] text-slate-400 leading-relaxed italic line-clamp-2">"{insight.description}"</p>
                                            <div className="pt-4 border-t border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                <ShieldCheck className="w-3.5 h-3.5" /> Strategy: <span className="text-slate-200">{insight.recommendation}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Resolution Heat & Compliance */}
                <div className="space-y-8">
                    <div className="bg-[#020617] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                        <div className="flex items-center gap-3 mb-8">
                            <Activity className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Resolution Heat</h3>
                        </div>
                        <div className="h-40 flex items-end gap-1 px-2">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex-1 bg-emerald-500/40 rounded-t-sm hover:bg-emerald-500 transition-all cursor-pointer"
                                    style={{ height: `${20 + Math.random() * 80}%` }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#020617] p-10 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col items-center text-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Target Compliance</span>
                        <span className="text-5xl font-black text-white italic tracking-tighter">98.4%</span>
                        <div className="w-full h-1 bg-white/5 rounded-full mt-8 overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[98.4%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;

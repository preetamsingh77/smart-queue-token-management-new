
import React, { useState, useMemo, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import {
  Activity, LayoutDashboard,
  Layers,
  Zap, Settings,
  ShieldCheck,
  Plus, PlusCircle,
  Monitor, X,
  UserCheck, Circle, Settings2, Trash2, RotateCcw,
  CheckCircle2, FileStack, Clock, Timer,
  BarChart as BarChartIcon, ShieldQuestion, Flame, Users
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell
} from 'recharts';
import { getIcon, DEFAULT_SERVICES } from '../constants';
import { useNavigate } from 'react-router-dom';
import { TokenStatus, AIInsight, ServiceDefinition } from '../types';
import { getSmartInsights } from '../services/geminiService';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

const CommandCenter: React.FC = () => {
  const {
    state,
    updateCounterStatus,
    updateCounterName,
    addService,
    updateCounterServices,
    updatePolicy,
    removeService
  } = useQueue();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'FLEET' | 'VECTORS' | 'AUDIT' | 'SKIPS'>('ANALYTICS');
  const [timeframe, setTimeframe] = useState<'24H' | '7D'>('24H');

  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // New Service Modal State
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceIcon, setNewServiceIcon] = useState('Shield');
  const [newServiceColor, setNewServiceColor] = useState('#3b82f6');

  // Intelligence Metrics

  // Initial and reactive insight sync
  useEffect(() => {
    const fetchInsights = async () => {
      setLoadingInsights(true);
      try {
        const data = await getSmartInsights(state);
        setInsights(data);
      } catch (error) {
        console.error("Failed to fetch smart insights:", error);
      } finally {
        setLoadingInsights(false);
      }
    };

    if (insights.length === 0) {
      fetchInsights();
    }
  }, [state.tokens.length, insights.length, state]);

  const historicalData = useMemo(() => {
    if (timeframe === '24H') {
      return Array.from({ length: 24 }).map((_, i) => ({
        time: `${i}:00`,
        volume: Math.floor(Math.random() * 50) + 5,
        wait: Math.floor(Math.random() * 12) + 4,
        efficiency: 85 + Math.random() * 15,
        sla: 90 + Math.random() * 10,
      }));
    } else {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
        time: day,
        volume: Math.floor(Math.random() * 300) + 150,
        wait: Math.floor(Math.random() * 18) + 8,
        efficiency: 80 + Math.random() * 20,
        sla: 85 + Math.random() * 15,
      }));
    }
  }, [timeframe]);

  const serviceDistributionData = useMemo(() => {
    return state.services.map(s => ({
      name: s.name,
      value: Math.floor(Math.random() * 100) + 20,
      color: s.color
    }));
  }, [state.services]);

  const handleCommitNewService = () => {
    if (!newServiceName.trim()) return;

    const newService: ServiceDefinition = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      name: newServiceName.trim(),
      description: newServiceDesc.trim() || "Tactical service vector newly deployed.",
      icon: newServiceIcon,
      color: newServiceColor,
      subServices: ["General Inquiry", "Document Audit", "Verification"],
      prefix: newServiceName.trim().substring(0, 1).toUpperCase(),
      avgTimeMinutes: 15,
      isActive: true
    };

    addService(newService);
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServiceIcon('Shield');
    setNewServiceColor('#3b82f6');
    setShowAddServiceModal(false);
  };

  const restoreDefaultServices = () => {
    if (confirm("Restore system to baseline service configurations? Current custom vectors will be archived.")) {
      DEFAULT_SERVICES.forEach(s => {
        if (!state.services.find(existing => existing.name === s.name)) {
          addService(s);
        }
      });
    }
  };

  const toggleServiceForCounter = (counterId: number, serviceName: string) => {
    const counter = state.counters.find(c => c.id === counterId);
    if (!counter) return;

    const currentServices = [...counter.assignedServices];
    const index = currentServices.indexOf(serviceName);

    if (index > -1) {
      currentServices.splice(index, 1);
    } else {
      currentServices.push(serviceName);
    }

    updateCounterServices(counterId, currentServices);
  };


  const renderFleet = () => (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {state.counters.map(c => {
          const isBusy = !!c.currentTokenId;
          const statusLabel = !c.isOnline ? 'Offline' : isBusy ? 'Processing' : 'Available';
          const currentToken = state.tokens.find(t => t.id === c.currentTokenId);

          return (
            <div key={c.id} className={`bg-slate-900/40 p-10 rounded-[3.5rem] border-2 transition-all duration-500 group relative overflow-hidden ${!c.isOnline ? 'border-rose-500/20 opacity-70 grayscale-[0.5]' : isBusy ? 'border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.15)]' : 'border-emerald-500/30'
              }`}>
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl border-2 transition-all duration-500 ${!c.isOnline ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                    isBusy ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' :
                      'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    }`}>
                    {c.id}
                  </div>
                  {c.isOnline && (
                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-4 border-slate-950 ${isBusy ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-ping'}`} />
                  )}
                </div>

                <button
                  onClick={() => updateCounterStatus(c.id, !c.isOnline)}
                  className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border-2 transition-all flex items-center gap-3 ${!c.isOnline ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' :
                    isBusy ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' :
                      'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    }`}
                >
                  <Circle className={`w-2 h-2 fill-current ${c.isOnline ? 'animate-pulse' : ''}`} />
                  {statusLabel}
                </button>
              </div>

              <div className="relative z-10 space-y-6">
                <div>
                  <input
                    value={c.name}
                    onChange={e => updateCounterName(c.id, e.target.value)}
                    className="bg-transparent border-none text-2xl font-black uppercase italic tracking-tighter outline-none w-full text-white focus:text-blue-400 transition-colors"
                  />
                  <div className="flex items-center gap-2 text-slate-500 mt-1">
                    <UserCheck className="w-4 h-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">{c.officerName}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Settings2 className="w-3.5 h-3.5" /> Service Vectors
                    </span>
                    <span className="text-[8px] font-bold text-slate-600 uppercase italic">{c.assignedServices.length} Active</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {state.services.map(s => {
                      const isAssigned = c.assignedServices.includes(s.name);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleServiceForCounter(c.id, s.name)}
                          title={`Toggle ${s.name}`}
                          className={`p-2.5 rounded-xl border-2 transition-all group relative ${isAssigned
                            ? 'border-white/20 bg-white/5 scale-105 shadow-lg'
                            : 'border-white/[0.03] opacity-20 hover:opacity-50'
                            }`}
                          style={{ color: isAssigned ? s.color : '#94a3b8' }}
                        >
                          {getIcon(s.icon || 'Shield', 'w-5 h-5 mx-auto')}
                          {isAssigned && (
                            <div className="absolute -top-1 -right-1 p-0.5 bg-emerald-500 rounded-full border border-slate-900">
                              <CheckCircle2 className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isBusy && currentToken && (
                  <div className="p-5 bg-amber-500/10 rounded-2xl border border-amber-500/20 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest">Active Session</span>
                      <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">{(currentToken.serviceType || 'General').split(' ')[0]}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-amber-400 italic">#{currentToken.number}</span>
                      <span className="text-[10px] font-bold text-slate-400 truncate">{currentToken.citizenName}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Historical Performance</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Operational Analytics & Long-term Trends</p>
        </div>
        <div className="flex bg-slate-900 border border-white/10 p-1.5 rounded-2xl shadow-xl">
          <button onClick={() => setTimeframe('24H')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${timeframe === '24H' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Last 24 Hours</button>
          <button onClick={() => setTimeframe('7D')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${timeframe === '7D' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Last 7 Days</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Token Volume Matrix */}
        <div className="bg-slate-900/60 p-10 rounded-[3.5rem] border border-white/10 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><FileStack className="w-32 h-32" /></div>
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-3"><Layers className="w-6 h-6 text-blue-400" /> Token Volume Matrix</h3>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1">Ingress load distribution over time</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-emerald-400 leading-none">{timeframe === '24H' ? '842' : '5.2K'}</span>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Units</p>
            </div>
          </div>
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs><linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '1.5rem', fontSize: '10px' }} itemStyle={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase' }} cursor={{ stroke: '#3b82f6', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency Audit */}
        <div className="bg-slate-900/60 p-10 rounded-[3.5rem] border border-white/10 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><Clock className="w-32 h-32" /></div>
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-3"><Timer className="w-6 h-6 text-emerald-400" /> Latency Audit</h3>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1">Average wait-time baseline tracking</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-blue-400 leading-none">{timeframe === '24H' ? '12.4' : '14.8'}</span>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Avg Mins</p>
            </div>
          </div>
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '1.5rem', fontSize: '10px' }} itemStyle={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase' }} />
                <Line type="stepAfter" dataKey="wait" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Integrity Chart */}
        <div className="bg-slate-900/60 p-10 rounded-[3.5rem] border border-white/10 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><ShieldCheck className="w-32 h-32" /></div>
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-3"><ShieldCheck className="w-6 h-6 text-indigo-400" /> SLA Integrity</h3>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1">Service Level Agreement compliance rate (%)</p>
            </div>
          </div>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs><linearGradient id="colorSLA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} /><stop offset="95%" stopColor="#818cf8" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                <YAxis domain={[80, 100]} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '1.5rem', fontSize: '10px' }} itemStyle={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase' }} />
                <Area type="monotone" dataKey="sla" stroke="#818cf8" strokeWidth={4} fillOpacity={1} fill="url(#colorSLA)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Load Distribution */}
        <div className="bg-slate-900/60 p-10 rounded-[3.5rem] border border-white/10 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><BarChartIcon className="w-32 h-32" /></div>
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-3"><BarChartIcon className="w-6 h-6 text-amber-400" /> Load Distribution</h3>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1">Request volume by service category</p>
            </div>
          </div>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceDistributionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} hide />
                <YAxis dataKey="name" type="category" stroke="#fff" fontSize={9} tickLine={false} axisLine={false} width={120} tick={{ fontWeight: 900 }} />
                <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '1rem', fontSize: '10px' }} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                  {serviceDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-10 animate-in zoom-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Infrastructure Registry</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">Active Service Vector Stream Deployment</p>
        </div>
        <div className="flex gap-4">
          <button onClick={restoreDefaultServices} className="flex items-center gap-3 px-6 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all border border-white/5">
            <RotateCcw className="w-4 h-4" /> Restore Defaults
          </button>
          <button onClick={() => setShowAddServiceModal(true)} className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl">
            <PlusCircle className="w-4 h-4" /> Deploy New Vector
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {state.services.length === 0 ? (
          <div className="col-span-full py-20 bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center">
            <ShieldQuestion className="w-12 h-12 text-slate-700 mb-4" />
            <p className="text-slate-500 font-black uppercase tracking-[0.3em]">No Active Vectors Detected</p>
            <button onClick={restoreDefaultServices} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Initial System Load</button>
          </div>
        ) : state.services.map(s => (
          <div key={s.id} className="bg-slate-900/40 p-10 rounded-[3.5rem] border-2 border-white/5 text-white flex gap-8 group hover:border-white/10 transition-all relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => removeService(s.id)} className="p-3 text-slate-600 hover:text-rose-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
            </div>
            <div className="p-6 rounded-3xl shrink-0 h-fit" style={{ backgroundColor: `${s.color}20`, color: s.color }}>{getIcon(s.icon || 'Shield', 'w-10 h-10')}</div>
            <div className="flex-1">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">{s.name}</h3>
              <p className="text-slate-500 text-xs mb-6 font-medium italic leading-relaxed">{s.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {s.subServices?.map(sub => <div key={sub} className="p-3 bg-black/40 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5">{sub}</div>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPolicies = () => (
    <div className="space-y-10 animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Neural Logic Protocols</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">Autonomous Routing & Priority Management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900/40 p-10 rounded-[3.5rem] border border-white/5 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-600/10 text-orange-500 rounded-2xl border border-orange-500/20"><Flame className="w-6 h-6" /></div>
              <div>
                <h3 className="font-black uppercase italic text-white">Auto-Priority Module</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Seniors & Medical Vulnerability Handling</p>
              </div>
            </div>
            <button
              onClick={() => updatePolicy({ autoPriorityForSeniors: !state.policies.autoPriorityForSeniors })}
              className={`w-16 h-8 rounded-full relative transition-all ${state.policies.autoPriorityForSeniors ? 'bg-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.3)]' : 'bg-slate-800'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${state.policies.autoPriorityForSeniors ? 'left-9' : 'left-1'}`} />
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed italic border-t border-white/5 pt-6">
            When active, citizens tagged with 'Senior Status' or 'Urgent' during registration are automatically inserted at the peak of the dispatch buffer, bypassing standard FIFO logic.
          </p>
        </div>

        <div className="bg-slate-900/40 p-10 rounded-[3.5rem] border border-white/5 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-500/20"><Zap className="w-6 h-6" /></div>
              <div>
                <h3 className="font-black uppercase italic text-white">Dynamic Escalation</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase">SLA Breach Remediation</p>
              </div>
            </div>
            <button
              onClick={() => updatePolicy({ enableAutoEscalation: !state.policies.enableAutoEscalation })}
              className={`w-16 h-8 rounded-full relative transition-all ${state.policies.enableAutoEscalation ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-slate-800'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${state.policies.enableAutoEscalation ? 'left-9' : 'left-1'}`} />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Escalation Threshold</label>
              <span className="text-xs font-black text-blue-400">{state.policies.escalationThresholdMinutes} Mins</span>
            </div>
            <input
              type="range" min="10" max="60" step="5"
              value={state.policies.escalationThresholdMinutes}
              onChange={(e) => updatePolicy({ escalationThresholdMinutes: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-[9px] text-slate-600 italic">Tokens exceeding this wait duration will be prioritized to clear the pipeline.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 pb-24 font-sans">
      <div className="max-w-[1700px] mx-auto">
        {/* Futuristic Mission Control Header */}
        <header className="bg-[#0f172a]/40 backdrop-blur-2xl rounded-[3rem] border border-white/5 p-8 mb-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="p-5 bg-blue-600 rounded-[2rem] shadow-2xl shadow-blue-600/40 animate-pulse">
                <LayoutDashboard className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none text-white">Mission Control</h1>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sync Active</span>
                  </div>
                  <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Node_001_Master</span>
                </div>
              </div>
            </div>

            <nav className="flex items-center bg-black/40 p-2 rounded-full border border-white/5 shadow-inner backdrop-blur-3xl overflow-x-auto no-scrollbar">
              {[
                { id: 'ANALYTICS', icon: <Activity className="w-4 h-4" />, label: 'Analytics' },
                { id: 'FLEET', icon: <Monitor className="w-4 h-4" />, label: 'Fleet' },
                { id: 'VECTORS', icon: <Layers className="w-4 h-4" />, label: 'Vectors' },
                { id: 'AUDIT', icon: <ShieldCheck className="w-4 h-4" />, label: 'Audit' },
                { id: 'SKIPS', icon: <Users className="w-4 h-4" />, label: 'Skips' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-8 py-4 rounded-full flex items-center gap-3 transition-all shrink-0 ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105'
                    : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  {tab.icon} <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/settings')}
                className="p-5 bg-white/5 hover:bg-white/10 rounded-[1.5rem] border border-white/5 transition-all group"
              >
                <Settings className="w-6 h-6 text-slate-400 group-hover:text-blue-400 group-hover:rotate-90 transition-all duration-500" />
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10">
          {activeTab === 'ANALYTICS' && (
            <AnalyticsDashboard
              state={state}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              insights={insights}
              loadingInsights={loadingInsights}
            />
          )}

          {activeTab === 'FLEET' && renderFleet()}

          {activeTab === 'VECTORS' && renderServices()}

          {activeTab === 'AUDIT' && (
            <div className="space-y-12">
              {renderPolicies()}
              {renderPerformance()}
            </div>
          )}

          {activeTab === 'SKIPS' && (
            <div className="bg-slate-900/40 p-12 rounded-[4rem] border border-white/5 animate-in slide-in-from-bottom duration-500">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Exception Log</h2>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Audit of skipped and abandoned turn vectors</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {state.tokens.filter(t => t.status === TokenStatus.SKIPPED || t.status === TokenStatus.CANCELLED).length === 0 ? (
                  <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                    <ShieldCheck className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-black uppercase tracking-widest">No exceptions recorded in current session</p>
                  </div>
                ) : (
                  state.tokens.filter(t => t.status === TokenStatus.SKIPPED || t.status === TokenStatus.CANCELLED).map(t => (
                    <div key={t.id} className="bg-black/40 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <span className="text-2xl font-black text-rose-500 italic">#{t.tokenNumber}</span>
                        <div>
                          <div className="text-white font-black uppercase italic text-sm">{t.citizenName}</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.serviceCategory}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${t.status === TokenStatus.SKIPPED ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                          }`}>
                          {t.status}
                        </div>
                        <div className="text-[9px] font-bold text-slate-600 mt-2 uppercase">{t.skipReason || 'No reason provided'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {showAddServiceModal && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="bg-slate-900 w-full max-w-2xl p-12 rounded-[4rem] border border-white/10 shadow-2xl space-y-10 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white flex items-center gap-4"><Plus className="w-10 h-10 text-emerald-500" /> New Service Vector</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3 italic">MINTING NEW OPERATIONAL PIPELINE</p>
              </div>
              <button type="button" onClick={() => setShowAddServiceModal(false)} className="p-4 hover:bg-white/5 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X className="w-8 h-8" /></button>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vector Name</label>
                <input type="text" placeholder="e.g. Legal Authentication" className="w-full bg-black/40 border-2 border-white/5 focus:border-emerald-500 rounded-2xl p-6 font-black text-xl text-white outline-none transition-all tracking-tight italic uppercase" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mission Description</label>
                <textarea placeholder="Operational overview for this service pipeline..." className="w-full h-24 bg-black/40 border-2 border-white/5 focus:border-emerald-500 rounded-2xl p-6 font-bold text-xs text-slate-300 outline-none transition-all resize-none italic" value={newServiceDesc} onChange={e => setNewServiceDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Icon Profile</label>
                  <div className="grid grid-cols-4 gap-2 p-2 bg-black/40 rounded-3xl border border-white/5">
                    {['Shield', 'FileText', 'CreditCard', 'CheckCircle', 'Activity', 'Zap', 'MessageSquare', 'HelpCircle'].map(icon => (
                      <button key={icon} type="button" onClick={() => setNewServiceIcon(icon)} className={`p-3 rounded-xl flex items-center justify-center transition-all ${newServiceIcon === icon ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}>{getIcon(icon, 'w-5 h-5')}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button type="button" onClick={() => setShowAddServiceModal(false)} className="flex-1 py-6 bg-white/5 hover:bg-white/10 text-slate-400 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all">Cancel Dispatch</button>
              <button type="button" onClick={handleCommitNewService} disabled={!newServiceName.trim()} className="flex-[2] py-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95">DEPLOY VECTOR</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default CommandCenter;

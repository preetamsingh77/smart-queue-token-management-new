import React, { useState, useMemo } from 'react';
import { useQueue } from '../context/QueueContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  Activity, LayoutDashboard, UserX, Settings, PlusCircle, CheckCircle, Zap, ShieldAlert,
  Monitor,
  ShieldCheck,
  Power,
  UserCheck,
  Trash2,
  Search,
  RotateCcw,
  X,
  Plus,
  Grid
} from 'lucide-react';
import { InstitutionalBranding } from '../components/SharedUI';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { getIcon } from '../constants';
import { TokenStatus } from '../types';

const ICON_OPTIONS = [
  'Shield', 'FileText', 'CreditCard', 'CheckCircle', 'Activity', 'Zap',
  'MessageSquare', 'HelpCircle', 'Globe', 'Database', 'Terminal', 'Users',
  'Flame', 'Heart', 'Briefcase', 'BookOpen'
];

const COLOR_PRESETS = [
  '#1e3a6e', '#c8a227', '#10b981', '#f59e0b', '#ec4899', '#6366f1',
  '#8b5cf6', '#f43f5e', '#06b6d4', '#14b8a6', '#f97316'
];

const AdminDashboard: React.FC = () => {
  const {
    state,
    updateCounterStatus,
    addService,
    removeService,
    approvePriority,
    rejectPriority
  } = useQueue();

  const { showToast } = useToast();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'SERVICES' | 'FLEET' | 'AUDIT' | 'SKIPPED'>('TELEMETRY');

  // Modal states
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceIcon, setNewServiceIcon] = useState('Shield');
  const [newServiceColor, setNewServiceColor] = useState('#1e3a6e');
  const [newSubServices, setNewSubServices] = useState<string[]>(['General Intake', 'Document Audit']);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  const pendingVerifications = useMemo(() =>
    state.tokens
      .filter((t) =>
        t.status === TokenStatus.PENDING_VERIFICATION ||
        t.priorityStatus === 'PENDING_VERIFICATION' ||
        (t.isPriority && t.priorityStatus === 'NONE')
      )
      .sort((a, b) => {
        const getWeight = (t: any) => {
          let w = 0;
          if (t.isSenior) w += 10;
          if (t.medicalProof) w += 5;
          return w;
        };
        const weightA = getWeight(a);
        const weightB = getWeight(b);
        if (weightA !== weightB) return weightB - weightA;
        return new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime();
      }),
    [state.tokens]
  );

  const skippedTokensList = useMemo(() =>
    state.tokens
      .filter((t) => t.status === TokenStatus.SKIPPED || (t.status === TokenStatus.CANCELLED && (t.skipCount || 0) > 0))
      .sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()),
    [state.tokens]
  );

  const operationalMetrics = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const tokensToday = (state.tokens || []).filter((t: any) => {
      const time = typeof t.createdAt === 'string' ? new Date(t.createdAt).getTime() : t.createdAt;
      return time >= todayStart;
    });

    const servedTokens = tokensToday.filter((t: any) => t.status === TokenStatus.COMPLETED);
    const pendingTokens = tokensToday.filter((t: any) => t.status === TokenStatus.WAITING || t.status === TokenStatus.CHECKED_IN);
    const skippedTokensCount = tokensToday.filter((t: any) => t.status === TokenStatus.SKIPPED || (t.status === TokenStatus.CANCELLED && (t.skipCount || 0) > 0)).length;

    const completedWithTime = servedTokens.filter((t: any) => t.serviceStartTime && t.completedAt);
    const totalServiceTime = completedWithTime.reduce((acc: number, t: any) => {
      const start = typeof t.serviceStartTime === 'number' ? t.serviceStartTime : new Date(t.serviceStartTime as any).getTime();
      const end = typeof t.completedAt === 'string' ? new Date(t.completedAt).getTime() : t.completedAt!;
      return acc + ((end - start) / 60000);
    }, 0);

    const avgServiceTime = completedWithTime.length > 0 ? (totalServiceTime / completedWithTime.length).toFixed(1) : '0.0';

    const hourlyDistribution = Array.from({ length: 24 }).map((_, hour) => ({
      hour: `${hour}:00`,
      count: tokensToday.filter((t: any) => {
        const d = new Date(typeof t.createdAt === 'string' ? t.createdAt : t.createdAt);
        return d.getHours() === hour;
      }).length
    }));

    // Service Distribution
    const serviceCounts: Record<string, number> = {};
    tokensToday.forEach(t => {
      serviceCounts[t.serviceCategory] = (serviceCounts[t.serviceCategory] || 0) + 1;
    });
    const serviceDistribution = Object.entries(serviceCounts).map(([name, value]) => ({ name, value }));

    // Priority Distribution
    const priorityStats = {
      NORMAL: tokensToday.filter(t => t.priorityLevel === 'NORMAL').length,
      SENIOR: tokensToday.filter(t => t.priorityLevel === 'SENIOR').length,
      EMERGENCY: tokensToday.filter(t => t.priorityLevel === 'EMERGENCY').length,
    };
    const priorityDistribution = [
      { name: 'Standard', value: priorityStats.NORMAL, color: '#1e3a6e' },
      { name: 'Senior', value: priorityStats.SENIOR, color: '#c8a227' },
      { name: 'Emergency', value: priorityStats.EMERGENCY, color: '#f43f5e' }
    ].filter(p => p.value > 0);

    return {
      totalIssued: tokensToday.length,
      servedCount: servedTokens.length,
      pendingCount: pendingTokens.length,
      skippedCount: skippedTokensCount,
      avgServiceTime,
      hourlyDistribution,
      serviceDistribution,
      priorityDistribution
    };
  }, [state.tokens]);

  const CustomTooltip = ({ active, payload, label, prefix = "" }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e3a6e] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#c8a227] mb-1">{label}</p>
          <p className="text-lg font-black text-white">
            {prefix}{payload[0].value} <span className="text-[10px] text-slate-400 font-bold uppercase italic">{payload[0].name === 'count' ? 'Enrolments' : payload[0].name}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const handleCreateService = () => {
    if (!newServiceName) return;
    addService({
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      name: newServiceName,
      description: newServiceDesc || "Operational vector.",
      icon: newServiceIcon,
      color: newServiceColor,
      prefix: newServiceName.charAt(0).toUpperCase(),
      avgTimeMinutes: 15,
      isActive: true,
      subServices: newSubServices.length > 0 ? newSubServices : ["General Intake"]
    });

    setShowAddServiceModal(false);
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServiceIcon('Shield');
    setNewServiceColor('#1e3a6e');
    setNewSubServices(['General Intake', 'Document Audit']);
  };

  const navTabs = [
    { id: 'TELEMETRY', label: 'Telemetry', icon: <Activity size={18} /> },
    { id: 'FLEET', label: 'Fleet Registry', icon: <Monitor size={18} /> },
    { id: 'SERVICES', label: 'Infrastructure', icon: <Grid size={18} /> },
    { id: 'AUDIT', label: 'Verification Hub', icon: <ShieldCheck size={18} />, badge: pendingVerifications.length > 0 ? pendingVerifications.length : undefined },
    { id: 'SKIPPED', label: 'Deferred Registry', icon: <RotateCcw size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-white p-6 md:p-12 pb-24 font-sans selection:bg-[#c8a227]/30 transition-colors duration-500">
      <header className="flex flex-col lg:flex-row items-center justify-between gap-10 mb-20 relative">
        <div className="flex items-center gap-10">
          <div className="p-6 bg-[#1e3a6e] rounded-3xl shadow-[0_20px_50px_rgba(30,58,110,0.3)] border-2 border-[#c8a227]/20 relative group">
            <LayoutDashboard className="w-12 h-12 text-white" />
          </div>
          <div>
            <InstitutionalBranding dark={false} />
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none text-[#1e3a6e] dark:text-white mt-4 italic">Administrative Dashboard</h1>
            <p className="text-[10px] font-black uppercase text-[#c8a227] tracking-[0.5em] mt-2 opacity-70">Strategic Command & Enrolment Supervision</p>
          </div>
        </div>

        <nav className="flex items-center bg-white dark:bg-slate-900 p-2 rounded-[3.5rem] shadow-2xl border-2 border-slate-100 dark:border-white/5 overflow-x-auto no-scrollbar max-w-full">
          {navTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-10 py-5 rounded-[2.5rem] flex items-center gap-4 transition-all shrink-0 relative ${activeTab === tab.id ? 'bg-[#1e3a6e] text-white shadow-[0_15px_30px_rgba(30,58,110,0.4)]' : 'text-slate-400 hover:text-[#1e3a6e] dark:hover:text-blue-400'}`}>
              <span className="hidden sm:inline">{tab.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
              {tab.badge && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white shadow-lg animate-bounce">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
          <div className="w-px h-10 bg-slate-100 dark:bg-white/10 mx-4" />
          <button onClick={() => navigate('/settings')} className="p-5 text-slate-400 hover:text-[#c8a227] transition-colors">
            <Settings className="w-6 h-6" />
          </button>
        </nav>
      </header>

      <main>
        {activeTab === 'TELEMETRY' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
              {[
                { label: 'Issued Today', value: operationalMetrics.totalIssued, icon: <PlusCircle size={24} />, primary: true },
                { label: 'Served Enrolments', value: operationalMetrics.servedCount, icon: <CheckCircle size={24} /> },
                { label: 'Skipped Units', value: operationalMetrics.skippedCount, icon: <UserX size={24} />, warning: true },
                { label: 'Pending Verif.', value: pendingVerifications.length, icon: <ShieldAlert size={24} />, danger: pendingVerifications.length > 0 },
                { label: 'Avg Wait Delta', value: operationalMetrics.avgServiceTime, icon: <Zap size={24} />, unit: 'M' }
              ].map((v, i) => (
                <div key={i} onClick={() => v.danger && setActiveTab('AUDIT')} className={`bg-white dark:bg-slate-900 p-10 rounded-[3rem] border-2 transition-all shadow-xl relative group overflow-hidden ${v.danger ? 'cursor-pointer hover:border-rose-500/60' : ''} ${v.warning ? 'border-amber-500/30' : v.danger ? 'border-rose-500/30' : v.primary ? 'border-[#1e3a6e]/10' : 'border-slate-100 dark:border-white/5'}`}>
                  <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity p-8">{v.icon}</div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${v.warning ? 'text-amber-600' : v.danger ? 'text-rose-600' : v.primary ? 'text-[#1e3a6e] dark:text-blue-400' : 'text-slate-400'}`}>{v.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-6xl font-black tracking-tighter ${v.warning ? 'text-amber-600' : v.danger ? 'text-rose-600' : 'text-[#1e3a6e] dark:text-white'}`}>{v.value}</span>
                    {v.unit && <span className="text-sm font-black text-slate-400">{v.unit}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Peak Hour Intensity */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-all">
                  <Activity size={80} className="text-[#1e3a6e] dark:text-white" />
                </div>
                <h3 className="text-xl font-black uppercase italic text-[#1e3a6e] dark:text-white mb-10 relative z-10 flex items-center gap-4">
                  <span className="w-12 h-1 bg-[#c8a227] block" />
                  Peak Hour intensity
                </h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={operationalMetrics.hourlyDistribution}>
                      <defs>
                        <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e3a6e" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#c8a227" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#00000005" vertical={false} />
                      <XAxis dataKey="hour" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" stroke="#1e3a6e" strokeWidth={4} fill="url(#colorArea)" animationDuration={2000} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Protocol Distribution */}
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-2xl flex flex-col">
                <h3 className="text-xl font-black uppercase italic text-[#1e3a6e] dark:text-white mb-10 flex items-center gap-4">
                  <span className="w-12 h-1 bg-[#f43f5e] block" />
                  Protocol Mix
                </h3>
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={operationalMetrics.priorityDistribution}
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={10}
                        dataKey="value"
                        animationBegin={500}
                        animationDuration={1500}
                      >
                        {operationalMetrics.priorityDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        content={({ payload }: any) => (
                          <div className="flex justify-center gap-6 mt-6">
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Service Infrastructure Load */}
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-2xl">
                <h3 className="text-xl font-black uppercase italic text-[#1e3a6e] dark:text-white mb-10 flex items-center gap-4">
                  <span className="w-12 h-1 bg-[#10b981] block" />
                  Infrastructure load
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={operationalMetrics.serviceDistribution} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#00000005" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} width={100} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#00000005' }} />
                      <Bar
                        dataKey="value"
                        name="Load"
                        fill="#1e3a6e"
                        radius={[0, 15, 15, 0]}
                        barSize={24}
                        animationDuration={2000}
                      >
                        {operationalMetrics.serviceDistribution.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLOR_PRESETS[index % COLOR_PRESETS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Operational Velocity Insight (Static design-driven card) */}
              <div className="bg-[#1e3a6e] p-12 rounded-[4rem] text-white shadow-[0_30px_60px_rgba(30,58,110,0.4)] relative overflow-hidden group">
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                <Zap className="text-[#c8a227] mb-8 animate-pulse" size={48} />
                <h2 className="text-4xl font-black uppercase italic leading-tight tracking-tighter mb-4">Strategic Operational Insight</h2>
                <p className="text-blue-200/60 font-medium italic leading-relaxed mb-8 max-w-md">"Current bureau throughput indicators suggest a {operationalMetrics.totalIssued > 10 ? 'high' : 'standard'} intensity phase. Scaling vectors for {operationalMetrics.serviceDistribution[0]?.name || 'primary service'} is recommended."</p>
                <div className="flex gap-4">
                  <div className="px-6 py-3 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">System Nominal</span>
                  </div>
                  <div className="px-6 py-3 bg-[#c8a227]/20 rounded-2xl border border-[#c8a227]/30 flex items-center gap-3">
                    <ShieldCheck className="text-[#c8a227] w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#c8a227]">Logic Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'FLEET' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom duration-500">
            {state.counters.map(c => (
              <div key={c.id} className={`bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border-2 transition-all shadow-xl ${c.status === 'OFFLINE' ? 'border-rose-500/20 opacity-60' : 'border-emerald-500/20'}`}>
                <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl bg-[#1e3a6e]/10 text-[#1e3a6e] dark:text-blue-400 border border-[#1e3a6e]/20">{c.id}</div>
                  <button onClick={() => updateCounterStatus(c.id, c.status !== 'ONLINE')} className={`p-3 rounded-2xl border ${c.status === 'ONLINE' ? 'text-emerald-500 border-emerald-500/30' : 'text-rose-500 border-rose-500/30'}`}>
                    <Power className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-black uppercase italic text-[#1e3a6e] dark:text-white">{c.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{c.officerName}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Assigned Vectors</p>
                    <div className="flex flex-wrap gap-2">
                      {c.assignedServices.slice(0, 3).map(s => (
                        <span key={s} className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[8px] font-black text-[#1e3a6e] dark:text-blue-400 border border-slate-100 dark:border-white/5 uppercase tracking-widest">{s}</span>
                      ))}
                      {c.assignedServices.length > 3 && (
                        <span className="px-3 py-1 bg-[#c8a227]/10 text-[#c8a227] rounded-lg text-[8px] font-black border border-[#c8a227]/20 uppercase tracking-widest">+{c.assignedServices.length - 3} More</span>
                      )}
                    </div>
                  </div>

                  <button className="w-full py-4 bg-slate-50 dark:bg-white/5 text-[#1e3a6e] dark:text-blue-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1e3a6e] hover:text-white transition-all border border-slate-100 dark:border-transparent">
                    Station Configuration
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'SERVICES' && (
          <div className="space-y-10 animate-in zoom-in duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black uppercase italic text-[#1e3a6e] dark:text-white tracking-tighter">Infrastructure Bureau</h2>
              <button onClick={() => setShowAddServiceModal(true)} className="px-10 py-5 bg-[#1e3a6e] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3">
                <Plus size={18} /> Deploy Vector
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {state.services.map(s => (
                <div key={s.id} className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border-2 border-slate-100 dark:border-white/5 shadow-xl flex gap-10 group relative transition-all hover:-translate-y-2">
                  <button onClick={() => removeService(s.id)} className="absolute top-8 right-8 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={24} /></button>
                  <div className="w-24 h-24 rounded-3xl flex items-center justify-center shrink-0 shadow-lg" style={{ backgroundColor: `${s.color}15`, color: s.color, border: `2px solid ${s.color}30` }}>
                    {getIcon(s.icon || 'Shield', 'w-12 h-12')}
                  </div>
                  <div className="flex-1 space-y-4 min-w-0">
                    <h3 className="text-2xl font-black uppercase italic text-[#1e3a6e] dark:text-white truncate">{s.name}</h3>
                    <p className="text-slate-400 text-xs italic opacity-70 leading-relaxed">"{s.description}"</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {(s.subServices || []).map(sub => (
                        <span key={sub} className="px-4 py-2 bg-[#1e3a6e]/5 dark:bg-white/5 border border-[#1e3a6e]/10 dark:border-white/10 rounded-xl text-[9px] font-black text-[#1e3a6e] dark:text-blue-400 uppercase tracking-widest">{sub}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'AUDIT' && (
          <div className="space-y-12 animate-in slide-in-from-bottom duration-700">
            <div className="flex justify-between items-center px-4">
              <div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-[#1e3a6e] dark:text-white">Credential Verification</h2>
                <p className="text-[10px] font-black uppercase text-[#c8a227] tracking-[0.5em] mt-2 opacity-70">Strategic Document Audit & Priority Authorization</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{pendingVerifications.length} Claims Awaiting Signal</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
              {pendingVerifications.length === 0 ? (
                <div className="py-40 text-center bg-white dark:bg-slate-900 rounded-[4rem] border-4 border-dashed border-slate-100 dark:border-white/5 flex flex-col items-center justify-center opacity-40">
                  <ShieldCheck size={100} className="text-slate-200 mb-8" />
                  <p className="text-3xl font-black uppercase tracking-tighter italic text-slate-300">Bureau Clear</p>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">Zero Active Claims in Pipeline</p>
                </div>
              ) : pendingVerifications.map((token, idx) => (
                <div key={token.id} className="group relative bg-[#020617] rounded-[3rem] p-10 border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.6)] overflow-hidden">
                  <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />

                  <div className="flex flex-col lg:flex-row gap-12 relative z-10">
                    {/* Left: Document Section */}
                    <div className="w-full lg:w-[400px] space-y-4">
                      <div className="flex gap-4 aspect-[3/4]">
                        {token.idProof && (
                          <div
                            onClick={() => setSelectedProof(token.idProof || null)}
                            className={`flex-1 bg-white rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:scale-[1.02] cursor-pointer group/doc relative ${token.medicalProof ? 'w-1/2' : 'w-full'}`}
                          >
                            <img
                              src={token.idProof}
                              alt="ID Proof"
                              className="w-full h-full object-contain p-4"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/doc:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                              <Search size={32} className="text-white" />
                            </div>
                            <div className="absolute top-4 left-4 px-3 py-1 bg-[#c8a227] text-[#1a1a1a] text-[8px] font-black uppercase rounded-lg">ID Card</div>
                          </div>
                        )}
                        {token.medicalProof && (
                          <div
                            onClick={() => setSelectedProof(token.medicalProof || null)}
                            className={`flex-1 bg-white rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:scale-[1.02] cursor-pointer group/doc relative ${token.idProof ? 'w-1/2' : 'w-full'}`}
                          >
                            <img
                              src={token.medicalProof}
                              alt="Medical Proof"
                              className="w-full h-full object-contain p-4"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/doc:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                              <Search size={32} className="text-white" />
                            </div>
                            <div className="absolute top-4 left-4 px-3 py-1 bg-rose-600 text-white text-[8px] font-black uppercase rounded-lg">Medical</div>
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center italic">Documentation Audit Layer: {token.idProof && token.medicalProof ? 'Dual Certificate' : 'Single Certificate'}</p>
                    </div>

                    {/* Right: Content Section */}
                    <div className="flex-1 flex flex-col justify-between py-2">
                      <div className="space-y-8">
                        {/* Header: Token & Name */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-baseline gap-6">
                            <span className="text-8xl md:text-9xl font-black italic tracking-tighter text-blue-500 leading-none">#{token.number}</span>
                            <span className="text-4xl md:text-5xl font-black uppercase text-white leading-none tracking-tight">{token.citizenName}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="px-6 py-3 bg-orange-950/30 border border-orange-500/30 rounded-2xl flex items-center gap-3">
                              <Zap className="text-orange-500 w-4 h-4 fill-orange-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Super Priority</span>
                            </div>
                            <div className="px-6 py-3 bg-blue-950/30 border border-blue-500/30 rounded-2xl flex items-center gap-3">
                              <Activity className="text-blue-500 w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{token.medicalProof ? 'Medical' : 'Identity'} Claim</span>
                            </div>
                          </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                          {[
                            { label: 'Wait Position', value: idx === 0 ? 'Direct Next' : `${idx + 1} Stacks Back`, highlight: 'text-emerald-400' },
                            { label: 'Register Time', value: new Date(token.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                            { label: 'Dept Sector', value: token.serviceCategory.split(' ')[0].toUpperCase(), highlight: 'text-blue-400' },
                            { label: 'Comms Status', value: 'Live Link', highlight: 'text-blue-400' }
                          ].map((item, i) => (
                            <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-3xl space-y-2">
                              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none">{item.label}</p>
                              <p className={`text-sm font-black uppercase italic leading-none ${item.highlight || 'text-white'}`}>{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-6 mt-12">
                        <button
                          onClick={async () => {
                            await approvePriority(token.id);
                            showToast(`Token #${token.number} Authenticated. Successfully moved to Waiting Queue.`, 'success');
                          }}
                          className="flex-1 py-10 bg-emerald-600/20 hover:bg-emerald-600/30 border-2 border-emerald-500/40 text-emerald-400 rounded-full font-black text-sm uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 group"
                        >
                          <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                          Authenticate Claim
                        </button>
                        <button
                          onClick={() => {
                            const reason = window.prompt("Enter denial reason:", "Documentation audit failed.");
                            if (reason) rejectPriority(token.id, reason);
                          }}
                          className="flex-1 py-10 bg-rose-600/20 hover:bg-rose-600/30 border-2 border-rose-500/40 text-rose-400 rounded-full font-black text-sm uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 group"
                        >
                          <ShieldAlert className="w-6 h-6 group-hover:scale-110 transition-transform" />
                          Deny Access
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'SKIPPED' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[#1e3a6e] dark:text-white">Deferred Unit Registry</h2>
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{skippedTokensList.length} Units On Hold</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skippedTokensList.length > 0 ? skippedTokensList.map(tk => (
                <div key={tk.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-white/5 shadow-xl flex items-center justify-between group hover:border-[#c8a227] transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-4xl font-black italic text-[#1e3a6e] dark:text-blue-400 group-hover:scale-110 transition-transform">#{tk.number}</div>
                    <div>
                      <h4 className="font-black uppercase italic tracking-tight text-[#1e3a6e] dark:text-white">{tk.citizenName}</h4>
                      <p className="text-[10px] font-black uppercase text-[#c8a227] tracking-widest opacity-70">{tk.serviceType}</p>
                    </div>
                  </div>
                  <RotateCcw className="text-slate-200 group-hover:text-[#c8a227] transition-colors" size={24} />
                </div>
              )) : (
                <div className="col-span-full py-40 text-center text-slate-300 font-black uppercase tracking-[0.5em] opacity-30">Zero Deferred Units</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-[200] flex items-center justify-center p-12 transition-all" onClick={() => setSelectedProof(null)}>
          <button className="absolute top-10 right-10 p-6 text-white hover:text-[#c8a227] transform transition-all hover:rotate-90">
            <X size={60} />
          </button>
          <div className="max-w-5xl w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
            <img src={selectedProof} alt="Audit Audit" className="max-w-full max-h-[80vh] object-contain rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] border-8 border-white/5" />
            <div className="mt-12 text-center">
              <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Credential Inspection</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#c8a227] mt-3">Strategic Verification Bureau Layer 04</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal simplified for theme check */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[150] flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-[4rem] p-16 shadow-2xl border-2 border-[#c8a227]/20 space-y-12 animate-in slide-in-from-bottom-20 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-black text-[#1e3a6e] dark:text-white uppercase tracking-tighter italic leading-none">Deploy New Vector</h2>
              <button onClick={() => setShowAddServiceModal(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={32} /></button>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#c8a227] ml-2">Service Identity</label>
                <input value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} placeholder="Enter designation name..." className="w-full bg-slate-50 dark:bg-black/50 border-2 border-slate-100 dark:border-white/5 p-6 rounded-3xl outline-none focus:border-[#1e3a6e] text-lg font-bold" />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#c8a227] ml-2">Iconography Portfolio</label>
                <div className="flex flex-wrap gap-3">
                  {ICON_OPTIONS.map(icon => (
                    <button key={icon} onClick={() => setNewServiceIcon(icon)} className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${newServiceIcon === icon ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'bg-slate-50 dark:bg-white/5 text-slate-400 border-slate-100 dark:border-transparent'}`}>
                      {getIcon(icon, 'w-6 h-6')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#c8a227] ml-2">Harmonized Palette</label>
                <div className="flex flex-wrap gap-4">
                  {COLOR_PRESETS.map(color => (
                    <button key={color} onClick={() => setNewServiceColor(color)} className={`w-10 h-10 rounded-full border-4 transition-all ${newServiceColor === color ? 'border-[#1e3a6e] scale-125 shadow-lg' : 'border-transparent scale-100'}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-6 pt-6">
              <button onClick={() => setShowAddServiceModal(false)} className="flex-1 py-6 bg-slate-50 dark:bg-white/5 text-slate-400 text-xs font-black uppercase tracking-widest rounded-3xl hover:bg-slate-100 transition-all">Abort Deployment</button>
              <button onClick={handleCreateService} className="flex-1 py-6 bg-[#1e3a6e] text-white text-xs font-black uppercase tracking-[0.4em] rounded-3xl shadow-2xl hover:bg-[#0d2550] transition-all">Execute Provisioning</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;

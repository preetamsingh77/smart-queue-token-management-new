import React, { useMemo, useEffect, useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { TokenStatus } from '../types';
import {
  Clock, Users, Bell, AlertCircle, ShieldCheck, Ticket, Monitor, Activity
} from 'lucide-react';
import { InstitutionalBranding, GovEmblem } from '../components/SharedUI';

const PublicDisplay: React.FC = () => {
  const { state } = useQueue();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastServedId, setLastServedId] = useState<string | null>(null);
  const [isNewSummon, setIsNewSummon] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const nowServing = useMemo(() =>
    state.tokens.filter(t => t.status === TokenStatus.IN_PROGRESS || t.status === TokenStatus.CALLED),
    [state.tokens]
  );

  useEffect(() => {
    if (nowServing.length > 0) {
      const newestToken = nowServing[nowServing.length - 1];
      if (newestToken.id !== lastServedId) {
        setLastServedId(newestToken.id);
        setIsNewSummon(true);
        const timeout = setTimeout(() => setIsNewSummon(false), 8000);
        return () => clearTimeout(timeout);
      }
    }
  }, [nowServing, lastServedId]);

  const waiting = useMemo(() =>
    [...state.tokens]
      .filter(t => t.status === TokenStatus.WAITING || t.status === TokenStatus.CHECKED_IN)
      .sort((a, b) => {
        if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
        if (a.status === TokenStatus.CHECKED_IN && b.status !== TokenStatus.CHECKED_IN) return -1;
        if (a.status !== TokenStatus.CHECKED_IN && b.status === TokenStatus.CHECKED_IN) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }),
    [state.tokens]
  );

  const globalAvgWait = useMemo(() => {
    if (waiting.length === 0) return 0;
    const onlineCounterCount = state.counters?.filter(c => c.isOnline).length || 1;
    return Math.round((waiting.length * (state.averageServiceTime || 5)) / onlineCounterCount);
  }, [waiting.length, state.counters, state.averageServiceTime]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col font-sans overflow-hidden select-none">
      <header className="bg-[#0f172a] text-white px-6 py-4 md:py-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-20 border-b border-blue-500/20 overflow-hidden">
        {/* Terminal Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-blue-900/20 pointer-events-none" />

        <div className="max-w-[1920px] mx-auto w-full flex flex-col md:flex-row gap-8 md:gap-4 items-center justify-between relative z-10">
          {/* Left: Branding & Status */}
          <div className="flex items-center gap-8">
            <div className="relative group">
              <div className="absolute -inset-4 bg-blue-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <InstitutionalBranding dark={true} />
            </div>
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent hidden lg:block" />
            <div className="hidden lg:block">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400/80">System Terminal Alpha</span>
              </div>
              <h1 className="text-2xl xl:text-3xl font-black tracking-tight uppercase text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Live Status Display</h1>
            </div>
          </div>

          {/* Right: Metrics & High Contrast Clock */}
          <div className="flex items-center gap-6 md:gap-12 xl:gap-20">
            <div className="text-right group">
              <p className="text-blue-200/40 text-[9px] font-black uppercase tracking-[0.4em] mb-2 group-hover:text-blue-300 transition-colors">Queue Load Index</p>
              <div className="flex items-baseline justify-end gap-2">
                <span className="text-3xl xl:text-5xl font-black tabular-nums text-[#fcd34d] drop-shadow-[0_0_15px_rgba(252,211,77,0.3)]">~{globalAvgWait}</span>
                <span className="text-[10px] font-black uppercase text-blue-200/40 tracking-widest">Minutes</span>
              </div>
            </div>

            <div className="h-16 w-px bg-gradient-to-b from-white/0 via-white/20 to-white/0" />

            <div className="text-right">
              <p className="text-blue-200/40 text-[9px] font-black uppercase tracking-[0.4em] mb-2">Internal Temporal Sync</p>
              <div className="text-3xl xl:text-5xl font-black tabular-nums tracking-[0.1em] text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {isNewSummon && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top zoom-in duration-500">
            <div className="bg-[#c8a227] text-[#1a1a1a] px-12 py-6 rounded-2xl shadow-[0_20px_50px_rgba(200,162,39,0.4)] flex items-center gap-6 border-4 border-white/20">
              <Bell className="w-10 h-10 animate-bouncer" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">New Summon</p>
                <p className="text-3xl font-black uppercase tracking-tight italic">Please Proceed to Counter</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-[1.5] p-6 lg:p-10 overflow-y-auto no-scrollbar bg-white dark:bg-slate-900 relative">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#1e3a6e] rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-[#1e3a6e] dark:text-white underline decoration-[#c8a227] decoration-4 underline-offset-8">Now Serving</h2>
          </div>

          <div className="space-y-6">
            {nowServing.length > 0 ? (
              nowServing.map((token, idx) => {
                const counterIdValue = token.counterId || token.assignedCounter;
                const counter = state.counters?.find(c => String(c.id) === String(counterIdValue));
                return (
                  <div
                    key={token.id}
                    className={`p-10 rounded-3xl border-2 flex flex-col sm:flex-row justify-between items-center transition-all ${token.isPriority
                      ? 'bg-amber-50 dark:bg-amber-900/10 border-[#c8a227] shadow-[0_10px_30px_rgba(200,162,39,0.15)] ring-4 ring-[#c8a227]/10'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg'
                      } ${idx === nowServing.length - 1 && isNewSummon ? 'animate-pulse' : ''}`}
                  >
                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${token.isPriority ? 'bg-[#c8a227] text-white' : 'bg-[#1e3a6e] text-white'
                          }`}>
                          {token.isPriority ? 'Priority Service' : 'Standard Service'}
                        </span>
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{token.serviceType || 'GENERAL'}</span>
                      </div>
                      <div className={`text-[12rem] md:text-[14rem] font-black leading-none tracking-tighter ${token.isPriority ? 'text-[#c8a227]' : 'text-[#1e3a6e] dark:text-blue-400'
                        }`}>
                        {token.number}
                      </div>
                    </div>

                    <div className="flex flex-col items-center sm:items-end mt-8 sm:mt-0">
                      <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs mb-2">Proceed To</p>
                      <div className="flex items-center gap-4">
                        <div className={`text-9xl font-black ${token.isPriority ? 'text-[#c8a227]' : 'text-slate-900 dark:text-white'}`}>
                          {counter?.id || counterIdValue}
                        </div>
                      </div>
                      <div className="mt-4 px-6 py-2 bg-[#1e3a6e] text-white rounded-xl font-black text-xl uppercase tracking-widest italic outline-none">
                        {counter?.name || 'Counter'}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-40 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center opacity-40">
                <Ticket className="w-20 h-20 text-slate-300 mb-6" />
                <p className="text-2xl font-black uppercase text-slate-400">Station Active - Awaiting Tokens</p>
                <p className="text-xs font-bold uppercase tracking-widest mt-2 text-slate-500">System functioning within normal parameters</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 relative">
          <div className="absolute bottom-[-100px] right-[-100px] opacity-[0.03] pointer-events-none overflow-hidden">
            <GovEmblem size={600} />
          </div>

          <div className="flex-1 p-8 overflow-y-auto no-scrollbar relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-[#1e3a6e] dark:text-blue-400" />
                <h3 className="text-xl font-black uppercase text-slate-700 dark:text-slate-300 tracking-tight">Pending Queue</h3>
              </div>
              <div className="bg-[#1e3a6e]/10 text-[#1e3a6e] dark:text-blue-300 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#1e3a6e]/20 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Units: {waiting.length}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[#1e3a6e]">
              {waiting.slice(0, 10).map(token => (
                <div
                  key={token.id}
                  className={`p-6 bg-white dark:bg-slate-900 rounded-2xl border-2 flex justify-between items-center transition-all ${token.isPriority ? 'border-[#c8a227]/40 bg-amber-50/30' : 'border-slate-200 dark:border-slate-800'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-4xl font-black tracking-tighter ${token.isPriority ? 'text-[#c8a227]' : 'text-[#1e3a6e] dark:text-blue-400'}`}>
                      {token.number}
                    </span>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{token.serviceType?.split(' ')[0] || 'GENERAL'}</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{token.citizenName || 'Citizen'}</p>
                    </div>
                  </div>
                  {token.isPriority ? (
                    <AlertCircle className="w-5 h-5 text-[#c8a227]" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-300" />
                  )}
                </div>
              ))}
            </div>

            {waiting.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
                <ShieldCheck className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-500">Registry Pipeline Clear</p>
              </div>
            )}
          </div>

          <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-[#c8a227]" />
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">Digital Service Metrics</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Operational Counters</span>
                <span className="text-2xl font-black text-[#1e3a6e] dark:text-white">{state.counters?.filter(c => c.isOnline).length || 0}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase">System Integrity</span>
                <span className="text-2xl font-black text-emerald-600">99.9%</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#c8a227] text-[#1a1a1a] p-3 text-center overflow-hidden h-14 relative flex items-center shadow-[0_-10px_30px_rgba(0,0,0,0.1)] border-t border-white/20">
        <div className="inline-block animate-marquee whitespace-nowrap font-black text-sm md:text-base uppercase tracking-[0.25em] italic">
          PLEASE BE READY WITH YOUR QR CODE OR TOKEN SLIP • ENSURE ALL DOCUMENTS ARE IN ORIGINAL FORMAT • CITIZEN COMFORT IS OUR TOP PRIORITY • OFFICIAL DEPARTMENTAL DIGITAL SERVICES PORTAL • PROMPT SERVICE DELIVERY IS OUR MISSION •
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
        @keyframes bouncer {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bouncer {
          animation: bouncer 1s infinite ease-in-out;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default PublicDisplay;

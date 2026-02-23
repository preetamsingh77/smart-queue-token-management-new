
import React from 'react';
import { useQueue } from '../context/QueueContext';
import { AppSettings } from '../types';
import { 
  Settings, Building2, Clock, BrainCircuit, 
  ShieldCheck, Globe, Zap, Save, RefreshCcw, 
  ChevronRight, Volume2, BellRing, Smartphone, 
  Database, UserCog, UserCheck, MessageSquare,
  Share2, Mail, ExternalLink, Activity
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { state, updateSettings } = useQueue();
  const { settings } = state;

  const handleUpdate = (key: keyof AppSettings, value: any) => {
    updateSettings({ [key]: value });
  };

  const handleThresholdUpdate = (key: 'nearingFront' | 'delayMinutes', value: number) => {
    handleUpdate('notificationThresholds', {
      ...settings.notificationThresholds,
      [key]: value
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 md:p-12 animate-in fade-in duration-700 pb-24">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-600/30">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-none">Global Configuration</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">Neural System Tuning & Operational Parameters</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Sync Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Office Branding */}
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Department Branding</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Office Display Name</label>
                <input 
                  type="text" 
                  value={settings.departmentName}
                  onChange={(e) => handleUpdate('departmentName', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 text-sm font-bold focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                  placeholder="e.g. CivicFlow General Office"
                />
              </div>
              <div className="space-y-2 pt-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">System Language</label>
                <div className="grid grid-cols-2 gap-2">
                  {['EN', 'TE', 'KN', 'HI'].map((lang: any) => (
                    <button 
                      key={lang}
                      onClick={() => handleUpdate('language', lang)}
                      className={`py-3 rounded-xl border-2 font-black text-xs transition-all ${settings.language === lang ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 hover:border-slate-300'}`}
                    >
                      {lang === 'EN' ? 'English' : lang === 'TE' ? 'తెలుగు' : lang === 'KN' ? 'ಕನ್ನಡ' : 'हिन्दी'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Operational Hours */}
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Operational Window</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Office Opens</label>
                <input 
                  type="time" 
                  value={settings.officeStartTime}
                  onChange={(e) => handleUpdate('officeStartTime', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 text-sm font-bold focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Office Closes</label>
                <input 
                  type="time" 
                  value={settings.officeEndTime}
                  onChange={(e) => handleUpdate('officeEndTime', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 text-sm font-bold focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                />
              </div>
            </div>
            <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
               <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-2">
                  <Zap className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Active Enforcement</span>
               </div>
               <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                 Tokens issued outside these hours will be automatically tagged as "Next Day".
               </p>
            </div>
          </div>

          {/* Communication Gateways Integration */}
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl space-y-8 md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <Share2 className="w-5 h-5 text-blue-500" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Communication Gateways</h2>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Live Integration
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 space-y-4">
                 <div className="flex items-center justify-between">
                    <Smartphone className="w-5 h-5 text-blue-500" />
                    <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[8px] font-black">TWILIO READY</div>
                 </div>
                 <h3 className="text-xs font-black uppercase tracking-widest">SMS Dispatch</h3>
                 <p className="text-[9px] font-medium text-slate-500 leading-tight">Twilio-powered automated arrival alerts & delay notifications.</p>
                 <button className="text-[8px] font-black text-blue-500 uppercase flex items-center gap-1 hover:underline">
                    API Logs <ExternalLink className="w-2 h-2" />
                 </button>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 space-y-4">
                 <div className="flex items-center justify-between">
                    <Mail className="w-5 h-5 text-indigo-500" />
                    <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[8px] font-black">SMTP READY</div>
                 </div>
                 <h3 className="text-xs font-black uppercase tracking-widest">Email Endpoint</h3>
                 <p className="text-[9px] font-medium text-slate-500 leading-tight">Digital receipts and feedback loop orchestration.</p>
                 <button className="text-[8px] font-black text-indigo-500 uppercase flex items-center gap-1 hover:underline">
                    Manage Relay <ExternalLink className="w-2 h-2" />
                 </button>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 space-y-4">
                 <div className="flex items-center justify-between">
                    <BellRing className="w-5 h-5 text-amber-500" />
                    <div className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full text-[8px] font-black">WEB PUSH</div>
                 </div>
                 <h3 className="text-xs font-black uppercase tracking-widest">Browser Signal</h3>
                 <p className="text-[9px] font-medium text-slate-500 leading-tight">Low-latency desktop/mobile notifications via Web API.</p>
                 <button className="text-[8px] font-black text-amber-500 uppercase flex items-center gap-1 hover:underline">
                    Test Payload <ExternalLink className="w-2 h-2" />
                 </button>
              </div>
            </div>
          </div>

          {/* AI Intelligence & Persona */}
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl space-y-8 md:col-span-2">
            <div className="flex items-center gap-4 mb-2">
              <BrainCircuit className="w-5 h-5 text-indigo-500" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">AI Personality & Logic</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">AI Thinking Budget</label>
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">Fast Response</span>
                    <span className="text-xs font-bold text-slate-400">Deep Reasoning</span>
                 </div>
                 <input 
                  type="range" 
                  min="0" max="24576" step="1024"
                  value={settings.aiThinkingBudget}
                  onChange={(e) => handleUpdate('aiThinkingBudget', parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Notification Persona</label>
                 <div className="grid grid-cols-3 gap-2">
                    {['Professional', 'Friendly', 'Empathetic'].map((p: any) => (
                      <button 
                        key={p}
                        onClick={() => handleUpdate('aiPersona', p)}
                        className={`py-3 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${settings.aiPersona === p ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 hover:border-slate-300'}`}
                      >
                        {p}
                      </button>
                    ))}
                 </div>
              </div>
            </div>
          </div>

          {/* Notification Thresholds */}
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl space-y-8 md:col-span-2">
            <div className="flex items-center gap-4 mb-2">
              <BellRing className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Notification Orchestration</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nearing Front Alert</label>
                    <span className="text-sm font-black text-amber-500">{settings.notificationThresholds.nearingFront} Positions</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" max="10" step="1"
                    value={settings.notificationThresholds.nearingFront}
                    onChange={(e) => handleThresholdUpdate('nearingFront', parseInt(e.target.value))}
                    className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-amber-500"
                  />
                  <p className="text-[9px] text-slate-500 uppercase font-bold italic mt-1">Send alert when citizen reaches this position in queue.</p>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Delay Warning Alert</label>
                    <span className="text-sm font-black text-rose-500">{settings.notificationThresholds.delayMinutes} Minutes</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" max="60" step="5"
                    value={settings.notificationThresholds.delayMinutes}
                    onChange={(e) => handleThresholdUpdate('delayMinutes', parseInt(e.target.value))}
                    className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-rose-500"
                  />
                  <p className="text-[9px] text-slate-500 uppercase font-bold italic mt-1">Send apology if wait exceeds this duration.</p>
               </div>
            </div>
          </div>

          {/* Security Protocols */}
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl space-y-8 md:col-span-2">
            <div className="flex items-center gap-4 mb-2">
              <ShieldCheck className="w-5 h-5 text-rose-500" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Security & Interface Protocols</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <button 
                onClick={() => handleUpdate('enableHaptics', !settings.enableHaptics)}
                className="p-6 rounded-3xl border-2 border-transparent hover:border-blue-500/40 bg-black/5 dark:bg-white/5 flex items-center justify-between group transition-all"
               >
                 <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-all ${settings.enableHaptics ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                       <Volume2 className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                       <p className="text-xs font-black uppercase tracking-widest dark:text-white">Interface Haptics</p>
                       <p className="text-[9px] font-bold text-slate-500 uppercase italic">Vibration feedback on verified scans</p>
                    </div>
                 </div>
                 <div className={`w-12 h-6 rounded-full relative transition-all ${settings.enableHaptics ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.enableHaptics ? 'left-7' : 'left-1'}`} />
                 </div>
               </button>

               <div className="p-6 rounded-3xl border-2 border-white/5 bg-black/5 dark:bg-white/5 space-y-4">
                  <div className="flex gap-2">
                    {['Standard', 'Strict', 'Critical'].map((level: any) => (
                      <button 
                        key={level}
                        onClick={() => handleUpdate('securityLevel', level)}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter border transition-all ${settings.securityLevel === level ? 'bg-rose-600 border-rose-400 text-white' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500'}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-8">
           <button onClick={() => window.history.back()} className="flex items-center gap-3 px-10 py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all group">
             <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
             Commit & Sync
           </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

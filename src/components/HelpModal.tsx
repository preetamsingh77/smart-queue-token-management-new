
import React, { useState } from 'react';
import { 
  X, HelpCircle, BookOpen, Smartphone, ShieldCheck, 
  Activity, Zap, Info, ArrowRight, BrainCircuit, 
  Siren, Users, MapPin, Search, MousePointer2,
  CheckCircle2, Monitor, LayoutDashboard, QrCode,
  Mail, PhoneCall, Send, MessageSquare, ShieldAlert,
  Headphones, LifeBuoy
} from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

const Step: React.FC<{ number: number; title: string; description: string; color: string }> = ({ number, title, description, color }) => (
  <div className="flex gap-4 group">
    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-black text-xs border-2 transition-all group-hover:scale-110`} style={{ borderColor: color, color: color, backgroundColor: `${color}10` }}>
      {number}
    </div>
    <div className="space-y-1">
      <h4 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">{title}</h4>
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  </div>
);

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'CITIZEN' | 'OFFICER' | 'FAQ' | 'SUPPORT'>('CITIZEN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setTicketSent(true);
      setTimeout(() => {
        setTicketSent(false);
        setActiveTab('CITIZEN');
      }, 3000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[3.5rem] border-2 border-slate-100 dark:border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.5)] overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
              <LifeBuoy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Knowledge & Support</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-1">Operational Manual v4.5.1</p>
            </div>
          </div>
          
          <div className="flex bg-slate-200 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-300/50 dark:border-white/5 overflow-x-auto no-scrollbar max-w-full">
            <button 
              onClick={() => setActiveTab('CITIZEN')}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'CITIZEN' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Citizens
            </button>
            <button 
              onClick={() => setActiveTab('OFFICER')}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'OFFICER' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Officers
            </button>
            <button 
              onClick={() => setActiveTab('FAQ')}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'FAQ' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              FAQ
            </button>
            <button 
              onClick={() => setActiveTab('SUPPORT')}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'SUPPORT' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Support
            </button>
          </div>

          <button 
            onClick={onClose}
            className="hidden md:flex p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all shadow-sm text-slate-400 hover:text-rose-500 border border-transparent hover:border-slate-200 dark:hover:border-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-8 overflow-y-auto no-scrollbar flex-1">
          
          {activeTab === 'CITIZEN' && (
            <div className="space-y-12 animate-in slide-in-from-left duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-blue-600 flex items-center gap-3">
                    <Smartphone className="w-5 h-5" /> Token Booking
                  </h3>
                  <div className="space-y-6">
                    <Step number={1} title="Initialize Sequence" description="Select 'Get a Digital Token' from the home screen to start registry protocols." color="#2563eb" />
                    <Step number={2} title="Identification" description="Enter your legal name and contact endpoints (Phone/Email) for tactical notifications." color="#2563eb" />
                    <Step number={3} title="Vector Selection" description="Navigate the department grid to find the specific sub-service you require." color="#2563eb" />
                    <Step number={4} title="Secure Receipt" description="A unique QR code is generated. This is your digital entry pass for counter verification." color="#2563eb" />
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-emerald-600 flex items-center gap-3">
                    <MapPin className="w-5 h-5" /> Live Tracking
                  </h3>
                  <div className="space-y-6">
                    <Step number={1} title="HUD Monitoring" description="The Tracking Dashboard displays real-time position and AI wait-time forecasts." color="#10b981" />
                    <Step number={2} title="Automated Alerts" description="The system notifies you via SMS when you are within 3 positions of being called." color="#10b981" />
                    <Step number={3} title="Summons Response" description="A full-screen alert triggers when an officer calls your number to a designated node." color="#10b981" />
                    <Step number={4} title="Session Close" description="Complete the service intelligence audit (feedback) after your session is resolved." color="#10b981" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'OFFICER' && (
            <div className="space-y-12 animate-in slide-in-from-right duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-amber-600 flex items-center gap-3">
                    <Activity className="w-5 h-5" /> Node Deployment
                  </h3>
                  <div className="space-y-6">
                    <Step number={1} title="Terminal Link" description="Select your assigned Node ID from the Officer Entry Registry to bind your station." color="#d97706" />
                    <Step number={2} title="Activation" description="Toggle your status to 'Online' to allow the neural grid to route units to your counter." color="#d97706" />
                    <Step number={3} title="Service Config" description="Use the Settings icon to toggle the service categories you are currently processing." color="#d97706" />
                    <Step number={4} title="Audit Logging" description="Ensure your station remains active. Inactivity beyond 15 minutes triggers node standby." color="#d97706" />
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-indigo-600 flex items-center gap-3">
                    <Zap className="w-5 h-5" /> Summoning Protocol
                  </h3>
                  <div className="space-y-6">
                    <Step number={1} title="Summon Next" description="Click 'Summon Next Citizen' to pull the top unit from the priority stack." color="#4f46e5" />
                    <Step number={2} title="Verification" description="Utilize the QR scanner to verify the citizen's token upon their arrival at the desk." color="#4f46e5" />
                    <Step number={3} title="Case Resolution" description="Once the service is provided, click 'Resolve Unit' to clear the HUD for the next summons." color="#4f46e5" />
                    <Step number={4} title="Skip Logic" description="If a citizen is unresponsive, mark the unit as 'Skipped' to maintain pipeline flow." color="#4f46e5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'FAQ' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { q: "Can I leave the waiting area?", a: "Yes. Our cloud-integrated system will send an SMS alert to your phone when you are nearing the front." },
                  { q: "What is Priority Routing?", a: "Automatically applied to Senior Citizens and those with verified medical emergencies." },
                  { q: "How do I recover my token?", a: "Use the 'Recall Session' feature in the Lookup tab using your registered phone number." },
                  { q: "Is the AI Forecast accurate?", a: "Wait times are calculated using the live processing speeds of active officers (±2 min variance)." }
                ].map((item, idx) => (
                  <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-white/5 transition-all hover:border-blue-500/30">
                      <div className="flex gap-3 mb-2">
                        <HelpCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <h4 className="text-[11px] font-black uppercase tracking-tight text-slate-900 dark:text-white italic">{item.q}</h4>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed pl-7">{item.a}</p>
                  </div>
                ))}
              </div>
              <div className="p-8 bg-slate-900 rounded-[2.5rem] text-center border border-white/5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 italic">Still have doubts or need more details?</p>
                <button onClick={() => setActiveTab('SUPPORT')} className="px-8 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">Direct Support Contact</button>
              </div>
            </div>
          )}

          {activeTab === 'SUPPORT' && (
            <div className="space-y-10 animate-in zoom-in duration-500">
              {ticketSent ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Inquiry Dispatched</h3>
                    <p className="text-slate-400 text-sm mt-2">A neural support agent will contact you shortly.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-black uppercase italic tracking-tight text-indigo-500 flex items-center gap-3">
                        <Headphones className="w-5 h-5" /> Official Channels
                      </h3>
                      <div className="space-y-3">
                        <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-transparent hover:border-indigo-500/20 transition-all flex items-center gap-4">
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-indigo-500 shadow-sm"><Mail className="w-5 h-5" /></div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Email</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">support@civicflow.gov</p>
                          </div>
                        </div>
                        <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-transparent hover:border-indigo-500/20 transition-all flex items-center gap-4">
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-indigo-500 shadow-sm"><PhoneCall className="w-5 h-5" /></div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hotline</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">1-800-CIVIC-FLOW</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-indigo-500/10 rounded-[2.5rem] border border-indigo-500/20">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 italic flex items-center gap-2">
                        <Info className="w-3 h-3" /> System Health
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                        Operational agents are available Mon-Fri, 09:00 - 18:00. Emergency overrides can only be performed by Node Admins.
                      </p>
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <form onSubmit={handleSubmitTicket} className="bg-slate-50 dark:bg-black/20 p-8 rounded-[3.5rem] border border-slate-100 dark:border-white/5 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Inquiry Subject</label>
                        <input required type="text" placeholder="e.g. Booking discrepancy" className="w-full bg-white dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 font-bold text-slate-700 dark:text-slate-200 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Message Body</label>
                        <textarea required rows={4} placeholder="Describe your doubt or issue..." className="w-full bg-white dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 font-bold text-slate-700 dark:text-slate-200 outline-none transition-all resize-none" />
                      </div>
                      <button disabled={isSubmitting} className="w-full py-5 bg-indigo-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
                        {isSubmitting ? <Activity className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {isSubmitting ? 'Dispatching...' : 'Submit Inquiry'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Neural Assistance Active
          </div>
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-10 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            Acknowledge & Exit
          </button>
        </div>
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

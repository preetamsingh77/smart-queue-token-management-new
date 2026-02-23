
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone, ShieldCheck, Activity, Zap,
  Search, ChevronRight, Users, MapPin,
  ArrowLeft, HelpCircle, MessageSquare,
  Flame, ShieldAlert, Cpu, X, Workflow,
  Send, Mail, PhoneCall
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface GuideItem {
  title: string;
  icon: React.ReactNode;
  desc: string;
  category: 'CITIZEN' | 'OFFICER';
  details?: string[];
}

const HelpCenter: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItem, setActiveItem] = useState<GuideItem | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const guides: GuideItem[] = [
    {
      category: 'CITIZEN',
      title: "Booking your first token",
      icon: <Smartphone />,
      desc: "Step-by-step on how to join the queue digitally.",
      details: [
        "Select the service department that matches your needs.",
        "Provide your contact details for SMS/Email notifications.",
        "Choose the specific task from the sub-services menu.",
        "Receive and save your digital QR code for scanning at the counter."
      ]
    },
    {
      category: 'CITIZEN',
      title: "Understanding Priority",
      icon: <Flame />,
      desc: "How fast-track routing works for seniors and emergency cases.",
      details: [
        "Priority tokens are automatically pushed to the top of the processing buffer.",
        "Seniors and persons with disabilities are eligible for automatic priority.",
        "Officers can manually elevate a standard token in emergency situations.",
        "Priority status is visually indicated by a flame icon on public displays."
      ]
    },
    {
      category: 'CITIZEN',
      title: "Tracking your position",
      icon: <MapPin />,
      desc: "Reading the live HUD and AI wait-time forecasts.",
      details: [
        "Your position updates in real-time as citizens ahead of you are cleared.",
        "The AI Forecast predicts wait time based on active officer speed.",
        "A notification is sent when you are 3 positions away from the front.",
        "You do not need to stay on the page; alerts will arrive via SMS/Email."
      ]
    },
    {
      category: 'OFFICER',
      title: "Station Initialization",
      icon: <Activity />,
      desc: "How to deploy your node and join the department stack.",
      details: [
        "Select your assigned station number from the Node Registry.",
        "Ensure your status is set to 'Online' to receive incoming citizens.",
        "Configure your assigned service categories in the terminal settings.",
        "Synchronize your terminal with the central Command Center."
      ]
    },
    {
      category: 'OFFICER',
      title: "Strategic Handoff",
      icon: <Workflow className="w-5 h-5" />,
      desc: "Procedures for transferring units between services.",
      details: [
        "Use the 'Transfer' button for citizens needing multi-department service.",
        "Select the target department and sub-service for the handoff.",
        "The citizen maintains a priority position in the new department stack.",
        "Transfers are logged in the analytics engine for throughput tracking."
      ]
    },
    {
      category: 'OFFICER',
      title: "Manual Overrides",
      icon: <ShieldAlert />,
      desc: "Triggering emergency alerts and priority elevations.",
      details: [
        "Elevate any unit to Emergency status if critical assistance is needed.",
        "Broadcast system-wide alerts for infrastructure or security delays.",
        "Manual overrides bypass standard queue logic for immediate resolution.",
        "Every override requires a reason logged for administrative audit."
      ]
    }
  ];

  const faqs = [
    { q: "Can I leave the premises while waiting?", a: "Yes. Our tracking portal is mobile-responsive. Ensure you have the page open to receive 'Nearing Front' alerts." },
    { q: "What happens if I miss my turn?", a: "The officer will mark the unit as 'Delayed'. You can check in at the counter to be placed back in the active buffer." },
    { q: "How accurate is the AI Wait Time?", a: "The Neural Predictor analyzes live processing speeds and current queue volume. It is accurate within 120 seconds." }
  ];

  // Enhanced filtering for guide items including details
  const filteredGuides = useMemo(() => {
    return guides.filter(g =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.details?.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, guides]);

  // Filtering for FAQ section
  const filteredFaqs = useMemo(() => {
    return faqs.filter(f =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, faqs]);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulation
    setTimeout(() => {
      setIsSubmitting(false);
      showToast("Ticket Dispatched. Support will contact you shortly.", 'success');
      setShowContactModal(false);
      setTicketSubject('');
      setTicketMessage('');
    }, 1500);
  };

  const renderSection = (category: 'CITIZEN' | 'OFFICER') => {
    const items = filteredGuides.filter(g => g.category === category);
    if (items.length === 0) return null;

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl border ${category === 'CITIZEN' ? 'bg-blue-600/10 border-blue-500/20 text-blue-600' : 'bg-amber-600/10 border-amber-500/20 text-amber-600'}`}>
            {category === 'CITIZEN' ? <Users className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
            {category === 'CITIZEN' ? 'Citizen Protocols' : 'Officer Operations'}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {items.map((guide, i) => (
            <div
              key={i}
              onClick={() => setActiveItem(guide)}
              className="group p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 hover:border-blue-500 transition-all cursor-pointer shadow-sm hover:shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 group-hover:text-blue-600 transition-colors">
                  {guide.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-sm uppercase tracking-tight text-slate-800 dark:text-slate-200">{guide.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{guide.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-300 pb-24">
      {/* Detail Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3.5rem] border-2 border-slate-100 dark:border-white/10 shadow-2xl p-10 overflow-hidden relative">
            <button
              onClick={() => setActiveItem(null)}
              className="absolute top-8 right-8 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
            <div className="flex items-center gap-6 mb-8">
              <div className="p-5 bg-blue-600/10 rounded-3xl text-blue-600">
                {activeItem.icon}
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-none">{activeItem.title}</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">{activeItem.desc}</p>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b pb-2">Operational Steps</h4>
              {activeItem.details?.map((detail, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-blue-500/20 transition-all">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">{idx + 1}</div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic">{detail}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setActiveItem(null)}
              className="w-full mt-10 py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Back to Knowledge Base
            </button>
          </div>
        </div>
      )}

      {/* Contact Support Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3.5rem] border-2 border-slate-100 dark:border-white/10 shadow-2xl p-10 overflow-hidden relative">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-8 right-8 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>

            <div className="flex items-center gap-6 mb-8">
              <div className="p-5 bg-indigo-600/10 rounded-3xl text-indigo-600">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-none">Contact Support</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Operational Dispatch Center</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-transparent hover:border-indigo-500/20 transition-all flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-indigo-500 shadow-sm"><Mail className="w-5 h-5" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest Support Email">Support Endpoint</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">support@department.gov.in</p>
                </div>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-transparent hover:border-indigo-500/20 transition-all flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-indigo-500 shadow-sm"><PhoneCall className="w-5 h-5" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hotline</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">1-800-GOV-QUEUE</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject of Discrepancy</label>
                <input
                  required
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 font-bold text-slate-700 dark:text-slate-200 outline-none transition-all"
                  placeholder="e.g. Optical sensor error node #4"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Detailed Log / Message</label>
                <textarea
                  required
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 font-bold text-slate-700 dark:text-slate-200 outline-none transition-all resize-none"
                  placeholder="Describe the operational issue in detail..."
                />
              </div>
              <button
                disabled={isSubmitting}
                className="w-full py-5 bg-indigo-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isSubmitting ? <Activity className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {isSubmitting ? 'Dispatching...' : 'Submit Support Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 pt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-none">Knowledge Base</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">Official Operational Manual</p>
            </div>
          </div>

          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search protocols & FAQs..."
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
          {filteredGuides.some(g => g.category === 'CITIZEN') ? renderSection('CITIZEN') : (
            searchQuery && <div className="p-10 text-center opacity-40 italic">No matching citizen protocols found.</div>
          )}
          {filteredGuides.some(g => g.category === 'OFFICER') ? renderSection('OFFICER') : (
            searchQuery && <div className="p-10 text-center opacity-40 italic">No matching officer protocols found.</div>
          )}
        </div>

        <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl mb-16">
          <div className="absolute top-0 right-0 p-12 opacity-10"><Cpu className="w-64 h-64" /></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-10 flex items-center gap-4">
              <HelpCircle className="w-8 h-8 text-blue-400" /> General Inquiry Matrix
            </h2>
            {filteredFaqs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {filteredFaqs.map((item, idx) => (
                  <div key={idx} className="space-y-4 animate-in fade-in duration-500">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center font-black text-[10px] flex-shrink-0">?</div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-blue-200">{item.q}</h4>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed pl-9 italic">{item.a}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 opacity-50 italic">
                No matching inquiries found in the FAQ database.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Still Need Assistance?</h3>
            <p className="text-slate-500 text-sm max-w-md">Our neural support agents are standing by to resolve any operational discrepancies.</p>
          </div>
          <button
            onClick={() => setShowContactModal(true)}
            className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
          >
            <Zap className="w-4 h-4" /> Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;

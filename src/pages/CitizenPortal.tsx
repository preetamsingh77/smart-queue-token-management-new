import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Token, TokenStatus, ServiceDefinition, ServiceType } from '../types';
import { getWaitTimePrediction } from '../services/geminiService';
import {
  ChevronRight, User, Monitor, Search, Hash, ChevronLeft, Star,
  Smartphone, CheckCircle2, X, AlertCircle, ShieldCheck,
  CheckCircle, ShieldAlert, Upload, PartyPopper,
  BrainCircuit, UserCheck, Ticket, Clock, Mail, Flame,
  Download, MessageSquare, ThumbsUp
} from 'lucide-react';
import QRCode from 'qrcode';
import { InstitutionalBranding, FlowingLines, GovEmblem } from '../components/SharedUI';

const CitizenPortal: React.FC = () => {
  const { state, issueToken, updateTokenWaitTime, submitFeedback, rejoinQueue } = useQueue();
  const { user: authUser } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState<'HOME' | 'BOOK' | 'TRACK' | 'LOOKUP'>('HOME');

  // Pre-fill from auth user
  useEffect(() => {
    if (authUser && authUser.role === 'CITIZEN') {
      setName(authUser.fullName || '');
      setEmail(authUser.email || '');
      if (authUser.email) setPrefEmail(true);
    }
  }, [authUser]);
  const [isPredicting, setIsPredicting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [prefSms, setPrefSms] = useState(true);
  const [prefEmail, setPrefEmail] = useState(false);

  const [selectedMainService, setSelectedMainService] = useState<ServiceDefinition | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [isSenior, setIsSenior] = useState(false);
  const [isMedicalEmergency, setIsMedicalEmergency] = useState(false);
  const [idProof, setIdProof] = useState<string | null>(null);
  const [medicalProof, setMedicalProof] = useState<string | null>(null);

  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [lookupValue, setLookupValue] = useState('');
  const [userRating, setUserRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [completedTab, setCompletedTab] = useState<'RECEIPT' | 'FEEDBACK'>('RECEIPT');
  const [bookingSubStep, setBookingSubStep] = useState<'DETAILS' | 'SERVICE' | 'SUB_SERVICE'>('DETAILS');
  const [showMedicalOffer, setShowMedicalOffer] = useState(false);

  const qrRef = useRef<HTMLCanvasElement>(null);
  const lastPositionRef = useRef<number | null>(null);

  // Age logic for auto-priority
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const age = calculateAge(dob);
  const isAutoSenior = age >= 60;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'ID' | 'MEDICAL') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("File too large. Max 5MB allowed.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'ID') setIdProof(reader.result as string);
        else setMedicalProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = useCallback(() => {
    setName(''); setDob(''); setPhone(''); setEmail('');
    setPrefSms(true); setPrefEmail(false);
    setSelectedMainService(null); setSelectedService(null);
    setIsSenior(false); setIsMedicalEmergency(false);
    setIdProof(null); setMedicalProof(null);
    setUserRating(null); setFeedbackComment(''); setFeedbackSubmitted(false);
    setCompletedTab('RECEIPT');
    setBookingSubStep('DETAILS');
  }, []);

  useEffect(() => {
    const portalStep = searchParams.get('portalStep');
    const serviceId = searchParams.get('serviceId');

    if (portalStep === 'HOME' || portalStep === 'BOOK' || portalStep === 'TRACK' || portalStep === 'LOOKUP') {
      setStep(portalStep as any);
    }

    if (serviceId && state.services.length > 0) {
      const service = state.services.find(s => s.id === serviceId);
      if (service) {
        setSelectedMainService(service);
        setStep('BOOK');
        setBookingSubStep('DETAILS');
      }
    }

    if (portalStep || serviceId) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('portalStep');
      newParams.delete('serviceId');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, state.services]);

  const liveToken = state.tokens.find(t => t.id === activeToken?.id) || activeToken;

  const queuePosition = liveToken ? state.tokens
    .filter(t => (t.status === TokenStatus.WAITING || t.status === TokenStatus.CHECKED_IN) && t.serviceCategory === liveToken.serviceCategory)
    .sort((a, b) => {
      if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })
    .findIndex(t => t.id === liveToken.id) + 1 : 0;

  useEffect(() => {
    if (step === 'TRACK' && liveToken && (liveToken.status === TokenStatus.WAITING || liveToken.status === TokenStatus.CHECKED_IN) && queuePosition > 0 && queuePosition !== lastPositionRef.current) {
      lastPositionRef.current = queuePosition;
      const triggerAIPrediction = async () => {
        setIsPredicting(true);
        try {
          const predictedMinutes = await getWaitTimePrediction(state, liveToken.id);
          updateTokenWaitTime(liveToken.id, predictedMinutes);
        } catch (e) {
          console.error("AI prediction cycle failed:", e);
        } finally {
          setIsPredicting(false);
        }
      };
      triggerAIPrediction();
    }
  }, [step, liveToken?.id, liveToken?.status, queuePosition, state, updateTokenWaitTime]);

  const validatePhone = (p: string) => {
    const cleaned = p.replace(/\D/g, '');
    if (cleaned.length !== 10) return "Phone number must be exactly 10 digits.";
    return null;
  };

  const validateEmail = (e: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(e)) return "Please enter a valid email format.";
    return null;
  };

  const handleBook = async () => {
    if (!name.trim() || !selectedService || !selectedMainService || !dob.trim() || dob.length !== 10 || !phone.trim() || validatePhone(phone)) {
      showToast("Missing Information: Name, valid Phone Number, Date of Birth, and Service are required.", "warning");
      if (validatePhone(phone)) setPhoneError(validatePhone(phone));
      return;
    }

    if (prefEmail) {
      const eErr = validateEmail(email);
      if (eErr) { setEmailError(eErr); return; }
    }

    try {
      setIsPredicting(true);
      const token = await issueToken({
        name,
        dob,
        userId: authUser?.id,
        category: selectedMainService.name,
        service: selectedService,
        isPriority: isAutoSenior || isSenior || isMedicalEmergency,
        isSenior: isAutoSenior || isSenior,
        idProof: (isAutoSenior || isSenior) ? (idProof || undefined) : undefined,
        medicalProof: isMedicalEmergency ? (medicalProof || undefined) : undefined,
        contact: {
          phone: phone,
          email: prefEmail ? email : undefined,
          prefs: { sms: prefSms, email: prefEmail }
        }
      });

      if (token) {
        showToast("Token Issued Successfully.", 'success');
        setActiveToken(token);
        setStep('TRACK');
      }
    } catch (e: any) {
      showToast(e.message || "Failed to issue token.", 'error');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleLookup = () => {
    const val = lookupValue.trim().toLowerCase();
    if (!tokenExists(val)) return;

    const token = state.tokens.find(tk =>
      tk.number?.toString() === val ||
      tk.tokenNumber?.toLowerCase() === val ||
      tk.tokenNumber?.split('-')[1]?.toLowerCase() === val ||
      tk.id?.toLowerCase() === val ||
      (tk.phone && tk.phone.replace(/\D/g, '') === val.replace(/\D/g, ''))
    );

    if (token) {
      setActiveToken(token);
      setStep('TRACK');
      setLookupValue('');
      showToast(`Token recovered.`, "success");
    } else {
      showToast("Token not found.", "error");
    }
  };

  const tokenExists = (val: string) => {
    if (!val) {
      showToast("Please enter a Token number or Phone.", "warning");
      return false;
    }
    return true;
  };

  const handleFeedbackSubmit = () => {
    if (liveToken && userRating) {
      submitFeedback(liveToken.id, userRating);
      setFeedbackSubmitted(true);
      setTimeout(() => {
        resetForm();
        setActiveToken(null);
        setStep('HOME');
      }, 3000);
    }
  };

  // Generate printable receipt
  const handleDownloadReceipt = () => {
    if (!liveToken) return;
    const receiptWindow = window.open('', '_blank', 'width=800,height=700');
    if (!receiptWindow) { showToast('Please allow pop-ups to download the receipt.', 'warning'); return; }
    const completedAt = liveToken.completedAt ? new Date(liveToken.completedAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
    const issuedAt = new Date(liveToken.createdAt).toLocaleString('en-IN');
    receiptWindow.document.write(`
      <!DOCTYPE html><html><head><title>Service Completion Receipt</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; padding: 40px; }
        .receipt { max-width: 680px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
        .header { background: #1e3a6e; color: white; padding: 40px; text-align: center; position: relative; }
        .header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: #c8a227; }
        .logo { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
        .sublogo { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; color: #c8a227; margin-top: 6px; }
        .badge { display: inline-block; background: #c8a227; color: #1a1a1a; padding: 4px 14px; border-radius: 999px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-top: 14px; }
        .body { padding: 40px; }
        .token-num { text-align: center; font-size: 72px; font-weight: 900; color: #1e3a6e; line-height: 1; font-style: italic; }
        .token-label { text-align: center; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; color: #c8a227; margin-top: 8px; margin-bottom: 32px; }
        .divider { height: 2px; background: repeating-linear-gradient(90deg, #e2e8f0 0, #e2e8f0 8px, transparent 8px, transparent 12px); margin: 24px 0; }
        .row { display: flex; justify-content: space-between; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
        .row:last-child { border: none; }
        .label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; }
        .value { font-size: 14px; font-weight: 700; color: #1e293b; text-align: right; max-width: 60%; }
        .status { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 999px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
        .footer { background: #f8fafc; padding: 24px 40px; text-align: center; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; }
        @media print { body { padding: 0; } .receipt { box-shadow: none; } }
      </style></head><body>
      <div class="receipt">
        <div class="header">
          <div class="logo">🏛️ CivicFlow</div>
          <div class="sublogo">Government Service Management Portal</div>
          <div class="badge">✓ Official Service Completion Receipt</div>
        </div>
        <div class="body">
          <div class="token-num">${liveToken.tokenNumber}</div>
          <div class="token-label">Token Reference Number</div>
          <div class="divider"></div>
          <div class="row"><span class="label">Citizen Name</span><span class="value">${liveToken.citizenName}</span></div>
          <div class="row"><span class="label">Service Category</span><span class="value">${liveToken.serviceCategory}</span></div>
          <div class="row"><span class="label">Service Type</span><span class="value">${liveToken.serviceType}</span></div>
          <div class="row"><span class="label">Priority</span><span class="value">${liveToken.priorityLevel}</span></div>
          <div class="row"><span class="label">Token Issued</span><span class="value">${issuedAt}</span></div>
          <div class="row"><span class="label">Service Completed</span><span class="value">${completedAt}</span></div>
          <div class="row"><span class="label">Status</span><span class="value"><span class="status">✓ Completed</span></span></div>
          <div class="divider"></div>
          <div class="row"><span class="label">Session ID</span><span class="value" style="font-size:10px;color:#64748b">${liveToken.id.toUpperCase()}</span></div>
        </div>
        <div class="footer">This is an official computer-generated receipt &mdash; no signature required &bull; CivicFlow &copy; ${new Date().getFullYear()}</div>
      </div>
      <script>window.onload = () => { window.print(); }<\/script></body></html>
    `);
    receiptWindow.document.close();
  };

  const handleRejoin = () => {
    if (liveToken) rejoinQueue(liveToken.id);
  };

  useEffect(() => {
    if (activeToken && qrRef.current && step === 'TRACK' && liveToken?.status !== TokenStatus.COMPLETED && liveToken?.status !== TokenStatus.CANCELLED) {
      QRCode.toCanvas(qrRef.current, activeToken.id, {
        width: 180,
        margin: 2,
        color: { dark: '#1e3a6e', light: '#ffffff' },
      });
    }
  }, [activeToken, step, liveToken?.status]);

  const SERVICE_EMOJI: Record<string, string> = {
    'aadhaar': '🪪', 'revenue': '🏠', 'vehicle': '🚗', 'cert': '📑',
    'health': '🏥', 'pension': '📋', 'education': '🎓', 'legal': '⚖️',
    'bill': '💳', 'comp': '📢', 'appr': '✅',
  };

  const renderHome = () => (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950">
      <div className="relative bg-[#0a1931] overflow-hidden min-h-[600px] flex flex-col items-center justify-center">
        {/* Ambient background effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] bg-[#c8a227]/10 rounded-full mix-blend-screen filter blur-[80px] animate-blob animation-delay-4000"></div>
        </div>
        <FlowingLines />

        <div className="relative w-full max-w-4xl mx-auto px-4 md:px-6 py-14 md:py-24 text-center z-10 animate-float">
          <div className="flex justify-center mb-8">
            <InstitutionalBranding dark={true} />
          </div>

          {/* Glassmorphism Title Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-14 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            {/* Decorative Top Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c8a227] to-transparent"></div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/50 border border-[#c8a227]/30 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-[0_0_15px_rgba(200,162,39,0.2)]">
              <ShieldCheck className="w-4 h-4 text-[#c8a227]" /> Official Digital Services Portal
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[4rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-300 leading-[1.1] tracking-tight mb-6 uppercase">
              Citizen Service Access
            </h1>

            <p className="text-lg md:text-xl text-blue-100/80 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
              Efficient, transparent, and accessible government service delivery through prioritized digital queue management.
            </p>

            <div className="flex flex-wrap justify-center gap-5">
              <button onClick={() => { setBookingSubStep('DETAILS'); setStep('BOOK'); }}
                className="relative group overflow-hidden flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-[#c8a227] to-[#dbb52e] text-[#1a1a1a] font-black text-sm uppercase tracking-[0.15em] rounded-xl shadow-[0_0_30px_rgba(200,162,39,0.3)] hover:shadow-[0_0_40px_rgba(200,162,39,0.5)] hover:-translate-y-1 active:scale-95 transition-all duration-300">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                <Ticket className="w-6 h-6 relative z-10" />
                <span className="relative z-10">Book New Token</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
              </button>

              <button onClick={() => setStep('LOOKUP')}
                className="group flex items-center gap-4 px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-black text-sm uppercase tracking-[0.15em] rounded-xl border border-white/20 hover:border-white/40 backdrop-blur-md hover:-translate-y-1 active:scale-95 transition-all duration-300">
                <Search className="w-6 h-6" /> Track Existing <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-20">
        {authUser && state.tokens.filter(t => t.userId === authUser.id).length > 0 && (
          <div className="mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c8a227] mb-1">Authenticated Access</p>
                <h3 className="text-2xl font-black text-[#1e3a6e] dark:text-white uppercase tracking-tight">My Active Sessions</h3>
              </div>
              <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center gap-2">
                <ShieldCheck size={14} className="text-blue-600" />
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{authUser.fullName}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.tokens.filter(t => t.userId === authUser.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3).map(token => (
                <button
                  key={token.id}
                  onClick={() => { setActiveToken(token); setStep('TRACK'); }}
                  className="group relative bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 text-left hover:border-[#1e3a6e] hover:shadow-xl transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[10px] font-black text-[#1e3a6e] dark:text-blue-300 uppercase tracking-widest">
                      {token.tokenNumber}
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${token.status === TokenStatus.WAITING ? 'bg-amber-100 text-amber-700' :
                      token.status === TokenStatus.CALLED ? 'bg-blue-100 text-blue-700 animate-pulse' :
                        token.status === TokenStatus.IN_PROGRESS ? 'bg-emerald-100 text-emerald-700' :
                          token.status === TokenStatus.COMPLETED ? 'bg-slate-100 text-slate-500' :
                            'bg-rose-100 text-rose-700'
                      }`}>
                      {token.status}
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{token.serviceCategory}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">{token.serviceType}</p>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#c8a227]">
                    <span>Track Status</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-12 border-b-4 border-[#1e3a6e] pb-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#c8a227] mb-2 font-black">Service Directory</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#1e3a6e] dark:text-white uppercase tracking-tight">Select Department Service</h2>
          </div>
          <div className="hidden md:flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-slate-400">System Uptime</span>
              <span className="text-sm font-black text-[#1e3a6e]">99.9% Operational</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {state.services.map((s) => (
            <button key={s.id} onClick={() => { setSelectedMainService(s); setStep('BOOK'); setBookingSubStep('DETAILS'); }}
              className="group flex flex-col items-center justify-center gap-6 p-10 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 hover:border-[#c8a227] hover:shadow-2xl hover:-translate-y-2 transition-all text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <GovEmblem size={80} />
              </div>
              <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-5xl group-hover:bg-[#1e3a6e] group-hover:scale-110 transition-all duration-500">
                {SERVICE_EMOJI[s.id] || '🏛️'}
              </div>
              <div>
                <span className="block text-sm font-black text-[#1e3a6e] dark:text-white group-hover:text-[#c8a227] uppercase tracking-widest mb-1">{s.name}</span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Estimated Wait: {s.avgTimeMinutes}m</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBook = () => (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950">
      <div className="relative bg-[#1e3a6e] overflow-hidden">
        <FlowingLines />
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20 text-center relative z-10">
          <button onClick={() => { resetForm(); setStep('HOME'); }}
            className="absolute top-8 left-4 md:left-8 flex items-center gap-2 text-white/60 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1" /> Back to Directory
          </button>

          <div className="inline-block px-4 py-1.5 bg-[#c8a227] text-[#1a1a1a] rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-lg mb-6">
            Official Registry Pipeline
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-4 uppercase">Registry Enrollment</h2>
          <p className="text-blue-200/60 text-sm font-medium tracking-wide max-w-xl mx-auto italic">Process authentication for government service scheduling.</p>

          <div className="flex items-center justify-center gap-6 mt-12">
            {['IDENTITY', 'SERVICE', 'SCHEDULE', 'ISSUE'].map((label, i) => {
              const isActive = (bookingSubStep === 'DETAILS' && i === 0) || (bookingSubStep === 'SERVICE' && i === 1) || (bookingSubStep === 'SUB_SERVICE' && i === 2);
              const isPast = (bookingSubStep === 'SERVICE' && i < 1) || (bookingSubStep === 'SUB_SERVICE' && i < 2);

              return (
                <div key={label} className="flex items-center gap-4">
                  <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${isActive ? 'scale-110' : 'opacity-40'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border-2 ${isActive ? 'bg-[#c8a227] border-[#c8a227] text-[#1a1a1a]' :
                      isPast ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent border-white/20 text-white'
                      }`}>
                      {isPast ? '✓' : i + 1}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-white hidden sm:block">{label}</span>
                  </div>
                  {i < 3 && <div className="w-8 md:w-16 h-0.5 bg-white/10" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 pb-24 mt-[-40px] relative z-20">
        {bookingSubStep === 'DETAILS' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 bg-white dark:bg-slate-900 p-8 md:p-14 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl space-y-10">
            <div className="flex items-center gap-6 mb-4">
              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-[#1e3a6e] dark:text-blue-400">
                <User size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#1e3a6e] dark:text-white uppercase tracking-tight">Citizen Identity Data</h3>
                <p className="text-[10px] font-black uppercase text-[#c8a227] tracking-widest">Mandatory Registry Fields</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1">Full Name (Legal ID) <span className="text-rose-500 text-lg leading-none">*</span></label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="E.g. Rajesh Kumar" className="w-full bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 focus:border-[#1e3a6e] rounded-2xl p-6 font-black text-slate-900 dark:text-white outline-none transition-all" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Notification Profile</label>
                  <div className="flex gap-4">
                    <button onClick={() => setPrefSms(!prefSms)} className={`flex-1 py-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all gap-3 flex items-center justify-center ${prefSms ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'bg-transparent border-slate-100 text-slate-400'}`}>
                      <Smartphone size={16} /> SMS
                    </button>
                    <button onClick={() => setPrefEmail(!prefEmail)} className={`flex-1 py-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all gap-3 flex items-center justify-center ${prefEmail ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'bg-transparent border-slate-100 text-slate-400'}`}>
                      <Mail size={16} /> Email
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1">Date of Birth <span className="text-rose-500 text-lg leading-none">*</span></label>
                  <div className="flex gap-2">
                    <select
                      value={dob.split('-')[2] || ''}
                      onChange={(e) => {
                        const parts = dob.split('-');
                        const y = parts[0] || '';
                        const m = parts[1] || '';
                        setDob(`${y}-${m}-${e.target.value.padStart(2, '0')}`);
                      }}
                      className="flex-1 bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 focus:border-[#1e3a6e] rounded-2xl p-4 font-black text-xs text-slate-900 dark:text-white outline-none appearance-none cursor-pointer"
                    >
                      <option value="">DD</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{String(i + 1).padStart(2, '0')}</option>
                      ))}
                    </select>

                    <select
                      value={dob.split('-')[1] || ''}
                      onChange={(e) => {
                        const parts = dob.split('-');
                        const y = parts[0] || '';
                        const d = parts[2] || '';
                        setDob(`${y}-${e.target.value.padStart(2, '0')}-${d}`);
                      }}
                      className="flex-[1.5] bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 focus:border-[#1e3a6e] rounded-2xl p-4 font-black text-xs text-slate-900 dark:text-white outline-none appearance-none cursor-pointer"
                    >
                      <option value="">MONTH</option>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{month}</option>
                      ))}
                    </select>

                    <select
                      value={dob.split('-')[0] || ''}
                      onChange={(e) => {
                        const parts = dob.split('-');
                        const m = parts[1] || '';
                        const d = parts[2] || '';
                        setDob(`${e.target.value}-${m}-${d}`);
                      }}
                      className="flex-[1.5] bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 focus:border-[#1e3a6e] rounded-2xl p-4 font-black text-xs text-slate-900 dark:text-white outline-none appearance-none cursor-pointer"
                    >
                      <option value="">YYYY</option>
                      {Array.from({ length: 120 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return <option key={year} value={year}>{year}</option>;
                      })}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`space-y-3 transition-opacity opacity-100`}>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1">Mobile String (+91) <span className="text-rose-500 text-lg leading-none">*</span></label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(val);
                      if (val.length > 0 && val.length < 10) {
                        setPhoneError("Phone number must be exactly 10 digits.");
                      } else {
                        setPhoneError(null);
                      }
                    }}
                    onBlur={() => {
                      if (phone.length > 0 && phone.length < 10) setPhoneError("Phone number must be exactly 10 digits.");
                    }}
                    placeholder="9876543210"
                    className={`w-full bg-slate-50 dark:bg-black/20 border-2 ${phoneError ? 'border-rose-500' : 'border-slate-100 dark:border-white/5'} focus:border-[#1e3a6e] rounded-2xl p-4 font-black text-slate-900 dark:text-white outline-none`}
                  />
                  {phoneError && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-2">{phoneError}</p>}
                </div>
                <div className={`space-y-3 transition-opacity ${prefEmail ? 'opacity-100' : 'opacity-20'}`}>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Endpoint</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(null);
                    }}
                    disabled={!prefEmail}
                    placeholder="citizen@gov.in"
                    className={`w-full bg-slate-50 dark:bg-black/20 border-2 ${emailError ? 'border-rose-500' : 'border-slate-100 dark:border-white/5'} focus:border-[#1e3a6e] rounded-2xl p-4 font-black text-slate-900 dark:text-white outline-none`}
                  />
                  {emailError && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-2">{emailError}</p>}
                </div>
              </div>

              <button disabled={!name || !dob || dob.length !== 10 || !phone || phone.length !== 10 || !!phoneError} onClick={() => setBookingSubStep('SERVICE')} className="w-full bg-[#1e3a6e] hover:bg-[#0d2550] text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 disabled:opacity-50 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-4 group/btn">
                Continue To Department Selection <ChevronRight size={20} className="group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}

        {bookingSubStep === 'SERVICE' && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 space-y-8">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setBookingSubStep('DETAILS')} className="text-[10px] font-black uppercase tracking-widest text-[#c8a227] flex items-center gap-2 hover:translate-x-[-4px] transition-transform">
                <ChevronLeft size={16} /> Edit Identity Data
              </button>
              <div className="h-0.5 flex-1 mx-6 bg-[#1e3a6e]/10" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {state.services.map((s) => (
                <button key={s.id} onClick={() => { setSelectedMainService(s); setBookingSubStep('SUB_SERVICE'); }}
                  className={`flex flex-col items-center justify-center gap-6 p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border-4 transition-all duration-500 hover:-translate-y-2 ${selectedMainService?.id === s.id ? 'border-[#c8a227] shadow-2xl' : 'border-transparent shadow-lg hover:border-[#1e3a6e]/30'}`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl transition-all duration-700 ${selectedMainService?.id === s.id ? 'bg-[#c8a227] rotate-6 scale-110' : 'bg-slate-50 dark:bg-slate-800'}`}>
                    {SERVICE_EMOJI[s.id] || '🏛️'}
                  </div>
                  <span className={`text-[11px] font-black uppercase tracking-widest leading-tight ${selectedMainService?.id === s.id ? 'text-[#c8a227]' : 'text-[#1e3a6e] dark:text-white'}`}>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {bookingSubStep === 'SUB_SERVICE' && selectedMainService && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 bg-white dark:bg-slate-900 p-8 md:p-14 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl space-y-10">
            <div className="flex items-center justify-between">
              <button onClick={() => setBookingSubStep('SERVICE')} className="text-[10px] font-black uppercase tracking-widest text-[#c8a227] flex items-center gap-2 hover:translate-x-[-4px] transition-transform">
                <ChevronLeft size={16} /> Select Category
              </button>
              <div className="px-5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black text-[#1e3a6e] dark:text-blue-300 uppercase tracking-widest border border-slate-100">
                {selectedMainService.name} Registry
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-black text-[#1e3a6e] dark:text-white uppercase tracking-tight">Select Department Task</h3>
              <div className="grid grid-cols-1 gap-4">
                {selectedMainService.subServices?.map((sub) => (
                  <button key={sub} onClick={() => setSelectedService(sub)}
                    className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300 ${selectedService === sub ? 'border-[#c8a227] bg-[#c8a227]/5 text-[#c8a227]' : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:border-[#1e3a6e]'}`}>
                    <span className="font-black text-xs uppercase tracking-widest">{sub}</span>
                    {selectedService === sub ? <CheckCircle2 size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-slate-200" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Priority Selection</p>
                  <h4 className="text-sm font-black text-[#1e3a6e] dark:text-white uppercase">Fast-Track Provisions</h4>
                </div>
                {isAutoSenior && (
                  <div className="flex flex-col items-end gap-2">
                    <div className="px-4 py-2 bg-[#1e3a6e] text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={12} className="text-[#c8a227]" /> Senior Citizen Auto-Detected
                    </div>
                    {!isMedicalEmergency && !showMedicalOffer && (
                      <button
                        onClick={() => setShowMedicalOffer(true)}
                        className="text-[9px] font-black text-[#c8a227] uppercase tracking-widest hover:underline animate-pulse"
                      >
                        Apply for Medical Overlay?
                      </button>
                    )}
                  </div>
                )}
              </div>

              {((isAutoSenior || isSenior) && showMedicalOffer && !isMedicalEmergency) && (
                <div className="p-8 bg-rose-600 rounded-[2rem] text-white shadow-2xl animate-in zoom-in duration-500 flex flex-col items-center text-center gap-6 border-4 border-white/20">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Flame className="text-white animate-pulse" size={32} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tighter italic">Medical Emergency Overlay?</h4>
                    <p className="text-[10px] font-medium opacity-80 uppercase tracking-widest mt-2">Seniors with critical health conditions qualify for Absolute Priority.</p>
                  </div>
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={() => setShowMedicalOffer(false)}
                      className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Maybe Later
                    </button>
                    <button
                      onClick={() => { setIsMedicalEmergency(true); setShowMedicalOffer(false); }}
                      className="flex-1 py-4 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                    >
                      Yes, Apply Status
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(isAutoSenior || age >= 60) && (
                  <button onClick={() => { setIsSenior(!isSenior); if (!isSenior) setIdProof(null); }}
                    className={`p-6 rounded-2xl border-2 flex items-center justify-between transition-all ${isSenior || isAutoSenior ? 'bg-[#c8a227] border-[#c8a227] text-[#1a1a1a]' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 text-slate-400'}`}>
                    <div className="flex items-center gap-4">
                      <UserCheck className={isSenior || isAutoSenior ? 'text-[#1a1a1a]' : 'text-[#c8a227]'} />
                      <span className="text-xs font-black uppercase tracking-widest">Senior Citizen (60+)</span>
                    </div>
                    {(isSenior || isAutoSenior) && <CheckCircle2 size={20} />}
                  </button>
                )}

                <button onClick={() => { setIsMedicalEmergency(!isMedicalEmergency); if (!isMedicalEmergency) setMedicalProof(null); }}
                  className={`p-6 rounded-2xl border-2 flex items-center justify-between transition-all ${isMedicalEmergency ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 text-slate-400'}`}>
                  <div className="flex items-center gap-4">
                    <Flame className={isMedicalEmergency ? 'text-white animate-pulse' : 'text-rose-500'} />
                    <span className="text-xs font-black uppercase tracking-widest">Medical Emergency</span>
                  </div>
                  {isMedicalEmergency && <CheckCircle2 size={20} />}
                </button>
              </div>

              {(isSenior || isAutoSenior) && (
                <div className="p-6 bg-[#c8a227]/5 rounded-2xl border-2 border-dashed border-[#c8a227]/20 flex flex-col items-center justify-center text-center gap-3 relative group">
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'ID')} className="absolute inset-0 w-full h-full z-10 opacity-0 cursor-pointer" title="Upload ID Proof" />
                  {idProof ? <ShieldCheck className="text-[#c8a227]" size={32} /> : <Upload className="text-slate-300" size={32} />}
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1e3a6e]">{idProof ? 'Government ID Latched' : 'Upload Government ID (Aadhaar/PAN)'}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase italic">Mandatory for senior priority verification</p>
                  </div>
                </div>
              )}

              {isMedicalEmergency && (
                <div className="p-6 bg-rose-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-rose-200 flex flex-col items-center justify-center text-center gap-3 relative group overflow-hidden">
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'MEDICAL')} className="absolute inset-0 w-full h-full z-10 opacity-0 cursor-pointer" title="Upload Medical Proof" />
                  {medicalProof ? <CheckCircle2 className="text-rose-500" size={32} /> : <Upload className="text-slate-300" size={32} />}
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">{medicalProof ? 'Medical Evidence Received' : 'Upload Medical Emergency Proof'}</p>
                </div>
              )}
            </div>

            <button disabled={!selectedService || ((isSenior || isAutoSenior) && !idProof) || (isMedicalEmergency && !medicalProof) || isPredicting} onClick={handleBook}
              className="w-full bg-[#c8a227] hover:bg-[#dbb52e] text-[#1a1a1a] py-6 rounded-2xl font-black text-sm uppercase tracking-[0.4em] shadow-2xl active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center gap-4 relative overflow-hidden group/final">
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/final:translate-x-[100%] transition-transform duration-700" />
              {isPredicting ? <BrainCircuit className="animate-spin" /> : <Ticket />}
              {isPredicting ? 'Synchronizing Pipeline...' : 'Issue Official Token'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderLookup = () => (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <button onClick={() => setStep('HOME')} className="absolute top-8 left-8 text-[10px] font-black uppercase tracking-widest text-[#1e3a6e] dark:text-blue-400 flex items-center gap-2">
        <ChevronLeft size={16} /> Return to Directory
      </button>

      <div className="w-full max-w-xl bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl border-4 border-[#1e3a6e]/10 space-y-10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5"><GovEmblem size={150} /></div>

        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-[#1e3a6e] dark:text-blue-400">
          <Search size={40} />
        </div>

        <div>
          <h2 className="text-3xl font-black text-[#1e3a6e] dark:text-white uppercase tracking-tighter">Token Recovery</h2>
          <p className="text-[10px] font-black uppercase text-[#c8a227] tracking-widest mt-2">Authenticated System Retrieval</p>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1e3a6e] transition-colors" />
            <input type="text" placeholder="Token ID or Mobile Number" value={lookupValue} onChange={(e) => setLookupValue(e.target.value)}
              className="w-full bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 focus:border-[#1e3a6e] rounded-2xl py-6 pl-16 pr-6 font-black text-xl tracking-widest text-[#1e3a6e] dark:text-white outline-none" />
          </div>

          <button onClick={handleLookup} className="w-full py-6 bg-[#1e3a6e] text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-[#0d2550] active:scale-95 transition-all flex items-center justify-center gap-3">
            <Monitor size={18} /> Recall Session
          </button>
        </div>
      </div>
    </div>
  );

  const renderTrack = () => {
    if (!liveToken) return null;

    if (liveToken.status === TokenStatus.CANCELLED) {
      const isLiquidated = (liveToken.skipCount || 0) >= 3;
      return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-10">
          <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-[2.5rem] flex items-center justify-center text-rose-600 animate-bounce">
            <ShieldAlert size={60} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-[#1e3a6e] dark:text-white uppercase tracking-tighter leading-none">
              {isLiquidated ? 'Registry Limit Reached' : 'Session Terminated'}
            </h2>
            <p className="text-slate-500 font-medium italic max-w-md mx-auto">
              {isLiquidated
                ? `Your token was cancelled after ${liveToken.skipCount} unsuccessful calls. Please return tomorrow or book a new token for the next operational cycle.`
                : 'Your registry session was cancelled due to expiration. Please visit the booking portal for a new token.'}
            </p>
          </div>
          <button onClick={() => { resetForm(); setActiveToken(null); setStep(isLiquidated ? 'HOME' : 'BOOK'); }}
            className="px-12 py-5 bg-[#1e3a6e] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-[#0d2550] transition-all">
            {isLiquidated ? 'Return to Home' : 'Initialize New Session'}
          </button>
        </div>
      );
    }

    if (liveToken.status === TokenStatus.COMPLETED) {
      return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-2xl">
            {/* Completion Hero */}
            <div className="bg-[#1e3a6e] rounded-[3rem] p-10 text-white text-center relative overflow-hidden mb-8 shadow-2xl">
              <FlowingLines />
              <div className="relative z-10">
                <div className="w-24 h-24 bg-emerald-400/20 border-2 border-emerald-400/40 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={52} className="text-emerald-400 animate-in zoom-in duration-700" />
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-3">Service Complete!</h2>
                <p className="text-blue-200/70 text-sm font-medium italic">Token #{liveToken.tokenNumber} — {liveToken.citizenName}</p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-400/10 border border-emerald-400/20 rounded-full text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {liveToken.serviceCategory} · {liveToken.serviceType}
                </div>
              </div>
            </div>

            {/* Tab Toggle */}
            <div className="flex gap-3 mb-6">
              <button onClick={() => setCompletedTab('RECEIPT')}
                className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${completedTab === 'RECEIPT' ? 'bg-[#1e3a6e] text-white shadow-xl' : 'bg-white dark:bg-slate-900 text-slate-400 border-2 border-slate-100 dark:border-white/5 hover:border-[#1e3a6e]'
                  }`}>
                <Download size={14} /> Download Receipt
              </button>
              <button onClick={() => setCompletedTab('FEEDBACK')}
                className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${completedTab === 'FEEDBACK' ? 'bg-[#c8a227] text-[#1a1a1a] shadow-xl' : 'bg-white dark:bg-slate-900 text-slate-400 border-2 border-slate-100 dark:border-white/5 hover:border-[#c8a227]'
                  }`}>
                <MessageSquare size={14} /> Rate & Feedback
              </button>
            </div>

            {/* Receipt Panel */}
            {completedTab === 'RECEIPT' && (
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl border-2 border-slate-100 dark:border-white/5 animate-in fade-in duration-500">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Download size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#1e3a6e] dark:text-white uppercase tracking-tight">Service Completion Receipt</h3>
                    <p className="text-[10px] font-black uppercase text-[#c8a227] tracking-widest">Official Document · CivicFlow Registry</p>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    { label: 'Token Number', value: liveToken.tokenNumber },
                    { label: 'Citizen Name', value: liveToken.citizenName },
                    { label: 'Service', value: `${liveToken.serviceCategory} — ${liveToken.serviceType}` },
                    { label: 'Priority Level', value: liveToken.priorityLevel },
                    { label: 'Issued On', value: new Date(liveToken.createdAt).toLocaleString('en-IN') },
                    { label: 'Completed On', value: liveToken.completedAt ? new Date(liveToken.completedAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN') },
                    { label: 'Session ID', value: liveToken.id.slice(0, 16).toUpperCase() + '...' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                      <span className="text-sm font-black text-[#1e3a6e] dark:text-white text-right max-w-[55%]">{value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Status</span>
                    <span className="text-sm font-black text-emerald-600 flex items-center gap-2"><CheckCircle size={16} /> Completed</span>
                  </div>
                </div>

                <button onClick={handleDownloadReceipt}
                  className="w-full py-6 bg-[#1e3a6e] hover:bg-[#0d2550] text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 group">
                  <Download size={20} className="group-hover:animate-bounce" />
                  Download / Print Receipt
                </button>

                <button onClick={() => setCompletedTab('FEEDBACK')}
                  className="w-full mt-4 py-4 bg-[#c8a227]/10 text-[#c8a227] rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-[#c8a227]/20 hover:bg-[#c8a227]/20 transition-all flex items-center justify-center gap-3">
                  <MessageSquare size={14} /> Proceed to Rate This Service
                </button>
              </div>
            )}

            {/* Feedback Panel */}
            {completedTab === 'FEEDBACK' && (
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl border-2 border-slate-100 dark:border-white/5 animate-in fade-in duration-500">
                {!feedbackSubmitted ? (
                  <>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-14 h-14 bg-[#c8a227]/10 rounded-2xl flex items-center justify-center text-[#c8a227]">
                        <ThumbsUp size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-[#1e3a6e] dark:text-white uppercase tracking-tight">Rate Your Experience</h3>
                        <p className="text-[10px] font-black uppercase text-[#c8a227] tracking-widest">Operational Excellence Audit</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Star Rating */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">How was your overall service experience?</p>
                        <div className="flex justify-center gap-3">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button key={s} onClick={() => setUserRating(s)}
                              className={`p-5 rounded-2xl transition-all hover:scale-110 ${userRating && userRating >= s
                                ? 'bg-[#c8a227] text-white shadow-xl shadow-[#c8a227]/30'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-300 hover:bg-[#c8a227]/20'
                                }`}>
                              <Star size={22} fill={userRating && userRating >= s ? 'currentColor' : 'none'} />
                            </button>
                          ))}
                        </div>
                        {userRating && (
                          <p className="text-center text-sm font-black text-[#1e3a6e] dark:text-white uppercase tracking-widest animate-in fade-in">
                            {['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent!'][userRating]}
                          </p>
                        )}
                      </div>

                      {/* Comment Field */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Additional Comments (Optional)</label>
                        <textarea
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          placeholder="Share your experience, suggestions, or concerns..."
                          rows={4}
                          className="w-full bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 focus:border-[#1e3a6e] rounded-2xl p-5 font-medium text-slate-900 dark:text-white outline-none transition-all resize-none text-sm"
                        />
                      </div>

                      <button disabled={!userRating} onClick={handleFeedbackSubmit}
                        className="w-full py-6 bg-[#c8a227] hover:bg-[#dbb52e] text-[#1a1a1a] rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-xl shadow-[#c8a227]/30 disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-4">
                        <CheckCircle size={20} /> Submit Feedback
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-16 space-y-6 text-center animate-in fade-in zoom-in-95 duration-700">
                    <PartyPopper className="mx-auto text-emerald-500" size={56} />
                    <h3 className="text-3xl font-black uppercase text-emerald-600 tracking-tighter">Thank You!</h3>
                    <p className="text-slate-400 font-medium italic">Your feedback has been recorded. Redirecting shortly...</p>
                  </div>
                )}
              </div>
            )}

            <button onClick={() => { resetForm(); setActiveToken(null); setStep('HOME'); }}
              className="w-full mt-6 text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] hover:text-slate-600 transition-all">
              Finalize &amp; Return Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-32">
        <header className="bg-[#1e3a6e] text-white p-6 md:p-10 relative overflow-hidden border-b-4 border-[#c8a227]">
          <FlowingLines />
          <div className="relative z-10 flex items-center justify-between w-full">
            <div className="flex items-center gap-6">
              <InstitutionalBranding dark={true} />
              <div className="h-10 w-px bg-white/20 hidden md:block" />
              <div className="hidden md:block text-left">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Official Registry Pipeline</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Session Securely Authenticated</span>
                </div>
              </div>
            </div>

            <button onClick={() => { resetForm(); setActiveToken(null); setStep('HOME'); }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Home Directory
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 md:px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {liveToken.status === TokenStatus.SKIPPED && (
              <div className="p-8 bg-amber-600 text-white rounded-3xl shadow-xl flex items-center justify-between animate-in slide-in-from-top">
                <div className="flex items-center gap-6">
                  <AlertCircle size={32} />
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tighter">Turn Status: Missed ({liveToken.skipCount}/3)</h4>
                    <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">
                      {liveToken.skipReason || 'Officer was unable to verify your presence.'}
                    </p>
                  </div>
                </div>
                <button onClick={handleRejoin} className="px-8 py-4 bg-white text-amber-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-amber-50 transition-all">
                  Re-join Protocol (2-3 positions back)
                </button>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-10 md:p-14 rounded-[4rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10 overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><GovEmblem size={250} /></div>
              <div className="flex justify-between items-start mb-14 relative z-10">
                <div className="text-left">
                  <p className="text-[#c8a227] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Digital Identification</p>
                  <h3 className="text-5xl font-black text-[#1e3a6e] dark:text-white uppercase tracking-tighter leading-none">{liveToken.tokenNumber}</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-4 flex items-center gap-2"><Hash size={14} /> Pipeline ID: {liveToken.id.toUpperCase()}</p>
                </div>
                <div className={`p-6 rounded-[2rem] shadow-2xl ${liveToken.isPriority ? 'bg-[#c8a227] text-[#1a1a1a]' : 'bg-[#1e3a6e] text-white'}`}>
                  <User size={32} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 relative z-10">
                <div className="p-8 bg-[#1e3a6e]/5 dark:bg-white/5 rounded-[2.5rem] border-2 border-[#1e3a6e]/10 dark:border-white/10 text-center relative overflow-hidden group/metric">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c8a227]/10 to-transparent opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                  <p className="text-[10px] font-black text-[#c8a227] uppercase tracking-[0.3em] mb-3">Estimated Arrival</p>
                  <div className="flex items-center justify-center gap-3">
                    <Clock className="w-6 h-6 text-[#1e3a6e] dark:text-blue-400" />
                    <p className="text-5xl font-black text-[#1e3a6e] dark:text-white tracking-tighter italic">
                      {liveToken.estimatedWaitTime || '---'} <span className="text-xs italic uppercase">Mins</span>
                    </p>
                  </div>
                  {isPredicting && <div className="mt-4 flex items-center justify-center gap-2 text-[9px] font-black text-blue-500 uppercase tracking-widest animate-pulse"><BrainCircuit size={12} /> Syncing AI Prediction...</div>}
                </div>

                <div className="p-8 bg-[#1e3a6e]/5 dark:bg-white/5 rounded-[2.5rem] border-2 border-[#1e3a6e]/10 dark:border-white/10 text-center relative overflow-hidden group/metric">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c8a227]/10 to-transparent opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                  <p className="text-[10px] font-black text-[#c8a227] uppercase tracking-[0.3em] mb-3">Queue Offset</p>
                  <div className="flex items-center justify-center gap-3">
                    <UserCheck className="w-6 h-6 text-[#1e3a6e] dark:text-blue-400" />
                    <p className="text-5xl font-black text-[#1e3a6e] dark:text-white tracking-tighter italic">#{queuePosition}</p>
                  </div>
                  <div className="mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Pipeline Position</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14 relative z-10">
                <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700 text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject Name</p>
                  <p className="text-2xl font-black text-[#1e3a6e] dark:text-white uppercase italic tracking-tight">{liveToken.citizenName}</p>
                </div>
                <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700 text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Operational Vector</p>
                  <p className="text-2xl font-black text-[#1e3a6e] dark:text-white uppercase italic tracking-tight">{liveToken.serviceType}</p>
                </div>
              </div>

              <div className="mb-14 p-10 bg-[#1e3a6e] text-white rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom duration-700 flex flex-col md:flex-row items-center justify-between gap-8 border-4 border-[#c8a227]/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Monitor size={100} /></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="p-6 bg-white/10 rounded-[2rem] backdrop-blur-md border border-white/20"><Monitor size={40} /></div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c8a227]">Assigned Station</p>
                    <h4 className="text-4xl font-black uppercase italic tracking-tighter">
                      {liveToken.counterId ? (state.counters.find(c => c.id === liveToken.counterId)?.name || `Station ${liveToken.counterId}`) : 'STATION PENDING'}
                    </h4>
                  </div>
                </div>
                <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-10 relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Designated Service Officer</p>
                  <p className="text-2xl font-black italic uppercase tracking-tight">
                    {liveToken.counterId ? (state.counters.find(c => c.id === liveToken.counterId)?.officerName || 'Registry Authorized') : 'Awaiting Assignment'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-6 pt-10 border-t-2 border-dashed border-slate-200">
                <div className="p-8 bg-white rounded-3xl shadow-xl border border-slate-100"><canvas ref={qrRef} /></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Scan at Station Terminal for Instant Check-in</p>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-xl border border-slate-100 dark:border-slate-800 space-y-10">
              <div className="text-left">
                <h3 className="text-xs font-black text-[#1e3a6e] dark:text-white uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c8a227]" /> Notification Engine
                </h3>
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-6 rounded-3xl ${liveToken.notificationPreferences?.sms ? 'bg-[#1e3a6e]/5 text-[#1e3a6e] dark:text-blue-400' : 'bg-slate-50 text-slate-300'}`}>
                    <div className="flex items-center gap-4"><Smartphone size={20} /><span className="text-[10px] font-black uppercase tracking-widest">SMS Alerts</span></div>
                    {liveToken.notificationPreferences?.sms ? <CheckCircle2 size={16} /> : <X size={16} />}
                  </div>
                  <div className={`flex items-center justify-between p-6 rounded-3xl ${liveToken.notificationPreferences?.email ? 'bg-[#1e3a6e]/5 text-[#1e3a6e] dark:text-blue-400' : 'bg-slate-50 text-slate-300'}`}>
                    <div className="flex items-center gap-4"><Mail size={20} /><span className="text-[10px] font-black uppercase tracking-widest">Email Logs</span></div>
                    {liveToken.notificationPreferences?.email ? <CheckCircle2 size={16} /> : <X size={16} />}
                  </div>
                </div>
              </div>

              <div className="text-left">
                <h3 className="text-xs font-black text-[#1e3a6e] dark:text-white uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c8a227]" /> Activity Ledger
                </h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                  {(!liveToken.notifications || liveToken.notifications?.length === 0) ? (
                    <div className="text-center py-10 text-slate-300 font-bold uppercase text-[9px] tracking-widest">No Active Dispatch History</div>
                  ) : (
                    liveToken.notifications.map((n) => (
                      <div key={n.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-[#c8a227]/30 transition-all text-left">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[8px] font-black uppercase text-[#c8a227] tracking-widest">{n.type} • {n.channel}</span>
                          <span className="text-[8px] font-bold text-slate-400">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 italic">"{n.message}"</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <button onClick={() => { resetForm(); setActiveToken(null); setStep('HOME'); }}
              className="w-full py-8 bg-rose-600 hover:bg-rose-700 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.5em] shadow-2xl shadow-rose-600/20 active:scale-95 transition-all">
              Terminate Session
            </button>
          </div>
        </main>
      </div>
    );
  };

  return (
    <div className="min-h-screen font-sans selection:bg-[#c8a227] selection:text-[#1a1a1a]">
      {step === 'HOME' && renderHome()}
      {step === 'BOOK' && renderBook()}
      {step === 'LOOKUP' && renderLookup()}
      {step === 'TRACK' && renderTrack()}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
      `}</style>
    </div>
  );
};

export default CitizenPortal;

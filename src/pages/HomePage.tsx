import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { useTheme, Language } from '../context/ThemeContext';
import {
    Clock, MapPin, Phone, Globe, Sun, Moon, Contrast,
    ChevronRight, Ticket, ShieldCheck, Users, BarChart3,
    CheckCircle2, ArrowRight, Building2, Headphones, AlertCircle,
    CalendarCheck, Wifi, Star
} from 'lucide-react';

import { FlowingLines } from '../components/SharedUI';

// ─── Language labels ──────────────────────────────────────────────────────────
const LANG_OPTIONS: { code: Language; label: string; native: string }[] = [
    { code: 'EN', label: 'English', native: 'English' },
    { code: 'HI', label: 'Hindi', native: 'हिन्दी' },
    { code: 'TE', label: 'Telugu', native: 'తెలుగు' },
    { code: 'KN', label: 'Kannada', native: 'ಕನ್ನಡ' },
];

// ─── Translated strings ───────────────────────────────────────────────────────
const T: Record<Language, Record<string, string>> = {
    EN: {
        govName: 'Government of India',
        deptName: 'Department of Administrative Services',
        address: 'Block C, Civil Secretariat, New Delhi – 110001',
        phone: '+91-11-2338-4000',
        hours: 'Mon – Fri: 9:00 AM – 5:30 PM  |  Sat: 9:00 AM – 1:00 PM',
        headline: 'Smart Queue & Token Management System',
        subheadline: 'Reducing wait times. Improving citizen experience.',
        bookBtn: 'Book Token',
        trackBtn: 'Track Token',
        quickServices: 'Quick Services',
        stats1Label: 'Citizens Served Today',
        stats2Label: 'Avg. Wait Time',
        stats3Label: 'Active Counters',
        stats4Label: 'Satisfaction Rate',
        noticeBoardTitle: 'Notice Board',
        notice1: 'Office will remain closed on Feb 26 (National Holiday).',
        notice2: 'New biometric counters operational from March 01.',
        notice3: 'Online token booking now available 24/7.',
        footerRights: '© 2026 Government of India. All rights reserved.',
        footerDisclaimer: 'This is an official Government of India website.',
        serviceTitle: 'Available Services',
    },
    HI: {
        govName: 'भारत सरकार',
        deptName: 'प्रशासनिक सेवा विभाग',
        address: 'ब्लॉक सी, सिविल सचिवालय, नई दिल्ली – 110001',
        phone: '+91-11-2338-4000',
        hours: 'सोम – शुक्र: सुबह 9:00 – शाम 5:30  |  शनि: सुबह 9:00 – दोपहर 1:00',
        headline: 'स्मार्ट क्यू और टोकन प्रबंधन प्रणाली',
        subheadline: 'प्रतीक्षा समय कम करना। नागरिक अनुभव सुधारना।',
        bookBtn: 'टोकन बुक करें',
        trackBtn: 'टोकन ट्रैक करें',
        quickServices: 'त्वरित सेवाएं',
        stats1Label: 'आज सेवा किए गए नागरिक',
        stats2Label: 'औसत प्रतीक्षा समय',
        stats3Label: 'सक्रिय काउंटर',
        stats4Label: 'संतुष्टि दर',
        noticeBoardTitle: 'सूचना बोर्ड',
        notice1: '26 फरवरी (राष्ट्रीय अवकाश) को कार्यालय बंद रहेगा।',
        notice2: 'नए बायोमेट्रिक काउंटर 1 मार्च से चालू।',
        notice3: 'ऑनलाइन टोकन बुकिंग अब 24/7 उपलब्ध।',
        footerRights: '© 2026 भारत सरकार। सर्वाधिकार सुरक्षित।',
        footerDisclaimer: 'यह भारत सरकार की आधिकारिक वेबसाइट है।',
        serviceTitle: 'उपलब्ध सेवाएं',
    },
    TE: {
        govName: 'భారత ప్రభుత్వం',
        deptName: 'పరిపాలన సేవల విభాగం',
        address: 'బ్లాక్ సి, సివిల్ సెక్రటేరియట్, న్యూ ఢిల్లీ – 110001',
        phone: '+91-11-2338-4000',
        hours: 'సోమ – శుక్ర: 9:00 AM – 5:30 PM  |  శని: 9:00 AM – 1:00 PM',
        headline: 'స్మార్ట్ క్యూ & టోకెన్ మేనేజ్‌మెంట్ సిస్టమ్',
        subheadline: 'వేచి ఉండే సమయాన్ని తగ్గించడం. పౌర అనుభవాన్ని మెరుగుపరచడం.',
        bookBtn: 'టోకెన్ బుక్ చేయండి',
        trackBtn: 'టోకెన్ ట్రాక్ చేయండి',
        quickServices: 'త్వరిత సేవలు',
        stats1Label: 'నేడు సేవలందిన పౌరులు',
        stats2Label: 'సగటు వేచి ఉండే సమయం',
        stats3Label: 'యాక్టివ్ కౌంటర్లు',
        stats4Label: 'సంతృప్తి రేటు',
        noticeBoardTitle: 'నోటీసు బోర్డు',
        notice1: 'ఫిబ్రవరి 26 (జాతీయ సెలవు) కార్యాలయం మూసివేయబడుతుంది.',
        notice2: 'కొత్త బయోమెట్రిక్ కౌంటర్లు మార్చి 1 నుండి అందుబాటులో.',
        notice3: 'ఆన్‌లైన్ టోకెన్ బుకింగ్ ఇప్పుడు 24/7 అందుబాటులో.',
        footerRights: '© 2026 భారత ప్రభుత్వం. అన్ని హక్కులు రిజర్వ్ చేయబడ్డాయి.',
        footerDisclaimer: 'ఇది భారత ప్రభుత్వం యొక్క అధికారిక వెబ్‌సైట్.',
        serviceTitle: 'అందుబాటులో ఉన్న సేవలు',
    },
    KN: {
        govName: 'ಭಾರತ ಸರ್ಕಾರ',
        deptName: 'ಆಡಳಿತ ಸೇವೆಗಳ ಇಲಾಖೆ',
        address: 'ಬ್ಲಾಕ್ ಸಿ, ಸಿವಿಲ್ ಸೆಕ್ರೆಟೇರಿಯೆಟ್, ನವದೆಹಲಿ – 110001',
        phone: '+91-11-2338-4000',
        hours: 'ಸೋಮ – ಶುಕ್ರ: ಬೆ 9:00 – ಸಂ 5:30  |  ಶನಿ: ಬೆ 9:00 – ಮ 1:00',
        headline: 'ಸ್ಮಾರ್ಟ್ ಕ್ಯೂ ಮತ್ತು ಟೋಕನ್ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ',
        subheadline: 'ನಿರೀಕ್ಷಾ ಸಮಯ ಕಡಿಮೆ ಮಾಡುತ್ತಿದೆ. ನಾಗರಿಕ ಅನುಭವ ಸುಧಾರಿಸುತ್ತಿದೆ.',
        bookBtn: 'ಟೋಕನ್ ಬುಕ್ ಮಾಡಿ',
        trackBtn: 'ಟೋಕನ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
        quickServices: 'ತ್ವರಿತ ಸೇವೆಗಳು',
        stats1Label: 'ಇಂದು ಸೇವೆ ಪಡೆದ ನಾಗರಿಕರು',
        stats2Label: 'ಸರಾಸರಿ ನಿರೀಕ್ಷಾ ಸಮಯ',
        stats3Label: 'ಸಕ್ರಿಯ ಕೌಂಟರ್‌ಗಳು',
        stats4Label: 'ತೃಪ್ತಿ ದರ',
        noticeBoardTitle: 'ಸೂಚನಾ ಫಲಕ',
        notice1: 'ಫೆಬ್ರವರಿ 26 (ರಾಷ್ಟ್ರೀಯ ರಜೆ) ಕಚೇರಿ ಮುಚ್ಚಿರುತ್ತದೆ.',
        notice2: 'ಹೊಸ ಬಯೋಮೆಟ್ರಿಕ್ ಕೌಂಟರ್‌ಗಳು ಮಾರ್ಚ್ 1 ರಿಂದ ಲಭ್ಯ.',
        notice3: 'ಆನ್‌ಲೈನ್ ಟೋಕನ್ ಬುಕಿಂಗ್ ಈಗ 24/7 ಲಭ್ಯ.',
        footerRights: '© 2026 ಭಾರತ ಸರ್ಕಾರ. ಎಲ್ಲ ಹಕ್ಕುಗಳು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
        footerDisclaimer: 'ಇದು ಭಾರತ ಸರ್ಕಾರದ ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್.',
        serviceTitle: 'ಲಭ್ಯವಿರುವ ಸೇವೆಗಳು',
    },
};

// ─── Government Emblem SVG (Ashoka Chakra / Lion Capital inspired) ─────────────
const GovEmblem: React.FC<{ size?: number }> = ({ size = 56 }) => (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Government Emblem">
        {/* Outer ring */}
        <circle cx="40" cy="40" r="38" stroke="#1e3a6e" strokeWidth="2.5" fill="none" />
        <circle cx="40" cy="40" r="32" stroke="#1e3a6e" strokeWidth="1" fill="none" strokeDasharray="3 3" />
        {/* Ashoka wheel spokes */}
        {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24;
            const rad = (angle * Math.PI) / 180;
            const x1 = 40 + 10 * Math.cos(rad);
            const y1 = 40 + 10 * Math.sin(rad);
            const x2 = 40 + 26 * Math.cos(rad);
            const y2 = 40 + 26 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1e3a6e" strokeWidth="1.2" />;
        })}
        {/* Hub */}
        <circle cx="40" cy="40" r="10" stroke="#1e3a6e" strokeWidth="2" fill="#f0f4ff" />
        <circle cx="40" cy="40" r="4" fill="#1e3a6e" />
        {/* Rim */}
        <circle cx="40" cy="40" r="26" stroke="#1e3a6e" strokeWidth="2" fill="none" />
        {/* Lions base bar */}
        <rect x="26" y="60" width="28" height="4" rx="2" fill="#1e3a6e" />
        {/* Simple stylised lion silhouettes */}
        <ellipse cx="34" cy="56" rx="5" ry="4" fill="#1e3a6e" />
        <ellipse cx="46" cy="56" rx="5" ry="4" fill="#1e3a6e" />
        <rect x="31" y="52" width="4" height="5" rx="1" fill="#1e3a6e" />
        <rect x="45" y="52" width="4" height="5" rx="1" fill="#1e3a6e" />
        {/* Crown dots */}
        {[33, 37, 40, 43, 47].map((cx, i) => (
            <circle key={i} cx={cx} cy="49" r="1.2" fill="#c8a227" />
        ))}
        {/* Gold accent ring */}
        <circle cx="40" cy="40" r="38" stroke="#c8a227" strokeWidth="1" fill="none" opacity="0.5" />
    </svg>
);

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ value: string; label: string; icon: React.ReactNode; accent: string }> = ({ value, label, icon, accent }) => (
    <div className={`flex flex-col items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm text-center transition-all hover:shadow-md hover:-translate-y-0.5`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${accent}`}>
            {icon}
        </div>
        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide leading-tight">{label}</p>
    </div>
);
// Service emoji map for visual icons
const SERVICE_EMOJI: Record<string, string> = {
    'aadhaar': '🪪', 'revenue': '🏠', 'vehicle': '🚗', 'cert': '📑',
    'health': '🏥', 'pension': '📋', 'education': '🎓', 'legal': '🏛️',
    'bill': '💳', 'comp': '📢', 'appr': '✅',
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { state } = useQueue();
    const { isDarkMode, toggleDarkMode, isHighContrast, toggleHighContrast, language, setLanguage } = useTheme();

    const [now, setNow] = useState(new Date());
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [tickerIdx, setTickerIdx] = useState(0);

    const t = T[language];

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Notice ticker
    const notices = [t.notice1, t.notice2, t.notice3];
    useEffect(() => {
        const timer = setInterval(() => setTickerIdx(i => (i + 1) % notices.length), 5000);
        return () => clearInterval(timer);
    }, [notices.length]);

    const formatTime = (d: Date) =>
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const formatDate = (d: Date) =>
        d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const isOfficeOpen = () => {
        const day = now.getDay(); // 0=Sun,6=Sat
        const h = now.getHours();
        const m = now.getMinutes();
        const mins = h * 60 + m;
        if (day === 0) return false;
        if (day >= 1 && day <= 5) return mins >= 540 && mins < 1050; // 9am–5:30pm
        if (day === 6) return mins >= 540 && mins < 780; // 9am–1pm
        return false;
    };
    const open = isOfficeOpen();

    return (
        <div id="home" className={`min-h-screen flex flex-col font-sans ${isHighContrast ? 'hc-mode' : ''}`}
            style={isHighContrast ? { filter: 'contrast(1.4) saturate(0.5)' } : {}}>

            {/* ═══════════════════════════════════════════════════════════════════
          TOP GOVERNMENT INFO BAR
      ══════════════════════════════════════════════════════════════════════ */}
            <div className="bg-[#1e3a6e] text-white text-xs">
                {/* Upper tier – emblem + office info + clock */}
                <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 flex flex-wrap gap-y-3 items-center justify-between">

                    {/* Left: Emblem + Identity */}
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 bg-white/10 p-1.5 rounded-xl border border-white/20">
                            <GovEmblem size={52} />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200 leading-none mb-0.5">
                                {t.govName}
                            </p>
                            <h1 className="text-sm md:text-base font-black tracking-tight text-white leading-tight">
                                {t.deptName}
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1.5">
                                <span className="flex items-center gap-1 text-blue-200/80 text-[10px] font-medium">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    {t.address}
                                </span>
                                <span className="flex items-center gap-1 text-blue-200/80 text-[10px] font-medium">
                                    <Phone className="w-3 h-3 flex-shrink-0" />
                                    {t.phone}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Clock + Status + Controls */}
                    <div className="flex items-center gap-3 ml-auto">
                        {/* Working Hours badge */}
                        <div className="hidden lg:flex flex-col items-end text-right">
                            <span className="flex items-center gap-1.5 text-blue-200/80 text-[10px] font-medium mb-0.5">
                                <Clock className="w-3 h-3" />
                                {t.hours}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${open ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-red-500/20 text-red-300 border border-red-400/30'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                                {open ? 'Office Open' : 'Office Closed'}
                            </span>
                        </div>

                        <div className="hidden md:block w-px h-8 bg-white/20" />

                        {/* Live date & time */}
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] text-blue-200/70 font-medium">{formatDate(now)}</p>
                            <p className="text-sm font-mono font-black text-white tracking-widest">{formatTime(now)}</p>
                        </div>

                        <div className="w-px h-8 bg-white/20" />

                        {/* Language switcher */}
                        <div className="relative">
                            <button
                                id="lang-switcher-btn"
                                onClick={() => setLangMenuOpen(o => !o)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-[11px] font-bold uppercase tracking-wide"
                                aria-haspopup="listbox"
                                aria-expanded={langMenuOpen}
                            >
                                <Globe className="w-3.5 h-3.5" />
                                {language}
                                <svg className={`w-3 h-3 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                            </button>
                            {langMenuOpen && (
                                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
                                    role="listbox">
                                    {LANG_OPTIONS.map(l => (
                                        <button
                                            key={l.code}
                                            role="option"
                                            aria-selected={language === l.code}
                                            onClick={() => { setLanguage(l.code); setLangMenuOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors ${language === l.code ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                        >
                                            <span>{l.native}</span>
                                            {language === l.code && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* High-contrast toggle */}
                        <button
                            id="high-contrast-toggle"
                            onClick={toggleHighContrast}
                            title="Toggle High Contrast"
                            className={`p-1.5 rounded-lg border transition-all ${isHighContrast ? 'bg-yellow-400 text-slate-900 border-yellow-300' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                            aria-pressed={isHighContrast}
                            aria-label="High Contrast Mode"
                        >
                            <Contrast className="w-4 h-4" />
                        </button>

                        {/* Dark mode toggle */}
                        <button
                            id="dark-mode-toggle-header"
                            onClick={toggleDarkMode}
                            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
                            aria-label="Toggle Dark Mode"
                        >
                            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Notice ticker bar */}
                <div className="bg-[#c8a227] text-[#1e1e1e] py-1.5 px-4">
                    <div className="max-w-7xl mx-auto flex items-center gap-3">
                        <span className="flex-shrink-0 inline-flex items-center gap-1.5 bg-[#1e1e1e]/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <AlertCircle className="w-3 h-3" />
                            Notice
                        </span>
                        <div className="overflow-hidden flex-1">
                            <p
                                key={tickerIdx}
                                className="text-[11px] font-semibold tracking-wide animate-in fade-in slide-in-from-right-4 duration-500"
                            >
                                {notices[tickerIdx]}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
          SECONDARY NAV STRIP
      ══════════════════════════════════════════════════════════════════════ */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-12 flex items-center justify-between">
                    <nav className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest overflow-x-auto no-scrollbar">
                        {[
                            { label: 'Home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                            { label: 'Services', action: () => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) },
                            { label: 'Infrastructure', action: () => document.getElementById('infrastructure')?.scrollIntoView({ behavior: 'smooth' }) },
                            { label: 'Help', action: () => navigate('/help') },
                            { label: 'About', action: () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) },
                        ].map(item => (
                            <button
                                key={item.label}
                                onClick={item.action}
                                className="px-3 py-1 rounded text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all whitespace-nowrap"
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 tracking-widest">
                        <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="hidden sm:inline">SYSTEM ONLINE</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto no-scrollbar relative bg-slate-50 dark:bg-slate-950">
                <section className="relative bg-[#0d2550] overflow-hidden min-h-[500px] flex items-center">
                    <FlowingLines />
                    <div className="absolute inset-0 opacity-[0.04]" aria-hidden>
                        <svg width="100%" height="100%"><defs><pattern id="cp-grid-hero" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#cp-grid-hero)" /></svg>
                    </div>

                    {/* Ashoka wheel watermark */}
                    <div className="absolute right-[-80px] top-1/2 -translate-y-1/2 opacity-[0.035] pointer-events-none hidden lg:block" aria-hidden="true">
                        <GovEmblem size={520} />
                    </div>

                    {/* Ambient Blobs */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 dark:bg-blue-600/20 rounded-full mix-blend-multiply filter blur-[80px] animate-blob"></div>
                        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/20 dark:bg-purple-600/20 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-2000"></div>
                        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-cyan-500/20 dark:bg-cyan-600/20 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-4000"></div>
                    </div>

                    <div className="relative w-full max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 lg:py-28 flex items-center justify-between">
                        <div className="max-w-3xl relative z-10 animate-float">
                            {/* Glass Container */}
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-12 rounded-[2rem] shadow-2xl relative overflow-hidden">
                                {/* Decorative line */}
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#c8a227] to-transparent"></div>

                                {/* Official badge */}
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/40 border border-[#c8a227]/30 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-8 backdrop-blur-md shadow-[0_0_15px_rgba(200,162,39,0.2)]">
                                    <ShieldCheck className="w-4 h-4 text-[#c8a227]" />
                                    Official Digital Service Platform
                                </div>

                                {/* Main headline */}
                                <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-300 leading-[1.1] tracking-tight mb-6">
                                    {t.headline}
                                </h2>

                                {/* Subheadline */}
                                <p className="text-lg md:text-xl text-blue-100/90 font-medium mb-12 max-w-2xl leading-relaxed">
                                    {t.subheadline}
                                </p>

                                {/* Primary action buttons */}
                                <div className="flex flex-wrap gap-5" id="cta-buttons">
                                    <button
                                        id="login-btn"
                                        onClick={() => navigate('/login?role=CITIZEN')}
                                        className="relative group overflow-hidden flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#c8a227] to-[#dbb52e] text-[#1a1a1a] font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(200,162,39,0.3)] hover:shadow-[0_0_40px_rgba(200,162,39,0.5)] hover:-translate-y-1 active:scale-95 transition-all duration-300"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                        <ShieldCheck className="w-5 h-5 flex-shrink-0 relative z-10" />
                                        <span className="relative z-10">Portal Log In</span>
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                                    </button>

                                    <button
                                        id="signup-btn"
                                        onClick={() => navigate('/signup?role=CITIZEN')}
                                        className="group flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black text-sm uppercase tracking-widest rounded-xl border border-white/20 hover:border-white/40 backdrop-blur-md hover:-translate-y-1 active:scale-95 transition-all duration-300"
                                    >
                                        <ArrowRight className="w-5 h-5 flex-shrink-0" />
                                        Register Account
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>

                                {/* Trust signals */}
                                <div className="mt-14 pt-8 border-t border-white/10 flex flex-wrap items-center gap-x-8 gap-y-4">
                                    {[
                                        { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, text: 'Govt. Verified' },
                                        { icon: <CalendarCheck className="w-4 h-4 text-blue-400" />, text: '24×7 Access' },
                                        { icon: <Wifi className="w-4 h-4 text-amber-400" />, text: 'Live Tracking' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-white/70 uppercase tracking-[0.15em]">
                                            <div className="p-1.5 rounded-md bg-white/5 border border-white/5">{item.icon}</div>
                                            {item.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hero bottom divider wave */}
                    <div className="absolute bottom-[-1px] left-0 w-full h-10 overflow-hidden z-10">
                        <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="w-full h-full" fill="none">
                            <path d="M0 40 L0 20 Q360 0 720 20 Q1080 40 1440 20 L1440 40 Z"
                                className="fill-slate-50 dark:fill-slate-950" />
                        </svg>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════
                LIVE STATS STRIP
            ══════════════════════════════════════════════════════════════════════ */}
                <section className="bg-slate-50 dark:bg-slate-950 py-10">
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                value="1,284"
                                label={t.stats1Label}
                                icon={<Users className="w-5 h-5 text-blue-700 dark:text-blue-400" />}
                                accent="bg-blue-100 dark:bg-blue-900/30"
                            />
                            <StatCard
                                value="~12 min"
                                label={t.stats2Label}
                                icon={<Clock className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />}
                                accent="bg-emerald-100 dark:bg-emerald-900/30"
                            />
                            <StatCard
                                value="18"
                                label={t.stats3Label}
                                icon={<BarChart3 className="w-5 h-5 text-violet-700 dark:text-violet-400" />}
                                accent="bg-violet-100 dark:bg-violet-900/30"
                            />
                            <StatCard
                                value="4.7 / 5"
                                label={t.stats4Label}
                                icon={<Star className="w-5 h-5 text-amber-700 dark:text-amber-400" />}
                                accent="bg-amber-100 dark:bg-amber-900/30"
                            />
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════
                QUICK SERVICES
            ══════════════════════════════════════════════════════════════════════ */}
                <section id="services" className="bg-white dark:bg-slate-900 py-14 border-t border-slate-100 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-1">Administrative Scope</p>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Active Department Channels</h3>
                            </div>
                            <button
                                onClick={() => navigate('/login?role=CITIZEN')}
                                className="hidden sm:flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm font-bold hover:underline"
                            >
                                Register to Access <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 opacity-80 pointer-events-none">
                            {state.services.map((s) => (
                                <div
                                    key={s.id}
                                    className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center"
                                >
                                    <span className="text-3xl leading-none grayscale">{SERVICE_EMOJI[s.id] || '🏛️'}</span>
                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-tight">{s.name}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-center mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Login required for secure service interaction</p>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════
                HOW IT WORKS
            ══════════════════════════════════════════════════════════════════════ */}
                <section id="about" className="bg-slate-50 dark:bg-slate-950 py-14 border-t border-slate-100 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="text-center mb-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-2">How It Works</p>
                            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Simple. Fast. Official.</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                            {[
                                {
                                    step: '01',
                                    icon: <Ticket className="w-7 h-7 text-blue-600 dark:text-blue-400" />,
                                    title: 'Book Your Token',
                                    desc: 'Select your department and service. Enter basic details to generate a secure digital token instantly.',
                                    gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
                                    border: 'border-blue-100 dark:border-blue-900/30',
                                },
                                {
                                    step: '02',
                                    icon: <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400" />,
                                    title: 'Wait Comfortably',
                                    desc: 'Track your position in real time on your phone. Receive SMS/email alerts before your turn.',
                                    gradient: 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
                                    border: 'border-amber-100 dark:border-amber-900/30',
                                },
                                {
                                    step: '03',
                                    icon: <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />,
                                    title: 'Get Served',
                                    desc: 'Walk in when called. The officer scans your QR code and your service begins immediately.',
                                    gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20',
                                    border: 'border-emerald-100 dark:border-emerald-900/30',
                                },
                            ].map((item, i) => (
                                <div key={i} className={`relative p-8 rounded-2xl border ${item.border} bg-gradient-to-br ${item.gradient} flex flex-col gap-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group`}>
                                    <div className="absolute top-5 right-5 text-[10px] font-black text-slate-300 dark:text-slate-700 tracking-[0.2em]">STEP {item.step}</div>
                                    <div className="w-14 h-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{item.title}</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Detailed About Content - Full Width */}
                        <div className="bg-[#0a1931] dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-16 border border-white/5 shadow-2xl overflow-hidden relative group">
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                <GovEmblem size={320} />
                            </div>
                            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full" />

                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                                <div className="lg:col-span-7">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                                        Mission Statement
                                    </div>
                                    <h4 className="text-3xl md:text-5xl font-black text-white mb-8 leading-[1.15] tracking-tight">
                                        Empowering Citizens through <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400">Smart Technology</span>
                                    </h4>
                                    <div className="space-y-6 text-lg text-blue-100/70 font-medium">
                                        <p className="leading-relaxed">
                                            CivicFlow is a state-of-the-art <strong>Smart Queue Management System</strong> designed to revolutionize how citizens interact with government services. Our mission is to eliminate long waiting lines and bring transparency to public service delivery.
                                        </p>
                                        <p className="leading-relaxed">
                                            By providing real-time tracking, digital token generation, and automated notifications, we ensure that your time is respected. Whether you are applying for an Aadhaar update, a revenue certificate, or pension services, CivicFlow makes the process seamless and efficient.
                                        </p>
                                    </div>

                                    <div className="mt-12 flex flex-wrap gap-4">
                                        {[
                                            { icon: <ShieldCheck className="w-4 h-4" />, text: 'Transparency', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
                                            { icon: <Clock className="w-4 h-4" />, text: 'Efficiency', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
                                            { icon: <Users className="w-4 h-4" />, text: 'Accessibility', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' }
                                        ].map((badge, idx) => (
                                            <div key={idx} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl ${badge.bg} border ${badge.border} text-[11px] font-black ${badge.color} uppercase tracking-[0.15em] shadow-sm`}>
                                                {badge.icon} {badge.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-5 grid grid-cols-2 gap-5 relative">
                                    <div className="space-y-5 lg:mt-10">
                                        <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 text-center transform hover:scale-105 transition-all duration-300">
                                            <p className="text-4xl font-black text-blue-400 mb-2">95%</p>
                                            <p className="text-[10px] font-black text-blue-200/40 uppercase tracking-[0.2em]">Wait Reduction</p>
                                        </div>
                                        <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 text-center transform hover:scale-105 transition-all duration-300">
                                            <p className="text-4xl font-black text-amber-400 mb-2">1M+</p>
                                            <p className="text-[10px] font-black text-amber-200/40 uppercase tracking-[0.2em]">Tokens Issued</p>
                                        </div>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 text-center transform hover:scale-105 transition-all duration-300">
                                            <p className="text-4xl font-black text-emerald-400 mb-2">50+</p>
                                            <p className="text-[10px] font-black text-emerald-200/40 uppercase tracking-[0.2em]">Services Live</p>
                                        </div>
                                        <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 text-center transform hover:scale-105 transition-all duration-300">
                                            <p className="text-4xl font-black text-violet-400 mb-2">4.8</p>
                                            <p className="text-[10px] font-black text-violet-200/40 uppercase tracking-[0.2em]">User Rating</p>
                                        </div>
                                    </div>
                                    {/* Central accent */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-blue-500/20 blur-[40px] rounded-full pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════
                NOTICE BOARD & HELP
            ══════════════════════════════════════════════════════════════════════ */}
                {/* Core Capabilities / Advanced Features */}
                <section className="bg-white dark:bg-slate-900 py-24 border-t border-slate-100 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400 mb-2">Technical Zenith</p>
                                    <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-[1.1]">The Engine Behind <br /><span className="text-[#c8a227]">Smart Governance</span></h3>
                                </div>
                                <div className="space-y-6">
                                    {[
                                        { title: 'AI-Enhanced Prediction', desc: 'Our proprietary ML models analyze historical flux to provide accuracy within ±2 minutes of actual wait times.', icon: <BarChart3 className="w-5 h-5" /> },
                                        { title: 'Encrypted Biometric Handshake', desc: 'Securely verify identity through integrated Aadhaar and Bio-metric scanning protocols.', icon: <ShieldCheck className="w-5 h-5" /> },
                                        { title: 'Omnichannel Alerts', desc: 'Stay updated via SMS, Email, and WhatsApp notifications as your turn approaches.', icon: <Headphones className="w-5 h-5" /> }
                                    ].map((feat, i) => (
                                        <div key={i} className="flex gap-5 group">
                                            <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-[#1e3a6e] group-hover:text-white transition-all duration-300">
                                                {feat.icon}
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">{feat.title}</h5>
                                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <div className="aspect-square bg-gradient-to-br from-blue-600/10 to-[#c8a227]/10 rounded-[4rem] absolute inset-0 blur-3xl animate-pulse" />
                                <div className="relative bg-[#0d2550] rounded-[3rem] p-12 border border-white/10 shadow-3xl overflow-hidden">
                                    <FlowingLines />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 bg-[#c8a227] rounded-xl flex items-center justify-center text-[#1a1a1a]">
                                                <Star className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200/50">System Rating</p>
                                                <p className="text-2xl font-black text-white">4.92/5.0 <span className="text-xs opacity-40 font-medium">Across 1M+ Sessions</span></p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#c8a227] w-[95%] rounded-full shadow-[0_0_15px_rgba(200,162,39,0.5)]" />
                                            </div>
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#c8a227]">
                                                <span>Queue Efficiency</span>
                                                <span>95.4%</span>
                                            </div>
                                        </div>
                                        <div className="mt-12 grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                                                <p className="text-2xl font-black text-white">100%</p>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-blue-300 mt-1">Paperless Operations</p>
                                            </div>
                                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                                                <p className="text-2xl font-black text-white">&lt; 5m</p>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-blue-300 mt-1">First Response Time</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="help" className="bg-white dark:bg-slate-900 py-14 border-t border-slate-100 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Notice Board */}
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 bg-[#1e3a6e] rounded-lg flex items-center justify-center">
                                    <AlertCircle className="w-4 h-4 text-white" />
                                </div>
                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.noticeBoardTitle}</h4>
                            </div>
                            <ul className="space-y-3">
                                {notices.map((n, i) => (
                                    <li key={i} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                                        <span className="mt-0.5 flex-shrink-0 w-2 h-2 rounded-full bg-[#c8a227]" />
                                        {n}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Help / Contact */}
                        <div className="bg-gradient-to-br from-[#0d2550] to-[#1e3a6e] rounded-xl p-7 flex flex-col justify-between text-white">
                            <div>
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4 border border-white/20">
                                    <Headphones className="w-5 h-5 text-white" />
                                </div>
                                <h4 className="text-xl font-black mb-2">Need Assistance?</h4>
                                <p className="text-sm text-blue-200/80 mb-6 leading-relaxed">
                                    Our citizen support team is available during office hours. You can also visit the Help Centre for FAQs, token lookup, and guided assistance.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    id="go-to-help-btn"
                                    onClick={() => navigate('/help')}
                                    className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#1e3a6e] font-black text-xs uppercase tracking-widest rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    <Building2 className="w-4 h-4" /> Help Centre
                                </button>
                                <a
                                    href="tel:+911123384000"
                                    className="flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 font-black text-xs uppercase tracking-widest rounded-lg transition-colors"
                                >
                                    <Phone className="w-4 h-4" /> Call Helpline
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Architecture / Institutional Trust Section */}
                <section id="infrastructure" className="bg-slate-50 dark:bg-slate-950 py-24 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                        <div className="flex flex-col items-center text-center mb-20">
                            <div className="px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                                Trusted Infrastructure
                            </div>
                            <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Built for National Scale</h3>
                            <div className="w-24 h-1.5 bg-[#c8a227] mt-6 rounded-full" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { icon: <ShieldCheck className="w-10 h-10" />, title: 'ISO 27001 Certified', desc: 'Enterprise-grade encryption for all citizen data and biometric records.' },
                                { icon: <Wifi className="w-10 h-10" />, title: 'Resilient Uptime', desc: 'Distributed cloud architecture ensuring 99.99% system availability.' },
                                { icon: <Headphones className="w-10 h-10" />, title: 'Multilingual Core', desc: 'Support for 22 official languages to ensure pan-India accessibility.' },
                                { icon: <Building2 className="w-10 h-10" />, title: 'Realtime Sync', desc: 'Seamless integration between central repositories and local offices.' }
                            ].map((feature, i) => (
                                <div key={i} className="group p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] hover:border-[#c8a227] transition-all duration-500 shadow-sm hover:shadow-2xl">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-[#1e3a6e] dark:text-blue-400 mb-8 group-hover:bg-[#1e3a6e] group-hover:text-white transition-all duration-300 transform group-hover:-rotate-12">
                                        {feature.icon}
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">{feature.title}</h4>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════════ */}
            <footer className="bg-[#0d1f3c] dark:bg-[#060d1e] text-white py-8">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <GovEmblem size={32} />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#c8a227]">{t.govName}</p>
                                <p className="text-[10px] font-semibold text-white/50 mt-0.5">{t.footerDisclaimer}</p>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-[10px] font-semibold text-white/40">{t.footerRights}</p>
                            <div className="flex items-center justify-center md:justify-end gap-4 mt-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                                <a href="#" className="hover:text-white/70 transition-colors">Privacy Policy</a>
                                <span>·</span>
                                <a href="#" className="hover:text-white/70 transition-colors">Terms of Use</a>
                                <span>·</span>
                                <a href="#" className="hover:text-white/70 transition-colors">Accessibility</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;

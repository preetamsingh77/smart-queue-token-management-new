import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQueue } from '../context/QueueContext';
import { useToast } from '../context/ToastContext';
import { Token, TokenStatus, Counter } from '../types';
import {
    Monitor, SkipForward, CheckCircle2, Volume2, VolumeX,
    RefreshCw, Clock, Users, Zap, ShieldCheck,
    PhoneCall, Activity, Timer, Star, ArrowLeft
} from 'lucide-react';
import { FlowingLines, InstitutionalBranding } from '../components/SharedUI';
import jsQR from 'jsqr';

// ── Utility: Robust Speech Synthesis ─────────
let voicesCache: SpeechSynthesisVoice[] = [];
let persistentAudioCtx: AudioContext | null = null;

const getAudioContext = () => {
    if (persistentAudioCtx) return persistentAudioCtx;
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    persistentAudioCtx = new AudioContextClass();
    return persistentAudioCtx;
};

const playWakeUpChime = async () => {
    try {
        const audioCtx = getAudioContext();
        if (!audioCtx) return;

        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Professional high-pitch chime

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.05); // Rapid fade in
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);     // Rapid fade out

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);

        // Give the system a brief moment to settle
        return new Promise(resolve => setTimeout(resolve, 350));
    } catch (e) {
        console.warn('Audio wake-up failed', e);
    }
};


function speak(text: string, lang: string = 'en-IN') {
    if (!('speechSynthesis' in window)) return;

    // 1. Clear previous speech and ensure engine is ready
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
    }

    // 2. Play Audio Context Wake-up chime asynchronously
    playWakeUpChime();

    // Ensure voices are loaded synchronously
    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) voices = voicesCache; // Fallback to cache if empty
    else voicesCache = voices;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Prefer high-quality voices
    const preferred = voices.find(v =>
        (v.lang.startsWith('en') || v.lang.includes(lang)) &&
        (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Natural'))
    );

    if (preferred) utterance.voice = preferred;

    // 3. Trigger speech with slight delay (fixes Chrome cancel() bug)
    setTimeout(() => {
        window.speechSynthesis.speak(utterance);
    }, 250);
}

function buildAnnouncement(token: Token, counterName: string): string {
    const priorityPrefix = token.priorityLevel === 'EMERGENCY'
        ? 'Attention. Urgent Priority Signal. '
        : token.isPriority
            ? 'Attention. High Priority. '
            : '';
    return `${priorityPrefix}Token Identification Number ${token.tokenNumber}. Citizen ${token.citizenName}, please report to ${counterName} for processing.`;
}

// ─────────────────────────────────────────────
//  Timer hook for elapsed time
// ─────────────────────────────────────────────
function useTimer(startTime?: number, isCountdown: boolean = false) {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (!startTime) { setSeconds(0); return; }
        const tick = () => {
            const diff = isCountdown
                ? Math.max(0, startTime - Date.now())
                : Math.max(0, Date.now() - startTime);
            setSeconds(Math.floor(diff / 1000));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [startTime, isCountdown]);

    const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return hh !== '00' ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
}

const OfficerDashboard: React.FC = () => {
    const {
        state,
        callNext,
        completeCurrent,
        skipToken,
        transferToken,
        sendNotification,
        serveToken,
    } = useQueue();

    const { showToast } = useToast();

    // Counter selection
    const [selectedCounterId, setSelectedCounterId] = useState<number | null>(null);
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
    const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
        return localStorage.getItem('civicflow_audio_enabled') === 'true';
    });
    const [isCalling, setIsCalling] = useState(false);
    const [skipModalOpen, setSkipModalOpen] = useState(false);
    const [notifyModalOpen, setNotifyModalOpen] = useState(false);
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<'SKIP' | 'TRANSFER' | 'NOTIFY' | null>(null);
    const [skipReason, setSkipReason] = useState('');
    const [recentlyCalledId, setRecentlyCalledId] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(true);
    const [showResolveSuccess, setShowResolveSuccess] = useState(false);
    const [audioCtxStatus, setAudioCtxStatus] = useState<AudioContextState | 'none'>('none');
    const [showWakeOverlay, setShowWakeOverlay] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Update session timer on counter selection
    useEffect(() => {
        if (selectedCounterId && !sessionStartTime) {
            setSessionStartTime(Date.now());
        } else if (!selectedCounterId) {
            setSessionStartTime(null);
        }
    }, [selectedCounterId, sessionStartTime]);

    // Audio Persistence & Initialization
    useEffect(() => {
        localStorage.setItem('civicflow_audio_enabled', audioEnabled.toString());

        const checkCtx = () => {
            const ctx = getAudioContext();
            if (ctx) {
                setAudioCtxStatus(ctx.state);
                if (ctx.state === 'suspended' && audioEnabled) {
                    setShowWakeOverlay(true);
                }
            }
        };

        checkCtx();
        const interval = setInterval(checkCtx, 2000);

        // Pre-load voices & Warm up
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Reset engine on mount
            const load = () => {
                window.speechSynthesis.getVoices();
                if (audioEnabled) {
                    const s = new SpeechSynthesisUtterance("");
                    s.volume = 0;
                    window.speechSynthesis.speak(s);
                }
            };
            load();
            window.speechSynthesis.onvoiceschanged = load;
        }

        return () => clearInterval(interval);
    }, [audioEnabled]);

    const handleWakeSystem = async () => {
        await playWakeUpChime();
        const ctx = getAudioContext();
        if (ctx) setAudioCtxStatus(ctx.state);
        setShowWakeOverlay(false);
        showToast("Audio Engine Synchronized", "success");
    };

    const handleTestAudio = () => {
        if (!audioEnabled) {
            showToast("Enable Audio First", "warning");
            return;
        }
        speak("Audio system test. Protocol established and operating within nominal parameters.");
        showToast("Test Transmission Sent", "info");
    };

    const selectedCounter: Counter | null = state.counters.find((c: Counter) => c.id === selectedCounterId) ?? null;
    const currentToken = selectedCounter?.currentTokenId
        ? state.tokens.find((t: Token) => t.id === selectedCounter.currentTokenId) ?? null
        : null;

    const waitingQueue = selectedCounter
        ? state.tokens
            .filter((t: Token) =>
                (t.status === TokenStatus.WAITING || t.status === TokenStatus.CHECKED_IN) &&
                (selectedCounter.assignedServices.includes(t.serviceCategory) ||
                    selectedCounter.assignedServices.includes(t.serviceType))
            )
            .sort((a: Token, b: Token) => {
                if ((a.isPriority ? 1 : 0) !== (b.isPriority ? 1 : 0)) return (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0);
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            })
        : [];

    const skippedQueue = selectedCounter
        ? state.tokens
            .filter((t: Token) =>
                (t.status === TokenStatus.SKIPPED || (t.status === TokenStatus.CANCELLED && (t.skipCount || 0) > 0)) &&
                (selectedCounter.assignedServices.includes(t.serviceCategory) ||
                    selectedCounter.assignedServices.includes(t.serviceType))
            )
            .sort((a: Token, b: Token) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [];

    const elapsedTime = useTimer(currentToken?.serviceStartTime);
    const sessionTime = useTimer(sessionStartTime || undefined);

    // ── Activate Specific Token (QR/Manual) ──────
    const handleActivateToken = useCallback(async (tokenOrId: Token | string) => {
        if (!selectedCounterId) return;
        const tokenId = typeof tokenOrId === 'string' ? tokenOrId : tokenOrId.id;
        const token = typeof tokenOrId === 'string' ? state.tokens.find(t => t.id === tokenId) : tokenOrId;

        if (!token) {
            showToast('Logic Error: Token not found in matrix.', 'error');
            return;
        }

        // Security: Verify service eligibility for this station
        const isEligible = selectedCounter?.assignedServices.includes(token.serviceCategory) ||
            selectedCounter?.assignedServices.includes(token.serviceType);

        if (!isEligible) {
            showToast(`PROTOCOL MISMATCH: Token ${token.tokenNumber} belongs to ${token.serviceCategory}. This station is authorized only for ${selectedCounter?.assignedServices.join(', ')}.`, 'error');
            return;
        }

        setIsCalling(true);
        try {
            if (audioEnabled && 'speechSynthesis' in window) {
                const s = new SpeechSynthesisUtterance('');
                s.volume = 0;
                window.speechSynthesis.speak(s);
                window.speechSynthesis.resume(); // Refresh user gesture context
            }
            const success = await serveToken(tokenId, selectedCounterId);
            if (success) {
                setRecentlyCalledId(tokenId);
                if (audioEnabled) {
                    speak(buildAnnouncement(token, selectedCounter?.name ?? `Station ${selectedCounterId}`));
                }
                const msg = `Your turn: ${token.tokenNumber}. Please proceed to ${selectedCounter?.name || 'Assigned Station'}.`;
                await sendNotification(token.id, msg, 'APP');
                showToast(`Activated: ${token.tokenNumber}`, 'success');
                setTimeout(() => setRecentlyCalledId(null), 4000);
            }
        } finally {
            setIsCalling(false);
        }
    }, [selectedCounterId, state.tokens, selectedCounter, serveToken, audioEnabled, sendNotification, showToast]);

    // ── Call next token ──────────────────────────
    const handleCallNext = useCallback(async () => {
        if (!selectedCounterId) return;
        setIsCalling(true);
        try {
            if (audioEnabled && 'speechSynthesis' in window) {
                const s = new SpeechSynthesisUtterance('');
                s.volume = 0;
                window.speechSynthesis.speak(s);
                window.speechSynthesis.resume(); // Refresh user gesture context immediately
            }
            const token = await callNext(selectedCounterId);
            if (token) {
                setRecentlyCalledId(token.id);
                if (audioEnabled) {
                    speak(buildAnnouncement(token, selectedCounter?.name ?? `Counter ${selectedCounterId}`));
                }
                const msg = `Attention: ${token.citizenName}, please proceed to ${selectedCounter?.name || 'Assigned Station'} for service.`;
                await sendNotification(token.id, msg, 'APP');
                showToast(`Called: ${token.tokenNumber}`, 'success');
                setTimeout(() => setRecentlyCalledId(null), 4000);
            } else {
                showToast('No more tokens in queue.', 'info');
            }
        } finally {
            setIsCalling(false);
        }
    }, [selectedCounterId, callNext, audioEnabled, selectedCounter, showToast]);

    // ── Complete service ─────────────────────────
    const handleComplete = async () => {
        if (!selectedCounterId) return;
        setShowResolveSuccess(true);

        // Wait for visual confirmation before updating state
        setTimeout(async () => {
            await completeCurrent(selectedCounterId);
            setShowResolveSuccess(false);
            showToast('Service Resolved: Node state refreshed', 'success');
        }, 1500);
    };

    // ── Repeat Announcement ──────────────────────
    const handleRepeatAudio = useCallback(() => {
        if (currentToken && audioEnabled) {
            speak(buildAnnouncement(currentToken, selectedCounter?.name ?? `Station ${selectedCounterId}`));
            showToast('Repeating Announcement', 'info');
        }
    }, [currentToken, audioEnabled, selectedCounter, selectedCounterId, showToast]);

    // ── Skip token ───────────────────────────────
    const handleSkip = async () => {
        if (!selectedCounterId || !skipReason.trim()) return;
        await skipToken(selectedCounterId, skipReason.trim());
        showToast(`Token skipped`, 'warning');
        setSkipReason('');
        setSkipModalOpen(false);
        setModalAction(null);
    };

    const handleTransfer = async () => {
        if (!currentToken || !selectedCounterId || !skipReason.trim()) return;
        const [targetCategory, targetService] = skipReason.split(' → ');
        await sendNotification(currentToken.id, `Registry Notice: Your session has been transferred to ${targetCategory} → ${targetService || 'Next Node'}. Please wait for recall.`, 'SYSTEM_ALERT');
        await transferToken(currentToken.id, targetCategory, targetService || currentToken.serviceId);
        await completeCurrent(selectedCounterId); // Release counter
        showToast(`Token transferred to ${skipReason}`, 'success');
        setSkipReason('');
        setTransferModalOpen(false);
        setModalAction(null);
    };

    const handleNotify = async () => {
        if (!currentToken || !selectedCounterId || !skipReason.trim()) return;
        await sendNotification(currentToken.id, `Officer Alert: ${skipReason}`, 'APP');
        if (audioEnabled) speak(`Announcement: ${skipReason}. Citizen ${currentToken.citizenName}, attention.`);
        showToast(`Custom signal dispatched`, 'info');
        setNotifyModalOpen(false);
        setSkipReason('');
        setModalAction(null);
    };

    // ── QR Scanner Logic ────────────────────────
    useEffect(() => {
        let stream: MediaStream | null = null;
        let animationFrameId: number;

        const scan = () => {
            if (videoRef.current && canvasRef.current && qrModalOpen) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d', { willReadFrequently: true });

                if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });

                    if (code) {
                        const token = state.tokens.find(t => t.id === code.data || t.tokenNumber === code.data);
                        if (token) {
                            setQrModalOpen(false);
                            // Logic to "check-in" or "call" this token if it belongs to this counter
                            if (selectedCounter?.assignedServices.includes(token.serviceCategory) ||
                                selectedCounter?.assignedServices.includes(token.serviceType)) {
                                handleActivateToken(token);
                                showToast(`QR Matched: Activating Citizen ${token.citizenName}`, 'success');
                            } else {
                                showToast(`PROTOCOL MISMATCH: Token belongs to ${token.serviceCategory}`, 'error');
                            }
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(scan);
        };

        if (qrModalOpen) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
                .then(s => {
                    stream = s;
                    if (videoRef.current) {
                        videoRef.current.srcObject = s;
                        videoRef.current.play();
                    }
                    scan();
                })
                .catch(err => {
                    console.error("Camera access denied:", err);
                    showToast("Camera access required for QR scanning", "error");
                    setQrModalOpen(false);
                });
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            cancelAnimationFrame(animationFrameId);
        };
    }, [qrModalOpen, state.tokens, selectedCounter, showToast]);

    // ── VIEWS ────────────────────────────────────

    // 1. Station Selection View
    if (!selectedCounterId) {
        return (
            <div className="min-h-screen bg-[#020617] text-white flex flex-col p-8 md:p-12 selection:bg-blue-500/30">
                <FlowingLines />
                <div className="max-w-6xl mx-auto w-full space-y-16 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="space-y-4 text-center md:text-left">
                            <InstitutionalBranding dark={true} />
                            <div className="space-y-2">
                                <h1 className="text-6xl font-black uppercase italic tracking-tighter gradient-text leading-tight">Command Center</h1>
                                <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[11px] opacity-60">Terminal Initialization Protocol</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 backdrop-blur-md">
                                <Users className="w-5 h-5 text-blue-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Queue</span>
                                    <span className="text-sm font-black uppercase tracking-widest">{state.tokens.filter(t => t.status === TokenStatus.WAITING).length} Units Waiting</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {state.counters.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedCounterId(c.id)}
                                className="group relative bg-[#0d1f3c]/50 backdrop-blur-sm border border-white/5 p-10 rounded-[3rem] text-left transition-all hover:bg-[#0d1f3c] hover:border-blue-500/40 hover:shadow-[0_0_50px_rgba(37,99,235,0.15)] overflow-hidden flex flex-col justify-between min-h-[320px]"
                            >
                                <div className="absolute -top-10 -right-10 p-12 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700">
                                    <Monitor className="w-40 h-40" />
                                </div>

                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full ${c.isOnline !== false ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Node {c.id}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-4xl font-black uppercase italic text-white tracking-tighter leading-none mb-3 group-hover:text-blue-400 transition-colors">{c.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-px bg-blue-500/50" />
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{c.officerName || 'Registry Operator'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative z-10 flex flex-wrap gap-2 mt-8">
                                    {c.assignedServices.slice(0, 4).map(s => (
                                        <span key={s} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:border-blue-500/20 group-hover:bg-blue-500/5 transition-all">{s}</span>
                                    ))}
                                    {c.assignedServices.length > 4 && (
                                        <span className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500">+{c.assignedServices.length - 4} More</span>
                                    )}
                                </div>

                                <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/50 transition-all" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 2. Active Dashboard View
    return (
        <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans">
            <FlowingLines />

            {/* ── HEADER: THREE-ZONE STRATEGIC CONTROL ── */}
            <header className="relative z-20 h-20 flex items-center justify-between px-8 bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5 selection:bg-blue-500/30">
                {/* ── ZONE 1: NAVIGATION & PERSISTENCE (LEFT) ── */}
                <div className="flex items-center gap-6 min-w-0 flex-1">
                    <button
                        onClick={() => setSelectedCounterId(null)}
                        className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all group active:scale-95 shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] hidden xl:inline">Change Node</span>
                    </button>

                    <div className="h-6 w-px bg-white/10 shrink-0" />

                    <div className="flex flex-col shrink-0">
                        <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-600 mb-0.5">Terminal Identity</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-white italic tracking-tighter">NODE {selectedCounterId}</span>
                            <span className="text-sm font-bold text-blue-400/80 uppercase tracking-tighter truncate max-w-[150px]">{selectedCounter?.name}</span>
                        </div>
                    </div>
                </div>

                {/* ── ZONE 2: OPERATIONAL METRICS (CENTER) ── */}
                <div className="flex items-center justify-center flex-1 gap-12">
                    <div className="flex items-center gap-4 px-6 py-3 bg-[#0d1f3c]/40 border border-white/5 rounded-2xl backdrop-blur-xl shrink-0">
                        <Clock className="w-4 h-4 text-blue-400 opacity-60" />
                        <span className="text-xl font-black text-blue-400 tabular-nums tracking-tight">{sessionTime}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 border-l border-white/5 pl-4 ml-2">Session</span>
                    </div>
                </div>

                {/* ── ZONE 3: PREFERENCES & STATUS (RIGHT) ── */}
                <div className="flex items-center justify-end gap-6 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (!audioEnabled) {
                                    const s = new SpeechSynthesisUtterance("");
                                    window.speechSynthesis.speak(s);
                                    showToast("Audio Engine Pre-loaded", "info");
                                }
                                setAudioEnabled(!audioEnabled);
                            }}
                            className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3 transition-all active:scale-95 shrink-0 ${audioEnabled ? 'bg-blue-600/10 border-blue-500/40 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 'bg-white/5 border-white/5 text-slate-500'}`}
                        >
                            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] hidden lg:inline">{audioEnabled ? 'Audio Active' : 'Audio Off'}</span>
                        </button>

                        {audioEnabled && (
                            <button
                                onClick={handleTestAudio}
                                className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-2xl text-blue-400 transition-all active:scale-95 group"
                                title="Test Audio"
                            >
                                <PhoneCall className="w-4 h-4 group-hover:scale-110" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center p-1 bg-white/5 border border-white/5 rounded-2xl shrink-0">
                        <button
                            onClick={() => setIsOnline(true)}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${isOnline ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-600'}`}
                        >
                            On
                        </button>
                        <button
                            onClick={() => setIsOnline(false)}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${!isOnline ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-600'}`}
                        >
                            Off
                        </button>
                    </div>

                    <div className="flex items-center gap-4 border-l border-white/10 pl-6 shrink-0 lg:ml-2">
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-0.5">Operator</span>
                            <span className="text-[11px] font-black text-white uppercase italic tracking-tight">{selectedCounter?.officerName || 'Registry Agent'}</span>
                        </div>
                        <div className="w-10 h-10 bg-[#0d1f3c] rounded-2xl flex items-center justify-center border border-white/10 text-blue-400 shadow-inner group">
                            <Monitor className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden flex">
                {/* ── IMAGE 2: MAIN WORKSPACE (LEFT) ── */}
                <section className="flex-[3] p-12 overflow-y-auto space-y-12">
                    {currentToken ? (
                        <div className="space-y-16 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="flex items-start justify-between">
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <span className="px-3 py-1 bg-orange-500 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">Strategic Priority</span>
                                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">ID: {currentToken.id.split('-')[0].toUpperCase()}</span>

                                            {audioEnabled && (
                                                <button
                                                    onClick={handleRepeatAudio}
                                                    className="p-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-blue-400 transition-all active:scale-95 group flex items-center gap-2"
                                                    title="Repeat Audio Announcement"
                                                >
                                                    <Volume2 className="w-3 h-3 group-hover:scale-110" />
                                                    <span className="text-[8px] font-bold uppercase tracking-widest">Repeat</span>
                                                </button>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]"># Registry Number</span>
                                        <div className="text-[12rem] font-black italic text-orange-500 leading-[0.8] tracking-tighter mt-4">
                                            {currentToken.tokenNumber}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Users className="w-3 h-3" /> Authenticated Citizen
                                        </span>
                                        <h1 className="text-7xl font-black uppercase italic text-white tracking-tighter">{currentToken.citizenName}</h1>
                                    </div>

                                    <div className="space-y-1 pt-4">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Activity className="w-3 h-3" /> Service Vector
                                        </span>
                                        <h2 className="text-4xl font-black uppercase italic text-orange-500/80 tracking-tighter">{currentToken.serviceType}</h2>
                                    </div>
                                </div>

                                <div className="space-y-8 flex flex-col items-center">
                                    <div className="px-8 py-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] text-center space-y-2">
                                        <div className="flex items-center justify-center gap-2 text-slate-500 uppercase font-black text-[9px] tracking-widest">
                                            <Timer className="w-3 h-3" /> SLA Timer
                                        </div>
                                        <div className="text-6xl font-black text-emerald-500 tabular-nums leading-none">{elapsedTime}</div>
                                        <div className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">Optimal Pace</div>
                                    </div>

                                    <div className="w-48 h-48 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-center space-y-4">
                                        <div className="w-24 h-24 bg-white rounded-3xl" />
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Digital Access Grid</span>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Verified Secure Session</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center group">
                            <div className="relative mb-12">
                                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] animate-pulse" />
                                <div className="p-12 bg-[#0d1f3c] border border-white/5 rounded-full relative z-10 group-hover:scale-110 transition-transform duration-700">
                                    <Monitor className="w-24 h-24 text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500 rounded-full border-4 border-[#020617] animate-ping" />
                            </div>
                            <h2 className="text-5xl font-black uppercase italic tracking-tighter gradient-text">Terminal Idle</h2>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.6em] mt-6">Awaiting Secure Link to Queue Matrix</p>

                            <div className="mt-12 flex gap-4 opacity-20">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
                            </div>
                        </div>
                    )}
                </section>

                {/* ── IMAGE 2: SIDEBAR STACKS (RIGHT) ── */}
                <aside className="w-96 flex flex-col bg-black/40 border-l border-white/5 backdrop-blur-3xl px-6 py-10 space-y-12 overflow-y-auto">
                    {/* Inbound Stack */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div className="flex items-center gap-3">
                                <Activity className="w-4 h-4 text-blue-400" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Inbound Stack ({waitingQueue.length})</h3>
                            </div>
                            <button
                                onClick={() => setQrModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                            >
                                <Zap className="w-3 h-3" /> Scan QR
                            </button>
                        </div>
                        <div className="space-y-3">
                            {waitingQueue.slice(0, 8).map((t: Token) => (
                                <div key={t.id} className={`p-4 bg-white/5 border rounded-2xl flex items-center justify-between group transition-all ${recentlyCalledId === t.id ? 'border-blue-500 bg-blue-500/10 animate-pulse' : 'border-white/5 hover:border-blue-500/30'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-xl font-black italic text-blue-400 leading-none">{t.tokenNumber}</span>
                                            <span className="text-[7px] font-bold text-slate-600 uppercase tracking-widest mt-1">Ready</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight">{t.citizenName}</p>
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t.serviceType}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {t.isPriority && <Star className="w-3 h-3 text-amber-500 fill-current shrink-0" />}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleActivateToken(t); }}
                                            className="p-2.5 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 rounded-xl text-blue-400 hover:text-white transition-all active:scale-90"
                                            title="Call Citizen & Play Audio"
                                        >
                                            <PhoneCall className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {waitingQueue.length === 0 && <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-center py-8">No Entries In Stack</p>}
                        </div>
                    </div>

                    {/* Recently Skipped */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-rose-400" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400 italic">Recently Skipped ({skippedQueue.length})</h3>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {skippedQueue.slice(0, 5).map((t: Token) => (
                                <div key={t.id} className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center justify-between group transition-all">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xl font-black italic text-rose-400">{t.tokenNumber}</span>
                                        <div>
                                            <p className="text-[10px] font-black text-rose-200 uppercase tracking-tight">{t.citizenName}</p>
                                            <p className="text-[8px] font-black text-rose-900/60 uppercase tracking-widest">{t.skipReason || 'Absent'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleActivateToken(t); }}
                                        className="p-2.5 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 rounded-xl text-rose-400 hover:text-white transition-all active:scale-90"
                                        title="Recall Citizen & Play Audio"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {skippedQueue.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4 grayscale opacity-20">
                                    <Users className="w-12 h-12" />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No Skips Recorded</p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </main>

            {/* ── IMAGE 3: FOOTER CONTROLS ── */}
            <footer className="h-32 bg-[#020617] border-t border-white/5 flex items-center px-12 gap-6 relative z-30">
                <div className="flex-[4] flex items-center gap-6">
                    <button
                        onClick={handleComplete}
                        disabled={!currentToken}
                        className="group relative h-20 px-12 bg-emerald-600 rounded-3xl flex items-center gap-4 hover:bg-emerald-500 transition-all disabled:opacity-20 disabled:grayscale shadow-[0_0_30px_rgba(16,185,129,0.2)] active:scale-95 overflow-hidden"
                    >
                        <div className="absolute inset-x-0 h-1/2 bottom-0 bg-white/10 group-active:translate-y-2 transition-transform" />
                        <CheckCircle2 className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Resolve Unit</span>
                    </button>

                    <div className="h-10 w-px bg-white/10" />

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => { setModalAction('SKIP'); setSkipModalOpen(true); }}
                            disabled={!currentToken}
                            className="w-40 h-20 bg-rose-500/5 border border-rose-500/20 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-rose-500/10 transition-all disabled:opacity-20 text-rose-400 group"
                        >
                            <SkipForward className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Skip Protocol</span>
                        </button>

                        <button
                            onClick={() => { setModalAction('TRANSFER'); setTransferModalOpen(true); }}
                            disabled={!currentToken}
                            className="w-40 h-20 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-emerald-500/10 transition-all disabled:opacity-20 text-emerald-400 group"
                        >
                            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Relocate Node</span>
                        </button>

                        <button
                            onClick={() => { setModalAction('NOTIFY'); setNotifyModalOpen(true); }}
                            disabled={!currentToken}
                            className="w-40 h-20 bg-blue-500/5 border border-blue-500/20 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-blue-500/10 transition-all disabled:opacity-20 text-blue-400 group"
                        >
                            <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Dispatch Note</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex justify-end">
                    <button
                        onClick={handleCallNext}
                        disabled={isCalling || (waitingQueue.length === 0 && !currentToken)}
                        className="h-20 px-12 bg-white/5 border border-blue-500/30 rounded-3xl flex items-center gap-6 group hover:bg-white/10 transition-all disabled:opacity-20"
                    >
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Ready Signal</span>
                            <span className="text-sm font-black text-white uppercase italic">{isCalling ? 'Calling...' : 'Call Next'}</span>
                        </div>
                        <PhoneCall className={`w-6 h-6 text-blue-400 ${!isCalling && waitingQueue.length > 0 ? 'animate-bounce' : ''}`} />
                    </button>
                </div>
            </footer>

            {/* ── MODALS (Unified Notification Style) ── */}
            {(skipModalOpen || notifyModalOpen || transferModalOpen) && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-3xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-[#0f1e35] w-full max-w-xl p-16 rounded-[4rem] border border-white/10 shadow-2xl space-y-12">
                        <div className="flex items-center gap-8">
                            <div className="p-6 bg-blue-600/10 rounded-[2rem] border border-blue-500/20">
                                {modalAction === 'SKIP' ? <SkipForward className="w-10 h-10 text-rose-400" /> : modalAction === 'TRANSFER' ? <RefreshCw className="w-10 h-10 text-emerald-400" /> : <Volume2 className="w-10 h-10 text-blue-400" />}
                            </div>
                            <div>
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                                    {modalAction === 'SKIP' ? 'Skip Protocol' : modalAction === 'TRANSFER' ? 'Transfer Logic' : 'Notification Vector'}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 px-1">
                                    {modalAction === 'SKIP' ? 'Citizen status will be deferred' : modalAction === 'TRANSFER' ? 'Rerouting citizen to specialized node' : 'Direct signal to citizen terminal'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {(modalAction === 'SKIP' ?
                                ['Absent / No response', 'Documentation Error', 'System Timeout', 'Citizen Withdrew'] :
                                modalAction === 'TRANSFER' ?
                                    ['Registry → Finance', 'Registry → Verification', 'Registry → Legal', 'Registry → HelpDesk'] :
                                    ['Proceed to Counter Now', 'Document Check Required', 'Signature Pending', 'Verify biometric signal']
                            ).map(reason => (
                                <button
                                    key={reason}
                                    onClick={() => setSkipReason(reason)}
                                    className={`p-6 rounded-2xl text-[9px] font-black uppercase tracking-widest text-left border-2 transition-all ${skipReason === reason ? 'border-blue-500/50 bg-blue-500/10 text-white' : 'border-white/5 bg-white/[0.02] text-slate-500 hover:text-slate-300'}`}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-6">
                            <button
                                onClick={() => { setSkipModalOpen(false); setNotifyModalOpen(false); setTransferModalOpen(false); setSkipReason(''); setModalAction(null); }}
                                className="flex-1 py-6 bg-white/5 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                Abort
                            </button>
                            <button
                                onClick={modalAction === 'SKIP' ? handleSkip : modalAction === 'TRANSFER' ? handleTransfer : handleNotify}
                                disabled={!skipReason.trim()}
                                className={`flex-1 py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all ${modalAction === 'SKIP' ? 'bg-rose-600 hover:bg-rose-500' : modalAction === 'TRANSFER' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'} text-white disabled:opacity-20`}
                            >
                                {modalAction === 'SKIP' ? 'Execute Skip' : modalAction === 'TRANSFER' ? 'Finalize Reroute' : 'Dispatch Signal'}
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-6 opacity-30">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[8px] font-black uppercase tracking-widest">APP</span></div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[8px] font-black uppercase tracking-widest">SMS</span></div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-[8px] font-black uppercase tracking-widest">GMAIL</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── QR SCANNER MODAL (Mock) ── */}
            {qrModalOpen && (
                <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-[250] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                    <div className="bg-[#0f1e35] w-full max-w-2xl p-12 rounded-[3rem] border border-blue-500/30 shadow-[0_0_100px_rgba(37,99,235,0.2)] flex flex-col items-center gap-10">
                        <div className="text-center space-y-2">
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Initialize QR Vector</h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Align optical token to scan zone</p>
                        </div>

                        <div className="relative w-80 h-80 border-2 border-blue-500/20 rounded-[3rem] overflow-hidden group">
                            <video
                                ref={videoRef}
                                className="absolute inset-0 w-full h-full object-cover"
                                playsInline
                            />
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Scanning UI Overlays */}
                            <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none" />
                            <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl pointer-events-none" />
                            <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl pointer-events-none" />
                            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl pointer-events-none" />
                            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-2xl pointer-events-none" />
                            <div className="absolute inset-x-0 h-1 bg-blue-400/50 shadow-[0_0_15px_rgba(37,99,235,0.8)] animate-scan-y top-0 pointer-events-none" />
                        </div>

                        <div className="flex gap-4 w-full">
                            <button
                                onClick={() => setQrModalOpen(false)}
                                className="flex-1 py-5 bg-white/5 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                Terminate Scan
                            </button>
                            <button
                                onClick={() => {
                                    // Try to scan first waiting token to demonstrate functionality
                                    const nextId = waitingQueue[0]?.id;
                                    if (nextId) {
                                        handleActivateToken(nextId);
                                        setQrModalOpen(false);
                                    } else {
                                        showToast('Optical Diagnostic: No compatible unit in range', 'warning');
                                        setQrModalOpen(false);
                                    }
                                }}
                                className="flex-1 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all"
                            >
                                Initiate Scanned Link
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audio Wake Overlay */}
            {showWakeOverlay && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[300] flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-[#0d1f3c] border-4 border-blue-500/30 rounded-[3rem] p-12 text-center space-y-8 shadow-[0_0_100px_rgba(59,130,246,0.2)] animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-blue-600/20 border-2 border-blue-500/30 rounded-3xl flex items-center justify-center mx-auto text-blue-400 mb-4 animate-pulse">
                            <Volume2 size={48} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Audio Sync Required</h2>
                            <div className="flex items-center justify-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${audioCtxStatus === 'running' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Engine Status: {audioCtxStatus}</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] leading-relaxed">
                                Browser protocols require manual authorization to initialize the official announcement engine.
                            </p>
                        </div>
                        <button
                            onClick={handleWakeSystem}
                            className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-4 group"
                        >
                            Initialize Tactical Audio <Zap size={16} className="group-hover:rotate-12 transition-transform" />
                        </button>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Operator Authorization Layer 01</p>
                    </div>
                </div>
            )}

            {/* ── SUCCESS OVERLAY: SERVICE COMPLETED ── */}
            {showResolveSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="flex flex-col items-center space-y-8 animate-in zoom-in slide-in-from-bottom-10 duration-500">
                        <div className="w-40 h-40 rounded-full bg-emerald-500/20 border-4 border-emerald-500/40 flex items-center justify-center shadow-[0_0_100px_rgba(16,185,129,0.2)]">
                            <CheckCircle2 className="w-24 h-24 text-emerald-400 animate-bounce" />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">Service Resolved</h2>
                            <p className="text-xl font-bold text-emerald-400 uppercase tracking-[0.5em] opacity-80">Unit Processed Successfully</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfficerDashboard;

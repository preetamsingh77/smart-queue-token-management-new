import React from 'react';

// ─── Government Emblem Shared Component ───────────────────────────────────────
export const GovEmblem: React.FC<{ size?: number; color?: string; accentColor?: string }> = ({
    size = 56,
    color = "#1e3a6e",
    accentColor = "#c8a227"
}) => (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Government Emblem">
        <circle cx="40" cy="40" r="38" stroke={color} strokeWidth="2.5" fill="none" />
        <circle cx="40" cy="40" r="32" stroke={color} strokeWidth="1" fill="none" strokeDasharray="3 3" />
        {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24;
            const rad = (angle * Math.PI) / 180;
            const x1 = 40 + 10 * Math.cos(rad);
            const y1 = 40 + 10 * Math.sin(rad);
            const x2 = 40 + 26 * Math.cos(rad);
            const y2 = 40 + 26 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.2" />;
        })}
        <circle cx="40" cy="40" r="10" stroke={color} strokeWidth="2" fill="#f0f4ff" />
        <circle cx="40" cy="40" r="4" fill={color} />
        <circle cx="40" cy="40" r="26" stroke={color} strokeWidth="2" fill="none" />
        <rect x="26" y="60" width="28" height="4" rx="2" fill={color} />
        <ellipse cx="34" cy="56" rx="5" ry="4" fill={color} />
        <ellipse cx="46" cy="56" rx="5" ry="4" fill={color} />
        <rect x="31" y="52" width="4" height="5" rx="1" fill={color} />
        <rect x="45" y="52" width="4" height="5" rx="1" fill={color} />
        {[33, 37, 40, 43, 47].map((cx, i) => (
            <circle key={i} cx={cx} cy="49" r="1.2" fill={accentColor} />
        ))}
        <circle cx="40" cy="40" r="38" stroke={accentColor} strokeWidth="1" fill="none" opacity="0.5" />
    </svg>
);

// ─── Subtle Flowing Lines Animation ──────────────────────────────────────────
export const FlowingLines: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="rgba(200,162,39,0.3)" />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
            {Array.from({ length: 12 }).map((_, i) => (
                <path
                    key={i}
                    d={`M -200 ${100 + i * 80} Q ${400 + i * 50} ${50 - i * 20}, 1600 ${150 + i * 60}`}
                    stroke="url(#line-grad)"
                    strokeWidth="1"
                    fill="none"
                    className="animate-flow"
                    style={{
                        animationDelay: `${i * 0.8}s`,
                        animationDuration: `${10 + i * 2}s`
                    }}
                />
            ))}
        </svg>
        <style>{`
      @keyframes flow {
        0% { transform: translateX(-10%); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateX(10%); opacity: 0; }
      }
      .animate-flow {
        animation: flow linear infinite;
      }
    `}</style>
    </div>
);

// ─── Institutional Logo Section ──────────────────────────────────────────────
export const InstitutionalBranding: React.FC<{ dark?: boolean }> = ({ dark = false }) => (
    <div className="flex items-center gap-3">
        <div className={`p-1 rounded-lg border ${dark ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
            <GovEmblem size={44} color={dark ? '#ffffff' : '#1e3a6e'} />
        </div>
        <div className="flex flex-col text-left">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1 ${dark ? 'text-blue-200' : 'text-[#1e3a6e]'}`}>
                Government of India
            </span>
            <span className={`text-sm font-black tracking-tight leading-none ${dark ? 'text-white' : 'text-slate-900'}`}>
                Dept. of Administrative Services
            </span>
        </div>
    </div>
);

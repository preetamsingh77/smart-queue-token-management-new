
import React from 'react';
import { User, ShieldCheck, Zap, Clock, Accessibility, AlertCircle, Phone, Mail, Flame, ShieldAlert } from 'lucide-react';
import { Token } from '../types';

interface VerificationModalProps {
  token: Token;
  onConfirm: () => void;
  onStart: () => void;
  onClose: () => void;
  isCounterBusy: boolean;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ 
  token, 
  onConfirm, 
  onStart, 
  onClose, 
  isCounterBusy 
}) => {
  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
      <div className={`w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl text-slate-900 dark:text-white border-4 transition-all duration-300 ${
        token.isPriority ? 'border-orange-500 shadow-orange-500/40' : 'border-white/20 dark:border-white/5'
      }`}>
        <div className={`p-8 text-white flex justify-between items-center relative overflow-hidden ${
          token.isPriority ? 'bg-gradient-to-br from-orange-600 to-red-600' : 'bg-slate-900 dark:bg-black'
        }`}>
          {/* Decorative background element */}
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-1">
              {token.isPriority ? 'URGENT PROTOCOL' : 'Citizen Verified'}
            </div>
            <div className="flex items-center gap-4">
              <h2 className="text-5xl font-black tracking-tighter">#{token.number}</h2>
              {token.isPriority && (
                <div className="px-3 py-1 bg-white text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-bounce flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  PRIORITY CASE
                </div>
              )}
            </div>
          </div>
          <div className={`relative z-10 p-5 rounded-3xl ${token.isPriority ? 'bg-white/20 backdrop-blur-md' : 'bg-blue-500 shadow-lg shadow-blue-500/30'} transform hover:scale-105 transition-transform`}>
            {token.isPriority ? <ShieldAlert className="w-8 h-8 text-white" /> : <User className="w-8 h-8 text-white" />}
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Applicant Name</span>
              <p className="font-bold text-lg leading-tight text-slate-900 dark:text-slate-100">{token.citizenName}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Requested Service</span>
              <p className={`font-bold leading-tight ${token.isPriority ? 'text-orange-600' : 'text-blue-600 dark:text-blue-400'}`}>
                {token.serviceType}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm">
                <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">SMS Contact</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">{token.phone || 'None'}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Email Contact</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">{token.email || 'None'}</span>
              </div>
            </div>
          </div>

          {token.isPriority && (
            <div className="flex items-center gap-4 p-5 bg-orange-50 dark:bg-orange-900/10 rounded-[1.5rem] border border-orange-100 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 animate-in slide-in-from-bottom duration-500">
              <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                <Accessibility className="w-5 h-5 text-orange-500 dark:text-orange-400" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block mb-0.5">Priority Routing</span>
                <span className="text-sm font-bold">Elderly / Medical Priority Status</span>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-4">
            <button 
              onClick={onStart}
              disabled={isCounterBusy}
              className={`w-full py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 transition-all border relative overflow-hidden group
                ${isCounterBusy 
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none' 
                  : token.isPriority
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-transparent shadow-xl shadow-orange-500/30'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-700 to-blue-600 bg-[length:200%_auto] hover:bg-right text-white border-transparent shadow-xl shadow-blue-500/30'
                }`}
            >
              <Zap className={`w-6 h-6 ${isCounterBusy ? 'text-slate-300' : 'text-white group-hover:animate-bounce'}`} /> 
              <span>{isCounterBusy ? 'Finish Current First' : 'Start Priority Service'}</span>
            </button>
            
            <button 
              onClick={onClose} 
              className="w-full text-slate-400 dark:text-slate-500 py-3 text-sm font-black uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Dismiss Verification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

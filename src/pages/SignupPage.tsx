import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, Loader2, ShieldCheck, ChevronDown } from 'lucide-react';
import { InstitutionalBranding } from '../components/SharedUI';
import { useToast } from '../context/ToastContext';

const SignupPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const roleParam = searchParams.get('role')?.toUpperCase();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'CITIZEN' | 'OFFICER' | 'ADMIN'>(
        (roleParam === 'OFFICER' || roleParam === 'ADMIN' || roleParam === 'CITIZEN') ? roleParam : 'CITIZEN'
    );
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user, signUpWithEmailPassword, signInWithGoogle, updateRole } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Redirect already logged in users to their respective dashboards
    useEffect(() => {
        if (user && !isSubmitting) {
            if (user.role === 'ADMIN') navigate('/admin');
            else if (user.role === 'OFFICER') navigate('/officer');
            else navigate('/portal');
        }
    }, [user, navigate, isSubmitting]);

    const handleSuccessRedirect = async (role: string) => {
        try {
            await updateRole(role as any);
            switch (role) {
                case 'ADMIN': navigate('/admin'); break;
                case 'OFFICER': navigate('/officer'); break;
                default: navigate('/portal');
            }
        } catch (error) {
            console.error('Role update failed:', error);
            navigate('/');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await signUpWithEmailPassword(email, password, fullName, selectedRole);
            await handleSuccessRedirect(selectedRole);
        } catch (error: any) {
            showToast(error.message || 'Account creation failed.', 'error');
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsSubmitting(true);
        try {
            await signInWithGoogle();
            await handleSuccessRedirect(selectedRole);
        } catch (error: any) {
            showToast(error.message || 'Google sign-in failed.', 'error');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 dark:border-slate-800">
                <div className="text-center mb-10 flex flex-col items-center">
                    <div className="mb-6 scale-110">
                        <InstitutionalBranding />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Create Account</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Join the CivicFlow Platform</p>
                </div>

                <div className="space-y-6 mb-8">
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#c8a227] ml-1">
                            Select Workspace Level
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full relative flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl hover:border-[#1e3a6e]/30 focus:border-[#1e3a6e] focus:outline-none transition-all"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-[10px] uppercase tracking-widest text-[#1e3a6e] dark:text-blue-400">{selectedRole}</span>
                                    <span className="text-[8px] font-medium opacity-60 uppercase tracking-tighter mt-0.5 text-slate-500">
                                        {selectedRole === 'CITIZEN' ? 'Public access for token management' : selectedRole === 'OFFICER' ? 'Station personnel & queue triage' : 'Command center & system config'}
                                    </span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsDropdownOpen(false)}
                                    />
                                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                                        {(['CITIZEN', 'OFFICER', 'ADMIN'] as const).map((role) => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedRole(role);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-6 py-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 ${selectedRole === role ? 'bg-[#1e3a6e]/5 dark:bg-[#1e3a6e]/20' : ''}`}
                                            >
                                                <div className="flex flex-col items-start">
                                                    <span className={`font-black text-[10px] uppercase tracking-widest ${selectedRole === role ? 'text-[#1e3a6e] dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{role}</span>
                                                    <span className="text-[8px] font-medium opacity-60 uppercase tracking-tighter mt-0.5 text-slate-500">
                                                        {role === 'CITIZEN' ? 'Public access for token management' : role === 'OFFICER' ? 'Station personnel & queue triage' : 'Command center & system config'}
                                                    </span>
                                                </div>
                                                {selectedRole === role && <ShieldCheck size={16} className="text-[#c8a227]" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                            Full Name
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                required
                                className="block w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                            Official Email
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                required
                                className="block w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                                placeholder="name@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                            Secure Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                required
                                className="block w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 group"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <>
                                <span>Account Creation</span>
                                <UserPlus className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-slate-900 px-4 text-slate-500 font-black tracking-widest">or continue with</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                        />
                    </svg>
                    <span>Google Identity</span>
                </button>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Already have an account?{' '}
                        <Link to="/login?role=CITIZEN" className="text-blue-600 dark:text-blue-400 font-black hover:underline underline-offset-4">
                            Log In
                        </Link>
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400 max-w-xs mx-auto">
                        By creating an account, you agree to the institution's digital transparency protocols.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;

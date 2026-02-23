import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'ADMIN' | 'OFFICER' | 'CITIZEN';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <p className="text-sm font-black uppercase tracking-widest text-slate-500">Synchronizing Identity...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 dark:border-slate-800 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
                        <ShieldAlert size={40} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Access Restricted</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                            Your current identity <span className="text-blue-600 dark:text-blue-400 font-bold">({user.role})</span> lacks the protocols required for this sector.
                        </p>
                    </div>

                    <div className="pt-4 space-y-4">
                        <button
                            onClick={() => window.location.href = '#/'}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                        >
                            Return to Base
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;


import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { QueueProvider } from './context/QueueContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import CitizenPortal from './pages/CitizenPortal';
import OfficerDashboard from './pages/OfficerDashboard';
import CommandCenter from './pages/CommandCenter';
import PublicDisplay from './pages/PublicDisplay';
import SettingsPage from './pages/SettingsPage';
import HelpCenter from './pages/HelpCenter';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import { HelpModal } from './components/HelpModal';
import {
  Moon, Sun, UserPlus, Monitor,
  HelpCircle, Settings as SettingsIcon, LogOut, Home
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { InstitutionalBranding } from './components/SharedUI';
import ProtectedRoute from './components/ProtectedRoute';

const TopHeader: React.FC<{ onOpenHelp: () => void }> = ({ onOpenHelp }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, signOut } = useAuth();

  // Hide the app top-bar on the government home page — it has its own full header
  const isHomePage = location.pathname === '/home' || location.pathname === '/';

  const isCitizen = location.pathname === '/portal';

  if (isHomePage) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-[#0d2550]/80 backdrop-blur-xl border-b border-white/10 z-[100] px-4 md:px-6 flex items-center shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-amber-600/5 pointer-events-none" />

      <div className="flex items-center gap-4 lg:gap-8 relative z-10">
        <Link to="/home" className="hover:opacity-80 transition-opacity transform hover:scale-105 duration-300">
          <InstitutionalBranding dark={true} />
        </Link>

        <div className="flex items-center gap-1.5 ml-4 bg-white/5 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => navigate('/home')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${isHomePage ? 'bg-[#c8a227] text-[#1a1a1a] shadow-lg shadow-yellow-900/40' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            <Home className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button
            onClick={() => navigate('/portal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${isCitizen ? 'bg-[#c8a227] text-[#1a1a1a] shadow-lg shadow-yellow-900/40' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            <UserPlus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Portal</span>
          </button>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4 md:gap-8 relative z-10">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 mr-2">
            <button
              onClick={onOpenHelp}
              className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
              title="Help Center"
            >
              <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            <Link
              to="/display"
              className={`p-2.5 rounded-xl transition-all group ${location.pathname === '/display' ? 'text-[#c8a227] bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              title="Public Display"
            >
              <Monitor className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Signed in as</span>
                  <span className="text-[10px] font-black text-white/60 max-w-[120px] truncate">{user.fullName || user.email}</span>
                </div>
                <Link to="/settings" className="p-2.5 text-white/40 hover:text-[#c8a227] hover:bg-[#c8a227]/10 rounded-xl transition-all group" title="Settings">
                  <SettingsIcon className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-2.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all group"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white rounded-xl transition-all text-[9px] font-black uppercase tracking-widest group"
              >
                <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            )}
          </div>

          <div className="h-8 w-px bg-white/10 mx-1" />

          <button
            onClick={toggleDarkMode}
            className="ml-2 w-10 h-10 flex items-center justify-center bg-white/5 text-white/60 rounded-xl hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all border border-white/5 group"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 group-hover:rotate-90 transition-all duration-500" />
            ) : (
              <Moon className="w-5 h-5 group-hover:-rotate-12 transition-all duration-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};



const App: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <QueueProvider>
            <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
                <TopHeader onOpenHelp={() => setShowHelp(true)} />
                <main>
                  <Routes>
                    {/* Government Home Page — no extra padding needed (full-width) */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/home" element={<HomePage />} />

                    {/* Citizen Portal — keep original "/portal" and also "/?portalStep" compatible via root */}
                    <Route path="/portal" element={
                      <div className="pt-20">
                        <CitizenPortal />
                      </div>
                    } />

                    <Route path="/display" element={<PublicDisplay />} />
                    <Route path="/help" element={
                      <div className="pt-20">
                        <HelpCenter />
                      </div>
                    } />
                    {/* Auth routes — redirect handled inside components */}
                    <Route path="/login" element={<div className="pt-20"><LoginPage /></div>} />
                    <Route path="/signup" element={<div className="pt-20"><SignupPage /></div>} />

                    {/* Staff routes — require authentication */}
                    <Route path="/officer" element={
                      <ProtectedRoute requiredRole="OFFICER">
                        <div className="pt-20"><OfficerDashboard /></div>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <div className="pt-20"><CommandCenter /></div>
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <div className="pt-20"><SettingsPage /></div>
                      </ProtectedRoute>
                    } />
                  </Routes>
                </main>
                {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
              </div>
            </HashRouter>
          </QueueProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GntLogo } from '../../components/common/GntLogo';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { DatabaseStatusBanner } from '../../components/common/DatabaseStatusBanner';
import { UserRole } from '../../types';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Building,
  KeyRound,
  Sparkles,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { users, signInWithEmail, signUpWithEmail, login } = useApp();

  const [authMode, setAuthMode] = useState<'signin' | 'pin' | 'signup'>('signin');
  
  // Sign In Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const activeUsers = users.filter((u) => u.active);

  // Security PIN Form State
  const [selectedUserId, setSelectedUserId] = useState<string>(() => users.find((u) => u.active)?.id || '');
  const [pin, setPin] = useState('');

  // Sign Up Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('EMPLOYEE');
  const [signupDepartment, setSignupDepartment] = useState('Engineering');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const active = users.filter((u) => u.active);
    if (active && active.length > 0) {
      const exists = active.some((u) => u.id === selectedUserId);
      if (!exists) {
        setSelectedUserId(active[0].id);
      }
    }
  }, [users, selectedUserId]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    const res = await signInWithEmail(email.trim(), password.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.errorMessage || 'Invalid email or password.');
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetUserId = selectedUserId || users[0]?.id;
    if (!targetUserId) {
      setError('Please select a valid user account.');
      return;
    }
    if (!pin.trim()) {
      setError('Please enter your Security PIN.');
      return;
    }

    setLoading(true);
    const res = await login(targetUserId, pin.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.errorMessage || 'Incorrect Security PIN.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const res = await signUpWithEmail({
      name: signupName.trim(),
      email: signupEmail.trim(),
      password: signupPassword.trim(),
      role: signupRole,
      department: signupDepartment.trim(),
    });
    setLoading(false);

    if (!res.success) {
      setError(res.errorMessage || 'Unable to create account in Supabase.');
    }
  };

  const selectedUserObj = users.find((u) => u.id === selectedUserId) || users[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center sm:px-6 lg:px-8">
      <div className="w-full fixed top-0 left-0 z-50">
        <DatabaseStatusBanner />
      </div>
      <div className="py-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Official GNT Logo */}
        <div className="flex justify-center mb-4">
          <GntLogo variant="full" size="xl" className="drop-shadow-xs" />
        </div>

        <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
          TAX WORLDD
        </h1>
        <p className="mt-1 text-xs font-medium text-slate-500 max-w-xs mx-auto">
          Operational accountability & deliverables management for enterprise teams
        </p>

        {/* Auth Mode Badge */}
        {isSupabaseConfigured ? (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secured with Supabase Authentication</span>
          </div>
        ) : (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Local Storage Offline Mode</span>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80 sm:px-10">
          
          {/* Auth Mode Tabs */}
          <div className="flex p-1 mb-6 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                authMode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Email Login
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('pin'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                authMode === 'pin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              PIN Login
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                authMode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Mode 1: Supabase Email & Password Sign In */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{loading ? 'Authenticating with Supabase...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Mode 2: Security PIN Login */}
          {authMode === 'pin' && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Team Account
                </label>
                {activeUsers.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                    No staff accounts found in database. Run <strong>supabase_schema.sql</strong> in your Supabase SQL Editor to initialize staff accounts and teams.
                  </div>
                ) : (
                  <select
                    value={selectedUserId || activeUsers[0]?.id || ''}
                    onChange={(e) => {
                      setSelectedUserId(e.target.value);
                      setError('');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    {activeUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.role} ({u.department || 'Operations'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedUserObj && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                      {selectedUserObj.initials}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{selectedUserObj.name}</p>
                      <p className="text-[11px] text-slate-400">{selectedUserObj.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {selectedUserObj.role}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Security PIN
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Forgot PIN? Contact system Admin to reset
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter Security PIN"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setError(''); }}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Mode 3: Supabase Account Registration */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aman Shaikh"
                    value={signupName}
                    onChange={(e) => { setSignupName(e.target.value); setError(''); }}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="aman@gnt.com"
                    value={signupEmail}
                    onChange={(e) => { setSignupEmail(e.target.value); setError(''); }}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Create a secure password"
                    value={signupPassword}
                    onChange={(e) => { setSignupPassword(e.target.value); setError(''); }}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    System Role
                  </label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as UserRole)}
                    className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="Engineering"
                    value={signupDepartment}
                    onChange={(e) => setSignupDepartment(e.target.value)}
                    className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{loading ? 'Registering in Supabase...' : 'Create Account'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  </div>
);
};


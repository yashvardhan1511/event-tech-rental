import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { UserPlus, Mail, Lock, User, AlertCircle, Key, Eye, EyeOff } from 'lucide-react';

interface RegisterProps {
  onToggleAuthMode: () => void;
  onRegisterSuccess: (role: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onToggleAuthMode, onRegisterSuccess }) => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const role = 'customer';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');

    if (!otpSent) {
      setOtpLoading(true);
      try {
        const res = await authService.sendOtp(email);
        setOtpSent(true);
        if (res.devFallback && res.otp) {
          setOtp(res.otp);
          setError('Notice: Render free-tier SMTP restrictions are active. Verification code auto-filled for you!');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to send verification code. Enter a valid Email ID.');
      } finally {
        setOtpLoading(false);
      }
      return;
    }

    if (!otp) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await register({ username, email, password, role, otp });
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        onRegisterSuccess(payload.role);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating account. Email or Username might be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/60 via-slate-50 to-slate-100 p-6">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-200/80 shadow-2xl relative overflow-hidden bg-white/80">
        
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-violet-600/5 rounded-full blur-2xl"></div>

        <div className="text-center mb-8 relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 mx-auto mb-4">
            1P
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Account</h2>
          <p className="text-xs text-slate-500 mt-1">Get started with One Point Solutions Event Tech Rental</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!otpSent ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="john_doe"
                    className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-slate-800 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-slate-800 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 rounded-xl glass-input text-slate-800 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-6"
              >
                <UserPlus className="w-5 h-5" />
                <span>{otpLoading ? 'Sending verification code...' : 'Sign Up'}</span>
              </button>
            </>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-800 text-xs space-y-1 leading-relaxed">
                <p className="font-bold flex items-center space-x-1">
                  <span>📧 Verification Code Sent</span>
                </p>
                <p>We sent a 6-digit verification code to <strong className="text-indigo-900">{email}</strong>. Check your inbox and enter the code below.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">6-Digit Verification Code</label>
                <div className="relative">
                  <Key className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-slate-800 text-sm font-bold tracking-[0.2em] text-center"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-6"
              >
                <UserPlus className="w-5 h-5" />
                <span>{loading ? 'Verifying & Registering...' : 'Verify & Register'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Change Email / Back
              </button>
            </>
          )}
        </form>

        <div className="mt-8 text-center text-xs text-slate-500 border-t border-slate-100 pt-6">
          Already have an account?{' '}
          <button
            onClick={onToggleAuthMode}
            className="text-indigo-600 hover:text-indigo-500 font-bold underline transition-colors cursor-pointer"
          >
            Sign in
          </button>
        </div>

      </div>
    </div>
  );
};

export default Register;

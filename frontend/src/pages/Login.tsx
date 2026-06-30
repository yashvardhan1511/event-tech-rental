import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onToggleAuthMode: () => void;
  onLoginSuccess: (role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onToggleAuthMode, onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      // Fetch user role to trigger dashboard view update
      const token = localStorage.getItem('token');
      if (token) {
        // Simple JWT decode to read role
        const payload = JSON.parse(atob(token.split('.')[1]));
        onLoginSuccess(payload.role);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/60 via-slate-50 to-slate-100 p-6">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-200/80 shadow-2xl relative overflow-hidden bg-white/80">
        
        {/* Decorative backdrop glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-violet-600/5 rounded-full blur-2xl"></div>

        {/* Heading */}
        <div className="text-center mb-8 relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 mx-auto mb-4">
            1P
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-500 mt-1">One Point Solutions Event Tech Rental Optimizer</p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl glass-input text-slate-800 text-sm"
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
                className="w-full pl-12 pr-12 py-3.5 rounded-xl glass-input text-slate-800 text-sm"
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
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-8"
          >
            <LogIn className="w-5 h-5" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>



        {/* Footer Info */}
        <div className="mt-8 text-center text-xs text-slate-500 border-t border-slate-100 pt-6">
          Don't have an account?{' '}
          <button
            onClick={onToggleAuthMode}
            className="text-indigo-600 hover:text-indigo-500 font-bold underline transition-colors cursor-pointer"
          >
            Create account
          </button>
        </div>



      </div>
    </div>
  );
};

export default Login;

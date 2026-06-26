import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onToggleAuthMode: () => void;
  onLoginSuccess: (role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onToggleAuthMode, onLoginSuccess }) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Fetch client ID on mount
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const res = await fetch('/api/auth/google-client-id');
        const data = await res.json();
        setGoogleClientId(data.clientId);
        if (data.clientId && !data.clientId.includes('genericplaceholder')) {
          setIsDemoMode(false);
        }
      } catch (err) {
        console.error('Failed to load Google Client ID', err);
      }
    };
    fetchClientId();
  }, []);

  // Initialize real Google Sign-In button if not in demo mode
  useEffect(() => {
    if (isDemoMode || !googleClientId) return;

    const initGoogle = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            setError('');
            setLoading(true);
            try {
              await loginWithGoogle(response.credential);
              const token = localStorage.getItem('token');
              if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                onLoginSuccess(payload.role);
              }
            } catch (err: any) {
              setError(err.response?.data?.message || 'Google Sign-In failed.');
            } finally {
              setLoading(false);
            }
          }
        });

        (window as any).google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { 
            theme: "outline", 
            size: "large",
            width: 384,
            text: "signin_with",
            shape: "rectangular"
          }
        );
      }
    };

    const checkInterval = setInterval(() => {
      if ((window as any).google) {
        initGoogle();
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [googleClientId, isDemoMode, loginWithGoogle, onLoginSuccess]);

  const handleDemoGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle('dev_demo_google_token');
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        onLoginSuccess(payload.role);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

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

        {/* Google Authentication divider and button */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-slate-200 w-full absolute"></div>
          <span className="bg-white px-4 text-[10px] font-bold text-slate-400 z-10 relative uppercase tracking-wider">or continue with</span>
        </div>

        <div className="w-full flex justify-center">
          {isDemoMode ? (
            <button
              onClick={handleDemoGoogleLogin}
              type="button"
              className="w-full max-w-[384px] flex items-center justify-center space-x-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99] text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.1h3.97c2.33-2.14 3.57-5.3 3.57-8.72z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.97-3.1a7.18 7.18 0 0 1-11.99-3.77H1.93v3.2c1.98 3.93 6.03 6.58 10.07 6.58z" />
                <path fill="#FBBC05" d="M6 14.22a7.24 7.24 0 0 1 0-4.44V6.58H1.93a12 12 0 0 0 0 10.84L6 14.22z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.6 4.6 1.8l3.43-3.43A11.96 11.96 0 0 0 12 0C7.97 0 3.92 2.65 1.93 6.58L6 9.78a7.18 7.18 0 0 1 6-5.03z" />
              </svg>
              <span>Sign In with Google</span>
            </button>
          ) : (
            <div id="google-signin-btn" className="w-full max-w-[384px]"></div>
          )}
        </div>

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

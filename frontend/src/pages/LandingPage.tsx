import React from 'react';
import { Sparkles, Compass, Shield, Layers, ArrowRight, Server, Database } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onRegisterClick }) => {
  return (
    <div className="min-h-screen w-screen bg-slate-50 text-slate-800 flex flex-col justify-between overflow-x-hidden font-sans relative">
      
      {/* Background Decorative Mesh Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Header bar */}
      <header className="glass-panel border-b border-slate-200/80 px-8 py-4 flex items-center justify-between z-10 sticky top-0 bg-white/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            1P
          </div>
          <div>
            <h1 className="font-extrabold text-slate-800 text-base tracking-tight leading-none">One Point Solutions</h1>
            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Event Tech Rental</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={onLoginClick} 
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button 
            onClick={onRegisterClick} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-lg shadow-indigo-500/15"
          >
            Create Account
          </button>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-5xl mx-auto space-y-12 z-10">
        
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full text-xs text-indigo-600 font-bold uppercase tracking-wider animate-bounce">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Inventory Bundle Optimizer</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-slate-900">
            Optimize Event Technology <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600">
              Rentals in Real-Time
            </span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            One Point Solutions helps event coordinators instantly map attendee sizes, venue spaces, and budget constraints into cost-efficient, fully-booked hardware bundles.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onRegisterClick}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer group"
          >
            <span>Launch Bundle Optimizer</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-100/10 transition-all bg-white/70">
            <Compass className="w-8 h-8 text-indigo-600 mb-4" />
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">AI Recommendation</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Input attendee count, type of event, venue scale, and target budget. Our responsive model crafts optimized bundles for Audio, Video, and Lighting.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-200 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-100/10 transition-all bg-white/70">
            <Layers className="w-8 h-8 text-emerald-600 mb-4" />
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Live Availability Check</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Real-time checks query calendar date overlaps to compute exact available stock quantities before finalizing quote calculations.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-200 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-100/10 transition-all bg-white/70">
            <Shield className="w-8 h-8 text-violet-600 mb-4" />
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Role-Based Dashboard</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Separate view controllers protect administrative billing statistics, warehouse inventory managers, and customer quote histories.
            </p>
          </div>

        </div>

      </main>

      {/* Footer bar */}
      <footer className="border-t border-slate-200 bg-white/60 px-8 py-6 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-slate-400" />
            <span>Node.js + Express API</span>
            <span className="text-slate-300">|</span>
            <Database className="w-4 h-4 text-slate-400" />
            <span>MySQL Schema</span>
          </div>
          <p>© 2026 One Point Solutions LLC. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;

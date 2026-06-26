import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, HelpCircle } from 'lucide-react';

interface NavbarProps {
  title: string;
}

const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="glass-panel border-b border-slate-200/60 h-16 flex items-center justify-between px-8 z-10 bg-white/60">
      <div className="flex items-center space-x-3">
        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">{title}</h2>
      </div>

      <div className="flex items-center space-x-6">
        <button className="text-slate-500 hover:text-indigo-600 transition-colors" title="Documentation">
          <HelpCircle className="w-5 h-5" />
        </button>
        <button className="text-slate-500 hover:text-indigo-600 transition-colors relative" title="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>

        <div className="h-6 w-px bg-slate-200"></div>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-600 text-sm">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="text-sm font-semibold text-slate-700 hidden sm:inline-block">{user?.username}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, 
  Wrench, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Layers, 
  LogOut,
  Sliders,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  
  if (!user) return null;

  const getRoleLabel = () => {
    switch (user.role) {
      case 'admin':
        return 'System Administrator';
      case 'inventory_manager':
        return 'Inventory Manager';
      default:
        return 'Event Organizer';
    }
  };

  const navItems = [
    // Customer Tabs
    {
      id: 'catalog',
      label: 'Browse Equipment Catalog',
      icon: ShoppingCart,
      roles: ['customer']
    },
    {
      id: 'customer_dashboard',
      label: 'My Dashboard',
      icon: LayoutDashboard,
      roles: ['customer']
    },
    
    // Inventory Manager Tabs
    {
      id: 'inventory_dashboard',
      label: 'Inventory Dashboard',
      icon: Layers,
      roles: ['inventory_manager']
    },
    {
      id: 'equipment_manager',
      label: 'Manage Equipment',
      icon: Sliders,
      roles: ['inventory_manager']
    },

    // Admin Tabs
    {
      id: 'admin_dashboard',
      label: 'Analytics Suite',
      icon: TrendingUp,
      roles: ['admin']
    },
    {
      id: 'admin_quotes',
      label: 'All Quotes',
      icon: FileText,
      roles: ['admin']
    },
    {
      id: 'admin_bookings',
      label: 'All Bookings',
      icon: Calendar,
      roles: ['admin']
    },
    {
      id: 'admin_equipment',
      label: 'Global Equipment',
      icon: Wrench,
      roles: ['admin']
    }
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="w-64 glass-panel border-r border-slate-200/80 flex flex-col h-full z-10 bg-white/90">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-slate-200/60">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            1P
          </div>
          <div>
            <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-indigo-900 to-violet-950 text-lg tracking-tight">One Point</h1>
            <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Solutions</p>
          </div>
        </div>
      </div>

      {/* User Information Profile Panel */}
      <div className="px-6 py-5 border-b border-slate-200/40">
        <div className="bg-slate-100/50 rounded-xl p-4 border border-slate-200/80">
          <p className="text-xs text-slate-500">Logged in as</p>
          <h4 className="font-bold text-slate-800 text-sm truncate mt-0.5">{user.username}</h4>
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 uppercase tracking-wide ${
            user.role === 'admin' 
              ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' 
              : user.role === 'inventory_manager'
              ? 'bg-teal-500/10 text-teal-600 border border-teal-500/20'
              : 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
          }`}>
            {getRoleLabel()}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {filteredItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group text-left ${
                isActive 
                  ? 'bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 text-indigo-600 font-bold border-l-4 border-indigo-600 shadow-sm shadow-indigo-100/20' 
                  : 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'}`} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Action */}
      <div className="p-4 border-t border-slate-200/60">
        <button
          onClick={() => setShowConfirmLogout(true)}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/5 transition-colors duration-200 text-left font-medium cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>

      {/* Centered Logout Confirmation Modal */}
      {showConfirmLogout && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200/80 shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500 shadow-sm">
                <LogOut className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">Sign Out</h3>
                <p className="text-xs text-slate-500">Are you sure you want to sign out of your account?</p>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmLogout(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    setShowConfirmLogout(false);
                    logout();
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Yes, Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
};

export default Sidebar;

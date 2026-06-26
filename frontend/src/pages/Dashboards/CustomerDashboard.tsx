import React, { useState, useEffect } from 'react';
import { quoteService, bookingService } from '../../services/api';
import MetricCard from '../../components/MetricCard';
import { 
  Compass, 
  FileText, 
  Calendar, 
  TrendingUp, 
  ArrowRight, 
  Eye
} from 'lucide-react';

interface CustomerDashboardProps {
  onNavigateToTab: (tab: string) => void;
  onViewQuote: (id: number) => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onNavigateToTab, onViewQuote }) => {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quotesData, bookingsData] = await Promise.all([
          quoteService.getAll(),
          bookingService.getAll()
        ]);
        setQuotes(quotesData);
        setBookings(bookingsData);
      } catch (error) {
        console.error('Failed to load dashboard metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute stat card calculations
  const pendingQuotes = quotes.filter(q => q.status === 'draft').length;
  const activeBookingsCount = bookings.filter(b => ['confirmed', 'in_progress'].includes(b.status)).length;
  const totalInvested = bookings
    .filter(b => ['confirmed', 'in_progress', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + parseFloat(b.total || '0'), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Organizer <span className="text-indigo-600">Dashboard</span></h1>
        <p className="text-sm text-slate-600 mt-1">Review your technology rentals, active estimates, and logistics statuses</p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Active Bookings"
          value={activeBookingsCount}
          icon={Calendar}
          description="Hardware confirmed/en-route"
          color="indigo"
        />
        <MetricCard
          title="Quotes Awaiting Approval"
          value={pendingQuotes}
          icon={FileText}
          description="Draft estimates available"
          color="amber"
        />
        <MetricCard
          title="Total Rentals Investment"
          value={`₹${totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          description="Confirmed equipment hires"
          color="emerald"
        />
      </div>

      {/* Main split: Quotes & Booking Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Quotes panel */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 bg-white/80">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Active Estimates awaiting review</h3>
              <p className="text-xs text-slate-500">Approve estimates to automatically secure gear rentals</p>
            </div>
            <button
              onClick={() => onNavigateToTab('catalog')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <span>Browse Catalog</span>
              <Compass className="w-3.5 h-3.5" />
            </button>
          </div>

          {quotes.filter(q => q.status === 'draft').length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p>No active quotes awaiting review.</p>
              <button
                onClick={() => onNavigateToTab('catalog')}
                className="mt-4 bg-indigo-50 hover:bg-indigo-100/50 text-indigo-600 px-4 py-2 rounded-xl border border-indigo-100 cursor-pointer font-bold shadow-sm"
              >
                Create New Quote Estimate
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.filter(q => q.status === 'draft').slice(0, 4).map((q) => (
                <div 
                  key={q.id} 
                  className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 flex items-center justify-between hover:border-slate-300 transition-all group hover:bg-slate-50"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate max-w-[200px] sm:max-w-xs">{q.event_name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {new Date(q.start_date).toLocaleDateString()} to {new Date(q.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-bold text-emerald-600 text-sm">₹{parseFloat(q.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <button
                      onClick={() => onViewQuote(q.id)}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-indigo-600 hover:text-white hover:bg-indigo-600 transition-all cursor-pointer shadow-sm"
                      title="Review Invoice"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking history tracker panel */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 bg-white/80">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Booking Timeline</h3>
              <p className="text-xs text-slate-500">Recent reservations and operational status</p>
            </div>
            <button
              onClick={() => onNavigateToTab('admin_bookings')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <span>View Registry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p>No confirmed bookings yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.slice(0, 3).map((b) => (
                <div 
                  key={b.id}
                  className="relative pl-6 pb-2 border-l border-slate-200 last:border-0 last:pb-0"
                >
                  {/* Custom timeline bullet */}
                  <div className={`absolute left-0 top-1.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full border ${
                    b.status === 'confirmed' ? 'bg-emerald-400 border-emerald-500' :
                    b.status === 'in_progress' ? 'bg-indigo-400 border-indigo-500 animate-ping' :
                    b.status === 'completed' ? 'bg-slate-400 border-slate-500' :
                    'bg-amber-400 border-amber-500'
                  }`}></div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{b.event_name}</h4>
                        <p className="text-[9px] text-slate-500 mt-0.5">Dates: {new Date(b.start_date).toLocaleDateString()} - {new Date(b.end_date).toLocaleDateString()}</p>
                      </div>
                      <span className={`inline-block text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        b.status === 'in_progress' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CustomerDashboard;

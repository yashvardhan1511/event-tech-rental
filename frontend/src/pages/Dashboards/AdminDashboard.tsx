import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/api';
import MetricCard from '../../components/MetricCard';
import { 
  Layers, 
  IndianRupee, 
  Calendar,
  RefreshCw
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [utilizationData, setUtilizationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setRefreshing(true);
      const [rev, util] = await Promise.all([
        analyticsService.getRevenue(),
        analyticsService.getUtilization()
      ]);
      setRevenueData(rev);
      setUtilizationData(util);
    } catch (error) {
      console.error('Failed to load analytics dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(true);

    // Set up 10-second polling interval
    const interval = setInterval(() => {
      fetchAnalytics(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const summary = revenueData?.summary || { totalRevenue: 0, activeBookings: 0, totalEquipment: 0 };
  const monthlyRevenue = revenueData?.monthlyRevenue || [];

  // Helper to draw custom SVG Revenue Bar Chart
  const renderRevenueChart = () => {
    if (monthlyRevenue.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
          No monthly revenue data available. Complete bookings to generate billing logs.
        </div>
      );
    }

    const chartHeight = 200;
    const chartWidth = 500;
    const padding = 40;
    
    // Find max revenue value for scaling
    const maxRevenue = Math.max(...monthlyRevenue.map((d: any) => parseFloat(d.revenue || '0')), 1000);
    
    const barWidth = 40;
    const gap = (chartWidth - padding * 2 - barWidth * monthlyRevenue.length) / (monthlyRevenue.length - 1 || 1);

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="w-full min-w-[450px]">
          {/* Gradients */}
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = chartHeight - ratio * (chartHeight - padding) - padding/2;
            const val = (maxRevenue * ratio).toFixed(0);
            return (
              <g key={idx} className="opacity-40">
                <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3" />
                <text x={padding - 5} y={y + 3} fill="#64748b" fontSize="8" textAnchor="end">₹{parseFloat(val).toLocaleString('en-IN')}</text>
              </g>
            );
          })}

          {/* Render Bars */}
          {monthlyRevenue.map((data: any, idx: number) => {
            const revVal = parseFloat(data.revenue || '0');
            const pct = revVal / maxRevenue;
            const barHeight = pct * (chartHeight - padding * 1.5);
            
            const x = padding + idx * (barWidth + gap);
            const y = chartHeight - barHeight - padding/2;
 
            // Extract month string from YYYY-MM
            const monthLabel = data.month.split('-')[1] ? new Date(2026, parseInt(data.month.split('-')[1]) - 1).toLocaleString('default', { month: 'short' }) : data.month;

            return (
              <g key={idx} className="group">
                {/* Glow bar on hover */}
                <rect 
                  x={x - 2} 
                  y={y - 2} 
                  width={barWidth + 4} 
                  height={barHeight + 4} 
                  rx="6" 
                  fill="#6366f1" 
                  className="opacity-0 group-hover:opacity-10 transition-opacity duration-200" 
                />
                {/* Core Bar */}
                <rect 
                  x={x} 
                  y={y} 
                  width={barWidth} 
                  height={barHeight} 
                  rx="4" 
                  fill="url(#barGradient)" 
                />
                
                {/* Value labels */}
                <text 
                  x={x + barWidth/2} 
                  y={y - 5} 
                  fill="#0f172a" 
                  fontSize="8" 
                  fontWeight="bold"
                  textAnchor="middle" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  ₹{revVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </text>
                
                {/* Bottom Month Tag */}
                <text x={x + barWidth/2} y={chartHeight + 15} fill="#64748b" fontSize="9" textAnchor="middle">{monthLabel}</text>
              </g>
            );
          })}

          {/* Bottom baseline */}
          <line x1={padding} y1={chartHeight - padding/2} x2={chartWidth - padding} y2={chartHeight - padding/2} stroke="#cbd5e1" strokeWidth="1" />
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Analytics <span className="text-indigo-600">Suite</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">Global business dashboard checking revenue analytics, pipeline health, and equipment utilization</p>
        </div>
        <button
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="bg-slate-105 border border-slate-200 hover:bg-slate-200/50 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-2 text-xs cursor-pointer disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 text-slate-550 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Stats'}</span>
        </button>
      </div>

      {/* Metrics Stat counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Confirmed Revenue"
          value={`₹${summary.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={IndianRupee}
          description="Approved client invoices"
          color="emerald"
        />
        <MetricCard
          title="Active Reserved Leases"
          value={summary.activeBookings}
          icon={Calendar}
          description="Confirmed job orders"
          color="indigo"
        />
        <MetricCard
          title="Total Hardware Catalog"
          value={summary.totalEquipment}
          icon={Layers}
          description="Warehouse item profiles"
          color="violet"
        />
      </div>

      {/* Grid: Revenue Chart vs Equipment utilization list */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Revenue chart block */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 lg:col-span-3 bg-white">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h3 className="font-bold text-slate-800 text-base">Monthly Billing Performance</h3>
            <p className="text-xs text-slate-500">Gross billing income logged by confirmed event orders</p>
          </div>
          {renderRevenueChart()}
        </div>

        {/* Utilization tracking block */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 lg:col-span-2 bg-white">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h3 className="font-bold text-slate-800 text-base">Equipment Utilization Rates</h3>
            <p className="text-xs text-slate-500">Ratio of rented units to total warehouse stock</p>
          </div>

          {utilizationData.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No equipment utilization data recorded. Check again once bookings contain catalog items.
            </div>
          ) : (
            <div className="space-y-4">
              {utilizationData.slice(0, 5).map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate max-w-[180px]">{item.name}</span>
                    <span className="text-indigo-600 font-bold">{item.utilization_rate}%</span>
                  </div>
                  
                  {/* Utilization Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${
                        parseFloat(item.utilization_rate) > 75 
                          ? 'from-indigo-500 to-violet-600' 
                          : parseFloat(item.utilization_rate) > 40 
                          ? 'from-emerald-500 to-teal-500' 
                          : 'from-amber-500 to-orange-500'
                      }`}
                      style={{ width: `${Math.min(100, parseFloat(item.utilization_rate))}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Category: {item.category}</span>
                    <span>Allocated: {item.total_rented} / {item.total_quantity} units</span>
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

export default AdminDashboard;


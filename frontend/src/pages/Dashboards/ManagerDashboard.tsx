import React, { useState, useEffect } from 'react';
import { equipmentService, bookingService } from '../../services/api';
import MetricCard from '../../components/MetricCard';
import { 
  Layers, 
  Wrench, 
  AlertTriangle,
  Calendar,
  Sliders,
  AlertCircle
} from 'lucide-react';

interface ManagerDashboardProps {
  onNavigateToTab: (tab: string) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigateToTab }) => {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [equipData, bookingsData] = await Promise.all([
          equipmentService.getAll(),
          bookingService.getAll()
        ]);
        setEquipment(equipData);
        setBookings(bookingsData);
      } catch (error) {
        console.error('Failed to fetch manager metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute metrics
  const totalItems = equipment.length;
  const activeCount = equipment.filter(e => e.status === 'active').length;
  const maintenanceCount = equipment.filter(e => e.status === 'maintenance').length;
  
  // Total reservations count
  const activeRentals = bookings.filter(b => ['confirmed', 'in_progress'].includes(b.status)).length;

  // Filter items needing attention (under maintenance or low availability)
  const attentionItems = equipment.filter(e => 
    e.status === 'maintenance' || e.available_quantity === 0
  );

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Warehouse <span className="text-indigo-600">Console</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">Audit active inventory allocations, maintenance status, and stock levels</p>
        </div>
        <button
          onClick={() => onNavigateToTab('equipment_manager')}
          className="bg-slate-105 border border-slate-200 hover:bg-slate-200/50 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-2 text-xs cursor-pointer shadow-sm"
        >
          <Sliders className="w-4 h-4 text-slate-500" />
          <span>Configure Inventory</span>
        </button>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Hardware Profiles"
          value={totalItems}
          icon={Layers}
          color="indigo"
        />
        <MetricCard
          title="Active in Catalogue"
          value={activeCount}
          icon={Calendar}
          color="emerald"
        />
        <MetricCard
          title="Under Maintenance"
          value={maintenanceCount}
          icon={Wrench}
          color="amber"
        />
        <MetricCard
          title="Active Reserved Deliveries"
          value={activeRentals}
          icon={AlertTriangle}
          color="violet"
        />
      </div>

      {/* Alert panels and lists */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Items needing attention */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span>Stock Alerts & Maintenance Logs</span>
            </h3>
            <p className="text-xs text-slate-500">Inventory profiles marked under maintenance or currently at zero available stock</p>
          </div>

          {attentionItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <p>All rental hardware is active with healthy warehouse stock levels.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Equipment Profile</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Total Stock</th>
                    <th className="py-3 px-4 text-center">Available</th>
                    <th className="py-3 px-4">Problem Flag</th>
                    <th className="py-3 px-4 text-right">Modify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attentionItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3.5 px-4 text-slate-550">{item.category}</td>
                      <td className="py-3.5 px-4 text-center font-semibold">{item.total_quantity}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-bold ${item.available_quantity === 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                          {item.available_quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.status === 'maintenance' ? (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">Service Required</span>
                        ) : (
                          <span className="text-xs text-rose-650 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold">Fully Allocated</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onNavigateToTab('equipment_manager')}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          Modify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ManagerDashboard;


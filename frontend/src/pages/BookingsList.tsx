import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  RefreshCw, 
  Search,
  Eye,
  AlertCircle
} from 'lucide-react';

interface BookingsListProps {
  onViewDetails?: (quoteId: number) => void;
}

const BookingsList: React.FC<BookingsListProps> = ({ onViewDetails }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getAll();
      setBookings(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error retrieving booking registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id: number, status: string, paymentStatus: string) => {
    try {
      await bookingService.updateStatus(id, status, paymentStatus);
      await fetchBookings(); // Refresh registry
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update booking.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'in_progress':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse';
      case 'completed':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'partially_paid':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border border-rose-200';
    }
  };

  // Filter lists
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.event_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading && bookings.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Booking <span className="text-indigo-600">Management</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {user?.role === 'customer' 
            ? 'Track your event logistics, approvals, and invoice payments' 
            : 'Track client deliveries, update job statuses, and reconcile invoices'}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between glass-panel p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event or client..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-slate-800 text-xs bg-white border border-slate-200"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl glass-input text-slate-700 text-xs cursor-pointer bg-white border border-slate-200 w-full sm:w-44"
          >
            <option value="all">All Booking Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button 
            onClick={fetchBookings}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-550 hover:text-slate-800 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Registry Table */}
      <div className="glass-panel rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="font-bold text-sm text-slate-700">No bookings found</p>
            <p className="text-xs text-slate-500 mt-1">Confirmed quotes will populate this listing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Event Name</th>
                  {user?.role !== 'customer' && <th className="py-4 px-6">Client</th>}
                  <th className="py-4 px-6">Event Dates</th>
                  <th className="py-4 px-6">Total cost</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Payment</th>
                  {user?.role !== 'customer' ? (
                    <th className="py-4 px-6 text-right">Job Management Actions</th>
                  ) : (
                    <th className="py-4 px-6 text-right">Details</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <span className="font-bold text-slate-900">{booking.event_name}</span>
                        <span className="block text-[10px] text-indigo-600 font-semibold uppercase mt-0.5">{booking.event_type}</span>
                      </div>
                    </td>
                    {user?.role !== 'customer' && (
                      <td className="py-4 px-6 font-semibold text-slate-650">@{booking.username}</td>
                    )}
                    <td className="py-4 px-6 text-xs text-slate-500">
                      <div>
                        <span>{new Date(booking.start_date).toLocaleDateString()}</span>
                        <span className="text-slate-400 px-1">to</span>
                        <span>{new Date(booking.end_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-emerald-600 text-sm">
                      ₹{parseFloat(booking.total || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getPaymentBadge(booking.payment_status)}`}>
                        {booking.payment_status}
                      </span>
                    </td>
                    
                    {/* Management Dropdowns for Admins/Managers, View button for customers */}
                    <td className="py-4 px-6 text-right">
                      {user && ['admin', 'inventory_manager'].includes(user.role) ? (
                        <div className="flex items-center justify-end space-x-2">
                          {/* Booking status dropdown */}
                          <select
                            value={booking.status}
                            onChange={(e) => handleUpdateStatus(booking.id, e.target.value, booking.payment_status)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg px-2 py-1 cursor-pointer focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>

                          {/* Payment status dropdown */}
                          <select
                            value={booking.payment_status}
                            onChange={(e) => handleUpdateStatus(booking.id, booking.status, e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg px-2 py-1 cursor-pointer focus:outline-none"
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="partially_paid">Partial</option>
                            <option value="paid">Paid</option>
                          </select>

                          {onViewDetails && (
                            <button
                              onClick={() => onViewDetails(booking.quote_id)}
                              className="p-1.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-650 hover:bg-indigo-100 cursor-pointer"
                              title="Inspect Invoice"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        onViewDetails && (
                          <button
                            onClick={() => onViewDetails(booking.quote_id)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer justify-end ml-auto"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Inspect</span>
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsList;

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/Dashboards/CustomerDashboard';
import ManagerDashboard from './pages/Dashboards/ManagerDashboard';
import AdminDashboard from './pages/Dashboards/AdminDashboard';
import EquipmentCatalogCart from './pages/EquipmentCatalogCart';
import QuoteDetails from './pages/QuoteDetails';
import BookingsList from './pages/BookingsList';
import InventoryManager from './pages/InventoryManager';
import { quoteService } from './services/api';
import { FileText, Eye, AlertCircle } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Navigation states
  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'register'>('landing');
  const [currentTab, setCurrentTab] = useState<string>('');
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
  const [revisionQuoteData, setRevisionQuoteData] = useState<any | null>(null);

  // Quotes list registry (used for Admin All Quotes view)
  const [allQuotes, setAllQuotes] = useState<any[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesError, setQuotesError] = useState('');

  // Handle default tab initialization on login
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'customer') {
        setCurrentTab('catalog');
      } else if (user.role === 'inventory_manager') {
        setCurrentTab('inventory_dashboard');
      } else if (user.role === 'admin') {
        setCurrentTab('admin_dashboard');
      }
    } else {
      setCurrentTab('');
    }
  }, [isAuthenticated, user]);

  // Fetch all quotes for Admin Quotes panel
  useEffect(() => {
    if (currentTab === 'admin_quotes' && user?.role === 'admin') {
      const fetchQuotes = async () => {
        try {
          setQuotesLoading(true);
          const data = await quoteService.getAll();
          setAllQuotes(data);
        } catch (error) {
          setQuotesError('Failed to retrieve quote database.');
        } finally {
          setQuotesLoading(false);
        }
      };
      fetchQuotes();
    }
  }, [currentTab, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // 1. Unauthenticated Router Flow
  if (!isAuthenticated) {
    if (authMode === 'login') {
      return (
        <Login 
          onToggleAuthMode={() => setAuthMode('register')} 
          onLoginSuccess={(role) => {
            setAuthMode('landing');
            // Role tab redirects
            if (role === 'customer') setCurrentTab('catalog');
            else if (role === 'inventory_manager') setCurrentTab('inventory_dashboard');
            else setCurrentTab('admin_dashboard');
          }}
        />
      );
    }
    if (authMode === 'register') {
      return (
        <Register 
          onToggleAuthMode={() => setAuthMode('login')} 
          onRegisterSuccess={(role) => {
            setAuthMode('landing');
            if (role === 'customer') setCurrentTab('catalog');
            else if (role === 'inventory_manager') setCurrentTab('inventory_dashboard');
            else setCurrentTab('admin_dashboard');
          }}
        />
      );
    }
    return (
      <LandingPage 
        onLoginClick={() => setAuthMode('login')} 
        onRegisterClick={() => setAuthMode('register')} 
      />
    );
  }

  // 2. Authenticated Router Flow
  const activeTab = currentTab || (user ? (user.role === 'customer' ? 'catalog' : user.role === 'inventory_manager' ? 'inventory_dashboard' : 'admin_dashboard') : '');

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'catalog': return 'Browse Equipment Catalog';
      case 'customer_dashboard': return 'My Dashboard';
      case 'inventory_dashboard': return 'Warehouse Stats';
      case 'equipment_manager': return 'Inventory Manager';
      case 'admin_dashboard': return 'Analytics Suite';
      case 'admin_quotes': return 'All Quotes';
      case 'admin_bookings': return 'Booking Logs';
      case 'admin_equipment': return 'Equipment Catalogue';
      case 'quote_details': return 'Invoice View';
      default: return 'One Point Solutions';
    }
  };

  const renderActiveTab = (tab: string) => {
    switch (tab) {
      // Customer Views
      case 'catalog':
        return (
          <EquipmentCatalogCart 
            initialQuoteData={revisionQuoteData}
            onQuoteGenerated={(id) => {
              setSelectedQuoteId(id);
              setCurrentTab('quote_details');
              setRevisionQuoteData(null);
            }} 
          />
        );
      case 'customer_dashboard':
        return (
          <CustomerDashboard 
            onNavigateToTab={setCurrentTab} 
            onViewQuote={(id) => {
              setSelectedQuoteId(id);
              setCurrentTab('quote_details');
            }} 
          />
        );
      
      // Manager Views
      case 'inventory_dashboard':
        return <ManagerDashboard onNavigateToTab={setCurrentTab} />;
      case 'equipment_manager':
        return <InventoryManager />;

      // Admin Views
      case 'admin_dashboard':
        return <AdminDashboard />;
      case 'admin_bookings':
        return (
          <BookingsList 
            onViewDetails={(quoteId) => {
              setSelectedQuoteId(quoteId);
              setCurrentTab('quote_details');
            }} 
          />
        );
      case 'admin_equipment':
        return <InventoryManager />;
      case 'admin_quotes':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quotes <span className="text-indigo-600">Database</span></h1>
              <p className="text-sm text-slate-600 mt-1">Audit customer estimate packages and pricing terms</p>
            </div>
            
            {quotesError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{quotesError}</span>
              </div>
            )}

            <div className="glass-panel rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              {quotesLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : allQuotes.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="font-bold text-sm text-slate-700">No Quotes Available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-4 px-6">Quote ID</th>
                        <th className="py-4 px-6">Event Name</th>
                        <th className="py-4 px-6">Customer</th>
                        <th className="py-4 px-6">Rental Total</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {allQuotes.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6 font-semibold text-slate-500">#OPS-26-{q.id}</td>
                          <td className="py-4 px-6 font-bold text-slate-900">{q.event_name}</td>
                          <td className="py-4 px-6 text-slate-600">@{q.username}</td>
                          <td className="py-4 px-6 font-bold text-emerald-600">₹{parseFloat(q.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              q.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              q.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            }`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => {
                                setSelectedQuoteId(q.id);
                                setCurrentTab('quote_details');
                              }}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 justify-end ml-auto cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Inspect</span>
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
        );

      // Quote detail view
      case 'quote_details':
        return (
          <QuoteDetails 
            quoteId={selectedQuoteId!} 
            onBack={() => {
              // Return to correct registry based on role
              if (user?.role === 'customer') {
                setCurrentTab('customer_dashboard');
              } else {
                setCurrentTab('admin_quotes');
              }
            }} 
            onBookingConfirmed={() => {
              if (user?.role === 'customer') {
                setCurrentTab('customer_dashboard');
              } else {
                setCurrentTab('admin_bookings');
              }
            }}
            onReviseQuote={(quoteData) => {
              setRevisionQuoteData(quoteData);
              setCurrentTab('catalog');
            }}
          />
        );

      default:
        return (
          <div className="p-8 text-center text-slate-500">
            Select a tab option from the sidebar.
          </div>
        );
    }
  };

  return (
    <Layout currentTab={activeTab} setCurrentTab={setCurrentTab} title={getTabTitle(activeTab)}>
      {renderActiveTab(activeTab)}
    </Layout>
  );
};

// Main App component wrapping with Auth Context Provider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

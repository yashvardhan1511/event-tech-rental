import React, { useState, useEffect } from 'react';
import { equipmentService, quoteService, recommendationService } from '../services/api';
import { 
  ShoppingBag, 
  Trash2, 
  Sparkles, 
  Calendar, 
  Users, 
  MapPin, 
  ArrowRight,
  TrendingDown,
  AlertCircle,
  Check
} from 'lucide-react';

interface EquipmentCatalogCartProps {
  initialQuoteData?: any;
  onQuoteGenerated: (quoteId: number) => void;
}

interface CartItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  daily_rate: number;
  available_quantity: number;
}

// Heuristic Recommendation Engine
const generateRecommendations = (type: string, attendees: number, catalog: any[]): CartItem[] => {
  const recommendations: { name: string; quantityFormula: (att: number) => number }[] = [];

  const addRec = (name: string, quantityFormula: (att: number) => number) => {
    recommendations.push({ name, quantityFormula });
  };

  switch (type) {
    case 'Concert':
    case 'Concert / Musical Event':
      addRec("L'Acoustics K2 Line Array Speaker", (att) => Math.max(2, Math.ceil(att / 50) * 2));
      addRec("L'Acoustics SB28 Subwoofer", (att) => Math.max(1, Math.ceil(att / 100) * 2));
      addRec("Yamaha CL5 Digital Mixing Console", () => 1);
      addRec("Shure QLXD24/SM58 Wireless Microphone", (att) => Math.max(2, Math.ceil(att / 100)));
      addRec("Robe MegaPointe Moving Head Beam/Spot", (att) => Math.max(4, Math.ceil(att / 25)));
      addRec("GrandMA3 Compact XT Console", () => 1);
      addRec("Steeldeck 4' x 8' Stage Platform Deck", (att) => Math.max(2, Math.ceil(att / 100) * 2));
      addRec("Prolyte H30V Heavy Duty Truss (10ft)", (att) => Math.max(4, Math.ceil(att / 50)));
      break;

    case 'Conference':
    case 'Corporate':
    case 'Corporate Meeting':
      addRec("Barco UDX-4K32 Laser Projector", () => 1);
      addRec("Projecta 16:9 Fast-Fold Screen (14x8ft)", () => 1);
      addRec("Apple MacBook Pro 16\" (M3 Pro)", (att) => Math.max(1, Math.ceil(att / 150)));
      addRec("Shure QLXD24/SM58 Wireless Microphone", () => 2);
      addRec("Shure MX418 Gooseneck Podium Mic", () => 1);
      addRec("QSC K12.2 Active Loudspeaker", (att) => Math.max(2, Math.ceil(att / 80) * 2));
      addRec("Samsung 65\" 4K Display Monitor", (att) => Math.max(1, Math.ceil(att / 100)));
      break;

    case 'Wedding':
    case 'Wedding / Gala':
      addRec("L'Acoustics K2 Line Array Speaker", () => 2);
      addRec("Shure QLXD24/SM58 Wireless Microphone", () => 2);
      addRec("Chauvet DJ Freedom Par Uplight", (att) => Math.max(8, Math.ceil(att / 15)));
      addRec("Robe MegaPointe Moving Head Beam/Spot", () => 4);
      addRec("Steeldeck 4' x 8' Stage Platform Deck", () => 2);
      break;

    case 'Exhibition':
    case 'Exhibition / Trade Show':
      addRec("Samsung 65\" 4K Display Monitor", (att) => Math.max(2, Math.ceil(att / 50)));
      addRec("Apple iPad Pro 12.9\" with Floor Stand", (att) => Math.max(2, Math.ceil(att / 30)));
      addRec("Chauvet DJ Freedom Par Uplight", (att) => Math.max(4, Math.ceil(att / 20)));
      break;

    default:
      addRec("QSC K12.2 Active Loudspeaker", () => 2);
      addRec("Shure QLXD24/SM58 Wireless Microphone", () => 1);
      break;
  }

  const result: CartItem[] = [];
  recommendations.forEach(rec => {
    const catalogItem = catalog.find(item => item.name.toLowerCase() === rec.name.toLowerCase() && item.status === 'active');
    if (catalogItem) {
      const suggestedQty = rec.quantityFormula(attendees);
      const limitQty = Math.min(suggestedQty, parseInt(catalogItem.available_quantity?.toString() || '0', 10));
      if (limitQty > 0) {
        result.push({
          id: catalogItem.id,
          name: catalogItem.name,
          category: catalogItem.category,
          quantity: limitQty,
          daily_rate: parseFloat(catalogItem.daily_rate),
          available_quantity: parseInt(catalogItem.available_quantity?.toString() || '0', 10)
        });
      }
    }
  });

  return result;
};

const EquipmentCatalogCart: React.FC<EquipmentCatalogCartProps> = ({ initialQuoteData, onQuoteGenerated }) => {
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Configuration flow state
  const [isConfigured, setIsConfigured] = useState(false);

  // Event Details states
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('Conference');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTomorrowString());
  const [attendees, setAttendees] = useState(100);
  const [venueSize, setVenueSize] = useState('medium');
  const [specialRequirements, setSpecialRequirements] = useState('');

  const handleAttendeesChange = (val: number) => {
    setAttendees(val);
    if (val <= 0) return;
    
    // Auto-select venue size based on attendees count
    if (val < 250) {
      setVenueSize('small');
    } else if (val < 500) {
      setVenueSize('medium');
    } else if (val < 750) {
      setVenueSize('large');
    } else {
      setVenueSize('outdoor');
    }
  };

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subcatFilter, setSubcatFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');

  // Helper to extract brand from name
  const getBrand = (name: string): string => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes("l'acoustics")) return "L'Acoustics";
    if (nameLower.includes("shure")) return "Shure";
    if (nameLower.includes("yamaha")) return "Yamaha";
    if (nameLower.includes("qsc")) return "QSC";
    if (nameLower.includes("barco")) return "Barco";
    if (nameLower.includes("projecta")) return "Projecta";
    if (nameLower.includes("absen")) return "Absen";
    if (nameLower.includes("samsung")) return "Samsung";
    if (nameLower.includes("robe")) return "Robe";
    if (nameLower.includes("chauvet")) return "Chauvet";
    if (nameLower.includes("grandma") || nameLower.includes("ma lighting")) return "GrandMA";
    if (nameLower.includes("steeldeck")) return "Steeldeck";
    if (nameLower.includes("prolyte")) return "Prolyte";
    if (nameLower.includes("apple")) return "Apple";
    return "Other";
  };

  // Helper to get subcategory from item
  const getSubcategory = (item: any): string => {
    const nameLower = item.name.toLowerCase();
    if (nameLower.includes("laptop") || nameLower.includes("macbook")) return "laptops";
    if (nameLower.includes("speaker") || nameLower.includes("subwoofer") || nameLower.includes("loudspeaker")) return "speakers";
    if (nameLower.includes("microphone") || nameLower.includes("mic")) return "microphones";
    if (nameLower.includes("display") || nameLower.includes("monitor") || nameLower.includes("projector") || nameLower.includes("screen") || nameLower.includes("panel") || nameLower.includes("ipad") || nameLower.includes("tablet")) return "displays";
    if (nameLower.includes("light") || nameLower.includes("beam") || nameLower.includes("spot") || nameLower.includes("leko")) return "lighting";
    if (nameLower.includes("stage") || nameLower.includes("deck") || nameLower.includes("truss")) return "stage";
    return item.category.toLowerCase();
  };

  // Calculate rental duration in days
  const getDurationDays = () => {
    if (!startDate || !endDate) return 0;
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  };

  const durationDays = getDurationDays();

  // Load initial quote details for revision if provided
  useEffect(() => {
    if (initialQuoteData) {
      setEventName(initialQuoteData.event_name || '');
      setEventType(initialQuoteData.event_type || 'Conference');
      
      const start = initialQuoteData.start_date ? new Date(initialQuoteData.start_date).toISOString().split('T')[0] : getTodayString();
      const end = initialQuoteData.end_date ? new Date(initialQuoteData.end_date).toISOString().split('T')[0] : getTomorrowString();
      setStartDate(start);
      setEndDate(end);
      
      setAttendees(initialQuoteData.attendees || 100);
      setVenueSize(initialQuoteData.venue_size || 'medium');
      setSpecialRequirements(initialQuoteData.special_requirements || '');
      
      const details = initialQuoteData.bundle_details || [];
      const initialCart: CartItem[] = details.map((d: any) => ({
        id: d.equipment_id,
        name: d.name,
        category: d.category,
        quantity: d.quantity,
        daily_rate: parseFloat(d.daily_rate),
        available_quantity: d.available_quantity || d.quantity
      }));
      setCart(initialCart);
      setIsConfigured(true);
    }
  }, [initialQuoteData]);

  // Fetch equipment availability whenever dates change
  useEffect(() => {
    const fetchCatalog = async () => {
      setError('');
      setLoading(true);
      try {
        if (startDate && endDate && new Date(startDate) <= new Date(endDate)) {
          const data = await equipmentService.getAll(startDate, endDate);
          setEquipmentList(data);
        } else {
          const data = await equipmentService.getAll();
          setEquipmentList(data);
        }
      } catch (err: any) {
        setError('Failed to retrieve inventory catalog.');
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [startDate, endDate]);

  // Adjust cart items when dates/duration changes to ensure availability bounds are correct
  useEffect(() => {
    if (cart.length > 0 && equipmentList.length > 0) {
      setCart(prevCart => {
        return prevCart.map(cartItem => {
          const inventoryItem = equipmentList.find(e => e.id === cartItem.id);
          if (inventoryItem) {
            const avail = inventoryItem.available_quantity;
            return {
              ...cartItem,
              available_quantity: avail,
              quantity: Math.min(cartItem.quantity, avail)
            };
          }
          return cartItem;
        }).filter(item => item.available_quantity > 0);
      });
    }
  }, [equipmentList]);

  // Generate Recommendations Trigger
  const handleGenerateSetup = async () => {
    if (!eventName.trim()) {
      setError('Please enter an event name first.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please select rental start and end dates.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await recommendationService.getRecommendations({
        type: eventType,
        attendees,
        venue_size: venueSize,
        budget: null,
        start_date: startDate,
        end_date: endDate,
        event_name: eventName,
        special_requirements: specialRequirements
      });

      const bundle = data.bundles?.professional || data.bundles?.essential || data.bundles?.deluxe;
      if (bundle && Array.isArray(bundle.items) && bundle.items.length > 0) {
        const initialCart = bundle.items.map((item: any) => {
          const catalogItem = equipmentList.find(e => e.id === item.equipment_id);
          const avail = catalogItem ? parseInt(catalogItem.available_quantity?.toString() || '0', 10) : item.quantity;
          return {
            id: item.equipment_id,
            name: item.name,
            category: item.category,
            quantity: Math.min(item.quantity, avail),
            daily_rate: parseFloat(item.daily_rate),
            available_quantity: avail
          };
        }).filter((item: any) => item.available_quantity > 0);
        
        setCart(initialCart);
      } else {
        const fallback = generateRecommendations(eventType, attendees, equipmentList);
        setCart(fallback);
      }
      setIsConfigured(true);
    } catch (err: any) {
      console.warn('Could not generate dynamic setup from Gemini API, using offline heuristics.', err);
      const fallback = generateRecommendations(eventType, attendees, equipmentList);
      setCart(fallback);
      setIsConfigured(true);
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const handleAddToCart = (item: any, qty: number) => {
    if (!startDate || !endDate) {
      setError('Please select event rental dates first.');
      return;
    }
    const quantityToAdd = parseInt(qty.toString(), 10);
    if (quantityToAdd <= 0) return;

    setError('');
    const existing = cart.find(c => c.id === item.id);
    const available = parseInt(item.available_quantity?.toString() || '0', 10);

    if (existing) {
      const newQty = existing.quantity + quantityToAdd;
      if (newQty > available) {
        setError(`Only ${available} units of ${item.name} are available for these dates.`);
        return;
      }
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: newQty } : c));
    } else {
      if (quantityToAdd > available) {
        setError(`Only ${available} units of ${item.name} are available for these dates.`);
        return;
      }
      setCart([...cart, {
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: quantityToAdd,
        daily_rate: parseFloat(item.daily_rate),
        available_quantity: available
      }]);
    }
  };

  // Update quantity directly in cart
  const handleUpdateCartQty = (id: number, qty: number) => {
    const item = cart.find(c => c.id === id);
    if (!item) return;

    if (qty <= 0) {
      handleRemoveFromCart(id);
      return;
    }

    if (qty > item.available_quantity) {
      setError(`Only ${item.available_quantity} units are available for this item.`);
      return;
    }

    setError('');
    setCart(cart.map(c => c.id === id ? { ...c, quantity: qty } : c));
  };

  const handleRemoveFromCart = (id: number) => {
    setCart(cart.filter(c => c.id !== id));
  };

  // Calculations
  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.daily_rate * durationDays), 0);
  };

  const getDiscountRate = () => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems >= 10) return 0.10;
    if (totalItems >= 5) return 0.05;
    return 0.0;
  };

  const subtotal = getSubtotal();
  const discountRate = getDiscountRate();
  const discount = subtotal * discountRate;
  const total = subtotal - discount;

  // Checkout Quote Submission
  const handleCheckout = async () => {
    if (!eventName || !startDate || !endDate || cart.length === 0) {
      setError('Please fill in event name, select dates, and select equipment.');
      return;
    }

    setCheckoutLoading(true);
    setError('');

    const bundleDetails = cart.map(item => ({
      equipment_id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      daily_rate: item.daily_rate,
      total_price: item.quantity * item.daily_rate * durationDays
    }));

    try {
      const payload = {
        event_name: eventName,
        event_type: eventType,
        start_date: startDate,
        end_date: endDate,
        attendees,
        venue_size: venueSize,
        budget: null,
        special_requirements: specialRequirements,
        bundle_details: bundleDetails,
        subtotal,
        discount,
        total
      };

      const res = await quoteService.create(payload);
      onQuoteGenerated(res.quoteId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error generating quote. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Filter lists
  const filteredCatalog = equipmentList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const subcat = getSubcategory(item);
    const matchesSubcat = subcatFilter === 'all' || subcat === subcatFilter;

    const brand = getBrand(item.name);
    const matchesBrand = brandFilter === 'all' || brand.toLowerCase() === brandFilter.toLowerCase();

    const rate = parseFloat(item.daily_rate);
    let budgetTier = 'budget';
    if (rate > 10000) {
      budgetTier = 'premium';
    } else if (rate > 3000) {
      budgetTier = 'mid';
    }
    const matchesBudget = budgetFilter === 'all' || budgetTier === budgetFilter;

    return matchesSearch && matchesSubcat && matchesBrand && matchesBudget;
  });

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Equipment Rental <span className="text-indigo-600">Optimizer</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">Specify your event parameters to receive a smart AV package, then verify and check out</p>
        </div>
        <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl text-xs text-indigo-600 font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span>INR (₹) Checklist Estimator</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stage 1: Configure Event Settings Only */}
      {!isConfigured ? (
        <div className="max-w-3xl mx-auto glass-panel p-8 rounded-3xl border border-slate-200/80 space-y-6 shadow-xl bg-white/80">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Step 1: Event Logistics Details</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Enter your event specifications below to generate customized hardware suggestions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Event Name</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. OPS Corporate Annual Meet"
                className="w-full px-4 py-3 rounded-xl glass-input text-slate-800 text-sm focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-slate-800 text-sm cursor-pointer bg-white"
              >
                <option value="Conference">Conference</option>
                <option value="Corporate">Corporate Meeting</option>
                <option value="Concert">Concert / Musical Event</option>
                <option value="Wedding">Wedding / Gala</option>
                <option value="Exhibition">Exhibition / Trade Show</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 tracking-wider uppercase">Rental Start Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-slate-700 text-sm cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 tracking-wider uppercase">Rental End Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-slate-700 text-sm cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 tracking-wider uppercase">Attendees Count</label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  value={attendees === 0 ? '' : attendees}
                  onChange={(e) => handleAttendeesChange(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-slate-800 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 tracking-wider uppercase">Venue Size / Scale</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <select
                  value={venueSize}
                  onChange={(e) => setVenueSize(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-slate-700 text-sm cursor-pointer bg-white"
                >
                  <option value="small">Small Room</option>
                  <option value="medium">Medium Hall</option>
                  <option value="large">Large Auditorium</option>
                  <option value="outdoor">Outdoor Ground</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 tracking-wider uppercase">Special Instructions / Logistics Notes</label>
              <textarea
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                placeholder="Any special setup constraints, specific layout designs, or AV requirements..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl glass-input text-slate-800 text-sm resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleGenerateSetup}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-2 text-sm cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Initializing catalog...' : 'Generate Recommended Setup'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Stage 2: Confirmed Event Settings, Show Recommended checklist Catalog & Sidebar */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: Collapsed settings banner & Grid Checklist */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Collapsed Event Details bar */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 shadow-sm">
              <div className="min-w-0">
                <div className="flex items-center space-x-2.5">
                  <h3 className="font-bold text-slate-800 text-base truncate">{eventName}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 uppercase border border-indigo-200 flex-shrink-0">{eventType}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  <span className="text-indigo-600 font-bold">{durationDays} Days</span> ({new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}) 
                  <span className="text-slate-300 px-1.5">|</span> {attendees} attendees 
                  <span className="text-slate-300 px-1.5">|</span> Venue: <span className="capitalize">{venueSize}</span>
                </p>
              </div>
              <button 
                onClick={() => setIsConfigured(false)}
                className="px-4 py-2 border border-slate-200 hover:border-slate-350 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-colors cursor-pointer bg-white shadow-sm"
              >
                Modify Event Settings
              </button>
            </div>

            {/* Catalog Grid Header & Filters */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-600 flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-[10px] text-white">2</span>
                  <span>Equipment Checklist & Quantities</span>
                </h3>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name/desc..."
                    className="px-3 py-2 rounded-xl glass-input text-slate-800 text-xs w-full sm:w-36 bg-white"
                  />
                  
                  {/* Category Filter */}
                  <select
                    value={subcatFilter}
                    onChange={(e) => setSubcatFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl glass-input text-slate-700 text-xs cursor-pointer bg-white"
                  >
                    <option value="all">All Categories</option>
                    <option value="laptops">Laptops</option>
                    <option value="speakers">Speakers</option>
                    <option value="microphones">Microphones</option>
                    <option value="lighting">Lighting</option>
                    <option value="displays">Displays & screens</option>
                    <option value="stage">Stage & rigging</option>
                    <option value="video">Other Video</option>
                    <option value="audio">Other Audio</option>
                  </select>

                  {/* Brand Filter */}
                  <select
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl glass-input text-slate-700 text-xs cursor-pointer bg-white"
                  >
                    <option value="all">All Brands</option>
                    <option value="apple">Apple</option>
                    <option value="l'acoustics">L'Acoustics</option>
                    <option value="shure">Shure</option>
                    <option value="qsc">QSC</option>
                    <option value="yamaha">Yamaha</option>
                    <option value="barco">Barco</option>
                    <option value="projecta">Projecta</option>
                    <option value="absen">Absen</option>
                    <option value="samsung">Samsung</option>
                    <option value="robe">Robe</option>
                    <option value="chauvet">Chauvet</option>
                    <option value="grandma">GrandMA</option>
                    <option value="steeldeck">Steeldeck</option>
                    <option value="prolyte">Prolyte</option>
                    <option value="other">Other Brands</option>
                  </select>

                  {/* Budget Filter */}
                  <select
                    value={budgetFilter}
                    onChange={(e) => setBudgetFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl glass-input text-slate-700 text-xs cursor-pointer bg-white"
                  >
                    <option value="all">All Prices</option>
                    <option value="budget">Budget (≤ ₹3,000 / day)</option>
                    <option value="mid">Mid-Range (₹3,000 - ₹10,000 / day)</option>
                    <option value="premium">Premium (&gt; ₹10,000 / day)</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className="glass-panel p-8 text-center text-slate-500 text-xs">
                  No items match search parameters.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredCatalog.map((item) => {
                    const cartItem = cart.find(c => c.id === item.id);
                    const isChecked = !!cartItem;
                    const currentQty = cartItem ? cartItem.quantity : 1;
                    const brand = getBrand(item.name);

                    // Budget calculations for badges
                    const rate = parseFloat(item.daily_rate);
                    let budgetTier = 'Budget';
                    let budgetColor = 'bg-sky-50 text-sky-600 border-sky-200';
                    if (rate > 10000) {
                      budgetTier = 'Premium';
                      budgetColor = 'bg-purple-50 text-purple-600 border-purple-200';
                    } else if (rate > 3000) {
                      budgetTier = 'Mid-Range';
                      budgetColor = 'bg-amber-50 text-amber-600 border-amber-200';
                    }

                    return (
                      <div 
                        key={item.id} 
                        className={`glass-card rounded-xl border p-4 flex space-x-4 transition-all duration-300 ${
                          isChecked 
                            ? 'border-indigo-500 bg-indigo-50/10 shadow-sm shadow-indigo-100/10' 
                            : 'border-slate-200 hover:border-indigo-100 hover:shadow-md hover:shadow-slate-100/50 bg-white'
                        }`}
                      >
                        {/* Checkbox trigger */}
                        <div className="flex items-center justify-center flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                handleRemoveFromCart(item.id);
                              } else {
                                handleAddToCart(item, 1);
                              }
                            }}
                            className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                              isChecked 
                                ? 'bg-indigo-600 border-indigo-500 text-white' 
                                : 'border-slate-300 bg-slate-50 text-transparent hover:border-indigo-400'
                            }`}
                          >
                            {isChecked && <Check className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Image panel */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                          <img 
                            src={item.image_url || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=150'} 
                            alt={item.name} 
                            className="w-full h-full object-cover opacity-90"
                          />
                        </div>

                        {/* Info & Quantity controls Panel */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-slate-800 text-xs truncate max-w-[120px]" title={item.name}>{item.name}</h4>
                              <div className="flex flex-wrap gap-1 justify-end">
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 uppercase border border-indigo-100 flex-shrink-0">{item.category}</span>
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 flex-shrink-0">{brand}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${budgetColor}`}>{budgetTier}</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">{item.description}</p>
                            <div className="text-xs font-bold text-emerald-600 mt-1">₹{parseFloat(item.daily_rate).toLocaleString('en-IN')}/day</div>
                          </div>

                          <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100">
                            <div className="text-[10px] text-slate-500">
                              Available: <strong className={item.available_quantity > 0 ? 'text-emerald-600 font-bold' : 'text-rose-600'}>{item.available_quantity}</strong>
                            </div>
                            
                            {item.available_quantity > 0 ? (
                              isChecked && (
                                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (currentQty > 1) {
                                        handleUpdateCartQty(item.id, currentQty - 1);
                                      } else {
                                        handleRemoveFromCart(item.id);
                                      }
                                    }}
                                    className="text-slate-500 hover:text-slate-900 font-black px-1 text-xs cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-bold text-slate-800 min-w-[16px] text-center">{currentQty}</span>
                                  <button
                                    type="button"
                                    disabled={currentQty >= item.available_quantity}
                                    onClick={() => {
                                      handleUpdateCartQty(item.id, currentQty + 1);
                                    }}
                                    className="text-slate-500 hover:text-slate-900 font-black px-1 text-xs cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                  >
                                    +
                                  </button>
                                </div>
                              )
                            ) : (
                              <span className="text-[9px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 uppercase font-semibold">Fully Booked</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Side: Smart Estimation Invoice Drawer */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 h-fit space-y-6 bg-white/95 sticky top-20 shadow-lg">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-600 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              <span>Estimation Summary</span>
            </h3>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <ShoppingBag className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                <p>Your checklist is empty.</p>
                <p className="text-[10px] text-slate-400 mt-1">Tick some items in the catalog to build your quote.</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-150 text-[10px] text-slate-600 space-y-1">
                  <div>Event Name: <strong className="text-slate-800">{eventName}</strong></div>
                  <div>Duration: <strong className="text-slate-800">{durationDays} Days</strong></div>
                </div>

                {/* Cart Checklist List */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{item.name}</h4>
                        <p className="text-[10px] text-slate-600 mt-0.5">₹{item.daily_rate.toLocaleString('en-IN')} × {item.quantity} units</p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Billing calculations */}
                <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal:</span>
                    <span className="text-slate-800">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  
                  {discountRate > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span className="flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Bundle Discount ({discountRate * 100}%):</span>
                      </span>
                      <span>-₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-black text-slate-800 pt-3 border-t border-slate-100">
                    <span>Estimated Total:</span>
                    <span className="text-base text-emerald-600">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Checkout trigger */}
                <div className="pt-2">
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading || cart.length === 0 || !eventName || durationDays <= 0}
                    className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <span>{checkoutLoading ? 'Generating Quote...' : 'Confirm Estimate & Checkout'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default EquipmentCatalogCart;

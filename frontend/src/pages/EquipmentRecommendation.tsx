import React, { useState } from 'react';
import { recommendationService, quoteService } from '../services/api';
import { 
  Sparkles, 
  Users, 
  MapPin, 
  DollarSign, 
  Calendar, 
  ChevronRight, 
  Check, 
  ArrowRight,
  TrendingDown,
  AlertCircle
} from 'lucide-react';

interface EquipmentRecommendationProps {
  onQuoteGenerated: (quoteId: number) => void;
}

const EquipmentRecommendation: React.FC<EquipmentRecommendationProps> = ({ onQuoteGenerated }) => {
  // Wizard state: 1 = Form, 2 = Results
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form values
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('Conference');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [attendees, setAttendees] = useState(100);
  const [venueSize, setVenueSize] = useState('medium');
  const [budget, setBudget] = useState(2000);
  const [specialRequirements, setSpecialRequirements] = useState('');

  // Results state
  const [recommendations, setRecommendations] = useState<any>(null);
  const [selectedBundle, setSelectedBundle] = useState<string>('Professional'); // Default chosen bundle

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName || !startDate || !endDate || !attendees || !budget) {
      setError('Please fill in all required fields.');
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
        budget,
        start_date: startDate,
        end_date: endDate
      });
      setRecommendations(data);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error calculating recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuote = async (bundleName: string) => {
    if (!recommendations) return;
    setLoading(true);
    setError('');

    const bundle = recommendations.bundles[bundleName.toLowerCase()];
    
    try {
      const payload = {
        event_name: eventName,
        event_type: eventType,
        start_date: startDate,
        end_date: endDate,
        attendees,
        venue_size: venueSize,
        budget,
        special_requirements: specialRequirements,
        bundle_details: bundle.items,
        subtotal: bundle.subtotal,
        discount: bundle.discount,
        total: bundle.total
      };
      
      const res = await quoteService.create(payload);
      onQuoteGenerated(res.quoteId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error generating quote.');
    } finally {
      setLoading(false);
    }
  };

  const getBundleDetails = () => {
    if (!recommendations) return null;
    return recommendations.bundles[selectedBundle.toLowerCase()];
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Section Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Bundle <span className="text-indigo-600">Optimizer</span></h1>
          <p className="text-sm text-slate-600 mt-1">Configure event specifications to discover optimized equipment bundles with matched budgets</p>
        </div>
        <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl text-xs text-indigo-700 font-bold">
          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span>Heuristic Optimization Engine Active</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 1 ? (
        /* ================= STEP 1: REQUIREMENT FORM ================= */
        <div className="glass-panel p-8 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden bg-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <form onSubmit={handleCalculate} className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Event Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Event Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="One Point Annual Leadership Summit"
                  className="w-full px-4 py-3 rounded-xl glass-input text-slate-800 text-sm bg-white"
                  required
                />
              </div>

              {/* Event Type */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Event Type <span className="text-rose-500">*</span></label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-slate-800 text-sm cursor-pointer bg-white"
                >
                  <option value="Conference">Conference</option>
                  <option value="Corporate">Corporate Meeting</option>
                  <option value="Concert">Concert / Musical Event</option>
                  <option value="Wedding">Wedding / Gala Dinner</option>
                  <option value="Exhibition">Exhibition / Trade Show Booth</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Start Date <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-slate-800 text-sm cursor-pointer bg-white"
                    required
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">End Date <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-slate-800 text-sm cursor-pointer bg-white"
                    required
                  />
                </div>
              </div>

              {/* Attendees Count */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Expected Attendees <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={attendees}
                    onChange={(e) => setAttendees(parseInt(e.target.value) || 0)}
                    placeholder="100"
                    min="1"
                    className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-slate-800 text-sm bg-white"
                    required
                  />
                </div>
              </div>

              {/* Venue Size */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Venue Size / Layout <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <select
                    value={venueSize}
                    onChange={(e) => setVenueSize(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-slate-800 text-sm cursor-pointer bg-white"
                  >
                    <option value="small">Small (Meeting Room / Classroom)</option>
                    <option value="medium">Medium (Ballroom / Banquet Hall)</option>
                    <option value="large">Large (Auditorium / Stadium)</option>
                    <option value="outdoor">Outdoor (Festival / Open Air Stage)</option>
                  </select>
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Equipment Budget (₹ INR) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                    placeholder="2000"
                    min="10"
                    className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-slate-800 text-sm bg-white"
                    required
                  />
                </div>
              </div>

              {/* Special Requirements */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Special Requirements / Notes</label>
                <textarea
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="Need double lapel mics, presentation clickers, and high-brightness projector screens for daytime lighting conditions."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl glass-input text-slate-800 text-sm resize-none bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Optimizing Bundles...' : 'Generate Recommendations'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ================= STEP 2: RESULTS & BUNDLES COMPARISON ================= */
        <div className="space-y-8">
          {/* Back button */}
          <div>
            <button
              onClick={() => setStep(1)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>← Adjust Event Requirements</span>
            </button>
          </div>

          {/* Bundle Selection Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {Object.entries(recommendations.bundles).map(([, bundle]: any) => {
              const name = bundle.name;
              const isRecommended = name === 'Professional';
              const fitsBudget = bundle.fitsBudget;
              const isSelected = selectedBundle === name;

              return (
                <div
                  key={name}
                  onClick={() => setSelectedBundle(name)}
                  className={`glass-panel p-6 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden bg-white ${
                    isSelected 
                      ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 bg-indigo-50/5 scale-[1.01]' 
                      : 'border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow">
                      Recommended
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Header */}
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
                        <span>{name} Pack</span>
                        {isSelected && <Check className="w-5 h-5 text-indigo-600" />}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        {name === 'Essential' && 'Budget-friendly core hardware essentials.'}
                        {name === 'Professional' && 'Standard professional equipment for full event scale.'}
                        {name === 'Deluxe' && 'Premium high-end setups with multi-device coverage.'}
                      </p>
                    </div>

                    {/* Price display */}
                    <div className="border-t border-b border-slate-100 py-4 space-y-1">
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-3xl font-black text-slate-900">₹{bundle.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span className="text-xs text-slate-500">for {bundle.durationDays} days</span>
                      </div>
                      
                      {bundle.discountRate > 0 && (
                        <div className="flex items-center space-x-1 text-emerald-600 text-xs font-semibold">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>Saved {bundle.discountRate * 100}% (₹{bundle.discount.toLocaleString('en-IN')} bundle savings)</span>
                        </div>
                      )}
                    </div>

                    {/* Quick features */}
                    <ul className="space-y-2 text-xs text-slate-700">
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{bundle.items.length} Tech Items included</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Real-time availability confirmed</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>One Point Solutions Setup Support</span>
                      </li>
                    </ul>
                  </div>

                  {/* Budget Fit Check and Selection Button */}
                  <div className="mt-8 pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Budget Match:</span>
                      {fitsBudget ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">Under Budget</span>
                      ) : (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md font-semibold">Over Budget</span>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateQuote(name);
                      }}
                      disabled={loading}
                      className={`w-full font-bold py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 text-xs cursor-pointer ${
                        isSelected 
                          ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/15'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>Generate Quote</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Bundle Itemized Table Details */}
          {getBundleDetails() && (
            <div className="glass-panel p-8 rounded-3xl border border-slate-200 bg-white shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Itemized Details ({selectedBundle} Bundle)</h3>
                  <p className="text-xs text-slate-500 mt-1">Verify catalog lists and daily rate quantities</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block uppercase font-medium">Bundle Price</span>
                  <span className="text-xl font-bold text-indigo-600">₹{getBundleDetails().total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Equipment Item</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">Qty Required</th>
                      <th className="py-3 px-4 text-right">Daily Rate</th>
                      <th className="py-3 px-4 text-right">Total ({getBundleDetails().durationDays} Days)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getBundleDetails().items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors text-slate-700">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{item.name}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            item.category === 'Audio' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            item.category === 'Video' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                            item.category === 'Lighting' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">{item.quantity}</td>
                        <td className="py-3.5 px-4 text-right text-slate-600">₹{item.daily_rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600">₹{item.total_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Price Breakdown Footer */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <div className="w-80 space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{getBundleDetails().subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {getBundleDetails().discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Bundle Discount:</span>
                      <span>-₹{getBundleDetails().discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2.5 border-t border-slate-100">
                    <span>Total Estimate:</span>
                    <span className="text-xl text-emerald-600 font-bold">₹{getBundleDetails().total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EquipmentRecommendation;

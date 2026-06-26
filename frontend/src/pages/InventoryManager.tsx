import React, { useState, useEffect } from 'react';
import { equipmentService } from '../services/api';
import EquipmentCard from '../components/EquipmentCard';
import { 
  Plus, 
  Search, 
  AlertCircle,
  X,
  Wrench
} from 'lucide-react';

const InventoryManager: React.FC = () => {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Audio');
  const [description, setDescription] = useState('');
  const [dailyRate, setDailyRate] = useState(50);
  const [totalQuantity, setTotalQuantity] = useState(5);
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'maintenance' | 'retired'>('active');
  
  // Specifications
  const [specPower, setSpecPower] = useState('');
  const [specWeight, setSpecWeight] = useState('');
  const [specDimensions, setSpecDimensions] = useState('');

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const data = await equipmentService.getAll();
      setEquipment(data);
    } catch (err: any) {
      setError('Failed to fetch equipment catalogue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('Audio');
    setDescription('');
    setDailyRate(50);
    setTotalQuantity(5);
    setImageUrl('');
    setStatus('active');
    setSpecPower('');
    setSpecWeight('');
    setSpecDimensions('');
    setIsModalOpen(true);
    setError('');
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description || '');
    setDailyRate(item.daily_rate);
    setTotalQuantity(item.total_quantity);
    setImageUrl(item.image_url || '');
    setStatus(item.status);
    
    // Set specs
    const specs = item.specifications || {};
    setSpecPower(specs.power || specs.frequency || specs.brightness || '');
    setSpecWeight(specs.weight || specs.batteryLife || specs.ratio || '');
    setSpecDimensions(specs.dimensions || specs.range || specs.resolution || '');
    
    setIsModalOpen(true);
    setError('');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
      return;
    }

    try {
      await equipmentService.delete(id);
      setSuccess('Equipment deleted successfully.');
      fetchEquipment();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete equipment. It may be part of an active booking.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || dailyRate <= 0 || totalQuantity < 0) {
      setError('Please provide valid product name, rate, and quantity.');
      return;
    }

    // Build specs object dynamically based on category
    const specs: any = {};
    if (category === 'Audio') {
      if (specPower) specs.power = specPower;
      if (specWeight) specs.weight = specWeight;
      if (specDimensions) specs.dimensions = specDimensions;
    } else if (category === 'Video') {
      if (specPower) specs.brightness = specPower;
      if (specWeight) specs.ratio = specWeight;
      if (specDimensions) specs.resolution = specDimensions;
    } else {
      if (specPower) specs.power = specPower;
      if (specWeight) specs.control = specWeight;
      if (specDimensions) specs.specInfo = specDimensions;
    }

    const payload = {
      name,
      category,
      description,
      daily_rate: dailyRate,
      total_quantity: totalQuantity,
      image_url: imageUrl,
      status,
      specifications: specs
    };

    try {
      if (editingItem) {
        await equipmentService.update(editingItem.id, payload);
        setSuccess('Equipment updated successfully.');
      } else {
        await equipmentService.create(payload);
        setSuccess('Equipment added successfully.');
      }

      setIsModalOpen(false);
      fetchEquipment();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error saving equipment details.');
    }
  };

  // Filters
  const filteredList = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Equipment <span className="text-indigo-600">Inventory</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">Audit rentals, modify pricing rates, check warehouse counts, and edit descriptions</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/10 transition-colors flex items-center space-x-2 text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Equipment</span>
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between glass-panel p-4 rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by equipment name..."
            className="w-full pl-12 pr-4 py-2.5 rounded-xl glass-input text-slate-800 text-sm focus:border-indigo-500 bg-white border border-slate-200"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl glass-input text-slate-700 text-xs cursor-pointer bg-white border border-slate-200 w-full sm:w-44"
          >
            <option value="all">All Categories</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
            <option value="lighting">Lighting</option>
            <option value="stage">Stage</option>
            <option value="computing">Computing</option>
          </select>
        </div>
      </div>

      {/* Grid listing */}
      {loading && equipment.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-200/80 text-center text-slate-500 bg-white shadow-sm">
          <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="font-bold text-sm text-slate-700">No equipment matching query</p>
          <p className="text-xs text-slate-400 mt-1">Try adding a new product or adjusting the category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredList.map((item) => (
            <EquipmentCard
              key={item.id}
              item={item}
              onEdit={openEditModal}
              onDelete={handleDelete}
              showActions={true}
            />
          ))}
        </div>
      )}

      {/* CRUD Add/Edit Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-50 overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto bg-white">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-slate-800 mb-6">
              {editingItem ? 'Edit Equipment Profile' : 'Add New Equipment'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Product Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Barco 4K Projector"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-slate-800 text-sm bg-white"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-slate-800 text-sm cursor-pointer bg-white"
                  >
                    <option value="Audio">Audio</option>
                    <option value="Video">Video</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Stage">Stage</option>
                    <option value="Computing">Computing</option>
                  </select>
                </div>

                {/* Daily Rate */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Daily Rate (₹ INR)</label>
                  <input
                    type="number"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)}
                    min="1"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-slate-800 text-sm bg-white"
                    required
                  />
                </div>

                {/* Total Quantity */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Quantity in Stock</label>
                  <input
                    type="number"
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-slate-800 text-sm bg-white"
                    required
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Image URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-slate-800 text-sm bg-white"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Equipment Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-slate-800 text-sm cursor-pointer bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write detailed specifications or notes for renting..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-slate-800 text-sm resize-none bg-white"
                  />
                </div>

                {/* Technical Specifications */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <h5 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Technical Specifications (Optional)</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Power / Output</label>
                      <input
                        type="text"
                        value={specPower}
                        onChange={(e) => setSpecPower(e.target.value)}
                        placeholder="e.g. 2000W / 32,000 lm"
                        className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Weight / Driver Size</label>
                      <input
                        type="text"
                        value={specWeight}
                        onChange={(e) => setSpecWeight(e.target.value)}
                        placeholder="e.g. 56kg / 18 inch"
                        className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Dimensions / Resolution</label>
                      <input
                        type="text"
                        value={specDimensions}
                        onChange={(e) => setSpecDimensions(e.target.value)}
                        placeholder="e.g. 1000 x 500 mm"
                        className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl transition-colors text-xs cursor-pointer font-bold shadow-lg shadow-indigo-500/10"
                >
                  {editingItem ? 'Save Updates' : 'Add Item'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;


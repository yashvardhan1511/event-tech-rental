import React from 'react';
import { Layers } from 'lucide-react';

interface Equipment {
  id: number;
  name: string;
  category: string;
  description: string;
  daily_rate: number;
  total_quantity: number;
  available_quantity: number;
  image_url?: string;
  specifications: any;
  status: 'active' | 'maintenance' | 'retired';
}

interface EquipmentCardProps {
  item: Equipment;
  onEdit?: (item: Equipment) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ item, onEdit, onDelete, showActions = false }) => {
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'audio': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'video': return 'bg-sky-50 text-sky-700 border border-sky-200';
      case 'lighting': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'stage': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>;
      case 'maintenance':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Maintenance</span>;
      default:
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Retired</span>;
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-slate-100/50 border border-slate-200 hover:border-indigo-200 transition-all duration-300 flex flex-col group h-full bg-white">
      <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
        <img 
          src={item.image_url || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=300'} 
          alt={item.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=300';
          }}
        />
        <div className="absolute top-3 right-3 flex flex-col space-y-1.5 items-end">
          {getStatusBadge(item.status)}
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${getCategoryColor(item.category)}`}>
            {item.category}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-750 shadow-sm">
          Daily Rate: <span className="text-emerald-600 font-bold">₹{parseFloat(item.daily_rate.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <h4 className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors text-base truncate">{item.name}</h4>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{item.description}</p>
          
          {item.specifications && Object.keys(item.specifications).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {Object.entries(item.specifications).slice(0, 2).map(([key, val]) => (
                <span key={key} className="text-[10px] bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                  <span className="font-semibold text-slate-500 uppercase">{key}:</span> {String(val)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center space-x-1.5 text-slate-600">
              <Layers className="w-3.5 h-3.5" />
              <span>Stock: <strong className="text-slate-800">{item.total_quantity}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className={`w-2 h-2 rounded-full ${item.available_quantity > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <span className="text-slate-600">
                Available: <strong className={item.available_quantity > 0 ? 'text-emerald-700' : 'text-rose-700'}>{item.available_quantity}</strong>
              </span>
            </div>
          </div>

          {showActions && (onEdit || onDelete) && (
            <div className="flex space-x-2 pt-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(item)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(item.id)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs px-3 py-2 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquipmentCard;

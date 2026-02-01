import { useState } from 'react';
import { SlidersHorizontal, X, MapPin, IndianRupee, Shield, Zap, Info } from 'lucide-react';
import { useSearchStore } from '../../store/searchStore';
import type { VehicleType } from '../../types';

interface FilterSidebarProps {
    onClose?: () => void;
    mobile?: boolean;
}

export function FilterSidebar({ onClose, mobile = false }: FilterSidebarProps) {
    const { filters, setFilters, resetFilters } = useSearchStore();
    const [localFilters, setLocalFilters] = useState(filters);

    const handleApply = () => {
        setFilters(localFilters);
        onClose?.();
    };

    const handleReset = () => {
        resetFilters();
        setLocalFilters(filters);
    };

    const featureIcons: Record<string, any> = {
        'Covered': Shield,
        '24/7 Access': Zap,
        'Security': Shield,
        'EV Charging': Zap
    };

    return (
        <div className={`bg-white ${mobile ? 'h-full overflow-y-auto' : 'rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100'} p-8`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-xl">
                        <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="font-black text-xl text-gray-900 tracking-tight">Refine Search</h3>
                </div>
                {mobile && onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Sort By Card */}
            <div className="mb-8">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Sort By</label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { id: 'distance', label: 'Distance' },
                        { id: 'price_asc', label: 'Direct Price' },
                        { id: 'price_desc', label: 'Premium' },
                        { id: 'availability', label: 'Availability' }
                    ].map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setLocalFilters({ ...localFilters, sortBy: option.id as any })}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${localFilters.sortBy === option.id
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-indigo-200'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Distance Slider */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Radius Limit</label>
                    <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {localFilters.radius} km
                    </span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="50"
                    step="5"
                    value={localFilters.radius}
                    onChange={(e) => setLocalFilters({ ...localFilters, radius: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] font-black text-gray-300 mt-2">
                    <span>1 KM</span>
                    <span>50 KM</span>
                </div>
            </div>

            {/* Price Range */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Budget (Hourly)</label>
                    <span className="text-sm font-black text-indigo-600 flex items-center gap-0.5">
                        <IndianRupee className="w-3 h-3" /> {localFilters.priceRange[0]} - {localFilters.priceRange[1]}
                    </span>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <input
                            type="number"
                            value={localFilters.priceRange[0]}
                            onChange={(e) => setLocalFilters({ ...localFilters, priceRange: [parseInt(e.target.value) || 0, localFilters.priceRange[1]] })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none transition-all"
                            placeholder="Min"
                        />
                    </div>
                    <div className="flex-1">
                        <input
                            type="number"
                            value={localFilters.priceRange[1]}
                            onChange={(e) => setLocalFilters({ ...localFilters, priceRange: [localFilters.priceRange[0], parseInt(e.target.value) || 1000] })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none transition-all"
                            placeholder="Max"
                        />
                    </div>
                </div>
            </div>

            {/* Vehicle Type Selection */}
            <div className="mb-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">Vehicle Group</label>
                <div className="space-y-3">
                    {['BIKE', 'SCOOTER', 'CAR', 'TRUCK'].map((type) => (
                        <label key={type} className="flex items-center group cursor-pointer">
                            <input
                                type="radio"
                                name="vehicleType"
                                checked={localFilters.vehicleType === type}
                                onChange={() => setLocalFilters({ ...localFilters, vehicleType: type as VehicleType })}
                                className="hidden"
                            />
                            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${localFilters.vehicleType === type ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 bg-white'
                                }`}>
                                {localFilters.vehicleType === type && <div className="w-2 h-2 rounded-full bg-white transition-transform scale-100" />}
                            </div>
                            <span className={`text-sm font-bold transition-colors ${localFilters.vehicleType === type ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'
                                }`}>
                                {type}
                            </span>
                        </label>
                    ))}
                    <label className="flex items-center group cursor-pointer pt-2 border-t border-gray-200">
                        <input
                            type="radio"
                            name="vehicleType"
                            checked={localFilters.vehicleType === ''}
                            onChange={() => setLocalFilters({ ...localFilters, vehicleType: '' })}
                            className="hidden"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${localFilters.vehicleType === '' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 bg-white'
                            }`}>
                            {localFilters.vehicleType === '' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className={`text-sm font-bold ${localFilters.vehicleType === '' ? 'text-indigo-600' : 'text-gray-500'}`}>
                            All Vehicles
                        </span>
                    </label>
                </div>
            </div>

            {/* Facility Features */}
            <div className="mb-10">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">Amenities</label>
                <div className="grid grid-cols-1 gap-3">
                    {['Covered', '24/7 Access', 'Security', 'EV Charging'].map((feature) => (
                        <label
                            key={feature}
                            className={`flex items-center p-4 rounded-2xl border transition-all cursor-pointer ${localFilters.features.includes(feature)
                                    ? 'bg-indigo-50 border-indigo-200'
                                    : 'bg-white border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={localFilters.features.includes(feature)}
                                onChange={(e) => {
                                    const updatedFeatures = e.target.checked
                                        ? [...localFilters.features, feature]
                                        : localFilters.features.filter((f) => f !== feature);
                                    setLocalFilters({ ...localFilters, features: updatedFeatures });
                                }}
                                className="hidden"
                            />
                            <div className={`w-6 h-6 rounded-lg border-2 mr-3 flex items-center justify-center transition-all ${localFilters.features.includes(feature) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-200 bg-white'
                                }`}>
                                {localFilters.features.includes(feature) && <Zap className="w-3.5 h-3.5 text-white fill-white" />}
                            </div>
                            <span className={`text-sm font-bold ${localFilters.features.includes(feature) ? 'text-indigo-700' : 'text-gray-600'
                                }`}>
                                {feature}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Fixed Actions for Mobile or absolute for Desktop */}
            <div className="flex gap-4">
                <button
                    onClick={handleReset}
                    className="flex-1 px-6 py-4 border-2 border-gray-100 text-gray-400 rounded-2xl font-black hover:bg-gray-50 hover:text-gray-600 transition-all text-sm uppercase tracking-widest"
                >
                    Clear
                </button>
                <button
                    onClick={handleApply}
                    className="flex-[2] px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                    Apply Filters
                </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-50 flex items-center gap-3 text-gray-400">
                <Info className="w-4 h-4 flex-shrink-0" />
                <p className="text-[10px] font-bold leading-tight">Filters are automatically applied to the map and results grid.</p>
            </div>
        </div>
    );
}

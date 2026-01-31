import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
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

    return (
        <div className={`bg-white ${mobile ? 'h-full' : 'rounded-lg shadow-md'} p-6`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg">Filters</h3>
                </div>
                {mobile && onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Sort By */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                <select
                    value={localFilters.sortBy}
                    onChange={(e) =>
                        setLocalFilters({
                            ...localFilters,
                            sortBy: e.target.value as typeof localFilters.sortBy,
                        })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                    <option value="distance">Distance</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="availability">Availability</option>
                </select>
            </div>

            {/* Distance Range */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Distance: {localFilters.radius} km
                </label>
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={localFilters.radius}
                    onChange={(e) =>
                        setLocalFilters({ ...localFilters, radius: parseInt(e.target.value) })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 km</span>
                    <span>20 km</span>
                </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price Range: ₹{localFilters.priceRange[0]} - ₹{localFilters.priceRange[1]}
                </label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={localFilters.priceRange[0]}
                        onChange={(e) =>
                            setLocalFilters({
                                ...localFilters,
                                priceRange: [parseInt(e.target.value) || 0, localFilters.priceRange[1]],
                            })
                        }
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Min"
                    />
                    <input
                        type="number"
                        value={localFilters.priceRange[1]}
                        onChange={(e) =>
                            setLocalFilters({
                                ...localFilters,
                                priceRange: [localFilters.priceRange[0], parseInt(e.target.value) || 1000],
                            })
                        }
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Max"
                    />
                </div>
            </div>

            {/* Vehicle Type */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Type</label>
                <select
                    value={localFilters.vehicleType}
                    onChange={(e) =>
                        setLocalFilters({
                            ...localFilters,
                            vehicleType: e.target.value as VehicleType | '',
                        })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                    <option value="">All Types</option>
                    <option value="BIKE">Bike</option>
                    <option value="SCOOTER">Scooter</option>
                    <option value="CAR">Car</option>
                    <option value="TRUCK">Truck</option>
                </select>
            </div>

            {/* Features */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Features</label>
                <div className="space-y-2">
                    {['Covered', '24/7 Access', 'Security', 'EV Charging'].map((feature) => (
                        <label key={feature} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localFilters.features.includes(feature)}
                                onChange={(e) => {
                                    const updatedFeatures = e.target.checked
                                        ? [...localFilters.features, feature]
                                        : localFilters.features.filter((f) => f !== feature);
                                    setLocalFilters({ ...localFilters, features: updatedFeatures });
                                }}
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">{feature}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                    Reset
                </button>
                <button
                    onClick={handleApply}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
                >
                    Apply
                </button>
            </div>
        </div>
    );
}

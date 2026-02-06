import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Grid3X3, Map as MapIcon, ChevronDown, Search as SearchIcon, MapPin, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSearchStore } from '../../store/searchStore';
import { useSearchParking } from '../../hooks/useSearchParking';
import { useGeolocation } from '../../hooks/useGeolocation';
import { SearchBar } from '../../components/customer/SearchBar';
import { FilterSidebar } from '../../components/customer/FilterSidebar';
import { ParkingCard } from '../../components/customer/ParkingCard';
import { MapView } from '../../components/customer/MapView';
import type { VehicleType } from '../../types';

export default function SearchPage() {
    const navigate = useNavigate();
    const { clearAuth, isAuthenticated } = useAuthStore();
    const { filters, viewMode, setFilters, setViewMode } = useSearchStore();
    const { latitude, longitude } = useGeolocation();
    const [showFilters, setShowFilters] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    useEffect(() => {
        if (!filters.location && latitude && longitude) {
            setFilters({
                location: {
                    lat: latitude,
                    lng: longitude,
                    address: 'Current Location',
                },
            });
        }
    }, [latitude, longitude, filters.location, setFilters]);

    const { data: facilities, isLoading, error } = useSearchParking(
        {
            latitude: filters.location?.lat || latitude || 19.076,
            longitude: filters.location?.lng || longitude || 72.8777,
            radius: filters.radius,
            vehicle_type: filters.vehicleType || undefined,
        },
        !!(filters.location || (latitude && longitude))
    );

    const handleSearch = (
        location: { lat: number; lng: number; address: string },
        vehicleType: VehicleType | ''
    ) => {
        setFilters({ location, vehicleType });
    };

    const filteredFacilities = facilities
        ?.filter((facility) => {
            if (facility.pricing) {
                const price = facility.pricing.hourly_rate;
                if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
                    return false;
                }
            }
            return true;
        })
        .sort((a, b) => {
            switch (filters.sortBy) {
                case 'distance':
                    return (a.distance || 0) - (b.distance || 0);
                case 'price_asc':
                    return (a.pricing?.hourly_rate || 0) - (b.pricing?.hourly_rate || 0);
                case 'price_desc':
                    return (b.pricing?.hourly_rate || 0) - (a.pricing?.hourly_rate || 0);
                default:
                    return 0;
            }
        });

    const SkeletonCard = () => (
        <div className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
            <div className="aspect-[2/3] bg-gray-50 rounded-lg mb-4" />
            <div className="h-5 bg-gray-50 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-50 rounded w-1/2 mb-4" />
            <div className="h-10 bg-gray-50 rounded-lg w-full" />
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            {/* Sub-Header: BMS Style */}
            <div className="pt-24 pb-6 border-b border-gray-50 bg-gray-50/30">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                            Parking in {filters.location?.address.split(',')[0] || 'your area'}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1"><MapPin size={12} className="text-primary" /> {filteredFacilities?.length || 0} locations</span>
                            <span>•</span>
                            <span>{filters.vehicleType || 'All Vehicles'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-white rounded-lg p-1 border border-gray-100">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-2 rounded-md transition-all text-xs font-bold ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <Grid3X3 size={16} className="inline mr-2" /> List
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-4 py-2 rounded-md transition-all text-xs font-bold ${viewMode === 'map' ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <MapIcon size={16} className="inline mr-2" /> Map
                            </button>
                        </div>

                        <button
                            onClick={() => setShowFilters(true)}
                            className="lg:hidden p-3 bg-white border border-gray-100 rounded-lg text-primary shadow-sm"
                        >
                            <Filter size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12 flex gap-12">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-[280px] shrink-0 sticky top-28 h-fit">
                    <FilterSidebar />
                </aside>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    {viewMode === 'grid' ? (
                        <div className="w-full">
                            {isLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                                </div>
                            ) : error ? (
                                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <X size={40} className="mx-auto text-red-400 mb-4" />
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Couldn't load spots</h3>
                                    <button onClick={() => window.location.reload()} className="text-primary font-bold hover:underline">Try Again</button>
                                </div>
                            ) : filteredFacilities?.length === 0 ? (
                                <div className="text-center py-20 bg-gray-50 rounded-xl">
                                    <SearchIcon size={48} className="mx-auto text-gray-200 mb-4" />
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">No matching spots</h3>
                                    <p className="text-sm text-gray-400 mb-6 font-medium">Try widening your filters or search area</p>
                                    <button onClick={() => setFilters({ radius: 30 })} className="px-6 py-2 bg-primary text-white rounded-lg font-bold text-sm">Expand Radius</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredFacilities?.map((facility) => (
                                        <ParkingCard key={facility.id} facility={facility} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-[calc(100vh-16rem)] rounded-xl overflow-hidden border border-gray-100 shadow-xl relative">
                            {!isLoading && (
                                <MapView
                                    facilities={filteredFacilities || []}
                                    center={{
                                        lat: filters.location?.lat || latitude || 19.076,
                                        lng: filters.location?.lng || longitude || 72.8777
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile Overlays (Keeping Simple for now) */}
            {showFilters && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm lg:hidden flex justify-end">
                    <div className="w-full max-w-sm bg-white h-full p-6 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold">Filters</h3>
                            <button onClick={() => setShowFilters(false)} className="p-2 bg-gray-50 rounded-lg"><X size={20} /></button>
                        </div>
                        <FilterSidebar onClose={() => setShowFilters(false)} mobile />
                    </div>
                </div>
            )}
        </div>
    );
}

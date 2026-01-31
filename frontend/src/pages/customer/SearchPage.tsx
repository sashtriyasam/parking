import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Grid3X3, Map } from 'lucide-react';
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
    const { clearAuth } = useAuthStore();
    const { filters, viewMode, setFilters, setViewMode } = useSearchStore();
    const { latitude, longitude } = useGeolocation();
    const [showFilters, setShowFilters] = useState(false);

    // Set default location if not set
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

    // Fetch parking data
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

    const handleLogout = () => {
        clearAuth();
        navigate('/');
    };

    // Filter and sort results
    const filteredFacilities = facilities
        ?.filter((facility) => {
            // Price filter
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
                case 'availability':
                    return (b.total_available || 0) - (a.total_available || 0);
                default:
                    return 0;
            }
        });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1
                            onClick={() => navigate('/')}
                            className="text-2xl font-bold text-primary cursor-pointer"
                        >
                            ParkEase
                        </h1>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/customer/tickets')}
                                className="text-gray-700 hover:text-primary"
                            >
                                My Tickets
                            </button>
                            <button
                                onClick={() => navigate('/customer/profile')}
                                className="text-gray-700 hover:text-primary"
                            >
                                Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                    <SearchBar onSearch={handleSearch} compact />
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">
                        {filteredFacilities?.length || 0} Parking Spots Found
                    </h2>
                    <div className="flex gap-2">
                        {/* Mobile Filter Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="lg:hidden p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Filter className="w-5 h-5" />
                        </button>
                        {/* View Toggle */}
                        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-700'
                                    }`}
                            >
                                <Grid3X3 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`p-2 ${viewMode === 'map' ? 'bg-primary text-white' : 'bg-white text-gray-700'
                                    }`}
                            >
                                <Map className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-6">
                    {/* Filters Sidebar - Desktop */}
                    <aside className="hidden lg:block w-80 flex-shrink-0">
                        <div className="sticky top-24">
                            <FilterSidebar />
                        </div>
                    </aside>

                    {/* Results Grid */}
                    <div className="flex-1">
                        {isLoading && (
                            <div className="text-center py-20">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                                <p className="mt-4 text-gray-600">Searching for parking...</p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                                <p className="text-red-600">Failed to load parking facilities</p>
                            </div>
                        )}

                        {!isLoading && !error && filteredFacilities && filteredFacilities.length === 0 && (
                            <div className="bg-white rounded-lg p-12 text-center">
                                <p className="text-gray-600 text-lg mb-4">No parking facilities found</p>
                                <p className="text-gray-500">
                                    Try adjusting your filters or search in a different location
                                </p>
                            </div>
                        )}

                        {!isLoading && viewMode === 'grid' && filteredFacilities && (
                            <div className="grid md:grid-cols-2 gap-6">
                                {filteredFacilities.map((facility) => (
                                    <ParkingCard key={facility.id} facility={facility} />
                                ))}
                            </div>
                        )}

                        {!isLoading && viewMode === 'map' && (
                            <div className="bg-white rounded-lg overflow-hidden h-[600px] shadow-md border border-gray-200">
                                <MapView
                                    facilities={filteredFacilities || []}
                                    center={{
                                        lat: filters.location?.lat || latitude || 19.076,
                                        lng: filters.location?.lng || longitude || 72.8777
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Mobile Filter Modal */}
            {showFilters && (
                <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
                    <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white">
                        <FilterSidebar onClose={() => setShowFilters(false)} mobile />
                    </div>
                </div>
            )}
        </div>
    );
}

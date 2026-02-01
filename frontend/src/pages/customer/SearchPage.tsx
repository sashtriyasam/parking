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
    const [scrolled, setScrolled] = useState(false);

    // Watch for scroll to change header style
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
            // Feature filter
            if (filters.features.length > 0) {
                // In a real app, this would be backend-driven
                // For now, assume most facilities have basic features
                return true;
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

    const SkeletonCard = () => (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 animate-pulse">
            <div className="h-48 bg-gray-100 rounded-2xl mb-6" />
            <div className="h-6 bg-gray-100 rounded-lg w-3/4 mb-4" />
            <div className="h-4 bg-gray-100 rounded-lg w-1/2 mb-6" />
            <div className="flex gap-2">
                <div className="h-10 bg-gray-100 rounded-xl flex-1" />
                <div className="h-10 bg-gray-100 rounded-xl flex-1" />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fafafa]">
            {/* Nav Header */}
            <header className={`fixed top-0 w-full z-40 transition-all duration-300 ${scrolled ? 'bg-white shadow-xl shadow-gray-200/20 py-3' : 'bg-white py-5'
                }`}>
                <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <h1 onClick={() => navigate('/')} className="text-2xl font-black tracking-tighter text-indigo-900 cursor-pointer">
                            Park<span className="text-indigo-600">Easy</span>
                        </h1>
                        <div className="hidden lg:block w-[500px]">
                            <SearchBar onSearch={handleSearch} compact />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-6 font-bold text-gray-500">
                                <button onClick={() => navigate('/customer/tickets')} className="hover:text-indigo-600 transition-colors">Bookings</button>
                                <button onClick={() => navigate('/customer/profile')} className="hover:text-indigo-600 transition-colors">Profile</button>
                                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 font-medium">Exit</button>
                            </div>
                        ) : (
                            <button onClick={() => navigate('/login')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                                Join Now
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Sub-Header: Search Info & Controls */}
            <div className="pt-32 pb-6 px-6 max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight">
                                {filters.location?.address || 'Searching nearby...'}
                            </h2>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">
                                {filteredFacilities?.length || 0} locations available
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Sort Dropdown Placeholder */}
                        <div className="hidden md:flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-black text-gray-600 cursor-pointer hover:bg-white transition-all">
                            Sort By: {filters.sortBy.replace('_', ' ')} <ChevronDown className="w-4 h-4" />
                        </div>

                        {/* Mobile Search Toggle */}
                        <button className="lg:hidden p-4 bg-gray-50 rounded-2xl text-gray-600 border border-gray-100">
                            <SearchIcon className="w-5 h-5" />
                        </button>

                        {/* View Mode Toggles */}
                        <div className="flex p-1.5 bg-gray-100 rounded-2xl">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'
                                    }`}
                            >
                                <Grid3X3 className="w-4 h-4" /> List
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${viewMode === 'map' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'
                                    }`}
                            >
                                <MapIcon className="w-4 h-4" /> Map
                            </button>
                        </div>

                        {/* Mobile Filter Button */}
                        <button
                            onClick={() => setShowFilters(true)}
                            className="lg:hidden p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100"
                        >
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Discovery Interface */}
            <main className="max-w-[1600px] mx-auto px-6 pb-20 flex gap-10">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-[380px] flex-shrink-0 sticky top-32 h-[calc(100vh-160px)] outline-none no-scrollbar overflow-y-auto">
                    <FilterSidebar />
                </aside>

                {/* Content Area */}
                <div className="flex-1 w-full relative">
                    {/* View: Grid */}
                    {viewMode === 'grid' && (
                        <div>
                            {isLoading ? (
                                <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-8">
                                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                                </div>
                            ) : error ? (
                                <div className="bg-red-50 p-12 rounded-[40px] text-center border-2 border-red-100">
                                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <X className="w-10 h-10 text-red-600" />
                                    </div>
                                    <h3 className="text-2xl font-black text-red-900 mb-2">Technical Difficulty</h3>
                                    <p className="text-red-600/70 font-bold mb-8">We couldn't load parking spots at the moment.</p>
                                    <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition-all">
                                        Try Again
                                    </button>
                                </div>
                            ) : filteredFacilities?.length === 0 ? (
                                <div className="bg-white p-20 rounded-[40px] text-center border border-gray-100 shadow-sm">
                                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                        <SearchIcon className="w-12 h-12 text-gray-200" />
                                    </div>
                                    <h3 className="text-3xl font-black text-gray-900 mb-4">No Parking Spots Found</h3>
                                    <p className="text-gray-400 font-bold max-w-sm mx-auto leading-relaxed">
                                        There are no spots matching your filters within {filters.radius} KM of this location.
                                    </p>
                                    <button onClick={() => setFilters({ radius: 20 })} className="mt-10 text-indigo-600 font-black hover:underline">
                                        Try widening your search area →
                                    </button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-10">
                                    {filteredFacilities?.map((facility) => (
                                        <ParkingCard key={facility.id} facility={facility} />
                                    ))}

                                    {/* Infinite Scroll Load More Placeholder */}
                                    <div className="md:col-span-2 py-10 flex justify-center">
                                        <button className="text-indigo-600 font-black px-10 py-4 border-2 border-indigo-50 rounded-3xl hover:bg-indigo-50 transition-all">
                                            Show More Locations
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* View: Map */}
                    {viewMode === 'map' && (
                        <div className="h-[calc(100vh-280px)] rounded-[40px] overflow-hidden shadow-2xl border-4 border-white relative z-10">
                            {!isLoading && (
                                <MapView
                                    facilities={filteredFacilities || []}
                                    center={{
                                        lat: filters.location?.lat || latitude || 19.076,
                                        lng: filters.location?.lng || longitude || 72.8777
                                    }}
                                />
                            )}
                            {isLoading && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur flex items-center justify-center z-20">
                                    <div className="text-center">
                                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-[6px] border-indigo-600 border-t-transparent shadow-xl mb-4"></div>
                                        <p className="text-indigo-900 font-black uppercase tracking-widest text-sm">Initializing Map...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile Filter Overlay */}
            {showFilters && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300">
                    <div className="absolute bottom-0 w-full h-[90vh] bg-white rounded-t-[40px] p-2 animate-in slide-in-from-bottom duration-500 shadow-2xl">
                        <FilterSidebar onClose={() => setShowFilters(false)} mobile />
                    </div>
                </div>
            )}
        </div>
    );
}

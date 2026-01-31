import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSearchStore } from '../store/searchStore';
import { SearchBar } from '../components/customer/SearchBar';
import { MapPin, Clock, Shield, IndianRupee } from 'lucide-react';
import type { VehicleType } from '../types';

export default function LandingPage() {
    const { isAuthenticated, user } = useAuthStore();
    const { setFilters } = useSearchStore();
    const navigate = useNavigate();

    const handleSearch = (
        location: { lat: number; lng: number; address: string },
        vehicleType: VehicleType | ''
    ) => {
        setFilters({ location, vehicleType });
        navigate('/customer/search');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-primary">ParkEase</h1>
                        <div className="space-x-4">
                            {isAuthenticated ? (
                                <Link
                                    to={user?.role === 'PROVIDER' ? '/provider/dashboard' : '/customer/search'}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="px-4 py-2 text-gray-700 hover:text-primary">
                                        Login
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                <div className="text-center mb-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Find & Book Parking in Seconds
                    </h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Discover nearby parking spots, reserve instantly, and park hassle-free
                    </p>
                </div>

                {/* Search Bar */}
                <div className="flex justify-center mb-16">
                    <SearchBar onSearch={handleSearch} />
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-4 gap-6 mb-16">
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Search Nearby</h3>
                        <p className="text-gray-600 text-sm">
                            Find parking spots near your destination instantly
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Quick Booking</h3>
                        <p className="text-gray-600 text-sm">
                            Reserve your spot in just 30 seconds
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Secure Parking</h3>
                        <p className="text-gray-600 text-sm">
                            All facilities verified with 24/7 security
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <IndianRupee className="w-6 h-6 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Best Prices</h3>
                        <p className="text-gray-600 text-sm">
                            Transparent pricing with no hidden charges
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="bg-white rounded-lg shadow-md p-8 mb-16">
                    <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                1
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Search Location</h3>
                            <p className="text-gray-600">
                                Enter your destination and select your vehicle type
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                2
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Choose Parking</h3>
                            <p className="text-gray-600">
                                Browse available spots and select the best one
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                3
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Park & Go</h3>
                            <p className="text-gray-600">
                                Show your QR code and park hassle-free
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link
                        to="/customer/search"
                        className="inline-block px-12 py-4 bg-primary text-white rounded-lg text-lg font-semibold hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
                    >
                        Start Finding Parking
                    </Link>
                </div>
            </main>
        </div>
    );
}

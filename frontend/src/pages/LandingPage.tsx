import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSearchStore } from '../store/searchStore';
import { SearchBar } from '../components/customer/SearchBar';
import { MapPin, Clock, Shield, IndianRupee, Smartphone, CheckCircle, Zap, Star } from 'lucide-react';
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

    const popularLocations = [
        {
            name: 'Mumbai Terminal 2',
            image: '/C:/Users/Shivam/.gemini/antigravity/brain/9092f488-ed4a-46ee-b556-de9a80f08af1/parking_carousel_1_1769881196933.png',
            price: '₹100/hr',
            rating: '4.8'
        },
        {
            name: 'Cyber City, Gurgaon',
            image: '/C:/Users/Shivam/.gemini/antigravity/brain/9092f488-ed4a-46ee-b556-de9a80f08af1/parking_carousel_2_1769881217158.png',
            price: '₹50/hr',
            rating: '4.6'
        },
        {
            name: 'MG Road, Bangalore',
            image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80',
            price: '₹40/hr',
            rating: '4.7'
        },
        {
            name: 'Connaught Place, Delhi',
            image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80',
            price: '₹60/hr',
            rating: '4.5'
        }
    ];

    const howItWorks = [
        { icon: MapPin, title: 'Find', desc: 'Search for parking spots near your destination' },
        { icon: Clock, title: 'Book', desc: 'Reserve your spot in seconds with instant confirmation' },
        { icon: Zap, title: 'Park', desc: 'Navigate to your spot and park with a simple QR scan' }
    ];

    const features = [
        {
            icon: Shield,
            title: 'Verified Security',
            description: 'All spots are CCTV monitored and verified by our team',
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            icon: IndianRupee,
            title: 'Lowest Price',
            description: 'Save up to 60% compared to on-spot booking prices',
            color: 'text-green-600',
            bg: 'bg-green-100'
        },
        {
            icon: Smartphone,
            title: 'Digital Payments',
            description: 'Go cashless with UPI, Cards, and Wallet integrations',
            color: 'text-purple-600',
            bg: 'bg-purple-100'
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Header / Nav */}
            <nav className="absolute top-0 w-full z-20 px-6 py-4 flex justify-between items-center text-white">
                <h1 className="text-3xl font-black tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
                    Park<span className="text-primary-light">Easy</span>
                </h1>
                <div className="flex items-center gap-6 font-semibold">
                    <Link to="/customer/search" className="hover:text-primary-light transition-colors">Find Parking</Link>
                    {isAuthenticated ? (
                        <Link
                            to={user?.role === 'PROVIDER' ? '/provider/dashboard' : '/customer/search'}
                            className="bg-white text-indigo-900 px-6 py-2.5 rounded-full hover:bg-opacity-90 transition-all font-bold shadow-lg"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="hover:text-primary-light transition-colors">Login</Link>
                            <Link to="/signup" className="border-2 border-white px-6 py-2 rounded-full hover:bg-white hover:text-indigo-900 transition-all font-bold">Sign Up</Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative h-[85vh] bg-indigo-900 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1590674867571-d8ec88d926b0?q=80&w=2670&auto=format&fit=crop"
                        alt="Hero"
                        className="w-full h-full object-cover opacity-30 scale-110 blur-[2px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-900 via-transparent to-black/20" />
                </div>

                <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center">
                    <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.1]">
                        Smart Parking for<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Smart Cities</span>
                    </h2>
                    <p className="text-xl text-indigo-100/80 mb-12 max-w-2xl font-medium">
                        Join 2M+ owners who trust ParkEasy for daily parking.
                        Safe, secure, and always available.
                    </p>

                    {/* Search Bar Interface */}
                    <div className="w-full max-w-5xl bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
                        <SearchBar onSearch={handleSearch} />
                    </div>
                </div>
            </div>

            {/* Popular Locations Carousel Section */}
            <section className="py-24 bg-gray-50 border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h3 className="text-3xl font-black text-gray-900 mb-2">Popular Parking Spots</h3>
                            <p className="text-gray-500 font-medium">Top rated locations near major landmarks</p>
                        </div>
                        <Link to="/customer/search" className="text-indigo-600 font-bold hover:underline">View All Spots →</Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {popularLocations.map((loc, i) => (
                            <div key={i} className="group cursor-pointer bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 overflow-hidden">
                                <div className="h-48 overflow-hidden relative">
                                    <img src={loc.image} alt={loc.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-sm font-black flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        {loc.rating}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h4 className="font-bold text-lg mb-1 group-hover:text-indigo-600 transition-colors">{loc.name}</h4>
                                    <div className="flex justify-between items-center text-sm font-semibold">
                                        <span className="text-gray-400 flex items-center gap-1"><MapPin className="w-4 h-4" /> Near You</span>
                                        <span className="text-primary">{loc.price}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h3 className="text-4xl font-black text-gray-900 mb-4">How It Works</h3>
                        <p className="text-gray-500 font-medium max-w-xl mx-auto">Get your parking spot in 3 easy steps. Save time and money with ParkEasy.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-indigo-50 -translate-y-12 z-0"></div>

                        {howItWorks.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                                    <div className="w-24 h-24 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-indigo-200 group-hover:scale-110 transition-transform duration-300">
                                        <Icon size={40} />
                                    </div>
                                    <h4 className="text-2xl font-bold mb-3">{step.title}</h4>
                                    <p className="text-gray-500 leading-relaxed font-medium">{step.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Features Info Section */}
            <section className="py-20 bg-indigo-50/50">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {features.map((feature, i) => {
                        const Icon = feature.icon;
                        return (
                            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-100 flex gap-6 items-start">
                                <div className={`${feature.bg} p-4 rounded-2xl`}>
                                    <Icon className={feature.color} size={32} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
                                    <p className="text-gray-500 text-sm font-medium leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Mobile App Download Section */}
            <section className="py-24 bg-indigo-900 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-white opacity-5 transform skew-x-12 translate-x-32" />
                <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1 text-center lg:text-left">
                        <h3 className="text-4xl md:text-5xl font-black text-white mb-8">Download the App for exclusive offers</h3>
                        <p className="text-xl text-indigo-100/70 mb-10 leading-relaxed">
                            Book faster, get real-time navigation, and exclusive discounts on your first 3 bookings.
                            Available on iOS and Android.
                        </p>
                        <ul className="space-y-4 mb-12">
                            {['Real-time vacancy tracking', 'One-tap booking history', 'Priority 24/7 Support'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-white font-semibold">
                                    <CheckCircle className="text-teal-400 w-5 h-5 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                            <button className="bg-white text-black px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-gray-100 transition-all shadow-xl">
                                <Smartphone className="w-6 h-6" /> App Store
                            </button>
                            <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-700 transition-all border border-indigo-500 shadow-xl">
                                <Smartphone className="w-6 h-6" /> Google Play
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <div className="relative z-10 w-full max-w-[400px] mx-auto scale-110 lg:scale-[1.25]">
                            <img src="/C:/Users/Shivam/.gemini/antigravity/brain/9092f488-ed4a-46ee-b556-de9a80f08af1/mobile_app_mockup_1769881236082.png" alt="App Mockup" className="rounded-[40px] shadow-2xl border-8 border-indigo-800" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 bg-gray-50 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="md:col-span-2">
                        <h1 className="text-3xl font-black tracking-tighter mb-6">ParkEase</h1>
                        <p className="text-gray-500 font-medium max-w-sm leading-relaxed">
                            Transforming urban mobility by making parking simple, accessible, and sustainable for everyone.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-black mb-6 text-gray-900 uppercase tracking-widest text-sm">Company</h4>
                        <ul className="space-y-4 text-gray-500 font-bold">
                            <li><Link to="/about" className="hover:text-indigo-600">About Us</Link></li>
                            <li><Link to="/blog" className="hover:text-indigo-600">Blog</Link></li>
                            <li><Link to="/careers" className="hover:text-indigo-600">Careers</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-black mb-6 text-gray-900 uppercase tracking-widest text-sm">Support</h4>
                        <ul className="space-y-4 text-gray-500 font-bold">
                            <li><Link to="/help" className="hover:text-indigo-600">Help Center</Link></li>
                            <li><Link to="/safety" className="hover:text-indigo-600">Safety</Link></li>
                            <li><Link to="/contact" className="hover:text-indigo-600">Contact</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-gray-200 text-center text-gray-400 font-bold text-sm">
                    © 2026 ParkEase Technologies. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

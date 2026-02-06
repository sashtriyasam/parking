import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSearchStore } from '../store/searchStore';
import { MapPin, ArrowRight, Star, ChevronLeft, ChevronRight, Building2, Shield, Zap, Info, Clock, ShieldCheck } from 'lucide-react';
import type { VehicleType } from '../types';

export default function LandingPage() {
    const { setFilters } = useSearchStore();
    const navigate = useNavigate();
    const [activeBanner, setActiveBanner] = useState(0);

    const banners = [
        {
            image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=2000',
            title: 'Prime Parking at T2 Terminal',
            subtitle: 'Book now and save up to 40% on airport parking fees.',
            color: 'bg-indigo-600'
        },
        {
            image: 'https://images.unsplash.com/photo-1590674867571-d8ec88d926b0?q=80&w=2000&auto=format&fit=crop',
            title: 'Secure Spots in Cyber City',
            subtitle: 'Exclusive discounts for office goers and monthly passes.',
            color: 'bg-red-500'
        },
        {
            image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=2000',
            title: 'Hassle-free Weekend Parking',
            subtitle: 'Find the best spots near malls and major shopping hubs.',
            color: 'bg-amber-500'
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveBanner((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

    const recommendedHubs = [
        { name: 'Terminal 2 Elite', location: 'Mumbai Airport', rating: 4.8, price: '₹120/hr', image: 'https://images.unsplash.com/photo-1590674867571-d8ec88d926b0?q=80&w=600&fit=crop' },
        { name: 'DLF Cyber Park', location: 'Gurgaon', rating: 4.6, price: '₹60/hr', image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=600&fit=crop' },
        { name: 'UB City Secure', location: 'Bangalore', rating: 4.9, price: '₹80/hr', image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?q=80&w=600&fit=crop' },
        { name: 'Select City Walk', location: 'Delhi', rating: 4.5, price: '₹100/hr', image: 'https://images.unsplash.com/photo-1590674412391-7f749595e28b?q=80&w=600&fit=crop' },
        { name: 'Phoenix Marketcity', location: 'Pune', rating: 4.7, price: '₹50/hr', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600&fit=crop' },
    ];

    const categories = [
        { name: 'Airports', icon: Zap, count: '12 Spots' },
        { name: 'Malls', icon: Building2, count: '45 Spots' },
        { name: 'Offices', icon: Shield, count: '28 Spots' },
        { name: 'Events', icon: Star, count: '15 Spots' },
        { name: 'Daily', icon: Clock, count: '100+ Spots' },
        { name: 'Security', icon: ShieldCheck, count: 'Verified' },
    ];

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Hero Carousel Section */}
            <section className="relative h-[300px] md:h-[450px] overflow-hidden mt-16">
                <div
                    className="flex transition-transform duration-700 ease-in-out h-full"
                    style={{ transform: `translateX(-${activeBanner * 100}%)` }}
                >
                    {banners.map((banner, i) => (
                        <div key={i} className="min-w-full h-full relative">
                            <img src={banner.image} className="w-full h-full object-cover" alt={banner.title} />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center">
                                <div className="max-w-7xl mx-auto px-6 w-full">
                                    <div className="max-w-lg mb-8">
                                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">{banner.title}</h2>
                                        <p className="text-lg text-gray-300 font-medium">{banner.subtitle}</p>
                                    </div>
                                    <Link to="/customer/search" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">
                                        Explore Now <ArrowRight size={18} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Carousel Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {banners.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveBanner(i)}
                            className={`w-2 h-2 rounded-full transition-all ${activeBanner === i ? 'bg-primary w-6' : 'bg-white/50 hover:bg-white'}`}
                        />
                    ))}
                </div>
            </section>

            {/* Recommended Hubs Section (Horizontal Scroll) */}
            <section className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Recommended Parking Hubs</h2>
                            <p className="text-sm text-gray-500 font-medium">Verified spots with top-tier security and convenience</p>
                        </div>
                        <Link to="/customer/search" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                            See All <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x">
                        {recommendedHubs.map((hub, i) => (
                            <div key={i} className="min-w-[260px] md:min-w-[280px] snap-start group cursor-pointer">
                                <div className="aspect-[3/4] rounded-xl overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
                                    <img src={hub.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={hub.name} />
                                </div>
                                <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{hub.name}</h3>
                                <p className="text-xs text-gray-500 font-medium mb-1">{hub.location}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                                        <Star size={12} fill="currentColor" /> {hub.rating}
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{hub.price}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* List Your Space Promo */}
            <section className="bg-gray-50 py-12 mb-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-[#333545] rounded-xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                        <div className="relative z-10 text-center md:text-left">
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Own a Parking Spot?</h3>
                            <p className="text-gray-400 text-lg font-medium mb-8 max-w-md">List your empty parking space on ParkEasy and start earning passive income today.</p>
                            <Link to="/provider/dashboard" className="inline-flex px-10 py-4 bg-primary text-white rounded-lg font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                                List Your Space Now
                            </Link>
                        </div>
                        <div className="relative z-10 hidden lg:block opacity-20">
                            <Building2 size={200} className="text-white" />
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-[60px]" />
                    </div>
                </div>
            </section>

            {/* Popular Regions / Locations */}
            <section className="pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-2xl font-bold text-gray-900">Explore by Category</h2>
                        <button className="text-sm font-bold text-primary flex items-center gap-1">
                            Browse All <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {categories.map((cat, i) => (
                            <div key={i} className="group cursor-pointer text-center">
                                <div className="w-20 h-20 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-primary/5 group-hover:text-primary transition-all mb-4 border border-gray-100">
                                    <cat.icon size={32} />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1">{cat.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{cat.count}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}


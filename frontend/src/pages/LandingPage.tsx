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

    const features = [
        {
            icon: MapPin,
            title: 'Smart Location',
            description: 'Find parking spots near you with real-time availability',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            icon: Clock,
            title: '24/7 Booking',
            description: 'Book parking anytime, anywhere with instant confirmation',
            color: 'from-purple-500 to-pink-500'
        },
        {
            icon: Shield,
            title: 'Secure Parking',
            description: 'CCTV monitored facilities for your vehicle safety',
            color: 'from-green-500 to-emerald-500'
        },
        {
            icon: IndianRupee,
            title: 'Best Prices',
            description: 'Transparent pricing with no hidden charges',
            color: 'from-orange-500 to-red-500'
        },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            {/* Hero Section */}
            <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '20px 0' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                    {/* Navigation */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            ParkEasy
                        </h1>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            {isAuthenticated ? (
                                <Link
                                    to={user?.role === 'PROVIDER' ? '/provider/dashboard' : '/customer/search'}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        fontWeight: '600'
                                    }}
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        style={{
                                            padding: '12px 24px',
                                            color: '#667eea',
                                            textDecoration: 'none',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/signup"
                                        style={{
                                            padding: '12px 24px',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Hero Content */}
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <h2 style={{ fontSize: '56px', fontWeight: '900', color: '#1a202c', marginBottom: '24px', lineHeight: '1.2' }}>
                            Find Your Perfect<br />
                            <span style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Parking Spot
                            </span>
                        </h2>
                        <p style={{ fontSize: '20px', color: '#4a5568', maxWidth: '700px', margin: '0 auto 40px', lineHeight: '1.6' }}>
                            Book parking in advance, save time, and park with confidence.
                            Hassle-free parking solutions across your city.
                        </p>

                        {/* Search Bar */}
                        <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxWidth: '900px', margin: '0 auto' }}>
                            <SearchBar onSearch={handleSearch} />
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '60px', maxWidth: '900px', margin: '60px auto 0' }}>
                            {[
                                { value: '500+', label: 'Parking Locations' },
                                { value: '50K+', label: 'Happy Customers' },
                                { value: '4.8★', label: 'Average Rating' },
                                { value: '24/7', label: 'Support Available' },
                            ].map((stat, index) => (
                                <div key={index} style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                                    <div style={{ fontSize: '32px', fontWeight: '900', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        {stat.value}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#718096', marginTop: '8px', fontWeight: '600' }}>
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div style={{ padding: '80px 20px', background: 'white' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h3 style={{ fontSize: '42px', fontWeight: '900', color: '#1a202c', marginBottom: '16px' }}>
                            Why Choose ParkEasy?
                        </h3>
                        <p style={{ fontSize: '18px', color: '#718096', maxWidth: '600px', margin: '0 auto' }}>
                            Experience the future of parking with our smart, secure, and convenient platform
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={index}
                                    style={{
                                        padding: '30px',
                                        background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
                                        borderRadius: '16px',
                                        border: '2px solid #e2e8f0',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-8px)';
                                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '12px',
                                        background: `linear-gradient(135deg, ${feature.color.split(' ')[0].replace('from-', '#')} 0%, ${feature.color.split(' ')[2].replace('to-', '#')} 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '20px'
                                    }}>
                                        <Icon size={30} color="white" />
                                    </div>
                                    <h4 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a202c', marginBottom: '12px' }}>
                                        {feature.title}
                                    </h4>
                                    <p style={{ color: '#718096', lineHeight: '1.6' }}>
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div style={{ padding: '80px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '42px', fontWeight: '900', color: 'white', marginBottom: '16px' }}>
                        Ready to Park Smarter?
                    </h3>
                    <p style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '40px' }}>
                        Join thousands of satisfied customers who have made parking stress-free
                    </p>
                    {!isAuthenticated ? (
                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link
                                to="/signup"
                                style={{
                                    padding: '16px 40px',
                                    background: 'white',
                                    color: '#667eea',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '18px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                }}
                            >
                                Get Started Free
                            </Link>
                            <Link
                                to="/login"
                                style={{
                                    padding: '16px 40px',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '18px',
                                    border: '2px solid white'
                                }}
                            >
                                Login
                            </Link>
                        </div>
                    ) : (
                        <Link
                            to={user?.role === 'PROVIDER' ? '/provider/dashboard' : '/customer/search'}
                            style={{
                                display: 'inline-block',
                                padding: '16px 40px',
                                background: 'white',
                                color: '#667eea',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                fontSize: '18px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                            }}
                        >
                            Go to Dashboard
                        </Link>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '40px 20px', background: '#1a202c', color: 'white' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    <p style={{ fontSize: '16px', color: '#a0aec0' }}>
                        © 2026 ParkEasy. All rights reserved. | Making parking simple, smart, and stress-free.
                    </p>
                </div>
            </div>
        </div>
    );
}

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, Menu, X, User, LogOut, Ticket, CreditCard, MapPin, LayoutDashboard, Building2 } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { isAuthenticated, user, clearAuth } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        clearAuth();
        navigate('/');
        setMobileMenuOpen(false);
    };

    const isActive = (path: string) => location.pathname === path;

    // Customer navigation items
    const customerNavItems = [
        { path: '/customer/search', label: 'Find Parking', icon: MapPin },
        { path: '/customer/tickets', label: 'My Tickets', icon: Ticket },
        { path: '/customer/passes', label: 'My Passes', icon: CreditCard },
        { path: '/customer/profile', label: 'Profile', icon: User },
    ];

    // Provider navigation items
    const providerNavItems = [
        { path: '/provider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/provider/facilities', label: 'Facilities', icon: Building2 },
    ];

    const navItems = user?.role === 'PROVIDER' ? providerNavItems : customerNavItems;

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl group-hover:scale-105 transition-transform">
                            <Car className="text-white" size={24} />
                        </div>
                        <span className="text-xl font-black text-gray-900">
                            Park<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Easy</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {isAuthenticated ? (
                            <>
                                {/* Navigation Links */}
                                <div className="flex items-center gap-1">
                                    {navItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isActive(item.path)
                                                    ? 'bg-indigo-50 text-indigo-600'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                            >
                                                <Icon size={18} />
                                                <span>{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* User Menu */}
                                <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
                                        <p className="text-xs text-gray-500 capitalize">{user?.role.toLowerCase()}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-all"
                                    >
                                        <LogOut size={18} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-md"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 bg-white">
                    <div className="px-4 py-4 space-y-2">
                        {isAuthenticated ? (
                            <>
                                {/* User Info */}
                                <div className="pb-3 mb-3 border-b border-gray-200">
                                    <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user?.role.toLowerCase()}</p>
                                </div>

                                {/* Navigation Links */}
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive(item.path)
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <Icon size={20} />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}

                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-all mt-3"
                                >
                                    <LogOut size={20} />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-3 text-gray-600 hover:bg-gray-50 font-semibold rounded-lg transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg text-center transition-all"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

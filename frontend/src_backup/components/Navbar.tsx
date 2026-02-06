import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, Menu, X, User, LogOut, Ticket, CreditCard, MapPin, LayoutDashboard, Building2, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
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

    const customerNavItems = [
        { path: '/customer/search', label: 'Explore', icon: MapPin },
        { path: '/customer/tickets', label: 'My Bookings', icon: Ticket },
        { path: '/customer/passes', label: 'Memberships', icon: CreditCard },
    ];

    const providerNavItems = [
        { path: '/provider/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/provider/facilities', label: 'My Facilities', icon: Building2 },
        { path: '/provider/bookings', label: 'All Bookings', icon: Ticket },
    ];

    const navItems = user?.role === 'PROVIDER' ? providerNavItems : customerNavItems;

    return (
        <nav className="fixed top-0 w-full z-50 bg-white border-b border-gray-100 py-3 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 flex items-center gap-8">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 shrink-0">
                    <div className="bg-primary p-2 rounded-xl shadow-md shadow-primary/20">
                        <Car className="text-white" size={20} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-gray-900">
                        Park<span className="text-primary">Easy</span>
                    </span>
                </Link>

                {/* Centralized Search Bar (BMS Style) */}
                <div className="flex-grow max-w-2xl hidden md:block">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <MapPin className="text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search for Parking Hubs, Locations, or Regions..."
                            className="w-full h-11 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm transition-all focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none"
                        />
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-6 ml-auto">
                    {/* Location Selector */}
                    <button className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                        <span>Mumbai</span>
                        <ChevronDown size={14} className="mt-0.5" />
                    </button>

                    {isAuthenticated ? (
                        <div className="flex items-center gap-4">
                            <Link
                                to={user?.role === 'PROVIDER' ? '/provider/dashboard' : '/customer/tickets'}
                                className={`hidden lg:block text-xs font-semibold uppercase tracking-wider transition-colors ${isActive('/provider/dashboard') || isActive('/customer/tickets') ? 'text-primary' : 'text-gray-500 hover:text-primary'
                                    }`}
                            >
                                {user?.role === 'PROVIDER' ? 'Manage Hubs' : 'My Bookings'}
                            </Link>

                            <div className="h-6 w-px bg-gray-100 hidden lg:block" />

                            <Link
                                to="/customer/profile"
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-inner ${isActive('/customer/profile') ? 'bg-primary text-white shadow-primary/20' : 'bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary'
                                    }`}
                                title="Profile Settings"
                            >
                                <User size={20} />
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/login"
                                className="px-5 py-2 text-sm font-semibold text-gray-700 hover:text-primary transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/signup"
                                className="px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] transition-all"
                            >
                                Join
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-top-2">
                    <div className="p-6 space-y-4">
                        {isAuthenticated ? (
                            <>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-primary">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{user?.full_name}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{user?.role}</p>
                                    </div>
                                </div>
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`block py-3 text-sm font-medium border-b border-gray-50 transition-colors ${isActive(item.path) ? 'text-primary' : 'text-gray-600'}`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                                <Link
                                    to="/customer/profile"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block py-3 text-sm font-medium border-b border-gray-50 transition-colors ${isActive('/customer/profile') ? 'text-primary' : 'text-gray-600'}`}
                                >
                                    Profile Settings
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left py-3 text-sm font-medium text-red-500"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="py-3 text-center text-sm font-semibold border border-gray-200 rounded-lg">Login</Link>
                                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="py-3 text-center text-sm font-bold bg-primary text-white rounded-lg">Join</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

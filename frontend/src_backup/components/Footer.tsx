import { Link } from 'react-router-dom';
import { Car, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ChevronRight } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="w-full flex flex-col">
            {/* List Your Space CTA Banner (BMS Style) */}
            <div className="bg-[#333545] py-4">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#41445a] p-2 rounded-lg">
                            <Car className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">List your Space</h3>
                            <p className="text-xs text-gray-400">Join our network of parking providers and start earning</p>
                        </div>
                    </div>
                    <Link
                        to="/provider/dashboard"
                        className="px-6 py-2 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all whitespace-nowrap"
                    >
                        Register Now
                    </Link>
                </div>
            </div>

            {/* Main Footer Body */}
            <div className="bg-[#2A2D3E] pt-16 pb-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        {/* Branding */}
                        <div className="space-y-6">
                            <Link to="/" className="flex items-center gap-2">
                                <div className="bg-primary p-2 rounded-xl">
                                    <Car className="text-white" size={20} />
                                </div>
                                <span className="text-xl font-bold tracking-tight text-white">
                                    Park<span className="text-primary">Easy</span>
                                </span>
                            </Link>
                            <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
                                India's leading parking discovery platform. We simplify the way you find, book, and manage your parking spaces efficiently.
                            </p>
                            <div className="flex gap-4">
                                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                    <button key={i} className="text-gray-400 hover:text-white transition-colors">
                                        <Icon size={18} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Customer Links */}
                        <div className="space-y-6">
                            <h4 className="text-white text-xs font-bold uppercase tracking-widest px-1 border-l-2 border-primary">Customer</h4>
                            <ul className="space-y-3">
                                {['Find Parking', 'Memberships', 'My Bookings', 'Help Center'].map((text) => (
                                    <li key={text}>
                                        <Link to="/customer/search" className="text-xs text-gray-400 hover:text-white transition-colors flex items-center group">
                                            <ChevronRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-1 text-primary" />
                                            {text}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Provider Links */}
                        <div className="space-y-6">
                            <h4 className="text-white text-xs font-bold uppercase tracking-widest px-1 border-l-2 border-primary">Provider</h4>
                            <ul className="space-y-3">
                                {['List Your Space', 'How it Works', 'Dashboard', 'Success Stories'].map((text) => (
                                    <li key={text}>
                                        <Link to="/provider/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors flex items-center group">
                                            <ChevronRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-1 text-primary" />
                                            {text}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact */}
                        <div className="space-y-6">
                            <h4 className="text-white text-xs font-bold uppercase tracking-widest px-1 border-l-2 border-primary">Get in Touch</h4>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <MapPin size={16} className="text-primary shrink-0" />
                                    <span className="text-xs text-gray-400">123 Smart Plaza, Tech Parks<br />Mumbai, MH 400001</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail size={16} className="text-primary shrink-0" />
                                    <span className="text-xs text-gray-400">support@parkeasy.co</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-gray-100/10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.2em]">
                            © 2026 ParkEasy Technologies Pvt Ltd.
                        </p>
                        <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            <button className="hover:text-primary transition-colors">Privacy</button>
                            <button className="hover:text-primary transition-colors">Terms</button>
                            <button className="hover:text-primary transition-colors">Sitemap</button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

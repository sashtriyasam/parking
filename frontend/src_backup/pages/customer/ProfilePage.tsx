import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Car, CreditCard, Settings, Heart, Save, ChevronLeft, LogOut, Shield, MapPin, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customer.service';
import VehiclesList from '../../components/customer/profile/VehiclesList';
import PaymentMethodsList from '../../components/customer/profile/PaymentMethodsList';
import PreferencesForm from '../../components/customer/profile/PreferencesForm';
import FavoritesList from '../../components/customer/profile/FavoritesList';

export default function ProfilePage() {
    const [activeSection, setActiveSection] = useState<'personal' | 'vehicles' | 'payments' | 'preferences' | 'favorites'>('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
    });

    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: () => customerService.getProfile(),
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                email: profile.email || '',
                phone_number: profile.phone_number || '',
            });
        }
    }, [profile]);

    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => customerService.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setIsEditing(false);
        },
    });

    const sections = [
        { id: 'personal' as const, label: 'Profile Settings', icon: User, desc: 'Name, Email, Phone' },
        { id: 'vehicles' as const, label: 'My Vehicles', icon: Car, desc: 'Add or modify vehicles' },
        { id: 'payments' as const, label: 'Payments', icon: CreditCard, desc: 'Saved cards & UPI' },
        { id: 'favorites' as const, label: 'Favorite Hubs', icon: Heart, desc: 'Quick access spots' },
        { id: 'preferences' as const, label: 'Security', icon: Shield, desc: 'Password & Privacy' },
    ];

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent pb-20">
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Navigation Sidebar */}
                    <aside className="lg:col-span-4 space-y-8">
                        {/* User Card */}
                        <div className="p-8 bg-[#111827] rounded-[48px] text-white relative overflow-hidden shadow-2xl">
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 border border-white/10 ring-8 ring-white/5">
                                    <User size={48} className="text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight">{formData.full_name}</h2>
                                <p className="text-indigo-300 font-bold text-sm">{formData.email}</p>
                                <div className="mt-6 flex items-center gap-2 bg-indigo-500/20 px-4 py-2 rounded-full border border-indigo-500/30">
                                    <Zap size={14} className="text-indigo-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Premium Member</span>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-12 translate-x-16" />
                        </div>

                        {/* Menu */}
                        <nav className="space-y-4">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => {
                                            setActiveSection(section.id);
                                            setIsEditing(false);
                                        }}
                                        className={`
                                            w-full p-6 rounded-[32px] flex items-center gap-5 transition-all
                                            ${isActive
                                                ? 'bg-white border-2 border-indigo-600 shadow-xl shadow-indigo-100 scale-102'
                                                : 'bg-white border border-gray-100 text-gray-400 hover:border-indigo-200'}
                                        `}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
                                            <Icon size={24} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-sm font-black ${isActive ? 'text-gray-900' : 'text-gray-400'} uppercase tracking-widest`}>{section.label}</p>
                                            <p className="text-[10px] font-bold text-gray-500 mt-0.5">{section.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Content Section */}
                    <section className="lg:col-span-8">
                        <div className="bg-white rounded-[48px] p-8 md:p-12 border border-gray-100 shadow-sm min-h-[600px] animate-in slide-in-from-right-10 duration-500">
                            {activeSection === 'personal' && (
                                <div className="space-y-10">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900">Personal Info</h3>
                                            <p className="text-sm font-bold text-gray-400">Manage your basic identification details.</p>
                                        </div>
                                        <button
                                            onClick={() => isEditing ? updateProfileMutation.mutate(formData) : setIsEditing(true)}
                                            className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isEditing ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-gray-50 text-indigo-600 hover:bg-indigo-50'}`}
                                        >
                                            {isEditing ? (updateProfileMutation.isPending ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
                                        </button>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Identity Name</label>
                                            <div className="relative group">
                                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                                <input
                                                    type="text"
                                                    value={formData.full_name}
                                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                    disabled={!isEditing}
                                                    className="w-full h-16 pl-14 pr-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all disabled:opacity-60"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Verified Email Address</label>
                                            <div className="relative opacity-60">
                                                <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    disabled
                                                    className="w-full h-16 pl-14 pr-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold outline-none cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                                <input
                                                    type="tel"
                                                    value={formData.phone_number}
                                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                                    disabled={!isEditing}
                                                    className="w-full h-16 pl-14 pr-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all disabled:opacity-60"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50 border border-indigo-100 rounded-[32px] p-8 mt-12 flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 shrink-0">
                                            <Zap size={32} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 leading-none mb-2">Profile Verification</h4>
                                            <p className="text-gray-500 text-xs font-bold leading-relaxed">Your profile is 85% complete. Verify your identity to unlock higher wallet limits and priority bookings.</p>
                                        </div>
                                        <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all whitespace-nowrap">Verify Now</button>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'vehicles' && <VehiclesList />}
                            {activeSection === 'payments' && <PaymentMethodsList />}
                            {activeSection === 'preferences' && <PreferencesForm />}
                            {activeSection === 'favorites' && <FavoritesList />}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

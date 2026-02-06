import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Clock, Edit, Building2, ParkingSquare, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { providerService } from '../../services/provider.service';

// Tab content components (to be created)
import OverviewTab from '../../components/provider/facilities/tabs/OverviewTab';
import SlotsTab from '../../components/provider/facilities/tabs/SlotsTab';
import PricingTab from '../../components/provider/facilities/tabs/PricingTab';
import BookingsTab from '../../components/provider/facilities/tabs/BookingsTab';
import AnalyticsTab from '../../components/provider/facilities/tabs/AnalyticsTab';

export default function FacilityDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'slots' | 'pricing' | 'bookings' | 'analytics'>('overview');

    // Fetch facility details
    const { data: facility, isLoading } = useQuery({
        queryKey: ['provider', 'facilities', id],
        queryFn: () => providerService.getFacilityDetails(id!),
        enabled: !!id,
    });

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Building2 },
        { id: 'slots', label: 'Floors & Slots', icon: ParkingSquare },
        { id: 'pricing', label: 'Pricing', icon: DollarSign },
        { id: 'bookings', label: 'Bookings', icon: FileText },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading facility...</p>
                </div>
            </div>
        );
    }

    if (!facility) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                        <Building2 size={48} className="text-red-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-3">Facility Not Found</h3>
                    <p className="text-sm font-bold text-gray-400 mb-8">This facility doesn't exist or has been deleted.</p>
                    <button
                        onClick={() => navigate('/provider/facilities')}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-[28px] text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                    >
                        Back to Facilities
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent">

            {/* Header with Hero Image */}
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <button
                        onClick={() => navigate('/provider/facilities')}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-sm mb-6 transition-colors"
                    >
                        <ArrowLeft size={18} /> Back to Facilities
                    </button>

                    {/* Hero Section */}
                    <div className="relative rounded-[40px] overflow-hidden h-80 mb-6 shadow-xl">
                        <img
                            src={facility.image_url || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80'}
                            alt={facility.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                        {/* Content Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-10">
                            <div className="flex items-end justify-between">
                                <div className="flex-1">
                                    <h1 className="text-5xl font-black text-white tracking-tight leading-none mb-4">
                                        {facility.name}
                                    </h1>
                                    <div className="flex items-center gap-8 text-white/90">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                                <MapPin size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-white/60">Location</p>
                                                <p className="text-sm font-bold">{facility.address}, {facility.city}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-white/60">Hours</p>
                                                <p className="text-sm font-bold">{facility.operating_hours || '24/7'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate(`/provider/facilities/${id}/edit`)}
                                    className="px-8 py-4 bg-white/95 backdrop-blur text-gray-900 rounded-[28px] text-sm font-black uppercase tracking-widest hover:bg-white shadow-2xl flex items-center gap-3 transition-all"
                                >
                                    <Edit size={20} /> Edit Facility
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-[32px] p-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-[24px] text-sm font-black uppercase tracking-widest transition-all ${isActive
                                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-white'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span className="hidden md:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Tab Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {activeTab === 'overview' && <OverviewTab facility={facility} />}
                {activeTab === 'slots' && <SlotsTab facilityId={id!} />}
                {activeTab === 'pricing' && <PricingTab facilityId={id!} />}
                {activeTab === 'bookings' && <BookingsTab facilityId={id!} />}
                {activeTab === 'analytics' && <AnalyticsTab facilityId={id!} />}
            </main>
        </div>
    );
}

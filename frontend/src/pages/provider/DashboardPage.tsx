import { useQuery } from '@tanstack/react-query';
import { IndianRupee, Users, ParkingSquare, TrendingUp, Plus, Settings, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/provider/dashboard/StatCard';
import RevenueChart from '../../components/provider/dashboard/RevenueChart';
import OccupancyChart from '../../components/provider/dashboard/OccupancyChart';
import RecentBookingsTable from '../../components/provider/dashboard/RecentBookingsTable';
import { providerService } from '../../services/provider.service';
import Navbar from '../../components/Navbar';

export default function ProviderDashboard() {
    const navigate = useNavigate();

    // Fetch dashboard stats
    const { data: stats } = useQuery({
        queryKey: ['provider', 'dashboard', 'stats'],
        queryFn: () => providerService.getDashboardStats(),
    });

    // Fetch revenue data
    const { data: revenueData = [], refetch: refetchRevenue } = useQuery({
        queryKey: ['provider', 'dashboard', 'revenue', '7d'],
        queryFn: () => providerService.getRevenueData('7d'),
    });

    // Fetch occupancy data
    const { data: occupancyData = [] } = useQuery({
        queryKey: ['provider', 'dashboard', 'occupancy'],
        queryFn: () => providerService.getOccupancyData(),
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    // Fetch recent bookings
    const { data: recentBookings = [] } = useQuery({
        queryKey: ['provider', 'dashboard', 'recent-bookings'],
        queryFn: () => providerService.getRecentBookings(10),
        refetchInterval: 15000, // Refetch every 15 seconds
    });

    const handlePeriodChange = (newPeriod: string) => {
        // Update query key to trigger refetch with new period
        refetchRevenue();
    };

    const quickActions = [
        { icon: Plus, label: 'New Facility', desc: 'Register a new parking hub', action: () => navigate('/provider/facilities/new'), color: 'bg-indigo-50 text-indigo-600' },
        { icon: ParkingSquare, label: 'Add Slots', desc: 'Bulk create parking slots', action: () => navigate('/provider/facilities'), color: 'bg-emerald-50 text-emerald-600' },
        { icon: Settings, label: 'Update Pricing', desc: 'Modify hourly rates', action: () => navigate('/provider/pricing'), color: 'bg-amber-50 text-amber-600' },
        { icon: FileText, label: 'View Reports', desc: 'Export analytics', action: () => navigate('/provider/reports'), color: 'bg-red-50 text-red-600' },
    ];

    // Calculate metrics
    const todayRevenue = stats?.today_revenue || 0;
    const revenueChange = stats?.revenue_change_percent || 0;
    const activeBookings = stats?.active_bookings || 0;
    const totalSlots = stats?.total_slots || 0;
    const occupancyRate = stats?.occupancy_rate || 0;

    return (
        <div className="min-h-screen bg-[#fafafa]">
            <Navbar />

            {/* Premium Header */}
            <header className="bg-white border-b border-gray-100 sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">Provider Dashboard</h1>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Real-time analytics & management hub</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
                {/* Stats Overview */}
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <StatCard
                            title="Today's Revenue"
                            value={`₹${todayRevenue.toLocaleString('en-IN')}`}
                            change={revenueChange}
                            icon={IndianRupee}
                            colorScheme="emerald"
                            subtitle="Collected today"
                        />
                        <StatCard
                            title="Active Bookings"
                            value={activeBookings}
                            icon={Users}
                            colorScheme="indigo"
                            subtitle="Currently parked"
                        />
                        <StatCard
                            title="Total Slots"
                            value={totalSlots}
                            icon={ParkingSquare}
                            colorScheme="slate"
                            subtitle="Across all facilities"
                        />
                        <StatCard
                            title="Occupancy Rate"
                            value={`${occupancyRate.toFixed(1)}%`}
                            icon={TrendingUp}
                            colorScheme={occupancyRate >= 90 ? 'red' : occupancyRate >= 70 ? 'amber' : 'emerald'}
                            subtitle="Current capacity"
                        />
                    </div>
                </section>

                {/* Revenue & Occupancy */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="lg:col-span-1">
                        <RevenueChart data={revenueData} onPeriodChange={handlePeriodChange} />
                    </div>
                    <div className="lg:col-span-1">
                        <OccupancyChart data={occupancyData} />
                    </div>
                </section>

                {/* Recent Bookings & Quick Actions */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <RecentBookingsTable bookings={recentBookings} />
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm sticky top-32">
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Quick Actions</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Shortcuts to key tasks</p>
                            </div>

                            <div className="space-y-4">
                                {quickActions.map((action, idx) => {
                                    const Icon = action.icon;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={action.action}
                                            className="group w-full p-6 bg-gray-50 hover:bg-white hover:border-indigo-200 hover:shadow-xl border border-gray-50 rounded-[32px] transition-all text-left flex items-center gap-4"
                                        >
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform shadow-sm`}>
                                                <Icon size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none mb-1">{action.label}</p>
                                                <p className="text-[10px] font-bold text-gray-400">{action.desc}</p>
                                            </div>
                                            <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

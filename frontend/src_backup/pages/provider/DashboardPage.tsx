import { useQuery } from '@tanstack/react-query';
import { IndianRupee, Users, ParkingSquare, TrendingUp, Plus, Settings, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/provider/dashboard/StatCard';
import RevenueChart from '../../components/provider/dashboard/RevenueChart';
import OccupancyChart from '../../components/provider/dashboard/OccupancyChart';
import RecentBookingsTable from '../../components/provider/dashboard/RecentBookingsTable';
import { providerService } from '../../services/provider.service';

export default function ProviderDashboard() {
    const navigate = useNavigate();

    const { data: stats } = useQuery({
        queryKey: ['provider', 'dashboard', 'stats'],
        queryFn: () => providerService.getDashboardStats(),
    });

    const { data: revenueData = [], refetch: refetchRevenue } = useQuery({
        queryKey: ['provider', 'dashboard', 'revenue', '7d'],
        queryFn: () => providerService.getRevenueData('7d'),
    });

    const { data: occupancyData = [] } = useQuery({
        queryKey: ['provider', 'dashboard', 'occupancy'],
        queryFn: () => providerService.getOccupancyData(),
        refetchInterval: 30000,
    });

    const { data: recentBookings = [] } = useQuery({
        queryKey: ['provider', 'dashboard', 'recent-bookings'],
        queryFn: () => providerService.getRecentBookings(10),
        refetchInterval: 15000,
    });

    const handlePeriodChange = (newPeriod: string) => {
        refetchRevenue();
    };

    const quickActions = [
        { icon: Plus, label: 'Add Facility', desc: 'List a new parking zone', action: () => navigate('/provider/facilities/new'), color: 'text-primary' },
        { icon: ParkingSquare, label: 'Manage Slots', desc: 'Update availability & types', action: () => navigate('/provider/facilities'), color: 'text-indigo-500' },
        { icon: FileText, label: 'Reports', desc: 'Export monthly analytics', action: () => navigate('/provider/reports'), color: 'text-gray-600' },
    ];

    const todayRevenue = stats?.today_revenue || 0;
    const revenueChange = stats?.revenue_change_percent || 0;
    const activeBookings = stats?.active_bookings || 0;
    const totalSlots = stats?.total_slots || 0;
    const occupancyRate = stats?.occupancy_rate || 0;

    return (
        <div className="min-h-screen bg-white">
            {/* Minimal Partner Header */}
            <header className="pt-24 pb-12 border-b border-gray-50 bg-gray-50/30">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded">Partner</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">• Dashboard</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Partner Overview</h1>
                    </div>

                    <button
                        onClick={() => navigate('/provider/facilities/new')}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                    >
                        <Plus size={18} /> List New Facility
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatCard
                        title="Today's Revenue"
                        value={`₹${todayRevenue.toLocaleString('en-IN')}`}
                        change={revenueChange}
                        icon={IndianRupee}
                        colorScheme="emerald"
                        subtitle="vs yesterday"
                    />
                    <StatCard
                        title="Active Bookings"
                        value={activeBookings}
                        icon={Users}
                        colorScheme="indigo"
                        subtitle="live parked"
                    />
                    <StatCard
                        title="Available Slots"
                        value={totalSlots}
                        icon={ParkingSquare}
                        colorScheme="slate"
                        subtitle="across hubs"
                    />
                    <StatCard
                        title="Occupancy"
                        value={`${occupancyRate.toFixed(1)}%`}
                        icon={TrendingUp}
                        colorScheme={occupancyRate >= 90 ? 'red' : 'emerald'}
                        subtitle="capacity used"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-10">
                        <RevenueChart data={revenueData} onPeriodChange={handlePeriodChange} />
                        <RecentBookingsTable bookings={recentBookings} />
                    </div>

                    <div className="lg:col-span-4 space-y-10">
                        <OccupancyChart data={occupancyData} />

                        {/* Streamlined Quick Actions */}
                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm sticky top-28">
                            <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Quick Actions</h3>
                            <div className="space-y-2">
                                {quickActions.map((action, idx) => {
                                    const Icon = action.icon;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={action.action}
                                            className="group w-full p-4 hover:bg-gray-50 rounded-lg transition-all text-left flex items-center gap-4 border border-transparent hover:border-gray-100"
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-100 ${action.color}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-900">{action.label}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">{action.desc}</p>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import RevenueChart from '../../../provider/dashboard/RevenueChart';
import { providerService } from '../../../../services/provider.service';

interface AnalyticsTabProps {
    facilityId: string;
}

export default function AnalyticsTab({ facilityId }: AnalyticsTabProps) {
    const [period, setPeriod] = useState<string>('7d');

    const { data: revenueData = [] } = useQuery({
        queryKey: ['provider', 'revenue', period, facilityId],
        queryFn: () => providerService.getRevenueData(period as any),
        enabled: !!facilityId
    });

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Facility Analytics</h2>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Revenue and occupancy trends for this facility
                </p>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-[40px] p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Revenue Trends</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daily revenue breakdown</p>
                    </div>
                </div>

                <RevenueChart
                    data={revenueData}
                    activePeriod={period}
                    onPeriodChange={setPeriod}
                />
            </div>

            {/* Coming Soon Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-[32px] p-8 border border-indigo-200">
                    <h4 className="text-lg font-black text-indigo-900 uppercase tracking-tight mb-2">Peak Hours Heatmap</h4>
                    <p className="text-sm font-bold text-indigo-600 mb-6">Visualize busiest times of the day</p>
                    <div className="h-32 bg-white/50 rounded-2xl flex items-center justify-center">
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Coming Soon</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-[32px] p-8 border border-emerald-200">
                    <h4 className="text-lg font-black text-emerald-900 uppercase tracking-tight mb-2">Vehicle Distribution</h4>
                    <p className="text-sm font-bold text-emerald-600 mb-6">Breakdown by vehicle type</p>
                    <div className="h-32 bg-white/50 rounded-2xl flex items-center justify-center">
                        <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Coming Soon</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

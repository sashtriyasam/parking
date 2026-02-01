import { useEffect, useState } from 'react';
import { Building2, Users } from 'lucide-react';
import type { OccupancyData } from '../../../services/provider.service';

interface OccupancyChartProps {
    data: OccupancyData[];
}

export default function OccupancyChart({ data }: OccupancyChartProps) {
    const [animatedData, setAnimatedData] = useState<OccupancyData[]>([]);

    useEffect(() => {
        // Animate bars on mount
        const timer = setTimeout(() => {
            setAnimatedData(data);
        }, 100);
        return () => clearTimeout(timer);
    }, [data]);

    const getOccupancyColor = (rate: number) => {
        if (rate >= 90) return 'bg-red-500';
        if (rate >= 70) return 'bg-amber-500';
        if (rate >= 40) return 'bg-emerald-500';
        return 'bg-indigo-500';
    };

    const getOccupancyBgColor = (rate: number) => {
        if (rate >= 90) return 'bg-red-50';
        if (rate >= 70) return 'bg-amber-50';
        if (rate >= 40) return 'bg-emerald-50';
        return 'bg-indigo-50';
    };

    return (
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <Building2 size={24} />
                        </div>
                        Real-time Occupancy
                    </h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Floor-wise breakdown</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                    <Users size={14} /> Live Status
                </div>
            </div>

            <div className="space-y-6">
                {animatedData.length > 0 ? animatedData.map((floor) => (
                    <div key={floor.floor_id} className="group">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-black text-gray-900 w-20">Floor {floor.floor_number}</span>
                                <span className="text-xs font-bold text-gray-400">{floor.occupied_slots} / {floor.total_slots} slots</span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black ${getOccupancyBgColor(floor.occupancy_rate)} ${floor.occupancy_rate >= 90 ? 'text-red-600' : floor.occupancy_rate >= 70 ? 'text-amber-600' : floor.occupancy_rate >= 40 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                {floor.occupancy_rate.toFixed(0)}%
                            </div>
                        </div>
                        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full ${getOccupancyColor(floor.occupancy_rate)} group-hover:shadow-lg`}
                                style={{ width: `${floor.occupancy_rate}%` }}
                            />
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12 text-gray-400">
                        <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-xs font-black uppercase tracking-widest">No occupancy data available</p>
                    </div>
                )}
            </div>

            {animatedData.length > 0 && (
                <div className="mt-10 pt-8 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex gap-6">
                        {[
                            { label: 'Low', color: 'bg-indigo-500', range: '< 40%' },
                            { label: 'Medium', color: 'bg-emerald-500', range: '40-70%' },
                            { label: 'High', color: 'bg-amber-500', range: '70-90%' },
                            { label: 'Critical', color: 'bg-red-500', range: '> 90%' },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                                <span className="text-[8px] font-bold text-gray-300">({item.range})</span>
                            </div>
                        ))}
                    </div>
                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                        View Details
                    </button>
                </div>
            )}
        </div>
    );
}

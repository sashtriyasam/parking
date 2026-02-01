import { MapPin, Edit, Trash2, TrendingUp, ParkingSquare, IndianRupee, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Facility } from '../../../services/provider.service';

interface FacilityCardProps {
    facility: Facility;
    onDelete: (id: string) => void;
}

export default function FacilityCard({ facility, onDelete }: FacilityCardProps) {
    const navigate = useNavigate();

    const totalSlots = facility._count?.parking_slots || facility.slots || 0;
    const occupancy = facility.occupancy || 0;
    const todayRevenue = facility.revenue || 0;

    const getOccupancyColor = (rate: number) => {
        if (rate >= 90) return 'text-red-600 bg-red-50';
        if (rate >= 70) return 'text-amber-600 bg-amber-50';
        if (rate >= 40) return 'text-emerald-600 bg-emerald-50';
        return 'text-indigo-600 bg-indigo-50';
    };

    return (
        <div className="group relative bg-white rounded-[40px] p-8 border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-all overflow-hidden">
            {/* Background Image */}
            {facility.image_url && (
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
                    <img src={facility.image_url} alt={facility.name} className="w-full h-full object-cover" />
                </div>
            )}

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1 pr-4">
                        <h3 className="text-xl font-black text-gray-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                            {facility.name}
                        </h3>
                        <div className="flex items-start gap-2 text-gray-400">
                            <MapPin size={14} className="mt-0.5 shrink-0" />
                            <p className="text-xs font-bold leading-relaxed">{facility.address}, {facility.city}</p>
                        </div>
                    </div>
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-sm">
                        <ParkingSquare size={32} />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-6 bg-gray-50 rounded-[28px]">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <ParkingSquare size={14} className="text-gray-400" />
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Slots</p>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{totalSlots}</p>
                    </div>
                    <div className="text-center border-x border-gray-200">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Users size={14} className="text-gray-400" />
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Occupancy</p>
                        </div>
                        <p className={`text-2xl font-black px-2 py-1 rounded-xl ${getOccupancyColor(occupancy)}`}>
                            {occupancy.toFixed(0)}%
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <IndianRupee size={14} className="text-gray-400" />
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Today</p>
                        </div>
                        <p className="text-2xl font-black text-gray-900">₹{todayRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    </div>
                </div>

                {/* Operating Hours */}
                <div className="mb-6 flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Operating Hours</p>
                        <p className="text-sm font-bold text-indigo-900">{facility.operating_hours || '24/7'}</p>
                    </div>
                    <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Floors</p>
                        <p className="text-sm font-bold text-slate-900">{facility.total_floors}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-auto flex gap-3">
                    <button
                        onClick={() => navigate(`/provider/facilities/${facility.id}`)}
                        className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 hover:scale-102 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                        <TrendingUp size={16} /> View Analytics
                    </button>
                    <button
                        onClick={() => navigate(`/provider/facilities/${facility.id}/edit`)}
                        className="p-4 bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all"
                    >
                        <Edit size={20} />
                    </button>
                    <button
                        onClick={() => {
                            if (confirm(`Delete facility "${facility.name}"? This cannot be undone.`)) {
                                onDelete(facility.id);
                            }
                        }}
                        className="p-4 bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

import { Building2, Layers, Users, IndianRupee, MapPin, Phone } from 'lucide-react';
import type { Facility } from '../../../../services/provider.service';

interface OverviewTabProps {
    facility: Facility;
}

export default function OverviewTab({ facility }: OverviewTabProps) {
    const totalSlots = facility._count?.parking_slots || facility.slots || 0;
    const occupancy = facility.occupancy || 0;
    const todayRevenue = facility.revenue || 0;

    const stats = [
        { label: 'Total Slots', value: totalSlots, icon: Building2, color: 'indigo' },
        { label: 'Total Floors', value: facility.total_floors, icon: Layers, color: 'emerald' },
        { label: 'Occupancy Rate', value: `${occupancy.toFixed(0)}%`, icon: Users, color: 'amber' },
        { label: "Today's Revenue", value: `₹${todayRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'red' },
    ];

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    const colorClasses = {
                        indigo: 'bg-indigo-50 text-indigo-600',
                        emerald: 'bg-emerald-50 text-emerald-600',
                        amber: 'bg-amber-50 text-amber-600',
                        red: 'bg-red-50 text-red-600',
                    };

                    return (
                        <div key={stat.label} className="bg-white rounded-[32px] p-8 border border-gray-100 hover:shadow-xl hover:shadow-gray-50 transition-all group">
                            <div className="flex items-start justify-between mb-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClasses[stat.color as keyof typeof colorClasses]} group-hover:scale-110 transition-transform`}>
                                    <Icon size={28} />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
                            <p className="text-4xl font-black text-gray-900">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="bg-white rounded-[40px] p-8 border border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <Phone size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Contact Information</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Facility contact details</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                            <MapPin size={20} className="text-gray-400 shrink-0 mt-1" />
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Address</p>
                                <p className="text-sm font-bold text-gray-900">{facility.address}, {facility.city}</p>
                            </div>
                        </div>
                        {facility.contact_number && (
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                                <Phone size={20} className="text-gray-400 shrink-0 mt-1" />
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                                    <p className="text-sm font-bold text-gray-900">{facility.contact_number}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-[40px] p-8 border border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">About Facility</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Details and description</p>
                        </div>
                    </div>

                    {facility.description ? (
                        <p className="text-sm font-medium text-gray-600 leading-relaxed">{facility.description}</p>
                    ) : (
                        <p className="text-sm font-medium text-gray-400 italic">No description provided.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

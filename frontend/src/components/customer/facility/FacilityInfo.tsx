import { MapPin, Clock, Phone, Shield, Camera, Wifi, Zap, Car, Navigation, Star } from 'lucide-react';

interface FacilityInfoProps {
    facility: {
        name: string;
        address: string;
        operating_hours?: string;
        contact_info?: string;
        amenities: string[];
        rating_avg?: number;
        rating_count?: number;
    };
}

const amenityMap: Record<string, { icon: any, label: string, color: string }> = {
    'Covered': { icon: Car, label: 'Covered', color: 'bg-blue-50 text-blue-600' },
    'Security': { icon: Shield, label: 'Guard', color: 'bg-indigo-50 text-indigo-600' },
    'CCTV': { icon: Camera, label: 'CCTV', color: 'bg-teal-50 text-teal-600' },
    'EV Charging': { icon: Zap, label: 'EV', color: 'bg-yellow-50 text-yellow-600' },
    'WiFi': { icon: Wifi, label: 'Wifi', color: 'bg-purple-50 text-purple-600' },
};

export default function FacilityInfo({ facility }: FacilityInfoProps) {
    const rating = facility.rating_avg || 4.5;


    return (
        <div className="bg-white rounded-[32px] p-10 shadow-sm border border-gray-100 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[100px] -z-0 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Premium Facility</div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-400 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                                <Star size={10} className="fill-white" /> {rating}
                            </div>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">{facility.name}</h1>
                        <div className="flex items-start gap-3 text-gray-500 max-w-lg font-medium">
                            <MapPin className="text-indigo-400 shrink-0 mt-1" size={20} />
                            <p className="leading-relaxed">{facility.address}</p>
                        </div>
                    </div>

                    <button className="flex items-center gap-2 px-6 py-4 bg-gray-50 hover:bg-white border-2 border-gray-100 rounded-2xl text-indigo-600 font-black transition-all shadow-sm hover:shadow-lg group">
                        <Navigation size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        Navigate
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="p-6 bg-gray-50/50 rounded-[24px] border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Operating Hours</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
                                <Clock size={20} />
                            </div>
                            <span className="font-bold text-gray-800">{facility.operating_hours || '24/7 Service'}</span>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50/50 rounded-[24px] border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Facility Support</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-green-600">
                                <Phone size={20} />
                            </div>
                            <span className="font-bold text-gray-800">{facility.contact_info || '+91 88000 0000'}</span>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50/50 rounded-[24px] border border-gray-100 sm:col-span-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Verified Amenities</p>
                        <div className="flex flex-wrap gap-2">
                            {facility.amenities.map((amenity) => {
                                const info = amenityMap[amenity];
                                const Icon = info?.icon || Shield;
                                return (
                                    <div key={amenity} className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-transparent font-bold text-xs ${info?.color || 'bg-gray-100 text-gray-600'}`}>
                                        <Icon size={14} />
                                        <span>{info?.label || amenity}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-4 md:p-6 bg-indigo-50/30 rounded-2xl border border-indigo-50">
                    <Shield className="text-indigo-600 shrink-0" size={24} />
                    <div>
                        <p className="text-sm font-bold text-indigo-900 underline decoration-indigo-200 decoration-2 underline-offset-4 cursor-pointer hover:text-indigo-700 transition-colors">
                            This facility belongs to our Trusted Network.
                        </p>
                        <p className="text-xs text-indigo-600/70 font-semibold">CCTV active, digital entry/exit enabled.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

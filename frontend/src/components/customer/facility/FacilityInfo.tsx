import { MapPin, Clock, Phone, Shield, Camera, Wifi, Zap, Car } from 'lucide-react';

interface FacilityInfoProps {
    facility: {
        name: string;
        address: string;
        operating_hours?: string;
        contact_info?: string;
        amenities: string[];
    };
}

const amenityMap: Record<string, { icon: any, label: string }> = {
    'Covered': { icon: Car, label: 'Covered Parking' },
    'Security': { icon: Shield, label: '24/7 Security' },
    'CCTV': { icon: Camera, label: 'CCTV Surveillance' },
    'EV Charging': { icon: Zap, label: 'EV Charging' },
    'WiFi': { icon: Wifi, label: 'Free WiFi' },
};

export default function FacilityInfo({ facility }: FacilityInfoProps) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{facility.name}</h1>
                <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="text-indigo-600 shrink-0 mt-1" size={18} />
                    <p>{facility.address}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Operating Hours</p>
                        <p className="text-sm">{facility.operating_hours || '24/7'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                        <Phone size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Contact</p>
                        <p className="text-sm">{facility.contact_info || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Amenities</p>
                <div className="flex flex-wrap gap-3">
                    {facility.amenities.map((amenity) => {
                        const info = amenityMap[amenity];
                        const Icon = info?.icon || Shield;
                        return (
                            <div key={amenity} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                <Icon size={16} className="text-indigo-600" />
                                <span className="text-sm font-medium text-gray-700">{info?.label || amenity}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

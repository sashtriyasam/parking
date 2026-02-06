import { MapPin, IndianRupee, Star, Zap, Clock, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ParkingFacility } from '../../types';

interface ParkingCardProps {
    facility: ParkingFacility;
}

export function ParkingCard({ facility }: ParkingCardProps) {
    const hasAvailability = (facility.total_available || 0) > 0;
    const rating = 4.5;
    const reviewCount = 120;

    return (
        <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full">
            {/* Image / Header */}
            <div className="relative aspect-[3/4] md:aspect-[2/3] bg-gray-100 overflow-hidden">
                <img
                    src={facility.image_url || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80'}
                    alt={facility.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Rating Badge (Clean BMS Style) */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg text-white text-[11px] font-bold flex items-center justify-between border border-white/10">
                    <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        {rating}/10
                    </div>
                    <span className="text-gray-300 font-medium">{reviewCount} reviews</span>
                </div>

                {/* Distance Badge */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-2.5 py-1 rounded-md text-[10px] font-bold text-gray-700 shadow-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary" />
                    {facility.distance_text || `${facility.distance?.toFixed(1) || '0.5'} km`}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                <div className="mb-2">
                    <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                        {facility.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium truncate">{facility.address}</p>
                </div>

                {/* Status & Category */}
                <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${hasAvailability ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                        {hasAvailability ? 'Available' : 'Full'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">• Verified Hub</span>
                </div>

                {/* Price & Action */}
                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Start Rate</span>
                        <div className="flex items-center text-gray-900 font-bold">
                            <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                            {facility.pricing?.hourly_rate || '40'}
                            <span className="text-[10px] text-gray-400 ml-1 font-medium">/hr</span>
                        </div>
                    </div>

                    <Link
                        to={`/customer/facility/${facility.id}`}
                        className={`px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${hasAvailability
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {hasAvailability ? 'Book' : 'Full'}
                    </Link>
                </div>
            </div>
        </div>
    );
}

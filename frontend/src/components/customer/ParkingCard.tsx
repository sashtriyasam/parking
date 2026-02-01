import { MapPin, IndianRupee, Star, Zap, Clock, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ParkingFacility } from '../../types';

interface ParkingCardProps {
    facility: ParkingFacility;
}

export function ParkingCard({ facility }: ParkingCardProps) {
    const hasAvailability = (facility.total_available || 0) > 0;

    // Mock rating for now if not present in data
    const rating = 4.5;
    const reviewCount = 120;

    const getAvailabilityColor = (count: number) => {
        if (count > 10) return 'text-green-600 bg-green-50';
        if (count > 0) return 'text-orange-600 bg-orange-50';
        return 'text-red-500 bg-red-50';
    };

    return (
        <div className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full">
            {/* Image / Header */}
            <div className="relative h-56 bg-gray-200 overflow-hidden">
                <img
                    src={facility.image_url || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80'}
                    alt={facility.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Distance Badge */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-primary" />
                    {facility.distance_text || `${facility.distance?.toFixed(1) || '0.5'} km`}
                </div>

                {/* Status Badge */}
                <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-xl text-xs font-black shadow-lg ${hasAvailability ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {hasAvailability ? 'Available' : 'Sold Out'}
                </div>

                {/* Rating Overlay */}
                <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 border border-white/20">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    {rating} ({reviewCount} reviews)
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-xl text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                        {facility.name}
                    </h3>
                </div>

                <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4 font-medium">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{facility.address}</span>
                </div>

                {/* Features Badges */}
                <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg text-[10px] font-black uppercase text-gray-500 border border-gray-100">
                        <ShieldCheck className="w-3 h-3" /> Security
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg text-[10px] font-black uppercase text-gray-500 border border-gray-100">
                        <Clock className="w-3 h-3" /> 24/7
                    </div>
                    {facility.total_floors > 1 && (
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg text-[10px] font-black uppercase text-gray-500 border border-gray-100">
                            Multi-Level
                        </div>
                    )}
                </div>

                {/* Availability Ticker */}
                <div className="space-y-3 mb-8">
                    {facility.available_slots ? (
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(facility.available_slots).map(([type, count]) => (
                                <div key={type} className={`px-3 py-2 rounded-xl border border-transparent flex justify-between items-center transition-colors ${getAvailabilityColor(count)}`}>
                                    <span className="text-[10px] font-black uppercase tracking-wider">{type}</span>
                                    <span className="text-sm font-black">{count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-3 bg-gray-50 rounded-2xl text-center text-xs font-bold text-gray-400 border border-dashed border-gray-200">
                            Checking live availability...
                        </div>
                    )}
                </div>

                {/* Bottom Row: Price & Actions */}
                <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Starts At</div>
                        <div className="flex items-center text-primary font-black text-2xl leading-none">
                            <IndianRupee className="w-4 h-4 mr-0.5" />
                            {facility.pricing?.hourly_rate || '40'}
                            <span className="text-xs text-gray-400 ml-1 font-bold">/hr</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            to={`/customer/facility/${facility.id}`}
                            className="bg-gray-100 text-gray-700 w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors shadow-sm"
                            title="View Details"
                        >
                            <Clock className="w-5 h-5" />
                        </Link>
                        <button
                            disabled={!hasAvailability}
                            className={`px-6 h-12 rounded-2xl font-black text-white flex items-center gap-2 transition-all shadow-lg ${hasAvailability
                                    ? 'bg-primary hover:bg-primary-dark shadow-primary/20 hover:scale-105 active:scale-95'
                                    : 'bg-gray-300 cursor-not-allowed shadow-none'
                                }`}
                        >
                            <Zap className="w-4 h-4 fill-white" />
                            Book
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

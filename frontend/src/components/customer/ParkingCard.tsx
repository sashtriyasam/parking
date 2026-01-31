import { MapPin, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ParkingFacility } from '../../types';

interface ParkingCardProps {
    facility: ParkingFacility;
}

export function ParkingCard({ facility }: ParkingCardProps) {
    const hasAvailability = facility.total_available && facility.total_available > 0;

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
            {/* Placeholder Icon (No Images used as requested) */}
            <div className="relative h-40 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-b border-gray-100">
                <MapPin className="w-12 h-12 text-primary/40" />
                {!hasAvailability && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
                        Full
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{facility.name}</h3>

                <div className="flex items-start gap-1 text-gray-600 text-sm mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{facility.address}</span>
                </div>

                {/* Distance & Availability */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 font-medium">
                            {facility.distance_text || `${facility.distance?.toFixed(1)} km`}
                        </span>
                        {facility.duration_text && (
                            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                                {facility.duration_text} drive
                            </span>
                        )}
                    </div>
                    {hasAvailability && (
                        <span className="text-green-600 font-semibold text-sm">
                            {facility.total_available} slots available
                        </span>
                    )}
                </div>

                {/* Vehicle Type Badges */}
                {facility.available_slots && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {Object.entries(facility.available_slots).map(([type, count]) => (
                            <span
                                key={type}
                                className={`text-xs px-2 py-1 rounded-full ${count > 0
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                    }`}
                            >
                                {type}: {count}
                            </span>
                        ))}
                    </div>
                )}

                {/* Pricing */}
                {facility.pricing && (
                    <div className="flex items-center gap-1 text-primary font-semibold mb-4">
                        <IndianRupee className="w-4 h-4" />
                        <span>{facility.pricing.hourly_rate}/hr</span>
                        <span className="text-gray-400 text-sm ml-2">
                            (₹{facility.pricing.daily_max}/day max)
                        </span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <Link
                        to={`/customer/facility/${facility.id}`}
                        className="flex-1 text-center px-4 py-2 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors"
                    >
                        View Details
                    </Link>
                    {hasAvailability && (
                        <button className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                            Quick Book
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

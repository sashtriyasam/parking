import { MapPin, Calendar, Clock, Car, CreditCard, Info } from 'lucide-react';
import type { ParkingFacility, ParkingSlot, PricingRule } from '../../../types';
import type { VehicleDetails } from '../../../store/bookingFlowStore';

interface BookingReviewCardProps {
    facility: ParkingFacility;
    slot: ParkingSlot;
    vehicleDetails: VehicleDetails;
    entryTime: string;
    duration: number;
    pricingRule: PricingRule;
}

export default function BookingReviewCard({
    facility,
    slot,
    vehicleDetails,
    entryTime,
    duration,
    pricingRule,
}: BookingReviewCardProps) {
    // Calculate fees
    const baseFee = pricingRule.hourly_rate * duration;
    const cappedFee = pricingRule.daily_max && baseFee > pricingRule.daily_max
        ? pricingRule.daily_max
        : baseFee;
    const gst = cappedFee * 0.18;
    const totalFee = cappedFee + gst;

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    return (
        <div className="space-y-6">
            {/* Facility Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {facility.image_url && (
                    <img
                        src={facility.image_url}
                        alt={facility.name}
                        className="w-full h-48 object-cover"
                    />
                )}
                <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{facility.name}</h3>
                    <div className="flex items-start gap-2 text-gray-600">
                        <MapPin size={16} className="mt-1 flex-shrink-0" />
                        <p className="text-sm">{facility.address}</p>
                    </div>
                </div>
            </div>

            {/* Booking Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h4 className="font-bold text-gray-900 mb-4">Booking Details</h4>

                {/* Slot Info */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Parking Slot</span>
                    <span className="font-semibold text-gray-900">
                        {slot.slot_number} - Floor {slot.floor?.floor_number}
                    </span>
                </div>

                {/* Vehicle Info */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                        <Car size={16} />
                        Vehicle
                    </span>
                    <div className="text-right">
                        <p className="font-semibold text-gray-900">{vehicleDetails.vehicle_number}</p>
                        <p className="text-xs text-gray-500 capitalize">{vehicleDetails.vehicle_type.toLowerCase()}</p>
                    </div>
                </div>

                {/* Entry Time */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                        <Calendar size={16} />
                        Entry Time
                    </span>
                    <span className="font-semibold text-gray-900">{formatDateTime(entryTime)}</span>
                </div>

                {/* Duration */}
                <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock size={16} />
                        Duration
                    </span>
                    <span className="font-semibold text-gray-900">{duration} {duration === 1 ? 'Hour' : 'Hours'}</span>
                </div>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6 space-y-3">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard size={20} />
                    Fee Breakdown
                </h4>

                <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Base Fee ({duration}h × ₹{pricingRule.hourly_rate})</span>
                    <span className="font-medium text-gray-900">₹{baseFee.toFixed(2)}</span>
                </div>

                {pricingRule.daily_max && baseFee > pricingRule.daily_max && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Daily Cap Applied</span>
                        <span className="font-medium">-₹{(baseFee - pricingRule.daily_max).toFixed(2)}</span>
                    </div>
                )}

                <div className="flex justify-between text-sm">
                    <span className="text-gray-700">GST (18%)</span>
                    <span className="font-medium text-gray-900">₹{gst.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t-2 border-indigo-300 flex justify-between">
                    <span className="font-bold text-gray-900">Total Amount</span>
                    <span className="font-black text-2xl text-indigo-600">₹{totalFee.toFixed(2)}</span>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Important Information</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Your slot will be reserved for 5 minutes after payment</li>
                        <li>Please arrive within the entry time window</li>
                        <li>Overstay charges will apply after the booked duration</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

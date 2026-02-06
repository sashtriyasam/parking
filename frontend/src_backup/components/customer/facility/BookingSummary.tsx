import { Calendar, Clock, CreditCard, IndianRupee, ShieldCheck, Zap, ArrowRight, Info } from 'lucide-react';
import type { ParkingSlot, PricingRule, VehicleType } from '../../../types';

interface BookingSummaryProps {
    facilityName: string;
    selectedSlot: ParkingSlot | null;
    currentVehicleType: VehicleType;
    pricingRule?: PricingRule;
    isLoading: boolean;
    onConfirm: () => void;
}

export default function BookingSummary({
    facilityName,
    selectedSlot,
    currentVehicleType,
    pricingRule,
    isLoading,
    onConfirm
}: BookingSummaryProps) {
    const hourlyRate = pricingRule?.hourly_rate || 50;
    const taxes = Math.round(hourlyRate * 0.18);
    const total = hourlyRate + taxes;

    return (
        <div className="sticky top-32 space-y-6">
            <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-100/50 border border-indigo-50">
                {/* Header Section */}
                <div className="bg-indigo-900 p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-2">My Reservation</p>
                        <h3 className="text-xl font-black truncate">{facilityName}</h3>
                    </div>
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-12 translate-x-16" />
                </div>

                {/* Reservation Details */}
                <div className="p-8 space-y-8">
                    {/* Selection Visuals */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
                                <Zap size={24} className="fill-indigo-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Vehicle Type</p>
                                <p className="text-sm font-black text-gray-900 uppercase">{currentVehicleType}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Slot No</p>
                            <p className="text-sm font-black text-indigo-600 uppercase">{selectedSlot?.slot_number || '--'}</p>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Entry Date</p>
                                <p className="text-sm font-bold text-gray-800">Today, 31 Jan 2026</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                                <Clock size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Start Time</p>
                                <p className="text-sm font-bold text-gray-800">11:30 PM (Immediate)</p>
                            </div>
                        </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="pt-8 border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Fee Breakdown</p>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm font-bold text-gray-500">
                                <span>Base Fee (1 Hour)</span>
                                <span className="flex items-center"><IndianRupee size={12} /> {hourlyRate}.00</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-gray-500">
                                <span>GST (18%)</span>
                                <span className="flex items-center"><IndianRupee size={12} /> {taxes}.00</span>
                            </div>
                            <div className="flex justify-between text-lg font-black text-gray-900 pt-3 border-t border-dashed border-gray-100">
                                <span>Total Payable</span>
                                <span className="flex items-center text-indigo-600 text-2xl">
                                    <IndianRupee size={20} className="stroke-[3]" /> {total}.00
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CTAs */}
                    <div className="space-y-4 pt-4">
                        <button
                            disabled={!selectedSlot || isLoading}
                            onClick={onConfirm}
                            className={`
                                w-full py-5 rounded-[22px] font-black text-sm uppercase tracking-[0.1em] flex items-center justify-center gap-3 transition-all
                                ${selectedSlot && !isLoading
                                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-102 active:scale-98'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                }
                            `}
                        >
                            {isLoading ? 'Processing...' : (
                                <>
                                    Confirm Booking <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <ShieldCheck size={14} className="text-green-500" />
                            Secure End-to-End Encryption
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex gap-4">
                <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center shrink-0">
                    <Info size={20} />
                </div>
                <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
                    <span className="text-gray-900 font-black">Pro Tip:</span> Arrive within 15 minutes of your booking time to ensure your spot remains locked.
                </p>
            </div>
        </div>
    );
}

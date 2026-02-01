import { MapPin, Calendar, Clock, IndianRupee, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { BookingDetails, VehicleDetails } from '../../../store/bookingFlowStore';

interface BookingReviewProps {
    booking: BookingDetails;
    vehicle: VehicleDetails;
    onProceed: () => void;
    onBack: () => void;
}

export function BookingReview({ booking, vehicle, onProceed, onBack }: BookingReviewProps) {
    const { facility, slot, base_fee, gst, total_fee, entry_time } = booking;

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header Section */}
            <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Review Your Booking</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Verify all details before payment</p>
            </div>

            {/* Main Summary Card */}
            <div className="bg-[#111827] rounded-[40px] p-8 md:p-12 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 translate-x-32" />

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left: Facility & Slot */}
                    <div className="space-y-8">
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Location & Spot</p>
                            <h4 className="text-2xl font-black mb-2">{facility.name}</h4>
                            <div className="flex items-start gap-2 text-gray-400 text-sm font-bold">
                                <MapPin size={16} className="shrink-0 mt-0.5" />
                                <span>{facility.address}, {facility.city}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex flex-col items-center justify-center border border-white/10">
                                <p className="text-[9px] font-black text-indigo-300 uppercase leading-none mb-1">Floor</p>
                                <p className="text-lg font-black">{slot.floor?.floor_number || '0'}</p>
                            </div>
                            <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex flex-col items-center justify-center border border-white/10">
                                <p className="text-[9px] font-black text-indigo-300 uppercase leading-none mb-1">Slot</p>
                                <p className="text-lg font-black">{slot.slot_number}</p>
                            </div>
                            <div className="h-10 w-px bg-white/10 mx-2" />
                            <div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Vehicle</p>
                                <p className="text-lg font-black tracking-widest">{vehicle.vehicle_number}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Time & Status */}
                    <div className="space-y-8">
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Arrival Schedule</p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                                        <Calendar size={18} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 leading-none mb-1">Entry Date</p>
                                        <p className="font-black">{new Date(entry_time).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                                        <Clock size={18} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 leading-none mb-1">Expected Entry</p>
                                        <p className="font-black text-teal-400">11:30 PM (Immediate Access)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <CheckCircle2 size={16} className="text-green-400" />
                                <span className="text-xs font-black text-green-400 uppercase tracking-widest">Pricing Guard Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-sm space-y-8">
                <div>
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Payment Breakdown</h4>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold text-gray-600">
                        <span>Base Parking Fee (1 Hour)</span>
                        <div className="flex items-center gap-1">
                            <IndianRupee size={16} />
                            <span>{base_fee}.00</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold text-gray-600">
                        <span>GST (18%)</span>
                        <div className="flex items-center gap-1">
                            <IndianRupee size={16} />
                            <span>{gst}.00</span>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-dashed border-gray-200 flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</span>
                            <span className="text-sm font-bold text-teal-500">Fast Confirmation</span>
                        </div>
                        <div className="flex items-center gap-1 text-4xl font-black text-indigo-600">
                            <IndianRupee size={28} className="stroke-[3]" />
                            <span>{total_fee}.00</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* T&C */}
            <label className="flex items-start gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100 cursor-pointer group">
                <input type="checkbox" className="mt-1.5 w-5 h-5 rounded-lg border-2 border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <p className="text-sm font-bold text-gray-500 leading-relaxed">
                    I agree to the <span className="text-indigo-600 cursor-pointer hover:underline">Terms of Service</span> and <span className="text-indigo-600 cursor-pointer hover:underline">Cancellation Policy</span>. I understand that the fee is based on a 1-hour minimum charge.
                </p>
            </label>

            {/* Actions */}
            <div className="pt-10 sticky bottom-0 bg-[#fafafa]/80 backdrop-blur-md -mx-8 px-8 pb-8 mt-20 flex gap-4">
                <button
                    onClick={onBack}
                    className="w-1/3 py-6 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                >
                    Back
                </button>
                <button
                    onClick={onProceed}
                    className="flex-1 py-6 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] bg-indigo-600 text-white shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-102 flex items-center justify-center gap-3 transition-all"
                >
                    Proceed to Payment <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}

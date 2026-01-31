import { useState } from 'react';
import { Calendar, Clock, ArrowRight, Info } from 'lucide-react';
import type { ParkingSlot, VehicleType, PricingRule } from '../../../types';

interface BookingSummaryProps {
    facilityName: string;
    selectedSlot: ParkingSlot | null;
    currentVehicleType: VehicleType;
    pricingRule: PricingRule | null;
    onConfirm: (data: any) => void;
    isLoading?: boolean;
}

export default function BookingSummary({
    facilityName,
    selectedSlot,
    currentVehicleType,
    pricingRule,
    onConfirm,
    isLoading
}: BookingSummaryProps) {
    const [duration, setDuration] = useState(1); // hours
    const [entryTime, setEntryTime] = useState(new Date().toISOString().slice(0, 16));

    const hourlyRate = pricingRule?.hourly_rate || 0;
    const baseFee = hourlyRate * duration;
    const taxes = baseFee * 0.18; // 18% GST
    const total = baseFee + taxes;

    if (!selectedSlot) {
        return (
            <div className="lg:sticky lg:top-8 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center space-y-4">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{facilityName}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">Choose a Spot</p>
                <p className="text-gray-500 text-xs leading-relaxed">
                    Select an available parking slot from the grid to see the exact fees and proceed with booking.
                </p>
                <div className="pt-4 border-t border-gray-50">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Vehicle Type</span>
                        <span className="font-medium text-gray-600 capitalize">{currentVehicleType.toLowerCase()}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="lg:sticky lg:top-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden anim-fade-in">
            <div className="bg-indigo-600 p-6 text-white text-center">
                <p className="text-indigo-100 text-sm font-medium mb-1">Total Fee</p>
                <h2 className="text-4xl font-black">₹{total.toLocaleString()}</h2>
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex flex-col gap-1">
                        <span className="text-xs text-gray-400 uppercase tracking-widest">Selected Facility</span>
                        {facilityName}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-500">Slot</span>
                            <span className="font-bold text-gray-900">{selectedSlot.slot_number} (Floor {selectedSlot.floor?.floor_number})</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-500">Vehicle</span>
                            <span className="font-bold text-gray-900 capitalize">{currentVehicleType.toLowerCase()}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Entry Time</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="datetime-local"
                                value={entryTime}
                                onChange={(e) => setEntryTime(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Duration (Hours)</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                            >
                                {[1, 2, 3, 4, 8, 12, 24].map((h) => (
                                    <option key={h} value={h}>{h} {h === 1 ? 'Hour' : 'Hours'}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                        <span>Base Price ({duration}h x ₹{hourlyRate})</span>
                        <span>₹{baseFee}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>GST (18%)</span>
                        <span>₹{taxes.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-50">
                        <span>Total Payble</span>
                        <span>₹{total.toFixed(1)}</span>
                    </div>
                </div>

                <button
                    onClick={() => onConfirm({ duration, entryTime, total, slotId: selectedSlot.id })}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 group"
                >
                    {isLoading ? 'Processing...' : 'Confirm & Pay'}
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}

import type { ParkingSlot, VehicleType } from '../../../types';
import SlotBox from './SlotBox';
import { Info, Sparkles, Navigation } from 'lucide-react';

interface SlotGridProps {
    slots: ParkingSlot[];
    selectedSlotId: string | null;
    onSlotSelect: (id: string) => void;
    currentVehicleType: VehicleType;
}

export default function SlotGrid({ slots, selectedSlotId, onSlotSelect, currentVehicleType }: SlotGridProps) {
    if (!slots || slots.length === 0) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center bg-gray-50/50 rounded-[40px] border-4 border-dashed border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Navigation className="text-gray-200" size={40} />
                </div>
                <h4 className="text-xl font-black text-gray-900 mb-2">Floor Under Maintenance</h4>
                <p className="text-gray-400 font-bold max-w-xs mx-auto text-sm leading-relaxed">
                    This floor is currently being mapped. Please check other floors for availability.
                </p>
            </div>
        );
    }

    const selectedSlot = slots.find(s => s.id === selectedSlotId);

    return (
        <div className="space-y-10 group">
            {/* Legend & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Choose Your Spot</h3>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={14} className="text-indigo-600" /> Premium Coverage active
                    </p>
                </div>

                <div className="flex flex-wrap gap-4">
                    {[
                        { color: 'bg-green-500', label: 'Ready to Book' },
                        { color: 'bg-red-500', label: 'Occupied' },
                        { color: 'bg-yellow-500', label: 'On Hold' },
                        { color: 'bg-indigo-600', label: 'My Selection' }
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl">
                            <div className={`w-2.5 h-2.5 ${item.color} rounded-full`} />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid Area */}
            <div className="bg-gray-100/50 p-8 md:p-12 rounded-[40px] border-4 border-white shadow-inner">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                    {slots.map((slot) => {
                        const isWrongType = slot.vehicle_type !== currentVehicleType;
                        return (
                            <SlotBox
                                key={slot.id}
                                id={slot.id}
                                number={slot.slot_number}
                                status={isWrongType ? 'MAINTENANCE' : slot.status}
                                type={slot.vehicle_type}
                                isSelected={selectedSlotId === slot.id}
                                onClick={onSlotSelect}
                                disabled={isWrongType}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Slot Details Panel (Floating or bottom based) */}
            {selectedSlot && (
                <div className="animate-in slide-in-from-bottom-5 duration-500">
                    <div className="bg-indigo-900 rounded-[32px] p-8 text-white shadow-2xl shadow-indigo-200 border-4 border-indigo-800 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 translate-x-32" />

                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl">
                                <Navigation size={32} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black mb-1">Slot {selectedSlot.slot_number} Selected</h4>
                                <div className="flex items-center gap-3 text-indigo-200/80 font-bold text-sm">
                                    <span className="px-2 py-0.5 bg-white/10 rounded-lg">{selectedSlot.vehicle_type}</span>
                                    <span>•</span>
                                    <span>Floor {selectedSlot.floor?.floor_number || 'Main'}</span>
                                    <span>•</span>
                                    <span className="text-teal-400">Available Now</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Instant Hold</p>
                                <p className="text-sm font-bold text-white/70 italic">Held for 5:00 minutes</p>
                            </div>
                            <div className="w-px h-12 bg-white/20 hidden md:block" />
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur px-4 py-2 rounded-2xl border border-white/10">
                                <Info size={16} className="text-indigo-300" />
                                <span className="text-xs font-bold text-white/90">Standard Safety Rules apply to this spot.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hint */}
            {!selectedSlot && (
                <div className="flex items-center center gap-3 p-6 bg-white rounded-3xl border border-gray-100 text-gray-400 font-bold text-sm shadow-sm">
                    <Info size={18} className="text-indigo-400" />
                    <span>Select a spot above to proceed with your booking.</span>
                </div>
            )}
        </div>
    );
}

import type { ParkingSlot, VehicleType } from '../../../types';
import SlotBox from './SlotBox';

interface SlotGridProps {
    slots: ParkingSlot[];
    selectedSlotId: string | null;
    onSlotSelect: (id: string) => void;
    currentVehicleType: VehicleType;
}

export default function SlotGrid({ slots, selectedSlotId, onSlotSelect, currentVehicleType }: SlotGridProps) {
    if (!slots || slots.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p>No slots found on this floor</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Select your spot</h3>
                <div className="flex gap-4 text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-1.5 font-bold">
                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
                        Available
                    </div>
                    <div className="flex items-center gap-1.5 font-bold">
                        <div className="w-3 h-3 bg-red-100 border border-red-300 rounded" />
                        Occupied
                    </div>
                    <div className="flex items-center gap-1.5 font-bold">
                        <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded" />
                        Reserved
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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

            <div className="p-4 bg-indigo-50 rounded-xl text-indigo-700 text-sm border border-indigo-100">
                💡 Only slots matching your <strong>{currentVehicleType.toLowerCase()}</strong> are selectable.
            </div>
        </div>
    );
}

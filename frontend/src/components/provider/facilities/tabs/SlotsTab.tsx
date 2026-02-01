import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Grid3x3, Trash2, Car, Bike, Truck } from 'lucide-react';
import { providerService } from '../../../../services/provider.service';
import BulkSlotCreator from '../BulkSlotCreator';

interface SlotsTabProps {
    facilityId: string;
}

export default function SlotsTab({ facilityId }: SlotsTabProps) {
    const queryClient = useQueryClient();
    const [showBulkCreator, setShowBulkCreator] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

    // Fetch slots
    const { data: slots = [], isLoading } = useQuery({
        queryKey: ['provider', 'facilities', facilityId, 'slots'],
        queryFn: () => providerService.getFacilitySlots(facilityId),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (slotId: string) => providerService.deleteSlot(slotId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider', 'facilities', facilityId, 'slots'] });
        },
    });

    // Group slots by floor
    const slotsByFloor = slots.reduce((acc: Record<number, any[]>, slot: any) => {
        const floor = slot.floor_number || 0;
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(slot);
        return acc;
    }, {});

    const floors = Object.keys(slotsByFloor).map(Number).sort((a, b) => a - b);
    const displayFloor = selectedFloor !== null ? selectedFloor : (floors[0] || 1);

    const getVehicleIcon = (type: string) => {
        if (type === 'CAR') return Car;
        if (type === 'BIKE' || type === 'SCOOTER') return Bike;
        if (type === 'TRUCK') return Truck;
        return Car;
    };

    const getStatusColor = (status: string) => {
        if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        if (status === 'OCCUPIED') return 'bg-red-50 text-red-600 border-red-200';
        if (status === 'RESERVED') return 'bg-amber-50 text-amber-600 border-amber-200';
        return 'bg-gray-50 text-gray-600 border-gray-200';
    };

    return (
        <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Slot Management</h2>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        {slots.length} total slots across {floors.length} floors
                    </p>
                </div>
                <button
                    onClick={() => setShowBulkCreator(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[28px] text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 transition-all"
                >
                    <Plus size={20} /> Add Slots
                </button>
            </div>

            {/* Floor Selector */}
            {floors.length > 0 && (
                <div className="flex items-center gap-3 bg-white rounded-[32px] p-2 border border-gray-100 overflow-x-auto">
                    {floors.map((floor) => (
                        <button
                            key={floor}
                            onClick={() => setSelectedFloor(floor)}
                            className={`px-6 py-3 rounded-[20px] text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${displayFloor === floor
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Floor {floor}
                        </button>
                    ))}
                </div>
            )}

            {/* Slots Grid */}
            {isLoading ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading slots...</p>
                </div>
            ) : slots.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[40px] border border-gray-100">
                    <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                        <Grid3x3 size={48} className="text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-3">No Slots Yet</h3>
                    <p className="text-sm font-bold text-gray-400 mb-8 max-w-md mx-auto">
                        Create parking slots to start accepting bookings for this facility.
                    </p>
                    <button
                        onClick={() => setShowBulkCreator(true)}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[28px] text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 transition-all"
                    >
                        <Plus size={20} /> Create Slots
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {(slotsByFloor[displayFloor] || []).map((slot: any) => {
                        const Icon = getVehicleIcon(slot.vehicle_type);
                        return (
                            <div
                                key={slot.id}
                                className={`group relative p-6 rounded-[28px] border-2 transition-all hover:shadow-xl ${getStatusColor(slot.status)}`}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <Icon size={32} className="mb-3" />
                                    <p className="text-lg font-black mb-1">{slot.slot_number}</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60">{slot.vehicle_type}</p>
                                    <p className={`mt-2 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${slot.status === 'AVAILABLE' ? 'bg-emerald-100' :
                                        slot.status === 'OCCUPIED' ? 'bg-red-100' : 'bg-amber-100'
                                        }`}>
                                        {slot.status}
                                    </p>
                                </div>

                                {/* Actions (show on hover) */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            if (confirm(`Delete slot ${slot.slot_number}?`)) {
                                                deleteMutation.mutate(slot.id);
                                            }
                                        }}
                                        className="p-2 bg-white rounded-xl shadow-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Bulk Creator Modal */}
            {showBulkCreator && (
                <BulkSlotCreator
                    facilityId={facilityId}
                    onClose={() => setShowBulkCreator(false)}
                    onSuccess={() => {
                        setShowBulkCreator(false);
                        queryClient.invalidateQueries({ queryKey: ['provider', 'facilities', facilityId, 'slots'] });
                    }}
                />
            )}
        </div>
    );
}

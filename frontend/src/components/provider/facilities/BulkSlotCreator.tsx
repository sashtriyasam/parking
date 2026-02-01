import { useState } from 'react';
import { X, Plus, Layers, Car, Bike, Truck, Hash } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { providerService } from '../../../services/provider.service';

interface BulkSlotCreatorProps {
    facilityId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BulkSlotCreator({ facilityId, onClose, onSuccess }: BulkSlotCreatorProps) {
    const [floorNumber, setFloorNumber] = useState(1);
    const [vehicleType, setVehicleType] = useState<'CAR' | 'BIKE' | 'SCOOTER' | 'TRUCK'>('CAR');
    const [startNumber, setStartNumber] = useState(1);
    const [count, setCount] = useState(10);

    const createMutation = useMutation({
        mutationFn: () => providerService.bulkCreateSlots(facilityId, {
            floor_number: floorNumber,
            vehicle_type: vehicleType,
            start_number: startNumber,
            count: count,
        }),
        onSuccess: () => {
            onSuccess();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate();
    };

    const vehicleTypes = [
        { value: 'CAR', label: 'Car', icon: Car, color: 'indigo' },
        { value: 'BIKE', label: 'Bike', icon: Bike, color: 'emerald' },
        { value: 'SCOOTER', label: 'Scooter', icon: Bike, color: 'amber' },
        { value: 'TRUCK', label: 'Truck', icon: Truck, color: 'red' },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-[40px] max-w-2xl w-full p-8 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Bulk Create Slots</h2>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            Generate multiple parking slots at once
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Floor Number */}
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                            <Layers size={14} /> Floor Number
                        </label>
                        <input
                            type="number"
                            value={floorNumber}
                            onChange={(e) => setFloorNumber(Number(e.target.value))}
                            min={1}
                            max={50}
                            className="w-full h-16 px-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all"
                        />
                    </div>

                    {/* Vehicle Type */}
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                            <Car size={14} /> Vehicle Type
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {vehicleTypes.map((type) => {
                                const Icon = type.icon;
                                const isSelected = vehicleType === type.value;
                                const colorClasses = {
                                    indigo: 'bg-indigo-50 border-indigo-600 text-indigo-900',
                                    emerald: 'bg-emerald-50 border-emerald-600 text-emerald-900',
                                    amber: 'bg-amber-50 border-amber-600 text-amber-900',
                                    red: 'bg-red-50 border-red-600 text-red-900',
                                };
                                return (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setVehicleType(type.value as any)}
                                        className={`p-4 rounded-[20px] border-2 transition-all ${isSelected
                                                ? colorClasses[type.color as keyof typeof colorClasses]
                                                : 'bg-gray-50 border-gray-50 text-gray-600 hover:border-gray-200'
                                            }`}
                                    >
                                        <Icon size={24} className="mx-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">{type.label}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Start Number */}
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                            <Hash size={14} /> Starting Slot Number
                        </label>
                        <input
                            type="number"
                            value={startNumber}
                            onChange={(e) => setStartNumber(Number(e.target.value))}
                            min={1}
                            className="w-full h-16 px-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all"
                        />
                        <p className="mt-2 text-xs font-bold text-gray-400">
                            Example: Starting from {startNumber} will create slots {startNumber}, {startNumber + 1}, {startNumber + 2}, ...
                        </p>
                    </div>

                    {/* Count */}
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                            <Plus size={14} /> Number of Slots
                        </label>
                        <input
                            type="number"
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                            min={1}
                            max={100}
                            className="w-full h-16 px-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all"
                        />
                        <p className="mt-2 text-xs font-bold text-gray-400">
                            Will create {count} slots from {startNumber} to {startNumber + count - 1}
                        </p>
                    </div>

                    {/* Preview */}
                    <div className="p-6 bg-indigo-50 rounded-[28px] border border-indigo-100">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Preview</p>
                        <p className="text-sm font-bold text-indigo-900">
                            Creating <span className="text-indigo-600 font-black">{count}</span> {vehicleType} slots on{' '}
                            <span className="text-indigo-600 font-black">Floor {floorNumber}</span>, numbered from{' '}
                            <span className="text-indigo-600 font-black">{startNumber}</span> to{' '}
                            <span className="text-indigo-600 font-black">{startNumber + count - 1}</span>
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="flex-[2] py-4 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-102 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create Slots'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

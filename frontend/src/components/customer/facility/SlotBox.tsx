import type { SlotStatus, VehicleType } from '../../../types';
import { Car, Bike, Truck, Ruler as Scooter, Ban } from 'lucide-react';

interface SlotBoxProps {
    id: string;
    number: string;
    status: SlotStatus;
    type: VehicleType;
    isSelected: boolean;
    onClick: (id: string) => void;
    disabled?: boolean;
}

const statusColors: Record<SlotStatus, string> = {
    'FREE': 'bg-green-100 hover:bg-green-200 border-green-300 text-green-700',
    'OCCUPIED': 'bg-red-100 border-red-200 text-red-700 cursor-not-allowed opacity-70',
    'RESERVED': 'bg-yellow-100 border-yellow-200 text-yellow-700 cursor-not-allowed opacity-80',
    'MAINTENANCE': 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed',
};

const typeIconMap: Record<VehicleType, any> = {
    'CAR': Car,
    'BIKE': Bike,
    'SCOOTER': Scooter,
    'TRUCK': Truck,
};

export default function SlotBox({ id, number, status, type, isSelected, onClick, disabled }: SlotBoxProps) {
    const Icon = status === 'MAINTENANCE' ? Ban : typeIconMap[type];
    const isAvailable = status === 'FREE';

    return (
        <button
            disabled={!isAvailable || disabled}
            onClick={() => isAvailable && onClick(id)}
            className={`
                relative h-20 w-full rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1
                ${statusColors[status]}
                ${isSelected ? 'ring-4 ring-indigo-500 ring-offset-2 border-indigo-600 scale-95 shadow-lg' : 'shadow-sm'}
                ${!isAvailable ? 'grayscale-[0.5]' : 'hover:scale-105'}
            `}
        >
            <Icon size={20} className={isSelected ? 'text-indigo-600' : ''} />
            <span className="text-xs font-bold uppercase tracking-wider">{number}</span>

            {isSelected && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
            )}
        </button>
    );
}

import type { SlotStatus, VehicleType } from '../../../types';
import { Car, Bike, Truck, Ruler as Scooter, Ban, Lock, Check, Zap } from 'lucide-react';

interface SlotBoxProps {
    id: string;
    number: string;
    status: SlotStatus;
    type: VehicleType;
    isSelected: boolean;
    onClick: (id: string) => void;
    disabled?: boolean;
}

const typeIconMap: Record<VehicleType, any> = {
    'CAR': Car,
    'BIKE': Bike,
    'SCOOTER': Scooter,
    'TRUCK': Truck,
};

export default function SlotBox({ id, number, status, type, isSelected, onClick, disabled }: SlotBoxProps) {
    const Icon = status === 'MAINTENANCE' ? Ban : typeIconMap[type];
    const isAvailable = status === 'FREE';
    const isReserved = status === 'RESERVED';
    const isOccupied = status === 'OCCUPIED';

    const getStatusStyles = () => {
        if (isSelected) return 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105 z-10';
        if (disabled) return 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-40';

        switch (status) {
            case 'FREE':
                return 'bg-white border-green-200 text-green-600 hover:border-green-500 hover:shadow-lg hover:shadow-green-50/50';
            case 'OCCUPIED':
                return 'bg-red-50 border-red-100 text-red-500 cursor-not-allowed';
            case 'RESERVED':
                return 'bg-yellow-50 border-yellow-100 text-yellow-600 cursor-not-allowed';
            case 'MAINTENANCE':
                return 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed';
            default:
                return 'bg-white border-gray-200 text-gray-400';
        }
    };

    return (
        <button
            disabled={!isAvailable || disabled}
            onClick={() => isAvailable && onClick(id)}
            className={`
                relative h-28 w-full rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 group
                ${getStatusStyles()}
            `}
        >
            {/* Status Indicator Dot */}
            <div className={`absolute top-3 left-3 w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' :
                    isOccupied ? 'bg-red-500' :
                        isReserved ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />

            {/* Type Icon */}
            <div className={`p-2 rounded-xl transition-colors ${isSelected ? 'bg-white/20' : isAvailable ? 'bg-green-50' : 'bg-gray-50/50'
                }`}>
                <Icon size={24} className={isSelected ? 'text-white' : ''} />
            </div>

            {/* Slot Number */}
            <span className={`text-[11px] font-black uppercase tracking-tighter ${isSelected ? 'text-white/90' : 'text-gray-400 group-hover:text-green-700'
                }`}>
                Slot {number}
            </span>

            {/* Action Icon Overlays */}
            {isSelected && (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-lg border-2 border-indigo-600 animate-in zoom-in-50 duration-300">
                    <Check size={18} strokeWidth={4} />
                </div>
            )}

            {isOccupied && (
                <div className="absolute inset-0 bg-red-50/20 backdrop-blur-[1px] flex items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <Lock size={16} className="text-red-400" />
                </div>
            )}

            {isReserved && (
                <div className="absolute inset-0 bg-yellow-50/20 backdrop-blur-[1px] flex items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                </div>
            )}
        </button>
    );
}

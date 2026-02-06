import { useState } from 'react';
import { Car, Bike, Truck, Check, X, Clock, Wrench } from 'lucide-react';
import type { ParkingSlot, VehicleType } from '@/types';
import { cn } from '@/app/components/ui/utils';
import { motion } from 'motion/react';

interface SlotGridProps {
  slots: ParkingSlot[];
  selectedSlot: string | null;
  onSlotSelect: (slotId: string) => void;
  readonly?: boolean;
}

const vehicleIcons: Record<VehicleType, React.ReactNode> = {
  bike: <Bike className="w-4 h-4" />,
  scooter: <Bike className="w-4 h-4" />,
  car: <Car className="w-4 h-4" />,
  truck: <Truck className="w-4 h-4" />,
};

export function SlotGrid({ slots, selectedSlot, onSlotSelect, readonly = false }: SlotGridProps) {
  const freeCount = slots.filter(s => s.status === 'free').length;
  const occupiedCount = slots.filter(s => s.status === 'occupied').length;
  const reservedCount = slots.filter(s => s.status === 'reserved').length;
  const maintenanceCount = slots.filter(s => s.status === 'maintenance').length;

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-emerald-500 rounded"></div>
          <span className="text-sm font-medium">Free ({freeCount})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm font-medium">Occupied ({occupiedCount})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-amber-500 rounded"></div>
          <span className="text-sm font-medium">Reserved ({reservedCount})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span className="text-sm font-medium">Maintenance ({maintenanceCount})</span>
        </div>
      </div>

      {/* Slot Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
        {slots.map((slot) => (
          <SlotBox
            key={slot.id}
            slot={slot}
            isSelected={selectedSlot === slot.id}
            onSelect={() => !readonly && slot.status === 'free' && onSlotSelect(slot.id)}
            readonly={readonly}
          />
        ))}
      </div>
    </div>
  );
}

interface SlotBoxProps {
  slot: ParkingSlot;
  isSelected: boolean;
  onSelect: () => void;
  readonly: boolean;
}

function SlotBox({ slot, isSelected, onSelect, readonly }: SlotBoxProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isFree = slot.status === 'free';
  const canSelect = isFree && !readonly;

  const statusStyles = {
    free: 'bg-white border-2 border-emerald-500 text-gray-900 hover:shadow-lg',
    occupied: 'bg-red-100 border-2 border-red-500 text-gray-500 opacity-70',
    reserved: 'bg-amber-100 border-2 border-amber-500 text-gray-700 opacity-80',
    maintenance: 'bg-gray-200 border-2 border-gray-400 text-gray-500 opacity-70',
  };

  const selectedStyle = 'bg-indigo-600 border-4 border-indigo-700 text-white shadow-lg';

  const statusIcons = {
    free: null,
    occupied: <X className="w-3 h-3 text-red-500" />,
    reserved: <Clock className="w-3 h-3 text-amber-600" />,
    maintenance: <Wrench className="w-3 h-3 text-gray-500" />,
  };

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={!canSelect}
      whileHover={canSelect ? { scale: 1.05 } : {}}
      whileTap={canSelect ? { scale: 0.95 } : {}}
      className={cn(
        'relative aspect-square rounded-lg flex flex-col items-center justify-center p-2 transition-all duration-200',
        isSelected ? selectedStyle : statusStyles[slot.status],
        canSelect ? 'cursor-pointer' : 'cursor-not-allowed'
      )}
    >
      {/* Slot Number */}
      <div className={cn(
        'text-xs sm:text-sm font-bold mb-1',
        isSelected ? 'text-white' : ''
      )}>
        {slot.slotNumber}
      </div>

      {/* Vehicle Type Icon */}
      <div className={cn(
        'absolute top-1 right-1',
        isSelected ? 'text-white' : slot.status === 'free' ? 'text-emerald-600' : ''
      )}>
        {vehicleIcons[slot.vehicleType]}
      </div>

      {/* Status Icon or Checkmark */}
      {isSelected ? (
        <div className="absolute bottom-1 left-1">
          <Check className="w-4 h-4 text-white" />
        </div>
      ) : (
        <div className="absolute bottom-1 left-1">
          {statusIcons[slot.status]}
        </div>
      )}

      {/* Price (only on hover for free slots) */}
      {canSelect && isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10"
        >
          ₹{slot.pricePerHour}/hr
        </motion.div>
      )}

      {/* Pulse animation for reserved slots */}
      {slot.status === 'reserved' && (
        <div className="absolute inset-0 rounded-lg border-2 border-amber-500 animate-pulse"></div>
      )}
    </motion.button>
  );
}

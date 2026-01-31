import { useState } from 'react';
import { Car, Bike, Truck, Ruler as Scooter, Save, ArrowRight } from 'lucide-react';
import type { VehicleType } from '../../../types';
import type { VehicleDetails } from '../../../store/bookingFlowStore';

interface VehicleDetailsFormProps {
    initialVehicleType?: VehicleType;
    onSubmit: (details: VehicleDetails) => void;
    isLoading?: boolean;
}

const vehicleTypes: { value: VehicleType; label: string; icon: any }[] = [
    { value: 'BIKE', label: 'Bike', icon: Bike },
    { value: 'SCOOTER', label: 'Scooter', icon: Scooter },
    { value: 'CAR', label: 'Car', icon: Car },
    { value: 'TRUCK', label: 'Truck', icon: Truck },
];

export default function VehicleDetailsForm({
    initialVehicleType,
    onSubmit,
    isLoading = false,
}: VehicleDetailsFormProps) {
    const [vehicleType, setVehicleType] = useState<VehicleType>(initialVehicleType || 'CAR');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [saveToProfile, setSaveToProfile] = useState(false);
    const [errors, setErrors] = useState<{ vehicleNumber?: string }>({});

    const validateVehicleNumber = (number: string): boolean => {
        // Indian vehicle number format: XX-00-XX-0000 or XX00XX0000
        const regex = /^[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,2}[-\s]?[0-9]{1,4}$/i;
        return regex.test(number.trim());
    };

    const formatVehicleNumber = (value: string): string => {
        // Remove all non-alphanumeric characters
        const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Format as XX-00-XX-0000
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
        if (cleaned.length <= 6) return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4)}`;
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 10)}`;
    };

    const handleVehicleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatVehicleNumber(e.target.value);
        setVehicleNumber(formatted);
        if (errors.vehicleNumber) {
            setErrors({});
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!validateVehicleNumber(vehicleNumber)) {
            setErrors({ vehicleNumber: 'Please enter a valid vehicle number (e.g., MH-01-AB-1234)' });
            return;
        }

        onSubmit({
            vehicle_type: vehicleType,
            vehicle_number: vehicleNumber,
            save_to_profile: saveToProfile,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Type Selection */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                    Select Vehicle Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {vehicleTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = vehicleType === type.value;
                        return (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setVehicleType(type.value)}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${isSelected
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                <Icon size={32} />
                                <span className="font-semibold text-sm">{type.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Vehicle Number Input */}
            <div>
                <label htmlFor="vehicleNumber" className="block text-sm font-bold text-gray-700 mb-2">
                    Vehicle Number <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="vehicleNumber"
                    value={vehicleNumber}
                    onChange={handleVehicleNumberChange}
                    placeholder="MH-01-AB-1234"
                    maxLength={15}
                    className={`w-full px-4 py-3 border rounded-xl text-lg font-mono uppercase focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.vehicleNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                />
                {errors.vehicleNumber && (
                    <p className="mt-2 text-sm text-red-600">{errors.vehicleNumber}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                    Enter your vehicle registration number
                </p>
            </div>

            {/* Save to Profile */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                    type="checkbox"
                    id="saveToProfile"
                    checked={saveToProfile}
                    onChange={(e) => setSaveToProfile(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="saveToProfile" className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <Save size={16} />
                    Save this vehicle to my profile for faster bookings
                </label>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading || !vehicleNumber}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
            >
                {isLoading ? (
                    'Processing...'
                ) : (
                    <>
                        Continue to Review
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
        </form>
    );
}

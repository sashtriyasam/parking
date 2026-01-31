import { useState } from 'react';
import { X, Calendar, CreditCard, TrendingDown } from 'lucide-react';
import type { ParkingFacility } from '../../../types';

interface PurchasePassModalProps {
    isOpen: boolean;
    onClose: () => void;
    facility?: ParkingFacility;
    onPurchase?: (duration: number, vehicleType: string) => void;
}

export default function PurchasePassModal({ isOpen, onClose, facility, onPurchase }: PurchasePassModalProps) {
    const [selectedDuration, setSelectedDuration] = useState(1); // months
    const [selectedVehicleType, setSelectedVehicleType] = useState('CAR');

    if (!isOpen) return null;

    const durations = [
        { months: 1, label: '1 Month', discount: 0 },
        { months: 3, label: '3 Months', discount: 10 },
        { months: 6, label: '6 Months', discount: 15 },
        { months: 12, label: '1 Year', discount: 20 },
    ];

    const vehicleTypes = ['BIKE', 'SCOOTER', 'CAR', 'TRUCK'];

    // Pricing calculation (simplified)
    const dailyRate = 100;
    const monthlyBase = dailyRate * 30;
    const totalMonths = selectedDuration;
    const basePrice = monthlyBase * totalMonths;
    const discount = durations.find((d) => d.months === selectedDuration)?.discount || 0;
    const discountAmount = (basePrice * discount) / 100;
    const finalPrice = basePrice - discountAmount;
    const savings = dailyRate * 30 * totalMonths - finalPrice;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                    >
                        <X size={24} />
                    </button>

                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            <Calendar size={28} />
                            Purchase Monthly Pass
                        </h2>
                        <p className="text-indigo-100 text-sm mt-1">
                            Save money with unlimited parking access
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Facility Info */}
                        {facility && (
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-600 mb-1">Selected Facility</p>
                                <p className="font-bold text-gray-900">{facility.name}</p>
                                <p className="text-sm text-gray-600">{facility.address}</p>
                            </div>
                        )}

                        {/* Vehicle Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Vehicle Type
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {vehicleTypes.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedVehicleType(type)}
                                        className={`py-3 px-4 rounded-xl font-semibold transition-all capitalize ${selectedVehicleType === type
                                                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {type.toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Pass Duration
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {durations.map((duration) => (
                                    <button
                                        key={duration.months}
                                        onClick={() => setSelectedDuration(duration.months)}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${selectedDuration === duration.months
                                                ? 'border-indigo-600 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <p className="font-bold text-gray-900">{duration.label}</p>
                                        {duration.discount > 0 && (
                                            <p className="text-sm text-green-600 font-semibold flex items-center gap-1">
                                                <TrendingDown size={14} />
                                                Save {duration.discount}%
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-4 space-y-2">
                            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <CreditCard size={18} />
                                Pricing Breakdown
                            </h4>

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-700">Base Price ({totalMonths} month{totalMonths > 1 ? 's' : ''})</span>
                                <span className="font-medium text-gray-900">₹{basePrice.toFixed(2)}</span>
                            </div>

                            {discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount ({discount}%)</span>
                                    <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="pt-2 border-t-2 border-indigo-300 flex justify-between">
                                <span className="font-bold text-gray-900">Total Amount</span>
                                <span className="font-black text-xl text-indigo-600">₹{finalPrice.toFixed(2)}</span>
                            </div>

                            <div className="bg-green-100 border border-green-300 rounded-lg p-3 mt-3">
                                <p className="text-sm text-green-800 font-semibold">
                                    💰 You save ₹{savings.toFixed(2)} compared to daily parking!
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-semibold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onPurchase?.(selectedDuration, selectedVehicleType);
                                    onClose();
                                }}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg"
                            >
                                Purchase Pass
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { X, CreditCard, ShieldCheck, Zap, IndianRupee, ArrowRight, Check, Car, Bike, Truck, Ruler as Scooter } from 'lucide-react';
import type { VehicleType } from '../../../types';

interface PurchasePassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPurchase: (duration: number, vehicleType: VehicleType) => void;
}

export default function PurchasePassModal({ isOpen, onClose, onPurchase }: PurchasePassModalProps) {
    const [duration, setDuration] = useState(1);
    const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');

    if (!isOpen) return null;

    const vehicleTypes: { type: VehicleType, icon: any, label: string }[] = [
        { type: 'CAR', icon: Car, label: 'Car' },
        { type: 'BIKE', icon: Bike, label: 'Bike' },
        { type: 'SCOOTER', icon: Scooter, label: 'Scooter' },
        { type: 'TRUCK', icon: Truck, label: 'Truck' },
    ];

    const durations = [
        { months: 1, discount: 0 },
        { months: 3, discount: 10 },
        { months: 6, discount: 15 },
        { months: 12, discount: 25 },
    ];

    const basePrice = vehicleType === 'CAR' ? 2000 : 800;
    const totalPrice = basePrice * duration;
    const discountAmount = durations.find(d => d.months === duration)?.discount || 0;
    const finalPrice = totalPrice * (1 - discountAmount / 100);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-[#fafafa] w-full max-w-2xl rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="p-8 flex items-center justify-between bg-white border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-none mb-1">Pass Membership</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select your plan</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-4 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-10 overflow-y-auto">
                    {/* Step 1: Vehicle */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">1. Choose Vehicle Type</h4>
                        <div className="grid grid-cols-4 gap-3">
                            {vehicleTypes.map((t) => (
                                <button
                                    key={t.type}
                                    onClick={() => setVehicleType(t.type)}
                                    className={`
                                        p-6 rounded-[28px] border-2 flex flex-col items-center gap-3 transition-all
                                        ${vehicleType === t.type ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200'}
                                    `}
                                >
                                    <t.icon size={24} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Duration */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">2. Select Period</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {durations.map((d) => (
                                <button
                                    key={d.months}
                                    onClick={() => setDuration(d.months)}
                                    className={`
                                        p-6 rounded-[28px] border-2 flex flex-col items-center gap-1 transition-all relative overflow-hidden
                                        ${duration === d.months ? 'bg-[#111827] border-[#111827] text-white shadow-xl' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200'}
                                    `}
                                >
                                    <span className="text-lg font-black">{d.months}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest leading-none">Months</span>
                                    {d.discount > 0 && (
                                        <div className="absolute top-0 right-0 px-2 py-1 bg-teal-500 text-[8px] font-black text-white rounded-bl-xl uppercase">-{d.discount}%</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm space-y-6">
                        <div className="flex justify-between items-center text-lg font-bold text-gray-600">
                            <span>Base Membership</span>
                            <div className="flex items-center gap-1">
                                <IndianRupee size={16} />
                                <span>{totalPrice}.00</span>
                            </div>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between items-center text-lg font-bold text-teal-600">
                                <span>Multi-month Discount</span>
                                <div className="flex items-center gap-1">
                                    <span>- </span>
                                    <IndianRupee size={16} />
                                    <span>{totalPrice - finalPrice}.00</span>
                                </div>
                            </div>
                        )}
                        <div className="pt-6 border-t border-dashed border-gray-200 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Payable</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="px-2 py-0.5 bg-green-100 text-green-600 text-[9px] font-black rounded-full uppercase tracking-widest">Instant Activation</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-4xl font-black text-indigo-600">
                                <IndianRupee size={28} className="stroke-[3]" />
                                <span>{finalPrice.toFixed(0)}.00</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="p-8 bg-white border-t border-gray-100">
                    <button
                        onClick={() => onPurchase(duration, vehicleType)}
                        className="w-full py-6 bg-indigo-600 text-white rounded-[28px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-102 transition-all flex items-center justify-center gap-3"
                    >
                        Initialize Checkout <ArrowRight size={20} />
                    </button>
                    <div className="mt-6 flex items-center justify-center gap-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={12} className="text-green-500" /> Secure
                        </div>
                        <div className="flex items-center gap-2">
                            <Check size={12} className="text-green-500" /> Instant
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

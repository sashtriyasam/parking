import { useState } from 'react';
import { Car, Bike, Truck, Ruler as Scooter, Plus, Check } from 'lucide-react';
import type { VehicleType, Vehicle } from '../../../types';

interface VehicleDetailsFormProps {
    onContinue: (details: { vehicle_type: VehicleType, vehicle_number: string, save_to_profile: boolean }) => void;
    savedVehicles?: Vehicle[];
    initialType?: VehicleType;
}

const vehicleTypes: { type: VehicleType, icon: any, label: string }[] = [
    { type: 'CAR', icon: Car, label: 'Four Wheeler' },
    { type: 'BIKE', icon: Bike, label: 'Motorcycle' },
    { type: 'SCOOTER', icon: Scooter, label: 'E-Scooter' },
    { type: 'TRUCK', icon: Truck, label: 'Heavy Vehicle' },
];

export function VehicleDetailsForm({ onContinue, savedVehicles = [], initialType }: VehicleDetailsFormProps) {
    const [selectedType, setSelectedType] = useState<VehicleType>(initialType || 'CAR');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [saveToProfile, setSaveToProfile] = useState(false);
    const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);

    const handleSavedSelect = (v: Vehicle) => {
        setSelectedSavedId(v.id);
        setSelectedType(v.vehicle_type);
        setVehicleNumber(v.vehicle_number);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!vehicleNumber.trim()) return;
        onContinue({
            vehicle_type: selectedType,
            vehicle_number: vehicleNumber.toUpperCase(),
            save_to_profile: saveToProfile
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-10">
            {/* Step 1: Select/Add Vehicle */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">My Saved Vehicles</h3>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select from your profile or add new</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {savedVehicles.map((v) => (
                        <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSavedSelect(v)}
                            className={`
                                p-6 rounded-[24px] border-2 text-left transition-all relative overflow-hidden group
                                ${selectedSavedId === v.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-gray-100 hover:border-indigo-200'}
                            `}
                        >
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`p-3 rounded-xl ${selectedSavedId === v.id ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                                    {v.vehicle_type === 'CAR' ? <Car size={24} /> : v.vehicle_type === 'BIKE' ? <Bike size={24} /> : <Scooter size={24} />}
                                </div>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${selectedSavedId === v.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                                        {v.nickname || v.vehicle_type}
                                    </p>
                                    <p className="text-lg font-black tracking-widest">{v.vehicle_number}</p>
                                </div>
                            </div>
                            {selectedSavedId === v.id && (
                                <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
                            )}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() => {
                            setSelectedSavedId(null);
                            setVehicleNumber('');
                        }}
                        className={`
                            p-6 rounded-[24px] border-2 border-dashed flex items-center justify-center gap-3 transition-all
                            ${!selectedSavedId ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'bg-gray-50/50 border-gray-200 text-gray-400 hover:bg-white hover:border-indigo-200'}
                        `}
                    >
                        <Plus size={24} />
                        <span className="font-black text-sm uppercase tracking-widest">New Vehicle</span>
                    </button>
                </div>
            </div>

            {/* Step 2: Custom Details (if not selecting saved) */}
            {!selectedSavedId && (
                <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="pt-10 border-t border-gray-100">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 px-1">Vehicle Specification</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {vehicleTypes.map((t) => (
                                <button
                                    key={t.type}
                                    type="button"
                                    onClick={() => setSelectedType(t.type)}
                                    className={`
                                        p-6 rounded-[24px] border-2 flex flex-col items-center gap-3 transition-all
                                        ${selectedType === t.type ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200'}
                                    `}
                                >
                                    <t.icon size={28} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Registration Details</h4>
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Enter Plate Number (e.g. MH12AB1234)"
                                value={vehicleNumber}
                                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                                className="w-full h-20 px-8 bg-white border-2 border-gray-100 rounded-[28px] text-2xl font-black tracking-[0.2em] placeholder:text-gray-200 placeholder:tracking-normal focus:border-indigo-600 transition-all shadow-sm outline-none"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${vehicleNumber.length >= 4 ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-gray-100 text-gray-200'}`}>
                                    <Check size={20} />
                                </div>
                            </div>
                        </div>

                        <label className="flex items-center gap-4 cursor-pointer group bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:border-indigo-200 transition-all">
                            <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${saveToProfile ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200'}`}>
                                {saveToProfile && <Check size={16} strokeWidth={4} />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={saveToProfile}
                                onChange={(e) => setSaveToProfile(e.target.checked)}
                            />
                            <div>
                                <p className="text-sm font-black text-gray-900 leading-none mb-1">Save to Profile</p>
                                <p className="text-xs font-bold text-gray-400">Securely store for faster bookings in the future.</p>
                            </div>
                        </label>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="pt-10 sticky bottom-0 bg-white/80 backdrop-blur-md -mx-8 px-8 pb-8 mt-20">
                <button
                    disabled={!vehicleNumber.trim() || vehicleNumber.length < 4}
                    type="submit"
                    className={`
                        w-full py-6 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all
                        ${vehicleNumber.length >= 4
                            ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 hover:scale-102'
                            : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'}
                    `}
                >
                    Review Reservation
                </button>
            </div>
        </form>
    );
}

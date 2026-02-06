import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Car, Bike, Truck, Ruler as Scooter, Zap, X, Check } from 'lucide-react';
import { customerService } from '../../../services/customer.service';
import type { VehicleType } from '../../../types';

export default function VehiclesList() {
    const [isAdding, setIsAdding] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        vehicle_type: 'CAR' as VehicleType,
        vehicle_number: '',
        is_default: false,
    });

    const queryClient = useQueryClient();

    const { data: vehicles, isLoading } = useQuery({
        queryKey: ['vehicles'],
        queryFn: () => customerService.getVehicles(),
    });

    const addVehicleMutation = useMutation({
        mutationFn: (data: any) => customerService.addVehicle(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            setIsAdding(false);
            setNewVehicle({ vehicle_type: 'CAR', vehicle_number: '', is_default: false });
        },
    });

    const deleteVehicleMutation = useMutation({
        mutationFn: (vehicleId: string) => customerService.deleteVehicle(vehicleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        },
    });

    const vehicleTypes: { type: VehicleType, icon: any, label: string }[] = [
        { type: 'CAR', icon: Car, label: 'Car' },
        { type: 'BIKE', icon: Bike, label: 'Bike' },
        { type: 'SCOOTER', icon: Scooter, label: 'Scooter' },
        { type: 'TRUCK', icon: Truck, label: 'Truck' },
    ];

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black text-gray-900">Saved Vehicles</h3>
                    <p className="text-sm font-bold text-gray-400">Quickly select your primary ride for bookings.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 transition-all"
                >
                    <Plus size={16} /> New Vehicle
                </button>
            </div>

            {/* Add Vehicle Form Card */}
            {isAdding && (
                <div className="bg-indigo-50 border-2 border-indigo-100 rounded-[40px] p-8 space-y-8 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Register New Vehicle</h4>
                        <button onClick={() => setIsAdding(false)} className="text-indigo-400 hover:text-indigo-600"><X size={20} /></button>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-3 block">Category</label>
                            <div className="grid grid-cols-4 gap-3">
                                {vehicleTypes.map((t) => (
                                    <button
                                        key={t.type}
                                        onClick={() => setNewVehicle({ ...newVehicle, vehicle_type: t.type })}
                                        className={`
                                            p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all
                                            ${newVehicle.vehicle_type === t.type ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-white text-gray-400 hover:border-indigo-200'}
                                        `}
                                    >
                                        <t.icon size={20} />
                                        <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Plate Number</label>
                            <input
                                type="text"
                                value={newVehicle.vehicle_number}
                                onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_number: e.target.value.toUpperCase() })}
                                placeholder="MH 01 AB 1234"
                                className="w-full h-16 px-6 bg-white border-2 border-white rounded-2xl text-lg font-black tracking-widest focus:border-indigo-600 outline-none transition-all placeholder:text-gray-200"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setNewVehicle({ ...newVehicle, is_default: !newVehicle.is_default })}
                                className={`w-12 h-6 rounded-full transition-all relative ${newVehicle.is_default ? 'bg-indigo-600' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newVehicle.is_default ? 'left-7' : 'left-1'}`} />
                            </button>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Set as Primary Vehicle</span>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="flex-1 py-4 bg-transparent text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600"
                            >
                                Discard
                            </button>
                            <button
                                onClick={() => addVehicleMutation.mutate(newVehicle)}
                                disabled={!newVehicle.vehicle_number || addVehicleMutation.isPending}
                                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:bg-gray-200 transition-all"
                            >
                                {addVehicleMutation.isPending ? 'Verifying...' : 'Save Vehicle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Vehicles List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-24 bg-gray-50 rounded-[32px] animate-pulse" />)}
                </div>
            ) : vehicles && vehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {vehicles.map((vehicle: any) => {
                        const VIcon = vehicleTypes.find(t => t.type === vehicle.vehicle_type)?.icon || Car;
                        return (
                            <div
                                key={vehicle.id}
                                className="group relative p-8 bg-white border border-gray-100 rounded-[40px] hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-all overflow-hidden"
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                            <VIcon size={32} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-lg font-black text-gray-900 tracking-widest uppercase">{vehicle.vehicle_number}</p>
                                                {vehicle.is_default && (
                                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white ring-4 ring-green-50">
                                                        <Check size={12} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{vehicle.vehicle_type}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (confirm('Remove this vehicle?')) {
                                                deleteVehicleMutation.mutate(vehicle.id);
                                            }
                                        }}
                                        className="p-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                                {/* Decorative zap */}
                                <div className="absolute -bottom-8 -right-8 text-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Zap size={120} strokeWidth={1} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-gray-200 mx-auto mb-6 shadow-sm">
                        <Car size={40} />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Garage is currently empty</p>
                </div>
            )}
        </div>
    );
}

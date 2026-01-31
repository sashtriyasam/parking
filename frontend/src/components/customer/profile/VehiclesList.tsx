import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { customerService } from '../../../services/customer.service';

export default function VehiclesList() {
    const [isAdding, setIsAdding] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        vehicle_type: 'CAR',
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
            alert('Vehicle added successfully!');
        },
    });

    const deleteVehicleMutation = useMutation({
        mutationFn: (vehicleId: string) => customerService.deleteVehicle(vehicleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            alert('Vehicle deleted successfully!');
        },
    });

    const vehicleTypes = ['BIKE', 'SCOOTER', 'CAR', 'TRUCK'];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Saved Vehicles</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Plus size={16} />
                    Add Vehicle
                </button>
            </div>

            {/* Add Vehicle Form */}
            {isAdding && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
                    <h3 className="font-bold text-gray-900 mb-3">Add New Vehicle</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Vehicle Type
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {vehicleTypes.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setNewVehicle({ ...newVehicle, vehicle_type: type })}
                                        className={`py-2 px-3 rounded-lg font-semibold text-sm transition-all capitalize ${newVehicle.vehicle_type === type
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {type.toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Vehicle Number
                            </label>
                            <input
                                type="text"
                                value={newVehicle.vehicle_number}
                                onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_number: e.target.value })}
                                placeholder="MH-01-AB-1234"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="default"
                                checked={newVehicle.is_default}
                                onChange={(e) => setNewVehicle({ ...newVehicle, is_default: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <label htmlFor="default" className="text-sm text-gray-700">
                                Set as default vehicle
                            </label>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => addVehicleMutation.mutate(newVehicle)}
                                disabled={!newVehicle.vehicle_number || addVehicleMutation.isPending}
                                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:bg-gray-400"
                            >
                                {addVehicleMutation.isPending ? 'Adding...' : 'Add Vehicle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Vehicles List */}
            {isLoading ? (
                <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
            ) : vehicles && vehicles.length > 0 ? (
                <div className="space-y-3">
                    {vehicles.map((vehicle: any) => (
                        <div
                            key={vehicle.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">
                                        {vehicle.vehicle_type === 'CAR' ? '🚗' : vehicle.vehicle_type === 'BIKE' ? '🏍️' : vehicle.vehicle_type === 'SCOOTER' ? '🛵' : '🚚'}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{vehicle.vehicle_number}</p>
                                    <p className="text-sm text-gray-600 capitalize">
                                        {vehicle.vehicle_type.toLowerCase()}
                                        {vehicle.is_default && (
                                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                                Default
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (confirm('Delete this vehicle?')) {
                                        deleteVehicleMutation.mutate(vehicle.id);
                                    }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <p>No vehicles saved yet</p>
                </div>
            )}
        </div>
    );
}

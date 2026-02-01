import { DollarSign, Car, Bike, Truck, Save } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerService } from '../../../../services/provider.service';

interface PricingTabProps {
    facilityId: string;
}

export default function PricingTab({ facilityId }: PricingTabProps) {
    const queryClient = useQueryClient();

    // Fetch current pricing
    const { data: pricing, isLoading } = useQuery({
        queryKey: ['provider', 'facilities', facilityId, 'pricing'],
        queryFn: () => providerService.getFacilityPricing(facilityId),
    });

    const [rates, setRates] = useState({
        car_hourly: pricing?.car_hourly || 50,
        bike_hourly: pricing?.bike_hourly || 20,
        scooter_hourly: pricing?.scooter_hourly || 20,
        truck_hourly: pricing?.truck_hourly || 100,
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => providerService.updateFacilityPricing(facilityId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider', 'facilities', facilityId, 'pricing'] });
        },
    });

    const handleSave = () => {
        updateMutation.mutate(rates);
    };

    const vehicles = [
        { type: 'car', label: 'Car', icon: Car, color: 'indigo', key: 'car_hourly' },
        { type: 'bike', label: 'Bike', icon: Bike, color: 'emerald', key: 'bike_hourly' },
        { type: 'scooter', label: 'Scooter', icon: Bike, color: 'amber', key: 'scooter_hourly' },
        { type: 'truck', label: 'Truck', icon: Truck, color: 'red', key: 'truck_hourly' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Pricing Configuration</h2>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Set hourly rates for different vehicle types
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[28px] text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 transition-all disabled:bg-gray-300"
                >
                    <Save size={20} /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vehicles.map((vehicle) => {
                    const Icon = vehicle.icon;
                    const colorClasses = {
                        indigo: 'bg-indigo-50 text-indigo-600',
                        emerald: 'bg-emerald-50 text-emerald-600',
                        amber: 'bg-amber-50 text-amber-600',
                        red: 'bg-red-50 text-red-600',
                    };

                    return (
                        <div key={vehicle.type} className="bg-white rounded-[32px] p-8 border border-gray-100">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClasses[vehicle.color as keyof typeof colorClasses]}`}>
                                    <Icon size={28} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{vehicle.label}</h3>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hourly rate</p>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">₹</div>
                                <input
                                    type="number"
                                    value={rates[vehicle.key as keyof typeof rates]}
                                    onChange={(e) => setRates({ ...rates, [vehicle.key]: Number(e.target.value) })}
                                    min={0}
                                    className="w-full h-16 pl-12 pr-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-lg font-black focus:bg-white focus:border-indigo-600 outline-none transition-all"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Note */}
            <div className="p-6 bg-amber-50 rounded-[28px] border border-amber-100">
                <p className="text-xs font-bold text-amber-900">
                    <span className="font-black">Note:</span> These rates will be applied to all new bookings. Existing bookings will maintain their original pricing.
                </p>
            </div>
        </div>
    );
}

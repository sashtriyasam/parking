import type { PricingRule, VehicleType } from '../../../types';
import { Car, Bike, Truck, Ruler as Scooter } from 'lucide-react';

interface PricingTableProps {
    rules: PricingRule[];
}

const vehicleIconMap: Record<VehicleType, any> = {
    'CAR': Car,
    'BIKE': Bike,
    'SCOOTER': Scooter,
    'TRUCK': Truck,
};

export default function PricingTable({ rules }: PricingTableProps) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Pricing Plans</h3>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left border-b border-gray-100">
                            <th className="pb-4 font-medium text-gray-500 text-sm">Vehicle Type</th>
                            <th className="pb-4 font-medium text-gray-500 text-sm">Hourly</th>
                            <th className="pb-4 font-medium text-gray-500 text-sm">Daily Max</th>
                            <th className="pb-4 font-medium text-gray-500 text-sm">Monthly Pass</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {rules.map((rule) => {
                            const Icon = vehicleIconMap[rule.vehicle_type];
                            return (
                                <tr key={rule.vehicle_type} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                <Icon size={18} />
                                            </div>
                                            <span className="font-medium text-gray-900 capitalize">
                                                {rule.vehicle_type.toLowerCase()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 font-semibold text-gray-900">₹{rule.hourly_rate}</td>
                                    <td className="py-4 text-gray-600">
                                        {rule.daily_max ? `₹${rule.daily_max}` : 'N/A'}
                                    </td>
                                    <td className="py-4">
                                        {rule.monthly_pass_price ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                ₹{rule.monthly_pass_price}/mo
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

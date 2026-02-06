import { useState } from 'react';
import { Save } from 'lucide-react';

export function PricingManager({ }: { facilityId: string }) {
    // Mock Pricing Rules
    const [rules] = useState([
        { id: '1', vehicle_type: 'BIKE', hourly: 20, daily: 100, monthly: 500 },
        { id: '2', vehicle_type: 'SCOOTER', hourly: 20, daily: 100, monthly: 500 },
        { id: '3', vehicle_type: 'CAR', hourly: 50, daily: 300, monthly: 2000 },
        { id: '4', vehicle_type: 'TRUCK', hourly: 100, daily: 800, monthly: 5000 },
    ]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Pricing Rules</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm">
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 text-left">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vehicle Type</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hourly Rate (₹)</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Daily Max (₹)</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Monthly Pass (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rules.map((rule) => (
                            <tr key={rule.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4 font-semibold text-gray-900">
                                    {rule.vehicle_type}
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="number"
                                        readOnly
                                        value={rule.hourly}
                                        className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="number"
                                        readOnly
                                        value={rule.daily}
                                        className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="number"
                                        readOnly
                                        value={rule.monthly}
                                        className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

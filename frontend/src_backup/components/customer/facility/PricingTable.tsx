import type { PricingRule, VehicleType } from '../../../types';
import { Car, Bike, Truck, Ruler as Scooter, CheckCircle, IndianRupee } from 'lucide-react';

interface PricingTableProps {
    rules: PricingRule[];
}

const vehicleInfoMap: Record<VehicleType, { icon: any, label: string, color: string }> = {
    'CAR': { icon: Car, label: 'Standard Four Wheeler', color: 'indigo' },
    'BIKE': { icon: Bike, label: 'Two Wheeler / Bike', color: 'teal' },
    'SCOOTER': { icon: Scooter, label: 'Electric Scooter', color: 'emerald' },
    'TRUCK': { icon: Truck, label: 'Heavy Vehicle / SUV', color: 'orange' },
};

export default function PricingTable({ rules }: PricingTableProps) {
    return (
        <div className="py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Flexible Pricing Plans</h3>
                    <p className="text-gray-500 font-medium">Choose the best plan for your vehicle type</p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-black uppercase tracking-widest border border-green-100">
                    <CheckCircle size={14} /> Tax Inclusive
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rules.map((rule) => {
                    const info = vehicleInfoMap[rule.vehicle_type];
                    const Icon = info.icon;
                    return (
                        <div key={rule.vehicle_type} className="group relative bg-white rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col items-center text-center">
                            <div className={`w-16 h-16 bg-${info.color}-50 text-${info.color}-600 rounded-[22px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                <Icon size={32} />
                            </div>

                            <h4 className="text-xl font-black text-gray-900 mb-2">{info.label}</h4>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{rule.vehicle_type}</p>

                            <div className="w-full space-y-4 mb-8">
                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <span className="text-xs font-black text-gray-400 uppercase">Hourly Rate</span>
                                    <div className="flex items-center font-black text-gray-900 text-lg">
                                        <IndianRupee size={14} /> {rule.hourly_rate}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100">
                                    <span className="text-xs font-black text-gray-400 uppercase">Daily Max</span>
                                    <div className="flex items-center font-black text-gray-900 text-lg">
                                        <IndianRupee size={14} /> {rule.daily_max || '--'}
                                    </div>
                                </div>
                                {rule.monthly_pass_price && (
                                    <div className="flex justify-between items-center p-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl">
                                        <div>
                                            <span className="text-[10px] font-black text-indigo-400 uppercase block leading-none">Monthly Pass</span>
                                            <span className="text-[10px] font-bold text-indigo-300">Save 40%</span>
                                        </div>
                                        <div className="flex items-center font-black text-indigo-600 text-lg">
                                            <IndianRupee size={14} /> {rule.monthly_pass_price}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-200">
                                Get Started
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

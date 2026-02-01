import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import type { RevenueData } from '../../../services/provider.service';

interface RevenueChartProps {
    data: RevenueData[];
    activePeriod?: string;
    onPeriodChange?: (period: string) => void;
}

export default function RevenueChart({ data, activePeriod, onPeriodChange }: RevenueChartProps) {
    const [internalPeriod, setInternalPeriod] = useState('7d');
    const period = activePeriod || internalPeriod;

    const periods = [
        { value: 'today', label: 'Today' },
        { value: '7d', label: '7 Days' },
        { value: '30d', label: '30 Days' },
        { value: 'custom', label: 'Custom' },
    ];

    const handlePeriodChange = (newPeriod: string) => {
        setInternalPeriod(newPeriod);
        onPeriodChange?.(newPeriod);
    };

    // Calculate total revenue
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

    return (
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <TrendingUp size={24} />
                        </div>
                        Revenue Overview
                    </h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Total: ₹{totalRevenue.toLocaleString('en-IN')}</p>
                </div>

                <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-2xl">
                    {periods.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => handlePeriodChange(p.value)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p.value
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {data.length > 0 ? (
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="carGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="bikeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="scooterGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="truckGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }}
                                tickFormatter={(value) => `₹${value / 1000}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    border: 'none',
                                    borderRadius: '16px',
                                    padding: '12px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                }}
                                labelStyle={{ color: '#f3f4f6', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                itemStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
                                formatter={(value: any) => [`₹${value}`, '']}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                iconType="circle"
                                formatter={(value) => <span className="text-xs font-black text-gray-600 uppercase tracking-widest">{value}</span>}
                            />
                            <Bar dataKey="car" fill="url(#carGradient)" radius={[8, 8, 0, 0]} name="Car" />
                            <Bar dataKey="bike" fill="url(#bikeGradient)" radius={[8, 8, 0, 0]} name="Bike" />
                            <Bar dataKey="scooter" fill="url(#scooterGradient)" radius={[8, 8, 0, 0]} name="Scooter" />
                            <Bar dataKey="truck" fill="url(#truckGradient)" radius={[8, 8, 0, 0]} name="Truck" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <Calendar size={64} className="mx-auto mb-4 opacity-20" />
                        <p className="text-xs font-black uppercase tracking-widest">No revenue data for this period</p>
                    </div>
                </div>
            )}
        </div>
    );
}

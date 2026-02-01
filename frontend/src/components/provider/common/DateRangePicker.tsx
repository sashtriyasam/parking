import { Calendar, X } from 'lucide-react';
import { useState } from 'react';

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onDateChange: (start: string, end: string) => void;
    onClear?: () => void;
}

export default function DateRangePicker({ startDate, endDate, onDateChange, onClear }: DateRangePickerProps) {
    const [localStart, setLocalStart] = useState(startDate);
    const [localEnd, setLocalEnd] = useState(endDate);

    const handleApply = () => {
        onDateChange(localStart, localEnd);
    };

    const handleClear = () => {
        setLocalStart('');
        setLocalEnd('');
        onClear?.();
    };

    const presets = [
        {
            label: 'Today', getValue: () => {
                const today = new Date().toISOString().split('T')[0];
                return { start: today, end: today };
            }
        },
        {
            label: 'Last 7 Days', getValue: () => {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 7);
                return {
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0]
                };
            }
        },
        {
            label: 'Last 30 Days', getValue: () => {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 30);
                return {
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0]
                };
            }
        },
        {
            label: 'This Month', getValue: () => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return {
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0]
                };
            }
        },
    ];

    return (
        <div className="bg-white rounded-[32px] p-6 border border-gray-100 space-y-6">
            {/* Title */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Date Range</h3>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Filter by date</p>
                    </div>
                </div>
                {(startDate || endDate) && (
                    <button
                        onClick={handleClear}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={localStart}
                        onChange={(e) => setLocalStart(e.target.value)}
                        className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-50 rounded-xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        End Date
                    </label>
                    <input
                        type="date"
                        value={localEnd}
                        onChange={(e) => setLocalEnd(e.target.value)}
                        className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-50 rounded-xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Presets */}
            <div className="space-y-2">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Quick Select</p>
                <div className="grid grid-cols-2 gap-2">
                    {presets.map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => {
                                const { start, end } = preset.getValue();
                                setLocalStart(start);
                                setLocalEnd(end);
                            }}
                            className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Apply Button */}
            <button
                onClick={handleApply}
                disabled={!localStart || !localEnd}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
                Apply Filter
            </button>
        </div>
    );
}

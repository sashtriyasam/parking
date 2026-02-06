import { useState } from 'react';
import { Filter, X, Calendar, RotateCcw } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useTicketsStore } from '../../../store/ticketsStore';

export default function TicketFilters() {
    const { filters, setFilters, resetFilters } = useTicketsStore();
    const [isOpen, setIsOpen] = useState(false);

    const handleDateChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        setFilters({
            dateRange: {
                start: start ? start.toISOString() : null,
                end: end ? end.toISOString() : null
            }
        });
    };

    const hasActiveFilters = filters.dateRange.start || filters.facilityId || filters.vehicleType;

    return (
        <div className="relative z-30">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-2xl transition-all flex items-center gap-2 ${isOpen || hasActiveFilters ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
            >
                <Filter size={24} />
                {hasActiveFilters && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-30 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Filters</h3>
                            <button
                                onClick={resetFilters}
                                className="text-[10px] font-bold text-gray-400 hover:text-indigo-600 uppercase tracking-widest flex items-center gap-1"
                            >
                                <RotateCcw size={12} /> Reset
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Date Range */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date Range</label>
                                <div className="relative">
                                    <DatePicker
                                        selectsRange={true}
                                        startDate={filters.dateRange.start ? new Date(filters.dateRange.start) : null}
                                        endDate={filters.dateRange.end ? new Date(filters.dateRange.end) : null}
                                        onChange={handleDateChange}
                                        placeholderText="Select dates"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-indigo-600"
                                    />
                                    <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Vehicle Type */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['CAR', 'BIKE', 'SCOOTER', 'TRUCK'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setFilters({ vehicleType: filters.vehicleType === type ? null : type })}
                                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${filters.vehicleType === type
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                                    : 'border-transparent bg-gray-50 text-gray-400 hover:border-gray-200'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

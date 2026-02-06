import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Filter, Calendar, User, Car, IndianRupee, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import DataTable from '../../components/provider/common/DataTable';
import ExportButton from '../../components/provider/common/ExportButton';
import DateRangePicker from '../../components/provider/common/DateRangePicker';
import { providerService } from '../../services/provider.service';

export default function AllBookingsPage() {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [facilityFilter, setFacilityFilter] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Fetch all bookings
    const { data: bookings = [], isLoading } = useQuery({
        queryKey: ['provider', 'bookings', 'all', statusFilter, facilityFilter, startDate, endDate],
        queryFn: () => providerService.getBookings({
            status: statusFilter !== 'all' ? statusFilter : undefined,
            facility_id: facilityFilter !== 'all' ? facilityFilter : undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
        }),
    });

    // Fetch facilities for filter
    const { data: facilities = [] } = useQuery({
        queryKey: ['provider', 'facilities'],
        queryFn: () => providerService.getMyFacilities(),
    });

    const statusOptions = [
        { value: 'all', label: 'All Statuses', color: 'gray' },
        { value: 'active', label: 'Active', color: 'emerald' },
        { value: 'completed', label: 'Completed', color: 'indigo' },
        { value: 'cancelled', label: 'Cancelled', color: 'red' },
    ];

    const getStatusBadge = (status: string) => {
        const colors = {
            active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            completed: 'bg-indigo-50 text-indigo-600 border-indigo-200',
            cancelled: 'bg-red-50 text-red-600 border-red-200',
        };
        return colors[status.toLowerCase() as keyof typeof colors] || 'bg-gray-50 text-gray-600 border-gray-200';
    };

    // Define table columns
    const columns = [
        {
            key: 'ticket_id',
            label: 'Ticket ID',
            sortable: true,
            render: (value: string) => (
                <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-400" />
                    <span>{value}</span>
                </div>
            ),
        },
        {
            key: 'customer_name',
            label: 'Customer',
            sortable: true,
            render: (value: string) => (
                <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span>{value}</span>
                </div>
            ),
        },
        {
            key: 'vehicle_number',
            label: 'Vehicle',
            render: (value: string, row: any) => (
                <div className="flex items-center gap-2">
                    <Car size={16} className="text-gray-400" />
                    <div>
                        <p>{value}</p>
                        <p className="text-[10px] text-gray-400 uppercase">{row.vehicle_type}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'slot_number',
            label: 'Slot',
            render: (value: string) => (
                <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{value}</span>
                </div>
            ),
        },
        {
            key: 'entry_time',
            label: 'Entry Time',
            sortable: true,
            render: (value: string) => (
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{format(new Date(value), 'MMM dd, hh:mm a')}</span>
                </div>
            ),
        },
        {
            key: 'amount',
            label: 'Amount',
            sortable: true,
            render: (value: number) => (
                <div className="flex items-center gap-2">
                    <IndianRupee size={16} className="text-gray-400" />
                    <span>₹{value?.toLocaleString('en-IN') || '0'}</span>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (value: string) => (
                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${getStatusBadge(value)}`}>
                    {value}
                </span>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-transparent">

            {/* Header */}
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">
                                All Bookings
                            </h1>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                Manage all parking bookings • {bookings.length} total
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-3 px-8 py-4 rounded-[28px] text-sm font-black uppercase tracking-widest transition-all ${showFilters
                                    ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-100'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Filter size={20} /> Filters
                            </button>
                            <ExportButton
                                data={bookings}
                                filename={`bookings-${new Date().toISOString().split('T')[0]}`}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    {showFilters && (
                        <aside className="lg:col-span-1 space-y-6">
                            {/* Status Filter */}
                            <div className="bg-white rounded-[32px] p-6 border border-gray-100 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Status</h3>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Filter by status</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {statusOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setStatusFilter(option.value)}
                                            className={`w-full px-4 py-3 rounded-xl text-left text-sm font-bold transition-all ${statusFilter === option.value
                                                ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-600'
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Facility Filter */}
                            <div className="bg-white rounded-[32px] p-6 border border-gray-100 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Facility</h3>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Filter by location</p>
                                    </div>
                                </div>
                                <select
                                    value={facilityFilter}
                                    onChange={(e) => setFacilityFilter(e.target.value)}
                                    className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-50 rounded-xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all"
                                >
                                    <option value="all">All Facilities</option>
                                    {facilities.map((facility: any) => (
                                        <option key={facility.id} value={facility.id}>
                                            {facility.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Range */}
                            <DateRangePicker
                                startDate={startDate}
                                endDate={endDate}
                                onDateChange={(start, end) => {
                                    setStartDate(start);
                                    setEndDate(end);
                                }}
                                onClear={() => {
                                    setStartDate('');
                                    setEndDate('');
                                }}
                            />
                        </aside>
                    )}

                    {/* Data Table */}
                    <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
                        <DataTable
                            data={bookings}
                            columns={columns}
                            isLoading={isLoading}
                            emptyMessage="No bookings found. Try adjusting your filters."
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

import { format } from 'date-fns';
import { Receipt, Eye, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { RecentBooking } from '../../../services/provider.service';

interface RecentBookingsTableProps {
    bookings: RecentBooking[];
}

export default function RecentBookingsTable({ bookings }: RecentBookingsTableProps) {
    const navigate = useNavigate();

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'ACTIVE':
                return 'bg-emerald-100 text-emerald-700';
            case 'COMPLETED':
                return 'bg-slate-100 text-slate-700';
            case 'CANCELLED':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getVehicleIcon = (type: string) => {
        switch (type.toUpperCase()) {
            case 'CAR': return '🚗';
            case 'BIKE': return '🏍️';
            case 'SCOOTER': return '🛵';
            case 'TRUCK': return '🚚';
            default: return '🚙';
        }
    };

    return (
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <Receipt size={24} />
                        </div>
                        Recent Bookings
                    </h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Latest transactions</p>
                </div>
                <button
                    onClick={() => navigate('/provider/bookings')}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                >
                    View All <ArrowRight size={14} />
                </button>
            </div>

            {bookings.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-100">
                                <th className="text-left pb-4 pr-4">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ticket ID</span>
                                </th>
                                <th className="text-left pb-4 pr-4">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Customer</span>
                                </th>
                                <th className="text-left pb-4 pr-4">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Vehicle</span>
                                </th>
                                <th className="text-left pb-4 pr-4">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Slot</span>
                                </th>
                                <th className="text-left pb-4 pr-4">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Entry Time</span>
                                </th>
                                <th className="text-left pb-4 pr-4">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                                </th>
                                <th className="text-right pb-4 pr-4">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Amount</span>
                                </th>
                                <th className="text-right pb-4">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Action</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking, idx) => (
                                <tr
                                    key={booking.id}
                                    className={`border-b border-gray-50 hover:bg-indigo-50/30 transition-colors ${idx % 2 === 0 ? 'bg-gray-50/50' : ''}`}
                                >
                                    <td className="py-5 pr-4">
                                        <span className="text-xs font-mono font-bold text-indigo-600">#{booking.ticket_id.slice(0, 8).toUpperCase()}</span>
                                    </td>
                                    <td className="py-5 pr-4">
                                        <span className="text-sm font-bold text-gray-900">{booking.customer_name}</span>
                                    </td>
                                    <td className="py-5 pr-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{getVehicleIcon(booking.vehicle_type)}</span>
                                            <span className="text-xs font-bold text-gray-600">{booking.vehicle_number}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 pr-4">
                                        <span className="text-sm font-black text-gray-900">{booking.slot_number}</span>
                                    </td>
                                    <td className="py-5 pr-4">
                                        <span className="text-xs font-bold text-gray-600">
                                            {format(new Date(booking.entry_time), 'MMM dd, HH:mm')}
                                        </span>
                                    </td>
                                    <td className="py-5 pr-4">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="py-5 pr-4 text-right">
                                        <span className="text-sm font-black text-gray-900">₹{booking.amount.toFixed(2)}</span>
                                    </td>
                                    <td className="py-5 text-right">
                                        <button
                                            onClick={() => navigate(`/provider/bookings/${booking.id}`)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-16 text-gray-400">
                    <Receipt size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">No recent bookings</p>
                </div>
            )}
        </div>
    );
}

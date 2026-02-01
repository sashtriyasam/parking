import { useQuery } from '@tanstack/react-query';
import { FileText, Calendar, User, Car, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { providerService } from '../../../../services/provider.service';

interface BookingsTabProps {
    facilityId: string;
}

export default function BookingsTab({ facilityId }: BookingsTabProps) {
    const { data: bookings = [], isLoading } = useQuery({
        queryKey: ['provider', 'facilities', facilityId, 'bookings'],
        queryFn: () => providerService.getBookings({ facility_id: facilityId }),
    });

    const getStatusBadge = (status: string) => {
        const styles = {
            active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            completed: 'bg-indigo-50 text-indigo-600 border-indigo-200',
            cancelled: 'bg-red-50 text-red-600 border-red-200',
        };
        return styles[status.toLowerCase() as keyof typeof styles] || 'bg-gray-50 text-gray-600 border-gray-200';
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Facility Bookings</h2>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    {bookings.length} total bookings for this facility
                </p>
            </div>

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading bookings...</p>
                </div>
            ) : bookings.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[40px] border border-gray-100">
                    <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                        <FileText size={48} className="text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-3">No Bookings Yet</h3>
                    <p className="text-sm font-bold text-gray-400">This facility hasn't received any bookings yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket ID</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Time</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {bookings.map((booking: any, index: number) => (
                                <tr key={booking.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-gray-400" />
                                            <span className="text-sm font-bold text-gray-900">{booking.ticket_id}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-gray-400" />
                                            <span className="text-sm font-bold text-gray-900">{booking.customer_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <Car size={16} className="text-gray-400" />
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{booking.vehicle_number}</p>
                                                <p className="text-[10px] font-black text-gray-400 uppercase">{booking.vehicle_type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-400" />
                                            <span className="text-sm font-bold text-gray-900">
                                                {format(new Date(booking.entry_time), 'MMM dd, hh:mm a')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <IndianRupee size={16} className="text-gray-400" />
                                            <span className="text-sm font-bold text-gray-900">
                                                ₹{booking.amount?.toLocaleString('en-IN') || '0'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${getStatusBadge(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

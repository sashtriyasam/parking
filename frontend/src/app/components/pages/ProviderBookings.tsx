import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, Phone, Car, MapPin, Clock, CreditCard, Info } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from "@/app/components/ui/alert-dialog";
import { toast } from 'sonner';
import { providerService } from '@/services/provider.service';
import { useApp } from '@/context/AppContext';
import type { Booking } from '@/types';

interface ExtendedBooking extends Booking {
    customer_name?: string;
    customer_phone?: string;
    slot_number?: string;
    booking_type?: string;
    payment_method?: string;
    vehicle_number?: string;
    vehicle_type?: string;
    entry_time?: string;
    exit_time?: string;
}

export function ProviderBookings() {
    const { cancelBooking } = useApp();
    const [bookings, setBookings] = useState<ExtendedBooking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelAlert, setShowCancelAlert] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<ExtendedBooking | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setIsLoading(true);
            const data = await providerService.getBookings();
            setBookings(data);
        } catch (error) {
            toast.error('Failed to load bookings');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesFilter = filter === 'all' || b.status === filter;
        const vNum = b.vehicle_number || b.vehicleNumber || '';
        const bId = b.id || '';
        const matchesSearch = vNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bId.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleViewDetails = (booking: ExtendedBooking) => {
        setSelectedBooking(booking);
        setIsDetailsOpen(true);
    };

    const handleCancelClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowCancelAlert(true);
    };

    const performCancellation = async () => {
        if (!selectedBooking) return;
        
        setIsCancelling(true);
        try {
            await cancelBooking(selectedBooking.id);
            toast.success('Registration cancelled successfully');
            
            // Update local state
            setBookings(prev => prev.map(b => 
                b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b
            ));
            
            // Clear selected booking state
            setSelectedBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
            setIsDetailsOpen(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setIsCancelling(false);
            setShowCancelAlert(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge className="bg-emerald-500">Active</Badge>;
            case 'completed': return <Badge variant="secondary">Completed</Badge>;
            case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
                        <p className="mt-2 text-gray-600">Manage customer reservations and parking history</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => providerService.exportBookings('csv')}>
                            Export CSV
                        </Button>
                    </div>
                </div>

                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search by vehicle number or booking ID..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 bg-gray-100 p-1 rounded-md">
                                {['all', 'active', 'completed', 'cancelled'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilter(status)}
                                        className={`px-4 py-2 rounded-sm text-sm font-medium transition-all ${filter === status ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {isLoading ? (
                    <div className="text-center py-12">Loading bookings...</div>
                ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
                        <p className="text-gray-500 mt-2">Try adjusting your filters or search query.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredBookings.map((booking) => (
                                        <tr
                                            key={booking.id}
                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => handleViewDetails(booking)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-indigo-600">
                                                {booking.id.substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{booking.customer_name || 'Customer'}</div>
                                                <div className="text-xs text-gray-500">{booking.customer_phone || 'No phone'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{booking.vehicle_number || booking.vehicleNumber}</div>
                                                <div className="text-xs text-gray-500 capitalize">{booking.vehicle_type || booking.vehicleType}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(booking.entry_time || booking.entryTime).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(booking.entry_time || booking.entryTime).toLocaleTimeString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                ₹{booking.amount}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(booking.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-900">
                                                    <Info className="w-4 h-4 mr-1" />
                                                    Details
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Booking Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
                        <div className="flex justify-between items-center">
                            <div>
                                <DialogTitle className="text-xl font-bold">Booking Verification</DialogTitle>
                                <DialogDescription className="text-indigo-100 mt-1">
                                    Full stay and customer details
                                </DialogDescription>
                            </div>
                            {selectedBooking && getStatusBadge(selectedBooking.status)}
                        </div>
                    </DialogHeader>

                    {selectedBooking && (
                        <div className="p-6 space-y-6 bg-white">
                            {/* Vehicle Identifier Section */}
                            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="p-3 bg-indigo-100 rounded-lg">
                                    <Car className="w-8 h-8 text-indigo-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-black tracking-widest text-gray-900 uppercase">
                                        {selectedBooking.vehicle_number || selectedBooking.vehicleNumber}
                                    </div>
                                    <div className="text-sm font-medium text-gray-500 capitalize">
                                        {selectedBooking.vehicle_type || selectedBooking.vehicleType} vehicle
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Customer Info */}
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <User className="w-4 h-4 text-gray-400 mt-1" />
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Customer Name</p>
                                            <p className="text-sm font-semibold text-gray-900">{selectedBooking.customer_name || 'Walking Customer'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-4 h-4 text-gray-400 mt-1" />
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Phone Number</p>
                                            <p className="text-sm font-semibold text-gray-900">{selectedBooking.customer_phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Assigned Slot</p>
                                            <p className="text-sm font-semibold text-gray-900">{selectedBooking.slot_number || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking Info */}
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-4 h-4 text-gray-400 mt-1" />
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Booking Type</p>
                                            <Badge variant="outline" className="mt-1 capitalize">
                                                {selectedBooking.booking_type || 'App Booking'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CreditCard className="w-4 h-4 text-gray-400 mt-1" />
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Payment Method</p>
                                            <p className="text-sm font-semibold text-gray-900 capitalize">{selectedBooking.payment_method?.replace('-', ' ') || 'UPI'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-4 h-4 text-gray-400 mt-1" />
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Total Amount</p>
                                            <p className="text-lg font-bold text-emerald-600">₹{selectedBooking.amount}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-3 pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-xs font-medium text-gray-500">Entry</span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {new Date(selectedBooking.entry_time || selectedBooking.entryTime).toLocaleString()}
                                    </p>
                                </div>
                                {selectedBooking.exit_time && (
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                                            <span className="text-xs font-medium text-gray-500">Exit</span>
                                        </div>
                                        <p className="text-sm font-medium">
                                            {new Date(selectedBooking.exit_time).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-2 bg-gray-50 px-3 rounded-lg">
                                    <span className="text-xs font-bold text-gray-700">Booking ID</span>
                                    <span className="text-xs font-mono text-gray-500">{selectedBooking.id}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {selectedBooking.status === 'active' && (
                                    <Button 
                                        variant="outline"
                                        className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-12 font-bold"
                                        onClick={handleCancelClick}
                                        disabled={isCancelling}
                                    >
                                        Cancel Registration
                                    </Button>
                                )}
                                <Button 
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-semibold"
                                    onClick={() => setIsDetailsOpen(false)}
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirmation Alert */}
            <AlertDialog open={showCancelAlert} onOpenChange={setShowCancelAlert}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-900">Cancel Registration?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will release the assigned parking slot ({selectedBooking?.slot_number}) and mark this booking as cancelled. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-gray-200">Go Back</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={performCancellation}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-100"
                        >
                            Yes, Cancel it
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

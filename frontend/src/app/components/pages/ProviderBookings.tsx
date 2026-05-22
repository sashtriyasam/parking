import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Calendar, User, Phone, Car, MapPin, Clock, CreditCard, Info, ChevronDown } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
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
      setBookings(prev => prev.map(b =>
        b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b
      ));
      setSelectedBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
      setIsDetailsOpen(false);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to cancel booking');
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to cancel booking');
      }
    } finally {
      setIsCancelling(false);
      setShowCancelAlert(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Active', bg: 'rgba(52,199,89,0.12)', color: '#34C759' };
      case 'completed': return { label: 'Completed', bg: 'rgba(142,142,147,0.12)', color: '#8E8E93' };
      case 'cancelled': return { label: 'Cancelled', bg: 'rgba(255,59,48,0.12)', color: '#FF3B30' };
      default: return { label: status, bg: 'rgba(0,122,255,0.12)', color: '#007AFF' };
    }
  };

  const formatDate = (dateValue: any, type: 'date' | 'time' | 'full' = 'full') => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid';
    switch (type) {
      case 'date': return date.toLocaleDateString();
      case 'time': return date.toLocaleTimeString();
      default: return date.toLocaleString();
    }
  };

  const FILTERS = ['all', 'active', 'completed', 'cancelled'];

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Operator Hub</p>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Bookings</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage reservations and parking history</p>
          </div>
          <button
            onClick={() => providerService.exportBookings('csv')}
            className="h-9 px-4 flex items-center gap-2 bg-secondary border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors"
          >
            Export CSV
          </button>
        </div>

        {/* Search + Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                placeholder="Search by vehicle number or booking ID…"
                className="w-full pl-9 pr-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Segmented Filter */}
            <div className="flex bg-secondary rounded-lg p-1 gap-0.5">
              {FILTERS.map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    filter === status
                      ? 'bg-card shadow-sm text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table / Empty State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-20 bg-card border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground">
            <Calendar className="w-12 h-12 mb-3 opacity-30" />
            <h3 className="text-base font-bold text-foreground mb-1">No bookings found</h3>
            <p className="text-sm">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Booking ID</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vehicle</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Time</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredBookings.map(booking => {
                    const sc = getStatusConfig(booking.status);
                    return (
                      <tr
                        key={booking.id}
                        className="hover:bg-secondary/40 cursor-pointer transition-colors"
                        onClick={() => handleViewDetails(booking)}
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-xs font-mono font-bold text-primary">
                            {booking.id.substring(0, 8)}…
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-foreground">{booking.customer_name || 'Customer'}</p>
                          <p className="text-xs text-muted-foreground">{booking.customer_phone || 'No phone'}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-foreground">{booking.vehicle_number || booking.vehicleNumber}</p>
                          <p className="text-xs text-muted-foreground capitalize">{booking.vehicle_type || booking.vehicleType}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm text-foreground">{formatDate(booking.entry_time || booking.entryTime, 'date')}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(booking.entry_time || booking.entryTime, 'time')}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm font-black text-foreground">₹{booking.amount}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold"
                            style={{ backgroundColor: sc.bg, color: sc.color }}
                          >
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <button
                            className="text-xs font-semibold text-primary flex items-center gap-1 ml-auto hover:underline"
                            onClick={e => { e.stopPropagation(); handleViewDetails(booking); }}
                          >
                            <Info className="w-3.5 h-3.5" /> Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <DialogHeader className="p-6 border-b border-border">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">Booking Details</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm mt-0.5">
                  Full stay and customer information
                </DialogDescription>
              </div>
              {selectedBooking && (() => {
                const sc = getStatusConfig(selectedBooking.status);
                return (
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{ backgroundColor: sc.bg, color: sc.color }}
                  >
                    {sc.label}
                  </span>
                );
              })()}
            </div>
          </DialogHeader>

          {selectedBooking && (
            <div className="p-6 space-y-5">
              {/* Vehicle */}
              <div className="flex items-center gap-4 bg-secondary rounded-xl p-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Car className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-widest text-foreground uppercase">
                    {selectedBooking.vehicle_number || selectedBooking.vehicleNumber}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedBooking.vehicle_type || selectedBooking.vehicleType} vehicle
                  </p>
                </div>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-4">
                <DetailRow icon={User} label="Customer" value={selectedBooking.customer_name || 'Walking Customer'} />
                <DetailRow icon={Phone} label="Phone" value={selectedBooking.customer_phone || 'N/A'} />
                <DetailRow icon={MapPin} label="Slot" value={selectedBooking.slot_number || 'N/A'} />
                <DetailRow icon={CreditCard} label="Payment" value={selectedBooking.payment_method?.replace('-', ' ') || 'UPI'} />
                <DetailRow icon={Info} label="Type" value={selectedBooking.booking_type || 'App Booking'} />
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount</p>
                  <p className="text-lg font-black" style={{ color: '#34C759' }}>₹{selectedBooking.amount}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2 pt-4 border-t border-border">
                <TimelineRow label="Entry" value={formatDate(selectedBooking.entry_time || selectedBooking.entryTime)} color="#34C759" />
                {(selectedBooking.exit_time || selectedBooking.exitTime) && (
                  <TimelineRow label="Exit" value={formatDate(selectedBooking.exit_time || selectedBooking.exitTime)} color="#FF3B30" />
                )}
                <div className="flex justify-between items-center bg-secondary px-3 py-2 rounded-lg">
                  <span className="text-xs font-bold text-muted-foreground">Booking ID</span>
                  <span className="text-xs font-mono text-foreground">{selectedBooking.id}</span>
                </div>
              </div>

              <div className="flex gap-3">
                {selectedBooking.status === 'active' && (
                  <Button
                    variant="outline"
                    className="flex-1 h-11 border-destructive text-destructive hover:bg-destructive/5 font-bold rounded-lg"
                    onClick={handleCancelClick}
                    disabled={isCancelling}
                  >
                    Cancel Registration
                  </Button>
                )}
                <Button
                  className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={showCancelAlert} onOpenChange={setShowCancelAlert}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-foreground">Cancel Registration?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will release slot {selectedBooking?.slot_number} and mark this booking as cancelled. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-lg border-border font-semibold">Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={performCancellation}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-lg font-bold"
            >
              Yes, Cancel it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm font-semibold text-foreground capitalize">{value}</p>
    </div>
  );
}

function TimelineRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Calendar, RefreshCcw, Navigation, Info, Car, CreditCard, ChevronRight, ParkingSquare } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { useApp } from '@/context/AppContext';
import QRCode from 'react-qr-code';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import { customerService } from '@/services/customer.service';
import type { Ticket, ParkingFacility } from '@/types';
import { toast } from 'sonner';

// Helper component for live duration
function LiveTimer({ entryTime }: { entryTime: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(entryTime);
      const now = new Date();
      const hours = differenceInHours(now, start);
      const minutes = differenceInMinutes(now, start) % 60;
      setElapsed(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [entryTime]);

  return <span>{elapsed}</span>;
}

const getDuration = (start: string, end?: string) => {
  if (!end) return 'Ongoing';
  const hours = differenceInHours(new Date(end), new Date(start));
  const minutes = differenceInMinutes(new Date(end), new Date(start)) % 60;
  return `${hours}h ${minutes}m`;
};

export function CustomerTickets() {
  const navigate = useNavigate();
  const { getFacilityById, cancelBooking } = useApp();
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [pastTickets, setPastTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ticketToCancel, setTicketToCancel] = useState<string | null>(null);
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const active = await customerService.getActiveTickets();
      setActiveTickets(active);

      const historyResponse = await customerService.getTicketHistory();
      setPastTickets((historyResponse as any).data || historyResponse);
    } catch (error: any) {
      console.error('Failed to load tickets', error);
      toast.error(error.message || 'Failed to load tickets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (ticketId: string) => {
    try {
      setIsLoading(true);
      await cancelBooking(ticketId);
      
      // Optimistic update
      setActiveTickets(prev => prev.filter(t => t.id !== ticketId));
      
      toast.success('Booking cancelled successfully');
      loadTickets();
    } catch (error: any) {
      toast.error('Error canceling booking');
    } finally {
      setIsLoading(false);
      setTicketToCancel(null);
    }
  };

  const handleDownload = async (ticketId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No authentication token found');

      const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
      if (!apiUrl) throw new Error('API Base URL is not configured');

      toast.info('Generating secure invoice...');
      
      const response = await fetch(`${apiUrl}/customer/booking/${ticketId}/invoice.pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to download invoice');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parkeasy-invoice-${ticketId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Invoice downloaded successfully');
    } catch (error: any) {
      console.error('Download failed:', error);
      toast.error(error.message || 'Failed to download invoice');
    }
  };

  const navigateToFacility = (ticket: Ticket) => {
    const facility = getFacilityById(ticket.facility_id) || (ticket as any).facility;
    const lat = facility?.latitude;
    const lng = facility?.longitude;
    if (lat && lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      toast.error('Location coordinates unavailable for this facility');
    }
  };

  const RefreshButton = () => (
    <Button variant="ghost" size="sm" onClick={loadTickets} className="ml-2">
      <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
    </Button>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10 flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-gray-900">My Bookings</h1>
            <p className="text-gray-500 font-medium">Manage your active reservations and history</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Live Status</span>
            <RefreshButton />
          </div>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">Active ({activeTickets.length})</TabsTrigger>
            <TabsTrigger value="history">History ({pastTickets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {isLoading ? (
              <div className="py-12 text-center text-gray-500">Loading tickets...</div>
            ) : activeTickets.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">No active bookings</h3>
                <p className="text-gray-600 mb-6">Book a parking spot to see it here</p>
                <Button onClick={() => navigate('/customer/search')}>Find Parking</Button>
              </Card>
            ) : (
              activeTickets.map(ticket => {
                // Handle facility lookup safely
                const facility = getFacilityById(ticket.facility_id) || ticket.facility || {
                  name: 'Parking Facility',
                  address: 'Location Details'
                } as unknown as ParkingFacility; // Cast for safety if partial

                return (
                  <Card key={ticket.id} className="group overflow-hidden rounded-[32px] border-0 shadow-xl shadow-black/[0.03] hover:shadow-2xl hover:shadow-black/10 transition-all duration-500 bg-white">
                    <div className="p-8">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-0 font-black px-3 py-1 text-[10px] tracking-widest uppercase">ACTIVE NOW</Badge>
                            <div className="flex items-center text-emerald-600 text-[10px] font-black">
                              <span className="relative flex h-2 w-2 mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              LIVE
                            </div>
                          </div>
                          <h3 className="text-2xl font-black text-gray-900 mb-2">{facility.name}</h3>
                          <div className="flex items-center text-gray-500">
                            <MapPin className="w-4 h-4 mr-2 text-primary" />
                            <span className="text-sm font-medium">{facility.address}</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-3xl p-6 min-w-[180px] flex flex-col items-end justify-center border border-black/[0.03]">
                           <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-sm font-bold text-gray-400">₹</span>
                            <span className="text-4xl font-black text-primary tracking-tighter">
                              {ticket.current_fee || ticket.total_fee || ticket.amount}
                            </span>
                          </div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Total Estimate</p>
                          <div className="flex items-center gap-2 bg-emerald-100/50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200">
                            <Clock className="w-3.5 h-3.5" />
                            <p className="text-xs font-black">
                              <LiveTimer entryTime={ticket.entry_time} />
                            </p>
                          </div>
                        </div>
                      </div>

                    {/* Time Window Display */}
                    {(ticket as any).exit_time && (
                      <div className="flex items-center gap-2 mb-4 bg-indigo-50 rounded-xl px-4 py-3">
                        <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="text-sm font-bold text-indigo-700">
                          {format(new Date(ticket.entry_time), 'hh:mm a')}
                          {' → '}
                          {format(new Date((ticket as any).exit_time), 'hh:mm a')}
                        </span>
                        <span className="text-xs text-indigo-500 ml-auto">
                          {format(new Date(ticket.entry_time), 'MMM dd')}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Vehicle</p>
                        <p className="font-semibold">{ticket.vehicle_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Start Time</p>
                        <p className="font-semibold">{format(new Date(ticket.entry_time), 'MMM dd, HH:mm')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                        <p className="font-semibold text-sm">{ticket.id.substring(0, 8)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Slot</p>
                        <p className="font-semibold">{ticket.slot?.slot_number || ticket.slot?.slotNumber || 'Assigned'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="flex items-center space-x-2">
                        <div className="bg-white p-2 rounded-lg border">
                          {ticket.qr_code?.startsWith('data:image') ? (
                            <img 
                              src={ticket.qr_code} 
                              alt="Booking QR Code" 
                              className="w-16 h-16 object-contain"
                            />
                          ) : (
                            <QRCode value={ticket.qr_code || ticket.id} size={64} />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 max-w-[80px]">Scan QR at entry gate</p>
                      </div>
                      
                      <div className="flex gap-2">
                        {/* Navigate Button */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          onClick={() => navigateToFacility(ticket)}
                        >
                          <Navigation className="w-4 h-4 mr-1" />
                          Navigate
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                          onClick={() => handleDownload(ticket.id)}
                        >
                          Download Invoice
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setTicketToCancel(ticket.id);
                          }}
                          disabled={isLoading}
                        >
                          Cancel Booking
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {isLoading ? (
              <div className="py-12 text-center text-gray-500">Loading history...</div>
            ) : pastTickets.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-gray-600">No past bookings found</p>
              </Card>
            ) : (
              pastTickets.map(ticket => {
                const facility = getFacilityById(ticket.facility_id) || ticket.facility || { name: 'Unknown Facility' } as any;
                return (
                  <Card 
                    key={ticket.id} 
                    className="p-6 opacity-75 hover:opacity-100 transition-all cursor-pointer hover:shadow-md group"
                    onClick={() => setViewingTicket(ticket)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant={ticket.status === 'completed' ? 'secondary' : 'destructive'} className="mb-2">
                          {ticket.status.toUpperCase()}
                        </Badge>
                        <h3 className="text-lg font-bold">{facility.name}</h3>
                        <div className="flex items-center text-gray-600 mt-1 text-sm">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{format(new Date(ticket.entry_time), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">₹{ticket.total_fee || ticket.amount}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-end group-hover:text-primary transition-colors">
                          View Details <ChevronRight className="w-3 h-3 ml-1" />
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>

        {/* Detailed Viewing Modal */}
        <Dialog open={!!viewingTicket} onOpenChange={(open) => !open && setViewingTicket(null)}>
          <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
            {viewingTicket && (() => {
              const facility = getFacilityById(viewingTicket.facility_id) || (viewingTicket as any).facility || { name: 'Unknown Facility', address: 'Address unavailable' };
              return (
                <div className="relative">
                  {/* Decorative Header */}
                  <div className="bg-gradient-to-br from-gray-900 to-indigo-950 p-8 text-white">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/10">
                        <ParkingSquare className="w-6 h-6 text-indigo-300" />
                      </div>
                      <Badge variant="outline" className="text-white border-white/20 bg-white/5 backdrop-blur-md px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                        {viewingTicket.status}
                      </Badge>
                    </div>
                    <DialogTitle className="text-2xl font-black mb-1">{facility.name}</DialogTitle>
                    <DialogDescription className="text-indigo-200/80 text-sm flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-1 shrink-0" />
                      {facility.address}
                    </DialogDescription>
                  </div>

                  {/* Body - Ticket Style */}
                  <div className="p-8 bg-white space-y-6 relative">
                    <div className="grid grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Check In</p>
                        <p className="font-bold text-gray-900">{format(new Date(viewingTicket.entry_time), 'h:mm aa')}</p>
                        <p className="text-xs text-gray-500">{format(new Date(viewingTicket.entry_time), 'MMM dd, yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Check Out</p>
                        <p className="font-bold text-gray-900">
                          {viewingTicket.exit_time ? format(new Date(viewingTicket.exit_time), 'h:mm aa') : '--:--'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {viewingTicket.exit_time ? format(new Date(viewingTicket.exit_time), 'MMM dd, yyyy') : '--'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">Total Duration</p>
                            <p className="text-sm text-gray-500">
                              {getDuration(viewingTicket.entry_time, viewingTicket.exit_time)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <Car className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">Vehicle Info</p>
                            <p className="text-sm text-gray-500">{(viewingTicket as any).vehicle_number || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-dashed">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">Total Fee Paid</p>
                            <p className="text-sm text-gray-500 tracking-tight">Payment reference: {(viewingTicket.id as string).slice(-8).toUpperCase()}</p>
                          </div>
                        </div>
                        <p className="text-2xl font-black text-primary tracking-tighter">₹{viewingTicket.total_fee || viewingTicket.amount}</p>
                      </div>
                    </div>

                    <Button className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-base shadow-xl" onClick={() => setViewingTicket(null)}>
                      Close Details
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!ticketToCancel} onOpenChange={(open) => !open && setTicketToCancel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will cancel your parking reservation and release your slot. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Go Back</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => ticketToCancel && handleCancel(ticketToCancel)}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Cancel Booking
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

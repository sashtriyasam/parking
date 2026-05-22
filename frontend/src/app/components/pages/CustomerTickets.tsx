import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Calendar, RefreshCcw, Navigation, Info, Car, CreditCard, ChevronRight, ParkingSquare, Shield } from 'lucide-react';
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
  const [isScanningMode, setIsScanningMode] = useState<Ticket | null>(null);

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
    } catch (error: any) {
      toast.error('Error canceling booking');
      loadTickets();
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

      // Validate Content-Type to ensure we actually received a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.toLowerCase().startsWith('application/pdf')) {
        throw new Error('Server returned invalid file format');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `parkeasy-invoice-${ticketId.slice(0, 8)}.pdf`;
      
      document.body.appendChild(a);
      a.click();
      
      // Defer revocation to allow the browser time to initiate the download handoff
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 500);

      toast.success('Invoice downloaded successfully');
    } catch (error: any) {
      console.error('Download failed:', error);
      toast.error(error.message || 'Failed to download invoice');
    }
  };

  const navigateToFacility = (ticket: Ticket) => {
    const facility = getFacilityById(ticket.facility_id) || ticket.facility;
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
    <div className="min-h-screen bg-background pt-16 text-foreground">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10 flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold font-display tracking-tight text-foreground">My Bookings</h1>
            <p className="text-muted-foreground font-medium">Manage your active reservations and history</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2">Live Status</span>
            <RefreshButton />
          </div>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-secondary border border-border/50 p-1 rounded-xl">
            <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium">Active ({activeTickets.length})</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium">History ({pastTickets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">Loading tickets...</div>
            ) : activeTickets.length === 0 ? (
              <Card className="p-12 text-center bg-card border border-border rounded-lg text-card-foreground">
                <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold mb-2 font-display">No active bookings</h3>
                <p className="text-muted-foreground mb-6">Book a parking spot to see it here</p>
                <Button onClick={() => navigate('/customer/search')} className="rounded-md">Find Parking</Button>
              </Card>
            ) : (
              activeTickets.map(ticket => {
                // Handle facility lookup safely
                const facility = getFacilityById(ticket.facility_id) || ticket.facility || {
                  name: 'Parking Facility',
                  address: 'Location Details'
                } as unknown as ParkingFacility; // Cast for safety if partial

                return (
                  <Card key={ticket.id} className="group overflow-hidden rounded-lg border border-border shadow-sm bg-card hover:bg-card/95 transition-all duration-300">
                    <div className="p-5 sm:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className="bg-[#34C759]/15 text-[#34C759] border-0 font-bold px-2.5 py-0.5 text-[10px] tracking-widest uppercase rounded-full">ACTIVE NOW</Badge>
                            <div className="flex items-center text-[#34C759] text-[9px] font-black">
                              <span className="relative flex h-1.5 w-1.5 mr-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34C759]/75 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#34C759]"></span>
                              </span>
                              LIVE
                            </div>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1 leading-tight font-display">{facility.name}</h3>
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
                            <span className="text-xs font-medium truncate max-w-[200px] sm:max-w-none">{facility.address}</span>
                          </div>
                        </div>
                        
                        <div className="bg-secondary/40 rounded-lg p-4 sm:p-6 min-w-full sm:min-w-[180px] flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border border-border">
                          <div className="flex flex-col sm:items-end">
                            <div className="flex items-baseline gap-1 mb-0.5">
                              <span className="text-xs font-bold text-muted-foreground">₹</span>
                              <span className="text-2xl sm:text-4xl font-bold text-primary tracking-tighter font-display">
                                {ticket.current_fee || ticket.total_fee || ticket.amount}
                              </span>
                            </div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Est. Fee</p>
                          </div>
                          <div className="flex items-center gap-2 bg-[#34C759]/15 text-[#34C759] px-3 py-1.5 rounded-md border border-[#34C759]/20 mt-0 sm:mt-3">
                            <Clock className="w-3 h-3" />
                            <p className="text-[10px] sm:text-xs font-black">
                              <LiveTimer entryTime={ticket.entry_time} />
                            </p>
                          </div>
                        </div>
                      </div>

                    {/* Time Window Display */}
                    {ticket.exit_time && (
                      <div className="flex items-center gap-2 mb-6 bg-primary/10 text-primary rounded-md px-4 py-3">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-xs sm:text-sm font-bold">
                          {format(new Date(ticket.entry_time), 'hh:mm a')}
                          {' → '}
                          {format(new Date(ticket.exit_time), 'hh:mm a')}
                        </span>
                        <span className="text-[10px] text-primary/70 ml-auto">
                          {format(new Date(ticket.entry_time), 'MMM dd')}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 bg-secondary/20 p-4 rounded-lg border border-border">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-0.5">Vehicle</p>
                        <p className="font-bold text-sm text-foreground">{ticket.vehicle_number}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-0.5">Start</p>
                        <p className="font-bold text-sm text-foreground">{format(new Date(ticket.entry_time), 'HH:mm')}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-0.5">Booking ID</p>
                        <p className="font-bold text-sm text-foreground">{ticket.id.substring(0, 8)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-0.5">Slot</p>
                        <p className="font-bold text-sm text-foreground">{ticket.slot?.slot_number || ticket.slot?.slotNumber || '---'}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border border-dashed pt-5 gap-6">
                      <div 
                        className="flex items-center space-x-4 bg-card p-3 rounded-lg border border-border shadow-sm cursor-pointer hover:bg-secondary/50 transition-colors group/qr"
                        onClick={() => setIsScanningMode(ticket)}
                      >
                        <div className="bg-white p-1 rounded-md">
                          {ticket.qr_code?.startsWith('data:image') ? (
                            <img 
                              src={ticket.qr_code} 
                              alt="Booking QR Code" 
                              className="w-12 h-12 object-contain group-hover/qr:scale-110 transition-transform"
                            />
                          ) : (
                            <QRCode value={ticket.qr_code || ticket.id} size={48} />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Scan at Gate</p>
                          <p className="text-[10px] text-primary font-bold">Tap to Enlarge</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-10 px-4 rounded-md border-[#007AFF]/25 text-[#007AFF] hover:bg-[#007AFF]/10 font-bold text-xs"
                          onClick={() => navigateToFacility(ticket)}
                        >
                          <Navigation className="w-3.5 h-3.5 mr-1.5" />
                          Directions
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-10 px-4 rounded-md border-primary/25 text-primary hover:bg-primary/10 font-bold text-xs"
                          onClick={() => handleDownload(ticket.id)}
                        >
                          Invoice
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-10 px-4 rounded-md border-destructive/25 text-destructive hover:bg-destructive/10 font-bold text-xs"
                          onClick={() => setTicketToCancel(ticket.id)}
                          disabled={isLoading}
                        >
                          Cancel
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
            <div className="py-12 text-center text-muted-foreground">Loading history...</div>
          ) : pastTickets.length === 0 ? (
            <Card className="p-12 text-center bg-card border border-border rounded-lg text-card-foreground">
              <p className="text-muted-foreground">No past bookings found</p>
            </Card>
          ) : (
            pastTickets.map(ticket => {
              const facility = getFacilityById(ticket.facility_id) || ticket.facility || { name: 'Unknown Facility' } as any;
              return (
                <Card 
                  key={ticket.id} 
                  className="p-6 bg-card border border-border hover:bg-secondary/40 transition-all cursor-pointer rounded-lg group"
                  onClick={() => setViewingTicket(ticket)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant={ticket.status === 'completed' ? 'secondary' : 'destructive'} className="mb-2 rounded-full">
                        {ticket.status.toUpperCase()}
                      </Badge>
                      <h3 className="text-lg font-bold text-foreground font-display">{facility.name}</h3>
                      <div className="flex items-center text-muted-foreground mt-1 text-sm">
                        <Calendar className="w-4 h-4 mr-1 text-primary" />
                        <span>{format(new Date(ticket.entry_time), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground font-display">₹{ticket.total_fee || ticket.amount}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center justify-end group-hover:text-primary transition-colors">
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
          <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border border-border rounded-lg shadow-lg bg-card text-card-foreground">
            {viewingTicket && (() => {
              const facility = getFacilityById(viewingTicket.facility_id) || (viewingTicket as any).facility || { name: 'Unknown Facility', address: 'Address unavailable' };
              return (
                <div className="relative">
                  {/* Decorative Header */}
                  <div className="bg-secondary p-8 text-foreground border-b border-border">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-md flex items-center justify-center border border-primary/20">
                        <ParkingSquare className="w-6 h-6" />
                      </div>
                      <Badge variant="outline" className="text-foreground border-border bg-secondary px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-full">
                        {viewingTicket.status}
                      </Badge>
                    </div>
                    <DialogTitle className="text-2xl font-bold font-display mb-1">{facility.name}</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-1 shrink-0 text-primary" />
                      {facility.address}
                    </DialogDescription>
                  </div>

                  {/* Body - Ticket Style */}
                  <div className="p-8 bg-card space-y-6 relative">
                    <div className="grid grid-cols-2 gap-6 bg-secondary/40 p-6 rounded-lg border border-border">
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Check In</p>
                        <p className="font-bold text-foreground">{format(new Date(viewingTicket.entry_time), 'h:mm aa')}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(viewingTicket.entry_time), 'MMM dd, yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Check Out</p>
                        <p className="font-bold text-foreground">
                          {viewingTicket.exit_time ? format(new Date(viewingTicket.exit_time), 'h:mm aa') : '--:--'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {viewingTicket.exit_time ? format(new Date(viewingTicket.exit_time), 'MMM dd, yyyy') : '--'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">Total Duration</p>
                            <p className="text-sm text-muted-foreground">
                              {getDuration(viewingTicket.entry_time, viewingTicket.exit_time)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Car className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">Vehicle Info</p>
                            <p className="text-sm text-muted-foreground">{(viewingTicket as any).vehicle_number || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border border-dashed">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">Total Fee Paid</p>
                            <p className="text-sm text-muted-foreground tracking-tight">Payment reference: {(viewingTicket.id as string).slice(-8).toUpperCase()}</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold font-display text-primary tracking-tighter">₹{viewingTicket.total_fee || viewingTicket.amount}</p>
                      </div>
                    </div>

                    <Button className="w-full h-12 rounded-md bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-base shadow-sm" onClick={() => setViewingTicket(null)}>
                      Close Details
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
        
        {/* Scanning Mode / Large QR Modal */}
        <Dialog open={!!isScanningMode} onOpenChange={(open) => !open && setIsScanningMode(null)}>
          <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border border-border rounded-lg shadow-lg bg-card text-card-foreground">
            {isScanningMode && (
              <div className="flex flex-col items-center">
                <div className="w-full bg-primary p-8 text-center text-white">
                  <DialogHeader className="sr-only">
                    <DialogTitle>Gate Pass QR Code</DialogTitle>
                    <DialogDescription>Show this QR code at the entrance or exit gate.</DialogDescription>
                  </DialogHeader>
                  <div className="mx-auto w-12 h-12 bg-white/20 rounded-md flex items-center justify-center mb-4 backdrop-blur-sm">
                    <ParkingSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold font-display mb-1">Gate Pass</h3>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Entrance & Exit</p>
                </div>
                
                <div className="p-10 flex flex-col items-center">
                  <div className="p-6 bg-white rounded-lg border border-border mb-8 shadow-sm">
                    {isScanningMode.qr_code?.startsWith('data:image') ? (
                      <img 
                        src={isScanningMode.qr_code} 
                        alt="Gate Pass QR" 
                        className="w-48 h-48 object-contain"
                      />
                    ) : (
                      <QRCode value={isScanningMode.qr_code || isScanningMode.id} size={200} />
                    )}
                  </div>
                  
                  <div className="text-center space-y-1 mb-8">
                    <p className="text-lg font-bold text-foreground font-display">{isScanningMode.vehicle_number}</p>
                    <p className="text-xs text-muted-foreground font-medium">Slot: {isScanningMode.slot?.slot_number || 'Assigned'}</p>
                  </div>
                  
                  <div className="w-full bg-secondary/40 rounded-lg p-4 flex items-center gap-4 border border-border">
                    <div className="w-10 h-10 rounded-full bg-[#34C759]/15 text-[#34C759] flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-[#34C759]" />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                      Point this QR code at the scanner at the parking entrance or exit to automatically operate the gate.
                    </p>
                  </div>
                </div>
                
                <div className="w-full p-6 bg-secondary/20 border-t border-border">
                  <Button 
                    className="w-full h-12 rounded-md bg-primary hover:bg-primary/95 text-primary-foreground font-bold"
                    onClick={() => setIsScanningMode(null)}
                  >
                    Done Scanning
                  </Button>
                </div>
              </div>
            )}
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Calendar, RefreshCcw } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import QRCode from 'react-qr-code';
import { format } from 'date-fns';
import { customerService } from '@/services/customer.service';
import type { Ticket, ParkingFacility } from '@/types';
import { toast } from 'sonner';

export function CustomerTickets() {
  const navigate = useNavigate();
  const { getFacilityById } = useApp();
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [pastTickets, setPastTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const active = await customerService.getActiveTickets();
      setActiveTickets(active);

      const historyResponse = await customerService.getTicketHistory();
      // Adjust structure if historyResponse is just Ticket[] or {data: Ticket[]}
      // Using 'as any' to be safe with ApiResponse structure if needed
      setPastTickets((historyResponse as any).data || historyResponse);
    } catch (error) {
      console.error('Failed to load tickets', error);
      // toast.error('Failed to load tickets'); // Optional: don't spam if just empty
    } finally {
      setIsLoading(false);
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black mb-2">My Tickets</h1>
            <p className="text-gray-600">View and manage your parking bookings</p>
          </div>
          <RefreshButton />
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
                  <Card key={ticket.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Badge className="bg-emerald-500 mb-2 animate-pulse">ACTIVE</Badge>
                        <h3 className="text-xl font-bold">{facility.name}</h3>
                        <div className="flex items-center text-gray-600 mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="text-sm">{facility.address}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-indigo-600">₹{ticket.amount}</p>
                        <p className="text-sm text-gray-600">
                          {ticket.duration_hours ? `${ticket.duration_hours} hours` : 'Ongoing'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Vehicle</p>
                        <p className="font-semibold">{ticket.vehicle_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Entry Time</p>
                        <p className="font-semibold">{format(new Date(ticket.entry_time), 'MMM dd, HH:mm')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                        <p className="font-semibold text-sm">{ticket.id.substring(0, 8)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Slot</p>
                        <p className="font-semibold">{ticket.slot?.slotNumber || 'Assigned'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-4 border-t pt-4">
                      <div className="text-center">
                        <div className="mb-2 bg-white p-3 rounded-lg inline-block border">
                          <QRCode value={ticket.qr_code || ticket.id} size={120} />
                        </div>
                        <p className="text-xs text-gray-600">Scan at gate</p>
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
                  <Card key={ticket.id} className="p-6 opacity-75 hover:opacity-100 transition-opacity">
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
                        <p className="text-xl font-bold">₹{ticket.amount}</p>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

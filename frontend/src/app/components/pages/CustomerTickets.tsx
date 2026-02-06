import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Calendar } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import QRCode from 'react-qr-code';
import { format } from 'date-fns';

export function CustomerTickets() {
  const navigate = useNavigate();
  const { user, bookings, getFacilityById } = useApp();

  const userBookings = useMemo(() => {
    return bookings.filter(b => b.customerId === user?.id);
  }, [bookings, user]);

  const activeBookings = userBookings.filter(b => b.status === 'active');
  const completedBookings = userBookings.filter(b => b.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">My Tickets</h1>
          <p className="text-gray-600">View and manage your parking bookings</p>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="active">Active ({activeBookings.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedBookings.length})</TabsTrigger>
            <TabsTrigger value="all">All ({userBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">No active bookings</h3>
                <p className="text-gray-600 mb-6">Book a parking spot to see it here</p>
                <Button onClick={() => navigate('/customer/search')}>Find Parking</Button>
              </Card>
            ) : (
              activeBookings.map(booking => {
                const facility = getFacilityById(booking.facilityId);
                return (
                  <Card key={booking.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Badge className="bg-emerald-500 mb-2 animate-pulse">ACTIVE</Badge>
                        <h3 className="text-xl font-bold">{facility?.name}</h3>
                        <div className="flex items-center text-gray-600 mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="text-sm">{facility?.address}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-indigo-600">₹{booking.amount}</p>
                        <p className="text-sm text-gray-600">{booking.duration} hours</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Vehicle</p>
                        <p className="font-semibold">{booking.vehicleNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Entry Time</p>
                        <p className="font-semibold">{format(new Date(booking.entryTime), 'MMM dd, HH:mm')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Payment</p>
                        <p className="font-semibold capitalize">{booking.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                        <p className="font-semibold text-sm">{booking.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-4 border-t pt-4">
                      <div className="text-center">
                        <div className="mb-2 bg-white p-3 rounded-lg inline-block border">
                          <QRCode value={booking.qrCode} size={120} />
                        </div>
                        <p className="text-xs text-gray-600">Scan at gate</p>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-gray-600">No completed bookings</p>
              </Card>
            ) : (
              completedBookings.map(booking => {
                const facility = getFacilityById(booking.facilityId);
                return (
                  <Card key={booking.id} className="p-6 opacity-75">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2">COMPLETED</Badge>
                        <h3 className="text-lg font-bold">{facility?.name}</h3>
                        <div className="flex items-center text-gray-600 mt-1 text-sm">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{format(new Date(booking.entryTime), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">₹{booking.amount}</p>
                        <p className="text-sm text-gray-600">{booking.duration} hours</p>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {userBookings.map(booking => {
              const facility = getFacilityById(booking.facilityId);
              return (
                <Card key={booking.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className={booking.status === 'active' ? 'bg-emerald-500' : ''} variant={booking.status === 'active' ? 'default' : 'outline'}>
                        {booking.status.toUpperCase()}
                      </Badge>
                      <h3 className="text-lg font-bold mt-2">{facility?.name}</h3>
                      <p className="text-sm text-gray-600">{booking.vehicleNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">₹{booking.amount}</p>
                      <p className="text-sm text-gray-600">{format(new Date(booking.entryTime), 'MMM dd')}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

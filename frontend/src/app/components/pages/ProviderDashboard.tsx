import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Users, ParkingSquare, TrendingUp, Building, Plus, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useApp } from '@/context/AppContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ProviderDashboard() {
  const navigate = useNavigate();
  const { user, facilities, bookings } = useApp();

  const providerFacilities = useMemo(() => {
    return facilities.filter(f => f.providerId === user?.id);
  }, [facilities, user]);

  const activeBookings = useMemo(() => {
    return bookings.filter(b => {
      const facility = facilities.find(f => f.id === b.facilityId);
      return facility?.providerId === user?.id && b.status === 'active';
    });
  }, [bookings, facilities, user]);

  const totalRevenue = useMemo(() => {
    return bookings
      .filter(b => {
        const facility = facilities.find(f => f.id === b.facilityId);
        return facility?.providerId === user?.id;
      })
      .reduce((sum, b) => sum + b.amount, 0);
  }, [bookings, facilities, user]);

  const todayRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return bookings
      .filter(b => {
        const facility = facilities.find(f => f.id === b.facilityId);
        const bookingDate = new Date(b.entryTime).toDateString();
        return facility?.providerId === user?.id && bookingDate === today;
      })
      .reduce((sum, b) => sum + b.amount, 0);
  }, [bookings, facilities, user]);

  const totalSlots = providerFacilities.reduce((sum, f) => sum + f.totalSlots, 0);
  const occupancyRate = totalSlots > 0
    ? Math.round((activeBookings.length / totalSlots) * 100)
    : 0;

  // Mock revenue data for chart
  const revenueData = [
    { date: 'Mon', revenue: 12450 },
    { date: 'Tue', revenue: 15800 },
    { date: 'Wed', revenue: 13200 },
    { date: 'Thu', revenue: 18900 },
    { date: 'Fri', revenue: 21500 },
    { date: 'Sat', revenue: 25600 },
    { date: 'Sun', revenue: 19800 },
  ];

  const occupancyData = providerFacilities.map(f => ({
    name: f.name.split(' ')[0],
    occupancy: Math.round(((f.totalSlots - f.availableSlots) / f.totalSlots) * 100),
  }));

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Provider Dashboard</h1>
            <p className="text-gray-600">Real-time analytics & management hub</p>
          </div>
          <Button onClick={() => navigate('/provider/facilities/new')} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-5 h-5 mr-2" />
            Add New Facility
          </Button>
        </div>

        {/* Quick Actions / Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-indigo-100" onClick={() => navigate('/provider/facilities')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Facilities</CardTitle>
              <Building className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">Manage your parking locations and slots</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-indigo-100" onClick={() => navigate('/provider/bookings')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookings</CardTitle>
              <Users className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">View and manage customer reservations</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-indigo-100" onClick={() => navigate('/provider/vehicle-checker')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vehicle Checker</CardTitle>
              <Search className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">Verify vehicles by number plate</div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-emerald-600" />
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                +12.5%
              </Badge>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">₹{todayRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Today's Revenue</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{activeBookings.length}</p>
            <p className="text-sm text-gray-600">Active Bookings</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <ParkingSquare className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{totalSlots}</p>
            <p className="text-sm text-gray-600">Total Slots</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{occupancyRate}%</p>
            <p className="text-sm text-gray-600">Occupancy Rate</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">Revenue Overview</h2>
              <Badge variant="outline">Last 7 Days</Badge>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  formatter={(value: number) => [`₹${value}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} dot={{ fill: '#4F46E5', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-black mb-6">Occupancy by Facility</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}%`, 'Occupancy']}
                />
                <Bar dataKey="occupancy" fill="#4F46E5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Facilities */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black">My Facilities</h2>
            <Button variant="outline" onClick={() => navigate('/provider/facilities')}>
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providerFacilities.slice(0, 3).map(facility => (
              <Card key={facility.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/provider/facility/${facility.id}`)}>
                <img src={facility.images[0]} alt={facility.name} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{facility.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{facility.city}</p>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="font-bold">{facility.totalSlots}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Available</p>
                      <p className="font-bold text-emerald-600">{facility.availableSlots}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Revenue</p>
                      <p className="font-bold text-indigo-600">₹{(Math.random() * 10000 + 5000).toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Recent Bookings */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-black mb-6">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-3 font-semibold">Booking ID</th>
                  <th className="pb-3 font-semibold">Facility</th>
                  <th className="pb-3 font-semibold">Vehicle</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {activeBookings.slice(0, 5).map(booking => {
                  const facility = facilities.find(f => f.id === booking.facilityId);
                  return (
                    <tr key={booking.id} className="border-b last:border-b-0">
                      <td className="py-3 text-sm font-mono">{booking.id}</td>
                      <td className="py-3 text-sm">{facility?.name}</td>
                      <td className="py-3 text-sm">{booking.vehicleNumber}</td>
                      <td className="py-3">
                        <Badge className="bg-emerald-500">Active</Badge>
                      </td>
                      <td className="py-3 text-sm font-semibold">₹{booking.amount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

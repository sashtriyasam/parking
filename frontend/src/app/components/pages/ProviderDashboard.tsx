import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Users, ParkingSquare, TrendingUp, Plus, ScanLine, ArrowUpRight, Clock, Car } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
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

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-500 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-black text-gray-900">{user?.name || 'Provider'}</h1>
          </div>
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700">
            {user?.name?.charAt(0) || 'P'}
          </div>
        </div>

        {/* Hero Revenue Card */}
        <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-0 shadow-xl mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
          <div className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-indigo-200 text-sm font-medium mb-1">Today's Revenue</p>
                <h2 className="text-4xl font-black">₹{todayRevenue.toLocaleString()}</h2>
              </div>
              <Badge className="bg-emerald-400/20 text-emerald-300 hover:bg-emerald-400/20 border-0 backdrop-blur-sm">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5% This Week
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-indigo-500/30">
              <div>
                <p className="text-indigo-200 text-xs mb-1">Active Vehicles</p>
                <p className="text-xl font-bold flex items-center">
                  {activeBookings.length}
                  <span className="text-xs font-normal text-indigo-300 ml-2">Currently Parked</span>
                </p>
              </div>
              <div>
                <p className="text-indigo-200 text-xs mb-1">Occupancy</p>
                <p className="text-xl font-bold flex items-center">
                  {occupancyRate}%
                  <span className="text-xs font-normal text-indigo-300 ml-2">Full</span>
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <h3 className="font-bold text-lg mb-4 text-gray-900">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <ActionCard
            icon={ScanLine}
            label="Scan QR"
            color="text-indigo-600"
            bg="bg-indigo-50"
            onClick={() => navigate('/provider/vehicle-checker')}
          />
          <ActionCard
            icon={Plus}
            label="New Facility"
            color="text-emerald-600"
            bg="bg-emerald-50"
            onClick={() => navigate('/provider/facilities')}
          />
          <ActionCard
            icon={ParkingSquare}
            label="Manage Slots"
            color="text-blue-600"
            bg="bg-blue-50"
            onClick={() => navigate('/provider/facilities')}
          />
          <ActionCard
            icon={Users}
            label="Bookings"
            color="text-purple-600"
            bg="bg-purple-50"
            onClick={() => navigate('/provider/bookings')}
          />
        </div>

        {/* Analytics Chart */}
        <Card className="p-6 mb-8 border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Weekly Performance</h3>
            <select className="bg-gray-50 border-0 text-xs rounded-lg p-2 font-medium text-gray-600 cursor-pointer outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#4F46E5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Live Activity Feed */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-900">Recent Activity</h3>
          <Button variant="link" className="text-indigo-600 text-sm p-0 h-auto" onClick={() => navigate('/provider/bookings')}>
            View All
          </Button>
        </div>

        <div className="space-y-4">
          {activeBookings.slice(0, 5).map(booking => {
            const facility = facilities.find(f => f.id === booking.facilityId);
            return (
              <Card key={booking.id} className="p-4 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <Car className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{booking.vehicleNumber}</p>
                      <p className="text-xs text-gray-500">{facility?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(booking.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
          {activeBookings.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-dashed">
              <p>No active bookings right now</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, label, color, bg, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95"
    >
      <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <span className="font-semibold text-sm text-gray-700">{label}</span>
    </button>
  )
}

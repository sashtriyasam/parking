import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Users, ParkingSquare, TrendingUp, Plus, ScanLine, ArrowUpRight, Clock, Car, Loader2, RotateCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useApp } from '@/context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export function ProviderDashboard() {
  const navigate = useNavigate();
  const { user, facilities, bookings, createOfflineBooking, isLoading, refreshData } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  // Modal form state
  const [manualData, setManualData] = useState({
    vehicleNumber: '',
    vehicleType: 'CAR',
    facilityId: '',
    slotId: ''
  });

  const providerFacilities = useMemo(() => {
    return facilities.filter(f => f.providerId === user?.id);
  }, [facilities, user]);

  const activeBookings = useMemo(() => {
    return bookings
      .filter(b => {
        const facility = facilities.find(f => f.id === b.facilityId);
        return facility?.providerId === user?.id && b.status === 'active';
      })
      .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
  }, [bookings, facilities, user]);

  const onlineActiveCount = useMemo(() => 
    activeBookings.filter(b => b.bookingType === 'ONLINE').length
  , [activeBookings]);

  const offlineActiveCount = useMemo(() => 
    activeBookings.filter(b => b.bookingType === 'OFFLINE').length
  , [activeBookings]);

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

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.vehicleNumber || !manualData.facilityId) {
      toast.error('Please fill vehicle number and facility');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createOfflineBooking({
        facility_id: manualData.facilityId,
        vehicle_number: manualData.vehicleNumber.toUpperCase(),
        vehicle_type: manualData.vehicleType,
        slot_id: manualData.slotId || undefined
      });
      toast.success('Manual Check-in Successful');
      setShowManualModal(false);
      setManualData({ vehicleNumber: '', vehicleType: 'CAR', facilityId: '', slotId: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Manual check-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-500 text-sm">Welcome back, Partner</p>
            <h1 className="text-2xl font-black text-gray-900">{user?.name || 'Provider'}</h1>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" className="hidden md:flex" onClick={() => navigate('/provider/facilities')}>
               Manage Slots
             </Button>
             <Button 
                variant="outline" 
                size="icon" 
                onClick={refreshData}
                disabled={isLoading}
                className="w-10 h-10 rounded-full"
              >
                <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
             </Button>
             <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700">
               {user?.name?.charAt(0) || 'P'}
             </div>
          </div>
        </div>

        {/* Primary Action Section [v1.9] */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <Card className="md:col-span-2 bg-indigo-600 text-white border-0 shadow-lg p-6 relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-black mb-2">ParkEasy Manual</h2>
                  <p className="text-indigo-100 text-sm mb-6 max-w-sm">Direct check-in for customers without the app. Instantly allot slots and track offline occupancy.</p>
                </div>
                <Button 
                  onClick={() => setShowManualModal(true)}
                  className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold w-full md:w-fit px-8"
                >
                  <Plus className="w-4 h-4 mr-2" /> Manual Check-in
                </Button>
              </div>
           </Card>

           <Card className="bg-white p-6 flex flex-col justify-between border-gray-100 shadow-md">
              <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Live Occupancy</p>
                    <h3 className="text-3xl font-black text-indigo-600">{occupancyRate}%</h3>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <ParkingSquare className="w-5 h-5 text-indigo-500" />
                  </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                   <div 
                      className="bg-indigo-500 h-full transition-all duration-1000 ease-out" 
                      style={{ width: `${occupancyRate}%` }} 
                   />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 font-medium">
                  {activeBookings.length} / {totalSlots} SLOTS OCCUPIED
                </p>
              </div>
           </Card>
        </div>

        {/* Segmented Stats [v1.9] */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <StatMiniCard label="App Bookings" value={onlineActiveCount} icon={Car} color="text-blue-600" bg="bg-blue-50" />
           <StatMiniCard label="Manual Entries" value={offlineActiveCount} icon={Users} color="text-orange-600" bg="bg-orange-50" />
           <StatMiniCard label="Total Parked" value={activeBookings.length} icon={ScanLine} color="text-emerald-600" bg="bg-emerald-50" />
           <StatMiniCard label="Today Earnings" value={`₹${todayRevenue}`} icon={IndianRupee} color="text-purple-600" bg="bg-purple-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Recent Activity - NOW AT TOP [v1.9] */}
           <div className="lg:col-span-1 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Recent Arrivals</h3>
                <Button variant="link" size="sm" onClick={() => navigate('/provider/bookings')} className="text-indigo-600 p-0 font-bold">
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {activeBookings.slice(0, 6).map(booking => {
                  const facility = facilities.find(f => f.id === booking.facilityId);
                  return (
                    <div key={booking.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center hover:border-indigo-200 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${booking.bookingType === 'OFFLINE' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                            <Car className={`w-4 h-4 ${booking.bookingType === 'OFFLINE' ? 'text-orange-500' : 'text-blue-500'}`} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-gray-900">{booking.vehicleNumber}</p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              {booking.bookingType === 'OFFLINE' ? 'MANUAL' : 'APP'} • {facility?.name.split(' ')[0]}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-indigo-600">
                           {new Date(booking.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                      </div>
                    </div>
                  );
                })}
                {activeBookings.length === 0 && (
                   <div className="py-12 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                      <Car className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-sm font-medium">Parking Area is Empty</p>
                   </div>
                )}
              </div>
           </div>

           {/* Analytics Chart */}
           <div className="lg:col-span-2">
              <Card className="p-6 border-gray-100 shadow-sm h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-gray-900 flex items-center uppercase tracking-tighter text-sm">
                    <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" />
                    Revenue Analytics
                  </h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { name: '01 May', revenue: 4500 },
                      { name: '02 May', revenue: 5200 },
                      { name: '03 May', revenue: 4800 },
                      { name: 'Today', revenue: todayRevenue }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
           </div>
        </div>

        {/* Manual Check-in Modal [v1.9] */}
        {showManualModal && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-md animate-in fade-in zoom-in duration-200">
                 <CardHeader className="border-b">
                    <div className="flex justify-between items-center">
                       <CardTitle>Manual Check-in</CardTitle>
                       <Button variant="ghost" size="sm" onClick={() => setShowManualModal(false)}>✕</Button>
                    </div>
                 </CardHeader>
                 <CardContent className="pt-6">
                    <form onSubmit={handleManualCheckIn} className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">Facility</label>
                          <select 
                            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={manualData.facilityId}
                            onChange={(e) => setManualData({...manualData, facilityId: e.target.value})}
                          >
                             <option value="">Select Facility</option>
                             {providerFacilities.map(f => (
                               <option key={f.id} value={f.id}>{f.name}</option>
                             ))}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">Vehicle Number</label>
                          <input 
                            placeholder="e.g. DL 10 AB 1234"
                            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={manualData.vehicleNumber}
                            onChange={(e) => setManualData({...manualData, vehicleNumber: e.target.value})}
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-gray-500 uppercase">Vehicle Type</label>
                             <select 
                                className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                                value={manualData.vehicleType}
                                onChange={(e) => setManualData({...manualData, vehicleType: e.target.value})}
                             >
                                <option value="CAR">Car</option>
                                <option value="BIKE">Bike</option>
                                <option value="SCOOTER">Scooter</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-gray-500 uppercase">Slot ID (Optional)</label>
                             <input 
                                placeholder="Auto"
                                className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                                value={manualData.slotId}
                                onChange={(e) => setManualData({...manualData, slotId: e.target.value})}
                             />
                          </div>
                       </div>
                       <Button type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 font-bold h-11" disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ScanLine className="w-4 h-4 mr-2" />}
                          Confirm Offline Entry
                       </Button>
                    </form>
                 </CardContent>
              </Card>
           </div>
        )}

      </div>
    </div>
  );
}

function StatMiniCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="p-4 border-gray-100 shadow-sm flex flex-col justify-center">
       <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
          <Icon className={`w-4 h-4 ${color}`} />
       </div>
       <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</p>
       <p className="text-xl font-black text-gray-900">{value}</p>
    </Card>
  )
}

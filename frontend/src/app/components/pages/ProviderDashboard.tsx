import React, { useMemo, useState, useEffect } from 'react';
import axios, { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Users, ParkingSquare, TrendingUp, Plus, ScanLine, Car, Loader2, RotateCw, ChevronRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useApp } from '@/context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import type { VehicleType } from '@/types';

export function ProviderDashboard() {
  const navigate = useNavigate();
  const { user, facilities, bookings, createOfflineBooking, isLoading, refreshData } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  useEffect(() => {
    if (!showManualModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowManualModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showManualModal]);

  const [manualData, setManualData] = useState<{
    vehicleNumber: string;
    vehicleType: VehicleType;
    facilityId: string;
    slotId: string;
    customerName: string;
    customerPhone: string;
  }>({
    vehicleNumber: '',
    vehicleType: 'CAR',
    facilityId: '',
    slotId: '',
    customerName: '',
    customerPhone: ''
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
        slot_id: manualData.slotId?.trim() || null,
        customer_name: manualData.customerName,
        customer_phone: manualData.customerPhone
      });
      toast.success('Manual Check-in Successful');
      setShowManualModal(false);
      setManualData({
        vehicleNumber: '',
        vehicleType: 'CAR',
        facilityId: '',
        slotId: '',
        customerName: '',
        customerPhone: ''
      });
    } catch (error: unknown) {
      let message = 'Manual check-in failed';
      if (isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-muted-foreground text-sm font-medium mb-0.5">Welcome back, Partner</p>
            <h1 className="text-3xl font-black text-foreground tracking-tight">{user?.name || 'Provider'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex h-9 px-4 text-sm font-semibold border-border rounded-md"
              onClick={() => navigate('/provider/facilities')}
            >
              Manage Slots
            </Button>
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors disabled:opacity-50"
              aria-label="Refresh data"
            >
              <RotateCw className={`w-4 h-4 text-foreground ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-white text-sm">
              {user?.name?.charAt(0) || 'P'}
            </div>
          </div>
        </div>

        {/* Hero CTA + Occupancy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            className="md:col-span-2 rounded-2xl p-6 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #007AFF 0%, #0055D4 100%)' }}
          >
            <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">ParkEasy Operator</p>
              <h2 className="text-2xl font-black text-white mb-1">Manual Check-in</h2>
              <p className="text-white/70 text-sm mb-5 max-w-xs">Instantly allot slots for walk-in customers and track offline occupancy.</p>
              <button
                onClick={() => setShowManualModal(true)}
                className="flex items-center gap-2 bg-white text-primary text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-white/90 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" /> Manual Check-in
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Live Occupancy</p>
                <p className="text-4xl font-black text-primary">{occupancyRate}<span className="text-xl">%</span></p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ParkingSquare className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${occupancyRate}%`, backgroundColor: occupancyRate > 80 ? '#FF3B30' : occupancyRate > 50 ? '#FF9F0A' : '#34C759' }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                {activeBookings.length} / {totalSlots} slots occupied
              </p>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="App Bookings" value={onlineActiveCount} icon={Car} accent="#007AFF" />
          <StatCard label="Walk-ins" value={offlineActiveCount} icon={Users} accent="#FF9F0A" />
          <StatCard label="Total Active" value={activeBookings.length} icon={ScanLine} accent="#34C759" />
          <StatCard label="Today's Revenue" value={`₹${todayRevenue}`} icon={IndianRupee} accent="#8E8E93" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent Arrivals */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Recent Arrivals</h3>
              <button
                onClick={() => navigate('/provider/bookings')}
                className="text-primary text-xs font-semibold flex items-center gap-1 hover:underline"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {activeBookings.slice(0, 6).map(booking => {
                const facility = facilities.find(f => f.id === booking.facilityId);
                const isOffline = booking.bookingType === 'OFFLINE';
                return (
                  <div key={booking.id} className="bg-card border border-border rounded-xl p-3 flex justify-between items-center hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: isOffline ? 'rgba(255,159,10,0.12)' : 'rgba(0,122,255,0.12)' }}
                      >
                        <Car className="w-4 h-4" style={{ color: isOffline ? '#FF9F0A' : '#007AFF' }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{booking.vehicleNumber}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {isOffline ? 'Walk-in' : 'App'} · {facility?.name?.split(' ')[0] || 'Facility'}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-primary">
                      {new Date(booking.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                );
              })}
              {activeBookings.length === 0 && (
                <div className="py-10 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground">
                  <Car className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium">Parking Area is Empty</p>
                </div>
              )}
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-2xl p-5 h-full">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Revenue Trend</h3>
                </div>
                <button
                  onClick={() => navigate('/provider/analytics')}
                  className="text-primary text-xs font-semibold flex items-center gap-1 hover:underline"
                >
                  Full Report <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { name: '01 May', revenue: 4500 },
                    { name: '02 May', revenue: 5200 },
                    { name: '03 May', revenue: 4800 },
                    { name: 'Today', revenue: todayRevenue }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 600 }} tickFormatter={v => `₹${v}`} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--foreground)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        fontSize: 12
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#007AFF"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#007AFF', strokeWidth: 0 }}
                      activeDot={{ r: 7, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Check-in Modal */}
        {showManualModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-modal-title"
            onClick={() => setShowManualModal(false)}
          >
            <div
              className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-border">
                <h2 id="manual-modal-title" className="font-bold text-foreground text-lg">Manual Check-in</h2>
                <button
                  onClick={() => setShowManualModal(false)}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-sm font-bold"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleManualCheckIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="manual-facility" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Facility</label>
                    <select
                      id="manual-facility"
                      className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                      value={manualData.facilityId}
                      onChange={e => setManualData({ ...manualData, facilityId: e.target.value })}
                    >
                      <option value="">Select Facility</option>
                      {providerFacilities.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="manual-vehicleNumber" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vehicle Number</label>
                    <input
                      id="manual-vehicleNumber"
                      placeholder="e.g. DL 10 AB 1234"
                      className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                      value={manualData.vehicleNumber}
                      onChange={e => setManualData({ ...manualData, vehicleNumber: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="manual-customerName" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer Name</label>
                      <input
                        id="manual-customerName"
                        placeholder="Optional"
                        className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                        value={manualData.customerName}
                        onChange={e => setManualData({ ...manualData, customerName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="manual-customerPhone" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</label>
                      <input
                        id="manual-customerPhone"
                        placeholder="Optional"
                        className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                        value={manualData.customerPhone}
                        onChange={e => setManualData({ ...manualData, customerPhone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="manual-vehicleType" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vehicle Type</label>
                      <select
                        id="manual-vehicleType"
                        className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                        value={manualData.vehicleType}
                        onChange={e => setManualData({ ...manualData, vehicleType: e.target.value as VehicleType })}
                      >
                        <option value="CAR">Car</option>
                        <option value="BIKE">Bike</option>
                        <option value="SCOOTER">Scooter</option>
                        <option value="TRUCK">Truck</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="manual-slotId" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Slot ID</label>
                      <input
                        id="manual-slotId"
                        placeholder="Auto"
                        className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                        value={manualData.slotId}
                        onChange={e => setManualData({ ...manualData, slotId: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      className="flex-1 h-11 flex items-center justify-center gap-2 border border-primary text-primary rounded-lg text-sm font-semibold hover:bg-primary/5 transition-colors"
                      onClick={() => { setShowManualModal(false); navigate('/provider/scan'); }}
                    >
                      <ScanLine className="w-4 h-4" /> Scan QR
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] h-11 flex items-center justify-center gap-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Confirm Entry
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}

function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
        style={{ backgroundColor: `${accent}18` }}
      >
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-black text-foreground">{value}</p>
    </div>
  );
}

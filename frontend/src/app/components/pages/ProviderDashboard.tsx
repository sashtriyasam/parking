import React, { useMemo, useState, useEffect } from 'react';
import axios, { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Users, ParkingSquare, TrendingUp, Plus, ScanLine, Car, Loader2, RotateCw, ChevronRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
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
    <div className="min-h-screen bg-background pt-20 pb-24 text-foreground font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-0.5">Welcome back, Partner</p>
            <h1 className="text-3xl font-black text-foreground tracking-tight font-display">{user?.name || 'Provider'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex h-9 px-4 text-xs font-semibold rounded-md"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div
            className="md:col-span-2 rounded-lg p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px]"
            style={{ background: 'linear-gradient(135deg, #007AFF 0%, #0055D4 100%)' }}
          >
            <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">ParkEasy Operator</p>
              <h2 className="text-2xl font-black text-white mb-1 font-display">Manual Check-in</h2>
              <p className="text-white/80 text-sm mb-4 max-w-sm">Instantly allot slots for walk-in customers and track offline occupancy.</p>
            </div>
            <div className="relative z-10">
              <Button
                onClick={() => setShowManualModal(true)}
                className="bg-white text-primary text-xs font-bold h-9 px-4 rounded-md hover:bg-white/95 active:scale-95 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Manual Check-in
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-card border border-border p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Live Occupancy</p>
                <p className="text-4xl font-black text-primary font-display">{occupancyRate}<span className="text-xl">%</span></p>
              </div>
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                <ParkingSquare className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${occupancyRate}%`, backgroundColor: occupancyRate > 80 ? 'var(--destructive)' : occupancyRate > 50 ? '#FF9F0A' : '#34C759' }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                {activeBookings.length} / {totalSlots} slots occupied
              </p>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="App Bookings" value={onlineActiveCount} icon={Car} accent="#007AFF" />
          <StatCard label="Walk-ins" value={offlineActiveCount} icon={Users} accent="#FF9F0A" />
          <StatCard label="Total Active" value={activeBookings.length} icon={ScanLine} accent="#34C759" />
          <StatCard label="Today's Revenue" value={`₹${todayRevenue}`} icon={IndianRupee} accent="#8E8E93" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Arrivals */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">Recent Arrivals</h3>
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
                  <div key={booking.id} className="bg-card border border-border rounded-lg p-3 flex justify-between items-center hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center"
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
                <div className="py-10 border border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-card/50">
                  <Car className="w-8 h-8 mb-2 opacity-30 text-foreground" />
                  <p className="text-xs font-medium">Parking Area is Empty</p>
                </div>
              )}
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-5 h-full flex flex-col justify-between">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">Revenue Trend</h3>
                </div>
                <button
                  onClick={() => navigate('/provider/analytics')}
                  className="text-primary text-xs font-semibold flex items-center gap-1 hover:underline"
                >
                  Full Report <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="h-[220px] w-full">
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
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--foreground)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        fontSize: 11
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-modal-title"
            onClick={() => setShowManualModal(false)}
          >
            <div
              className="w-full max-w-md bg-card rounded-lg border border-border shadow-2xl overflow-hidden animate-scale-up"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-card">
                <h2 id="manual-modal-title" className="font-bold text-foreground text-base font-display">Manual Check-in</h2>
                <button
                  onClick={() => setShowManualModal(false)}
                  className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-xs font-bold"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleManualCheckIn} className="space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="manual-facility" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Facility</label>
                    <select
                      id="manual-facility"
                      className="w-full h-9 px-3 bg-input-background border border-input rounded-md text-sm text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                      value={manualData.facilityId}
                      onChange={e => setManualData({ ...manualData, facilityId: e.target.value })}
                    >
                      <option value="">Select Facility</option>
                      {providerFacilities.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="manual-vehicleNumber" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vehicle Number</label>
                    <Input
                      id="manual-vehicleNumber"
                      placeholder="e.g. DL 10 AB 1234"
                      value={manualData.vehicleNumber}
                      onChange={e => setManualData({ ...manualData, vehicleNumber: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="manual-customerName" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer Name</label>
                      <Input
                        id="manual-customerName"
                        placeholder="Optional"
                        value={manualData.customerName}
                        onChange={e => setManualData({ ...manualData, customerName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="manual-customerPhone" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone</label>
                      <Input
                        id="manual-customerPhone"
                        placeholder="Optional"
                        value={manualData.customerPhone}
                        onChange={e => setManualData({ ...manualData, customerPhone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="manual-vehicleType" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vehicle Type</label>
                      <select
                        id="manual-vehicleType"
                        className="w-full h-9 px-3 bg-input-background border border-input rounded-md text-sm text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                        value={manualData.vehicleType}
                        onChange={e => setManualData({ ...manualData, vehicleType: e.target.value as VehicleType })}
                      >
                        <option value="CAR">Car</option>
                        <option value="BIKE">Bike</option>
                        <option value="SCOOTER">Scooter</option>
                        <option value="TRUCK">Truck</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="manual-slotId" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Slot ID</label>
                      <Input
                        id="manual-slotId"
                        placeholder="Auto"
                        value={manualData.slotId}
                        onChange={e => setManualData({ ...manualData, slotId: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-9 rounded-md text-xs font-semibold"
                      onClick={() => { setShowManualModal(false); navigate('/provider/scan'); }}
                    >
                      <ScanLine className="w-4 h-4 mr-1.5" /> Scan QR
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] h-9 rounded-md text-xs font-bold"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                      Confirm Entry
                    </Button>
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
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col justify-between">
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center mb-3"
        style={{ backgroundColor: `${accent}18` }}
      >
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xl font-black text-foreground font-display">{value}</p>
      </div>
    </div>
  );
}


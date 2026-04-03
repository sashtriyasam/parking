import { useState, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Car, Bike, Truck, CreditCard, Smartphone, Clock, Check, ChevronLeft, Navigation, MapPin, CalendarClock, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card } from '@/app/components/ui/card';
import { Separator } from '@/app/components/ui/separator';
import { useApp } from '@/context/AppContext';
import type { VehicleType, PaymentMethod } from '@/types';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';

// Helper: round time to nearest 15 minutes
function roundToNext15(date: Date): Date {
  const ms = 15 * 60 * 1000;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

// Helper: format date for datetime-local input
function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Helper: format time for display
function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Helper: format date for display
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

// Helper: open Google Maps navigation
function openGoogleMapsNavigation(lat: number, lng: number) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  window.open(url, '_blank');
}

export function BookingVehicle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { getFacilityById, createBooking, user } = useApp();

  const facility = getFacilityById(id!);
  const { slotId } = location.state || {};

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  // Time-based booking state
  const now = roundToNext15(new Date());
  const defaultEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const [startTime, setStartTime] = useState(toDateTimeLocal(now));
  const [endTime, setEndTime] = useState(toDateTimeLocal(defaultEnd));

  // Calculate duration and price from time window
  const { durationHours, durationDisplay, totalAmount, isValidTime } = useMemo(() => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const hours = diffMs / (1000 * 60 * 60);

    const valid = hours >= 0.5 && hours <= 24 && end > start;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    const pricePerHour = 60; // Default, should come from facility pricing
    const amount = Math.round(pricePerHour * hours);

    return {
      durationHours: hours,
      durationDisplay: valid ? `${h}h ${m}m` : 'Invalid',
      totalAmount: valid ? amount : 0,
      isValidTime: valid,
    };
  }, [startTime, endTime]);

  const handleConfirmBooking = async () => {
    if (!vehicleNumber) {
      toast.error('Please enter your vehicle number');
      document.getElementById('vehicle-input')?.focus();
      return;
    }

    if (!isValidTime) {
      toast.error('Please select a valid time window (min 30 min, max 24 hours)');
      return;
    }

    setIsProcessing(true);

    try {
      const booking = await createBooking({
        customerId: user!.id,
        facilityId: id!,
        slotId: slotId || '',
        vehicleNumber: vehicleNumber.toUpperCase(),
        vehicleType,
        entryTime: new Date(startTime).toISOString(),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        exitTime: new Date(endTime).toISOString(),
        duration: Math.round(durationHours * 100) / 100,
        amount: totalAmount,
        paymentMethod,
        status: 'active',
        qrCode: '',
      });

      toast.success('Booking Successful!');
      navigate('/customer/booking/success', {
        state: {
          booking,
          facilityLat: facility?.latitude,
          facilityLng: facility?.longitude,
        }
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Booking failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 pt-16">
      {/* Header */}
      <div className="bg-white px-4 py-4 fixed top-0 left-0 right-0 z-10 border-b flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold">Confirm Booking</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-6">

        {/* Facility Summary */}
        <Card className="p-4 flex gap-4 items-center">
          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
            <img src={facility?.images?.[0] || facility?.image_url || '/placeholder-parking.jpg'} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">{facility?.name}</h3>
            <p className="text-sm text-gray-500">{facility?.address}</p>
          </div>
          {facility?.latitude && facility?.longitude && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              onClick={() => openGoogleMapsNavigation(facility.latitude, facility.longitude)}
            >
              <Navigation className="w-4 h-4 mr-1" />
              Directions
            </Button>
          )}
        </Card>

        {/* Vehicle Details */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Vehicle Details</h3>
          <Card className="p-4 space-y-4">
            <div>
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Vehicle Number</Label>
              <Input
                id="vehicle-input"
                placeholder="Ex: MH 02 AB 1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="mt-1 h-12 text-lg font-bold uppercase placeholder:font-normal placeholder:capitalize"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Vehicle Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {(['bike', 'scooter', 'car', 'truck'] as VehicleType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setVehicleType(type)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${vehicleType === type
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {type === 'bike' && <Bike className="w-6 h-6 mb-1" />}
                    {type === 'scooter' && <Bike className="w-6 h-6 mb-1" />}
                    {type === 'car' && <Car className="w-6 h-6 mb-1" />}
                    {type === 'truck' && <Truck className="w-6 h-6 mb-1" />}
                    <span className="text-[10px] font-bold uppercase">{type}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Time-Based Booking */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-indigo-600" />
            Booking Time
          </h3>
          <Card className="p-6 space-y-5">
            {/* Start Time */}
            <div>
              <Label className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-2 block">
                Start Time
              </Label>
              <Input
                id="start-time-input"
                type="datetime-local"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  // Auto-adjust end time to maintain at least 1h gap
                  const newStart = new Date(e.target.value);
                  const currentEnd = new Date(endTime);
                  if (currentEnd <= newStart) {
                    setEndTime(toDateTimeLocal(new Date(newStart.getTime() + 2 * 60 * 60 * 1000)));
                  }
                }}
                min={toDateTimeLocal(new Date())}
                className="h-12 text-base font-semibold"
              />
            </div>

            {/* Arrow separator */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full">
                <ArrowRight className="w-4 h-4 text-indigo-600" />
                <span className={`text-sm font-black ${isValidTime ? 'text-indigo-700' : 'text-red-500'}`}>
                  {durationDisplay}
                </span>
              </div>
            </div>

            {/* End Time */}
            <div>
              <Label className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-2 block">
                End Time
              </Label>
              <Input
                id="end-time-input"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                min={startTime}
                className="h-12 text-base font-semibold"
              />
            </div>

            {/* Time validation message */}
            {!isValidTime && startTime && endTime && (
              <p className="text-sm text-red-500 font-medium text-center">
                ⚠ Please select a valid time window (min 30 min, max 24 hours)
              </p>
            )}

            {/* Summary */}
            {isValidTime && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Duration</p>
                  <p className="text-xl font-black text-indigo-700">{durationDisplay}</p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-bold">Estimated Cost</p>
                  <p className="text-2xl font-black text-gray-900">₹{totalAmount}</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Payment Method */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Payment Method</h3>
          <div className="space-y-2">
            <PaymentOption
              id="upi"
              title="UPI"
              icon={Smartphone}
              selected={paymentMethod}
              onSelect={() => setPaymentMethod('upi')}
            />
            <PaymentOption
              id="card"
              title="Credit/Debit Card"
              icon={CreditCard}
              selected={paymentMethod}
              onSelect={() => setPaymentMethod('card')}
            />
            <PaymentOption
              id="pay-at-exit"
              title="Pay at Location"
              icon={Clock}
              selected={paymentMethod}
              onSelect={() => setPaymentMethod('pay-at-exit')}
            />
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-20 pb-safe">
        <div className="max-w-2xl mx-auto flex gap-4 items-center">
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-bold uppercase">Total to pay</p>
            <p className="text-2xl font-black">₹{totalAmount}</p>
          </div>
          <Button
            onClick={handleConfirmBooking}
            disabled={isProcessing || !isValidTime}
            className="h-14 px-8 rounded-xl text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 min-w-[200px] disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Pay & Book'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaymentOption({ id, title, icon: Icon, selected, onSelect }: any) {
  const isSelected = selected === id;
  return (
    <div
      onClick={onSelect}
      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 bg-white hover:border-gray-200'
        }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>{title}</span>
      {isSelected && <Check className="w-5 h-5 text-indigo-600 ml-auto" />}
    </div>
  );
}

// Keeping this as a placeholder or alias if needed
export function BookingPayment() {
  return null;
}

export function BookingSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking, facilityLat, facilityLng } = location.state || {};
  const { getFacilityById } = useApp();

  const facility = getFacilityById(booking?.facility_id || booking?.facilityId);
  const lat = facilityLat || facility?.latitude;
  const lng = facilityLng || facility?.longitude;

  if (!booking) {
    navigate('/customer/search');
    return null;
  }

  const entryTime = booking.entry_time || booking.entryTime || booking.startTime;
  const exitTime = booking.exit_time || booking.exitTime || booking.endTime;

  return (
    <div className="min-h-screen bg-gray-50 pt-16 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden shadow-xl rounded-3xl relative">
        <div className="bg-emerald-500 p-6 text-center text-white pb-12">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black">Booking Confirmed!</h1>
          <p className="text-emerald-50">Your space is reserved</p>
        </div>

        <div className="px-6 -mt-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-center py-4">
              {(booking.qr_code || booking.qrCode) && (booking.qr_code || booking.qrCode).startsWith('data:') ? (
                <img src={booking.qr_code || booking.qrCode} alt="QR Code" width={150} height={150} className="rounded-lg" />
              ) : (
                <QRCode value={booking.qr_code || booking.qrCode || booking.id || 'PARKEASY'} size={150} />
              )}
            </div>
            <div className="text-center border-t border-dashed border-gray-200 pt-4 mt-2">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Pass Code</p>
              <p className="text-xl font-mono font-black text-gray-800 tracking-wider">#{booking.id.slice(-6).toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Location</span>
              <span className="font-bold text-gray-900">{facility?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Vehicle</span>
              <span className="font-bold text-gray-900">{booking.vehicle_number || booking.vehicleNumber}</span>
            </div>
            {/* Time Window Display */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Time Window</span>
              <span className="font-bold text-gray-900">
                {entryTime ? formatTime(entryTime) : '--'}
                {' → '}
                {exitTime ? formatTime(exitTime) : '--'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-bold text-gray-900">
                {entryTime ? formatDate(entryTime) : '--'}
              </span>
            </div>
            {booking.duration && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-bold text-gray-900">{booking.duration}h</span>
              </div>
            )}
          </div>

          {/* Navigate to Parking Button */}
          {lat && lng && (
            <Button
              className="w-full h-14 rounded-xl text-md font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              onClick={() => openGoogleMapsNavigation(Number(lat), Number(lng))}
            >
              <Navigation className="w-5 h-5" />
              Navigate to Parking
            </Button>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/customer/search')}>
              Home
            </Button>
            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate('/customer/tickets')}>
              My Ticket
            </Button>
          </div>
        </div>

        {/* Decorative Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-600/20" />
      </Card>

      <p className="text-xs text-gray-400 mt-6 text-center max-w-xs">
        Show this QR code at the entrance scanner to access your parking spot.
      </p>
    </div>
  );
}

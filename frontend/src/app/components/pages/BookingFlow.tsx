import { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Car, Bike, Truck, CreditCard, Smartphone, Clock, Check } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card } from '@/app/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Separator } from '@/app/components/ui/separator';
import { useApp } from '@/context/AppContext';
import type { VehicleType, PaymentMethod } from '@/types';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';

export function BookingVehicle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { getFacilityById, user } = useApp();

  const facility = getFacilityById(id!);
  const { slotId } = location.state || {};

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [duration, setDuration] = useState(3);

  const pricePerHour = 60;
  const totalAmount = pricePerHour * duration;

  const handleContinue = () => {
    if (!vehicleNumber) {
      toast.error('Please enter vehicle number');
      return;
    }

    navigate(`/customer/booking/${id}/payment`, {
      state: {
        slotId,
        facilityId: id,
        vehicleNumber,
        vehicleType,
        duration,
        amount: totalAmount,
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <span className="ml-2 font-semibold">Vehicle Details</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="flex items-center opacity-50">
              <div className="w-10 h-10 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold">2</div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="flex items-center opacity-50">
              <div className="w-10 h-10 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold">3</div>
              <span className="ml-2 font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        <Card className="p-8">
          <h2 className="text-2xl font-black mb-6">Vehicle Details</h2>

          <div className="space-y-6">
            <div>
              <Label htmlFor="vehicleNumber">Vehicle Number</Label>
              <Input
                id="vehicleNumber"
                placeholder="MH 01 AB 1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                className="mt-1 uppercase"
              />
            </div>

            <div>
              <Label>Vehicle Type</Label>
              <RadioGroup value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)} className="grid grid-cols-4 gap-4 mt-2">
                <div>
                  <RadioGroupItem value="bike" id="bike-type" className="peer sr-only" />
                  <Label htmlFor="bike-type" className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-300 bg-white p-4 hover:bg-gray-50 peer-checked:border-indigo-600 cursor-pointer">
                    <Bike className="w-6 h-6 mb-1" />
                    <span className="text-sm font-medium">Bike</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="scooter" id="scooter-type" className="peer sr-only" />
                  <Label htmlFor="scooter-type" className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-300 bg-white p-4 hover:bg-gray-50 peer-checked:border-indigo-600 cursor-pointer">
                    <Bike className="w-6 h-6 mb-1" />
                    <span className="text-sm font-medium">Scooter</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="car" id="car-type" className="peer sr-only" />
                  <Label htmlFor="car-type" className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-300 bg-white p-4 hover:bg-gray-50 peer-checked:border-indigo-600 cursor-pointer">
                    <Car className="w-6 h-6 mb-1" />
                    <span className="text-sm font-medium">Car</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="truck" id="truck-type" className="peer sr-only" />
                  <Label htmlFor="truck-type" className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-300 bg-white p-4 hover:bg-gray-50 peer-checked:border-indigo-600 cursor-pointer">
                    <Truck className="w-6 h-6 mb-1" />
                    <span className="text-sm font-medium">Truck</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="duration">Duration (hours)</Label>
              <div className="flex items-center space-x-4 mt-2">
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="24"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                  className="w-24"
                />
                <span className="text-gray-600">hours</span>
              </div>
            </div>

            <Separator />

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Base Fee ({duration} hours)</span>
                <span className="font-semibold">₹{pricePerHour * duration}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-indigo-600">₹{totalAmount}</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleContinue} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                Continue to Payment
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function BookingPayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { createBooking, user } = useApp();

  const bookingData = location.state || {};
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'upi' && !upiId) {
      toast.error('Please enter UPI ID');
      return;
    }

    setLoading(true);

    try {
      const booking = createBooking({
        customerId: user!.id,
        facilityId: bookingData.facilityId,
        slotId: bookingData.slotId,
        vehicleNumber: bookingData.vehicleNumber,
        vehicleType: bookingData.vehicleType,
        entryTime: new Date().toISOString(),
        duration: bookingData.duration,
        amount: bookingData.amount,
        paymentMethod,
        status: 'active',
        qrCode: `QR-${Date.now()}`,
      });

      toast.success('Booking confirmed!');
      navigate('/customer/booking/success', { state: { booking } });
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="flex items-center opacity-50">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center"><Check className="w-5 h-5" /></div>
              <span className="ml-2 font-medium">Vehicle Details</span>
            </div>
            <div className="w-16 h-1 bg-indigo-600"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <span className="ml-2 font-semibold">Payment</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="flex items-center opacity-50">
              <div className="w-10 h-10 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold">3</div>
              <span className="ml-2 font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-8">
              <h2 className="text-2xl font-black mb-6">Payment Method</h2>

              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="space-y-4">
                <Card className={`p-4 cursor-pointer ${paymentMethod === 'upi' ? 'border-2 border-indigo-600 bg-indigo-50' : ''}`}>
                  <RadioGroupItem value="upi" id="upi" className="sr-only" />
                  <Label htmlFor="upi" className="flex items-start space-x-4 cursor-pointer">
                    <Smartphone className="w-6 h-6 text-indigo-600 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold mb-1">UPI Payment</p>
                      {paymentMethod === 'upi' && (
                        <Input
                          placeholder="Enter UPI ID"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="mt-2"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </Label>
                </Card>

                <Card className={`p-4 cursor-pointer ${paymentMethod === 'card' ? 'border-2 border-indigo-600 bg-indigo-50' : ''}`}>
                  <RadioGroupItem value="card" id="card" className="sr-only" />
                  <Label htmlFor="card" className="flex items-start space-x-4 cursor-pointer">
                    <CreditCard className="w-6 h-6 text-indigo-600 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">Credit/Debit Card</p>
                      <p className="text-sm text-gray-600">Pay securely with your card</p>
                    </div>
                  </Label>
                </Card>

                <Card className={`p-4 cursor-pointer ${paymentMethod === 'pay-at-exit' ? 'border-2 border-indigo-600 bg-indigo-50' : ''}`}>
                  <RadioGroupItem value="pay-at-exit" id="pay-at-exit" className="sr-only" />
                  <Label htmlFor="pay-at-exit" className="flex items-start space-x-4 cursor-pointer">
                    <Clock className="w-6 h-6 text-indigo-600 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">Pay at Exit</p>
                      <p className="text-sm text-gray-600">Pay when you leave</p>
                    </div>
                  </Label>
                </Card>
              </RadioGroup>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="font-bold mb-4">Booking Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle</span>
                  <span className="font-semibold">{bookingData.vehicleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">{bookingData.duration} hours</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-indigo-600">₹{bookingData.amount}</span>
                </div>
              </div>

              <Button
                onClick={handleConfirmPayment}
                disabled={loading}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 h-12 font-semibold"
              >
                {loading ? 'Processing...' : 'Confirm & Pay'}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BookingSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking } = location.state || {};
  const { getFacilityById } = useApp();

  const facility = getFacilityById(booking?.facilityId);

  if (!booking) {
    navigate('/customer/search');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-gray-600">Your parking spot is reserved</p>
        </div>

        <Card className="p-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-lg border-2">
              <QRCode value={booking.qrCode} size={200} />
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-1">Booking Reference</p>
            <p className="text-2xl font-black text-indigo-600">{booking.id}</p>
          </div>

          <Separator className="my-6" />

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Facility</span>
              <span className="font-semibold text-right">{facility?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vehicle</span>
              <span className="font-semibold">{booking.vehicleNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration</span>
              <span className="font-semibold">{booking.duration} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-semibold text-emerald-600">₹{booking.amount}</span>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate('/customer/tickets')}>
              View My Tickets
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/customer/search')}>
              Book Another Parking
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

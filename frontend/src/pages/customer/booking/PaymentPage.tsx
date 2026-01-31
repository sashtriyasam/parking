import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Tag } from 'lucide-react';
import { useBookingFlowStore } from '../../../store/bookingFlowStore';
import { customerService } from '../../../services/customer.service';
import BookingProgressBar from '../../../components/customer/booking/BookingProgressBar';
import PaymentMethodSelector from '../../../components/customer/booking/PaymentMethodSelector';
import CardPaymentForm from '../../../components/customer/booking/CardPaymentForm';
import UPIPaymentForm from '../../../components/customer/booking/UPIPaymentForm';
import type { PaymentMethod } from '../../../store/bookingFlowStore';

export default function PaymentPage() {
    const navigate = useNavigate();
    const { facilityId } = useParams<{ facilityId: string }>();
    const {
        currentStep,
        bookingDetails,
        vehicleDetails,
        setStep,
        setPaymentMethod,
        setPaymentStatus,
        setTicketId,
        paymentMethod: selectedPaymentMethod,
    } = useBookingFlowStore();

    const [paymentMethod, setLocalPaymentMethod] = useState<PaymentMethod | null>(
        selectedPaymentMethod
    );
    const [promoCode, setPromoCode] = useState('');
    const [promoApplied, setPromoApplied] = useState(false);

    useEffect(() => {
        if (currentStep !== 3) {
            setStep(3);
        }

        if (!bookingDetails || !vehicleDetails) {
            navigate(`/customer/booking/${facilityId}/review`);
        }
    }, [currentStep, bookingDetails, vehicleDetails, facilityId, setStep, navigate]);

    // Booking mutation
    const bookingMutation = useMutation({
        mutationFn: async (paymentData: any) => {
            setPaymentStatus('processing');

            // Create booking
            const ticket = await customerService.confirmBooking({
                slot_id: bookingDetails!.slot.id,
                vehicle_type: vehicleDetails!.vehicle_type,
                vehicle_number: vehicleDetails!.vehicle_number,
                entry_time: bookingDetails!.entry_time,
                duration: bookingDetails!.duration,
                payment_method: paymentMethod!,
                payment_details: paymentData,
            });

            return ticket;
        },
        onSuccess: (ticket) => {
            setPaymentStatus('success');
            setTicketId(ticket.id);
            navigate(`/customer/booking/${ticket.id}/success`);
        },
        onError: (error) => {
            setPaymentStatus('failed');
            console.error('Payment failed:', error);
            alert('Payment failed. Please try again.');
        },
    });

    if (!bookingDetails || !vehicleDetails) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const handlePaymentMethodSelect = (method: PaymentMethod) => {
        setLocalPaymentMethod(method);
        setPaymentMethod(method);
    };

    const handleCardPayment = (cardDetails: any) => {
        bookingMutation.mutate({ type: 'CARD', ...cardDetails });
    };

    const handleUPIPayment = (upiId: string) => {
        bookingMutation.mutate({ type: 'UPI', upiId });
    };

    const handlePayAtExit = () => {
        bookingMutation.mutate({ type: 'PAY_AT_EXIT' });
    };

    const handleBack = () => {
        navigate(`/customer/booking/${facilityId}/review`);
    };

    const discount = promoApplied ? bookingDetails.total_fee * 0.1 : 0;
    const finalAmount = bookingDetails.total_fee - discount;

    return (
        <div className="min-h-screen bg-gray-50">
            <BookingProgressBar currentStep={3} />

            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Review
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Payment</h1>
                    <p className="text-gray-600">Choose your preferred payment method</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Payment Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Payment Method Selection */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <PaymentMethodSelector
                                selectedMethod={paymentMethod}
                                onSelectMethod={handlePaymentMethodSelect}
                            />
                        </div>

                        {/* Payment Form Based on Method */}
                        {paymentMethod && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                {paymentMethod === 'CARD' && (
                                    <CardPaymentForm
                                        onSubmit={handleCardPayment}
                                        isLoading={bookingMutation.isPending}
                                    />
                                )}

                                {paymentMethod === 'UPI' && (
                                    <UPIPaymentForm
                                        onSubmit={handleUPIPayment}
                                        isLoading={bookingMutation.isPending}
                                    />
                                )}

                                {paymentMethod === 'WALLET' && (
                                    <div className="text-center py-8">
                                        <p className="text-gray-600 mb-4">
                                            Wallet integration coming soon
                                        </p>
                                        <button
                                            onClick={() => handleUPIPayment('demo@wallet')}
                                            disabled={bookingMutation.isPending}
                                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
                                        >
                                            Continue with Demo Payment
                                        </button>
                                    </div>
                                )}

                                {paymentMethod === 'PAY_AT_EXIT' && (
                                    <div className="text-center py-8 space-y-4">
                                        <p className="text-gray-700 font-medium">
                                            You can pay at the facility exit
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Your slot will be reserved. Please pay the full amount at the exit gate.
                                        </p>
                                        <button
                                            onClick={handlePayAtExit}
                                            disabled={bookingMutation.isPending}
                                            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-400 transition-all"
                                        >
                                            {bookingMutation.isPending ? 'Confirming...' : 'Confirm Booking'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Payment Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24 space-y-6">
                            <h4 className="font-bold text-gray-900">Payment Summary</h4>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Base Fee</span>
                                    <span className="font-medium">₹{bookingDetails.base_fee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">GST (18%)</span>
                                    <span className="font-medium">₹{bookingDetails.gst.toFixed(2)}</span>
                                </div>
                                {promoApplied && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Promo Discount</span>
                                        <span className="font-medium">-₹{discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-gray-200 flex justify-between">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="font-black text-xl text-indigo-600">
                                        ₹{finalAmount.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Promo Code */}
                            <div className="pt-4 border-t border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Promo Code
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                            placeholder="SAVE10"
                                            disabled={promoApplied}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase disabled:bg-gray-100"
                                        />
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (promoCode === 'SAVE10') {
                                                setPromoApplied(true);
                                            } else {
                                                alert('Invalid promo code');
                                            }
                                        }}
                                        disabled={promoApplied || !promoCode}
                                        className="px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 text-sm"
                                    >
                                        {promoApplied ? 'Applied' : 'Apply'}
                                    </button>
                                </div>
                                {promoApplied && (
                                    <p className="mt-2 text-xs text-green-600">
                                        ✓ 10% discount applied!
                                    </p>
                                )}
                            </div>

                            {/* Booking Details */}
                            <div className="pt-4 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                                <p><strong>Facility:</strong> {bookingDetails.facility.name}</p>
                                <p><strong>Slot:</strong> {bookingDetails.slot.slot_number}</p>
                                <p><strong>Vehicle:</strong> {vehicleDetails.vehicle_number}</p>
                                <p><strong>Duration:</strong> {bookingDetails.duration}h</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ChevronLeft, HelpCircle } from 'lucide-react';
import { useBookingFlowStore, type PaymentMethod } from '../../../store/bookingFlowStore';
import { customerService } from '../../../services/customer.service';
import { BookingProgressIndicator } from '../../../components/customer/booking/BookingProgressIndicator';
import { PaymentForm } from '../../../components/customer/booking/PaymentForm';

export default function PaymentPage() {
    const { facilityId } = useParams<{ facilityId: string }>();
    const navigate = useNavigate();
    const {
        slotId,
        vehicleDetails,
        bookingDetails,
        setStep,
        setPaymentStatus,
        setTicketId
    } = useBookingFlowStore();

    // Ensure state consistency
    useEffect(() => {
        if (!facilityId || !slotId || !vehicleDetails || !bookingDetails) {
            navigate(`/customer/facility/${facilityId || ''}`);
        }
        setStep(3);
    }, [facilityId, slotId, vehicleDetails, bookingDetails, navigate, setStep]);

    // Mutation for confirming booking
    const confirmBookingMutation = useMutation({
        mutationFn: (paymentData: { method: PaymentMethod; details: any }) => {
            const request = {
                slot_id: slotId!,
                vehicle_type: vehicleDetails!.vehicle_type,
                vehicle_number: vehicleDetails!.vehicle_number,
                entry_time: bookingDetails!.entry_time,
                duration: bookingDetails!.duration,
                payment_method: paymentData.method,
                payment_details: paymentData.details,
            };
            return customerService.confirmBooking(request);
        },
        onSuccess: (ticket) => {
            setPaymentStatus('success');
            setTicketId(ticket.id);
            navigate(`/customer/booking/${ticket.id}/success`);
        },
        onError: (error) => {
            console.error('Booking failed:', error);
            setPaymentStatus('failed');
            alert('Reservation failed. The slot might have been taken or payment was rejected.');
        }
    });

    const handlePaymentSuccess = (method: PaymentMethod, details: any) => {
        setPaymentStatus('processing');
        confirmBookingMutation.mutate({ method, details });
    };

    if (!bookingDetails || !vehicleDetails) return null;

    return (
        <div className="min-h-screen bg-[#fafafa]">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-gray-50 rounded-2xl text-gray-500 hover:text-indigo-600 transition-all"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-1">Secure Checkout</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Final Step to Secure Spot</p>
                    </div>
                    <button className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                        <HelpCircle size={24} />
                    </button>
                </div>
                <BookingProgressIndicator currentStep={3} />
            </header>

            <main className="max-w-2xl mx-auto px-6 pt-12 pb-24">
                <PaymentForm
                    totalAmount={bookingDetails.total_fee}
                    onPaymentSuccess={handlePaymentSuccess}
                    isLoading={confirmBookingMutation.isPending}
                />
            </main>
        </div>
    );
}

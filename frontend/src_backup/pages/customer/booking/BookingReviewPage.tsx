import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Info } from 'lucide-react';
import { useBookingFlowStore } from '../../../store/bookingFlowStore';
import { BookingProgressIndicator } from '../../../components/customer/booking/BookingProgressIndicator';
import { BookingReview } from '../../../components/customer/booking/BookingReview';

export default function BookingReviewPage() {
    const { facilityId } = useParams<{ facilityId: string }>();
    const navigate = useNavigate();
    const {
        facilityId: storeFacilityId,
        slotId,
        vehicleDetails,
        bookingDetails,
        setStep
    } = useBookingFlowStore();

    // Ensure state consistency
    useEffect(() => {
        if (!facilityId || facilityId !== storeFacilityId || !slotId || !vehicleDetails || !bookingDetails) {
            navigate(`/customer/facility/${facilityId || ''}`);
        }
        setStep(2);
    }, [facilityId, storeFacilityId, slotId, vehicleDetails, bookingDetails, navigate, setStep]);

    const handleProceed = () => {
        navigate(`/customer/booking/${facilityId}/payment`);
    };

    const handleBack = () => {
        navigate(`/customer/booking/${facilityId}/vehicle`);
    };

    if (!bookingDetails || !vehicleDetails) return null;

    return (
        <div className="min-h-screen bg-[#fafafa]">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="p-3 bg-gray-50 rounded-2xl text-gray-500 hover:text-indigo-600 transition-all"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-1">Review Reservation</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{bookingDetails.facility.name}</p>
                    </div>
                    <button className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                        <Info size={24} />
                    </button>
                </div>
                <BookingProgressIndicator currentStep={2} />
            </header>

            <main className="max-w-3xl mx-auto px-6 pt-12 pb-24">
                <BookingReview
                    booking={bookingDetails}
                    vehicle={vehicleDetails}
                    onProceed={handleProceed}
                    onBack={handleBack}
                />
            </main>
        </div>
    );
}

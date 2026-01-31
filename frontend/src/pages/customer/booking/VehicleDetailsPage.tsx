import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useBookingFlowStore } from '../../../store/bookingFlowStore';
import { useSearchStore } from '../../../store/searchStore';
import BookingProgressBar from '../../../components/customer/booking/BookingProgressBar';
import VehicleDetailsForm from '../../../components/customer/booking/VehicleDetailsForm';
import type { VehicleDetails } from '../../../store/bookingFlowStore';

export default function VehicleDetailsPage() {
    const navigate = useNavigate();
    const { facilityId } = useParams<{ facilityId: string }>();
    const { filters } = useSearchStore();
    const {
        currentStep,
        slotId,
        setStep,
        setVehicleDetails,
        goToNextStep,
    } = useBookingFlowStore();

    useEffect(() => {
        // Ensure we're on step 1
        if (currentStep !== 1) {
            setStep(1);
        }

        // Verify we have a slot selected
        if (!slotId) {
            // Redirect back to facility details if no slot selected
            navigate(`/customer/facility/${facilityId}`);
        }
    }, [currentStep, slotId, facilityId, setStep, navigate]);

    const handleSubmit = (details: VehicleDetails) => {
        setVehicleDetails(details);
        goToNextStep();
        navigate(`/customer/booking/${facilityId}/review`);
    };

    const handleBack = () => {
        navigate(`/customer/facility/${facilityId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <BookingProgressBar currentStep={1} />

            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Facility
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">
                        Vehicle Details
                    </h1>
                    <p className="text-gray-600">
                        Enter your vehicle information to continue with the booking
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                    <VehicleDetailsForm
                        initialVehicleType={filters.vehicleType as any || 'CAR'}
                        onSubmit={handleSubmit}
                    />
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Your vehicle details will be verified at the entry gate.
                        Please ensure the information is accurate.
                    </p>
                </div>
            </div>
        </div>
    );
}

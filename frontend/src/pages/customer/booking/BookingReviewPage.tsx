import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useBookingFlowStore } from '../../../store/bookingFlowStore';
import { customerService } from '../../../services/customer.service';
import BookingProgressBar from '../../../components/customer/booking/BookingProgressBar';
import BookingReviewCard from '../../../components/customer/booking/BookingReviewCard';

export default function BookingReviewPage() {
    const navigate = useNavigate();
    const { facilityId } = useParams<{ facilityId: string }>();
    const {
        currentStep,
        slotId,
        vehicleDetails,
        setStep,
        setBookingDetails,
        goToNextStep,
    } = useBookingFlowStore();

    const [entryTime, setEntryTime] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30); // Default to 30 min from now
        return now.toISOString().slice(0, 16);
    });
    const [duration, setDuration] = useState(2);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Fetch facility details
    const { data: facility, isLoading } = useQuery({
        queryKey: ['facility', facilityId],
        queryFn: () => customerService.getFacilityDetails(facilityId!),
        enabled: !!facilityId,
    });

    useEffect(() => {
        // Ensure we're on step 2
        if (currentStep !== 2) {
            setStep(2);
        }

        // Verify we have vehicle details
        if (!vehicleDetails || !slotId) {
            navigate(`/customer/booking/${facilityId}/vehicle`);
        }
    }, [currentStep, vehicleDetails, slotId, facilityId, setStep, navigate]);

    if (isLoading || !facility || !vehicleDetails) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const selectedSlot = facility.floors
        .flatMap(f => f.parking_slots)
        .find(s => s.id === slotId);

    if (!selectedSlot) {
        navigate(`/customer/facility/${facilityId}`);
        return null;
    }

    const pricingRule = facility.pricing_rules.find(
        r => r.vehicle_type === vehicleDetails.vehicle_type
    ) || facility.pricing_rules[0];

    const baseFee = pricingRule.hourly_rate * duration;
    const cappedFee = pricingRule.daily_max && baseFee > pricingRule.daily_max
        ? pricingRule.daily_max
        : baseFee;
    const gst = cappedFee * 0.18;
    const totalFee = cappedFee + gst;

    const handleProceedToPayment = () => {
        // Save booking details to store
        setBookingDetails({
            facility,
            slot: selectedSlot,
            entry_time: entryTime,
            duration,
            total_fee: totalFee,
            base_fee: cappedFee,
            gst,
        });

        goToNextStep();
        navigate(`/customer/booking/${facilityId}/payment`);
    };

    const handleBack = () => {
        navigate(`/customer/booking/${facilityId}/vehicle`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <BookingProgressBar currentStep={2} />

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Vehicle Details
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">
                        Review Your Booking
                    </h1>
                    <p className="text-gray-600">
                        Please review your booking details before proceeding to payment
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Booking Time Selection */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                            <h4 className="font-bold text-gray-900 mb-4">Booking Time</h4>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Entry Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={entryTime}
                                    onChange={(e) => setEntryTime(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Duration
                                </label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {[1, 2, 3, 4, 6, 8, 12, 24].map((h) => (
                                        <option key={h} value={h}>
                                            {h} {h === 1 ? 'Hour' : 'Hours'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Review Card */}
                        <BookingReviewCard
                            facility={facility}
                            slot={selectedSlot}
                            vehicleDetails={vehicleDetails}
                            entryTime={entryTime}
                            duration={duration}
                            pricingRule={pricingRule}
                        />
                    </div>

                    {/* Sidebar - Terms & Proceed */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24 space-y-6">
                            <h4 className="font-bold text-gray-900">Terms & Conditions</h4>

                            <div className="text-sm text-gray-600 space-y-2 max-h-48 overflow-y-auto">
                                <p>By proceeding, you agree to:</p>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                    <li>Arrive within the specified entry time</li>
                                    <li>Pay overstay charges if applicable</li>
                                    <li>Follow facility rules and regulations</li>
                                    <li>Park only in the assigned slot</li>
                                    <li>No refund for early exit</li>
                                    <li>Facility is not liable for theft or damage</li>
                                </ul>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="acceptTerms"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                                />
                                <label htmlFor="acceptTerms" className="text-sm text-gray-700 cursor-pointer">
                                    I have read and accept the terms and conditions
                                </label>
                            </div>

                            <button
                                onClick={handleProceedToPayment}
                                disabled={!acceptedTerms}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                            >
                                Proceed to Payment
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <p className="text-xs text-center text-gray-500">
                                Total: ₹{totalFee.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

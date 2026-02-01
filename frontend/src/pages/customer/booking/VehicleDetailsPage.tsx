import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Info } from 'lucide-react';
import { useBookingFlowStore, type VehicleDetails } from '../../../store/bookingFlowStore';
import { customerService } from '../../../services/customer.service';
import { BookingProgressIndicator } from '../../../components/customer/booking/BookingProgressIndicator';
import { VehicleDetailsForm } from '../../../components/customer/booking/VehicleDetailsForm';

export default function VehicleDetailsPage() {
    const { facilityId } = useParams<{ facilityId: string }>();
    const navigate = useNavigate();
    const {
        facilityId: storeFacilityId,
        slotId,
        setStep,
        setVehicleDetails,
        setBookingDetails,
    } = useBookingFlowStore();

    // Ensure state consistency
    useEffect(() => {
        if (!facilityId || facilityId !== storeFacilityId || !slotId) {
            navigate(`/customer/facility/${facilityId}`);
        }
        setStep(1);
    }, [facilityId, storeFacilityId, slotId, navigate, setStep]);

    // Fetch Facility Details for Pricing
    const { data: facility } = useQuery({
        queryKey: ['facility', facilityId],
        queryFn: () => customerService.getFacilityDetails(facilityId!),
        enabled: !!facilityId,
    });

    // Fetch Saved Vehicles
    const { data: savedVehicles } = useQuery({
        queryKey: ['my-vehicles'],
        queryFn: () => customerService.getVehicles(),
    });

    const handleContinue = async (details: VehicleDetails) => {
        if (!facility) return;

        setVehicleDetails(details);

        // Find pricing rule for this vehicle
        const pricingRule = facility.pricing_rules.find(r => r.vehicle_type === details.vehicle_type) || facility.pricing_rules[0];

        // Find selecting slot
        const slot = facility.floors.flatMap(f => f.parking_slots).find(s => s.id === slotId);

        if (slot) {
            const entryTime = new Date().toISOString();
            const duration = 1; // Default
            const baseFee = pricingRule.hourly_rate * duration;
            const gst = Math.round(baseFee * 0.18);
            const totalFee = baseFee + gst;

            setBookingDetails({
                facility,
                slot,
                entry_time: entryTime,
                duration,
                total_fee: totalFee,
                base_fee: baseFee,
                gst
            });

            navigate(`/customer/booking/${facilityId}/review`);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa]">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
                    <button
                        onClick={() => navigate(`/customer/facility/${facilityId}`)}
                        className="p-3 bg-gray-50 rounded-2xl text-gray-500 hover:text-indigo-600 transition-all"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-1">Reserve Your Spot</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{facility?.name || 'Loading...'}</p>
                    </div>
                    <button className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                        <Info size={24} />
                    </button>
                </div>
                <BookingProgressIndicator currentStep={1} />
            </header>

            <main className="max-w-3xl mx-auto px-6 pt-12 pb-24">
                <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-gray-100">
                    <VehicleDetailsForm
                        onContinue={handleContinue}
                        savedVehicles={savedVehicles}
                    />
                </div>

                <div className="mt-12 flex items-center gap-4 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                        <Info size={24} />
                    </div>
                    <p className="text-sm font-bold text-indigo-900 leading-relaxed">
                        Your slot is already reserved for <span className="text-indigo-600">5 minutes</span> while you complete this flow. If you exit, the reservation will be cancelled.
                    </p>
                </div>
            </main>
        </div>
    );
}

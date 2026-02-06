import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Info, HelpCircle } from 'lucide-react';
import { customerService } from '../../services/customer.service';
import { getSocket, joinFacility, leaveFacility } from '../../services/socket';
import { useSearchStore } from '../../store/searchStore';
import { useBookingFlowStore } from '../../store/bookingFlowStore';
import type { ParkingFacility, VehicleType, SlotStatus } from '../../types';

// Components
import ImageGallery from '../../components/customer/facility/ImageGallery';
import FacilityInfo from '../../components/customer/facility/FacilityInfo';
import PricingTable from '../../components/customer/facility/PricingTable';
import FloorSelector from '../../components/customer/facility/FloorSelector';
import SlotGrid from '../../components/customer/facility/SlotGrid';
import BookingSummary from '../../components/customer/facility/BookingSummary';
import ReviewsList from '../../components/customer/facility/ReviewsList';

export default function FacilityDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { filters } = useSearchStore();
    const vehicleType = (filters.vehicleType as VehicleType) || 'CAR';

    const [activeFloorId, setActiveFloorId] = useState<string>('');
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [localFacility, setLocalFacility] = useState<ParkingFacility | null>(null);

    const { data: facility, isLoading, error } = useQuery({
        queryKey: ['facility', id],
        queryFn: () => customerService.getFacilityDetails(id!),
        enabled: !!id,
        refetchInterval: 30000,
    });

    useEffect(() => {
        if (facility) {
            setLocalFacility(prev => {
                if (!prev) {
                    if (facility.floors.length > 0 && !activeFloorId) {
                        setActiveFloorId(facility.floors[0].id);
                    }
                    return facility;
                }
                return JSON.stringify(prev) !== JSON.stringify(facility) ? facility : prev;
            });
        }
    }, [facility, activeFloorId]);

    useEffect(() => {
        if (!id) return;
        joinFacility(id);
        const socket = getSocket();
        socket.on('slot_updated', (data: { slotId: string; status: SlotStatus; reservation_expiry?: string }) => {
            setLocalFacility((prev) => {
                if (!prev) return prev;
                const newFloors = prev.floors.map((floor) => ({
                    ...floor,
                    parking_slots: floor.parking_slots.map((slot) =>
                        slot.id === data.slotId ? { ...slot, status: data.status } : slot
                    )
                }));
                return { ...prev, floors: newFloors };
            });
            if (selectedSlotId === data.slotId && data.status !== 'FREE') {
                setSelectedSlotId(null);
            }
        });
        return () => {
            leaveFacility(id);
            socket.off('slot_updated');
        };
    }, [id, selectedSlotId]);

    const { setFacilityAndSlot } = useBookingFlowStore();

    const handleStartBooking = (slotId: string) => {
        setFacilityAndSlot(id!, slotId);
        navigate(`/customer/booking/${id}/vehicle`);
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error || !localFacility) return (
        <div className="min-h-screen flex items-center justify-center bg-white p-6">
            <div className="text-center max-w-md">
                <HelpCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Facility details unavailable</h3>
                <button onClick={() => navigate(-1)} className="text-primary font-bold hover:underline">Go Back</button>
            </div>
        </div>
    );

    const activeFloor = localFacility.floors.find(f => f.id === activeFloorId);
    const selectedSlot = activeFloor?.parking_slots.find(s => s.id === selectedSlotId) || null;
    const pricingRule = localFacility.pricing_rules.find(r => r.vehicle_type === vehicleType) || localFacility.pricing_rules[0];

    const floorsWithAvailability = localFacility.floors.map(f => ({
        ...f,
        availableCount: f.parking_slots.filter(s => s.status === 'FREE' && s.vehicle_type === vehicleType).length
    }));

    return (
        <div className="min-h-screen bg-white">
            <main className="max-w-7xl mx-auto px-6 pt-24 pb-20">
                {/* Minimal Header */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors mb-8"
                >
                    <ChevronLeft size={20} /> Back to Search
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-12">
                        <ImageGallery images={localFacility.images || [localFacility.image_url || '']} />

                        <div className="space-y-6">
                            <FacilityInfo facility={localFacility} />

                            <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Select Your Spot</h3>
                                <FloorSelector
                                    floors={floorsWithAvailability}
                                    activeFloorId={activeFloorId}
                                    onFloorChange={setActiveFloorId}
                                />
                                <div className="mt-8 pt-8 border-t border-gray-50">
                                    <SlotGrid
                                        slots={activeFloor?.parking_slots || []}
                                        selectedSlotId={selectedSlotId}
                                        onSlotSelect={setSelectedSlotId}
                                        currentVehicleType={vehicleType}
                                    />
                                </div>
                            </div>

                            <PricingTable rules={localFacility.pricing_rules} />
                        </div>

                        <ReviewsList
                            reviews={localFacility.reviews || []}
                            ratingAvg={localFacility.rating_avg || 4.5}
                            ratingCount={localFacility.rating_count || 128}
                        />
                    </div>

                    {/* Right Column: Sticky Booking Engine */}
                    <div className="lg:col-span-4 h-fit sticky top-24">
                        <BookingSummary
                            facilityName={localFacility.name}
                            selectedSlot={selectedSlot}
                            currentVehicleType={vehicleType}
                            pricingRule={pricingRule}
                            isLoading={false}
                            onConfirm={() => {
                                if (selectedSlotId) {
                                    handleStartBooking(selectedSlotId);
                                }
                            }}
                        />

                        <div className="mt-6 p-4 bg-gray-50 rounded-lg flex items-start gap-3">
                            <Info size={16} className="text-gray-400 mt-0.5" />
                            <p className="text-[11px] text-gray-500 font-medium">
                                Free cancellation up to 10 minutes after booking. Total amount shown includes GST and transaction fees.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

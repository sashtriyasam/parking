import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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

    // Fetch Details
    const { data: facility, isLoading, error } = useQuery({
        queryKey: ['facility', id],
        queryFn: () => customerService.getFacilityDetails(id!),
        enabled: !!id,
    });

    // Sync local state with fetched data
    useEffect(() => {
        if (facility) {
            setLocalFacility(facility);
            if (facility.floors.length > 0 && !activeFloorId) {
                setActiveFloorId(facility.floors[0].id);
            }
        }
    }, [facility]);

    // WebSocket Integration
    useEffect(() => {
        if (!id) return;

        joinFacility(id);
        const socket = getSocket();

        socket.on('slot_updated', (data: { slotId: string; status: SlotStatus; reservation_expiry?: string }) => {
            console.log('Real-time Slot Update:', data);
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

            // If selected slot becomes unavailable, deselect it
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
        // Set the facility and slot in the booking flow store
        setFacilityAndSlot(id!, slotId);
        // Navigate to vehicle details page (Step 1)
        navigate(`/customer/booking/${id}/vehicle`);
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading Facility...</div>;
    if (error || !localFacility) return <div className="min-h-screen flex items-center justify-center text-red-500">Error loading facility</div>;

    const activeFloor = localFacility.floors.find(f => f.id === activeFloorId);
    const selectedSlot = activeFloor?.parking_slots.find(s => s.id === selectedSlotId) || null;
    const pricingRule = localFacility.pricing_rules.find(r => r.vehicle_type === vehicleType) || localFacility.pricing_rules[0];

    const floorsWithAvailability = localFacility.floors.map(f => ({
        ...f,
        availableCount: f.parking_slots.filter(s => s.status === 'FREE' && s.vehicle_type === vehicleType).length
    }));

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12">
            {/* Top Section: Gallery & Info */}
            <div className="max-w-7xl mx-auto px-4 pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <ImageGallery images={localFacility.images || [localFacility.image_url || '']} />
                        <FacilityInfo facility={localFacility} />

                        <div className="pt-8 border-t border-gray-200">
                            <h2 className="text-2xl font-black text-gray-900 mb-6">Visual Slot Selection</h2>
                            <FloorSelector
                                floors={floorsWithAvailability}
                                activeFloorId={activeFloorId}
                                onFloorChange={setActiveFloorId}
                            />

                            <SlotGrid
                                slots={activeFloor?.parking_slots || []}
                                selectedSlotId={selectedSlotId}
                                onSlotSelect={setSelectedSlotId}
                                currentVehicleType={vehicleType}
                            />
                        </div>

                        <PricingTable rules={localFacility.pricing_rules} />

                        <ReviewsList
                            reviews={localFacility.reviews || []}
                            ratingAvg={localFacility.rating_avg || 4.5}
                            ratingCount={localFacility.rating_count || 128}
                        />
                    </div>

                    {/* Sidebar: Booking Summary */}
                    <div className="lg:col-span-1">
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
                    </div>
                </div>
            </div>
        </div>
    );
}

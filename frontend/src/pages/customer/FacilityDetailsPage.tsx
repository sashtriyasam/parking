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
    const [scrolled, setScrolled] = useState(false);

    // Watch for scroll to handle sticky nav aesthetics
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch Details with React Query (includes automatic polling as fallback)
    const { data: facility, isLoading, error } = useQuery({
        queryKey: ['facility', id],
        queryFn: () => customerService.getFacilityDetails(id!),
        enabled: !!id,
        refetchInterval: 30000, // Poll every 30s for live data consistency
    });

    // Sync local state
    useEffect(() => {
        if (facility) {
            setLocalFacility(prev => {
                if (!prev) {
                    if (facility.floors.length > 0 && !activeFloorId) {
                        setActiveFloorId(facility.floors[0].id);
                    }
                    return facility;
                }
                // Only update if data has actually changed to prevent unnecessary re-renders
                return JSON.stringify(prev) !== JSON.stringify(facility) ? facility : prev;
            });
        }
    }, [facility, activeFloorId]);

    // WebSocket Integration
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4 shadow-xl shadow-indigo-100" />
            <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">Accessing Facility Data...</p>
        </div>
    );

    if (error || !localFacility) return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
            <div className="bg-white p-12 rounded-[40px] text-center shadow-xl border border-red-100 max-w-lg">
                <HelpCircle className="w-20 h-20 text-red-100 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-red-900 mb-2">Facility Offline</h3>
                <p className="text-red-600/70 font-bold mb-8 leading-relaxed">We encountered a problem while retrieving the details for this parking zone. It might be undergoing maintenance.</p>
                <button onClick={() => navigate(-1)} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-red-100 uppercase tracking-widest text-xs hover:bg-red-700 transition-all">Go Back</button>
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
        <div className="min-h-screen bg-[#fafafa]">
            {/* Top Navigation */}
            <nav className={`fixed top-0 w-full z-40 transition-all duration-500 px-6 py-4 flex items-center justify-between ${scrolled ? 'bg-white shadow-xl shadow-gray-200/20 translate-y-0' : 'bg-transparent text-white'
                }`}>
                <button
                    onClick={() => navigate(-1)}
                    className={`p-3 rounded-2xl transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest ${scrolled ? 'bg-gray-100 text-gray-900' : 'bg-white/20 backdrop-blur-xl text-white'
                        }`}
                >
                    <ChevronLeft size={20} /> Back to Search
                </button>

                {scrolled && (
                    <div className="absolute left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-top-4 duration-500">
                        <h2 className="font-black text-gray-900 truncate max-w-xs">{localFacility.name}</h2>
                    </div>
                )}

                <div className="flex gap-3">
                    <button className={`p-3 rounded-2xl transition-all ${scrolled ? 'bg-gray-100 text-gray-900' : 'bg-white/20 backdrop-blur-xl text-white'}`}>
                        <HelpCircle size={20} />
                    </button>
                    <button className={`p-3 rounded-2xl transition-all ${scrolled ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-indigo-900 shadow-xl'}`}>
                        <Info size={20} />
                    </button>
                </div>
            </nav>

            <main className="max-w-[1600px] mx-auto px-6 pt-24 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Details & Selection */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Immersive Gallery */}
                        <ImageGallery images={localFacility.images || [localFacility.image_url || '']} />

                        {/* Core Info */}
                        <FacilityInfo facility={localFacility} />

                        {/* Interactive Slot Selection Card */}
                        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
                            <FloorSelector
                                floors={floorsWithAvailability}
                                activeFloorId={activeFloorId}
                                onFloorChange={setActiveFloorId}
                            />

                            <div className="pt-8 border-t border-gray-50">
                                <SlotGrid
                                    slots={activeFloor?.parking_slots || []}
                                    selectedSlotId={selectedSlotId}
                                    onSlotSelect={setSelectedSlotId}
                                    currentVehicleType={vehicleType}
                                />
                            </div>
                        </div>

                        {/* Comparison Pricing */}
                        <div className="bg-gray-50/50 rounded-[40px] p-8 md:p-12 border-4 border-white shadow-inner">
                            <PricingTable rules={localFacility.pricing_rules} />
                        </div>

                        {/* Social Proof */}
                        <ReviewsList
                            reviews={localFacility.reviews || []}
                            ratingAvg={localFacility.rating_avg || 4.5}
                            ratingCount={localFacility.rating_count || 128}
                        />
                    </div>

                    {/* Right Column: Sticky Booking Engine */}
                    <div className="lg:col-span-4 relative">
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
            </main>

            {/* Support Floating Action */}
            <button className="fixed bottom-10 right-10 bg-gray-900 text-white p-5 rounded-full shadow-2xl hover:bg-indigo-600 hover:scale-110 active:scale-95 transition-all group z-50">
                <HelpCircle size={28} className="group-hover:rotate-12 transition-transform" />
            </button>
        </div>
    );
}

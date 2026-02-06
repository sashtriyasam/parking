import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Phone, Heart, ChevronLeft, Shield, Zap, Car as CarIcon, Share2, Info } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { SlotGrid } from '@/app/components/SlotGrid';
import { useApp } from '@/context/AppContext';
import { mockPricing, mockReviews } from '@/data/mockData';
import type { VehicleType } from '@/types';
import { toast } from 'sonner';

export function FacilityDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getFacilityById, slots, isAuthenticated } = useApp();

  const facility = getFacilityById(id!);
  const facilitySlots = slots[id!] || [];
  const pricing = mockPricing[id!] || mockPricing['facility-1'];
  const reviews = mockReviews.filter(r => r.facilityId === id);

  const [selectedFloor, setSelectedFloor] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('car');

  const floorsSlots = useMemo(() => {
    return facilitySlots.filter(slot => slot.floor === selectedFloor);
  }, [facilitySlots, selectedFloor]);

  const selectedSlotData = useMemo(() => {
    return facilitySlots.find(slot => slot.id === selectedSlot);
  }, [facilitySlots, selectedSlot]);

  const currentPricing = useMemo(() => {
    return pricing.find(p => p.vehicleType === selectedVehicleType);
  }, [pricing, selectedVehicleType]);

  if (!facility) return null; // Or loading state

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book a slot');
      navigate('/login');
      return;
    }
    if (!selectedSlot) {
      toast.error('Please select a parking slot first');
      // Scroll to slot selection if needed
      document.getElementById('slot-selection')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate(`/customer/booking/${id}/vehicle`, {
      state: { slotId: selectedSlot, facilityId: id }
    });
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* HEADER ACTIONS (Floating on top of image) */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-start pointer-events-none">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full shadow-lg bg-white/90 backdrop-blur pointer-events-auto"
          onClick={() => navigate('/customer/search')}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex gap-2 pointer-events-auto">
          <Button variant="secondary" size="icon" className="rounded-full shadow-lg bg-white/90 backdrop-blur">
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full shadow-lg bg-white/90 backdrop-blur">
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* HERO IMAGE */}
      <div className="relative h-[40vh] md:h-[50vh] w-full">
        <img
          src={facility.images[0]}
          alt={facility.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto -mt-6 px-4 relative z-10">
        {/* TITLE HEADER */}
        <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-sm border-b p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{facility.name}</h1>
              <div className="flex items-center text-gray-500 text-sm mb-3">
                <MapPin className="w-4 h-4 mr-1" />
                {facility.address}, {facility.city}
              </div>
              <div className="flex gap-2">
                {facility.verified && (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">Verified</Badge>
                )}
                <div className="flex items-center bg-yellow-50 px-2 py-0.5 rounded-md text-yellow-700 text-sm font-bold">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 mr-1" />
                  {facility.rating} ({facility.reviewCount})
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start h-12 bg-gray-100 p-1 rounded-xl mb-6 sticky top-20 z-40 backdrop-blur">
            <TabsTrigger value="overview" className="flex-1 rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="pricing" className="flex-1 rounded-lg">Pricing</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 rounded-lg">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* AMENITIES */}
            <section>
              <h3 className="font-bold text-lg mb-4">Amenities</h3>
              <div className="grid grid-cols-2 gap-3">
                {facility.amenities.map(amenity => (
                  <div key={amenity} className="flex items-center p-3 bg-gray-50 rounded-xl">
                    {amenity.includes('CCTV') && <Shield className="w-5 h-5 text-indigo-600 mr-3" />}
                    {amenity.includes('EV') && <Zap className="w-5 h-5 text-indigo-600 mr-3" />}
                    {amenity.includes('Covered') && <CarIcon className="w-5 h-5 text-indigo-600 mr-3" />}
                    {!amenity.includes('CCTV') && !amenity.includes('EV') && !amenity.includes('Covered') && (
                      <Info className="w-5 h-5 text-indigo-600 mr-3" />
                    )}
                    <span className="font-medium text-sm">{amenity}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* SLOT SELECTION */}
            <section id="slot-selection" className="pt-4 border-t">
              <h3 className="font-bold text-lg mb-4">Select Spot</h3>

              {/* Floor Tabs */}
              <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide">
                {Array.from({ length: facility.floors }, (_, i) => i).map((floor) => (
                  <button
                    key={floor}
                    onClick={() => setSelectedFloor(floor)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedFloor === floor
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white border border-gray-200 text-gray-600'
                      }`}
                  >
                    {floor === 0 ? 'Ground Floor' : `Floor ${floor}`}
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 min-h-[300px]">
                <SlotGrid
                  slots={floorsSlots}
                  selectedSlot={selectedSlot}
                  onSlotSelect={setSelectedSlot}
                />
                <div className="flex justify-center gap-4 mt-6 text-xs text-gray-500 font-medium">
                  <div className="flex items-center"><div className="w-3 h-3 bg-white border border-gray-300 rounded mr-1" /> Available</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-indigo-600 rounded mr-1" /> Selected</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-gray-300 rounded mr-1" /> Occupied</div>
                </div>
              </div>
            </section>

            <div className="h-8"></div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Rates</h3>
              <Tabs value={selectedVehicleType} onValueChange={(v) => setSelectedVehicleType(v as VehicleType)}>
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="bike" className="flex-1">Bike</TabsTrigger>
                  <TabsTrigger value="car" className="flex-1">Car</TabsTrigger>
                </TabsList>
              </Tabs>

              {currentPricing && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Hourly Rate</span>
                    <span className="font-black text-xl">₹{currentPricing.hourlyRate}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Daily Max (24h)</span>
                    <span className="font-bold">₹{currentPricing.dailyMax}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600">Monthly Pass</span>
                    <span className="font-bold text-indigo-600">₹{currentPricing.monthlyPass}</span>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-bold text-lg mb-4">Reviews ({facility.reviewCount})</h3>
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-4 border-0 shadow-sm bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs">
                        {review.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{review.userName}</p>
                        <p className="text-xs text-gray-500">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* FIXED BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Total Price</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-indigo-900">
                {currentPricing ? `₹${currentPricing.hourlyRate}` : '--'}
              </span>
              <span className="text-sm font-medium text-gray-400">/ hour</span>
            </div>
          </div>
          <Button
            onClick={handleBookNow}
            className="h-12 px-8 rounded-xl text-md font-bold shadow-indigo-200 shadow-lg"
            disabled={!selectedSlot}
          >
            {selectedSlot ? 'Confirm Booking' : 'Select Spot'}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Phone, Heart, ChevronLeft, Shield, Zap, Car as CarIcon, Share2, Info } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { SlotGrid } from '@/app/components/SlotGrid';
import { useApp } from '@/context/AppContext';
import { customerService } from '@/services/customer.service';
import { mockPricing, mockReviews } from '@/data/mockData';
import type { VehicleType, ParkingSlot } from '@/types';
import { toast } from 'sonner';

interface NormalizedSlot extends ParkingSlot {
  floorName: string;
}


export function FacilityDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getFacilityById, isAuthenticated } = useApp();

  const facility = getFacilityById(id!);
  const pricing = mockPricing?.[id!] || mockPricing?.['facility-1'] || [];
  const reviews = (mockReviews || []).filter(r => r.facilityId === id);

  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('car');
  const [facilitySlots, setFacilitySlots] = useState<NormalizedSlot[]>([]);
  const [floorNames, setFloorNames] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);

  // Fetch slots from API on mount
  useEffect(() => {
    const fetchSlots = async () => {
      if (!id) return;
      try {
        setSlotsLoading(true);
        const slotsData = await customerService.getAvailableSlots(id);
        // slotsData is { "Floor 1": [...], "Floor 2": [...] }
        const slotsDataSafe = (typeof slotsData === 'object' && slotsData) ? slotsData : {};
        const names = Object.keys(slotsDataSafe);
        setFloorNames(names);
        if (names.length > 0) setSelectedFloor(names[0]); // default to first floor

        const allSlots: NormalizedSlot[] = [];
        names.forEach(floorName => {
          const floorSlots = slotsDataSafe[floorName];
          if (Array.isArray(floorSlots)) {
            floorSlots.forEach(slot => {
              if (slot.price_per_hour === null || slot.price_per_hour === undefined) {
                console.warn(`[FacilityDetails] Missing pricing for slot ${slot.id} in facility ${id}. Falling back to 20.`);
              }
              allSlots.push({
                ...slot,
                id: slot.id,
                facilityId: id,
                slotNumber: slot.slot_number || slot.slotNumber || '?',
                floor: slot.floor || 0,
                floorName,
                // Normalize fields for frontend
                status: (slot.status || 'free').toLowerCase() as any,
                vehicleType: (slot.vehicle_type || 'car').toLowerCase() as VehicleType,
                pricePerHour: slot.price_per_hour ?? 20
              });
            });
          }
        });
        setFacilitySlots(allSlots);
      } catch (error) {
        console.error('Failed to load slots:', error);
        setFacilitySlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [id]);

  const floorsSlots = useMemo(() => {
    if (!selectedFloor) return facilitySlots; // show all if no floor selected
    return facilitySlots.filter(slot => slot.floorName === selectedFloor);
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
    <div className="min-h-screen bg-background pb-24 text-foreground">
      {/* HEADER ACTIONS (Floating on top of image) */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-start pointer-events-none">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full shadow-md bg-background/80 backdrop-blur border border-border pointer-events-auto text-foreground"
          onClick={() => navigate('/customer/search')}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex gap-2 pointer-events-auto">
          <Button variant="secondary" size="icon" className="rounded-full shadow-md bg-background/80 backdrop-blur border border-border text-foreground">
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full shadow-md bg-background/80 backdrop-blur border border-border text-foreground">
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* HERO IMAGE */}
      <div className="relative h-[40vh] md:h-[50vh] w-full">
        <img
          src={facility.images?.[0] || facility.image_url || '/placeholder-parking.jpg'}
          alt={facility.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto -mt-6 px-4 relative z-10">
        {/* TITLE HEADER */}
        <div className="bg-card rounded-t-[20px] md:rounded-[20px] border border-border p-6 mb-6 text-card-foreground shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">{facility.name}</h1>
              <div className="flex items-center text-muted-foreground text-sm mb-3">
                <MapPin className="w-4 h-4 mr-1 text-primary" />
                {facility.address}, {facility.city}
              </div>
              <div className="flex gap-2">
                {facility.verified && (
                  <Badge className="bg-[#34C759]/15 text-[#34C759] hover:bg-[#34C759]/25 border-0 font-semibold rounded-full px-2.5 py-0.5 text-xs">Verified</Badge>
                )}
                <div className="flex items-center bg-[#FF9F0A]/15 px-2.5 py-0.5 rounded-md text-[#FF9F0A] text-sm font-bold">
                  <Star className="w-3 h-3 fill-[#FF9F0A] text-[#FF9F0A] mr-1" />
                  {facility.rating} ({facility.reviewCount})
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start h-12 bg-secondary p-1 rounded-xl mb-6 sticky top-20 z-40 backdrop-blur-md border border-border/50">
            <TabsTrigger value="overview" className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium">Overview</TabsTrigger>
            <TabsTrigger value="pricing" className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium">Pricing</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* AMENITIES */}
            <section>
              <h3 className="font-bold font-display text-lg mb-4 text-foreground">Amenities</h3>
              <div className="grid grid-cols-2 gap-3">
                {(facility.amenities || []).length > 0 ? facility.amenities.map(amenity => (
                  <div key={amenity} className="flex items-center p-3 bg-secondary/40 border border-border rounded-lg">
                    {amenity.includes('CCTV') && <Shield className="w-5 h-5 text-primary mr-3" />}
                    {amenity.includes('EV') && <Zap className="w-5 h-5 text-primary mr-3" />}
                    {amenity.includes('Covered') && <CarIcon className="w-5 h-5 text-primary mr-3" />}
                    {!amenity.includes('CCTV') && !amenity.includes('EV') && !amenity.includes('Covered') && (
                      <Info className="w-5 h-5 text-primary mr-3" />
                    )}
                    <span className="font-medium text-sm text-foreground">{amenity}</span>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-sm col-span-2">No amenities listed</p>
                )}
              </div>
            </section>

            {/* SLOT SELECTION */}
            <section id="slot-selection" className="pt-4 border-t border-border">
              <h3 className="font-bold font-display text-lg mb-4 text-foreground">Select Spot</h3>

              {/* Floor Tabs */}
              <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide">
                {floorNames.map((floorName) => (
                  <button
                    key={floorName}
                    onClick={() => {
                      setSelectedFloor(floorName);
                      setSelectedSlot(null);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                      selectedFloor === floorName
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-muted-foreground border border-border'
                    }`}
                  >
                    {floorName}
                  </button>
                ))}
              </div>

              <div className="bg-secondary/20 p-4 rounded-lg border border-border min-h-[300px]">
                <SlotGrid
                  slots={floorsSlots}
                  selectedSlot={selectedSlot}
                  onSlotSelect={setSelectedSlot}
                />
                <div className="flex justify-center gap-4 mt-6 text-xs text-muted-foreground font-medium">
                  <div className="flex items-center"><div className="w-3 h-3 bg-card border border-border rounded mr-1" /> Available</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-primary rounded mr-1" /> Selected</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-[#FF3B30] rounded mr-1" /> Occupied</div>
                </div>
              </div>
            </section>

            <div className="h-8"></div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="p-6 bg-card border border-border text-card-foreground rounded-lg">
              <h3 className="font-bold font-display text-lg mb-4 text-foreground">Rates</h3>
              <Tabs value={selectedVehicleType} onValueChange={(v) => setSelectedVehicleType(v as VehicleType)}>
                <TabsList className="w-full mb-6 bg-secondary border border-border/50">
                  <TabsTrigger value="bike" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground">Bike</TabsTrigger>
                  <TabsTrigger value="car" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground">Car</TabsTrigger>
                </TabsList>
              </Tabs>

              {currentPricing && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground">Hourly Rate</span>
                    <span className="font-bold text-xl text-foreground">₹{currentPricing.hourlyRate}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground">Daily Max (24h)</span>
                    <span className="font-bold text-foreground">₹{currentPricing.dailyMax}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-muted-foreground">Monthly Pass</span>
                    <span className="font-bold text-primary">₹{currentPricing.monthlyPass}</span>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-bold font-display text-lg mb-4 text-foreground">Reviews ({facility.reviewCount})</h3>
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-4 border border-border/50 bg-secondary/40 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                        {review.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{review.userName}</p>
                        <p className="text-xs text-muted-foreground">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-[#FF9F0A] text-[#FF9F0A]' : 'text-border'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* FIXED BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-4 z-50 pb-safe shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Total Price</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-foreground">
                {currentPricing ? `₹${currentPricing.hourlyRate}` : '--'}
              </span>
              <span className="text-sm font-medium text-muted-foreground">/ hour</span>
            </div>
          </div>
          <Button
            onClick={handleBookNow}
            className="h-12 px-8 rounded-md text-md font-bold"
            disabled={!selectedSlot}
          >
            {selectedSlot ? 'Confirm Booking' : 'Select Spot'}
          </Button>
        </div>
      </div>
    </div>
  );
}

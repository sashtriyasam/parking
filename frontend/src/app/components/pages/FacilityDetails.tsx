import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Phone, Heart, ChevronLeft, Shield, Zap, Car as CarIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { SlotGrid } from '@/app/components/SlotGrid';
import { useApp } from '@/context/AppContext';
import { mockPricing, mockReviews } from '@/data/mockData';
import { VehicleType } from '@/types';
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

  if (!facility) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Facility not found</h2>
          <Button onClick={() => navigate('/customer/search')}>Back to Search</Button>
        </div>
      </div>
    );
  }

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book a slot');
      navigate('/login');
      return;
    }

    if (!selectedSlot) {
      toast.error('Please select a parking slot');
      return;
    }

    navigate(`/customer/booking/${id}/vehicle`, {
      state: { slotId: selectedSlot, facilityId: id }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Back Button */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/customer/search')}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Search</span>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <img
                src={facility.images[0]}
                alt={facility.name}
                className="w-full h-96 object-cover"
              />
            </Card>

            {/* Facility Info */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-3xl font-black">{facility.name}</h1>
                    {facility.verified && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{facility.rating}</span>
                      <span>({facility.reviewCount} reviews)</span>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>{facility.address}, {facility.city}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-2">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>{facility.operatingHours}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-5 h-5 mr-2" />
                    <span>+91 22 1234 5678</span>
                  </div>
                </div>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>

              <p className="text-gray-700 mb-6">{facility.description}</p>

              {/* Amenities */}
              <div>
                <h3 className="font-bold text-lg mb-3">Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {facility.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2 text-sm">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        {amenity.includes('CCTV') && <Shield className="w-4 h-4 text-indigo-600" />}
                        {amenity.includes('EV') && <Zap className="w-4 h-4 text-indigo-600" />}
                        {amenity.includes('Covered') && <CarIcon className="w-4 h-4 text-indigo-600" />}
                        {!amenity.includes('CCTV') && !amenity.includes('EV') && !amenity.includes('Covered') && (
                          <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Floor & Slot Selection */}
            <Card className="p-6">
              <h2 className="text-2xl font-black mb-6">Select Your Parking Slot</h2>

              {/* Floor Selector */}
              <div className="mb-6">
                <h3 className="font-bold mb-3">Select Floor</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: facility.floors }, (_, i) => i).map((floor) => {
                    const floorSlots = facilitySlots.filter(s => s.floor === floor);
                    const availableSlots = floorSlots.filter(s => s.status === 'free').length;
                    
                    return (
                      <Button
                        key={floor}
                        variant={selectedFloor === floor ? 'default' : 'outline'}
                        onClick={() => setSelectedFloor(floor)}
                        className="flex flex-col h-auto py-2"
                      >
                        <span className="font-bold">
                          {floor === 0 ? 'Ground' : `Floor ${floor}`}
                        </span>
                        <span className="text-xs opacity-75">{availableSlots} free</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Slot Grid */}
              <SlotGrid
                slots={floorsSlots}
                selectedSlot={selectedSlot}
                onSlotSelect={setSelectedSlot}
              />
            </Card>

            {/* Reviews */}
            <Card className="p-6">
              <h2 className="text-2xl font-black mb-6">Customer Reviews</h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="font-bold text-indigo-600">
                            {review.userName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{review.userName}</p>
                          <p className="text-sm text-gray-500">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{review.comment}</p>
                    <button className="text-sm text-gray-500 hover:text-gray-700">
                      Helpful ({review.helpful})
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24 space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4">Pricing</h3>
                
                {/* Vehicle Type Tabs */}
                <Tabs value={selectedVehicleType} onValueChange={(v) => setSelectedVehicleType(v as VehicleType)}>
                  <TabsList className="grid grid-cols-4 w-full mb-4">
                    <TabsTrigger value="bike" className="text-xs">Bike</TabsTrigger>
                    <TabsTrigger value="scooter" className="text-xs">Scooter</TabsTrigger>
                    <TabsTrigger value="car" className="text-xs">Car</TabsTrigger>
                    <TabsTrigger value="truck" className="text-xs">Truck</TabsTrigger>
                  </TabsList>
                </Tabs>

                {currentPricing && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Hourly Rate</span>
                      <span className="text-2xl font-black text-indigo-600">
                        ₹{currentPricing.hourlyRate}/hr
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Daily Maximum</span>
                      <span className="font-semibold">₹{currentPricing.dailyMax}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Monthly Pass</span>
                      <span className="font-semibold">₹{currentPricing.monthlyPass}</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedSlotData && (
                <div className="border-t pt-4">
                  <h4 className="font-bold mb-2">Selected Slot</h4>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <p className="text-lg font-bold text-indigo-600">{selectedSlotData.slotNumber}</p>
                    <p className="text-sm text-gray-600">
                      {selectedFloor === 0 ? 'Ground' : `Floor ${selectedFloor}`}
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Available Slots</span>
                  <span className="font-bold text-emerald-600">{facility.availableSlots}</span>
                </div>
              </div>

              <Button
                onClick={handleBookNow}
                disabled={!selectedSlot}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-base font-semibold"
              >
                {selectedSlot ? 'Continue to Book' : 'Select a Slot'}
              </Button>

              <p className="text-xs text-center text-gray-500">
                Secure payment • Instant confirmation
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

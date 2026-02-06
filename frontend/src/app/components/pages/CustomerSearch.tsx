import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Star, Filter, Grid3X3, Map as MapIcon, Search } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Slider } from '@/app/components/ui/slider';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { useApp } from '@/context/AppContext';
import type { VehicleType } from '@/types';
import { Sheet, SheetContent, SheetTrigger } from '@/app/components/ui/sheet';

export function CustomerSearch() {
  const navigate = useNavigate();
  const { facilities } = useApp();
  const [searchParams] = useSearchParams();

  const [searchLocation, setSearchLocation] = useState(searchParams.get('location') || '');
  const [vehicleType, setVehicleType] = useState<VehicleType>((searchParams.get('vehicleType') as VehicleType) || 'car');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 150]);
  const [sortBy, setSortBy] = useState<string>('distance');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const amenitiesList = ['CCTV Security', 'EV Charging', 'Covered Parking', '24/7 Access', 'Wheelchair Access'];

  const filteredFacilities = useMemo(() => {
    let filtered = facilities;

    // Filter by location
    if (searchLocation) {
      filtered = filtered.filter(f =>
        f.city.toLowerCase().includes(searchLocation.toLowerCase()) ||
        f.address.toLowerCase().includes(searchLocation.toLowerCase()) ||
        f.name.toLowerCase().includes(searchLocation.toLowerCase())
      );
    }

    // Filter by amenities
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter(f =>
        selectedAmenities.every(amenity => f.amenities.includes(amenity))
      );
    }

    // Sort
    if (sortBy === 'price-low') {
      filtered = [...filtered].sort((a, b) => 60 - 60); // Mock pricing
    } else if (sortBy === 'price-high') {
      filtered = [...filtered].sort((a, b) => 60 - 60);
    } else if (sortBy === 'rating') {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  }, [facilities, searchLocation, selectedAmenities, sortBy]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold mb-3">Location</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search location..."
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-3">Vehicle Type</h3>
        <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bike">Bike</SelectItem>
            <SelectItem value="scooter">Scooter</SelectItem>
            <SelectItem value="car">Car</SelectItem>
            <SelectItem value="truck">Truck</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-bold mb-3">Price Range (per hour)</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={0}
            max={200}
            step={10}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-3">Amenities</h3>
        <div className="space-y-2">
          {amenitiesList.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={amenity}
                checked={selectedAmenities.includes(amenity)}
                onCheckedChange={() => toggleAmenity(amenity)}
              />
              <Label htmlFor={amenity} className="cursor-pointer text-sm">
                {amenity}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setSearchLocation('');
          setSelectedAmenities([]);
          setPriceRange([0, 150]);
        }}
      >
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Find Parking</h1>
            <p className="text-gray-600">{filteredFacilities.length} facilities available</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="hidden sm:flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-5 h-5" />
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('map')}
              >
                <MapIcon className="w-5 h-5" />
              </Button>
            </div>

            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="sm:hidden">
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <div className="mt-6">
                  <FilterPanel />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-black mb-6 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </h2>
              <FilterPanel />
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredFacilities.map((facility) => (
                  <Card
                    key={facility.id}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                    onClick={() => navigate(`/customer/facility/${facility.id}`)}
                  >
                    <div className="relative h-48">
                      <img
                        src={facility.images[0]}
                        alt={facility.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-sm">{facility.rating}</span>
                      </div>
                      {facility.verified && (
                        <Badge className="absolute top-3 left-3 bg-emerald-500">
                          Verified
                        </Badge>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1 line-clamp-1">{facility.name}</h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="line-clamp-1">{facility.address}</span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <span className="text-2xl font-black text-indigo-600">₹60</span>
                          <span className="text-sm text-gray-600">/hr</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-600">
                            {facility.availableSlots} slots
                          </p>
                          <p className="text-xs text-gray-500">available</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-3">
                        {facility.amenities.slice(0, 2).map((amenity) => (
                          <Badge key={amenity} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {facility.amenities.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{facility.amenities.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="text-center">
                  <MapIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Map View</h3>
                  <p className="text-gray-600">
                    Interactive map view would be displayed here with markers for each facility
                  </p>
                </div>
              </Card>
            )}

            {filteredFacilities.length === 0 && (
              <Card className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <MapPin className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-bold mb-2">No parking facilities found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search in a different location
                </p>
                <Button onClick={() => {
                  setSearchLocation('');
                  setSelectedAmenities([]);
                }}>
                  Clear Filters
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Search, Navigation, Filter, Star, Clock, Shield, Zap } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { useApp } from '@/context/AppContext';
import { Sheet, SheetContent, SheetTrigger } from '@/app/components/ui/sheet';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { cn } from '@/lib/utils';
import type { Facility } from '@/types';

// Fix for default marker icon
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker Component that handles clicks
function InteractiveMarker({ facility, onClick }: { facility: Facility, onClick: (f: Facility) => void }) {
  return (
    <Marker
      position={[facility.latitude, facility.longitude]}
      eventHandlers={{
        click: () => onClick(facility),
      }}
    // In a real app we would use a custom divIcon to show price pills:
    // icon={L.divIcon({ className: 'custom-pill-marker', ... })}
    />
  );
}

// Map Controller
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1.5 });
  }, [center, map]);
  return null;
}

export function CustomerSearch() {
  const navigate = useNavigate();
  const { facilities } = useApp();
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Mock Amenities for Filter Chips
  const filterChips = [
    { id: 'covered', label: 'Covered', icon: Shield },
    { id: 'ev', label: 'EV Charging', icon: Zap },
    { id: '247', label: '24/7', icon: Clock },
    { id: 'cheap', label: 'Cheapest', icon: Filter },
  ];

  const filteredFacilities = useMemo(() => {
    let filtered = facilities;
    if (searchQuery) {
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // Simple mock filter logic
    if (activeFilter === 'ev') filtered = filtered.filter(f => f.amenities.includes('EV Charging'));
    if (activeFilter === 'covered') filtered = filtered.filter(f => f.amenities.includes('Covered Parking'));

    return filtered;
  }, [facilities, searchQuery, activeFilter]);

  const mapCenter = useMemo((): [number, number] => {
    if (selectedFacility) return [selectedFacility.latitude, selectedFacility.longitude];
    if (filteredFacilities.length > 0) return [filteredFacilities[0].latitude, filteredFacilities[0].longitude];
    return [19.0760, 72.8777]; // Mumbai Default
  }, [filteredFacilities, selectedFacility]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-100">

      {/* MAP BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={mapCenter}
          zoom={14}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapController center={mapCenter} />
          {filteredFacilities.map(facility => (
            <InteractiveMarker
              key={facility.id}
              facility={facility}
              onClick={setSelectedFacility}
            />
          ))}
        </MapContainer>
      </div>

      {/* TOP FLOATING SEARCH */}
      <div className="absolute top-4 left-4 right-4 z-10 md:w-[400px] md:left-6">
        <div className="bg-white rounded-xl shadow-lg shadow-black/5 p-2 flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/welcome')}>
            <Search className="w-5 h-5 text-gray-500" />
          </Button>
          <Input
            placeholder="Where to?"
            className="border-0 shadow-none focus-visible:ring-0 text-base font-medium placeholder:text-gray-400 bg-transparent h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-primary">
            AG
          </div>
        </div>

        {/* FILTER CHIPS */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(activeFilter === chip.id ? null : chip.id)}
              className={cn(
                "flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all whitespace-nowrap",
                activeFilter === chip.id
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              )}
            >
              <chip.icon className="w-3 h-3" />
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* BOTTOM SHEET FACILITY PREVIEW */}
      {selectedFacility && (
        <div className="absolute bottom-[80px] left-4 right-4 md:left-6 md:w-[400px] z-20 animate-in slide-in-from-bottom duration-300">
          <Card className="rounded-2xl shadow-xl overflow-hidden border-0">
            <div className="relative h-32 bg-gray-200">
              <img
                src={selectedFacility.images[0]}
                alt={selectedFacility.name}
                className="w-full h-full object-cover"
              />
              <button
                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full"
                onClick={(e) => { e.stopPropagation(); setSelectedFacility(null); }}
              >
                <span className="sr-only">Close</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-md text-xs font-bold flex items-center shadow-sm">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
                {selectedFacility.rating}
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{selectedFacility.name}</h3>
                  <p className="text-xs text-gray-500">{selectedFacility.address}</p>
                </div>
                <div className="text-right">
                  <span className="block text-lg font-black text-primary">₹60</span>
                  <span className="text-[10px] text-gray-400 font-medium uppercase">Per Hour</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 my-3">
                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-green-100 text-green-700 hover:bg-green-100">
                  {selectedFacility.availableSlots} spots left
                </Badge>
                <div className="text-xs text-gray-400">•</div>
                <div className="text-xs text-gray-500">
                  4 min drive
                </div>
              </div>

              <Button
                className="w-full h-11 text-base font-bold shadow-md"
                onClick={() => navigate(`/customer/facility/${selectedFacility.id}`)}
              >
                Reserve Spot
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* EMPTY STATE / "Explore area" Text if nothing selected */}
      {!selectedFacility && (
        <div className="absolute bottom-[80px] left-0 right-0 z-10 flex justify-center pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-xs font-medium text-gray-600 shadow-sm mb-4">
            Explore parking near you
          </div>
        </div>
      )}
    </div>
  );
}

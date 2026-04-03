import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Filter, 
  Star, 
  Clock, 
  Shield, 
  Zap,
  ChevronRight,
  User,
  LogOut,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { useApp } from '@/context/AppContext';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/app/components/ui/sheet';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { useGeolocation } from '@/hooks/useGeolocation';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
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

// Premium Custom Marker Icon
const createMarkerIcon = (isActive: boolean) => L.divIcon({
  className: 'custom-marker',
  html: `
    <div class="relative group cursor-pointer">
      <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary/20 rounded-full blur-sm transition-all duration-300 ${isActive ? 'scale-150 bg-primary/40' : 'group-hover:scale-125'}"></div>
      <div class="relative w-8 h-8 bg-white rounded-2xl flex items-center justify-center shadow-lg transform transition-all duration-300 border-2 ${isActive ? 'border-primary ring-4 ring-primary/20 -translate-y-2' : 'border-gray-100 group-hover:-translate-y-1'}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${isActive ? '#1E40AF' : '#111827'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-parking-square"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Map Controller with FlyTo animation
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }, [center, map]);
  return null;
}

export function CustomerSearch() {
  const navigate = useNavigate();
  const { facilities, switchRole, user } = useApp();
  const { coordinates: userLocation, loading: geoLoading } = useGeolocation();
  
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const filterChips = [
    { id: 'covered', label: 'Covered', icon: Shield },
    { id: 'ev', label: 'EV Charging', icon: Zap },
    { id: '247', label: '24/7', icon: Clock },
    { id: 'premium', label: 'Premium', icon: Star },
  ];

  const filteredFacilities = useMemo(() => {
    if (!Array.isArray(facilities)) return [];
    let filtered = facilities.filter(f => f.is_active !== false); // Ensure active
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.name?.toLowerCase().includes(q) ||
        f.address?.toLowerCase().includes(q)
      );
    }
    
    if (activeFilter === 'ev') filtered = filtered.filter(f => f.amenities?.includes('EV Charging'));
    if (activeFilter === 'covered') filtered = filtered.filter(f => f.amenities?.includes('Covered Parking'));
    
    return filtered;
  }, [facilities, searchQuery, activeFilter]);

  const mapCenter = useMemo((): [number, number] => {
    // Priority 1: User explicitly clicked a facility
    if (selectedFacility?.latitude && selectedFacility?.longitude) {
      return [selectedFacility.latitude, selectedFacility.longitude];
    }
    
    // Priority 2: User's actual location (only on first load or if specifically requested)
    if (userLocation) {
      return userLocation;
    }
    
    // Priority 3: Fallback (Mumbai Default)
    return [19.0760, 72.8777];
  }, [selectedFacility, userLocation]);

  return (
    <div className="relative h-screen w-full bg-white flex overflow-hidden pt-16 md:pt-0">
      
      {/* LEFT SIDEBAR (Desktop) */}
      <aside 
        className={cn(
          "hidden md:flex flex-col relative z-20 bg-white border-r border-gray-100 transition-all duration-500 ease-in-out pt-16",
          isSidebarCollapsed ? "w-0 overflow-hidden" : "w-[420px]"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-50 bg-white/50 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Find Parking</h1>
            <div className="flex gap-2">
               <Badge variant="outline" className="h-6 font-bold text-gray-400 border-gray-100">
                {filteredFacilities.length} Results
               </Badge>
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Search by city or landmark..."
              className="h-12 pl-11 bg-gray-50 border-0 rounded-2xl text-base shadow-inner-sm focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide no-scrollbar">
            {filterChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(activeFilter === chip.id ? null : chip.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  activeFilter === chip.id
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                )}
              >
                <chip.icon className="w-3.5 h-3.5" />
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Results List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 bg-gray-50/30">
          <AnimatePresence mode="popLayout">
            {filteredFacilities.map((facility) => (
              <motion.div
                key={facility.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card 
                  className={cn(
                    "group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-black/5 border-0 rounded-3xl",
                    selectedFacility?.id === facility.id ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-black/[0.03]"
                  )}
                  onClick={() => setSelectedFacility(facility)}
                >
                  <div className="flex p-3 gap-4">
                    <div className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-gray-100">
                      <img
                        src={facility.images?.[0] || facility.image_url || '/placeholder-parking.jpg'}
                        alt={facility.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=400'; }}
                      />
                      <div className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur rounded-lg px-1.5 py-0.5 text-[10px] font-black flex items-center shadow-sm">
                        <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500 mr-1" />
                        {facility.rating || '4.5'}
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1 pr-2">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-primary transition-colors">{facility.name}</h3>
                          <p className="text-xl font-black text-primary">₹60</p>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1 shrink-0" />
                          <span className="truncate">{facility.address || 'Mumbai, India'}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] bg-green-50 text-green-700 border-0">
                            Available Now
                          </Badge>
                          <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] bg-blue-50 text-blue-700 border-0">
                            Verified
                          </Badge>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredFacilities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="font-bold text-gray-900">No results found</h3>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or searching for a broader area.</p>
              <Button variant="outline" className="mt-6 rounded-xl" onClick={() => { setSearchQuery(''); setActiveFilter(null); }}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT SIDE (Map Content) */}
      <main className="flex-1 relative z-0 h-full">
        
        {/* MOBILE TOP BAR (Hidden on Desktop) */}
        <div className="md:hidden absolute top-4 left-4 right-4 z-40">
           <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-2 flex items-center space-x-2 border border-white">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/welcome')}>
              <Search className="w-5 h-5 text-gray-500" />
            </Button>
            <Input
              placeholder="Search place..."
              className="border-0 shadow-none focus-visible:ring-0 text-base font-medium placeholder:text-gray-400 bg-transparent h-10"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Sheet>
               <SheetTrigger asChild>
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm cursor-pointer shadow-lg shadow-primary/20">
                  {user?.name?.charAt(0) || 'U'}
                </div>
               </SheetTrigger>
               <SheetContent side="left" className="w-[300px] border-r-0">
                  <SheetHeader className="text-left px-4 pt-8">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                         {user?.name?.charAt(0) || 'U'}
                       </div>
                       <div>
                         <SheetTitle className="font-bold text-lg">{user?.name || 'User'}</SheetTitle>
                         <SheetDescription className="text-xs text-gray-500 font-medium">Verified Partner</SheetDescription>
                       </div>
                    </div>
                  </SheetHeader>
                  
                  <div className="px-4 mt-4 overflow-y-auto">
                    
                    <div className="space-y-2">
                       <Button variant="ghost" className="w-full justify-start h-12 rounded-xl" onClick={() => navigate('/customer/tickets')}>
                         <Clock className="w-5 h-5 mr-3 text-gray-400" />
                         My Bookings
                       </Button>
                       <Button variant="ghost" className="w-full justify-start h-12 rounded-xl" onClick={() => navigate('/customer/profile')}>
                         <User className="w-5 h-5 mr-3 text-gray-400" />
                         Profile Settings
                       </Button>
                       <div className="h-px bg-gray-100 my-4" />
                       <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-3xl text-white">
                         <h3 className="font-black text-lg mb-1 leading-tight">Become a Partner</h3>
                         <p className="text-[11px] text-blue-100 mb-4 font-medium">Rent out your empty space and earn daily.</p>
                         <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-black rounded-xl" onClick={() => switchRole()}>
                           List your space
                         </Button>
                       </div>
                    </div>
                  </div>
               </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* MAP CONTAINER */}
        <div className="w-full h-full bg-gray-50">
          <MapContainer
            center={mapCenter}
            zoom={14}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <MapController center={mapCenter} />
            
            {/* User Location Marker */}
            {userLocation && (
              <Marker 
                position={userLocation} 
                icon={L.divIcon({
                  className: 'user-marker',
                  html: `
                    <div class="relative">
                      <div class="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                      <div class="relative w-6 h-6 bg-blue-600 border-4 border-white rounded-full shadow-2xl"></div>
                    </div>
                  `,
                  iconAnchor: [12, 12]
                })}
              />
            )}

            {filteredFacilities.map(facility => (
              facility.latitude && facility.longitude && (
                <Marker
                  key={facility.id}
                  position={[facility.latitude, facility.longitude]}
                  icon={createMarkerIcon(selectedFacility?.id === facility.id)}
                  eventHandlers={{
                    click: () => {
                      setSelectedFacility(facility);
                      // On mobile we might want to center the card too
                    },
                  }}
                />
              )
            ))}
          </MapContainer>
        </div>

        {/* FLOATING ACTION OVERLAYS */}
        <div className="absolute right-6 bottom-6 flex flex-col gap-3 z-10">
          <Button 
            className="w-12 h-12 rounded-2xl bg-white text-gray-900 border-0 shadow-2xl hover:bg-gray-50 flex items-center justify-center p-0"
            onClick={() => {
              if (userLocation) setSelectedFacility(null); // This will trigger mapCenter memo to return userLocation
            }}
          >
            <Navigation className="w-5 h-5 text-primary" />
          </Button>
          <div className="flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-none border-b border-gray-100">+</Button>
            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-none">−</Button>
          </div>
        </div>

        {/* FACILITY PREVIEW CARD (Mobile View & Desktop Highlight) */}
        <AnimatePresence>
          {selectedFacility && (
            <motion.div 
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="absolute bottom-6 left-6 right-6 md:left-[50%] md:translate-x-[-50%] md:w-[460px] z-20"
            >
              <Card className="rounded-[40px] shadow-3xl overflow-hidden border-0 bg-white/95 backdrop-blur-2xl ring-1 ring-black/[0.05]">
                <div className="relative h-44 bg-gray-200">
                  <img
                    src={selectedFacility.images?.[0] || selectedFacility.image_url || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=600'}
                    alt={selectedFacility.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 top-0 p-4 flex justify-between">
                     <Badge className="bg-primary/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-3 border-0">
                       Top Rated
                     </Badge>
                     <button
                        className="w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all"
                        onClick={() => setSelectedFacility(null)}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
                </div>

                <div className="p-7">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-4">
                      <h3 className="text-2xl font-black text-gray-900 leading-tight mb-1">{selectedFacility.name}</h3>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-gray-900">4.5</span>
                        <span className="text-xs text-gray-400 font-medium">(2.4k reviews)</span>
                        <span className="text-gray-200">•</span>
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs text-gray-500 font-medium">800m away</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className="text-sm font-bold text-gray-400">₹</span>
                        <span className="text-3xl font-black text-primary tracking-tighter">60</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Per Hour</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-gray-50 flex flex-col items-center justify-center py-2.5 rounded-2xl border border-black/[0.03]">
                      <Shield className="w-4 h-4 text-primary mb-1" />
                      <span className="text-[10px] font-bold text-gray-600">Secure</span>
                    </div>
                    <div className="bg-gray-50 flex flex-col items-center justify-center py-2.5 rounded-2xl border border-black/[0.03]">
                      <Clock className="w-4 h-4 text-primary mb-1" />
                      <span className="text-[10px] font-bold text-gray-600">24/7 Access</span>
                    </div>
                    <div className="bg-gray-50 flex flex-col items-center justify-center py-2.5 rounded-2xl border border-black/[0.03]">
                      <Zap className="w-4 h-4 text-primary mb-1" />
                      <span className="text-[10px] font-bold text-gray-600">Fast Exit</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      variant="outline"
                      className="flex-1 h-14 rounded-2xl border-2 font-black text-gray-600 hover:bg-gray-50"
                      onClick={() => navigate(`/customer/facility/${selectedFacility.id}`)}
                    >
                      Details
                    </Button>
                    <Button
                      className="flex-[2] h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/30"
                      onClick={() => navigate(`/customer/facility/${selectedFacility.id}`)}
                    >
                      Reserve Spot
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

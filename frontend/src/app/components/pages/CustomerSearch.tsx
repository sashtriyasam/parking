import { useState, useMemo, useEffect, useRef } from 'react';
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
  Info,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { useApp } from '@/context/AppContext';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/app/components/ui/sheet';
import { useGeolocation } from '@/hooks/useGeolocation';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Facility } from '@/types';
import { toast } from 'sonner';

// Fix for default marker icon
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const USER_LOCATION_ICON = L.divIcon({
  className: 'user-marker',
  html: `
      <div class="relative">
        <div class="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
        <div class="relative w-6 h-6 bg-blue-600 border-4 border-white rounded-full shadow-2xl"></div>
      </div>
    `,
  iconAnchor: [12, 12]
});

// Premium Custom Marker Icons using Theme variables
const ACTIVE_MARKER_ICON = L.divIcon({
  className: 'custom-marker',
  html: `
    <div class="relative group cursor-pointer">
      <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary/20 rounded-full blur-sm transition-all duration-300 scale-150"></div>
      <div class="relative w-8 h-8 bg-card rounded-lg flex items-center justify-center shadow-md border-2 border-primary ring-4 ring-primary/20 -translate-y-2 text-primary transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const INACTIVE_MARKER_ICON = L.divIcon({
  className: 'custom-marker',
  html: `
    <div class="relative group cursor-pointer">
      <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-muted/20 rounded-full blur-sm transition-all duration-300"></div>
      <div class="relative w-8 h-8 bg-card rounded-lg flex items-center justify-center shadow-md border-2 border-border text-foreground transition-all hover:-translate-y-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const getMarkerIcon = (isActive: boolean) => isActive ? ACTIVE_MARKER_ICON : INACTIVE_MARKER_ICON;

const getAmenityFeatures = (amenities?: string[]) => {
  const amenityMap: Record<string, { icon: any, label: string }> = {
    'CCTV': { icon: Shield, label: 'Secure' },
    'Security': { icon: Shield, label: 'Secure' },
    '24/7': { icon: Clock, label: '24/7 Access' },
    'EV Charging': { icon: Zap, label: 'EV Ready' },
    'Valet': { icon: Zap, label: 'Valet' },
    'Covered': { icon: Shield, label: 'Inside' }
  };

  if (!amenities || amenities.length === 0) {
    return [
      { icon: Shield, label: 'Secure' },
      { icon: Clock, label: '24/7 Access' },
      { icon: Zap, label: 'Fast Exit' }
    ];
  }

  return amenities.slice(0, 3).map(name => {
    const matched = amenityMap[name] || Object.entries(amenityMap).find(([key]) => name.includes(key))?.[1];
    return matched || { icon: Zap, label: name };
  });
};

export function CustomerSearch() {
  const navigate = useNavigate();
  const { facilities, switchRole, user, theme } = useApp();
  const { coordinates: userLocation, loading: geoLoading, permissionDenied: geoDenied } = useGeolocation();
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filterChips = [
    { id: 'covered', label: 'Covered', icon: Shield },
    { id: 'ev', label: 'EV Charging', icon: Zap },
    { id: '247', label: '24/7', icon: Clock },
    { id: 'premium', label: 'Premium', icon: Star },
  ];

  const filteredFacilities = useMemo(() => {
    if (!Array.isArray(facilities)) return [];
    let filtered = facilities.filter(f => f.isActive !== false); // Ensure active

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.name?.toLowerCase().includes(q) ||
        f.address?.toLowerCase().includes(q)
      );
    }

    if (activeFilter === 'ev') filtered = filtered.filter(f => f.amenities?.includes('EV Charging'));
    if (activeFilter === 'covered') filtered = filtered.filter(f => f.amenities?.includes('Covered Parking'));
    if (activeFilter === '247') filtered = filtered.filter(f => f.is24_7 === true || f.amenities?.includes('24/7'));
    if (activeFilter === 'premium') filtered = filtered.filter(f => f.isPremium === true || f.tier === 'premium' || f.amenities?.includes('Premium'));

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

  const formatReviewCount = (facility: Facility) => {
    if (facility.reviewCountSummary) return facility.reviewCountSummary;
    if (facility.reviewCount) {
      return facility.reviewCount >= 1000
        ? `${(facility.reviewCount / 1000).toFixed(1)}k`
        : facility.reviewCount.toString();
    }
    return '2.4k';
  };

  const getDistanceText = (facility: Facility) => {
    if (typeof facility.distance === 'number') {
      return facility.distance < 1
        ? `${(facility.distance * 1000).toFixed(0)}m away`
        : `${facility.distance.toFixed(1)}km away`;
    }
    if (userLocation && facility.latitude && facility.longitude) {
      const distMeters = L.latLng(userLocation[0], userLocation[1]).distanceTo(L.latLng(facility.latitude, facility.longitude));
      return distMeters < 1000
        ? `${distMeters.toFixed(0)}m away`
        : `${(distMeters / 1000).toFixed(1)}km away`;
    }
    return 'Distance unknown';
  };

  // Determine dynamic map tiles based on theme
  const tileUrl = theme === 'dark'
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const facilityMarkersRef = useRef<Record<string, L.Marker>>({});

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: mapCenter,
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });
    mapInstanceRef.current = map;
    setMapInstance(map);

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      setMapInstance(null);
      tileLayerRef.current = null;
      userMarkerRef.current = null;
      facilityMarkersRef.current = {};
    };
  }, []);

  // Update tile layer URL dynamically if theme/tileUrl changes
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileUrl);
    }
  }, [tileUrl]);

  // Handle map flight to center
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo(mapCenter, 15, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [mapCenter]);

  // Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(userLocation);
      } else {
        userMarkerRef.current = L.marker(userLocation, {
          icon: USER_LOCATION_ICON
        }).addTo(map);
      }
    } else {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    }
  }, [userLocation]);

  // Update Facility Markers
  // Stable ref to avoid closure issues with setSelectedFacility
  const setSelectedFacilityRef = useRef(setSelectedFacility);
  useEffect(() => {
    setSelectedFacilityRef.current = setSelectedFacility;
  }, [setSelectedFacility]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkers = facilityMarkersRef.current;
    const newMarkers: Record<string, L.Marker> = {};

    filteredFacilities.forEach(facility => {
      if (!facility.latitude || !facility.longitude) return;
      const id = facility.id.toString();
      const pos: [number, number] = [facility.latitude, facility.longitude];
      const isSelected = selectedFacility?.id === facility.id;
      const markerIcon = getMarkerIcon(isSelected);

      if (currentMarkers[id]) {
        const marker = currentMarkers[id];
        marker.setLatLng(pos);
        marker.setIcon(markerIcon);
        newMarkers[id] = marker;

        marker.off('click');
        marker.on('click', () => {
          setSelectedFacilityRef.current(facility);
        });
      } else {
        const marker = L.marker(pos, { icon: markerIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedFacilityRef.current(facility);
        });
        newMarkers[id] = marker;
      }
    });

    // Clean up markers that are no longer present
    Object.keys(currentMarkers).forEach(id => {
      if (!newMarkers[id]) {
        currentMarkers[id].remove();
      }
    });

    facilityMarkersRef.current = newMarkers;
  }, [filteredFacilities, selectedFacility]);

  return (
    <div className="relative h-screen w-full bg-background text-foreground flex overflow-hidden pt-16 md:pt-0 transition-colors duration-300">

      {/* LEFT SIDEBAR (Desktop) */}
      <aside
        className={cn(
          "hidden md:flex flex-col relative z-20 bg-background border-r border-border transition-all duration-500 ease-in-out pt-16",
          isSidebarCollapsed ? "w-0 overflow-hidden" : "w-[420px]"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border bg-background/50 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">Find Parking</h1>
            <div className="flex gap-2">
              <Badge variant="outline" className="h-6 font-bold text-muted-foreground border-border mr-2">
                {filteredFacilities.length} Results
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarCollapsed(true)}
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-all"
              >
                <PanelLeftClose className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Search by city or landmark..."
              value={searchQuery}
              className="h-12 pl-11 bg-input-background border-border rounded-md text-base focus-visible:ring-2 focus-visible:ring-primary/20 transition-all text-foreground"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide no-scrollbar">
            {filterChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(activeFilter === chip.id ? null : chip.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap",
                  activeFilter === chip.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                <chip.icon className="w-3.5 h-3.5" />
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Geolocation blocked banner */}
        {geoDenied && (
          <div className="mx-4 mt-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <Info className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-destructive">Location blocked</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Click the settings icon next to the URL bar → Site Settings → Location → Allow, then refresh.
              </p>
            </div>
          </div>
        )}

        {/* Sidebar Results List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 bg-muted/10">
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
                    "group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-md border border-border bg-card text-card-foreground rounded-lg",
                    selectedFacility?.id === facility.id ? "ring-2 ring-primary" : ""
                  )}
                  onClick={() => setSelectedFacility(facility)}
                >
                  <div className="flex p-3 gap-4">
                    <div className="relative w-28 h-28 shrink-0 rounded-md overflow-hidden bg-muted">
                      <img
                        src={facility.images?.[0] || facility.image_url || '/placeholder-parking.jpg'}
                        alt={facility.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=400'; }}
                      />
                      <div className="absolute top-1.5 right-1.5 bg-background/90 backdrop-blur rounded px-1.5 py-0.5 text-[10px] font-bold flex items-center shadow-sm text-foreground">
                        <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500 mr-1" />
                        {facility.rating ?? 4.5}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-1 pr-2">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-foreground text-base leading-tight group-hover:text-primary transition-colors font-display">{facility.name}</h3>
                          <p className="text-lg font-bold text-primary">{facility.currency ?? '₹'}{facility.hourlyRate ?? 60}</p>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1 shrink-0" />
                          <span className="truncate">{facility.address || 'Mumbai, India'}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-2">
                          {(facility.availableSlots ?? 0) > 0 && (
                            <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] bg-[#34C759]/10 text-[#34C759] border-0">
                              Available
                            </Badge>
                          )}
                          {facility.verified && (
                            <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] bg-primary/10 text-primary border-0">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredFacilities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground font-display">No results found</h3>
              <p className="text-sm text-muted-foreground mt-2 font-sans">Try adjusting your filters or searching for a broader area.</p>
              <Button variant="outline" className="mt-6 rounded-md border-border bg-card text-foreground" onClick={() => { setSearchQuery(''); setActiveFilter(null); }}>
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
          <div className="bg-background/90 backdrop-blur-xl rounded-md shadow-lg p-2 flex items-center space-x-2 border border-border">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground"
              onClick={() => searchInputRef.current?.focus()}
            >
              <Search className="w-5 h-5" />
            </Button>
            <Input
              ref={searchInputRef}
              placeholder="Search place..."
              value={searchQuery}
              className="border-0 shadow-none focus-visible:ring-0 text-base font-medium placeholder:text-muted-foreground bg-transparent h-10 text-foreground"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Sheet>
              <SheetTrigger asChild>
                <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm cursor-pointer shadow-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] border-r-0 bg-background text-foreground">
                <SheetHeader className="text-left px-4 pt-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xl font-display">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <SheetTitle className="font-bold text-lg text-foreground font-display">{user?.name || 'User'}</SheetTitle>
                      <SheetDescription className="text-xs text-muted-foreground font-medium font-sans">Verified Customer</SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <div className="px-4 mt-4 overflow-y-auto">
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start h-12 rounded-md hover:bg-secondary text-foreground" onClick={() => navigate('/customer/tickets')}>
                      <Clock className="w-5 h-5 mr-3 text-muted-foreground" />
                      My Bookings
                    </Button>
                    <Button variant="ghost" className="w-full justify-start h-12 rounded-md hover:bg-secondary text-foreground" onClick={() => navigate('/customer/profile')}>
                      <User className="w-5 h-5 mr-3 text-muted-foreground" />
                      Profile Settings
                    </Button>
                    <div className="h-px bg-border my-4" />
                    <div className="bg-primary/10 border border-primary/20 p-5 rounded-lg text-foreground">
                      <h3 className="font-bold text-base mb-1 leading-tight font-display text-primary">Become a Partner</h3>
                      <p className="text-[11px] text-muted-foreground mb-4 font-medium font-sans">Rent out your empty space and earn daily.</p>
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/95 font-bold rounded-md" onClick={() => switchRole()}>
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
        <div className="w-full h-full bg-muted relative">

          {/* Sidebar Expand Button (Floating) */}
          <AnimatePresence>
            {isSidebarCollapsed && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="absolute top-24 left-6 z-30"
              >
                <Button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="h-12 w-12 bg-card text-foreground border border-border shadow-md hover:bg-secondary rounded-md flex items-center justify-center p-0 transition-all"
                >
                  <PanelLeftOpen className="w-6 h-6 text-primary" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <div
            ref={mapContainerRef}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          />
        </div>

        {/* FLOATING ACTION OVERLAYS */}
        <div className="absolute right-6 bottom-24 md:bottom-8 flex flex-col gap-3 z-10">
          <Button
            className="w-12 h-12 rounded-md bg-card text-foreground border border-border shadow-md hover:bg-secondary flex items-center justify-center p-0"
            onClick={() => {
              if (userLocation) {
                setSelectedFacility(null);
              } else {
                toast.error('Location not available. Please enable location services.');
              }
            }}
          >
            <Navigation className="w-5 h-5 text-primary" />
          </Button>
          <div className="flex flex-col bg-card rounded-md border border-border shadow-md overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-none border-b border-border text-foreground hover:bg-secondary"
              onClick={() => mapInstance?.zoomIn()}
            >+
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-none text-foreground hover:bg-secondary"
              onClick={() => mapInstance?.zoomOut()}
            >−
            </Button>
          </div>
        </div>

        {/* FACILITY PREVIEW CARD (Mobile View & Desktop Highlight) */}
        <AnimatePresence>
          {selectedFacility && (
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="absolute bottom-24 md:bottom-8 left-6 right-6 md:left-[50%] md:translate-x-[-50%] md:w-[460px] z-20"
            >
              <Card className="rounded-lg shadow-lg overflow-hidden border border-border bg-card/95 backdrop-blur-2xl text-card-foreground">
                <div className="relative h-44 bg-muted">
                  <img
                    src={selectedFacility.images?.[0] || selectedFacility.image_url || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=600'}
                    alt={selectedFacility.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 top-0 p-4 flex justify-between">
                    <Badge className="bg-primary/95 text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 border-0 rounded-md">
                      Top Rated
                    </Badge>
                    <button
                      className="w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-all"
                      onClick={() => setSelectedFacility(null)}
                      aria-label="Close facility details"
                      title="Close"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-4">
                      <h3 className="text-xl font-bold text-foreground leading-tight mb-1 font-display">{selectedFacility.name}</h3>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-foreground">{selectedFacility.rating ?? 4.5}</span>
                        <span className="text-xs text-muted-foreground font-medium">({formatReviewCount(selectedFacility)} reviews)</span>
                        <span className="text-muted-foreground">•</span>
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs text-muted-foreground font-medium">
                          {getDistanceText(selectedFacility)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-baseline justify-end gap-0.5">
                        <span className="text-sm font-bold text-muted-foreground">{selectedFacility.currency ?? '₹'}</span>
                        <span className="text-2xl font-bold text-primary tracking-tighter">{selectedFacility.hourlyRate ?? 60}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Per Hour</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {getAmenityFeatures(selectedFacility.amenities).map((feature, idx) => (
                      <div key={idx} className="bg-secondary flex flex-col items-center justify-center py-2 rounded-md border border-border">
                        <feature.icon className="w-4 h-4 text-primary mb-1" />
                        <span className="text-[10px] font-bold text-muted-foreground truncate px-1 w-full text-center">
                          {feature.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-md border border-border text-foreground hover:bg-secondary font-bold text-sm"
                      onClick={() => navigate(`/customer/facility/${selectedFacility.id}`)}
                    >
                      Details
                    </Button>
                    <Button
                      className="flex-[2] h-12 rounded-md bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-sm shadow-sm"
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


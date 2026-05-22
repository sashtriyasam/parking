import { useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';

// Fix for default marker icon (Leaflet icon paths often break in build tools)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Set global default icon
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
    lat: number | null;
    lng: number | null;
    onChange: (lat: number | null, lng: number | null) => void;
}

const MUMBAI_CENTER: [number, number] = [19.0760, 72.8777];

export function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const isFirstRenderRef = useRef(true);

    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const position = useMemo((): [number, number] => {
        // Use explicit null check to allow 0 coordinates
        if (lat == null || lng == null) {
            return MUMBAI_CENTER;
        }
        return [lat, lng];
    }, [lat, lng]);

    // Initialize map and marker
    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: position,
            zoom: 15,
            zoomControl: false,
            attributionControl: false
        });
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        const marker = L.marker(position, {
            draggable: true,
            icon: DefaultIcon
        }).addTo(map);
        markerRef.current = marker;

        marker.on('dragend', (e) => {
            const newPos = e.target.getLatLng();
            onChangeRef.current(newPos.lat, newPos.lng);
        });

        map.on('click', (e) => {
            onChangeRef.current(e.latlng.lat, e.latlng.lng);
        });

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            markerRef.current = null;
        };
    }, []);

    // Update map view and marker position when `position` prop changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        const marker = markerRef.current;
        if (!map || !marker) return;

        marker.setLatLng(position);

        const isMumbaiFallback = position[0] === MUMBAI_CENTER[0] && position[1] === MUMBAI_CENTER[1];
        if (!isMumbaiFallback || isFirstRenderRef.current) {
            map.setView(position, map.getZoom() || 15);
            isFirstRenderRef.current = false;
        }
    }, [position]);

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                onChange(pos.coords.latitude, pos.coords.longitude);
                toast.success("Current location found");
            },
            (err) => {
                console.error("Geolocation error:", err);
                let message = "Failed to get location";
                if (err.code === 1) message = "Location permission denied";
                else if (err.code === 3) message = "Location request timed out";
                toast.error(message);
            },
            { 
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                <div className="flex items-center text-[10px] font-mono text-gray-500" title={lat == null ? "Location not set" : `Coordinates: ${lat}, ${lng}`}>
                    <MapPin className="w-3 h-3 mr-1 text-primary" />
                    <span>{lat != null ? lat.toFixed(6) : '--'}, {lng != null ? lng.toFixed(6) : '--'}</span>
                </div>
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] px-2 py-0 bg-white"
                    onClick={handleLocateMe}
                >
                    <Navigation className="w-3 h-3 mr-1" />
                    My Location
                </Button>
            </div>
            
            <div className="h-[220px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm relative transition-all duration-300 hover:ring-2 hover:ring-primary/10">
                <div ref={mapContainerRef} className="h-full w-full z-0" />
            </div>
            <div className="flex justify-between items-center px-1">
                <p className="text-[9px] text-gray-400">
                    * Drag pin or click map to refine location
                </p>
                <div className="flex space-x-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-[9px] text-gray-400 capitalize">Live Preview</span>
                </div>
            </div>
        </div>
    );
}

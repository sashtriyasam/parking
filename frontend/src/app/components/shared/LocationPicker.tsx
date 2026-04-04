import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

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
    onChange: (lat: number, lng: number) => void;
}

const MUMBAI_CENTER: [number, number] = [19.0760, 72.8777];

// Internal component to handle map movement
function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        // Only set view if not Mumbai fallback (or if map just loaded)
        const isMumbaiFallback = center[0] === MUMBAI_CENTER[0] && center[1] === MUMBAI_CENTER[1];
        if (!isMumbaiFallback || map.getZoom() === 0) {
            map.setView(center, map.getZoom() || 15);
        }
    }, [center, map]);
    return null;
}

// Internal component to handle clicks
function LocationEvents({ onLocationSelected }: { onLocationSelected: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelected(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
    const position = useMemo((): [number, number] => {
        // Use explicit null check to allow 0 coordinates
        if (lat == null || lng == null) {
            return MUMBAI_CENTER;
        }
        return [lat, lng];
    }, [lat, lng]);

    const handleLocateMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    onChange(pos.coords.latitude, pos.coords.longitude);
                },
                (err) => {
                    console.error("Geolocation error:", err);
                },
                { enableHighAccuracy: true }
            );
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                <div className="flex items-center text-[10px] font-mono text-gray-500">
                    <MapPin className="w-3 h-3 mr-1 text-primary" />
                    <span>{lat != null ? lat.toFixed(6) : '0.000000'}, {lng != null ? lng.toFixed(6) : '0.000000'}</span>
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
                <MapContainer
                    center={position}
                    zoom={15}
                    zoomControl={false}
                    className="z-0 h-full w-full"
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <Marker 
                        position={position} 
                        draggable={true}
                        eventHandlers={{
                            dragend: (e) => {
                                const marker = e.target;
                                const newPos = marker.getLatLng();
                                onChange(newPos.lat, newPos.lng);
                            },
                        }}
                    />
                    <MapController center={position} />
                    <LocationEvents onLocationSelected={onChange} />
                </MapContainer>
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

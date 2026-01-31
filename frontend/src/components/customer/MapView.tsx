import { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import type { ParkingFacility } from '../../types';
import { IndianRupee, MapPin } from 'lucide-react';

interface MapViewProps {
    facilities: ParkingFacility[];
    center: { lat: number; lng: number };
}

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

export function MapView({ facilities, center }: MapViewProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: ['places'],
    });

    const [selected, setSelected] = useState<ParkingFacility | null>(null);

    const onUnmount = useCallback(function callback() {
        // Cleanup if needed
    }, []);

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-2"></div>
                    <p className="text-gray-500">Loading Map...</p>
                </div>
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={14}
            onUnmount={onUnmount}
            options={{
                styles: mapStyles,
                disableDefaultUI: false,
                zoomControl: true,
            }}
        >
            {facilities.map((facility) => (
                <Marker
                    key={facility.id}
                    position={{
                        lat: Number(facility.latitude),
                        lng: Number(facility.longitude),
                    }}
                    onClick={() => setSelected(facility)}
                    icon={{
                        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    }}
                />
            ))}

            {selected && (
                <InfoWindow
                    position={{
                        lat: Number(selected.latitude),
                        lng: Number(selected.longitude),
                    }}
                    onCloseClick={() => setSelected(null)}
                >
                    <div className="p-2 min-w-[200px]">
                        <h4 className="font-bold text-gray-900 mb-1">{selected.name}</h4>
                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
                            <MapPin className="w-3 h-3" />
                            <span>{selected.address}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-0.5 text-primary font-bold">
                                <IndianRupee className="w-3 h-3" />
                                <span>{selected.pricing?.hourly_rate}/hr</span>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selected.total_available && selected.total_available > 0
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                {selected.total_available || 0} slots
                            </span>
                        </div>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
}

const mapStyles = [
    {
        "featureType": "poi",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "transit",
        "stylers": [{ "visibility": "simplified" }]
    }
];

import { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, MarkerClusterer } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import type { ParkingFacility } from '../../types';
import { IndianRupee, MapPin, Star, Navigation, ArrowRight } from 'lucide-react';

interface MapViewProps {
    facilities: ParkingFacility[];
    center: { lat: number; lng: number };
}

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

export function MapView({ facilities, center }: MapViewProps) {
    const navigate = useNavigate();
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
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-[40px]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-[5px] border-indigo-600 border-t-transparent shadow-lg mb-4"></div>
                    <p className="text-indigo-900 font-black uppercase tracking-widest text-xs">Calibrating Map...</p>
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
                clickableIcons: false,
            }}
        >
            <MarkerClusterer>
                {(clusterer) => (
                    <>
                        {facilities.map((facility) => (
                            <Marker
                                key={facility.id}
                                position={{
                                    lat: Number(facility.latitude),
                                    lng: Number(facility.longitude),
                                }}
                                clusterer={clusterer}
                                onClick={() => setSelected(facility)}
                                icon={{
                                    url: facility.total_available && facility.total_available > 0
                                        ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                                        : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                                    scaledSize: new google.maps.Size(40, 40),
                                }}
                            />
                        ))}
                    </>
                )}
            </MarkerClusterer>

            {selected && (
                <InfoWindow
                    position={{
                        lat: Number(selected.latitude),
                        lng: Number(selected.longitude),
                    }}
                    onCloseClick={() => setSelected(null)}
                >
                    <div className="p-4 min-w-[280px] max-w-[320px] bg-white rounded-3xl overflow-hidden shadow-none">
                        <div className="relative h-32 -mx-4 -mt-4 mb-4 bg-gray-100 overflow-hidden">
                            <img
                                src={selected.image_url || 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80'}
                                alt={selected.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> 4.5
                            </div>
                        </div>

                        <h4 className="font-black text-gray-900 text-lg mb-1 leading-tight">{selected.name}</h4>
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4 font-bold">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{selected.address}</span>
                        </div>

                        <div className="flex items-center justify-between gap-4 py-3 border-y border-gray-50 mb-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Rate</span>
                                <div className="flex items-center text-indigo-600 font-black text-lg">
                                    <IndianRupee className="w-3 h-3" />
                                    {selected.pricing?.hourly_rate || '40'}
                                    <span className="text-[10px] ml-0.5">/hr</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Available</span>
                                <span className={`text-sm font-black ${selected.total_available && selected.total_available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {selected.total_available || 0} Slots
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => navigate(`/customer/facility/${selected.id}`)}
                                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                            >
                                Details <ArrowRight className="w-3 h-3" />
                            </button>
                            <button className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                <Navigation className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
}

const mapStyles = [
    {
        "featureType": "all",
        "elementType": "geometry.fill",
        "stylers": [{ "weight": "2.00" }]
    },
    {
        "featureType": "all",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#9c9c9c" }]
    },
    {
        "featureType": "all",
        "elementType": "labels.text",
        "stylers": [{ "visibility": "on" }]
    },
    {
        "featureType": "landscape",
        "elementType": "all",
        "stylers": [{ "color": "#f2f2f2" }]
    },
    {
        "featureType": "landscape",
        "elementType": "geometry.fill",
        "stylers": [{ "color": "#ffffff" }]
    },
    {
        "featureType": "landscape.man_made",
        "elementType": "geometry.fill",
        "stylers": [{ "color": "#ffffff" }]
    },
    {
        "featureType": "poi",
        "elementType": "all",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "road",
        "elementType": "all",
        "stylers": [{ "saturation": -100 }, { "lightness": 45 }]
    },
    {
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [{ "color": "#eeeeee" }]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#7b7b7b" }]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#ffffff" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "all",
        "stylers": [{ "visibility": "simplified" }]
    },
    {
        "featureType": "road.arterial",
        "elementType": "labels.icon",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "transit",
        "elementType": "all",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "water",
        "elementType": "all",
        "stylers": [{ "color": "#46bcec" }, { "visibility": "on" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [{ "color": "#c8d7d4" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#070707" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#ffffff" }]
    }
];

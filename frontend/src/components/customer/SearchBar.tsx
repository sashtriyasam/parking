import { useState, useRef } from 'react';
import { Search, MapPin, Car } from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import type { VehicleType } from '../../types';

interface SearchBarProps {
    onSearch: (location: { lat: number; lng: number; address: string }, vehicleType: VehicleType | '') => void;
    compact?: boolean;
}

const libraries: any = ['places'];

export function SearchBar({ onSearch, compact = false }: SearchBarProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
    });

    const [address, setAddress] = useState('');
    const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const onPlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const formattedAddress = place.formatted_address || address;
                setAddress(formattedAddress);
                onSearch({ lat, lng, address: formattedAddress }, vehicleType);
            }
        }
    };

    const handleSearch = () => {
        // Fallback for manual typed address if no place selected via autocomplete
        const defaultLocation = {
            lat: 19.0760,
            lng: 72.8777,
            address: address || 'Mumbai, India',
        };
        onSearch(defaultLocation, vehicleType);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    if (!isLoaded) {
        return (
            <div className={`h-[56px] animate-pulse bg-gray-200 rounded-lg ${compact ? 'w-full' : 'w-full max-w-4xl'}`} />
        );
    }

    return (
        <div className={`flex flex-col md:flex-row gap-3 ${compact ? 'w-full' : 'w-full max-w-4xl'}`}>
            {/* Location Input */}
            <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <Autocomplete
                    onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                    onPlaceChanged={onPlaceChanged}
                >
                    <input
                        type="text"
                        placeholder="Search for a location..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </Autocomplete>
            </div>

            {/* Vehicle Type Selector */}
            <div className="relative min-w-[200px]">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType | '')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
                >
                    <option value="">All Vehicles</option>
                    <option value="BIKE">Bike</option>
                    <option value="SCOOTER">Scooter</option>
                    <option value="CAR">Car</option>
                    <option value="TRUCK">Truck</option>
                </select>
            </div>

            {/* Search Button */}
            <button
                onClick={handleSearch}
                className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors"
            >
                <Search className="w-5 h-5" />
                {!compact && <span>Find Parking</span>}
            </button>
        </div>
    );
}

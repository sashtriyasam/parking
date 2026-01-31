import { create } from 'zustand';
import type { VehicleType } from '../types';

interface SearchFilters {
    location: { lat: number; lng: number; address: string } | null;
    radius: number;
    vehicleType: VehicleType | '';
    priceRange: [number, number];
    features: string[];
    sortBy: 'distance' | 'price_asc' | 'price_desc' | 'availability';
}

interface SearchState {
    filters: SearchFilters;
    viewMode: 'grid' | 'map';
    selectedFacilityId: string | null;
    setFilters: (filters: Partial<SearchFilters>) => void;
    setViewMode: (mode: 'grid' | 'map') => void;
    setSelectedFacility: (id: string | null) => void;
    resetFilters: () => void;
}

const initialFilters: SearchFilters = {
    location: null,
    radius: 5,
    vehicleType: '',
    priceRange: [0, 1000],
    features: [],
    sortBy: 'distance',
};

export const useSearchStore = create<SearchState>((set) => ({
    filters: initialFilters,
    viewMode: 'grid',
    selectedFacilityId: null,
    setFilters: (newFilters) =>
        set((state) => ({ filters: { ...state.filters, ...newFilters } })),
    setViewMode: (mode) => set({ viewMode: mode }),
    setSelectedFacility: (id) => set({ selectedFacilityId: id }),
    resetFilters: () => set({ filters: initialFilters }),
}));

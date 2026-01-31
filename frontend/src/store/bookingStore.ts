import { create } from 'zustand';
import type { ParkingFacility, ParkingSlot } from '../types';

interface BookingState {
    selectedFacility: ParkingFacility | null;
    selectedSlot: ParkingSlot | null;
    reservationId: string | null;
    setFacility: (facility: ParkingFacility) => void;
    setSlot: (slot: ParkingSlot) => void;
    setReservation: (reservationId: string) => void;
    clearBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    selectedFacility: null,
    selectedSlot: null,
    reservationId: null,
    setFacility: (facility) => set({ selectedFacility: facility }),
    setSlot: (slot) => set({ selectedSlot: slot }),
    setReservation: (reservationId) => set({ reservationId }),
    clearBooking: () => set({ selectedFacility: null, selectedSlot: null, reservationId: null }),
}));

import { create } from 'zustand';
import type { ParkingFacility, ParkingSlot, VehicleType } from '../types';

export interface VehicleDetails {
    vehicle_type: VehicleType;
    vehicle_number: string;
    save_to_profile?: boolean;
}

export interface BookingDetails {
    facility: ParkingFacility;
    slot: ParkingSlot;
    entry_time: string;
    duration: number; // in hours
    total_fee: number;
    base_fee: number;
    gst: number;
}

export type PaymentMethod = 'CARD' | 'UPI' | 'WALLET' | 'PAY_AT_EXIT';
export type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';

interface BookingFlowState {
    // Current state
    currentStep: 1 | 2 | 3 | 4;
    facilityId: string | null;
    slotId: string | null;
    vehicleDetails: VehicleDetails | null;
    bookingDetails: BookingDetails | null;

    // Payment
    paymentMethod: PaymentMethod | null;
    paymentStatus: PaymentStatus;
    reservationId: string | null;
    ticketId: string | null;

    // Error handling
    error: string | null;

    // Actions
    setStep: (step: 1 | 2 | 3 | 4) => void;
    setFacilityAndSlot: (facilityId: string, slotId: string) => void;
    setVehicleDetails: (details: VehicleDetails) => void;
    setBookingDetails: (details: BookingDetails) => void;
    setPaymentMethod: (method: PaymentMethod) => void;
    setPaymentStatus: (status: PaymentStatus) => void;
    setReservationId: (id: string) => void;
    setTicketId: (id: string) => void;
    setError: (error: string | null) => void;
    resetFlow: () => void;
    goToNextStep: () => void;
    goToPreviousStep: () => void;
}

const initialState = {
    currentStep: 1 as 1 | 2 | 3 | 4,
    facilityId: null,
    slotId: null,
    vehicleDetails: null,
    bookingDetails: null,
    paymentMethod: null,
    paymentStatus: 'idle' as PaymentStatus,
    reservationId: null,
    ticketId: null,
    error: null,
};

export const useBookingFlowStore = create<BookingFlowState>((set, get) => ({
    ...initialState,

    setStep: (step) => set({ currentStep: step }),

    setFacilityAndSlot: (facilityId, slotId) => set({ facilityId, slotId }),

    setVehicleDetails: (details) => set({ vehicleDetails: details }),

    setBookingDetails: (details) => set({ bookingDetails: details }),

    setPaymentMethod: (method) => set({ paymentMethod: method }),

    setPaymentStatus: (status) => set({ paymentStatus: status }),

    setReservationId: (id) => set({ reservationId: id }),

    setTicketId: (id) => set({ ticketId: id }),

    setError: (error) => set({ error }),

    resetFlow: () => set(initialState),

    goToNextStep: () => {
        const { currentStep } = get();
        if (currentStep < 4) {
            set({ currentStep: (currentStep + 1) as 1 | 2 | 3 | 4 });
        }
    },

    goToPreviousStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
            set({ currentStep: (currentStep - 1) as 1 | 2 | 3 | 4 });
        }
    },
}));

import { create } from 'zustand';
import type { Ticket } from '../types';

interface TicketsState {
    // Selected ticket for detail modal
    selectedTicket: Ticket | null;
    setSelectedTicket: (ticket: Ticket | null) => void;

    // Modal states
    isDetailModalOpen: boolean;
    isExtendModalOpen: boolean;
    openDetailModal: (ticket: Ticket) => void;
    closeDetailModal: () => void;
    openExtendModal: (ticket: Ticket) => void;
    closeExtendModal: () => void;

    // Filters
    filters: {
        dateRange: { start: string | null; end: string | null };
        facilityId: string | null;
        vehicleType: string | null;
        sortBy: 'date' | 'facility' | 'amount';
        sortOrder: 'asc' | 'desc';
    };
    setFilters: (filters: Partial<TicketsState['filters']>) => void;
    resetFilters: () => void;

    // Active tab
    activeTab: 'active' | 'upcoming' | 'past' | 'cancelled';
    setActiveTab: (tab: TicketsState['activeTab']) => void;
}

const defaultFilters = {
    dateRange: { start: null, end: null },
    facilityId: null,
    vehicleType: null,
    sortBy: 'date' as const,
    sortOrder: 'desc' as const,
};

export const useTicketsStore = create<TicketsState>((set) => ({
    // Selected ticket
    selectedTicket: null,
    setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),

    // Modals
    isDetailModalOpen: false,
    isExtendModalOpen: false,
    openDetailModal: (ticket) => set({ selectedTicket: ticket, isDetailModalOpen: true }),
    closeDetailModal: () => set({ isDetailModalOpen: false, selectedTicket: null }),
    openExtendModal: (ticket) => set({ selectedTicket: ticket, isExtendModalOpen: true }),
    closeExtendModal: () => set({ isExtendModalOpen: false }),

    // Filters
    filters: defaultFilters,
    setFilters: (newFilters) =>
        set((state) => ({
            filters: { ...state.filters, ...newFilters },
        })),
    resetFilters: () => set({ filters: defaultFilters }),

    // Active tab
    activeTab: 'active',
    setActiveTab: (tab) => set({ activeTab: tab }),
}));

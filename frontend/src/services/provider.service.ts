import apiClient from './api';

export interface DashboardStats {
    today_revenue: number;
    revenue_change_percent: number;
    active_bookings: number;
    total_slots: number;
    occupancy_rate: number;
}

export interface RevenueData {
    date: string;
    revenue: number;
    car: number;
    bike: number;
    scooter: number;
    truck: number;
}

export interface Facility {
    id: string;
    name: string;
    address: string;
    city: string;
    operating_hours: string;
    total_floors: number;
    image_url?: string;
    latitude?: number;
    longitude?: number;
    contact_number?: string;
    description?: string;
    // Computed fields from backend usually
    _count?: {
        parking_slots?: number;
    };
    slots?: number; // fallback
    occupancy?: number;
    revenue?: number;
}

export interface OccupancyData {
    floor_id: string;
    floor_number: number;
    total_slots: number;
    occupied_slots: number;
    occupancy_rate: number;
}

export interface RecentBooking {
    id: string;
    ticket_id: string;
    customer_name: string;
    vehicle_type: string;
    vehicle_number: string;
    slot_number: string;
    entry_time: string;
    status: string;
    amount: number;
}

export const providerService = {
    // Dashboard Stats
    getDashboardStats: async (): Promise<DashboardStats> => {
        const response = await apiClient.get('/provider/dashboard/stats');
        return response.data.data;
    },

    getRevenueData: async (period: string = '7d'): Promise<RevenueData[]> => {
        const response = await apiClient.get(`/provider/dashboard/revenue?period=${period}`);
        return response.data.data || response.data;
    },

    getOccupancyData: async (): Promise<OccupancyData[]> => {
        const response = await apiClient.get('/provider/dashboard/occupancy');
        return response.data.data;
    },

    getRecentBookings: async (limit: number = 10): Promise<RecentBooking[]> => {
        const response = await apiClient.get(`/provider/dashboard/recent-bookings?limit=${limit}`);
        return response.data.data;
    },

    getRevenueReport: async (format?: 'json' | 'csv'): Promise<RevenueData[] | string> => {
        const response = await apiClient.get(`/provider/reports/revenue${format ? `?format=${format}` : ''}`);
        return response.data.data || response.data;
    },

    // Facilities
    getMyFacilities: async (): Promise<Facility[]> => {
        const response = await apiClient.get('/provider/facilities');
        return response.data.data;
    },

    createFacility: async (data: Partial<Facility>): Promise<Facility> => {
        const response = await apiClient.post('/provider/facilities', data);
        return response.data.data;
    },

    updateFacility: async (id: string, data: Partial<Facility>): Promise<Facility> => {
        const response = await apiClient.put(`/provider/facilities/${id}`, data);
        return response.data.data;
    },

    deleteFacility: async (id: string): Promise<void> => {
        await apiClient.delete(`/provider/facilities/${id}`);
    },

    getFacilityDetails: async (id: string): Promise<Facility> => {
        const response = await apiClient.get(`/provider/facilities/${id}`);
        return response.data.data;
    },

    // Slots
    getFacilitySlots: async (facilityId: string): Promise<any[]> => {
        const response = await apiClient.get(`/provider/facilities/${facilityId}/slots`);
        return response.data.data;
    },

    bulkCreateSlots: async (facilityId: string, data: any): Promise<any> => {
        const response = await apiClient.post(`/provider/facilities/${facilityId}/slots/bulk`, data);
        return response.data.data;
    },

    updateSlot: async (slotId: string, data: any): Promise<any> => {
        const response = await apiClient.put(`/provider/slots/${slotId}`, data);
        return response.data.data;
    },

    deleteSlot: async (slotId: string): Promise<void> => {
        await apiClient.delete(`/provider/slots/${slotId}`);
    },

    // Pricing
    setPricingRule: async (data: { facility_id: string; vehicle_type: string; hourly_rate: number; daily_max?: number }): Promise<any> => {
        const response = await apiClient.post('/provider/pricing-rules', data);
        return response.data.data;
    },

    getFacilityPricing: async (facilityId: string): Promise<any> => {
        const response = await apiClient.get(`/provider/facilities/${facilityId}/pricing`);
        return response.data.data;
    },

    updateFacilityPricing: async (facilityId: string, data: any): Promise<any> => {
        const response = await apiClient.put(`/provider/facilities/${facilityId}/pricing`, data);
        return response.data.data;
    },

    // Bookings
    getBookings: async (filters: any = {}): Promise<any[]> => {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await apiClient.get(`/provider/bookings?${queryParams}`);
        return response.data.data;
    },

    exportBookings: async (format: 'csv' | 'excel', filters: any = {}): Promise<Blob> => {
        const queryParams = new URLSearchParams({ ...filters, format }).toString();
        const response = await apiClient.get(`/provider/bookings/export?${queryParams}`, {
            responseType: 'blob',
        });
        return response.data;
    },
};

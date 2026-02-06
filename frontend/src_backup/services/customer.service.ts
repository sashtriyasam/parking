import apiClient from './api';
import type {
    ApiResponse,
    ParkingFacility,
    ParkingSlot,
    SearchParams,
    Ticket,
    MonthlyPass,
    Vehicle,
    Reservation,
    BookingRequest,
} from '../types';

export const customerService = {
    // Search & Discovery
    async searchParking(params: SearchParams): Promise<ParkingFacility[]> {
        const response = await apiClient.get<ApiResponse<ParkingFacility[]>>('/parking/search', {
            params,
        });
        return response.data.data;
    },

    async getFacilityDetails(facilityId: string): Promise<ParkingFacility> {
        const response = await apiClient.get<ApiResponse<ParkingFacility>>(
            `/parking/${facilityId}/details`
        );
        return response.data.data;
    },

    async getAvailableSlots(
        facilityId: string,
        params?: { floor_id?: string; vehicle_type?: string }
    ): Promise<Record<string, ParkingSlot[]>> {
        const response = await apiClient.get<ApiResponse<Record<string, ParkingSlot[]>>>(
            `/parking/${facilityId}/available-slots`,
            { params }
        );
        return response.data.data;
    },

    // Booking
    async reserveSlot(slotId: string): Promise<Reservation> {
        const response = await apiClient.post<ApiResponse<Reservation>>('/bookings/reserve', {
            slot_id: slotId,
        });
        return response.data.data;
    },

    async confirmBooking(data: BookingRequest): Promise<Ticket> {
        const response = await apiClient.post<ApiResponse<Ticket>>('/customer/booking/confirm', data);
        return response.data.data;
    },

    // Tickets
    async getActiveTickets(): Promise<Ticket[]> {
        const response = await apiClient.get<ApiResponse<Ticket[]>>('/customer/tickets/active');
        return response.data.data;
    },

    async getTicketHistory(page = 1, limit = 20): Promise<ApiResponse<Ticket[]>> {
        const response = await apiClient.get<ApiResponse<Ticket[]>>('/customer/tickets/history', {
            params: { page, limit },
        });
        return response.data;
    },

    async getTicketById(ticketId: string): Promise<Ticket> {
        const response = await apiClient.get<ApiResponse<Ticket>>(`/customer/tickets/${ticketId}`);
        return response.data.data;
    },

    async extendTicket(ticketId: string, additionalHours: number): Promise<any> {
        const response = await apiClient.post(`/customer/tickets/${ticketId}/extend`, {
            additional_hours: additionalHours,
        });
        return response.data;
    },

    async downloadInvoice(ticketId: string): Promise<Blob> {
        const response = await apiClient.get(`/customer/booking/${ticketId}/pdf`, {
            responseType: 'blob',
        });
        return response.data;
    },

    // Alias for booking success page
    getTicketDetails(ticketId: string): Promise<Ticket> {
        return this.getTicketById(ticketId);
    },

    // Profile
    async getProfile(): Promise<any> {
        const response = await apiClient.get('/customer/profile');
        return response.data.data;
    },

    async updateProfile(data: { full_name?: string; phone_number?: string }): Promise<any> {
        const response = await apiClient.put('/customer/profile', data);
        return response.data.data;
    },

    // Vehicles
    async getVehicles(): Promise<Vehicle[]> {
        const response = await apiClient.get<ApiResponse<Vehicle[]>>('/customer/vehicles');
        return response.data.data;
    },

    async addVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at'>): Promise<Vehicle> {
        const response = await apiClient.post<ApiResponse<Vehicle>>('/customer/vehicles', vehicle);
        return response.data.data;
    },

    async deleteVehicle(vehicleId: string): Promise<void> {
        await apiClient.delete(`/customer/vehicles/${vehicleId}`);
    },

    // Favorites
    async getFavorites(): Promise<any[]> {
        const response = await apiClient.get('/customer/favorites');
        return response.data.data;
    },

    async addFavorite(facilityId: string): Promise<any> {
        const response = await apiClient.post(`/customer/favorites/${facilityId}`);
        return response.data.data;
    },

    async removeFavorite(facilityId: string): Promise<void> {
        await apiClient.delete(`/customer/favorites/${facilityId}`);
    },

    // Monthly Passes
    async getAvailablePasses(facilityId: string, vehicleType?: string): Promise<any[]> {
        const response = await apiClient.get('/customer/passes/available', {
            params: { facility_id: facilityId, vehicle_type: vehicleType },
        });
        return response.data.data;
    },

    async purchasePass(facilityId: string, vehicleType: string): Promise<MonthlyPass> {
        const response = await apiClient.post<ApiResponse<MonthlyPass>>('/customer/passes/purchase', {
            facility_id: facilityId,
            vehicle_type: vehicleType,
        });
        return response.data.data;
    },

    async getMyPasses(): Promise<MonthlyPass[]> {
        const response = await apiClient.get<ApiResponse<MonthlyPass[]>>('/customer/passes/active');
        return response.data.data;
    },

    async endParking(ticketId: string): Promise<any> {
        const response = await apiClient.post('/bookings/checkout', {
            ticket_id: ticketId,
        });
        return response.data;
    },
};

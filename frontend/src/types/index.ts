// User and Auth Types
export interface User {
    id: string;
    email: string;
    full_name: string;
    phone_number?: string;
    role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
    created_at: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string;
    role: 'CUSTOMER' | 'PROVIDER';
}

export interface AuthResponse {
    status: string;
    accessToken: string;
    refreshToken: string;
    data: User;
}

// Parking Types
export type VehicleType = 'BIKE' | 'SCOOTER' | 'CAR' | 'TRUCK';
export type SlotStatus = 'FREE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export interface PricingRule {
    vehicle_type: VehicleType;
    hourly_rate: number;
    daily_max?: number;
    monthly_pass_price?: number;
}

export interface Amenity {
    id: string;
    name: string;
    icon: string;
}

export interface Review {
    id: string;
    customer_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export interface ParkingFacility {
    id: string;
    name: string;
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
    total_floors: number;
    operating_hours?: string;
    contact_info?: string;
    description?: string;
    image_url?: string;
    images?: string[];
    distance?: number;
    distance_text?: string;
    duration_text?: string;
    available_slots?: Record<VehicleType, number>;
    total_available?: number;
    pricing_rules: PricingRule[];
    amenities: string[]; // for now just strings
    floors: (Floor & { parking_slots: ParkingSlot[] })[];
    reviews?: Review[];
    rating_avg?: number;
    rating_count?: number;
}

export interface Floor {
    id: string;
    floor_number: number;
    floor_name?: string;
    total_capacity: number;
}

export interface ParkingSlot {
    id: string;
    slot_number: string;
    vehicle_type: VehicleType;
    status: SlotStatus;
    area_sqft?: number;
    floor?: {
        floor_number: number;
        floor_name?: string;
    };
}

// Booking Types
export interface Ticket {
    id: string;
    customer_id: string;
    slot_id: string;
    vehicle_number: string;
    vehicle_type: VehicleType;
    entry_time: string;
    exit_time?: string;
    total_fee?: number;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    slot?: ParkingSlot & {
        floor?: Floor & {
            facility?: ParkingFacility;
        };
    };
}

export interface Reservation {
    id: string;
    slot_id: string;
    expires_at: string;
}

export interface BookingRequest {
    reservation_id: string;
    vehicle_number: string;
}

// Pass Types
export interface MonthlyPass {
    id: string;
    facility_id: string;
    vehicle_type: VehicleType;
    start_date: string;
    end_date: string;
    price: number;
    status: 'ACTIVE' | 'EXPIRED';
    facility?: ParkingFacility;
}

// Vehicle Types
export interface Vehicle {
    id: string;
    vehicle_number: string;
    vehicle_type: VehicleType;
    nickname?: string;
    created_at: string;
}

// Search Types
export interface SearchParams {
    latitude: number;
    longitude: number;
    radius?: number;
    vehicle_type?: VehicleType;
    city?: string;
}

// API Response Types
export interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
    results?: number;
    total?: number;
    page?: number;
    pages?: number;
}

export interface ApiError {
    message: string;
    statusCode: number;
}

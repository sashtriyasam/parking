export type VehicleType = 'bike' | 'scooter' | 'car' | 'truck';
export type SlotStatus = 'free' | 'occupied' | 'reserved' | 'maintenance';
export type BookingStatus = 'active' | 'completed' | 'cancelled';
export type PaymentMethod = 'upi' | 'card' | 'pay-at-exit';
export type UserRole = 'customer' | 'provider';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
}

export interface Facility {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  images?: string[];
  image_url?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  totalSlots?: number;
  availableSlots?: number;
  floors?: number;
  operatingHours?: string;
  operating_hours?: string;
  amenities?: string[];
  providerId?: string;
  provider_id?: string;
  verified?: boolean;
  is_active?: boolean;
  is_24_7?: boolean;
  is_premium?: boolean;
  tier?: string;
  hourly_rate?: number;
  base_price?: number;
  distance?: string;
  reviewCountSummary?: string;
  currency?: string;
}

export interface ParkingSlot {
  id: string;
  facilityId: string;
  slotNumber: string;
  floor: number;
  vehicleType: VehicleType;
  status: SlotStatus;
  pricePerHour: number;
  slot_number?: string; // Backend snake_case
}

export interface Pricing {
  vehicleType: VehicleType;
  hourlyRate: number;
  dailyMax: number;
  monthlyPass: number;
}

export interface Booking {
  id: string;
  customerId: string;
  facilityId: string;
  slotId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  entryTime: string;
  exitTime?: string;
  startTime?: string;
  endTime?: string;
  duration: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  qrCode: string;
  bookingType?: string;
  facility_id?: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  nickname?: string;
  isDefault: boolean;
  is_verified?: boolean;
  rc_details?: string;
}

export interface MonthlyPass {
  id: string;
  userId: string;
  facilityId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  amount: number;
  isActive: boolean;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
}

export interface AuthResponse {
  status: string;
  data: {
    user: {
      id: string;
      email: string;
      full_name: string;
      phone_number?: string;
      role: UserRole;
      created_at?: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}

// API Types
export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ParkingFacility {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  images: string[];
  description?: string;
  rating: number;
  review_count: number;
  total_slots: number;
  available_slots: number;
  floors: number;
  operating_hours: string;
  amenities: string[];
  provider_id: string;
  verified: boolean;
  is_active: boolean;
  distance?: number;
  price_per_hour?: number;
}

export interface SearchParams {
  latitude?: number;
  longitude?: number;
  radius?: number;
  vehicle_type?: VehicleType;
  city?: string;
  amenities?: string[];
}

export interface Ticket {
  id: string;
  user_id: string;
  facility_id: string;
  slot_id: string;
  vehicle_number: string;
  vehicle_type: VehicleType;
  entry_time: string;
  exit_time?: string;
  duration_hours?: number;
  amount?: number;
  payment_method?: PaymentMethod;
  status: 'active' | 'completed' | 'cancelled';
  qr_code: string;
  facility?: ParkingFacility;
  slot?: ParkingSlot;
  total_fee?: number;   // Backend field
  current_fee?: number; // Backend calculated field
  duration?: number;    // Backend field
}

export interface Reservation {
  id: string;
  slot_id: string;
  user_id: string;
  expires_at: string;
  status: 'pending' | 'confirmed' | 'expired';
}

export interface BookingRequest {
  facility_id: string;
  slot_id: string;
  vehicle_number: string;
  vehicle_type: VehicleType;
  payment_method: PaymentMethod;
  duration_hours?: number;
  start_time: string;
  end_time: string;
  amount?: number;
  entry_time?: string;
  duration?: number;
}

export interface TimeSlot {
  id: string;
  start: string;
  end: string;
  status: string;
  vehicle_type: string;
}

export interface SlotAvailabilityResponse {
  slot_id: string;
  date: string;
  booked_windows: TimeSlot[];
}

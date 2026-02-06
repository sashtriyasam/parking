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
  images: string[];
  description: string;
  rating: number;
  reviewCount: number;
  totalSlots: number;
  availableSlots: number;
  floors: number;
  operatingHours: string;
  amenities: string[];
  providerId: string;
  verified: boolean;
}

export interface ParkingSlot {
  id: string;
  facilityId: string;
  slotNumber: string;
  floor: number;
  vehicleType: VehicleType;
  status: SlotStatus;
  pricePerHour: number;
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
  duration: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  qrCode: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  nickname?: string;
  isDefault: boolean;
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
  accessToken: string;
  refreshToken: string;
  data: {
    id: string;
    email: string;
    full_name: string;
    phone_number?: string;
    role: UserRole;
    created_at: string;
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
}

export interface Reservation {
  id: string;
  slot_id: string;
  user_id: string;
  expires_at: string;
  status: 'pending' | 'confirmed' | 'expired';
}

export interface BookingRequest {
  slot_id: string;
  vehicle_number: string;
  vehicle_type: VehicleType;
  payment_method: PaymentMethod;
  duration_hours?: number;
}

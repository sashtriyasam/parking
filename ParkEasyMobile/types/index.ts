export type VehicleType = 'bike' | 'scooter' | 'car' | 'truck';
export type SlotStatus = 'FREE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE' | 'free' | 'occupied' | 'reserved' | 'maintenance';
export type BookingStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'active' | 'completed' | 'cancelled';
export type PaymentMethod = 'upi' | 'card' | 'pay-at-exit';
export type UserRole = 'customer' | 'provider';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: UserRole;
  avatar?: string;
}

export interface PricingRule {
  id: string;
  vehicle_type: VehicleType;
  hourly_rate: number;
  daily_max?: number;
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
  is_active: boolean;
  pricing_rules: PricingRule[];
}
export interface ParkingSlot {
  id: string; 
  facility_id: string; 
  slot_number: string; 
  floor_id?: string;
  floor?: any;
  vehicle_type: VehicleType; 
  status: SlotStatus; 
  price_per_hour?: number;
}
export interface Booking {
  id: string;
  customer_id: string;
  facility_id: string;
  slot_id: string;
  vehicle_number: string;
  vehicle_type: VehicleType;
  entry_time: string;
  exit_time?: string;
  duration?: number;
  total_fee?: number;
  base_fee?: number;
  payment_method?: PaymentMethod;
  payment_status?: string;
  status: string;
  qr_code?: string;
  slot?: ParkingSlot;
  facility?: ParkingFacility;
  created_at?: string;
  updated_at?: string;
}
export interface Vehicle {
  id: string; 
  user_id: string; 
  vehicle_number: string; 
  vehicle_type: VehicleType;
  nickname?: string; 
  is_default: boolean;
}
export interface MonthlyPass {
  id: string; 
  user_id: string; 
  facility_id: string; 
  vehicle_id: string;
  start_date: string; 
  end_date: string; 
  amount: number; 
  is_active: boolean;
}
export interface AuthResponse {
  status: string;
  data: {
    user: User;
    access_token: string; 
    refresh_token: string;
  };
}
export interface ApiResponse<T> {
  status: string; data: T; message?: string;
  metadata?: { page?: number; limit?: number; total?: number; };
}

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

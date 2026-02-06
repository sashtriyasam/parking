import type { Facility, ParkingSlot, Pricing, Booking, User, SlotStatus } from '@/types';

export const mockUser: User = {
  id: 'user-1',
  name: 'Rahul Sharma',
  email: 'rahul.sharma@email.com',
  phone: '+91 98765 43210',
  role: 'customer',
};

export const mockProvider: User = {
  id: 'provider-1',
  name: 'Mumbai Parking Solutions',
  email: 'info@mumbaiparking.com',
  phone: '+91 22 1234 5678',
  role: 'provider',
};

export const mockFacilities: Facility[] = [
  {
    id: 'facility-1',
    name: 'Phoenix MarketCity Parking',
    address: 'LBS Marg, Kurla West',
    city: 'Mumbai',
    latitude: 19.0896,
    longitude: 72.8905,
    images: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80',
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80',
    ],
    description: 'Premium covered parking facility with 24/7 security, CCTV surveillance, and EV charging stations. Located in the heart of Mumbai, perfect for mall visitors and corporate employees.',
    rating: 4.8,
    reviewCount: 1240,
    totalSlots: 180,
    availableSlots: 42,
    floors: 3,
    operatingHours: '24/7',
    amenities: ['CCTV Security', 'EV Charging', 'Covered Parking', '24/7 Access', 'Car Wash'],
    providerId: 'provider-1',
    verified: true,
  },
  {
    id: 'facility-2',
    name: 'BKC Business Hub Parking',
    address: 'Bandra Kurla Complex',
    city: 'Mumbai',
    latitude: 19.0625,
    longitude: 72.8692,
    images: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80',
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80',
    ],
    description: 'Modern multi-storey parking facility in BKC. Perfect for business professionals with quick access to corporate offices.',
    rating: 4.6,
    reviewCount: 856,
    totalSlots: 240,
    availableSlots: 68,
    floors: 5,
    operatingHours: '6:00 AM - 11:00 PM',
    amenities: ['CCTV Security', 'Covered Parking', 'Wheelchair Access', 'Restrooms'],
    providerId: 'provider-1',
    verified: true,
  },
  {
    id: 'facility-3',
    name: 'Gateway Plaza Parking',
    address: 'Colaba Causeway',
    city: 'Mumbai',
    latitude: 18.9220,
    longitude: 72.8347,
    images: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80',
    ],
    description: 'Tourist-friendly parking near Gateway of India. Secure and convenient location for sightseeing.',
    rating: 4.5,
    reviewCount: 642,
    totalSlots: 120,
    availableSlots: 15,
    floors: 2,
    operatingHours: '24/7',
    amenities: ['CCTV Security', '24/7 Access', 'Air Pump'],
    providerId: 'provider-1',
    verified: true,
  },
  {
    id: 'facility-4',
    name: 'Cyber City Smart Parking',
    address: 'DLF Cyber City, Sector 24',
    city: 'Gurugram',
    latitude: 28.4945,
    longitude: 77.0891,
    images: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80',
    ],
    description: 'State-of-the-art automated parking system with license plate recognition and contactless entry.',
    rating: 4.9,
    reviewCount: 2103,
    totalSlots: 300,
    availableSlots: 89,
    floors: 6,
    operatingHours: '24/7',
    amenities: ['CCTV Security', 'EV Charging', 'Covered Parking', '24/7 Access', 'Wheelchair Access', 'Restrooms'],
    providerId: 'provider-1',
    verified: true,
  },
];

export const mockPricing: Record<string, Pricing[]> = {
  'facility-1': [
    { vehicleType: 'bike', hourlyRate: 30, dailyMax: 200, monthlyPass: 3500 },
    { vehicleType: 'scooter', hourlyRate: 30, dailyMax: 200, monthlyPass: 3500 },
    { vehicleType: 'car', hourlyRate: 60, dailyMax: 400, monthlyPass: 6500 },
    { vehicleType: 'truck', hourlyRate: 100, dailyMax: 800, monthlyPass: 12000 },
  ],
  'facility-2': [
    { vehicleType: 'bike', hourlyRate: 40, dailyMax: 250, monthlyPass: 4000 },
    { vehicleType: 'scooter', hourlyRate: 40, dailyMax: 250, monthlyPass: 4000 },
    { vehicleType: 'car', hourlyRate: 80, dailyMax: 500, monthlyPass: 8000 },
    { vehicleType: 'truck', hourlyRate: 120, dailyMax: 900, monthlyPass: 15000 },
  ],
  'facility-3': [
    { vehicleType: 'bike', hourlyRate: 50, dailyMax: 300, monthlyPass: 4500 },
    { vehicleType: 'scooter', hourlyRate: 50, dailyMax: 300, monthlyPass: 4500 },
    { vehicleType: 'car', hourlyRate: 100, dailyMax: 600, monthlyPass: 10000 },
    { vehicleType: 'truck', hourlyRate: 150, dailyMax: 1000, monthlyPass: 18000 },
  ],
  'facility-4': [
    { vehicleType: 'bike', hourlyRate: 35, dailyMax: 220, monthlyPass: 3800 },
    { vehicleType: 'scooter', hourlyRate: 35, dailyMax: 220, monthlyPass: 3800 },
    { vehicleType: 'car', hourlyRate: 70, dailyMax: 450, monthlyPass: 7500 },
    { vehicleType: 'truck', hourlyRate: 110, dailyMax: 850, monthlyPass: 14000 },
  ],
};

// Generate slots for each facility
export const generateSlots = (facilityId: string, floors: number, slotsPerFloor: number): ParkingSlot[] => {
  const slots: ParkingSlot[] = [];
  const statuses: SlotStatus[] = ['free', 'occupied', 'reserved', 'maintenance'];
  const vehicleTypes: ('bike' | 'scooter' | 'car' | 'truck')[] = ['bike', 'scooter', 'car', 'truck'];
  const pricing = mockPricing[facilityId] || mockPricing['facility-1'];

  for (let floor = 0; floor < floors; floor++) {
    for (let slot = 1; slot <= slotsPerFloor; slot++) {
      const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
      const priceInfo = pricing.find(p => p.vehicleType === vehicleType);

      // Generate more free slots than occupied
      const randomValue = Math.random();
      let status: SlotStatus;
      if (randomValue < 0.5) status = 'free';
      else if (randomValue < 0.8) status = 'occupied';
      else if (randomValue < 0.95) status = 'reserved';
      else status = 'maintenance';

      slots.push({
        id: `${facilityId}-${floor}-${slot}`,
        facilityId,
        slotNumber: `${String.fromCharCode(65 + floor)}-${slot.toString().padStart(2, '0')}`,
        floor,
        vehicleType,
        status,
        pricePerHour: priceInfo?.hourlyRate || 50,
      });
    }
  }

  return slots;
};

export const mockSlots: Record<string, ParkingSlot[]> = {
  'facility-1': generateSlots('facility-1', 3, 60),
  'facility-2': generateSlots('facility-2', 5, 48),
  'facility-3': generateSlots('facility-3', 2, 60),
  'facility-4': generateSlots('facility-4', 6, 50),
};

export const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    customerId: 'user-1',
    facilityId: 'facility-1',
    slotId: 'facility-1-0-15',
    vehicleNumber: 'MH 01 AB 1234',
    vehicleType: 'car',
    entryTime: '2026-02-02T10:30:00',
    duration: 3,
    amount: 180,
    paymentMethod: 'upi',
    status: 'active',
    qrCode: 'QR-BOOKING-1',
  },
  {
    id: 'booking-2',
    customerId: 'user-1',
    facilityId: 'facility-2',
    slotId: 'facility-2-1-23',
    vehicleNumber: 'MH 02 CD 5678',
    vehicleType: 'bike',
    entryTime: '2026-01-28T14:00:00',
    exitTime: '2026-01-28T18:30:00',
    duration: 4.5,
    amount: 180,
    paymentMethod: 'card',
    status: 'completed',
    qrCode: 'QR-BOOKING-2',
  },
];

export const mockReviews = [
  {
    id: 'review-1',
    facilityId: 'facility-1',
    userId: 'user-1',
    userName: 'Priya Patel',
    rating: 5,
    comment: 'Excellent parking facility! Clean, secure, and well-maintained. The staff is very helpful.',
    date: '2026-01-25',
    helpful: 24,
  },
  {
    id: 'review-2',
    facilityId: 'facility-1',
    userId: 'user-2',
    userName: 'Amit Kumar',
    rating: 4,
    comment: 'Good location and reasonable prices. Could use more EV charging points.',
    date: '2026-01-20',
    helpful: 12,
  },
  {
    id: 'review-3',
    facilityId: 'facility-1',
    userId: 'user-3',
    userName: 'Sneha Reddy',
    rating: 5,
    comment: 'Best parking experience in Mumbai! The QR code entry is super convenient.',
    date: '2026-01-15',
    helpful: 18,
  },
];

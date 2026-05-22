import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, Facility, ParkingSlot, Booking, VehicleType, PaymentMethod, OfflineBookingData } from '@/types';
// Remove mock imports
// import { mockFacilities, mockSlots, mockBookings } from '@/data/mockData';
import { authService } from '@/services/auth.service';
import { providerService } from '@/services/provider.service';
import { customerService } from '@/services/customer.service';
import { toast } from 'sonner';

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  facilities: Facility[];
  myFacilities: Facility[];
  slots: Record<string, ParkingSlot[]>;
  bookings: Booking[];
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  login: (email: string, password: string, requestedRole?: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password: string, phone: string, role: 'customer' | 'provider') => Promise<void>;
  updateSlotStatus: (facilityId: string, slotId: string, status: ParkingSlot['status']) => void;
  createBooking: (booking: Omit<Booking, 'id'>) => Promise<Booking>;
  cancelBooking: (ticketId: string) => Promise<void>;
  createOfflineBooking: (data: OfflineBookingData) => Promise<Booking>;
  getBookingsByUser: (userId: string) => Booking[];
  getFacilityById: (id: string) => Facility | undefined;
  refreshData: () => Promise<void>;
  switchRole: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [myFacilities, setMyFacilities] = useState<Facility[]>([]);
  const [slots, setSlots] = useState<Record<string, ParkingSlot[]>>({});
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);


  // Helper to standardise user object from backend to frontend
  // Helper functions for type-safe parsing from backend
  const parseVehicleType = (type: any): VehicleType => {
    const val = (type || '').toLowerCase();
    if (['car', 'bike', 'scooter', 'truck'].includes(val)) return val as VehicleType;
    return 'car';
  };

  const parsePaymentMethod = (method: any): PaymentMethod => {
    const val = (method || '').toLowerCase().replace(/_/g, '-');
    if (['upi', 'card', 'pay-at-exit'].includes(val)) return val as PaymentMethod;
    return 'pay-at-exit';
  };

  const parseBookingStatus = (status: any): Booking['status'] => {
    const val = (status || '').toLowerCase();
    if (['active', 'completed', 'cancelled'].includes(val)) return val as any;
    return 'active';
  };

  const mapBackendUserToFrontend = (backendUser: any): User => ({
    id: backendUser.id,
    name: backendUser.full_name,
    email: backendUser.email,
    phone: backendUser.phone_number || '',
    role: backendUser.role.toLowerCase(),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(backendUser.full_name)}&background=random`,
  });

  const mapBackendFacilityToFrontend = (f: any): Facility => ({
    id: f.id,
    name: f.name,
    address: f.address,
    city: f.city,
    latitude: f.latitude != null ? parseFloat(f.latitude) : 0,
    longitude: f.longitude != null ? parseFloat(f.longitude) : 0,
    image_url: f.image_url || (f.images && f.images[0]),
    description: f.description,
    rating: f.rating || 0,
    reviewCount: f.review_count || 0,
    totalSlots: f.total_slots || f._count?.parking_slots || 0,
    availableSlots: f.available_slots !== undefined ? f.available_slots : (f.total_slots || f._count?.parking_slots || 0),
    floors: f.total_floors || f.floors,
    providerId: f.provider_id,
    operatingHours: f.operating_hours,
    isActive: f.is_active,
    is24_7: f.is_24_7,
    isPremium: f.is_premium,
    hourlyRate: f.hourly_rate,
    basePrice: f.base_price,
    amenities: f.amenities || [],
    verified: f.verified || false,
    distance: f.distance,
  });

  const mapBackendTicketToBooking = (t: any): Booking => ({
    id: t.id,
    customerId: t.user_id,
    facilityId: t.facility_id,
    slotId: t.slot_id,
    vehicleNumber: t.vehicle_number,
    vehicleType: parseVehicleType(t.vehicle_type),
    entryTime: t.entry_time,
    exitTime: t.exit_time,
    duration: t.duration || t.duration_hours || 0,
    amount: t.total_fee || t.amount || 0,
    paymentMethod: parsePaymentMethod(t.payment_method),
    status: parseBookingStatus(t.status),
    bookingType: (t.booking_type || 'walk-in').toLowerCase() as any,
    qrCode: t.qr_code || t.id,
  });

  const loadInitialData = useCallback(async () => {
    try {
      // 1. Load Facilities (Common for all)
      const allFacilities = await customerService.getAllFacilities();
      const normalizedFacilities = allFacilities.map(mapBackendFacilityToFrontend);
      setFacilities(normalizedFacilities);

      // 2. Load User Logic
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Verify token and get fresh user data
        const currentUser = await authService.getCurrentUser();
        const frontendUser = mapBackendUserToFrontend(currentUser);
        setUser(frontendUser);

        // 3. Role-specific data loading
        if (frontendUser.role === 'provider') {
          // Sync provider's own facilities to global state
          const providerFacilities = await providerService.getMyFacilities(); 
          const normalizedProviderFacilities = providerFacilities.map(mapBackendFacilityToFrontend);
          setMyFacilities(normalizedProviderFacilities);

          const providerBookings = await providerService.getBookings(); 
          setBookings(providerBookings.map(mapBackendTicketToBooking));
        } else {
          // Customer
          const myTickets = await customerService.getActiveTickets();
          setBookings(myTickets.map(mapBackendTicketToBooking));
        }
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      // If 401, auto-logout handling is done by api interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const login = async (email: string, password: string, _requestedRole?: string) => {
    setIsLoading(true);
    try {
      console.log(`Attempting login: ${email}`);
      const response = await authService.login({ email, password });
      
      if (!response || !response.data) {
        throw new Error('Invalid server response during login');
      }

      const { user: backendUser, accessToken, refreshToken } = response.data;

      if (!backendUser) {
        throw new Error('User data missing from response');
      }

      const frontendUser = mapBackendUserToFrontend(backendUser);

      setUser(frontendUser);
      localStorage.setItem('user', JSON.stringify(frontendUser));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Reload data for the new user
      await loadInitialData();
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setBookings([]);
    setMyFacilities([]);
    // Optionally clear facilities if they are protected, but parking is usually public search
    toast.info('Logged out successfully');
  };

  const signup = async (name: string, email: string, password: string, phone: string, role: 'customer' | 'provider') => {
    setIsLoading(true);
    try {
      const response = await authService.register({
        email,
        password,
        full_name: name,
        role: role.toUpperCase() as any, // Backend expects uppercase
        phone_number: phone, 
      });

      const { user: backendUser, accessToken, refreshToken } = response.data;
      const frontendUser = mapBackendUserToFrontend(backendUser);

      setUser(frontendUser);
      localStorage.setItem('user', JSON.stringify(frontendUser));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      await loadInitialData();
      toast.success('Account created successfully!');
    } catch (error: any) {
      console.error('Signup failed:', error);
      toast.error(error.message || 'Signup failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSlotStatus = (facilityId: string, slotId: string, status: ParkingSlot['status']) => {
    // Optimistic update
    setSlots(prev => ({
      ...prev,
      [facilityId]: prev[facilityId]?.map(slot =>
        slot.id === slotId ? { ...slot, status } : slot
      ) || [],
    }));
  };

  const cancelBooking = async (ticketId: string) => {
    await customerService.cancelBooking(ticketId);
    setBookings(prev => prev.map(b => b.id === ticketId ? { ...b, status: 'cancelled' } : b));
  };

  const createBooking = async (bookingData: Omit<Booking, 'id'>): Promise<Booking> => {
    type BackendVehicleType = 'CAR' | 'BIKE' | 'TRUCK';
    type BackendPaymentMethod = 'UPI' | 'CARD' | 'PAY_AT_EXIT';

    try {
      const vehicleTypeMap: Record<string, BackendVehicleType> = {
        'car': 'CAR', 'bike': 'BIKE', 'truck': 'TRUCK', 'scooter': 'BIKE'
      };
      const paymentMethodMap: Record<string, BackendPaymentMethod> = {
        'upi': 'UPI', 'card': 'CARD', 'pay-at-exit': 'PAY_AT_EXIT', 'cash': 'PAY_AT_EXIT'
      };

      // Guard date fields to prevent NaN
      const entryDate = bookingData.entryTime ? new Date(bookingData.entryTime) : new Date();
      const startTime = bookingData.startTime || entryDate.toISOString();
      const duration = bookingData.duration || 2;
      const endTime = bookingData.endTime || new Date(new Date(startTime).getTime() + duration * 60 * 60 * 1000).toISOString();

      if (bookingData.amount === undefined || bookingData.amount === null) {
        console.warn(`[AppContext] Booking amount is missing for slot ${bookingData.slotId}. User: ${user?.id}`);
        throw new Error('Calculation Error: The booking amount could not be determined. Please try again.');
      }

      const ticket = await customerService.confirmBooking({
        facility_id: bookingData.facilityId,
        slot_id: bookingData.slotId,
        vehicle_number: bookingData.vehicleNumber,
        vehicle_type: (vehicleTypeMap[bookingData.vehicleType] || bookingData.vehicleType.toUpperCase()) as BackendVehicleType,
        start_time: startTime,
        end_time: endTime,
        entry_time: bookingData.entryTime || entryDate.toISOString(),
        duration: duration,
        payment_method: (paymentMethodMap[bookingData.paymentMethod] || bookingData.paymentMethod.toUpperCase()) as BackendPaymentMethod,
        amount: bookingData.amount
      });

      // Map back ticket to Booking type to update local state
      const newBooking = mapBackendTicketToBooking(ticket);
      setBookings(prev => [...prev, newBooking]);

      return newBooking;
    } catch (error) {
      console.error("Booking creation failed", error);
      throw error;
    }
  };

  const createOfflineBooking = async (data: OfflineBookingData) => {
    const ticket = await providerService.createOfflineBooking(data);
    const newBooking = mapBackendTicketToBooking(ticket);
    setBookings(prev => [newBooking, ...prev]);
    return newBooking;
  };

  const getBookingsByUser = (userId: string) => {
    return bookings.filter(b => b.customerId === userId);
  };

  const getFacilityById = (id: string) => {
    let filtered = facilities.filter(f => f.isActive !== false);
    return filtered.find(f => f.id === id);
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  const switchRole = async () => {
    setIsLoading(true);
    try {
      const response = await authService.switchRole();
      const { user: backendUser, accessToken, refreshToken } = response.data;
      const frontendUser = mapBackendUserToFrontend(backendUser);

      setUser(frontendUser);
      localStorage.setItem('user', JSON.stringify(frontendUser));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      await loadInitialData();
      toast.success(`Switched to ${frontendUser.role === 'provider' ? 'Partner' : 'Customer'} mode`);

      // Force navigation
      // Note: ProtectedRoute will handle the rest based on user.role
      if (frontendUser.role === 'provider') {
        // If new provider, they likely need onboarding. Check if they have facilities.
        try {
          const facilities = await providerService.getMyFacilities();
          if (facilities.length === 0) {
            // No facilities -> Onboarding
            window.location.href = '/provider/onboarding'; // Hard refresh/nav safest here
            return;
          }
          window.location.href = '/provider/dashboard';
        } catch (e) {
          window.location.href = '/provider/onboarding';
        }
      } else {
        window.location.href = '/customer/search';
      }

    } catch (error) {
      toast.error('Failed to switch role');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        facilities,
        myFacilities,
        slots,
        bookings,
        theme,
        toggleTheme,
        login,
        logout,
        signup,
        updateSlotStatus,
        createBooking,
        cancelBooking,
        createOfflineBooking,
        getBookingsByUser,
        getFacilityById,
        refreshData,
        switchRole
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

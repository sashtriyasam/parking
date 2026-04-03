import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, Facility, ParkingSlot, Booking, VehicleType, PaymentMethod } from '@/types';
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
  slots: Record<string, ParkingSlot[]>;
  bookings: Booking[];
  login: (email: string, password: string, role: 'customer' | 'provider') => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password: string, phone: string, role: 'customer' | 'provider') => Promise<void>;
  updateSlotStatus: (facilityId: string, slotId: string, status: ParkingSlot['status']) => void;
  createBooking: (booking: Omit<Booking, 'id'>) => Promise<Booking>;
  cancelBooking: (ticketId: string) => Promise<void>;
  createOfflineBooking: (data: any) => Promise<Booking>;
  getBookingsByUser: (userId: string) => Booking[];
  getFacilityById: (id: string) => Facility | undefined;
  refreshData: () => Promise<void>;
  switchRole: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [slots, setSlots] = useState<Record<string, ParkingSlot[]>>({});
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Helper to standardise user object from backend to frontend
  const mapBackendUserToFrontend = (backendUser: any): User => ({
    id: backendUser.id,
    name: backendUser.full_name,
    email: backendUser.email,
    phone: backendUser.phone_number || '',
    role: backendUser.role.toLowerCase(),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(backendUser.full_name)}&background=random`,
  });

  const mapBackendFacilityToFrontend = (f: any): Facility => ({
    ...f,
    id: f.id,
    name: f.name,
    address: f.address,
    city: f.city,
    latitude: f.latitude != null ? parseFloat(f.latitude) : 0,
    longitude: f.longitude != null ? parseFloat(f.longitude) : 0,
    image_url: f.image_url || (f.images && f.images[0]),
    totalSlots: f.total_slots || f._count?.parking_slots || 0,
    availableSlots: f.available_slots !== undefined ? f.available_slots : (f.total_slots || f._count?.parking_slots || 0),
    providerId: f.provider_id,
    operatingHours: f.operating_hours,
  });

  const mapBackendTicketToBooking = (t: any): Booking => ({
    id: t.id,
    customerId: t.user_id,
    facilityId: t.facility_id,
    slotId: t.slot_id,
    vehicleNumber: t.vehicle_number,
    vehicleType: (t.vehicle_type?.toLowerCase() || 'car') as any as VehicleType,
    entryTime: t.entry_time,
    exitTime: t.exit_time,
    duration: t.duration || t.duration_hours || 0,
    amount: t.total_fee || t.amount || 0,
    paymentMethod: (t.payment_method?.toLowerCase() || 'pay-at-exit') as any as PaymentMethod,
    status: (t.status || 'active').toLowerCase() as any,
    bookingType: (t.booking_type || 'ONLINE').toUpperCase(),
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
          await providerService.getMyFacilities(); // ensure fresh access
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

  const login = async (email: string, password: string, role?: 'customer' | 'provider') => {
    setIsLoading(true);
    try {
      console.log(`[v1.6] Attempting login: ${email} as ${role || 'unknown'}`);
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
      console.error('[v1.6] Login failed:', error);
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
    try {
      await customerService.cancelBooking(ticketId);
      setBookings(prev => prev.map(b => b.id === ticketId ? { ...b, status: 'cancelled' } : b));
    } catch (error) {
      throw error;
    }
  };

  const createBooking = async (bookingData: Omit<Booking, 'id'>): Promise<Booking> => {
    try {
      const vehicleTypeMap: Record<string, string> = {
        'car': 'CAR', 'bike': 'BIKE', 'truck': 'TRUCK', 'scooter': 'BIKE'
      };
      const paymentMethodMap: Record<string, string> = {
        'upi': 'UPI', 'card': 'CARD', 'pay-at-exit': 'PAY_AT_EXIT', 'cash': 'PAY_AT_EXIT'
      };
      const ticket = await (customerService as any).confirmBooking({
        facility_id: bookingData.facilityId,
        slot_id: bookingData.slotId,
        vehicle_number: bookingData.vehicleNumber,
        vehicle_type: vehicleTypeMap[bookingData.vehicleType] || bookingData.vehicleType.toUpperCase(),
        start_time: bookingData.startTime || bookingData.entryTime,
        end_time: bookingData.endTime || new Date(new Date(bookingData.entryTime).getTime() + (bookingData.duration || 2) * 60 * 60 * 1000).toISOString(),
        entry_time: bookingData.entryTime,
        duration: bookingData.duration,
        payment_method: paymentMethodMap[bookingData.paymentMethod] || bookingData.paymentMethod.toUpperCase(),
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

  const getBookingsByUser = (userId: string) => {
    return bookings.filter(b => b.customerId === userId);
  };

  const getFacilityById = (id: string) => {
    return facilities.find(f => f.id === id);
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
        slots,
        bookings,
        login,
        logout,
        signup,
        updateSlotStatus,
        createBooking,
        cancelBooking,
        createOfflineBooking: async (data: any) => {
          const ticket = await providerService.createOfflineBooking(data);
          const newBooking = mapBackendTicketToBooking(ticket);
          setBookings(prev => [newBooking, ...prev]);
          return newBooking;
        },
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

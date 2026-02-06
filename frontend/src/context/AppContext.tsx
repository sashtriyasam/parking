import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, Facility, ParkingSlot, Booking } from '@/types';
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
  signup: (name: string, email: string, password: string, role: 'customer' | 'provider') => Promise<void>;
  updateSlotStatus: (facilityId: string, slotId: string, status: ParkingSlot['status']) => void;
  createBooking: (booking: Omit<Booking, 'id'>) => Promise<Booking>; // Changed to Promise
  getBookingsByUser: (userId: string) => Booking[];
  getFacilityById: (id: string) => Facility | undefined;
  refreshData: () => Promise<void>;
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

  const loadInitialData = useCallback(async () => {
    try {
      // 1. Load Facilities (Common for all)
      // Note: In a real large app, we wouldn't load ALL facilities here, but for this scale it's fine
      // to populate the map.
      const allFacilities = await customerService.getAllFacilities();
      // Cast backend type to frontend type if needed, assuming they match for now or mapper needed
      // Ideally types should be shared.
      setFacilities(allFacilities as unknown as Facility[]);

      // 2. Load User Logic
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Verify token and get fresh user data
        const currentUser = await authService.getCurrentUser();
        const frontendUser = mapBackendUserToFrontend(currentUser);
        setUser(frontendUser);

        // 3. Role-specific data loading
        if (frontendUser.role === 'provider') {
          const myFacilities = await providerService.getMyFacilities();
          const providerBookings = await providerService.getBookings(); // Adjusted to provider service
          // Merge provider facilities if needed, or just rely on 'facilities' state 
          // (provider might want to see ONLY theirs or ALL? provider dashboard filters usually)
          setBookings(providerBookings);
        } else {
          // Customer
          const myTickets = await customerService.getActiveTickets();
          // Map tickets to bookings format if they differ significantly
          // For now assuming Booking type interface match or we verify later
          setBookings(myTickets as unknown as Booking[]);
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

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      const { user: backendUser, accessToken, refreshToken } = response.data;

      const frontendUser = mapBackendUserToFrontend(backendUser);

      setUser(frontendUser);
      localStorage.setItem('user', JSON.stringify(frontendUser));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Reload data for the new user
      await loadInitialData();
      toast.success(`Welcome back, ${frontendUser.name}!`);
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
    // Optionally clear facilities if they are protected, but parking is usually public search
    toast.info('Logged out successfully');
  };

  const signup = async (name: string, email: string, password: string, role: 'customer' | 'provider') => {
    setIsLoading(true);
    try {
      const response = await authService.register({
        email,
        password,
        full_name: name,
        role: role.toUpperCase() as any, // Backend expects uppercase
        phone_number: '', // Optional in frontend UI currently
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

  const createBooking = async (bookingData: Omit<Booking, 'id'>): Promise<Booking> => {
    try {
      // Use the service to create booking
      // The bookingData structure from frontend might need mapping to what backend expects
      // Frontend: { customerId, facilityId, slotId, vehicleNumber, ... }
      // Backend: /customer/booking/confirm expects { slot_id, vehicle_id, ... } or /bookings expects generic

      // For now, let's assume we map it to the 'confirmBooking' flow
      const ticket = await customerService.confirmBooking({
        facility_id: bookingData.facilityId,
        slot_id: bookingData.slotId,
        vehicle_number: bookingData.vehicleNumber,
        vehicle_type: bookingData.vehicleType,
        start_time: bookingData.entryTime, // ISO string
        duration_hours: bookingData.duration,
        payment_method: bookingData.paymentMethod,
        amount: bookingData.amount
      });

      // Map back ticket to Booking type to update local state
      const newBooking: Booking = {
        ...bookingData,
        id: ticket.id,
        status: 'active',
        qrCode: ticket.qr_code || 'QR-PENDING'
      };

      setBookings(prev => [...prev, newBooking]);
      // updateSlotStatus(bookingData.facilityId, bookingData.slotId, 'occupied'); // Backend handles this

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
        getBookingsByUser,
        getFacilityById,
        refreshData
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

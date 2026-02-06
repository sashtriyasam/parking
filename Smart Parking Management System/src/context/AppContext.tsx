import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Facility, ParkingSlot, Booking } from '@/types';
import { mockUser, mockProvider, mockFacilities, mockSlots, mockBookings } from '@/data/mockData';

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  facilities: Facility[];
  slots: Record<string, ParkingSlot[]>;
  bookings: Booking[];
  login: (email: string, password: string, role: 'customer' | 'provider') => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password: string, role: 'customer' | 'provider') => Promise<void>;
  updateSlotStatus: (facilityId: string, slotId: string, status: ParkingSlot['status']) => void;
  createBooking: (booking: Omit<Booking, 'id'>) => Booking;
  getBookingsByUser: (userId: string) => Booking[];
  getFacilityById: (id: string) => Facility | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [facilities] = useState<Facility[]>(mockFacilities);
  const [slots, setSlots] = useState<Record<string, ParkingSlot[]>>(mockSlots);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);

  const login = async (email: string, password: string, role: 'customer' | 'provider') => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (role === 'customer') {
      setUser(mockUser);
    } else {
      setUser(mockProvider);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const signup = async (name: string, email: string, password: string, role: 'customer' | 'provider') => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone: '',
      role,
    };
    
    setUser(newUser);
  };

  const updateSlotStatus = (facilityId: string, slotId: string, status: ParkingSlot['status']) => {
    setSlots(prev => ({
      ...prev,
      [facilityId]: prev[facilityId].map(slot =>
        slot.id === slotId ? { ...slot, status } : slot
      ),
    }));
  };

  const createBooking = (bookingData: Omit<Booking, 'id'>): Booking => {
    const newBooking: Booking = {
      ...bookingData,
      id: `booking-${Date.now()}`,
    };
    
    setBookings(prev => [...prev, newBooking]);
    
    // Update slot status to occupied
    updateSlotStatus(bookingData.facilityId, bookingData.slotId, 'occupied');
    
    return newBooking;
  };

  const getBookingsByUser = (userId: string) => {
    return bookings.filter(b => b.customerId === userId);
  };

  const getFacilityById = (id: string) => {
    return facilities.find(f => f.id === id);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { Navigation } from '@/app/components/Navigation';
import { Landing } from '@/app/components/pages/Landing'; // This will be our Welcome page
import { Splash } from '@/app/components/pages/Splash';
import { Login } from '@/app/components/pages/Login';
import { Signup } from '@/app/components/pages/Signup';
import { CustomerSearch } from '@/app/components/pages/CustomerSearch';
import { FacilityDetails } from '@/app/components/pages/FacilityDetails';
import { BookingVehicle, BookingPayment, BookingSuccess } from '@/app/components/pages/BookingFlow';
import { CustomerTickets } from '@/app/components/pages/CustomerTickets';
import { CustomerProfile } from '@/app/components/pages/CustomerProfile';
import { ProviderDashboard } from '@/app/components/pages/ProviderDashboard';
import { ProviderFacilities } from '@/app/components/pages/ProviderFacilities';
import { ProviderSlotManagement } from '@/app/components/pages/ProviderSlotManagement';
import { ProviderBookings } from '@/app/components/pages/ProviderBookings';
import { ProviderVehicleChecker } from '@/app/components/pages/ProviderVehicleChecker';
import { ProviderOnboarding } from '@/app/components/pages/ProviderOnboarding';
import { Toaster } from '@/app/components/ui/sonner';
import type { ReactNode } from 'react';

// Protected Route Component
// Protected Route Component
function ProtectedRoute({ children, requiredRole }: { children: ReactNode; requiredRole?: 'customer' | 'provider' }) {
  const { isAuthenticated, user, isLoading } = useApp();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    console.warn(`Redirecting: User role '${user?.role}' does not match required '${requiredRole}'`);
    // If role doesn't match, redirect to their dashboard or home based on their actual role
    if (user?.role === 'provider') return <Navigate to="/provider/dashboard" replace />;
    return <Navigate to="/customer/search" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground font-sans">
        {/* We only show Navigation on non-splash/welcome/auth pages for clean onboarding */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Splash />} />
          <Route path="/welcome" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Customer Routes - these will have Navigation wrapped inside or layout */}
          <Route path="/customer/search" element={<><Navigation /><CustomerSearch /></>} />
          <Route path="/customer/facility/:id" element={<><Navigation /><FacilityDetails /></>} />
          <Route
            path="/customer/booking/:id/vehicle"
            element={
              <ProtectedRoute requiredRole="customer">
                <Navigation /><BookingVehicle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/booking/:id/payment"
            element={
              <ProtectedRoute requiredRole="customer">
                <Navigation /><BookingPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/booking/success"
            element={
              <ProtectedRoute requiredRole="customer">
                <Navigation /><BookingSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/tickets"
            element={
              <ProtectedRoute requiredRole="customer">
                <Navigation /><CustomerTickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute requiredRole="customer">
                <Navigation /><CustomerProfile />
              </ProtectedRoute>
            }
          />

          {/* Provider Routes */}
          <Route
            path="/provider/dashboard"
            element={
              <ProtectedRoute requiredRole="provider">
                <Navigation /><ProviderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/facilities"
            element={
              <ProtectedRoute requiredRole="provider">
                <Navigation /><ProviderFacilities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/facilities/:id/slots"
            element={
              <ProtectedRoute requiredRole="provider">
                <Navigation /><ProviderSlotManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/bookings"
            element={
              <ProtectedRoute requiredRole="provider">
                <Navigation /><ProviderBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/onboarding"
            element={
              <ProtectedRoute requiredRole="provider">
                <ProviderOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/vehicle-checker"
            element={
              <ProtectedRoute requiredRole="provider">
                <Navigation /><ProviderVehicleChecker />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
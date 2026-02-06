import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { Navigation } from '@/app/components/Navigation';
import { Landing } from '@/app/components/pages/Landing';
import { Login } from '@/app/components/pages/Login';
import { Signup } from '@/app/components/pages/Signup';
import { CustomerSearch } from '@/app/components/pages/CustomerSearch';
import { FacilityDetails } from '@/app/components/pages/FacilityDetails';
import { BookingVehicle, BookingPayment, BookingSuccess } from '@/app/components/pages/BookingFlow';
import { CustomerTickets } from '@/app/components/pages/CustomerTickets';
import { CustomerProfile } from '@/app/components/pages/CustomerProfile';
import { ProviderDashboard } from '@/app/components/pages/ProviderDashboard';
import { Toaster } from '@/app/components/ui/sonner';
import type { ReactNode } from 'react';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }: { children: ReactNode; requiredRole?: 'customer' | 'provider' }) {
  const { isAuthenticated, user } = useApp();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Navigation />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Customer Routes */}
          <Route path="/customer/search" element={<CustomerSearch />} />
          <Route path="/customer/facility/:id" element={<FacilityDetails />} />
          <Route
            path="/customer/booking/:id/vehicle"
            element={
              <ProtectedRoute requiredRole="customer">
                <BookingVehicle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/booking/:id/payment"
            element={
              <ProtectedRoute requiredRole="customer">
                <BookingPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/booking/success"
            element={
              <ProtectedRoute requiredRole="customer">
                <BookingSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/tickets"
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerTickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerProfile />
              </ProtectedRoute>
            }
          />

          {/* Provider Routes */}
          <Route
            path="/provider/dashboard"
            element={
              <ProtectedRoute requiredRole="provider">
                <ProviderDashboard />
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
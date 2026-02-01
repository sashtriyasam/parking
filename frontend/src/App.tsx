import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './lib/queryClient';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';

// Dynamic imports to "debloat" and potentially isolate loading issues
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Customer Pages
import CustomerSearchPage from './pages/customer/SearchPage';
import FacilityDetailsPage from './pages/customer/FacilityDetailsPage';
import VehicleDetailsPage from './pages/customer/booking/VehicleDetailsPage';
import BookingReviewPage from './pages/customer/booking/BookingReviewPage';
import PaymentPage from './pages/customer/booking/PaymentPage';
import BookingSuccessPage from './pages/customer/booking/BookingSuccessPage';
import MyTicketsPage from './pages/customer/MyTicketsPage';
import MyPassesPage from './pages/customer/MyPassesPage';
import ProfilePage from './pages/customer/ProfilePage';

// Provider Pages
import ProviderDashboard from './pages/provider/DashboardPage';
import FacilitiesPage from './pages/provider/FacilitiesPage';
import AddFacilityPage from './pages/provider/AddFacilityPage';
import EditFacilityPage from './pages/provider/EditFacilityPage';
import AllBookingsPage from './pages/provider/AllBookingsPage';
import ManageFacilities from './pages/provider/ManageFacilitiesPage';
import ProviderFacilityDetails from './pages/provider/FacilityDetailsPage';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to={user?.role === 'PROVIDER' ? '/provider/dashboard' : '/customer/search'} /> : <LoginPage />}
          />
          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/" /> : <SignupPage />}
          />

          {/* Customer */}
          <Route path="/customer/search" element={<CustomerSearchPage />} />
          <Route path="/customer/facility/:id" element={<FacilityDetailsPage />} />

          <Route
            path="/customer/booking/:facilityId/vehicle"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                <VehicleDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/booking/:facilityId/review"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                <BookingReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/booking/:facilityId/payment"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/booking/:ticketId/success"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                <BookingSuccessPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/tickets"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                <MyTicketsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/passes"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                <MyPassesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Provider */}
          <Route
            path="/provider/dashboard"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
                <ProviderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/facilities"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
                <FacilitiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/facilities/new"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
                <AddFacilityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/facilities/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
                <EditFacilityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/facilities/:id"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
                <ProviderFacilityDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/bookings"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
                <AllBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/manage-facilities"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
                <ManageFacilities />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;

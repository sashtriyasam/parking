import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './lib/queryClient';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';

// Pages (will be created)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import CustomerSearchPage from './pages/customer/SearchPage';
import FacilityDetailsPage from './pages/customer/FacilityDetailsPage';
import MyTicketsPage from './pages/customer/MyTicketsPage';
import MyPassesPage from './pages/customer/MyPassesPage';
import ProfilePage from './pages/customer/ProfilePage';
import ProviderDashboard from './pages/provider/DashboardPage';
import ManageFacilities from './pages/provider/ManageFacilitiesPage';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to={user?.role === 'PROVIDER' ? '/provider/dashboard' : '/customer/search'} /> : <LoginPage />}
          />
          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/" /> : <SignupPage />}
          />

          {/* Customer Routes */}
          <Route
            path="/customer/search"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                <CustomerSearchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/facility/:id"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                <FacilityDetailsPage />
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

          {/* Provider Routes */}
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
                <ManageFacilities />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, LayoutDashboard, Search, Ticket, Home, Menu } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function Navigation() {
  const { user, isAuthenticated, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  // If not authenticated or on landing/auth pages, show simple top nav or nothing (handled by App.tsx logic usually, but here we safeguard)
  // Actually App.tsx conditionally renders this. So we assume if this is rendered, we want the app nav.

  if (!isAuthenticated && location.pathname === '/') return null; // Edge case safeguard

  const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => (
    <button
      onClick={() => navigate(path)}
      className={cn(
        "flex flex-col items-center justify-center w-full h-full space-y-1",
        isActive(path) ? "text-primary" : "text-gray-400 hover:text-gray-600"
      )}
    >
      <Icon className={cn("w-6 h-6", isActive(path) && "fill-current")} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <>
      {/* DESKTOP TOP BAR */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/customer/search" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-lg">P</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">ParkEasy</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/customer/search" className={cn("text-sm font-medium transition-colors", isActive('/customer/search') ? "text-primary" : "text-gray-600 hover:text-gray-900")}>Find Parking</Link>
            <Link to="/customer/tickets" className={cn("text-sm font-medium transition-colors", isActive('/customer/tickets') ? "text-primary" : "text-gray-600 hover:text-gray-900")}>My Bookings</Link>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-primary font-bold">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <span>{user.name || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {user.role === 'provider' && (
                    <DropdownMenuItem onClick={() => navigate('/provider/dashboard')}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/customer/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex space-x-2">
                <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
                <Button onClick={() => navigate('/signup')}>Sign Up</Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM TAB BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 h-16 pb-safe">
        <div className="grid grid-cols-3 h-full">
          <NavItem icon={Search} label="Explore" path="/customer/search" />
          <NavItem icon={Ticket} label="Bookings" path="/customer/tickets" />
          <NavItem icon={User} label="Account" path="/customer/profile" />
        </div>
      </div>
    </>
  );
}

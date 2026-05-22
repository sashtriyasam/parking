import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, LayoutDashboard, Search, Ticket, Home, Menu, ParkingSquare, Car, Sun, Moon } from 'lucide-react';
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
  const { user, isAuthenticated, logout, theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);
  const isProvider = user?.role === 'provider';

  // Navigation Config based on Role
  const navConfig = isProvider ? {
    home: '/provider/dashboard',
    explore: { path: '/provider/facilities', label: 'My Spaces', icon: ParkingSquare },
    bookings: { path: '/provider/bookings', label: 'Live Activity', icon: Car }
  } : {
    home: '/customer/search',
    explore: { path: '/customer/search', label: 'Find Parking', icon: Search },
    bookings: { path: '/customer/tickets', label: 'My Bookings', icon: Ticket }
  };

  if (!isAuthenticated && location.pathname === '/') return null;

  const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => (
    <button
      onClick={() => navigate(path)}
      className={cn(
        "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
        isActive(path) ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className={cn("w-6 h-6", isActive(path) && "fill-current")} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <>
      {/* DESKTOP TOP BAR */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={navConfig.home} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-lg">P</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground font-display">ParkEasy</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link to={navConfig.explore.path} className={cn("text-sm font-medium transition-colors", isActive(navConfig.explore.path) ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              {navConfig.explore.label}
            </Link>
            <Link to={navConfig.bookings.path} className={cn("text-sm font-medium transition-colors", isActive(navConfig.bookings.path) ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              {navConfig.bookings.label}
            </Link>
            {isProvider && (
               <>
                  <Link to="/provider/analytics" className={cn("text-sm font-medium transition-colors", isActive("/provider/analytics") ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                    Analytics
                  </Link>
                  <Link to="/provider/scan" className={cn("text-sm font-medium transition-colors", isActive("/provider/scan") ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                    Scan QR
                  </Link>
               </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Toggle light/dark mode"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 text-foreground hover:bg-secondary">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <span>{user.name || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-border text-foreground">
                  {user.role === 'provider' && (
                    <DropdownMenuItem onClick={() => navigate('/provider/dashboard')} className="hover:bg-secondary focus:bg-secondary cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate(user.role === 'provider' ? '/provider/profile' : '/customer/profile')} className="hover:bg-secondary focus:bg-secondary cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive hover:bg-secondary focus:bg-secondary cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex space-x-2">
                <Button variant="ghost" onClick={() => navigate('/login')} className="text-foreground hover:bg-secondary">Login</Button>
                <Button onClick={() => navigate('/signup')} className="bg-primary text-primary-foreground hover:bg-primary/95">Sign Up</Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM TAB BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-md border-t border-border h-16 pb-safe transition-colors">
        <div className="flex justify-between items-center h-full px-6">
          <NavItem icon={navConfig.explore.icon} label={navConfig.explore.label} path={navConfig.explore.path} />
          {isProvider && <NavItem icon={Search} label="Scan" path="/provider/scan" />}
          <NavItem icon={navConfig.bookings.icon} label={navConfig.bookings.label} path={navConfig.bookings.path} />
          <NavItem icon={User} label="Account" path={isProvider ? "/provider/profile" : "/customer/profile"} />
          
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center justify-center space-y-1 text-muted-foreground active:text-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            <span className="text-[10px] font-medium">Theme</span>
          </button>
        </div>
      </div>
    </>
  );
}


import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, LayoutDashboard, Menu } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/app/components/ui/sheet';
import { useState } from 'react';

export function Navigation() {
  const { user, isAuthenticated, logout } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardLink = user?.role === 'provider' ? '/provider/dashboard' : '/customer/search';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-lg">P</span>
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900">ParkEasy</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/customer/search" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
              Find Parking
            </Link>
            <Link to="/#about" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
              About
            </Link>
            <Link to="/#contact" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate(dashboardLink)}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  {user.role === 'customer' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/customer/tickets')}>
                        My Tickets
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/customer/profile')}>
                        Profile
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button onClick={() => navigate('/signup')} className="bg-indigo-600 hover:bg-indigo-700">
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col space-y-4 mt-8">
                  <Link
                    to="/customer/search"
                    className="text-gray-700 hover:text-indigo-600 font-medium py-2"
                    onClick={() => setOpen(false)}
                  >
                    Find Parking
                  </Link>
                  <Link
                    to="/#about"
                    className="text-gray-700 hover:text-indigo-600 font-medium py-2"
                    onClick={() => setOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    to="/#contact"
                    className="text-gray-700 hover:text-indigo-600 font-medium py-2"
                    onClick={() => setOpen(false)}
                  >
                    Contact
                  </Link>
                  
                  <div className="border-t pt-4">
                    {isAuthenticated && user ? (
                      <>
                        <div className="mb-4">
                          <p className="text-sm text-gray-500">Logged in as</p>
                          <p className="font-semibold">{user.name}</p>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full mb-2"
                          onClick={() => {
                            navigate(dashboardLink);
                            setOpen(false);
                          }}
                        >
                          Dashboard
                        </Button>
                        <Button variant="outline" className="w-full" onClick={handleLogout}>
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="w-full mb-2"
                          onClick={() => {
                            navigate('/login');
                            setOpen(false);
                          }}
                        >
                          Login
                        </Button>
                        <Button
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => {
                            navigate('/signup');
                            setOpen(false);
                          }}
                        >
                          Sign Up
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

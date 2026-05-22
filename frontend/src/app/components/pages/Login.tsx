import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import pkg from '../../../../package.json';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isProvider, setIsProvider] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Pass the selected role preference
      await login(email, password, isProvider ? 'provider' : 'customer');

      // Get the latest user from storage to verify role (login updates context/storage)
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

      if (isProvider && storedUser.role !== 'provider') {
        toast.warning('Logged in, but this account is not a Partner account.');
        // Navigate based on actual role
        navigate('/customer/search');
        return;
      }

      toast.success(isProvider ? 'Welcome Partner!' : 'Welcome back!');
      navigate(isProvider ? '/provider/dashboard' : '/customer/search');
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 flex flex-col transition-colors duration-300 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button 
          onClick={() => navigate('/welcome')} 
          className="p-2 -ml-2 hover:bg-secondary text-foreground rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center pb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center justify-between font-display">
          <span>{isProvider ? 'Partner Login' : 'Welcome back'}</span>
          <span className="text-[10px] font-normal text-muted-foreground">v{pkg.version}</span>
        </h1>
        <p className="text-muted-foreground mb-6 font-sans">
          {isProvider ? 'Manage your parking business' : 'Enter your details to continue'}
        </p>

        {isProvider && (
          <div 
            className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2 duration-300"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="w-10 h-10 bg-primary/15 rounded-full flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-lg font-display">P</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Partner Mode Active</p>
              <p className="text-xs text-primary/70">Logging in to provider dashboard</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-foreground font-medium mb-1.5 block">Email or Mobile</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-border bg-input-background text-foreground text-lg rounded-md focus:border-primary focus:ring-primary focus-visible:ring-primary"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-foreground font-medium mb-1.5 block">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-border bg-input-background text-foreground text-lg pr-10 rounded-md focus:border-primary focus:ring-primary focus-visible:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/95 transition-all duration-150 active:scale-[0.98] rounded-md shadow-sm"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Continue'}
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              type="button" 
              className="h-12 border-border bg-card text-foreground hover:bg-secondary transition-colors rounded-md"
            >
              <span className="mr-2">G</span> Google
            </Button>
            <Button 
              variant="outline" 
              type="button" 
              className="h-12 border-border bg-card text-foreground hover:bg-secondary transition-colors rounded-md"
            >
              <span className="mr-2"></span> Apple
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="text-muted-foreground mb-4">
            {isProvider ? 'New to ParkEasy Partner?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => navigate('/signup', { state: { isProvider } })}
              className="font-semibold text-primary hover:underline focus:outline-none"
            >
              {isProvider ? 'Register your Space' : 'Sign up'}
            </button>
          </p>

          <div className="text-xs text-muted-foreground">
            {isProvider ? (
              <>
                Not a provider?{' '}
                <button
                  type="button"
                  onClick={() => setIsProvider(false)}
                  className="underline text-primary font-medium focus:outline-none"
                >
                  Customer Login
                </button>
              </>
            ) : (
              <>
                Are you a parking provider?{' '}
                <button
                  type="button"
                  onClick={() => setIsProvider(true)}
                  className="underline text-primary font-medium focus:outline-none"
                >
                  Partner Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


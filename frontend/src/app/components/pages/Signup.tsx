import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

export function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if directed here with intent to be provider
  const [isProvider, setIsProvider] = useState(location.state?.isProvider || false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Pass the selected role preference
      await signup(name, email, password, phone, isProvider ? 'provider' : 'customer');
      toast.success(isProvider ? 'Partner account created!' : 'Account created!');

      // Redirect based on role
      if (isProvider) {
        navigate('/provider/onboarding');
      } else {
        navigate('/customer/search');
      }
    } catch (error) {
      toast.error('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 flex flex-col transition-colors duration-300 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button 
          onClick={() => navigate('/login')} 
          className="p-2 -ml-2 hover:bg-secondary text-foreground rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col pb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2 font-display">
          {isProvider ? 'Become a Partner' : 'Create account'}
        </h1>
        <p className="text-muted-foreground mb-8 font-sans">
          {isProvider ? 'List your spot and start earning' : 'Join ParkEasy to book spots in seconds'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="text-foreground font-medium mb-1.5 block">Full Name</Label>
            <Input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 border-border bg-input-background text-foreground text-lg rounded-md focus:border-primary focus:ring-primary focus-visible:ring-primary"
              required
            />
          </div>

          <div>
            <Label className="text-foreground font-medium mb-1.5 block">Email</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-border bg-input-background text-foreground text-lg rounded-md focus:border-primary focus:ring-primary focus-visible:ring-primary"
              required
            />
          </div>

          <div>
            <Label className="text-foreground font-medium mb-1.5 block">Phone Number</Label>
            <Input
              type="tel"
              placeholder="+91 98765 43210"
              pattern="^\+?[1-9]\d{9,14}$"
              title="Please enter a valid phone number with 10 to 15 digits (e.g. +919876543210 or 9876543210)"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^+\d]/g, ''))}
              className="h-12 border-border bg-input-background text-foreground text-lg rounded-md focus:border-primary focus:ring-primary focus-visible:ring-primary"
              required
            />
          </div>

          <div>
            <Label className="text-foreground font-medium mb-1.5 block">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
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

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/95 transition-all duration-150 active:scale-[0.98] mt-4 rounded-md shadow-sm"
            disabled={loading}
          >
            {loading ? 'Creating...' : (isProvider ? 'Register as Partner' : 'Sign Up')}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By continuing, you agree to our <span className="underline cursor-pointer hover:text-foreground">Terms of Service</span> and <span className="underline cursor-pointer hover:text-foreground">Privacy Policy</span>.
          </p>

          <div className="mt-6 text-center text-sm">
            <div className="text-xs text-muted-foreground">
              {isProvider ? (
                <>
                  Looking to park?{' '}
                  <button
                    type="button"
                    onClick={() => setIsProvider(false)}
                    className="underline text-primary font-medium focus:outline-none"
                  >
                    Join as Customer
                  </button>
                </>
              ) : (
                <>
                  Have a parking spot?{' '}
                  <button
                    type="button"
                    onClick={() => setIsProvider(true)}
                    className="underline text-primary font-medium focus:outline-none"
                  >
                    Join as Partner
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


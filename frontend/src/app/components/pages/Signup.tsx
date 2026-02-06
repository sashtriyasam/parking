import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
      await signup(name, email, password, isProvider ? 'provider' : 'customer');
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
    <div className="min-h-screen bg-white p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button onClick={() => navigate('/login')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
      </div>

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col pb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isProvider ? 'Become a Partner' : 'Create account'}
        </h1>
        <p className="text-gray-500 mb-8">
          {isProvider ? 'List your spot and start earning' : 'Join ParkEasy to book spots in seconds'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="text-gray-700 font-medium mb-1.5 block">Full Name</Label>
            <Input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 border-gray-300 text-lg"
              required
            />
          </div>

          <div>
            <Label className="text-gray-700 font-medium mb-1.5 block">Email</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-gray-300 text-lg"
              required
            />
          </div>

          <div>
            <Label className="text-gray-700 font-medium mb-1.5 block">Password</Label>
            <div className="relative">
              <Input
                // Actually keep it password type but toggle visibility
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-gray-300 text-lg pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 mt-4 shadow-md"
            disabled={loading}
          >
            {loading ? 'Creating...' : (isProvider ? 'Register as Partner' : 'Sign Up')}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            By continuing, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>

          <div className="mt-6 text-center text-sm">
            <div className="text-xs text-gray-500">
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

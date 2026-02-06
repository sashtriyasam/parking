import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card } from '@/app/components/ui/card';
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
    <div className="min-h-screen bg-white p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button onClick={() => navigate('/welcome')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
      </div>

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center pb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isProvider ? 'Partner Login' : 'Welcome back'}
        </h1>
        <p className="text-gray-500 mb-8">
          {isProvider ? 'Manage your parking business' : 'Enter your details to continue'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium mb-1.5 block">Email or Mobile</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-gray-300 text-lg focus:border-primary focus:ring-primary"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium mb-1.5 block">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-gray-300 text-lg pr-10 focus:border-primary focus:ring-primary"
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
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-md"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Continue'}
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" type="button" className="h-12 border-gray-200 hover:bg-gray-50">
              <span className="mr-2">G</span> Google
            </Button>
            <Button variant="outline" type="button" className="h-12 border-gray-200 hover:bg-gray-50">
              <span className="mr-2"></span> Apple
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="text-gray-600 mb-4">
            {isProvider ? 'New to ParkEasy Partner?' : "Don't have an account?"}{' '}
            <button
              onClick={() => navigate('/signup', { state: { isProvider } })}
              className="font-semibold text-primary hover:underline focus:outline-none"
            >
              {isProvider ? 'Register your Space' : 'Sign up'}
            </button>
          </p>

          <div className="text-xs text-gray-500">
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

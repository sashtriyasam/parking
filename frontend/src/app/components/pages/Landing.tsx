import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { useApp } from '@/context/AppContext';

export function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useApp();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'provider') {
        navigate('/provider/dashboard', { replace: true });
      } else {
        navigate('/customer/search', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-background transition-colors duration-300 animate-in fade-in duration-500">
      
      {/* Top Section: Hero Image */}
      <div className="flex-1 flex items-center justify-center w-full max-w-md my-auto">
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-border bg-muted shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxwYXJraW5nJTIwY2FyJTIwaWxsdXN0cmF0aW9ufGVufDB8fHx8MTc3MDA1OTAxMHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Parking Illustration"
            className="w-full h-full object-cover grayscale-[10%] contrast-[1.05]"
          />
        </div>
      </div>

      {/* Middle Section: Hero Content */}
      <div className="w-full max-w-md text-center space-y-3 my-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display">
          Find & Book Parking <br />
          <span className="text-primary">in Seconds</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg font-sans">
          Skip the search. Just park.
        </p>
      </div>

      {/* Bottom Section: CTA Actions */}
      <div className="w-full max-w-md space-y-4 mb-4">
        <Button
          size="lg"
          className="w-full h-12 text-base font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/95 transition-all duration-150 active:scale-[0.98] shadow-sm"
          onClick={() => navigate('/login')}
        >
          Get Started
        </Button>

        <div className="flex flex-col items-center justify-center text-sm font-medium space-y-2 mt-4 font-sans">
          <div>
            <span className="text-muted-foreground mr-1">Already have an account?</span>
            <button
              type="button"
              className="text-primary hover:underline font-semibold"
              onClick={() => navigate('/login')}
            >
              Log In
            </button>
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            onClick={() => navigate('/signup', { state: { isProvider: true } })}
          >
            Own a parking spot? Join as Partner
          </button>
        </div>
      </div>
    </div>
  );
}


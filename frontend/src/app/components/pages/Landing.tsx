import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-background animate-in slide-in-from-bottom duration-700">

      {/* Top: Illustration */}
      <div className="flex-1 flex items-center justify-center w-full max-w-md">
        <img
          src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxwYXJraW5nJTIwY2FyJTIwaWxsdXN0cmF0aW9ufGVufDB8fHx8MTc3MDA1OTAxMHww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Parking Illustration"
          className="w-full h-auto rounded-xl shadow-2xl object-cover"
        />
      </div>

      {/* Middle: Content */}
      <div className="w-full max-w-md text-center space-y-4 my-8">
        <h1 className="text-4xl font-black text-foreground leading-tight">
          Find & Book Parking <br />
          <span className="text-primary">in Seconds</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Skip the search. Just park.
        </p>
      </div>

      {/* Bottom: CTA */}
      <div className="w-full max-w-md space-y-4 mb-4">
        <Button
          size="lg"
          className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
          onClick={() => navigate('/login')} // Currently leading to login/signup choice logic if needed
        >
          Get Started
        </Button>

        <div className="flex flex-col items-center justify-center text-sm font-medium space-y-2 mt-4">
          <div>
            <span className="text-muted-foreground mr-1">Already have an account?</span>
            <button
              className="text-primary hover:underline"
              onClick={() => navigate('/login')}
            >
              Log In
            </button>
          </div>
          <button
            className="text-gray-500 hover:text-gray-900 text-xs"
            onClick={() => navigate('/signup', { state: { isProvider: true } })}
          >
            Has a parking spot? Join as Partner
          </button>
        </div>
      </div>
    </div>
  );
}

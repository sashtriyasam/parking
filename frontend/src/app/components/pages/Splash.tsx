import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function Splash() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/welcome');
        }, 2500);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl transform transition-all hover:scale-105">
                <span className="text-white font-black text-5xl">P</span>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">ParkEasy</h1>
            <p className="text-muted-foreground font-medium">Smart Parking Made Simple</p>
        </div>
    );
}

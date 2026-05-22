import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Car, Clock, Building, QrCode, ArrowLeft, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface VehicleStatus {
    isParked: boolean;
    booking?: {
        id: string;
        entryTime: string;
        facilityName: string;
        slotNumber: string;
        status: string;
    };
}

export function ProviderVehicleChecker() {
    const navigate = useNavigate();
    const [plateNumber, setPlateNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<VehicleStatus | null>(null);
    const [searchedPlate, setSearchedPlate] = useState('');

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!plateNumber.trim()) return;

        try {
            setIsLoading(true);
            // Simulating API call/verification delay
            await new Promise(resolve => setTimeout(resolve, 800));

            // Mock result for demonstration
            const mockResult = Math.random() > 0.5 ? {
                isParked: true,
                booking: {
                    id: `bk-${Date.now().toString().slice(-6)}`,
                    entryTime: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 hours ago
                    facilityName: 'Main Street Parking Garage',
                    slotNumber: 'A-15',
                    status: 'active'
                }
            } : { isParked: false };

            setResult(mockResult);
            setSearchedPlate(plateNumber.toUpperCase());
        } catch (error) {
            toast.error('Failed to check vehicle');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pt-20 pb-16 font-sans">
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            
            <div className="max-w-md mx-auto px-4 relative z-10">
                {/* Header Back Button */}
                <div className="flex items-center justify-between mb-6">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="font-bold gap-2 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="font-bold gap-1.5 text-primary hover:text-primary/80 rounded-md transition-colors"
                        onClick={() => navigate('/provider/qr-scanner')}
                    >
                        <QrCode className="w-4 h-4" /> QR Scanner
                    </Button>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-foreground tracking-tight font-display">Vehicle Checker</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground font-medium">Verify if a vehicle is authorized or currently active</p>
                </div>

                <Card className="rounded-lg border-border bg-card shadow-sm">
                    <CardHeader className="p-5 pb-3">
                        <CardTitle className="text-lg font-bold font-display">Check Number Plate</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">Enter the vehicle registration plate below</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-4">
                        <form onSubmit={handleCheck} className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="E.G. MH12AB1234"
                                    value={plateNumber}
                                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                                    className="h-11 uppercase text-base font-mono tracking-wider bg-secondary border-border text-foreground rounded-md placeholder:font-sans placeholder:tracking-normal placeholder:font-normal"
                                    required
                                />
                                <Button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="h-11 px-4 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-md shadow-sm transition-all"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                </Button>
                            </div>
                        </form>

                        <AnimatePresence mode="wait">
                            {result && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mt-6 pt-5 border-t border-border space-y-5"
                                >
                                    <div className="text-center">
                                        <div className={`w-14 h-14 rounded-md flex items-center justify-center mx-auto mb-3 shadow-sm ${
                                            result.isParked ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                                        }`}>
                                            {result.isParked ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                        </div>
                                        <h3 className="text-xl font-bold tracking-tight text-foreground font-display">{searchedPlate}</h3>
                                        <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                                            result.isParked 
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                                : 'bg-secondary text-muted-foreground'
                                        }`}>
                                            {result.isParked ? 'Currently Parked' : 'No Active Booking'}
                                        </span>
                                    </div>

                                    {result.isParked && result.booking && (
                                        <div className="bg-secondary/40 border border-border/50 rounded-lg p-4 space-y-2.5 text-xs">
                                            <div className="flex justify-between items-center py-0.5">
                                                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                                                    <Building className="w-3.5 h-3.5 text-muted-foreground" /> Facility
                                                </span>
                                                <span className="font-semibold text-foreground">{result.booking.facilityName}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-0.5 border-t border-border/30">
                                                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                                                    <Car className="w-3.5 h-3.5 text-muted-foreground" /> Space/Slot
                                                </span>
                                                <span className="font-bold text-foreground font-mono bg-secondary/80 px-1.5 py-0.5 rounded-sm border border-border/40">
                                                    {result.booking.slotNumber}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-0.5 border-t border-border/30">
                                                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Check-in Time
                                                </span>
                                                <span className="font-semibold text-foreground">
                                                    {new Date(result.booking.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-0.5 border-t border-border/30">
                                                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                                                    <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" /> Ticket Reference
                                                </span>
                                                <span className="font-mono text-[10px] text-muted-foreground font-bold">{result.booking.id}</span>
                                            </div>
                                        </div>
                                    )}

                                    {!result.isParked && (
                                        <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 text-center">
                                            <p className="text-xs text-muted-foreground font-medium">
                                                This vehicle plate does not have an active booking session recorded in the system.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

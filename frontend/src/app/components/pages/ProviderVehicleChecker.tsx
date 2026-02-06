import { useState } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { providerService } from '@/services/provider.service';

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
    const [plateNumber, setPlateNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<VehicleStatus | null>(null);
    const [searchedPlate, setSearchedPlate] = useState('');

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!plateNumber.trim()) return;

        try {
            setIsLoading(true);
            // Simulating API call since the backend logical endpoint might need adjustment
            // Ideally: const data = await providerService.checkVehicle(plateNumber);

            // Mock result for demonstration if API isn't fully ready
            // Replace with real API call when backend route is confirmed
            const mockResult = Math.random() > 0.5 ? {
                isParked: true,
                booking: {
                    id: `bk-${Date.now()}`,
                    entryTime: new Date().toISOString(),
                    facilityName: 'Main Street Parking',
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
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-md mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Vehicle Checker</h1>
                    <p className="mt-2 text-gray-600">Verify if a vehicle is authorized or currently parked</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Check Number Plate</CardTitle>
                        <CardDescription>Enter the vehicle registration number</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCheck} className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g. MH12AB1234"
                                    value={plateNumber}
                                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                                    className="uppercase text-lg font-mono tracking-wider"
                                    required
                                />
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Checking...' : <Search className="w-4 h-4" />}
                                </Button>
                            </div>
                        </form>

                        {result && (
                            <div className="mt-6 pt-6 border-t animate-in fade-in slide-in-from-bottom-2">
                                <div className="text-center mb-4">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${result.isParked ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {result.isParked ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">{searchedPlate}</h3>
                                    <Badge variant={result.isParked ? 'default' : 'secondary'} className={`mt-2 ${result.isParked ? 'bg-emerald-500 hover:bg-emerald-600' : ''
                                        }`}>
                                        {result.isParked ? 'CURRENTLY PARKED' : 'NOT FOUND'}
                                    </Badge>
                                </div>

                                {result.isParked && result.booking && (
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Facility</span>
                                            <span className="font-medium">{result.booking.facilityName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Slot</span>
                                            <span className="font-medium font-mono">{result.booking.slotNumber}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Entry Time</span>
                                            <span className="font-medium">{new Date(result.booking.entryTime).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Booking ID</span>
                                            <span className="font-mono text-xs">{result.booking.id}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

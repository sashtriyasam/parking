import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { toast } from 'sonner';
import { providerService } from '@/services/provider.service';
import { useApp } from '@/context/AppContext';
import { LocationPicker } from '@/app/components/shared/LocationPicker';

export function ProviderOnboarding() {
    const navigate = useNavigate();
    const { refreshData } = useApp();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        operating_hours: '24/7',
        total_floors: 1,
        description: '',
        latitude: null as number | null,
        longitude: null as number | null,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLocationChange = (lat: number | null, lng: number | null) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Ensure types match backend expectations
            const payload = {
                ...formData,
                total_floors: parseInt(formData.total_floors as any, 10),
                // If user didn't pick, backend will geocode address
                latitude: formData.latitude ?? null,
                longitude: formData.longitude ?? null,
            };

            await providerService.createFacility(payload);

            // Refresh global context
            await refreshData();

            toast.success('Facility created! Now let\'s add some slots.');
            // After creating facility, go to slots management
            navigate('/provider/dashboard');
        } catch (error) {
            toast.error('Failed to create facility. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
                        <Building className="w-6 h-6 text-white" />
                    </div>
                </div>
                <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                    Set up your parking facility
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    This information will be shown to customers on the map.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="shadow-lg border-0">
                    <CardHeader>
                        <CardTitle>Facility Details</CardTitle>
                        <CardDescription>Tell us about your parking location</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Parking Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g. City Center Parking"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        placeholder="e.g. Mumbai"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="address">Full Address</Label>
                                    <Textarea
                                        id="address"
                                        name="address"
                                        placeholder="Full street address..."
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="operating_hours">Hours</Label>
                                        <Input
                                            id="operating_hours"
                                            name="operating_hours"
                                            value={formData.operating_hours}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="total_floors">Floors</Label>
                                        <Input
                                            type="number"
                                            id="total_floors"
                                            name="total_floors"
                                            min="1"
                                            value={formData.total_floors}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                    <Label className="text-sm font-semibold text-gray-700">Confirm Location on Map</Label>
                                    <p className="text-[10px] text-gray-500 mb-2">
                                        Drag the pin to your exact parking entrance for accurate customer navigation.
                                    </p>
                                    <LocationPicker 
                                        lat={formData.latitude} 
                                        lng={formData.longitude} 
                                        onChange={handleLocationChange as any} 
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
                                {loading ? 'Creating Profile...' : 'Create & Continue'}
                                {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

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
            [name]: name === 'total_floors' ? parseInt(value, 10) || 1 : value
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
            const payload = {
                ...formData,
                total_floors: formData.total_floors,
                latitude: formData.latitude ?? null,
                longitude: formData.longitude ?? null,
            };

            await providerService.createFacility(payload);
            await refreshData();

            toast.success('Facility created! Now let\'s add some slots.');
            navigate('/provider/dashboard');
        } catch (error) {
            toast.error('Failed to create facility. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-foreground font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                        <Building className="w-6 h-6 text-white" />
                    </div>
                </div>
                <h2 className="mt-2 text-center text-3xl font-black text-foreground tracking-tight font-display">
                    Set up your facility
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground font-medium">
                    This information will be shown to customers on the map.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="shadow-sm border border-border bg-card rounded-lg">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-bold font-display text-foreground">Facility Details</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground font-medium">Tell us about your parking location</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Parking Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g. City Center Parking"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-0.5"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="city" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">City</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        placeholder="e.g. Mumbai"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-0.5"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="address" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Address</Label>
                                    <Textarea
                                        id="address"
                                        name="address"
                                        placeholder="Full street address..."
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-0.5"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="operating_hours" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hours</Label>
                                        <Input
                                            id="operating_hours"
                                            name="operating_hours"
                                            value={formData.operating_hours}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-0.5"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="total_floors" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Floors</Label>
                                        <Input
                                            type="number"
                                            id="total_floors"
                                            name="total_floors"
                                            min="1"
                                            value={formData.total_floors}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-0.5"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-3 border-t border-border">
                                    <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Confirm Location on Map</Label>
                                    <p className="text-[10px] text-muted-foreground font-medium mb-2">
                                        Drag the pin to your exact parking entrance for accurate customer navigation.
                                    </p>
                                    <LocationPicker 
                                        lat={formData.latitude} 
                                        lng={formData.longitude} 
                                        onChange={handleLocationChange} 
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-10 text-sm font-bold mt-4" disabled={loading}>
                                {loading ? 'Creating Profile...' : 'Create & Continue'}
                                {!loading && <ArrowRight className="ml-1.5 w-4 h-4" />}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

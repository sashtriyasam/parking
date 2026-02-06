import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Edit, Trash2, Search, Building } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'sonner';
import { providerService } from '@/services/provider.service';
import type { Facility } from '@/services/provider.service';

export function ProviderFacilities() {
    const navigate = useNavigate();
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        operating_hours: '',
        total_floors: 1,
        description: '',
    });

    useEffect(() => {
        loadFacilities();
    }, []);

    const loadFacilities = async () => {
        try {
            setIsLoading(true);
            const data = await providerService.getMyFacilities();
            setFacilities(data);
        } catch (error) {
            toast.error('Failed to load facilities');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingFacility) {
                await providerService.updateFacility(editingFacility.id, formData);
                toast.success('Facility updated successfully');
            } else {
                await providerService.createFacility(formData);
                toast.success('Facility created successfully');
            }
            setIsAddDialogOpen(false);
            setEditingFacility(null);
            resetForm();
            loadFacilities();
        } catch (error) {
            toast.error(editingFacility ? 'Failed to update facility' : 'Failed to create facility');
            console.error(error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            city: '',
            operating_hours: '',
            total_floors: 1,
            description: '',
        });
    };

    const handleEdit = (facility: Facility) => {
        setEditingFacility(facility);
        setFormData({
            name: facility.name,
            address: facility.address,
            city: facility.city,
            operating_hours: facility.operating_hours,
            total_floors: facility.total_floors,
            description: facility.description || '',
        });
        setIsAddDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this facility? This action cannot be undone.')) {
            try {
                await providerService.deleteFacility(id);
                toast.success('Facility deleted successfully');
                loadFacilities();
            } catch (error) {
                toast.error('Failed to delete facility');
                console.error(error);
            }
        }
    };

    const filteredFacilities = facilities.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Facilities</h1>
                        <p className="mt-2 text-gray-600">Manage your parking locations and slots</p>
                    </div>
                    <Button onClick={() => { setEditingFacility(null); resetForm(); setIsAddDialogOpen(true); }}>
                        <Plus className="w-5 h-5 mr-2" />
                        Add New Facility
                    </Button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="Search facilities by name or city..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Facilities Grid */}
                {isLoading ? (
                    <div className="text-center py-12">Loading facilities...</div>
                ) : filteredFacilities.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
                        <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No facilities found</h3>
                        <p className="text-gray-500 mt-2 mb-6">Get started by adding your first parking location.</p>
                        <Button onClick={() => setIsAddDialogOpen(true)}>
                            <Plus className="w-5 h-5 mr-2" />
                            Add Facility
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFacilities.map((facility) => (
                            <Card key={facility.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl">{facility.name}</CardTitle>
                                            <CardDescription className="flex items-center mt-1">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                {facility.city}
                                            </CardDescription>
                                        </div>
                                        {facility.occupancy !== undefined && (
                                            <Badge variant={facility.occupancy > 80 ? 'destructive' : 'secondary'}>
                                                {Math.round(facility.occupancy)}% Full
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {facility.address}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="bg-gray-50 p-2 rounded">
                                                <span className="block text-gray-500 text-xs">Total Floors</span>
                                                <span className="font-medium">{facility.total_floors}</span>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded">
                                                <span className="block text-gray-500 text-xs">Operating Hours</span>
                                                <span className="font-medium">{facility.operating_hours}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2 border-t mt-4">
                                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(facility)}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/provider/facilities/${facility.id}/slots`)}>
                                                Manage Slots
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(facility.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Add/Edit Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader>
                            <DialogTitle>{editingFacility ? 'Edit Facility' : 'Add New Facility'}</DialogTitle>
                            <DialogDescription>
                                Enter the details of your parking facility.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Facility Name</Label>
                                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Full Address</Label>
                                <Textarea id="address" name="address" value={formData.address} onChange={handleInputChange} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="operating_hours">Operating Hours</Label>
                                    <Input id="operating_hours" name="operating_hours" placeholder="e.g. 24/7 or 9AM - 9PM" value={formData.operating_hours} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="total_floors">Number of Floors</Label>
                                    <Input type="number" id="total_floors" name="total_floors" min="1" value={formData.total_floors} onChange={handleInputChange} required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">{editingFacility ? 'Update Changes' : 'Create Facility'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

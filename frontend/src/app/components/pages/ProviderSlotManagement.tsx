import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { providerService } from '@/services/provider.service';
import type { Facility } from '@/services/provider.service';
import type { VehicleType } from '@/types';

interface SlotRange {
    prefix: string;
    startNumber: number;
    count: number;
    floor: number;
    vehicleType: VehicleType;
    pricePerHour: number;
}

export function ProviderSlotManagement() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [facility, setFacility] = useState<Facility | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [slots, setSlots] = useState<any[]>([]);

    // Bulk Create Form
    const [slotRange, setSlotRange] = useState<SlotRange>({
        prefix: 'A',
        startNumber: 1,
        count: 10,
        floor: 1,
        vehicleType: 'car',
        pricePerHour: 50,
    });

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [facilityData, slotsData] = await Promise.all([
                providerService.getFacilityDetails(id!),
                providerService.getFacilitySlots(id!)
            ]);
            setFacility(facilityData);
            setSlots(slotsData);
        } catch (error) {
            toast.error('Failed to load facility data');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkCreate = async () => {
        if (!id) return;

        try {
            await providerService.bulkCreateSlots(id, {
                prefix: slotRange.prefix,
                start_number: Number(slotRange.startNumber),
                count: Number(slotRange.count),
                floor: Number(slotRange.floor),
                vehicle_type: slotRange.vehicleType,
                price_per_hour: Number(slotRange.pricePerHour)
            });

            toast.success('Slots created successfully');
            loadData();
        } catch (error) {
            toast.error('Failed to create slots');
            console.error(error);
        }
    };

    const handleDeleteSlot = async (slotId: string) => {
        if (confirm('Are you sure you want to delete this slot?')) {
            try {
                await providerService.deleteSlot(slotId);
                toast.success('Slot deleted');
                setSlots(prev => prev.filter(s => s.id !== slotId));
            } catch (error) {
                toast.error('Failed to delete slot');
            }
        }
    };

    if (isLoading) {
        return <div className="min-h-screen pt-20 flex justify-center"><p>Loading...</p></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all" onClick={() => navigate('/provider/facilities')}>
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Facilities
                    </Button>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{facility?.name} - Slot Management</h1>
                            <p className="mt-1 text-gray-600">{facility?.address}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create Slots Form */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Bulk Create Slots</CardTitle>
                                <CardDescription>Add multiple slots at once for a specific floor</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Prefix (e.g. A, B)</Label>
                                        <Input
                                            value={slotRange.prefix}
                                            onChange={e => setSlotRange({ ...slotRange, prefix: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Start Number</Label>
                                        <Input
                                            type="number"
                                            value={slotRange.startNumber}
                                            onChange={e => setSlotRange({ ...slotRange, startNumber: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Number of Slots to Create</Label>
                                    <Input
                                        type="number"
                                        value={slotRange.count}
                                        onChange={e => setSlotRange({ ...slotRange, count: Number(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Floor Number</Label>
                                    <Select
                                        value={String(slotRange.floor)}
                                        onValueChange={v => setSlotRange({ ...slotRange, floor: Number(v) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: facility?.total_floors || 1 }).map((_, i) => (
                                                <SelectItem key={i} value={String(i + 1)}>Floor {i + 1}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Vehicle Type</Label>
                                    <Select
                                        value={slotRange.vehicleType}
                                        onValueChange={v => setSlotRange({ ...slotRange, vehicleType: v as VehicleType })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="car">Car</SelectItem>
                                            <SelectItem value="bike">Bike</SelectItem>
                                            <SelectItem value="scooter">Scooter</SelectItem>
                                            <SelectItem value="truck">Truck</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Price Per Hour (₹)</Label>
                                    <Input
                                        type="number"
                                        value={slotRange.pricePerHour}
                                        onChange={e => setSlotRange({ ...slotRange, pricePerHour: Number(e.target.value) })}
                                    />
                                </div>

                                <Button className="w-full" onClick={handleBulkCreate}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Generate Slots
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Slots List */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Existing Slots ({slots.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {slots.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        No slots created yet. Use the form to generate slots.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {slots.map((slot) => (
                                            <div key={slot.id} className="p-3 border rounded-lg hover:bg-gray-50 relative group">
                                                <div className="text-center">
                                                    <p className="font-bold text-lg">{slot.slotNumber}</p>
                                                    <Badge variant="outline" className="mt-1 text-xs">{slot.vehicleType}</Badge>
                                                    <p className="text-xs text-gray-500 mt-1">Floor {slot.floor}</p>
                                                </div>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleDeleteSlot(slot.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { User, Car, CreditCard, Heart, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { customerService } from '@/services/customer.service';
import type { Vehicle } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

export function CustomerProfile() {
  const { user } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState<{
    vehicleNumber: string;
    vehicleType: string;
    nickname: string;
  }>({
    vehicleNumber: '',
    vehicleType: 'car',
    nickname: ''
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await customerService.getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Failed to load vehicles', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await customerService.updateProfile({ full_name: name, phone_number: phone });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleAddVehicle = async () => {
    try {
      // Cast to any to bypass strict type check for now if userId is missing, 
      // or rely on backend to infer userId from token
      await customerService.addVehicle({
        ...newVehicle,
        vehicleType: newVehicle.vehicleType as any,
        userId: user?.id || '',
        isDefault: false
      });
      toast.success('Vehicle added successfully');
      setIsAddVehicleOpen(false);
      setNewVehicle({ vehicleNumber: '', vehicleType: 'car', nickname: '' });
      loadVehicles();
    } catch (error) {
      toast.error('Failed to add vehicle');
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await customerService.deleteVehicle(id);
      toast.success('Vehicle deleted');
      loadVehicles();
    } catch (error) {
      toast.error('Failed to delete vehicle');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card className="lg:col-span-1 p-6 h-fit">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-indigo-600" />
              </div>
              <h3 className="font-bold text-lg">{user?.name}</h3>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>

            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <User className="w-4 h-4 mr-2" />
                Personal Info
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Car className="w-4 h-4 mr-2" />
                My Vehicles
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <CreditCard className="w-4 h-4 mr-2" />
                Payment Methods
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Heart className="w-4 h-4 mr-2" />
                Favorites
              </Button>
            </div>
          </Card>

          {/* Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="personal">
              <TabsList className="w-full grid grid-cols-4 mb-6">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
                <TabsTrigger value="payment">Payment</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <Card className="p-6">
                  <h2 className="text-xl font-black mb-6">Personal Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={handleSaveProfile} className="bg-indigo-600 hover:bg-indigo-700">
                      Save Changes
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="vehicles">
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black">My Vehicles</h2>
                    <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Vehicle
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Vehicle</DialogTitle>
                          <DialogDescription>Enter vehicle details below</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Vehicle Number</Label>
                            <Input
                              placeholder="MH01AB1234"
                              value={newVehicle.vehicleNumber}
                              onChange={(e) => setNewVehicle({ ...newVehicle, vehicleNumber: e.target.value.toUpperCase() })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Nickname (Optional)</Label>
                            <Input
                              placeholder="My City Car"
                              value={newVehicle.nickname}
                              onChange={(e) => setNewVehicle({ ...newVehicle, nickname: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={newVehicle.vehicleType} onValueChange={(v) => setNewVehicle({ ...newVehicle, vehicleType: v })}>
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
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddVehicle}>Save Vehicle</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-4">
                    {vehicles.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No vehicles added yet.</p>
                    ) : (
                      vehicles.map(vehicle => (
                        <Card key={vehicle.id} className="p-4 border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <Car className="w-6 h-6 text-indigo-600" />
                              </div>
                              <div>
                                <p className="font-bold text-lg">{vehicle.vehicleNumber}</p>
                                <p className="text-sm text-gray-600 capitalize">{vehicle.nickname || 'My Vehicle'} • {vehicle.vehicleType}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteVehicle(vehicle.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="payment">
                <Card className="p-6">
                  <div className="text-center py-12 text-gray-500">
                    Payment methods management coming soon.
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="favorites">
                <Card className="p-6">
                  <h2 className="text-xl font-black mb-6">Favorite Parking Facilities</h2>
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">No favorites yet</p>
                    <p className="text-sm text-gray-500">
                      Add facilities to your favorites for quick access
                    </p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
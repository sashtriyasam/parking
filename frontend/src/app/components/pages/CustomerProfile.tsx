import { useState, useEffect } from 'react';
import { User, Car, CreditCard, Heart, Plus, Trash2, LogOut, ArrowRightLeft, ParkingSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { customerService } from '@/services/customer.service';
import type { Vehicle } from '@/types';
import { useNavigate } from 'react-router-dom';
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
  const { user, logout, switchRole } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
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
  const [isVerifying, setIsVerifying] = useState<string | null>(null);

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleVerifyRC = async (id: string, regNo: string) => {
    setIsVerifying(id);
    try {
      await customerService.verifyVehicleRC(id, regNo);
      toast.success('Vehicle RC Verified successfully!');
      loadVehicles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to verify RC');
    } finally {
      setIsVerifying(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Simple Clean Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Account</h1>
            <p className="text-gray-500">Manage your parking preferences</p>
          </div>
          <Button variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Left Col: Profile & Nav */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="bg-gray-900 h-20"></div>
              <div className="px-6 pb-6 -mt-10">
                <div className="w-20 h-20 bg-white rounded-full p-1 shadow-sm">
                  <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center font-bold text-2xl text-gray-500">
                    {user?.name?.charAt(0)}
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="font-bold text-lg">{user?.name}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </Card>

            {/* Partner Action */}
            <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 cursor-pointer hover:shadow-md transition-shadow" onClick={switchRole}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <ParkingSquare className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-indigo-900">Partner Mode</p>
                    <p className="text-xs text-indigo-600">List your parking space</p>
                  </div>
                </div>
                <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
              </CardContent>
            </Card>
          </div>

          {/* Right Col: Tabs */}
          <div className="md:col-span-2">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-6">
                <TabsTrigger value="personal">Profile</TabsTrigger>
                <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Details</CardTitle>
                    <CardDescription>Update your contact information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user?.email} disabled className="bg-gray-50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." />
                    </div>
                    <Button onClick={handleSaveProfile} className="w-full sm:w-auto">Save Changes</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vehicles">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>My Vehicles</CardTitle>
                      <CardDescription>Manage your registered vehicles</CardDescription>
                    </div>
                    <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Vehicle</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>License Plate</Label>
                            <Input
                              placeholder="MH 01 AB 1234"
                              value={newVehicle.vehicleNumber}
                              onChange={(e) => setNewVehicle({ ...newVehicle, vehicleNumber: e.target.value.toUpperCase() })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Vehicle Type</Label>
                            <Select value={newVehicle.vehicleType} onValueChange={(v) => setNewVehicle({ ...newVehicle, vehicleType: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="car">Car</SelectItem>
                                <SelectItem value="bike">Bike</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={handleAddVehicle} className="w-full">Add Vehicle</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {vehicles.length === 0 ? (
                      <p className="text-center text-gray-500 py-6">No vehicles added yet</p>
                    ) : (
                      vehicles.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border text-gray-400">
                              <Car className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-gray-900">{v.vehicleNumber}</p>
                                {v.is_verified && (
                                  <span className="px-2 border bg-green-50 text-green-700 border-green-200 rounded-md text-[10px] font-bold tracking-wide uppercase">
                                    Verified ✓
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 capitalize">{v.vehicleType}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!v.is_verified && (
                              <Button variant="outline" size="sm" className="hidden sm:flex h-8 px-3 text-indigo-600 border-indigo-200 hover:bg-indigo-50 text-xs shadow-sm bg-white" onClick={() => handleVerifyRC(v.id, v.vehicleNumber)} disabled={isVerifying === v.id}>
                                {isVerifying === v.id ? 'Verifying...' : 'Verify RC'}
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 h-8 w-8" onClick={() => handleDeleteVehicle(v.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>App Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-gray-400" />
                        <span>Manage Favorites</span>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <span>Payment Methods</span>
                      </div>
                      <Button variant="ghost" size="sm">Manage</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
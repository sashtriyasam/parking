import { useState } from 'react';
import { User, Car, CreditCard, Heart, Settings } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

export function CustomerProfile() {
  const { user } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully!');
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
              <Button variant="ghost" className="w-full justify-start" onClick={() => {}}>
                <User className="w-4 h-4 mr-2" />
                Personal Info
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => {}}>
                <Car className="w-4 h-4 mr-2" />
                My Vehicles
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => {}}>
                <CreditCard className="w-4 h-4 mr-2" />
                Payment Methods
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => {}}>
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
                    <Button className="bg-indigo-600 hover:bg-indigo-700">Add Vehicle</Button>
                  </div>
                  <div className="space-y-4">
                    <Card className="p-4 border-2 border-indigo-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Car className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">MH 01 AB 1234</p>
                            <p className="text-sm text-gray-600">Honda City • Car</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                            Default
                          </span>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Car className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">MH 02 CD 5678</p>
                            <p className="text-sm text-gray-600">Royal Enfield • Bike</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </Card>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="payment">
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black">Payment Methods</h2>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">Add Payment</Button>
                  </div>
                  <div className="space-y-4">
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold">•••• •••• •••• 4242</p>
                            <p className="text-sm text-gray-600">Expires 12/25</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">Remove</Button>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19.5 3.5L4.5 3.5C3.12 3.5 2 4.62 2 6V18C2 19.38 3.12 20.5 4.5 20.5H19.5C20.88 20.5 22 19.38 22 18V6C22 4.62 20.88 3.5 19.5 3.5ZM19.5 18H4.5V6H19.5V18ZM12 15C10.34 15 9 13.66 9 12C9 10.34 10.34 9 12 9C13.66 9 15 10.34 15 12C15 13.66 13.66 15 12 15Z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold">user@upi</p>
                            <p className="text-sm text-gray-600">UPI ID</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">Remove</Button>
                      </div>
                    </Card>
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
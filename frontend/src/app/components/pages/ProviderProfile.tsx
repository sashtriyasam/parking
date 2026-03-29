import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building, ExternalLink, Settings, LogOut, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { toast } from 'sonner';

export function ProviderProfile() {
    const { user, facilities, logout, switchRole } = useApp();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);

    // Filter facilities belonging to this provider
    const providerFacilities = useMemo(() => {
        return facilities.filter(f => f.providerId === user?.id);
    }, [facilities, user]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleSwitchToCustomer = async () => {
        await switchRole();
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Provider Account</h1>
                        <p className="text-gray-600">Manage your business profile and facilities</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleSwitchToCustomer}>
                            Switch to Customer View
                        </Button>
                        <Button variant="destructive" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Log Out
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-0 shadow-md overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 h-24"></div>
                            <div className="px-6 pb-6 relative">
                                <div className="absolute -top-12 left-6">
                                    <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-lg">
                                        <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-3xl font-bold text-gray-400 uppercase">
                                            {user?.name?.charAt(0) || 'P'}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-14">
                                    <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                    <div className="mt-4 flex flex-col gap-2">
                                        <div className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center">
                                            <Building className="w-4 h-4 mr-2" />
                                            {providerFacilities.length} Facilities Listed
                                        </div>
                                        <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center">
                                            <User className="w-4 h-4 mr-2" />
                                            Partner Status: Active
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm uppercase tracking-wider text-gray-500 font-semibold">Support</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-gray-600">Need help with your parking business?</p>
                                <Button variant="outline" className="w-full">Contact Support</Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        <Tabs defaultValue="preview" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-8">
                                <TabsTrigger value="preview">Preview Facilities</TabsTrigger>
                                <TabsTrigger value="details">Business Details</TabsTrigger>
                                <TabsTrigger value="payouts">Payouts</TabsTrigger>
                            </TabsList>

                            {/* PREVIEW TAB */}
                            <TabsContent value="preview" className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Facility Previews</h3>
                                        <p className="text-sm text-gray-500">See how your parking spots look to customers</p>
                                    </div>
                                    <Button onClick={() => navigate('/provider/facilities')}>
                                        Manage Facilities
                                    </Button>
                                </div>

                                {providerFacilities.length === 0 ? (
                                    <Card className="border-dashed border-2">
                                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                            <Building className="w-12 h-12 text-gray-300 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900">No Facilities Yet</h3>
                                            <p className="text-gray-500 mb-6">Create your first parking facility to see previews.</p>
                                            <Button onClick={() => navigate('/provider/facilities')}>Add Facility</Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-4">
                                        {providerFacilities.map(facility => (
                                            <Card key={facility.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                                <div className="p-6 flex items-center justify-between">
                                                    <div className="flex items-start space-x-4">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                                                            <Building className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 text-lg">{facility.name}</h4>
                                                            <p className="text-sm text-gray-500 mb-1">{facility.address}</p>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                Live
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                                            onClick={() => window.open(`/customer/facility/${facility.id}`, '_blank')}
                                                        >
                                                            <ExternalLink className="w-4 h-4 mr-2" />
                                                            View as Customer
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* BUSINESS DETAILS TAB */}
                            <TabsContent value="details">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Business Information</CardTitle>
                                        <CardDescription>Update your business contact details</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Business Name / Full Name</Label>
                                                <Input defaultValue={user?.name || ''} disabled={!isEditing} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Email Address</Label>
                                                <Input defaultValue={user?.email || ''} disabled />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Phone Number</Label>
                                                <Input defaultValue={user?.phone || ''} placeholder="+91..." disabled={!isEditing} />
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            {isEditing ? (
                                                <div className="flex gap-2">
                                                    <Button onClick={() => { setIsEditing(false); toast.success('Profile updated'); }}>Save Changes</Button>
                                                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                                </div>
                                            ) : (
                                                <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Details</Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* PAYOUTS TAB */}
                            <TabsContent value="payouts">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Payout Settings</CardTitle>
                                        <CardDescription>Manage how you get paid</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border shadow-sm">
                                                    <CreditCard className="w-6 h-6 text-gray-700" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">Bank Account ending in 4242</p>
                                                    <p className="text-sm text-gray-500">Primary Payout Method</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm">Manage</Button>
                                        </div>

                                        <Button className="w-full" variant="ghost">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Payout Method
                                        </Button>
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

function Plus({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}

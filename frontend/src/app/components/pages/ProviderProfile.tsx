import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building, ExternalLink, Settings, LogOut, CreditCard, ShieldCheck, Mail, Phone, Plus } from 'lucide-react';
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
    const [profileName, setProfileName] = useState(user?.name || '');
    const [profilePhone, setProfilePhone] = useState(user?.phone || '');

    // Filter facilities belonging to this provider
    const providerFacilities = useMemo(() => {
        return facilities.filter(f => f.providerId === user?.id);
    }, [facilities, user]);

    const handleLogout = () => {
        logout();
        navigate('/');
        toast.success('Logged out successfully');
    };

    const handleSwitchToCustomer = async () => {
        try {
            await switchRole();
            toast.success('Switched to customer view');
        } catch (error) {
            toast.error('Failed to switch role');
        }
    };

    const handleSaveChanges = () => {
        setIsEditing(false);
        toast.success('Business profile updated');
    };

    return (
        <div className="min-h-screen bg-background text-foreground pt-20 pb-16 font-sans">
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight font-display">Provider Account</h1>
                        <p className="text-sm text-muted-foreground font-medium mt-1">Manage your business profile, settings and facilities</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            onClick={handleSwitchToCustomer}
                            className="text-xs h-9 rounded-md border-border font-bold text-foreground hover:bg-secondary transition-all"
                        >
                            Switch to Customer View
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleLogout}
                            className="text-xs h-9 rounded-md font-bold transition-all gap-1.5"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Log Out
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Sidebar Info Sheet */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-border shadow-sm overflow-hidden bg-card rounded-lg">
                            {/* Accent Top Bar */}
                            <div className="h-1.5 bg-primary w-full" />
                            <div className="p-6 relative">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-secondary border border-border/60 rounded-lg flex items-center justify-center text-xl font-bold text-muted-foreground uppercase font-display select-none">
                                        {user?.name?.charAt(0) || 'P'}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-foreground tracking-tight font-display">{user?.name || 'Operator Partner'}</h2>
                                        <p className="text-xs text-muted-foreground font-medium break-all">{user?.email}</p>
                                    </div>
                                </div>
                                
                                <div className="mt-6 space-y-2">
                                    <div className="bg-secondary/50 border border-border/50 text-foreground px-3.5 py-2.5 rounded-md text-xs font-medium flex items-center gap-2">
                                        <Building className="w-4 h-4 text-primary" />
                                        <span>{providerFacilities.length} Facilities Listed</span>
                                    </div>
                                    <div className="bg-secondary/50 border border-border/50 text-foreground px-3.5 py-2.5 rounded-md text-xs font-medium flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        <span>Partner Status: Active</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="border-border shadow-sm bg-card rounded-lg">
                            <CardHeader className="p-5 pb-3">
                                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold font-display">Support Desk</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 pt-0 space-y-3.5">
                                <p className="text-xs text-muted-foreground leading-normal">
                                    Need assistance managing slots, reviewing payout transfers, or adjusting facility coordinates?
                                </p>
                                <Button 
                                    variant="outline" 
                                    className="w-full text-xs h-9 font-bold border-border rounded-md hover:bg-secondary"
                                    onClick={() => toast.info('Support ticket utility is loaded. Contacting provider support...')}
                                >
                                    Get Operator Help
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Settings Tabs */}
                    <div className="lg:col-span-8">
                        <Tabs defaultValue="preview" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-6 p-1 bg-secondary rounded-md border border-border/40">
                                <TabsTrigger 
                                    value="preview" 
                                    className="text-xs font-semibold rounded-sm py-1.5 transition-all text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                                >
                                    My Facilities
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="details" 
                                    className="text-xs font-semibold rounded-sm py-1.5 transition-all text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                                >
                                    Business Details
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="payouts" 
                                    className="text-xs font-semibold rounded-sm py-1.5 transition-all text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                                >
                                    Payout Setup
                                </TabsTrigger>
                            </TabsList>

                            {/* PREVIEW TAB */}
                            <TabsContent value="preview" className="space-y-4 focus-visible:outline-none">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground font-display">Facility Operations</h3>
                                        <p className="text-xs text-muted-foreground">Preview your listed locations and configure live customer availability</p>
                                    </div>
                                    <Button 
                                        onClick={() => navigate('/provider/facilities')}
                                        className="text-xs h-9 font-bold bg-primary hover:bg-primary/95 text-primary-foreground rounded-md shadow-sm"
                                    >
                                        Manage Facilities
                                    </Button>
                                </div>

                                {providerFacilities.length === 0 ? (
                                    <Card className="border-dashed border-2 border-border bg-card rounded-lg">
                                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                            <Building className="w-12 h-12 text-muted-foreground opacity-50 mb-3" />
                                            <h3 className="text-base font-bold text-foreground font-display">No Facilities Active</h3>
                                            <p className="text-xs text-muted-foreground max-w-xs mb-4">You haven't onboarded any parking structures to your operator account yet.</p>
                                            <Button 
                                                onClick={() => navigate('/provider/facilities')}
                                                size="sm"
                                                className="text-xs font-bold"
                                            >
                                                Add First Facility
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-3">
                                        {providerFacilities.map(facility => (
                                            <Card key={facility.id} className="overflow-hidden border-border bg-card shadow-sm hover:border-primary/20 transition-all rounded-lg">
                                                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-12 h-12 bg-secondary border border-border/50 rounded-md flex-shrink-0 flex items-center justify-center">
                                                            <Building className="w-6 h-6 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-foreground text-sm font-display">{facility.name}</h4>
                                                            <p className="text-xs text-muted-foreground mt-0.5">{facility.address}</p>
                                                            <div className="mt-2.5">
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-wider">
                                                                    Live On App
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs h-8 px-3 flex items-center border-border text-foreground hover:bg-secondary rounded-md"
                                                            onClick={() => window.open(`/customer/facility/${facility.id}`, '_blank')}
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
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
                            <TabsContent value="details" className="focus-visible:outline-none">
                                <Card className="border-border bg-card rounded-lg shadow-sm">
                                    <CardHeader className="p-5 pb-4">
                                        <CardTitle className="text-base font-bold font-display">Business Profile Details</CardTitle>
                                        <CardDescription className="text-xs text-muted-foreground">Modify your primary business identification and contact information</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-5 pt-0 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Business Partner Name</Label>
                                                <Input 
                                                    value={profileName} 
                                                    onChange={(e) => setProfileName(e.target.value)}
                                                    disabled={!isEditing} 
                                                    className="h-10 rounded-md bg-secondary border-border text-foreground"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Authorized Email</Label>
                                                <Input 
                                                    value={user?.email || ''} 
                                                    disabled 
                                                    className="h-10 rounded-md bg-secondary/60 border-border text-muted-foreground cursor-not-allowed"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Billing Phone Contact</Label>
                                                <Input 
                                                    value={profilePhone} 
                                                    onChange={(e) => setProfilePhone(e.target.value)}
                                                    placeholder="+91 99999 99999" 
                                                    disabled={!isEditing} 
                                                    className="h-10 rounded-md bg-secondary border-border text-foreground"
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            {isEditing ? (
                                                <div className="flex gap-2">
                                                    <Button 
                                                        className="text-xs h-9 font-bold bg-primary hover:bg-primary/95 text-primary-foreground rounded-md shadow-sm"
                                                        onClick={handleSaveChanges}
                                                    >
                                                        Save Changes
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        className="text-xs h-9 font-bold rounded-md hover:bg-secondary"
                                                        onClick={() => {
                                                            setIsEditing(false);
                                                            setProfileName(user?.name || '');
                                                            setProfilePhone(user?.phone || '');
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button 
                                                    variant="outline" 
                                                    className="text-xs h-9 font-bold border-border rounded-md hover:bg-secondary text-foreground"
                                                    onClick={() => setIsEditing(true)}
                                                >
                                                    Edit Details
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* PAYOUTS TAB */}
                            <TabsContent value="payouts" className="focus-visible:outline-none">
                                <Card className="border-border bg-card rounded-lg shadow-sm">
                                    <CardHeader className="p-5 pb-4">
                                        <CardTitle className="text-base font-bold font-display">Payout Routing Settings</CardTitle>
                                        <CardDescription className="text-xs text-muted-foreground">Configure the direct deposit settings for your parking revenue collection</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-5 pt-0 space-y-4">
                                        <div className="bg-secondary/40 p-4 rounded-lg border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-card rounded-md border border-border/60 flex items-center justify-center shadow-sm">
                                                    <CreditCard className="w-5 h-5 text-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground font-display">HDFC Bank Ending in 4242</p>
                                                    <p className="text-[11px] text-muted-foreground font-medium">Primary Operator Payout Route</p>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="text-xs h-8 border-border rounded-md hover:bg-secondary text-foreground"
                                                onClick={() => toast.info('Directing to bank authentication dashboard...')}
                                            >
                                                Edit Routing
                                            </Button>
                                        </div>

                                        <Button 
                                            className="w-full text-xs h-9 border border-dashed border-border text-muted-foreground hover:text-foreground bg-transparent hover:bg-secondary/50 rounded-md flex items-center justify-center gap-1.5 transition-colors"
                                            variant="ghost"
                                            onClick={() => toast.info('Adding multiple payout accounts is disabled for standard plan.')}
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Link Alternative Payout Method
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

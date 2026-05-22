import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Info, 
  Clock, 
  Car, 
  User, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  History,
  Timer,
  IndianRupee,
  LogOut,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { providerService } from '@/services/provider.service';
import { useApp } from '@/context/AppContext';
import axios from 'axios';

interface SlotDetail {
    id: string;
    slot_number: string;
    vehicle_type: string;
    status: 'FREE' | 'OCCUPIED' | 'RESERVED';
    floor_id: string;
}

interface ActiveTicket {
    id: string;
    vehicle_number: string;
    vehicle_type: string;
    customer_name: string | null;
    customer_phone: string | null;
    entry_time: string;
    slot_id: string;
    booking_type: 'ONLINE' | 'OFFLINE';
    total_fee?: number;
    customer?: {
        full_name: string;
        phone_number: string;
    };
}

export default function FacilityLiveView() {
    const { id: facilityId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { bookings, refreshData } = useApp();
    
    const [facility, setFacility] = useState<any>(null);
    const [slots, setSlots] = useState<SlotDetail[]>([]);
    const [activeTickets, setActiveTickets] = useState<ActiveTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<SlotDetail | null>(null);
    const [isExiting, setIsExiting] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update clock every minute for timers
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60);
        return () => clearInterval(timer);
    }, []);

    const loadData = async () => {
        if (!facilityId) return;
        try {
            setIsLoading(true);
            const data = await providerService.getFacilityDetails(facilityId);
            setFacility(data.facility);
            setSlots(data.slots || []);
            setActiveTickets(data.activeBookings || []);
        } catch (error) {
            toast.error('Failed to load live status');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [facilityId]);

    const filteredSlots = useMemo(() => {
        return slots.filter(s => 
            s.slot_number.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => a.slot_number.localeCompare(b.slot_number, undefined, { numeric: true }));
    }, [slots, searchQuery]);

    const getSlotTicket = (slotId: string) => {
        return activeTickets.find(t => t.slot_id === slotId);
    };

    const calculateElapsed = (entryTime: string) => {
        const entry = new Date(entryTime);
        const diffMs = currentTime.getTime() - entry.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return { hours: diffHrs, minutes: diffMins, totalMinutes: Math.floor(diffMs / (1000 * 60)) };
    };

    const calculateCurrentCharges = (ticket: ActiveTicket) => {
        if (!facility?.pricing_rules) return 0;
        const rule = facility.pricing_rules.find((r: any) => r.vehicle_type === ticket.vehicle_type);
        if (!rule) return 0;

        const { totalMinutes } = calculateElapsed(ticket.entry_time);
        const hours = Math.ceil(totalMinutes / 60);
        let fee = hours * rule.hourly_rate;
        if (rule.daily_max && fee > rule.daily_max) fee = rule.daily_max;
        return fee;
    };

    const handleExit = async (ticketId: string) => {
        if (!confirm('Confirm vehicle exit and complete booking?')) return;
        
        setIsExiting(true);
        try {
            await axios.post('/api/v1/bookings/end', { ticket_id: ticketId });
            toast.success('Vehicle exited successfully');
            setSelectedSlot(null);
            loadData();
            refreshData();
        } catch (error) {
            toast.error('Failed to process exit');
            console.error(error);
        } finally {
            setIsExiting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background pt-24 flex items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm font-medium">Loading Live Facility View...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-20 pb-12 text-foreground font-sans">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mb-2 pl-0 hover:bg-transparent text-primary font-bold text-xs"
                            onClick={() => navigate('/provider/facilities')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Spaces
                        </Button>
                        <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3 font-display">
                            {facility?.name}
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-[#34C759]/15 text-[#34C759]">
                                Live
                            </span>
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-1.5 mt-1 text-xs font-semibold">
                            <MapPin className="w-4 h-4 text-primary" /> {facility?.city}, {facility?.address}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="Search Slot ID..." 
                            className="pl-9 h-9 bg-input-background border border-input rounded-md text-xs"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={loadData}
                            className="h-9 w-9 bg-card border border-border shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4 text-foreground" />
                        </Button>
                    </div>
                </div>

                {/* Status Legend */}
                <div className="flex flex-wrap gap-4 mb-6 bg-card p-4 rounded-lg border border-border shadow-sm items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-[#34C759]/10 border border-[#34C759]/30" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-destructive/10 border border-destructive/30" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Occupied</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-[#FF9F0A]/10 border border-[#FF9F0A]/30" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reserved</span>
                    </div>
                    <div className="ml-auto flex gap-6">
                        <div className="text-center">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Available</p>
                            <p className="text-base font-black text-[#34C759] font-display">{slots.filter(s => s.status === 'FREE').length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Occupied</p>
                            <p className="text-base font-black text-destructive font-display">{slots.filter(s => s.status === 'OCCUPIED').length}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* The Grid Area */}
                    <div className="lg:col-span-3">
                        <div className="bg-card p-6 rounded-lg border border-border shadow-sm min-h-[500px] relative overflow-hidden">
                            {/* Decorative Grid Background */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                                style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
                            />
                            
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 relative z-10">
                                {filteredSlots.map((slot) => {
                                    const ticket = getSlotTicket(slot.id);
                                    return (
                                        <motion.div
                                            key={slot.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`
                                                aspect-square rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative group
                                                ${selectedSlot?.id === slot.id ? 'ring-4 ring-primary/20 z-20' : ''}
                                                ${slot.status === 'FREE' 
                                                    ? 'bg-[#34C759]/5 border-[#34C759]/20 hover:bg-[#34C759]/10' 
                                                    : slot.status === 'OCCUPIED'
                                                        ? 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10'
                                                        : 'bg-[#FF9F0A]/5 border-[#FF9F0A]/20 hover:bg-[#FF9F0A]/10'
                                                }
                                            `}
                                        >
                                            <span className={`text-[10px] font-black absolute top-1.5 left-2 ${
                                                slot.status === 'FREE' ? 'text-[#34C759]' : slot.status === 'OCCUPIED' ? 'text-destructive' : 'text-[#FF9F0A]'
                                            }`}>
                                                {slot.vehicle_type === 'CAR' ? '🚗' : slot.vehicle_type === 'BIKE' ? '🏍️' : '🛵'}
                                            </span>
                                            
                                            <p className="font-black text-lg text-foreground leading-none font-display">{slot.slot_number}</p>
                                            
                                            {ticket && (
                                                <div className="absolute -bottom-1 -right-1 bg-card border border-border rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                                                    <div className={`w-2 h-2 rounded-full animate-pulse ${ticket.booking_type === 'ONLINE' ? 'bg-[#007AFF]' : 'bg-[#FF9F0A]'}`} />
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {filteredSlots.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
                                    <AlertTriangle className="w-12 h-12 mb-4 opacity-20 text-foreground" />
                                    <p className="text-xs font-semibold">No slots match your search</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar / Detail View */}
                    <div className="lg:col-span-1">
                        <AnimatePresence mode="wait">
                            {selectedSlot ? (
                                <motion.div
                                    key={selectedSlot.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="sticky top-24"
                                >
                                    <Card className="border border-border shadow-md rounded-lg overflow-hidden bg-card">
                                        <div className={`h-20 flex items-center justify-center ${
                                            selectedSlot.status === 'FREE' ? 'bg-[#34C759]' : 'bg-primary'
                                        }`}>
                                            <div className="text-center text-white">
                                                <h3 className="text-3xl font-black font-display">{selectedSlot.slot_number}</h3>
                                                <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mt-0.5">
                                                    {selectedSlot.vehicle_type} SLOT
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <CardContent className="p-5">
                                            {selectedSlot.status === 'FREE' ? (
                                                <div className="space-y-5 text-center py-6">
                                                    <div className="bg-[#34C759]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                                        <CheckCircle2 className="w-8 h-8 text-[#34C759]" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-foreground font-display">Ready for Arrival</h4>
                                                        <p className="text-muted-foreground text-xs font-semibold mt-1">This slot is empty and available.</p>
                                                    </div>
                                                    <Button className="w-full bg-primary hover:bg-primary/95 text-xs font-bold h-9 rounded-md" onClick={() => navigate('/provider/dashboard')}>
                                                        Direct Manual Entry
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {(() => {
                                                        const ticket = getSlotTicket(selectedSlot.id);
                                                        if (!ticket) return (
                                                            <div className="p-4 bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 rounded-md flex items-center gap-3">
                                                                <AlertTriangle className="w-5 h-5 text-[#FF9F0A]" />
                                                                <p className="text-xs text-[#FF9F0A] font-semibold">Reserved for scheduled arrival</p>
                                                            </div>
                                                        );

                                                        const { hours, minutes } = calculateElapsed(ticket.entry_time);
                                                        const charges = calculateCurrentCharges(ticket);
                                                        const customerName = ticket.customer?.full_name || ticket.customer_name || 'Guest';
                                                        const customerPhone = ticket.customer?.phone_number || ticket.customer_phone || 'Not Provided';

                                                        return (
                                                            <>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="bg-secondary/40 p-3 rounded-md border border-border">
                                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Vehicle</p>
                                                                        <p className="text-xs font-bold text-primary tracking-wider">{ticket.vehicle_number}</p>
                                                                    </div>
                                                                    <div className="bg-secondary/40 p-3 rounded-md border border-border">
                                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Type</p>
                                                                        <p className="text-xs font-bold text-foreground">{ticket.booking_type}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    <div className="flex items-start gap-2.5">
                                                                        <div className="p-1.5 bg-primary/10 rounded-md">
                                                                            <User className="w-4 h-4 text-primary" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Customer</p>
                                                                            <p className="text-xs font-bold text-foreground">{customerName}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-2.5">
                                                                        <div className="p-1.5 bg-primary/10 rounded-md">
                                                                            <Phone className="w-4 h-4 text-primary" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Contact</p>
                                                                            <p className="text-xs font-bold text-foreground">{customerPhone}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="pt-3 border-t border-border space-y-3">
                                                                    <div className="flex justify-between items-end">
                                                                        <div className="flex items-center gap-1.5 text-destructive">
                                                                            <Timer className="w-4 h-4" />
                                                                            <span className="text-lg font-black font-display tabular-nums">
                                                                                {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Running Total</p>
                                                                            <p className="text-lg font-black text-foreground flex items-center justify-end font-display">
                                                                                <IndianRupee className="w-3.5 h-3.5 mr-0.5 text-primary" /> {charges}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <Button 
                                                                        className="w-full bg-destructive hover:bg-destructive/95 text-white font-bold h-9 text-xs rounded-md shadow-sm"
                                                                        onClick={() => handleExit(ticket.id)}
                                                                        disabled={isExiting}
                                                                    >
                                                                        {isExiting ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <LogOut className="w-4 h-4 mr-1.5" />}
                                                                        Process Exit & Payment
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                            
                                            <Button 
                                                variant="ghost" 
                                                className="w-full mt-3 text-muted-foreground hover:text-foreground font-semibold text-[11px] h-8 rounded-md" 
                                                onClick={() => setSelectedSlot(null)}
                                            >
                                                Close Details
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-secondary/35 rounded-lg border-2 border-dashed border-border min-y-[200px]">
                                    <div className="w-12 h-12 bg-card rounded-md flex items-center justify-center shadow-sm mb-3 border border-border">
                                        <Info className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <h4 className="font-bold text-foreground text-sm font-display">Slot Inspection</h4>
                                    <p className="text-muted-foreground text-xs font-semibold mt-1 leading-normal">Select any slot tile from the grid to view detailed booking timers, pricing, and customer details.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

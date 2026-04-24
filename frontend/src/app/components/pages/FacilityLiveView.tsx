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

    // Handle WebSocket or context updates
    useEffect(() => {
        // If global bookings change, we might want to refresh
        // But local state is easier to manage for this specific view
    }, [bookings]);

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
            // Reusing customer endBooking endpoint which works for providers too
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
            <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 font-medium animate-pulse">Loading Live Facility View...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-12">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mb-2 pl-0 hover:bg-transparent text-indigo-600 font-bold"
                            onClick={() => navigate('/provider/facilities')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Spaces
                        </Button>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            {facility?.name}
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 border-0">Live</Badge>
                        </h1>
                        <p className="text-slate-500 flex items-center gap-1 mt-1 font-medium">
                            <MapPin className="w-4 h-4" /> {facility?.city}, {facility?.address}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                placeholder="Search Slot ID..." 
                                className="pl-10 border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 h-11"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={loadData}
                            className="h-11 w-11 bg-white border-slate-200 shadow-sm hover:text-indigo-600"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Status Legend */}
                <div className="flex flex-wrap gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-emerald-50 border border-emerald-200" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-rose-50 border border-rose-200" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Occupied</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-amber-50 border border-amber-200" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reserved</span>
                    </div>
                    <div className="ml-auto flex gap-6">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Available</p>
                            <p className="text-lg font-black text-emerald-600">{slots.filter(s => s.status === 'FREE').length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Occupied</p>
                            <p className="text-lg font-black text-rose-600">{slots.filter(s => s.status === 'OCCUPIED').length}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* The Grid Area */}
                    <div className="lg:col-span-3">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm min-h-[600px] relative overflow-hidden">
                            {/* Decorative Grid Background */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                                style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
                            />
                            
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 relative z-10">
                                {filteredSlots.map((slot) => {
                                    const ticket = getSlotTicket(slot.id);
                                    return (
                                        <motion.div
                                            key={slot.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`
                                                aspect-square rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative group
                                                ${selectedSlot?.id === slot.id ? 'ring-4 ring-indigo-500/20 z-20' : ''}
                                                ${slot.status === 'FREE' 
                                                    ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50' 
                                                    : slot.status === 'OCCUPIED'
                                                        ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-100/50'
                                                        : 'bg-amber-50/50 border-amber-200 hover:bg-amber-100/50'
                                                }
                                            `}
                                        >
                                            <span className={`text-[10px] font-black absolute top-1.5 left-2 ${
                                                slot.status === 'FREE' ? 'text-emerald-500' : slot.status === 'OCCUPIED' ? 'text-rose-500' : 'text-amber-500'
                                            }`}>
                                                {slot.vehicle_type === 'CAR' ? '🚗' : slot.vehicle_type === 'BIKE' ? '🏍️' : '🛵'}
                                            </span>
                                            
                                            <p className="font-black text-lg text-slate-800 leading-none">{slot.slot_number}</p>
                                            
                                            {ticket && (
                                                <div className="absolute -bottom-1 -right-1 bg-white border border-slate-200 rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                                                    <div className={`w-2 h-2 rounded-full animate-pulse ${ticket.booking_type === 'ONLINE' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {filteredSlots.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                                    <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="font-bold">No slots match your search</p>
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
                                    <Card className="border-slate-200 shadow-xl rounded-[2rem] overflow-hidden">
                                        <div className={`h-24 flex items-center justify-center ${
                                            selectedSlot.status === 'FREE' ? 'bg-emerald-500' : 'bg-indigo-600'
                                        }`}>
                                            <div className="text-center text-white">
                                                <h3 className="text-4xl font-black">{selectedSlot.slot_number}</h3>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
                                                    {selectedSlot.vehicle_type} SLOT
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <CardContent className="p-6">
                                            {selectedSlot.status === 'FREE' ? (
                                                <div className="space-y-6 text-center py-8">
                                                    <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                                                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black text-slate-800">Ready for Arrival</h4>
                                                        <p className="text-slate-500 text-sm mt-2">This slot is currently empty and available for booking.</p>
                                                    </div>
                                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => navigate('/provider/dashboard')}>
                                                        Direct Manual Entry
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {(() => {
                                                        const ticket = getSlotTicket(selectedSlot.id);
                                                        if (!ticket) return (
                                                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                                                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                                                <p className="text-xs text-amber-700 font-medium">Reserved for scheduled arrival</p>
                                                            </div>
                                                        );

                                                        const { hours, minutes } = calculateElapsed(ticket.entry_time);
                                                        const charges = calculateCurrentCharges(ticket);
                                                        const customerName = ticket.customer?.full_name || ticket.customer_name || 'Guest';
                                                        const customerPhone = ticket.customer?.phone_number || ticket.customer_phone || 'Not Provided';

                                                        return (
                                                            <>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Vehicle</p>
                                                                        <p className="text-sm font-black text-indigo-600 tracking-wider">{ticket.vehicle_number}</p>
                                                                    </div>
                                                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Type</p>
                                                                        <p className="text-sm font-black text-slate-700">{ticket.booking_type}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="p-2 bg-indigo-50 rounded-lg">
                                                                            <User className="w-4 h-4 text-indigo-500" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] font-black text-slate-400 uppercase">Customer</p>
                                                                            <p className="text-sm font-bold text-slate-800">{customerName}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="p-2 bg-indigo-50 rounded-lg">
                                                                            <Phone className="w-4 h-4 text-indigo-500" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] font-black text-slate-400 uppercase">Contact</p>
                                                                            <p className="text-sm font-bold text-slate-800">{customerPhone}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="pt-4 border-t border-slate-100 space-y-4">
                                                                    <div className="flex justify-between items-end">
                                                                        <div className="flex items-center gap-2 text-rose-500">
                                                                            <Timer className="w-5 h-5" />
                                                                            <span className="text-2xl font-black tabular-nums">
                                                                                {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-[10px] font-black text-slate-400 uppercase">Running Total</p>
                                                                            <p className="text-2xl font-black text-slate-900 flex items-center justify-end">
                                                                                <IndianRupee className="w-4 h-4" /> {charges}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <Button 
                                                                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-12 shadow-lg shadow-rose-200"
                                                                        onClick={() => handleExit(ticket.id)}
                                                                        disabled={isExiting}
                                                                    >
                                                                        {isExiting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
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
                                                className="w-full mt-4 text-slate-400 font-bold text-xs" 
                                                onClick={() => setSelectedSlot(null)}
                                            >
                                                Close Details
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                        <Info className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h4 className="font-black text-slate-700">Slot Inspection</h4>
                                    <p className="text-slate-400 text-sm mt-2">Select any tile from the grid to view detailed booking information, timers, and customer data.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

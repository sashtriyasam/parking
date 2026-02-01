import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Check,
    Download,
    Share2,
    Navigation,
    Clock,
    MapPin,
    Zap,
    IndianRupee,
    ArrowRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { customerService } from '../../../services/customer.service';
import { useBookingFlowStore } from '../../../store/bookingFlowStore';

export default function BookingSuccessPage() {
    const { ticketId } = useParams<{ ticketId: string }>();
    const navigate = useNavigate();
    const { resetFlow } = useBookingFlowStore();

    // Fetch confirmed ticket details
    const { data: ticket, isLoading, error } = useQuery({
        queryKey: ['ticket', ticketId],
        queryFn: () => customerService.getTicketById(ticketId!),
        enabled: !!ticketId,
    });

    // Reset booking store when arriving here (wait a bit or when component unmounts)
    useEffect(() => {
        return () => resetFlow(); // Cleanup on exit
    }, [resetFlow]);

    if (isLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4 shadow-xl shadow-indigo-100" />
            <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">Generating Your Ticket...</p>
        </div>
    );

    if (error || !ticket) return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
            <div className="bg-white p-12 rounded-[40px] text-center shadow-xl border border-red-100 max-w-lg">
                <h3 className="text-2xl font-black text-red-900 mb-2">Ticket Error</h3>
                <p className="text-red-600/70 font-bold mb-8 leading-relaxed">Booking was successful but we couldn't load the visual ticket. Please check "My Tickets" section.</p>
                <button onClick={() => navigate('/customer/tickets')} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-red-100 uppercase tracking-widest text-xs">Go to My Tickets</button>
            </div>
        </div>
    );

    const facility = ticket.parking_facility || ticket.slot?.floor?.facility;

    return (
        <div className="min-h-screen bg-indigo-600 pb-20 overflow-hidden relative">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-900/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <main className="max-w-xl mx-auto px-6 relative z-10 pt-12">
                {/* Success Icon Animation */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl mb-6 relative">
                        <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20" />
                        <Check size={48} className="text-green-500 stroke-[4]" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2">Booking Confirmed!</h1>
                    <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs">Reservation ID: {ticket.id.slice(-8).toUpperCase()}</p>
                </div>

                {/* The Ticket (Physical look) */}
                <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-indigo-900/40 relative">
                    {/* Top Section: QR */}
                    <div className="p-10 text-center border-b-4 border-dashed border-gray-100 relative">
                        {/* Cutouts */}
                        <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-indigo-600 rounded-full" />
                        <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-indigo-600 rounded-full" />

                        <div className="bg-gray-50 p-6 rounded-[32px] inline-block shadow-inner mb-6 border-2 border-white">
                            <QRCodeSVG
                                value={`PARK-${ticket.id}`}
                                size={180}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                        <p className="text-xs font-black text-gray-400 font-mono tracking-widest">{ticket.id.toUpperCase()}</p>
                    </div>

                    {/* Middle Section: Details */}
                    <div className="p-10 space-y-8">
                        <div>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 leading-none">Parking Zone</p>
                            <h2 className="text-2xl font-black text-gray-900 leading-tight">{facility?.name}</h2>
                            <div className="flex items-center gap-2 text-gray-400 text-sm font-bold mt-2">
                                <MapPin size={14} />
                                <span className="truncate">{facility?.address}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Assigned Slot</p>
                                <p className="text-xl font-black text-gray-900 flex items-center gap-2">
                                    <Zap size={18} className="text-indigo-600 fill-indigo-600" />
                                    {ticket.parking_slot?.slot_number}
                                </p>
                                <p className="text-[10px] font-bold text-indigo-500 uppercase">Floor {ticket.parking_slot?.floor?.floor_number}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Vehicle</p>
                                <p className="text-xl font-black text-gray-900 tracking-widest">{ticket.vehicle_number}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">{ticket.vehicle_type}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Entry Time</p>
                                <p className="text-sm font-black text-gray-800 flex items-center gap-2">
                                    <Clock size={14} className="text-gray-400" />
                                    {new Date(ticket.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Amount Paid</p>
                                <p className="text-sm font-black text-indigo-600 flex items-center gap-1">
                                    <IndianRupee size={14} className="stroke-[3]" />
                                    {ticket.total_fee || '0'}.00
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Actions of Ticket */}
                    <div className="bg-gray-50 p-6 flex items-center justify-between border-t border-gray-100">
                        <button className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                            <Download size={16} /> Save PDF
                        </button>
                        <div className="w-px h-6 bg-gray-200" />
                        <button className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                            <Share2 size={16} /> Share
                        </button>
                    </div>
                </div>

                {/* Primary Actions */}
                <div className="mt-12 space-y-4">
                    <button
                        onClick={() => {
                            if (facility?.latitude && facility?.longitude) {
                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`, '_blank');
                            }
                        }}
                        className="w-full py-6 bg-white text-indigo-600 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:scale-102 flex items-center justify-center gap-3 transition-all"
                    >
                        <Navigation size={20} /> Get Directions
                    </button>

                    <button
                        onClick={() => navigate('/customer/tickets')}
                        className="w-full py-6 bg-indigo-900/50 backdrop-blur-md text-white rounded-[28px] font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-900 transition-all flex items-center justify-center gap-3"
                    >
                        Done <ArrowRight size={20} />
                    </button>
                </div>
            </main>
        </div>
    );
}

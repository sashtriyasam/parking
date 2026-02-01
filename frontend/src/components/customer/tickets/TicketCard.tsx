import { useState, useEffect } from 'react';
import { MapPin, Clock, Car, Navigation, StopCircle, Plus, QrCode, IndianRupee, ChevronRight, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Ticket } from '../../../types';
import { useTicketsStore } from '../../../store/ticketsStore';

interface TicketCardProps {
    ticket: Ticket;
    type: 'active' | 'upcoming' | 'past' | 'cancelled';
    onExtend?: (ticket: Ticket) => void;
    onEnd?: (ticket: Ticket) => void;
    onGetDirections?: (ticket: Ticket) => void;
}

export default function TicketCard({ ticket, type, onExtend, onEnd, onGetDirections }: TicketCardProps) {
    const { openDetailModal } = useTicketsStore();
    const [currentCharges, setCurrentCharges] = useState(ticket.total_fee || 0);
    const [elapsedTime, setElapsedTime] = useState({ h: 0, m: 0 });

    useEffect(() => {
        if (type !== 'active' || !ticket.entry_time) return;

        const updateCharges = () => {
            const entryTime = new Date(ticket.entry_time);
            const now = new Date();
            const elapsedMs = now.getTime() - entryTime.getTime();
            const elapsedHours = elapsedMs / (1000 * 60 * 60);

            const h = Math.floor(elapsedHours);
            const m = Math.floor((elapsedHours - h) * 60);
            setElapsedTime({ h, m });

            const hourlyRate = 50; // Use actual rate if available
            const baseCharge = Math.max(1, Math.ceil(elapsedHours)) * hourlyRate;
            const gst = baseCharge * 0.18;
            setCurrentCharges(baseCharge + gst);
        };

        updateCharges();
        const interval = setInterval(updateCharges, 60000);
        return () => clearInterval(interval);
    }, [ticket, type]);

    const formatTime = (date: string) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const getStatusStyles = () => {
        switch (type) {
            case 'active': return { bg: 'bg-indigo-600', text: 'text-white', badge: 'bg-green-500' };
            case 'upcoming': return { bg: 'bg-indigo-50', text: 'text-gray-900', badge: 'bg-blue-500' };
            case 'past': return { bg: 'bg-white', text: 'text-gray-900', badge: 'bg-gray-400' };
            case 'cancelled': return { bg: 'bg-red-50', text: 'text-gray-900', badge: 'bg-red-400' };
            default: return { bg: 'bg-white', text: 'text-gray-900', badge: 'bg-gray-400' };
        }
    };

    const styles = getStatusStyles();

    return (
        <div
            onClick={() => openDetailModal(ticket)}
            className={`
                group relative rounded-[40px] overflow-hidden transition-all duration-500 cursor-pointer
                ${type === 'active' ? 'shadow-2xl shadow-indigo-200 ring-4 ring-indigo-50 hover:-translate-y-2' : 'border border-gray-100 bg-white hover:border-indigo-200'}
            `}
        >
            <div className={`p-8 ${type === 'active' ? 'bg-[#111827] text-white' : 'bg-white'}`}>
                {/* Header */}
                <div className="flex justify-between items-start mb-10">
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${styles.badge} text-white`}>
                                {type === 'active' ? 'LIVE SESSION' : type === 'upcoming' ? 'UPCOMING' : type.toUpperCase()}
                            </span>
                            {type === 'active' && (
                                <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                                    {elapsedTime.h}h {elapsedTime.m}m ago
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className={`text-2xl font-black tracking-tight leading-tight ${type === 'active' ? 'text-white' : 'text-gray-900'}`}>
                                {ticket.facility?.name || ticket.slot?.floor?.facility?.name || 'Facility Name'}
                            </h3>
                            <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm font-bold">
                                <MapPin size={16} className="shrink-0" />
                                <span className="truncate">{ticket.facility?.address || ticket.slot?.floor?.facility?.address}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`p-3 rounded-2xl ${type === 'active' ? 'bg-white/10' : 'bg-gray-50 text-gray-400'}`}>
                        <div className="bg-white p-1 rounded-lg">
                            <QRCodeSVG value={`PARK-${ticket.id}`} size={48} level="L" />
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 leading-none">Vehicle & Spot</p>
                            <p className="text-sm font-black flex items-center gap-2">
                                <Car size={16} /> {ticket.vehicle_number}
                            </p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">
                                {ticket.slot?.slot_number} • FL {ticket.slot?.floor?.floor_number}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 leading-none">
                                {type === 'active' ? 'Current Bill' : 'Total Amount'}
                            </p>
                            <p className="text-2xl font-black text-indigo-500 flex items-center gap-1">
                                <IndianRupee size={20} className="stroke-[3]" />
                                {type === 'active' ? currentCharges.toFixed(0) : (ticket.total_fee || 0).toFixed(0)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-8 border-t border-white/10">
                    {type === 'active' && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onExtend?.(ticket); }}
                                className="flex-1 bg-white text-indigo-600 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Extend
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onEnd?.(ticket); }}
                                className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                            >
                                <StopCircle size={24} />
                            </button>
                        </>
                    )}
                    {type === 'upcoming' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onGetDirections?.(ticket); }}
                            className="w-full bg-indigo-600 text-white h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Navigation size={16} /> Get Directions
                        </button>
                    )}
                    {(type === 'past' || type === 'cancelled') && (
                        <button className="w-full h-14 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                            View Receipt <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Decorative Ticket Notch */}
            <div className="absolute top-1/2 -left-4 w-8 h-8 bg-gray-50 rounded-full -translate-y-1/2" />
            <div className="absolute top-1/2 -right-4 w-8 h-8 bg-gray-50 rounded-full -translate-y-1/2" />
        </div>
    );
}

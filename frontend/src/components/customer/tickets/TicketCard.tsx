import { useState, useEffect } from 'react';
import { MapPin, Clock, Car, CreditCard, Navigation, StopCircle, Plus, QrCode } from 'lucide-react';
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
    const [elapsedTime, setElapsedTime] = useState('');

    // Calculate elapsed time and current charges for active tickets
    useEffect(() => {
        if (type !== 'active' || !ticket.entry_time) return;

        const updateCharges = () => {
            const entryTime = new Date(ticket.entry_time);
            const now = new Date();
            const elapsedMs = now.getTime() - entryTime.getTime();
            const elapsedHours = elapsedMs / (1000 * 60 * 60);

            // Format elapsed time
            const hours = Math.floor(elapsedHours);
            const minutes = Math.floor((elapsedHours - hours) * 60);
            setElapsedTime(`${hours}h ${minutes}m`);

            // Calculate current charges (simplified - should match backend logic)
            // Assuming hourly rate from pricing rule
            const hourlyRate = 50; // This should come from pricing rule
            const baseCharge = Math.ceil(elapsedHours) * hourlyRate;
            const gst = baseCharge * 0.18;
            setCurrentCharges(baseCharge + gst);
        };

        updateCharges();
        const interval = setInterval(updateCharges, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [ticket, type]);

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    const getStatusColor = () => {
        switch (type) {
            case 'active':
                return 'border-green-500 bg-green-50';
            case 'upcoming':
                return 'border-blue-500 bg-blue-50';
            case 'past':
                return 'border-gray-300 bg-gray-50';
            case 'cancelled':
                return 'border-red-500 bg-red-50';
            default:
                return 'border-gray-300 bg-white';
        }
    };

    const getStatusBadge = () => {
        const badges = {
            active: { text: 'Active', color: 'bg-green-500' },
            upcoming: { text: 'Upcoming', color: 'bg-blue-500' },
            past: { text: 'Completed', color: 'bg-gray-500' },
            cancelled: { text: 'Cancelled', color: 'bg-red-500' },
        };
        const badge = badges[type];
        return (
            <span className={`${badge.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                {badge.text}
            </span>
        );
    };

    return (
        <div
            className={`border-2 rounded-xl p-6 transition-all hover:shadow-lg cursor-pointer ${getStatusColor()}`}
            onClick={() => openDetailModal(ticket)}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge()}
                        {type === 'active' && (
                            <span className="text-xs text-gray-600">
                                <Clock size={14} className="inline mr-1" />
                                {elapsedTime} ago
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                        {ticket.parking_facility?.name || 'Parking Facility'}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-start gap-1 mt-1">
                        <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                        {ticket.parking_facility?.address || 'Address not available'}
                    </p>
                </div>

                {/* QR Code Preview */}
                <div className="ml-4">
                    <div className="bg-white p-2 rounded-lg border border-gray-300">
                        <QRCodeSVG
                            value={JSON.stringify({
                                ticketId: ticket.id,
                                slotId: ticket.slot_id,
                                vehicleNumber: ticket.vehicle_number,
                            })}
                            size={60}
                            level="M"
                        />
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            openDetailModal(ticket);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 mt-1 flex items-center gap-1 justify-center w-full"
                    >
                        <QrCode size={12} />
                        View
                    </button>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                <div>
                    <p className="text-xs text-gray-500">Slot Number</p>
                    <p className="font-semibold text-gray-900">
                        {ticket.parking_slot?.slot_number || 'N/A'} - Floor {ticket.parking_slot?.floor?.floor_number || 'N/A'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Vehicle</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                        <Car size={14} />
                        {ticket.vehicle_number}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Entry Time</p>
                    <p className="font-semibold text-gray-900 text-sm">
                        {formatDateTime(ticket.entry_time)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">
                        {type === 'active' ? 'Current Charges' : 'Total Amount'}
                    </p>
                    <p className="font-bold text-lg text-indigo-600 flex items-center gap-1">
                        <CreditCard size={16} />
                        ₹{type === 'active' ? currentCharges.toFixed(2) : (ticket.total_fee?.toFixed(2) || '0.00')}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                {type === 'active' && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onExtend?.(ticket);
                            }}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={16} />
                            Extend
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onGetDirections?.(ticket);
                            }}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Navigation size={16} />
                            Directions
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to end this parking session?')) {
                                    onEnd?.(ticket);
                                }
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <StopCircle size={16} />
                            End
                        </button>
                    </>
                )}

                {type === 'upcoming' && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onGetDirections?.(ticket);
                            }}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Navigation size={16} />
                            Get Directions
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to cancel this booking?')) {
                                    // Handle cancel
                                }
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            Cancel Booking
                        </button>
                    </>
                )}

                {type === 'past' && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // Handle download invoice
                            }}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            Download Invoice
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // Handle book again
                            }}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            Book Again
                        </button>
                    </>
                )}

                {type === 'cancelled' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // Handle rebook
                        }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        Book Again
                    </button>
                )}
            </div>
        </div>
    );
}

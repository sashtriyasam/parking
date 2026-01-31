import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Download, Share2, MapPin, Calendar, Car, CreditCard, Home } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { customerService } from '../../../services/customer.service';
import BookingProgressBar from '../../../components/customer/booking/BookingProgressBar';
import { useBookingFlowStore } from '../../../store/bookingFlowStore';

export default function BookingSuccessPage() {
    const navigate = useNavigate();
    const { ticketId } = useParams<{ ticketId: string }>();
    const { resetFlow } = useBookingFlowStore();
    const [showSuccess, setShowSuccess] = useState(false);

    // Fetch ticket details
    const { data: ticket, isLoading } = useQuery({
        queryKey: ['ticket', ticketId],
        queryFn: () => customerService.getTicketDetails(ticketId!),
        enabled: !!ticketId,
    });

    useEffect(() => {
        // Trigger success animation
        setTimeout(() => setShowSuccess(true), 300);
    }, []);

    const handleDownloadPDF = () => {
        // TODO: Implement PDF download
        alert('PDF download feature coming soon!');
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Parking Ticket',
                    text: `My parking ticket for ${ticket?.parking_facility?.name}`,
                    url: window.location.href,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback: copy link
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const handleGetDirections = () => {
        if (ticket?.parking_facility) {
            const { latitude, longitude } = ticket.parking_facility;
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
                '_blank'
            );
        }
    };

    const handleDone = () => {
        resetFlow();
        navigate('/customer/tickets');
    };

    if (isLoading || !ticket) {
        return <div className="min-h-screen flex items-center justify-center">Loading ticket...</div>;
    }

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
            <BookingProgressBar currentStep={4} />

            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Success Animation */}
                <div
                    className={`text-center mb-8 transition-all duration-700 ${showSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                        }`}
                >
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-4 animate-bounce">
                        <CheckCircle size={48} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-2">
                        Booking Confirmed!
                    </h1>
                    <p className="text-lg text-gray-600">
                        Your parking slot has been successfully reserved
                    </p>
                </div>

                {/* Ticket Card */}
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden mb-6">
                    {/* QR Code Section */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 text-center">
                        <div className="bg-white rounded-2xl p-6 inline-block mb-4">
                            <QRCodeSVG
                                value={JSON.stringify({
                                    ticketId: ticket.id,
                                    slotId: ticket.slot_id,
                                    vehicleNumber: ticket.vehicle_number,
                                })}
                                size={200}
                                level="H"
                                includeMargin
                            />
                        </div>
                        <p className="text-white text-sm font-medium">
                            Show this QR code at the entry gate
                        </p>
                    </div>

                    {/* Ticket Details */}
                    <div className="p-8 space-y-6">
                        <div className="text-center pb-6 border-b border-gray-200">
                            <p className="text-sm text-gray-500 mb-1">Ticket ID</p>
                            <p className="text-2xl font-black text-gray-900 font-mono">
                                {ticket.id.slice(0, 8).toUpperCase()}
                            </p>
                        </div>

                        {/* Facility Info */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-indigo-100 rounded-lg">
                                    <MapPin size={24} className="text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Parking Facility</p>
                                    <p className="font-bold text-gray-900">{ticket.parking_facility?.name}</p>
                                    <p className="text-sm text-gray-600">{ticket.parking_facility?.address}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Home size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Slot Number</p>
                                        <p className="font-bold text-gray-900">{ticket.parking_slot?.slot_number}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Car size={20} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Vehicle</p>
                                        <p className="font-bold text-gray-900">{ticket.vehicle_number}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <Calendar size={24} className="text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Entry Time</p>
                                    <p className="font-bold text-gray-900">{formatDateTime(ticket.entry_time)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-yellow-100 rounded-lg">
                                    <CreditCard size={24} className="text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Amount Paid</p>
                                    <p className="font-bold text-2xl text-gray-900">₹{ticket.total_fee?.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                        onClick={handleGetDirections}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all"
                    >
                        <MapPin size={20} />
                        Get Directions
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    >
                        <Download size={20} />
                        Download PDF
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    >
                        <Share2 size={20} />
                        Share Ticket
                    </button>
                    <button
                        onClick={handleDone}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
                    >
                        View My Tickets
                    </button>
                </div>

                {/* Important Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="font-bold text-blue-900 mb-3">Important Information</h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex gap-2">
                            <span>•</span>
                            <span>Please arrive within your entry time window</span>
                        </li>
                        <li className="flex gap-2">
                            <span>•</span>
                            <span>Show the QR code at the entry gate for verification</span>
                        </li>
                        <li className="flex gap-2">
                            <span>•</span>
                            <span>Overstay charges will apply if you exceed the booked duration</span>
                        </li>
                        <li className="flex gap-2">
                            <span>•</span>
                            <span>Keep your vehicle documents handy for verification</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

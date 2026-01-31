import { X, Download, MapPin, Calendar, Car, CreditCard, HelpCircle, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Ticket } from '../../../types';
import { useTicketsStore } from '../../../store/ticketsStore';

export default function TicketDetailModal() {
    const { selectedTicket, isDetailModalOpen, closeDetailModal } = useTicketsStore();

    if (!isDetailModalOpen || !selectedTicket) return null;

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            dateStyle: 'long',
            timeStyle: 'short',
        });
    };

    const handleDownloadPDF = async () => {
        try {
            const response = await fetch(`/api/customer/booking/${selectedTicket.id}/pdf`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ticket-${selectedTicket.id.slice(0, 8)}.pdf`;
            a.click();
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to download PDF');
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Parking Ticket',
                    text: `My parking ticket for ${selectedTicket.parking_facility?.name}`,
                    url: window.location.href,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={closeDetailModal}
            />

            {/* Modal */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Close Button */}
                    <button
                        onClick={closeDetailModal}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                    >
                        <X size={24} />
                    </button>

                    {/* Header with QR Code */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 text-center">
                        <div className="bg-white rounded-2xl p-6 inline-block mb-4">
                            <QRCodeSVG
                                value={JSON.stringify({
                                    ticketId: selectedTicket.id,
                                    slotId: selectedTicket.slot_id,
                                    vehicleNumber: selectedTicket.vehicle_number,
                                })}
                                size={200}
                                level="H"
                                includeMargin
                            />
                        </div>
                        <p className="text-white text-sm font-medium">
                            Show this QR code at the entry/exit gate
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        {/* Ticket ID */}
                        <div className="text-center pb-6 border-b border-gray-200">
                            <p className="text-sm text-gray-500 mb-1">Ticket ID</p>
                            <p className="text-2xl font-black text-gray-900 font-mono">
                                {selectedTicket.id.slice(0, 8).toUpperCase()}
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
                                    <p className="font-bold text-gray-900">
                                        {selectedTicket.parking_facility?.name || 'N/A'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {selectedTicket.parking_facility?.address || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Parking Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <MapPin size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Slot Number</p>
                                        <p className="font-bold text-gray-900">
                                            {selectedTicket.parking_slot?.slot_number || 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            Floor {selectedTicket.parking_slot?.floor?.floor_number || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Car size={20} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Vehicle</p>
                                        <p className="font-bold text-gray-900">{selectedTicket.vehicle_number}</p>
                                        <p className="text-xs text-gray-600 capitalize">
                                            {selectedTicket.vehicle_type.toLowerCase()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Time Details */}
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <Calendar size={24} className="text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Entry Time</p>
                                    <p className="font-bold text-gray-900">{formatDateTime(selectedTicket.entry_time)}</p>
                                    {selectedTicket.exit_time && (
                                        <>
                                            <p className="text-sm text-gray-500 mt-2">Exit Time</p>
                                            <p className="font-bold text-gray-900">
                                                {formatDateTime(selectedTicket.exit_time)}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-yellow-100 rounded-lg">
                                    <CreditCard size={24} className="text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Payment Details</p>
                                    <p className="font-bold text-2xl text-gray-900">
                                        ₹{selectedTicket.total_fee?.toFixed(2) || '0.00'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Status:{' '}
                                        <span className="font-semibold capitalize">
                                            {selectedTicket.payment_status || 'Pending'}
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Method: {selectedTicket.payment_method || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Entry/Exit Gate Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <HelpCircle size={18} />
                                Gate Information
                            </h4>
                            <ul className="space-y-1 text-sm text-blue-800">
                                <li>• Show QR code at the entry gate for verification</li>
                                <li>• Keep this ticket accessible during your parking duration</li>
                                <li>• Present QR code again at exit for gate opening</li>
                                <li>• Contact support if you face any issues</li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleDownloadPDF}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all"
                            >
                                <Download size={20} />
                                Download PDF
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all"
                            >
                                <Share2 size={20} />
                                Share Ticket
                            </button>
                        </div>

                        {/* Support Button */}
                        <button className="w-full py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                            <HelpCircle size={20} />
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

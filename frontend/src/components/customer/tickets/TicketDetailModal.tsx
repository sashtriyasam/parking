import { X, Download, MapPin, Calendar, Car, CreditCard, HelpCircle, Share2, Info, Navigation, IndianRupee, Clock, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTicketsStore } from '../../../store/ticketsStore';

export default function TicketDetailModal() {
    const { selectedTicket, isDetailModalOpen, closeDetailModal } = useTicketsStore();

    if (!isDetailModalOpen || !selectedTicket) return null;

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDownloadPDF = async () => {
        // Implementation here...
        console.log('Downloading PDF for', selectedTicket.id);
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
        }
    };

    const facility = selectedTicket.parking_facility || selectedTicket.slot?.floor?.facility;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500"
                onClick={closeDetailModal}
            />

            {/* Modal Container */}
            <div className="relative bg-[#fafafa] w-full max-w-xl rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 z-10 p-8 flex items-center justify-between bg-white border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <Info size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-none mb-1">Pass Details</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{selectedTicket.status}</p>
                        </div>
                    </div>
                    <button
                        onClick={closeDetailModal}
                        className="p-4 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    {/* The Visual Ticket */}
                    <div className="bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                        <div className="p-10 text-center border-b-4 border-dashed border-gray-100 relative">
                            {/* Cutouts */}
                            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-[#fafafa] rounded-full border border-gray-100" />
                            <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-[#fafafa] rounded-full border border-gray-100" />

                            <div className="bg-gray-50 p-6 rounded-[32px] inline-block shadow-inner mb-6 border-2 border-white">
                                <QRCodeSVG
                                    value={`PARK-${selectedTicket.id}`}
                                    size={180}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>
                            <p className="text-xs font-black text-gray-400 font-mono tracking-widest">{selectedTicket.id.toUpperCase()}</p>
                        </div>

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
                                        {selectedTicket.parking_slot?.slot_number}
                                    </p>
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase">Floor {selectedTicket.parking_slot?.floor?.floor_number}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Vehicle</p>
                                    <p className="text-xl font-black text-gray-900 tracking-widest">{selectedTicket.vehicle_number}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{selectedTicket.vehicle_type}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Entry Time</p>
                                    <p className="text-sm font-black text-gray-800 flex items-center gap-2">
                                        <Clock size={14} className="text-gray-400" />
                                        {formatDateTime(selectedTicket.entry_time)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Billing Status</p>
                                    <p className="text-sm font-black text-indigo-600 flex items-center gap-1">
                                        <IndianRupee size={14} className="stroke-[3]" />
                                        {selectedTicket.total_fee || '0'}.00
                                        <span className={`ml-2 text-[8px] px-2 py-0.5 rounded-full ${selectedTicket.payment_status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                            {selectedTicket.payment_status || 'PENDING'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Details */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Utility & Support</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="p-6 bg-white border border-gray-100 rounded-3xl flex flex-col items-center gap-3 hover:border-indigo-200 transition-all group">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Navigation size={24} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Directions</span>
                            </button>
                            <button className="p-6 bg-white border border-gray-100 rounded-3xl flex flex-col items-center gap-3 hover:border-indigo-200 transition-all group">
                                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Smartphone size={24} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Share Pass</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-indigo-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-6">
                            <HelpCircle size={40} className="text-indigo-400 shrink-0" />
                            <div>
                                <h4 className="font-black text-lg">Need Assistance?</h4>
                                <p className="text-indigo-200 text-sm font-bold">Show the QR code to the ground staff if the gate doesn't open automatically.</p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-12 translate-x-16" />
                    </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="p-8 bg-white border-t border-gray-100 flex gap-4">
                    <button
                        onClick={handleDownloadPDF}
                        className="flex-1 py-5 bg-gray-50 text-gray-500 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                    >
                        <Download size={18} /> Download
                    </button>
                    <button
                        className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-102 transition-all flex items-center justify-center gap-2"
                    >
                        Contact Facility Support
                    </button>
                </div>
            </div>
        </div>
    );
}

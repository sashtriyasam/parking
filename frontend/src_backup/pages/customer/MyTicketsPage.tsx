import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ticket as TicketIcon, Search, ChevronLeft, Filter, Calendar, Zap, StopCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTicketsStore } from '../../store/ticketsStore';
import { customerService } from '../../services/customer.service';
import TicketCard from '../../components/customer/tickets/TicketCard';
import TicketDetailModal from '../../components/customer/tickets/TicketDetailModal';
import ExtendParkingModal from '../../components/customer/tickets/ExtendParkingModal';

export default function MyTicketsPage() {
    const { activeTab, setActiveTab, openExtendModal } = useTicketsStore();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Fetch tickets based on active tab
    const { data: tickets, isLoading } = useQuery({
        queryKey: ['tickets', activeTab],
        queryFn: async () => {
            switch (activeTab) {
                case 'active':
                    return customerService.getActiveTickets();
                case 'upcoming':
                    // Uses getActiveTickets but frontend will need to filter or backend should split
                    // For now, let's assume getActiveTickets returns everything non-completed/non-cancelled
                    // and we filter here, or we add a new endpoint.
                    // Given the backend implementation in ticket.controller.js, getActiveTickets returns status='ACTIVE'.
                    // We might need to split by start time.
                    // For now, fetching same as active, filtering in UI or assuming separate endpoint later.
                    // Actually, let's use getTicketHistory for 'cancelled' and 'past'
                    return customerService.getActiveTickets(); // Placeholder for upcoming until backend split
                case 'past':
                    const historyResponse = await customerService.getTicketHistory(1, 100);
                    return historyResponse.data.filter((t: any) => t.status === 'COMPLETED');
                case 'cancelled':
                    const cancelledResponse = await customerService.getTicketHistory(1, 100);
                    return cancelledResponse.data.filter((t: any) => t.status === 'CANCELLED');
                default:
                    return [];
            }
        },
    });

    // End parking mutation
    const endParkingMutation = useMutation({
        mutationFn: async (ticketId: string) => {
            return customerService.endParking(ticketId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });

    const handleGetDirections = (ticket: any) => {
        const facility = ticket.facility || ticket.slot?.floor?.facility;
        if (facility?.latitude && facility?.longitude) {
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`,
                '_blank'
            );
        }
    };

    const tabs = [
        { id: 'active' as const, label: 'Running', icon: Zap },
        { id: 'upcoming' as const, label: 'Upcoming', icon: Calendar },
        { id: 'past' as const, label: 'History', icon: TicketIcon },
        { id: 'cancelled' as const, label: 'Cancelled', icon: StopCircle },
    ];

    return (
        <div className="min-h-screen bg-transparent pb-20">
            {/* Styled Tabs (Stay as they are relevant for sub-navigation) */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 overflow-x-auto scroller-hidden">
                    <div className="flex gap-2 py-4">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap
                                        ${isActive
                                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                                            : 'bg-white text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'}
                                    `}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                    {isActive && <div className="ml-2 w-2 h-2 bg-indigo-300 rounded-full animate-pulse" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-96 bg-white rounded-[40px] animate-pulse border border-gray-100" />
                        ))}
                    </div>
                ) : tickets && tickets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tickets.map((ticket: any) => (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                type={activeTab}
                                onExtend={(ticket) => openExtendModal(ticket)}
                                onEnd={(ticket) => {
                                    if (confirm('End session?')) endParkingMutation.mutate(ticket.id);
                                }}
                                onGetDirections={handleGetDirections}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
                        <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center text-indigo-100 shadow-xl border border-gray-100 mb-8">
                            <TicketIcon size={64} strokeWidth={1} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">No {activeTab} instances found</h3>
                        <p className="text-sm font-bold text-gray-400 max-w-xs mx-auto leading-relaxed uppercase tracking-wider">
                            You don't have any sessions in this category at the moment.
                        </p>
                        <button
                            onClick={() => navigate('/customer/search')}
                            className="mt-10 px-10 py-5 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 transition-all"
                        >
                            Find New Spot
                        </button>
                    </div>
                )}
            </main>

            {/* Modals */}
            <TicketDetailModal />
            <ExtendParkingModal />
        </div>
    );
}

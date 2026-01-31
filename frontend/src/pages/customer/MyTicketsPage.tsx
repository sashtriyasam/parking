import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ticket } from 'lucide-react';
import { useTicketsStore } from '../../store/ticketsStore';
import { customerService } from '../../services/customer.service';
import TicketCard from '../../components/customer/tickets/TicketCard';
import TicketDetailModal from '../../components/customer/tickets/TicketDetailModal';
import ExtendParkingModal from '../../components/customer/tickets/ExtendParkingModal';

export default function MyTicketsPage() {
    const { activeTab, setActiveTab, openExtendModal } = useTicketsStore();
    const queryClient = useQueryClient();

    // Fetch tickets based on active tab
    const { data: tickets, isLoading } = useQuery({
        queryKey: ['tickets', activeTab],
        queryFn: async () => {
            switch (activeTab) {
                case 'active':
                    return customerService.getActiveTickets();
                case 'upcoming':
                    // For now, return empty array - will implement upcoming logic
                    return [];
                case 'past':
                    const historyResponse = await customerService.getTicketHistory();
                    return historyResponse.data || [];
                case 'cancelled':
                    // For now, return empty array - will implement cancelled logic
                    return [];
                default:
                    return [];
            }
        },
    });

    // End parking mutation
    const endParkingMutation = useMutation({
        mutationFn: async (ticketId: string) => {
            // This should call an end parking endpoint
            return customerService.extendTicket(ticketId, 0); // Placeholder
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            alert('Parking session ended successfully!');
        },
        onError: (error) => {
            console.error('Error ending parking:', error);
            alert('Failed to end parking. Please try again.');
        },
    });

    const handleGetDirections = (ticket: any) => {
        if (ticket.parking_facility) {
            const { latitude, longitude } = ticket.parking_facility;
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
                '_blank'
            );
        }
    };

    const tabs = [
        { id: 'active' as const, label: 'Active', count: tickets?.length || 0 },
        { id: 'upcoming' as const, label: 'Upcoming', count: 0 },
        { id: 'past' as const, label: 'Past', count: 0 },
        { id: 'cancelled' as const, label: 'Cancelled', count: 0 },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <Ticket size={32} />
                        My Tickets
                    </h1>
                    <p className="text-gray-600 mt-1">Manage your parking bookings</p>
                </div>

                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 font-semibold whitespace-nowrap transition-all relative ${activeTab === tab.id
                                    ? 'text-indigo-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span
                                        className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id
                                            ? 'bg-indigo-100 text-indigo-600'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        {tab.count}
                                    </span>
                                )}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : tickets && tickets.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tickets.map((ticket: any) => (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                type={activeTab}
                                onExtend={(ticket) => openExtendModal(ticket)}
                                onEnd={(ticket) => endParkingMutation.mutate(ticket.id)}
                                onGetDirections={handleGetDirections}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                            <Ticket size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            No {activeTab} bookings
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {activeTab === 'active'
                                ? "You don't have any active parking sessions"
                                : activeTab === 'upcoming'
                                    ? "You don't have any upcoming bookings"
                                    : activeTab === 'past'
                                        ? "You haven't completed any bookings yet"
                                        : "You don't have any cancelled bookings"}
                        </p>
                        <button
                            onClick={() => (window.location.href = '/customer/search')}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg"
                        >
                            Find Parking
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            <TicketDetailModal />
            <ExtendParkingModal />
        </div>
    );
}

import { useState } from 'react';
import { X, Clock, CreditCard } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTicketsStore } from '../../../store/ticketsStore';
import { customerService } from '../../../services/customer.service';

export default function ExtendParkingModal() {
    const { selectedTicket, isExtendModalOpen, closeExtendModal } = useTicketsStore();
    const [additionalHours, setAdditionalHours] = useState(1);
    const queryClient = useQueryClient();

    const extendMutation = useMutation({
        mutationFn: async () => {
            if (!selectedTicket) throw new Error('No ticket selected');
            return customerService.extendTicket(selectedTicket.id, additionalHours);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            closeExtendModal();
            alert('Parking extended successfully!');
        },
        onError: (error) => {
            console.error('Error extending parking:', error);
            alert('Failed to extend parking. Please try again.');
        },
    });

    if (!isExtendModalOpen || !selectedTicket) return null;

    // Calculate additional cost (simplified - should match backend logic)
    const hourlyRate = 50; // This should come from pricing rule
    const baseCost = additionalHours * hourlyRate;
    const gst = baseCost * 0.18;
    const totalCost = baseCost + gst;

    const handleExtend = () => {
        if (confirm(`Extend parking by ${additionalHours} hour(s) for ₹${totalCost.toFixed(2)}?`)) {
            extendMutation.mutate();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={closeExtendModal}
            />

            {/* Modal */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
                    {/* Close Button */}
                    <button
                        onClick={closeExtendModal}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            <Clock size={28} />
                            Extend Parking
                        </h2>
                        <p className="text-indigo-100 text-sm mt-1">
                            Add more time to your parking session
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Current Booking Info */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-sm text-gray-600 mb-2">Current Booking</p>
                            <p className="font-bold text-gray-900">{selectedTicket.parking_facility?.name}</p>
                            <p className="text-sm text-gray-600">
                                Slot: {selectedTicket.parking_slot?.slot_number} | Vehicle: {selectedTicket.vehicle_number}
                            </p>
                        </div>

                        {/* Hours Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Additional Hours
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4, 6, 8, 12, 24].map((hours) => (
                                    <button
                                        key={hours}
                                        onClick={() => setAdditionalHours(hours)}
                                        className={`py-3 px-4 rounded-xl font-semibold transition-all ${additionalHours === hours
                                                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {hours}h
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cost Breakdown */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-4 space-y-2">
                            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <CreditCard size={18} />
                                Cost Breakdown
                            </h4>

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                    Base Fee ({additionalHours}h × ₹{hourlyRate})
                                </span>
                                <span className="font-medium text-gray-900">₹{baseCost.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-700">GST (18%)</span>
                                <span className="font-medium text-gray-900">₹{gst.toFixed(2)}</span>
                            </div>

                            <div className="pt-2 border-t-2 border-indigo-300 flex justify-between">
                                <span className="font-bold text-gray-900">Total Amount</span>
                                <span className="font-black text-xl text-indigo-600">₹{totalCost.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Method
                            </label>
                            <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-900">Saved Card</p>
                                    <p className="text-sm text-gray-600">•••• •••• •••• 1234</p>
                                </div>
                                <button className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold">
                                    Change
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={closeExtendModal}
                                className="flex-1 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-semibold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExtend}
                                disabled={extendMutation.isPending}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all shadow-lg"
                            >
                                {extendMutation.isPending ? 'Processing...' : `Pay ₹${totalCost.toFixed(2)}`}
                            </button>
                        </div>

                        {/* Info */}
                        <p className="text-xs text-center text-gray-500">
                            Your parking will be extended immediately after payment
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

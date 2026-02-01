import { useState } from 'react';
import { X, Clock, IndianRupee, CreditCard, ChevronRight, Zap, ShieldCheck } from 'lucide-react';
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
            // Show custom success toast or alert
        },
        onError: (error) => {
            console.error('Error extending parking:', error);
        },
    });

    if (!isExtendModalOpen || !selectedTicket) return null;

    const hourlyRate = 50;
    const baseCost = additionalHours * hourlyRate;
    const gst = baseCost * 0.18;
    const totalCost = baseCost + gst;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500"
                onClick={closeExtendModal}
            />

            {/* Modal Container */}
            <div className="relative bg-[#fafafa] w-full max-w-lg rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="p-8 flex items-center justify-between bg-white border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm transition-transform hover:scale-110">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-none mb-1">Extend Session</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Adding time to your spot</p>
                        </div>
                    </div>
                    <button
                        onClick={closeExtendModal}
                        className="p-4 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-10 overflow-y-auto">
                    {/* Hour Selector */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">How many more hours?</h4>
                        <div className="grid grid-cols-4 gap-3">
                            {[1, 2, 4, 8].map((h) => (
                                <button
                                    key={h}
                                    onClick={() => setAdditionalHours(h)}
                                    className={`
                                        h-20 rounded-[28px] border-2 flex flex-col items-center justify-center transition-all
                                        ${additionalHours === h ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200'}
                                    `}
                                >
                                    <span className="text-lg font-black">{h}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">Hours</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm space-y-8">
                        <div>
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Price Summary</h4>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-lg font-bold text-gray-600">
                                <span>Extension ({additionalHours}h)</span>
                                <div className="flex items-center gap-1">
                                    <IndianRupee size={16} />
                                    <span>{baseCost}.00</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold text-gray-600">
                                <span>GST (18%)</span>
                                <div className="flex items-center gap-1">
                                    <IndianRupee size={16} />
                                    <span>{gst.toFixed(0)}.00</span>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-dashed border-gray-200 flex justify-between items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Add-on</span>
                                <div className="flex items-center gap-1 text-3xl font-black text-indigo-600">
                                    <IndianRupee size={24} className="stroke-[3]" />
                                    <span>{totalCost.toFixed(0)}.00</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Link */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Payment Method</h4>
                        <div className="p-6 bg-white border border-gray-100 rounded-[32px] flex items-center justify-between group hover:border-indigo-200 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                                    <CreditCard size={24} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-black text-gray-900 leading-none mb-1">Saved Visa Card</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ending in 4242</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="p-8 bg-white border-t border-gray-100">
                    <button
                        onClick={() => extendMutation.mutate()}
                        disabled={extendMutation.isPending}
                        className={`
                            w-full py-6 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3
                            ${extendMutation.isPending ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 hover:scale-102'}
                        `}
                    >
                        {extendMutation.isPending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>Authorize Extension <Zap size={20} /></>
                        )}
                    </button>
                    <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <ShieldCheck size={12} className="text-green-500" />
                        Secure One-Click Payment
                    </div>
                </div>
            </div>
        </div>
    );
}

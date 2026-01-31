import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Plus } from 'lucide-react';
import { customerService } from '../../services/customer.service';
import PassCard from '../../components/customer/passes/PassCard';
import PurchasePassModal from '../../components/customer/passes/PurchasePassModal';

export default function MyPassesPage() {
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

    const { data: passes, isLoading } = useQuery({
        queryKey: ['passes'],
        queryFn: () => customerService.getMyPasses(),
    });

    const handleUsePass = (pass: any) => {
        alert(`Using pass: ${pass.id}\nShow the QR code at the facility entrance.`);
    };

    const handlePurchasePass = (duration: number, vehicleType: string) => {
        alert(`Purchasing ${duration} month pass for ${vehicleType}`);
        // This would call the purchase API
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                                <CreditCard size={32} />
                                My Passes
                            </h1>
                            <p className="text-gray-600 mt-1">Manage your monthly parking passes</p>
                        </div>
                        <button
                            onClick={() => setIsPurchaseModalOpen(true)}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Purchase New Pass
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : passes && passes.length > 0 ? (
                    <>
                        {/* Active Passes */}
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Active Passes</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {passes.map((pass: any) => (
                                    <PassCard key={pass.id} pass={pass} onUse={handleUsePass} />
                                ))}
                            </div>
                        </div>

                        {/* Benefits Section */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-8">
                            <h3 className="text-2xl font-black text-gray-900 mb-4">
                                Why Choose Monthly Passes?
                            </h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <div className="text-4xl mb-2">💰</div>
                                    <h4 className="font-bold text-gray-900 mb-1">Save Money</h4>
                                    <p className="text-sm text-gray-600">
                                        Save up to 20% compared to daily parking rates
                                    </p>
                                </div>
                                <div>
                                    <div className="text-4xl mb-2">⚡</div>
                                    <h4 className="font-bold text-gray-900 mb-1">Instant Access</h4>
                                    <p className="text-sm text-gray-600">
                                        Skip the booking process, just show your pass
                                    </p>
                                </div>
                                <div>
                                    <div className="text-4xl mb-2">🎯</div>
                                    <h4 className="font-bold text-gray-900 mb-1">Guaranteed Spot</h4>
                                    <p className="text-sm text-gray-600">
                                        Reserved parking spot available 24/7
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                            <CreditCard size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Passes</h3>
                        <p className="text-gray-600 mb-6">
                            Purchase a monthly pass and save on parking costs
                        </p>
                        <button
                            onClick={() => setIsPurchaseModalOpen(true)}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg"
                        >
                            Purchase Your First Pass
                        </button>
                    </div>
                )}
            </div>

            {/* Purchase Modal */}
            <PurchasePassModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
                onPurchase={handlePurchasePass}
            />
        </div>
    );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, ChevronLeft, Zap, ShieldCheck, IndianRupee, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customer.service';
import PassCard from '../../components/customer/passes/PassCard';
import PurchasePassModal from '../../components/customer/passes/PurchasePassModal';

export default function MyPassesPage() {
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: passes, isLoading } = useQuery({
        queryKey: ['passes'],
        queryFn: () => customerService.getMyPasses(),
    });

    const purchaseMutation = useMutation({
        mutationFn: async ({ vehicleType }: { duration: number, vehicleType: any }) => {
            // Fetch facilities with default coordinates to get a valid facility_id
            const facilities = await customerService.searchParking({
                latitude: 19.0760, // Default to Mumbai
                longitude: 72.8777,
                radius: 50
            });

            if (!facilities || facilities.length === 0) throw new Error('No facilities available');
            return customerService.purchasePass(facilities[0].id, vehicleType);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['passes'] });
            setIsPurchaseModalOpen(false);
            alert('Membership activated successfully!');
        },

        onError: (err) => {
            alert('Failed to purchase pass. Please try again.');
            console.error(err);
        }
    });

    const handleUsePass = (pass: any) => {
        // Show pass usage modal or QR
        // console.log('Using pass', pass.id);
        navigate(`/customer/tickets/${pass.id}`); // Or a specific pass view
    };

    const handlePurchasePass = (duration: number, vehicleType: string) => {
        purchaseMutation.mutate({ duration, vehicleType });
    };

    return (
        <div className="min-h-screen bg-[#fafafa] pb-20">
            {/* Premium Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/customer/search')}
                            className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-indigo-600 transition-all"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">My Passes</h1>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Premium Parking Memberships</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsPurchaseModalOpen(true)}
                        className="px-8 py-5 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-3"
                    >
                        <Plus size={18} /> Purchase Pass
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-80 bg-white rounded-[40px] animate-pulse border border-gray-100" />
                        ))}
                    </div>
                ) : passes && passes.length > 0 ? (
                    <div className="space-y-12">
                        {/* Active Passes Section */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-gray-100">
                                    <Zap size={24} />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Active Memberships</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {passes.map((pass: any) => (
                                    <PassCard key={pass.id} pass={pass} onUse={handleUsePass} />
                                ))}
                            </div>
                        </section>

                        {/* Benefits / Marketing Section */}
                        <section className="bg-[#111827] rounded-[48px] p-12 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600 skew-x-12 translate-x-32" />
                            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6">
                                    <span className="px-4 py-1.5 bg-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest">Member Benefits</span>
                                    <h3 className="text-4xl font-black leading-tight">Elevate Your Parking Experience</h3>
                                    <p className="text-indigo-200 font-bold leading-relaxed">Monthly passes offer more than just savings. Enjoy prioritized access, dedicated spots, and seamless entry-exit at all our premium facilities.</p>
                                    <div className="flex flex-col gap-4">
                                        {[
                                            { icon: IndianRupee, label: 'Save up to 40% on daily rates' },
                                            { icon: ShieldCheck, label: 'Guaranteed spot even during peak hours' },
                                            { icon: Zap, label: 'One-tap entry with NFC/QR integration' }
                                        ].map((benefit, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400">
                                                    <benefit.icon size={16} />
                                                </div>
                                                <span className="text-sm font-bold text-gray-300">{benefit.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-[40px] p-10 border border-white/10 text-center">
                                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                        <Info size={40} />
                                    </div>
                                    <h4 className="text-xl font-black mb-2">Corporate Solutions</h4>
                                    <p className="text-indigo-200 text-sm font-bold mb-8">Need passes for your entire team? Contact our business desk for custom pricing and fleet management.</p>
                                    <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all">Get in Touch</button>
                                </div>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
                        <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center text-indigo-100 shadow-xl border border-gray-100 mb-8">
                            <CreditCard size={64} strokeWidth={1} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">No Active Memberships</h3>
                        <p className="text-sm font-bold text-gray-400 max-w-xs mx-auto leading-relaxed uppercase tracking-wider">
                            You haven't purchased any monthly passes yet. Start saving today with our premium memberships.
                        </p>
                        <button
                            onClick={() => setIsPurchaseModalOpen(true)}
                            className="mt-10 px-10 py-5 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 transition-all"
                        >
                            Explore Plans
                        </button>
                    </div>
                )}
            </main>

            {/* Modals */}
            <PurchasePassModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
                onPurchase={handlePurchasePass}
            />
        </div>
    );
}

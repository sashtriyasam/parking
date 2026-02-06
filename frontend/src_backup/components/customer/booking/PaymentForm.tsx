import { useState } from 'react';
import { CreditCard, IndianRupee, ShieldCheck, Lock, Smartphone, Wallet, Landmark, Check } from 'lucide-react';
import type { PaymentMethod } from '../../../store/bookingFlowStore';

interface PaymentFormProps {
    totalAmount: number;
    onPaymentSuccess: (method: PaymentMethod, details: any) => void;
    isLoading: boolean;
}

export function PaymentForm({ totalAmount, onPaymentSuccess, isLoading }: PaymentFormProps) {
    const [method, setMethod] = useState<PaymentMethod>('CARD');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [upiId, setUpiId] = useState('');

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock success
        const details = method === 'CARD' ? { last4: cardNumber.slice(-4) } : { upiId };
        onPaymentSuccess(method, details);
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Amount Header */}
            <div className="bg-indigo-600 rounded-[32px] p-8 text-white flex items-center justify-between shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-1">Payable Now</p>
                    <div className="flex items-center gap-2 text-4xl font-black">
                        <IndianRupee size={28} className="stroke-[3]" />
                        <span>{totalAmount}.00</span>
                    </div>
                </div>
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center relative z-10 border border-white/10">
                    <ShieldCheck size={32} />
                </div>
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-12 translate-x-16" />
            </div>

            {/* Payment Methods */}
            <div className="space-y-6">
                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Select Payment Method</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { id: 'CARD', icon: CreditCard, label: 'Card' },
                        { id: 'UPI', icon: Smartphone, label: 'UPI' },
                        { id: 'WALLET', icon: Wallet, label: 'Wallet' },
                        { id: 'PAY_AT_EXIT', icon: Landmark, label: 'Exit Pay' },
                    ].map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => setMethod(m.id as PaymentMethod)}
                            className={`
                                p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-3
                                ${method === m.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200'}
                            `}
                        >
                            <m.icon size={24} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Dynamic Forms */}
            <div className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-sm min-h-[400px]">
                <form onSubmit={handlePayment} className="space-y-8">
                    {method === 'CARD' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Card Number</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="0000 0000 0000 0000"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        className="w-full h-16 px-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-lg font-bold tracking-widest focus:bg-white focus:border-indigo-600 transition-all outline-none"
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 flex gap-2">
                                        <div className="w-10 h-6 bg-gray-200 rounded" />
                                        <div className="w-10 h-6 bg-gray-100 rounded" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Expiry Date</label>
                                    <input
                                        type="text"
                                        placeholder="MM / YY"
                                        value={expiry}
                                        onChange={(e) => setExpiry(e.target.value)}
                                        className="w-full h-16 px-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-lg font-bold focus:bg-white focus:border-indigo-600 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">CVV Code</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            placeholder="***"
                                            maxLength={3}
                                            value={cvv}
                                            onChange={(e) => setCvv(e.target.value)}
                                            className="w-full h-16 px-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-lg font-bold focus:bg-white focus:border-indigo-600 transition-all outline-none"
                                        />
                                        <Lock size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {method === 'UPI' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">UPI ID (VPA)</label>
                                <input
                                    type="text"
                                    placeholder="username@bank"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    className="w-full h-16 px-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-lg font-bold focus:bg-white focus:border-indigo-600 transition-all outline-none"
                                />
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(u => (
                                    <div key={u} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 uppercase">{u}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {method === 'PAY_AT_EXIT' && (
                        <div className="space-y-6 animate-in fade-in duration-300 py-10 text-center">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                                <Landmark size={40} />
                            </div>
                            <h5 className="text-xl font-black text-gray-900">Pay on Check-out</h5>
                            <p className="text-sm font-bold text-gray-500 max-w-xs mx-auto">
                                You can pay directly at the facility counter or exit gate using any supported method.
                            </p>
                        </div>
                    )}

                    {/* Bottom Sticky Button in Form Card */}
                    <div className="pt-10">
                        <button
                            disabled={isLoading}
                            type="submit"
                            className={`
                                w-full py-6 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3
                                ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 hover:scale-102'}
                            `}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>Secure Payment <Check size={20} /></>
                            )}
                        </button>
                        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <Lock size={12} className="text-green-500" />
                            PCI-DSS Compliant Gateway
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

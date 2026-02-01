import { CreditCard, Plus, Trash2, ShieldCheck, Zap, Lock, MoreVertical } from 'lucide-react';

export default function PaymentMethodsList() {
    // Mock data - would be fetched from API
    const paymentMethods = [
        { id: '1', type: 'card', last4: '4242', brand: 'Visa', expiry: '12/28', is_default: true, color: 'from-indigo-600 to-indigo-900' },
        { id: '2', type: 'card', last4: '8899', brand: 'Mastercard', expiry: '05/26', is_default: false, color: 'from-slate-700 to-slate-900' },
    ];

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black text-gray-900">Wallet & Vault</h3>
                    <p className="text-sm font-bold text-gray-400">Securely manage your preferred payment sources.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                    <Plus size={16} /> Link New Card
                </button>
            </div>

            {/* Visual Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {paymentMethods.map((method) => (
                    <div
                        key={method.id}
                        className={`
                            relative aspect-[1.586/1] rounded-[32px] p-8 text-white overflow-hidden shadow-2xl transition-all hover:scale-102 cursor-pointer
                            bg-gradient-to-br ${method.color}
                        `}
                    >
                        {/* Chip & Logo */}
                        <div className="flex justify-between items-start mb-12">
                            <div className="w-12 h-10 bg-yellow-400/80 rounded-lg shadow-inner flex flex-col justify-center px-1.5 gap-1">
                                <div className="h-px bg-black/20 w-full" />
                                <div className="h-px bg-black/20 w-full" />
                                <div className="h-px bg-black/20 w-full" />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xl font-black italic tracking-tighter">{method.brand}</span>
                                <p className="text-[8px] font-black uppercase tracking-widest text-white/50">Platinum</p>
                            </div>
                        </div>

                        {/* Card Number */}
                        <div className="mb-8">
                            <p className="text-2xl font-bold tracking-[0.2em] flex items-center gap-4">
                                <span>••••</span>
                                <span>••••</span>
                                <span>••••</span>
                                <span>{method.last4}</span>
                            </p>
                        </div>

                        {/* Footer details */}
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Card Holder</p>
                                <p className="text-xs font-black uppercase tracking-widest">Premium Member</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Expires</p>
                                <p className="text-xs font-black tracking-widest">{method.expiry}</p>
                            </div>
                        </div>

                        {/* Badge if default */}
                        {method.is_default && (
                            <div className="absolute top-0 right-12 bg-indigo-400 px-4 py-1.5 rounded-b-xl text-[8px] font-black uppercase tracking-widest shadow-xl">
                                Primary Source
                            </div>
                        )}

                        {/* Action Dots */}
                        <button className="absolute bottom-8 right-4 p-2 hover:bg-white/10 rounded-full transition-all">
                            <MoreVertical size={20} />
                        </button>

                        {/* Decorative Patterns */}
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-400/5 rounded-full blur-3xl" />
                    </div>
                ))}

                {/* Add New Placeholder */}
                <button className="aspect-[1.586/1] border-4 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center gap-4 text-gray-300 hover:border-indigo-100 hover:bg-indigo-50/30 hover:text-indigo-600 transition-all group">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                        <Plus size={32} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add New Source</span>
                </button>
            </div>

            {/* Security Notice */}
            <div className="bg-[#111827] rounded-[40px] p-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h4 className="text-lg font-black leading-none mb-2">Military Grade Encryption</h4>
                        <p className="text-gray-400 text-sm font-bold leading-relaxed max-w-xl">
                            We use industry-standard PCI-DSS compliant encryption to protect your data. We never store CVV or full card numbers on our infrastructure.
                        </p>
                    </div>
                    <div className="hidden lg:flex flex-col items-end flex-1 gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                            <Lock size={12} /> SECURED BY STRIPE
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                            <Zap size={12} /> 256-BIT SSL
                        </div>
                    </div>
                </div>
                {/* Background zap */}
                <div className="absolute top-0 right-0 h-full w-1/3 bg-indigo-600/10 skew-x-12 translate-x-16" />
            </div>

            <div className="flex items-center justify-between px-4 pt-4">
                <button className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-xl transition-all">
                    <Trash2 size={16} /> Wipe Saved Sources
                </button>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vault Version 2.0.4-b</p>
            </div>
        </div>
    );
}
